"use client";

import { LOCALE_NATIVE_NAME, UI_LOCALES, type Locale } from "@/lib/i18n";

export function LocalePicker({
  locale,
  next,
  label,
}: {
  locale: Locale;
  next: string;
  label: string;
}) {
  return (
    <form action="/api/locale" method="post" className="contents">
      <input type="hidden" name="next" value={next} />
      <label className="sr-only" htmlFor="pd-locale">
        {label}
      </label>
      <select
        id="pd-locale"
        name="locale"
        defaultValue={locale}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="max-w-28 cursor-pointer border-0 bg-transparent py-0 pd-label text-ink"
      >
        {UI_LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NATIVE_NAME[code]}
          </option>
        ))}
      </select>
    </form>
  );
}
