import { CheckField, Field, Submit } from "@/components/app/SignInGate";
import { DEFAULT_LOCALE, opsQueueStatus, opsSmsKindLabel, t, type Locale } from "@/lib/i18n";
import { OPS_SMS_KINDS, type OpsSmsDesk } from "@/lib/platform/ops-view";
import { saveOpsSmsAction } from "./actions";

export function OpsSmsForm({ sms, locale = DEFAULT_LOCALE }: { sms: OpsSmsDesk; locale?: Locale }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <form
        action={saveOpsSmsAction}
        className="flex flex-col gap-4 border border-line bg-surface px-4 py-4"
      >
        <div>
          <h2 className="text-lg font-semibold">{t(locale, "ops.sms.routes")}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {t(locale, "ops.sms.lead")}
            {sms.vendor ? t(locale, "ops.sms.vendorOn") : t(locale, "ops.sms.vendorOff")}
          </p>
        </div>
        <Field
          name="phone"
          label={t(locale, "ops.sms.phone")}
          type="tel"
          required
          large
          defaultValue={sms.phone}
          placeholder="070-123 45 67"
        />
        <fieldset className="flex flex-col gap-1">
          <legend className="pd-label">{t(locale, "ops.sms.when")}</legend>
          {OPS_SMS_KINDS.map((kind) => (
            <CheckField
              key={kind}
              name="kind"
              value={kind}
              label={opsSmsKindLabel(locale, kind)}
              defaultChecked={sms.routes.find((route) => route.kind === kind)?.enabled ?? false}
              large
            />
          ))}
        </fieldset>
        <Submit large>{t(locale, "ops.sms.save")}</Submit>
        {sms.salesPhone ? (
          <p className="text-sm text-muted">
            {sms.salesEnabled
              ? t(locale, "ops.sms.salesOn", { phone: sms.salesPhone })
              : t(locale, "ops.sms.salesOff")}
          </p>
        ) : (
          <p className="text-sm text-muted">{t(locale, "ops.sms.salesNone")}</p>
        )}
      </form>
      <div className="border border-line bg-surface px-4 py-4">
        <h2 className="text-lg font-semibold">{t(locale, "ops.sms.recent")}</h2>
        {sms.outbox.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t(locale, "ops.sms.recentEmpty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {sms.outbox.map((row) => (
              <li key={row.id} className="border-b border-line pb-3">
                <p className="pd-label">{opsQueueStatus(locale, row.status)}</p>
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
