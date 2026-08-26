import { landvexAb, landvexInc, site } from "@/lib/site";

export function CompanyAddress({ compact = false }: { compact?: boolean }) {
  return (
    <address className="not-italic">
      <div>{landvexAb.legalName}</div>
      <div>
        {landvexAb.street}, {landvexAb.postalCode} {landvexAb.city}, {landvexAb.country}
      </div>
      <div>Registered office (säte): {landvexAb.seat}</div>
      <div>
        Org.nr {landvexAb.orgNr}
        {compact ? " · " : <br />}
        VAT {landvexAb.vat}
      </div>
      <div>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </div>
      {compact ? (
        <div className="mt-2">
          {landvexInc.legalName} · {landvexInc.city}, {landvexInc.region}
        </div>
      ) : null}
    </address>
  );
}
