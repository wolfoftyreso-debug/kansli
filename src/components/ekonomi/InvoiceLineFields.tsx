import { Field, SelectField } from "@/components/app/SignInGate";
import { vatLabel } from "@/lib/ekonomi/money";
import { t, type Locale } from "@/lib/i18n";

export function InvoiceLineFields({ rows = 1, locale }: { rows?: number; locale: Locale }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-2">
          <Field
            name="description"
            label={
              index === 0
                ? t(locale, "ekonomi.field.line", { n: index + 1 })
                : t(locale, "ekonomi.field.lineOptional", { n: index + 1 })
            }
            required={index === 0}
            large
            placeholder={index === 0 ? t(locale, "tyra.intent.TIRE_SWAP_APPOINTMENT") : ""}
          />
          <Field name="quantity" label={t(locale, "tyra.field.quantity")} large defaultValue="1" />
          <Field
            name="unitNetKronor"
            label={t(locale, "ekonomi.field.unitNet")}
            required={index === 0}
            large
            placeholder="2500"
          />
          <SelectField
            name="vatRateBps"
            label={t(locale, "ekonomi.field.vat")}
            large
            defaultValue="2500"
            options={[
              { value: "2500", label: vatLabel(2500) },
              { value: "1200", label: vatLabel(1200) },
            ]}
          />
          <SelectField
            name="kind"
            label={t(locale, "ekonomi.field.kind")}
            large
            defaultValue="service"
            options={[
              { value: "service", label: t(locale, "ekonomi.kind.service") },
              { value: "goods", label: t(locale, "ekonomi.kind.goods") },
            ]}
          />
        </div>
      ))}
    </div>
  );
}
