import { Field } from "@/components/app/SignInGate";
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
            placeholder={index === 0 ? "Hjulskifte" : ""}
          />
          <Field name="quantity" label="Antal" defaultValue="1" />
          <Field
            name="unitNetKronor"
            label="Á-pris netto, kr"
            required={index === 0}
            placeholder="2500"
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-soft">Moms</span>
            <select
              name="vatRateBps"
              className="border border-line bg-paper px-3 py-2 text-sm"
              defaultValue="2500"
            >
              <option value="2500">{vatLabel(2500)}</option>
              <option value="1200">{vatLabel(1200)}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-ink-soft">Slag</span>
            <select
              name="kind"
              className="border border-line bg-paper px-3 py-2 text-sm"
              defaultValue="service"
            >
              <option value="service">Tjänst</option>
              <option value="goods">Vara</option>
            </select>
          </label>
        </div>
      ))}
    </div>
  );
}
