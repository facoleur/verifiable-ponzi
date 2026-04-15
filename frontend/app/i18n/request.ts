import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const supportedLocales = ["en"] as const;
type Locale = (typeof supportedLocales)[number];

function isSupportedLocale(value: string): value is Locale {
  return (supportedLocales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("locale")?.value ?? "en";
  const locale: Locale = isSupportedLocale(raw) ? raw : "en";

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
