import { site } from "./site.ts";

export type MailEnv = {
  apiKey: string | undefined;
  from: string | undefined;
  to: string;
  production: boolean;
};

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function mailEnv(): MailEnv {
  return {
    apiKey: readEnv("RESEND_API_KEY"),
    from: readEnv("CONTACT_FROM"),
    to: readEnv("CONTACT_TO") ?? site.email,
    production: process.env.NODE_ENV === "production",
  };
}

export function isCompanyFromAddress(from: string) {
  const value = from.trim();
  return (
    /<[^>\s]+@landvex\.com>$/i.test(value) || /^[^<>\s]+@landvex\.com$/i.test(value)
  );
}
