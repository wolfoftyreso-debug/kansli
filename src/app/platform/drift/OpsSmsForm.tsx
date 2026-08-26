import { CheckField, Field, Submit } from "@/components/app/SignInGate";
import { OPS_SMS_KIND_LABEL, OPS_SMS_KINDS, type OpsSmsDesk } from "@/lib/platform/ops-view";
import { saveOpsSmsAction } from "./actions";

const STATUS: Record<string, string> = {
  PENDING: "Väntar",
  SENT: "Skickat",
  FAILED: "Misslyckades",
  BLOCKED: "Stoppat",
};

export function OpsSmsForm({ sms }: { sms: OpsSmsDesk }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <form
        action={saveOpsSmsAction}
        className="flex flex-col gap-4 border border-line bg-surface px-4 py-4"
      >
        <div>
          <h2 className="text-lg font-semibold">SMS-rutter</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Larm går hit när något slår. Inte när sidan bara läses. Sälj-SMS ställs i Ekonomi.
            {sms.vendor
              ? " Telefonen är kopplad."
              : " Numret sparas nu. SMS går inte ut förrän telefonen är kopplad."}
          </p>
        </div>
        <Field
          name="phone"
          label="Mobilnummer för larm"
          type="tel"
          required
          large
          defaultValue={sms.phone}
          placeholder="070-123 45 67"
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="pd-label">Skicka SMS när</legend>
          {OPS_SMS_KINDS.map((kind) => (
            <CheckField
              key={kind}
              name="kind"
              value={kind}
              label={OPS_SMS_KIND_LABEL[kind]}
              defaultChecked={sms.routes.find((route) => route.kind === kind)?.enabled ?? false}
              large
            />
          ))}
        </fieldset>
        <Submit large>Spara rutter</Submit>
        {sms.salesPhone ? (
          <p className="text-sm text-muted">
            Sälj-SMS: {sms.salesEnabled ? sms.salesPhone : "av"} · ställs i Ekonomi.
          </p>
        ) : (
          <p className="text-sm text-muted">Inget sälj-SMS är satt i Ekonomi än.</p>
        )}
      </form>
      <div className="border border-line bg-surface px-4 py-4">
        <h2 className="text-lg font-semibold">Senaste larm</h2>
        {sms.outbox.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Inga larm skickade i den här kön.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {sms.outbox.map((row) => (
              <li key={row.id} className="border-b border-line pb-3">
                <p className="pd-label">{STATUS[row.status] ?? row.status}</p>
                <p className="mt-1 text-sm">{row.body}</p>
                {row.lastError ? <p className="mt-1 text-sm text-muted">{row.lastError}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
