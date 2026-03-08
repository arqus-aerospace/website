import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://arqusaerospace.com";

export const metadata: Metadata = {
  title: {
    default: "Arqus Aerospace | Space Technology & Innovation",
    template: "%s | Arqus Aerospace",
  },
  description:
    "Arqus Aerospace develops cutting-edge space technology solutions including orbital datacenters, commercial space stations, reusable launch systems, and satellite broadband constellations.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "aerospace",
    "space technology",
    "orbital datacenters",
    "commercial space stations",
    "reusable launch systems",
    "satellite broadband",
    "on-orbit servicing",
    "space defense",
    "Arqus Aerospace",
  ],
  authors: [{ name: "Arqus Aerospace" }],
  creator: "Arqus Aerospace",
  publisher: "Arqus Aerospace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Arqus Aerospace",
    title: "Arqus Aerospace | Space Technology & Innovation",
    description:
      "Developing cutting-edge space technology solutions including orbital datacenters, commercial space stations, reusable launch systems, and satellite broadband constellations.",
    images: [
      {
        url: "/logo/icon.png",
        width: 512,
        height: 512,
        alt: "Arqus Aerospace Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arqus Aerospace | Space Technology & Innovation",
    description:
      "Developing cutting-edge space technology solutions including orbital datacenters, commercial space stations, and satellite broadband constellations.",
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
        streetAddress: "Maria-Merian-Straße",
        addressLocality: "Ottobrunn",
        postalCode: "85521",
        addressCountry: "DE",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@arqusaerospace.com",
        contactType: "general",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Arqus Aerospace",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: "Arqus Aerospace | Space Technology & Innovation",
      description:
        "Arqus Aerospace develops cutting-edge space technology solutions including orbital datacenters, commercial space stations, reusable launch systems, and satellite broadband constellations.",
      isPartOf: {
        "@id": `${SITE_URL}/#website`,
      },
      about: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
