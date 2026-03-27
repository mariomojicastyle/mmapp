import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = "https://mariomojica.com";

const seoConfig = {
  es: {
    title: "Mario Mojica | Diseñador Industrial & Automatización con IA",
    description:
      "Diseñador Industrial con +15 años y +3M de productos vendidos en Latinoamérica. Experto en diseño paramétrico (Grasshopper), manufactura CNC, automatización con IA y transformación digital para la industria del mueble.",
    keywords: [
      "diseñador industrial Colombia",
      "diseño paramétrico muebles",
      "automatización manufactura IA",
      "Grasshopper Rhino 3D",
      "manufactura CNC muebles",
      "transformación digital mobiliario",
      "diseño generativo",
      "Manufactura 4.0",
      "consultoría diseño industrial",
      "Mario Mojica",
    ],
  },
  en: {
    title: "Mario Mojica | Industrial Designer & AI Automation Expert",
    description:
      "Industrial Designer with 15+ years of experience and 3M+ products sold across Latin America. Expert in parametric design (Grasshopper), CNC manufacturing, AI-powered automation, and digital transformation for the furniture industry.",
    keywords: [
      "industrial designer Colombia",
      "parametric furniture design",
      "AI manufacturing automation",
      "Grasshopper Rhino 3D",
      "CNC furniture manufacturing",
      "digital transformation furniture",
      "generative design",
      "Manufacturing 4.0",
      "industrial design consulting",
      "Mario Mojica",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = seoConfig[locale as keyof typeof seoConfig] || seoConfig.es;

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: seo.title,
      template: `%s | Mario Mojica`,
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: "Mario Mojica", url: BASE_URL }],
    creator: "Mario Mojica",
    publisher: "Mario Mojica",
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_CO" : "en_US",
      alternateLocale: locale === "es" ? "en_US" : "es_CO",
      url: `${BASE_URL}/${locale}`,
      siteName: "Mario Mojica",
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: "/icon.png",
          width: 512,
          height: 512,
          alt: "Mario Mojica - Diseñador Industrial",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: ["/icon.png"],
      creator: "@mariomojica",
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
    category: "Industrial Design",
  };
}

// JSON-LD Structured Data
function JsonLd({ locale }: { locale: string }) {
  const seo = seoConfig[locale as keyof typeof seoConfig] || seoConfig.es;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Mario Mojica",
    url: BASE_URL,
    image: `${BASE_URL}/icon.png`,
    jobTitle:
      locale === "es"
        ? "Diseñador Industrial & Estratega de Automatización con IA"
        : "Industrial Designer & AI Automation Strategist",
    description: seo.description,
    email: "direccion@mariomojica.com",
    sameAs: ["https://www.linkedin.com/in/mario-mojica"],
    knowsAbout: [
      "Industrial Design",
      "Parametric Design",
      "Grasshopper",
      "Rhino 3D",
      "CNC Manufacturing",
      "AI Automation",
      "n8n",
      "Blender",
      "Three.js",
      "Next.js",
      "Digital Transformation",
      "Manufacturing 4.0",
    ],
    hasOccupation: {
      "@type": "Occupation",
      name:
        locale === "es"
          ? "Diseñador Industrial"
          : "Industrial Designer",
      occupationLocation: {
        "@type": "Country",
        name: "Colombia",
      },
      skills:
        "Parametric Design, CNC Manufacturing, AI Automation, Generative Design, Digital Transformation",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mario Mojica",
    url: BASE_URL,
    description: seo.description,
    inLanguage: [locale === "es" ? "es-CO" : "en-US"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/${locale}#contact`,
      "query-input": "required name=contact_form",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Verificamos que el locale sea válido
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Obtenemos los mensajes para este idioma
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.png" type="image/png" />
        <JsonLd locale={locale} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
