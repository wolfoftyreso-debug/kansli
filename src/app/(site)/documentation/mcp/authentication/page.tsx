import type { Metadata } from "next";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "MCP authentication — PIXDRIFT",
};

export default function McpAuthPage() {
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/authentication" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="Authentication"
          title="One identity. No second login system."
          intro="MCP validates access tokens against the same IdP JWKS that REST resource servers use. Browser tools can use the existing Kansli session cookie."
        />
      </div>
      <ol className="mt-10 max-w-2xl list-decimal space-y-4 pl-5 text-ink-soft">
        <li>
          Get an access token from PIXDRIFT Identity (authorization code + PKCE, same as Kansli).
        </li>
        <li>
          Call <span className="font-mono text-ink">POST /mcp</span> with{" "}
          <span className="font-mono text-ink">
            Authorization: Bearer ${"{PIXDRIFT_MCP_TOKEN}"}
          </span>
          .
        </li>
        <li>
          Tenant and permissions come from the token. Tool arguments cannot switch organisation.
        </li>
      </ol>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        Audience is the Kansli client (kansli-web). Revoke access by revoking the IdP client or
        ending the session. Do not put tokens in documentation, screenshots, or client-side source.
      </p>
    </Container>
  );
}
