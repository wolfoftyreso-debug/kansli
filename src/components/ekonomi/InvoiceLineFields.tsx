import { Field, SelectField } from "@/components/app/SignInGate";
import { vatLabel } from "@/lib/ekonomi/money";

export function InvoiceLineFields({ rows = 1 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-2">
          <Field
            name="description"
            label={index === 0 ? "Rad 1" : `Rad ${index + 1} (valfritt)`}
            required={index === 0}
            large
            placeholder={index === 0 ? "Hjulskifte" : ""}
          />
          <Field name="quantity" label="Antal" large defaultValue="1" />
          <Field
            name="unitNetKronor"
            label="Á-pris netto, kr"
            required={index === 0}
            large
            placeholder="2500"
          />
          <SelectField
            name="vatRateBps"
            label="Moms"
            large
            defaultValue="2500"
            options={[
              { value: "2500", label: vatLabel(2500) },
              { value: "1200", label: vatLabel(1200) },
            ]}
          />
          <SelectField
            name="kind"
            label="Slag"
            large
            defaultValue="service"
            options={[
              { value: "service", label: "Tjänst" },
              { value: "goods", label: "Vara" },
            ]}
          />
        </div>
      ))}
    </div>
  );
}
