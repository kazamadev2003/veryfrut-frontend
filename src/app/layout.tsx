import type { Metadata } from "next";
import { QueryClientProvider } from "@/lib/api/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://veryfrut.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Veryfrut",
    template: "%s | Veryfrut",
  },
  description:
    "Distribución sostenible de frutas y verduras frescas. Conectamos productores locales con consumidores conscientes, garantizando la máxima frescura y sostenibilidad en cada entrega.",
  applicationName: "Veryfrut",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: "/",
    siteName: "Veryfrut",
    title: "Veryfrut",
    description:
      "Distribución sostenible de frutas y verduras frescas. Conectamos productores locales con consumidores conscientes, garantizando la máxima frescura y sostenibilidad en cada entrega.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Veryfrut",
    description:
      "Distribución sostenible de frutas y verduras frescas. Conectamos productores locales con consumidores conscientes, garantizando la máxima frescura y sostenibilidad en cada entrega.",
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
    <html lang="en">
      <body className="antialiased">
        <main>
          <QueryClientProvider>
            {children}
            <Toaster />
          </QueryClientProvider>
        </main>
      </body>
    </html>
  );
}
