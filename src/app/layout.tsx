import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

function siteMetadataBase(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  if (process.env.VERCEL_URL)
    return new URL(`https://${process.env.VERCEL_URL}`);
  return new URL("http://localhost:3000");
}

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const defaultTitle = "NW Calgary vs downtown — car vs C-Train CO₂e";
const defaultDescription =
  "Compare approximate CO₂e emissions for driving vs C-Train from Northwest Calgary to downtown.";

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: defaultTitle,
    template: "%s · Calgary commute CO₂e",
  },
  description: defaultDescription,
  applicationName: "Calgary commute CO₂e",
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: "/",
    siteName: "Calgary commute CO₂e",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className={`${dmSans.className} flex min-h-dvh flex-col overflow-x-hidden bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}
      >
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,rgba(16,185,129,0.11),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_50%_at_50%_-10%,rgba(16,185,129,0.08),transparent_50%)]" />
          <div className="commute-bg-ambient absolute -inset-[35%] bg-[radial-gradient(ellipse_70%_50%_at_70%_10%,rgba(20,184,166,0.14),transparent_55%)] opacity-90 dark:bg-[radial-gradient(ellipse_65%_45%_at_75%_5%,rgba(45,212,191,0.1),transparent_50%)]" />
          <div className="commute-bg-ambient-alt absolute -inset-[30%] bg-[radial-gradient(ellipse_55%_45%_at_15%_85%,rgba(16,185,129,0.1),transparent_50%)] opacity-80 dark:opacity-70" />
          <div
            className="commute-bg-mesh absolute -inset-[45%]"
            aria-hidden
          />
        </div>
        {children}
      </body>
    </html>
  );
}
