import type { Metadata } from "next";
import "./globals.css";
import CursorGlow from "@/components/ui/cursor-glow";

const SITE_URL = "https://arqusaerospace.com";

export const metadata: Metadata = {
  title: {
    default: "Arqus Aerospace | Defence Hardware for Orbit",
    template: "%s | Arqus Aerospace",
  },
  description:
    "Arqus Aerospace develops sovereign hardware for space and defence — physical AI systems that protect the next domain of trade, security, and deterrence.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "space defence",
    "orbital security",
    "deterrence",
    "physical AI",
    "sovereign hardware",
    "space domain awareness",
    "allied defence",
    "aerospace",
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
    title: "Arqus Aerospace | Defence Hardware for Orbit",
    description:
      "Sovereign hardware for space and defence — physical AI systems that protect the next domain of trade, security, and deterrence.",
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
    title: "Arqus Aerospace | Defence Hardware for Orbit",
    description:
      "Sovereign hardware for space and defence — physical AI systems that protect the next domain of trade, security, and deterrence.",
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
      name: "Arqus Aerospace | Defence Hardware for Orbit",
      description:
        "Arqus Aerospace develops sovereign hardware for space and defence — physical AI systems that protect the next domain of trade, security, and deterrence.",
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
      <body>
        <CursorGlow glowRadius={70} />
        {children}
      </body>
    </html>
  );
}
