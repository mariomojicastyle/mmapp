import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Google, Bing, y bots tradicionales
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
      {
        // ChatGPT browsing
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      {
        // OpenAI training/search bot
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        // Perplexity AI
        userAgent: "PerplexityBot",
        allow: "/",
      },
      {
        // Claude AI (Anthropic)
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        // Anthropic AI general
        userAgent: "anthropic-ai",
        allow: "/",
      },
      {
        // Google AI (Gemini)
        userAgent: "Google-Extended",
        allow: "/",
      },
      {
        // Microsoft Copilot
        userAgent: "Bingbot",
        allow: "/",
      },
      {
        // Brave Search (used by Claude)
        userAgent: "Bytespider",
        allow: "/",
      },
    ],
    sitemap: "https://mariomojica.com/sitemap.xml",
  };
}
