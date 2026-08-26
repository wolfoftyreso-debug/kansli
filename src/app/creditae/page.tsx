import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import {
  ASSESSMENT_LABELS,
  INQUIRY_STATUS_LABELS,
  listInquiries,
} from "@/lib/creditae/inquiries";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { registerCreditaeInquiry } from "./actions";

export const metadata = {
  title: "CREDITAE — Pixdrift",
  description: "Kreditbedömning av motpart. Er slutsats, inget påhittat betyg.",
};

export default async function CreditaePage() {
  const session = await readSession();
  const runtime = tryRuntime(session?.org?.ref);
  const inquiries =
    session?.org?.ref && runtime ? await listInquiries(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="creditae" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/creditae", label: "CREDITAE" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">CREDITAE</h1>
        <p className="text-ink-soft">
          CREDITAE tar emot vem ni ska bedöma och vad ni själva kom fram till. Systemet sätter
          inget kreditbetyg.
        </p>
        <Notice>
          Ingen kreditupplysningsbyrå är inkopplad. Bedömningen är er. Systemet hittar aldrig på
          ett betyg.
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/creditae" title="Logga in för att bedöma en motpart">
          Förfrågan sparas i CREDITAE. Logga in för att registrera.
        </SignInGate>
      ) : (
        <>
          <form
            action={registerCreditaeInquiry}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Ny förfrågan</h2>
            <Field
              name="subjectOrgNumber"
              label="Organisationsnummer"
              required
              placeholder="556016-0680"
            />
            <Field name="subjectName" label="Bolagsnamn (valfritt)" />
            <Field name="reason" label="Varför ni bedömer (valfritt)" multiline />
            <Submit>Registrera förfrågan</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Förfrågningar</h2>
            {inquiries.length === 0 ? (
              <EmptyState>Inga förfrågningar ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {inquiries.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.assessment
                        ? ASSESSMENT_LABELS[item.assessment]
                        : INQUIRY_STATUS_LABELS[item.status]}
                    </p>
                    <p className="mt-2 font-medium">
                      <Link href={`/creditae/${item.id}`} className="hover:underline">
                        {item.subjectName || item.subjectOrgNumber}
                      </Link>
                    </p>
                    <p className="font-mono text-xs text-faint">{item.subjectOrgNumber}</p>
                    <p className="mt-2 text-xs text-faint">
                      {formatSwedishDateTime(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
