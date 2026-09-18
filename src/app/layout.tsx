import type { Metadata, Viewport } from "next";
import { Geist_Mono, Nunito_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { EnregistrementServiceWorker } from "@/components/EnregistrementServiceWorker";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ordi'Space Livreur",
  description: "Espace Livreur OrdiSpace.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Livreur",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d63e0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-brand-ink md:bg-[linear-gradient(160deg,#eef3fb_0%,#e3e9f5_45%,#eef1f8_100%)]">
        <EnregistrementServiceWorker />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
