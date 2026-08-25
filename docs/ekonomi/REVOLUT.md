# Revolut Business — en anslutning som sköter sig själv

Ekonomi äger bankkopplingen. Den här filen är driftdokumentet: vad som är
konfigurerat, vad ägaren gör en gång, och vad systemet gör därefter.

Revolut Business API är **inte** Pixdrift Identity. Två skilda flöden:

| Flöde                  | Callback                                  |
| ---------------------- | ----------------------------------------- |
| Pixdrift-inloggning    | `/api/auth/callback`                      |
| Revolut Business OAuth | `/api/integrations/revolut/callback`       |

## Permanent omdirigerings-URI

```
https://kansli.vercel.app/api/integrations/revolut/callback
```

Den registreras hos Revolut och får aldrig ändras. Därför läses den bara från
`REVOLUT_REDIRECT_URI` — aldrig från `Host`, `Origin`, `VERCEL_URL` eller
request-URL:en. En produktionsstart utan pinnad URI vägrar starta
(`assertProductionRevolutConfig`), just för att en preview-hostname annars
skulle göra det registrerade certifikatet obrukbart.

`pixdrift.com` pekar i dag inte på den här appen (ingen A-post). Om domänen
läggs på Vercel-projektet senare: registrera den nya URI:n hos Revolut **först**,
byt `REVOLUT_REDIRECT_URI` **sedan**.

## Miljövariabler

| Variabel                          | Roll                                                            |
| --------------------------------- | --------------------------------------------------------------- |
| `REVOLUT_ENVIRONMENT`             | `sandbox` eller `production`. Måste vara satt för att ansluta.   |
| `REVOLUT_CLIENT_ID`               | Utfärdas av Revolut efter att certifikatet laddats upp.          |
| `REVOLUT_PRIVATE_KEY`             | PKCS#8 PEM. Hemlig. Escapade `\n` normaliseras vid inläsning.    |
| `REVOLUT_REDIRECT_URI`            | Den permanenta callbacken ovan.                                 |
| `REVOLUT_CERTIFICATE_FINGERPRINT` | SHA-256, för att kunna se vilket certifikat som gäller.          |
| `REVOLUT_CERTIFICATE_CREATED_AT`  | ISO-datum.                                                      |
| `REVOLUT_CERTIFICATE_EXPIRES_AT`  | ISO-datum. Driver varningen om certifikatbyte.                   |
| `REVOLUT_CERTIFICATE_WARN_DAYS`   | Default 30.                                                     |
| `EKONOMI_WRAP_KEY`                | Krypterar tokenarna i databasen.                                |

Saknas `REVOLUT_CLIENT_ID` blir tillståndet `NOT_CONFIGURED`. Resten av appen
fungerar som vanligt — den kraschar inte för att banken inte är kopplad än.

Sandbox och produktion har egna rader i databasen (`unique (org_ref, provider,
environment)`), egna endpoints och egna secrets. En preview-deployment får inte
produktionens `REVOLUT_PRIVATE_KEY`, och utan privatnyckel kan den varken byta
kod mot token eller förnya någon.

## Certifikat

```
bash scripts/revolut/generate-certificate.sh
```

RSA 2048, SHA-256, självsignerat X.509 — det Revolut använder i sin egen guide.
Skriptet lägger nyckeln i `.secrets/revolut/` (gitignorerat), skriver ut det
publika certifikatet och certifikatets metadata, men **aldrig** privatnyckeln.
Vägrar skriva över en befintlig nyckel.

Revolut dokumenterar ingen överlappande certifikatrotation. Bytet är därför:
generera nytt par → ladda upp det nya certifikatet i Revolut → sätt den nya
`REVOLUT_PRIVATE_KEY` och metadata → deploya → tryck **Anslut om**. Varningen
kommer 30 dagar i förväg så det kan göras planerat.

## Så fungerar tokenlivscykeln

1. Ägaren trycker **Anslut** i `/ekonomi/anslutningar/revolut`.
2. `GET /api/integrations/revolut/connect` kräver session och `invoice:approve`,
   skapar ett engångs-`state` bundet till org, användare och redirect-URI, och
   skickar vidare till Revoluts samtyckessida.
3. Revolut skickar tillbaka en kortlivad kod till callbacken. Servern byter den
   **direkt** mot access- och refresh-token. Ingen människa ser en kod.
4. Access-tokenen lever 40 minuter. `RevolutTokenManager` förnyar den fem
   minuter innan utgång, med serverns klocka.
5. Förnyelsen tar ett advisory lock (`pg_try_advisory_xact_lock`) per
   org + miljö och läser om raden innan den förnyar. Tjugo samtidiga anrop ger
   en förnyelse; de andra använder resultatet.
6. Roterar Revolut refresh-tokenen skrivs nya access-token, ny utgång och ny
   refresh-token i samma statement. Halvt uppdaterat tillstånd finns inte.
7. Svarar Revolut 401 på en token vi trodde var giltig: en förnyelse, ett nytt
   försök, sen stopp. Aldrig en loop.
8. Bara en död behörighet — `invalid_grant` på refresh, indraget samtycke —
   sätter `action_required`. Då, och bara då, ber UI:t om **Anslut om**.

## Tillstånd

`not_configured`, `pending_authorization`, `active`, `action_required`,
`revoked`, `error` lagras. `refreshing` lagras aldrig: den härleds ur att låset
hålls, så en kraschad process kan inte låsa raden för alltid.

## Observability

Rutinförnyelser loggas strukturerat (`revolut.token.refreshed`) men publiceras
inte som händelser i pärmen — det är maskindrift, inte något ägaren ska läsa.
Livscykeln publiceras: `ekonomi.revolut.oauth.started|completed|failed`,
`ekonomi.revolut.connection.action_required|disconnected`,
`ekonomi.revolut.certificate.expiry_warning`.

Ingen logg och ingen händelse får innehålla access-token, refresh-token,
privatnyckel, auktoriseringskod eller client assertion. `logRevolut` redigerar
bort dem, och `observability.test.ts` bevakar det.

Ett undantag går inte att koda bort: auktoriseringskoden kommer som query-parameter
i en redirect, så plattformens åtkomstlogg skriver den callback-URL:en oavsett vad
appen gör. Det är samma sak i alla OAuth-flöden med authorization code. Koden är
engångs och byts direkt i callbacken, så raden i åtkomstloggen är död redan när
den skrivs. `state` är också engångs (`consumed_at`), så en avlyssnad rad kan inte
spelas upp igen.

## Koppla bort

Revolut publicerar inget API för att återkalla tokenarna i det här flödet. Vi
raderar dem lokalt, sätter `revoked`, behåller revisionsspåren och ber ägaren
ta bort appens behörighet under APIs i Revolut Business om dörren ska stängas
helt.
