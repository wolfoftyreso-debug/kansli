import type { ReactNode } from "react";

export function EnquiryEmail({
  name,
  organisation,
  email,
  process,
}: {
  name: string;
  organisation: string;
  email: string;
  process: string;
}) {
  const row = (label: string, value: ReactNode) => (
    <tr>
      <td
        style={{
          padding: "10px 0",
          fontFamily: "Archivo, Helvetica, Arial, sans-serif",
          fontSize: "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#5a6570",
          width: "140px",
          verticalAlign: "top",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "10px 0",
          fontFamily: "Archivo, Helvetica, Arial, sans-serif",
          fontSize: "15px",
          color: "#000028",
          whiteSpace: "pre-wrap",
        }}
      >
        {value}
      </td>
    </tr>
  );

  return (
    <div style={{ background: "#f7f8f9", padding: "32px 16px" }}>
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e3e6e8",
          padding: "32px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontFamily: "IBM Plex Mono, ui-monospace, monospace",
            fontSize: "11px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#007580",
          }}
        >
          Landvex enquiry
        </p>
        <h1
          style={{
            margin: "0 0 24px",
            fontFamily: "Archivo, Helvetica, Arial, sans-serif",
            fontSize: "24px",
            fontWeight: 600,
            color: "#000028",
          }}
        >
          New technical review request
        </h1>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {row("Name", name)}
            {row("Organisation", organisation)}
            {row("Email", <a href={`mailto:${email}`}>{email}</a>)}
            {row("Process", process)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
