import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AxiosSetup from "@/components/AxiosSetup";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhereReady Solar OS — Operating System for India's Solar EPCs & Installers",
  description:
    "The all-in-one solar operating system for Indian rooftop installers and EPC contractors. Bill OCR, 60-second magazine proposals, DISCOM net-metering workflows, and serialized inventory in one unified platform.",
  keywords: [
    "Solar ERP India",
    "Solar EPC software",
    "Solar quotation software",
    "PM Surya Ghar software",
    "MSEDCL solar net metering",
    "Rooftop solar CRM India",
    "Solar proposal generator",
    "WhereReady Solar OS"
  ],
  authors: [{ name: "WhereReady", url: "https://whereready.com" }],
  openGraph: {
    title: "WhereReady Solar OS — Operating System for India's Solar EPCs & Installers",
    description:
      "Run your solar EPC business from lead capture & 60-sec proposals to DISCOM net-metering & commissioning. Win more rooftop bids.",
    url: "https://whereready.com",
    siteName: "WhereReady Solar OS",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhereReady Solar OS — Operating System for India's Solar EPCs & Installers",
    description:
      "All-in-one solar software for Indian EPCs & rooftop installers. Bill OCR, 60-sec proposals, DISCOM net-metering & serialized inventory.",
  },
  icons: {
    icon: "/images/whereready_logo.png",
    shortcut: "/images/whereready_logo.png",
    apple: "/images/whereready_logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AxiosSetup>{children}</AxiosSetup>
      </body>
    </html>
  );
}
