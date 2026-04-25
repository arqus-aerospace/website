import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const SITE_URL = "https://arqusaerospace.com";

export const metadata: Metadata = {
  title: {
    default: "Arqus Aerospace",
    template: "%s | Arqus Aerospace",
  },
  description:
    "A European aerospace company. Based in Munich. Building the space arsenal.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  authors: [{ name: "Arqus Aerospace" }],
  creator: "Arqus Aerospace",
  publisher: "Arqus Aerospace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Arqus Aerospace",
    title: "Arqus Aerospace",
    description:
      "A European aerospace company. Based in Munich. Building the space arsenal.",
    images: [
      {
        url: "/logo/icon.png",
        width: 512,
        height: 512,
        alt: "Arqus Aerospace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arqus Aerospace",
    description:
      "A European aerospace company. Based in Munich. Building the space arsenal.",
    images: ["/logo/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo/icon.png",
    apple: "/logo/icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Arqus Aerospace",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo/icon.png`,
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Munich",
        addressCountry: "DE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@arqusaerospace.com",
        contactType: "general",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Arqus Aerospace",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
