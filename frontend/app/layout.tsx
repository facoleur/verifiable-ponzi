import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Rubik } from "next/font/google";
import { ClientProviders } from "./client-providers";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "G50 — Dynamic price token",
  description: "Buy at ceiling, sell at floor. Floor updates every 10 blocks.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={cn("h-full", "antialiased", "font-sans", rubik.variable)}
    >
      <body className="flex min-h-full flex-col bg-slate-200">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Toaster />
          <ClientProviders>{children}</ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
