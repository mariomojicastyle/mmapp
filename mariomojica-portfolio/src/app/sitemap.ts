import type { MetadataRoute } from "next";

const BASE_URL = "https://mariomojica.com";

// Project slugs from portfolio data
const projectSlugs = [
  "alec",
  "demario",
  "corferias",
  "renderizador",
  "maderkit",
  "mario-mojica",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["es", "en"];
  const now = new Date();

  // Homepage for each locale
  const homePages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 1.0,
    alternates: {
      languages: {
        es: `${BASE_URL}/es`,
        en: `${BASE_URL}/en`,
      },
    },
  }));

  // Portfolio project pages for each locale
  const projectPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    projectSlugs.map((slug) => ({
      url: `${BASE_URL}/${locale}/portfolio/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/portfolio/${slug}`,
          en: `${BASE_URL}/en/portfolio/${slug}`,
        },
      },
    }))
  );

  return [...homePages, ...projectPages];
}
