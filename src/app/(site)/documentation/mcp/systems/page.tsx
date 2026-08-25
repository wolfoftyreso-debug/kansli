import type { Metadata } from "next";
import Link from "next/link";
import { mcpSystemMatrix } from "@/lib/mcp/catalog";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "MCP systems — PIXDRIFT",
};

export default function McpSystemsPage() {
  const rows = mcpSystemMatrix();
  return (
    <Container className="py-16 lg:py-24">
      <McpDocNav current="/documentation/mcp/systems" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="Systems"
          title="What is actually registered"
          intro="NORA, Mova and SAGA are not in this repository, so they are not listed as MCP-ready."
        />
      </div>
      <table className="mt-12 w-full border-t border-line text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-3 font-medium">System</th>
            <th className="py-3 font-medium">MCP</th>
            <th className="py-3 font-medium">Tools</th>
            <th className="py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <td className="py-3">
                <Link href={`/systems/${row.id}`} className="hover:underline">
                  {row.name}
                </Link>
              </td>
              <td className="py-3">{row.mcp ? "Available" : "Not exposed"}</td>
              <td className="py-3">{row.tools}</td>
              <td className="py-3">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}
