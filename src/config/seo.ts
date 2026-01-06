export const seoConfig = {
  title: "Neo Gear Btw - 3D Involute Gear Generator",
  description: "Generate precision involute gears with real-time 3D visualization. Interactive gear generator with customizable parameters and STL export for 3D printing and CAD.",
  keywords: "gear generator, involute gear, 3D gear, STL export, gear design, mechanical engineering, CAD tool, 3D printing, Neo Gear",
  url: "https://dmtrkovalenko.dev",
  ogImage: "/og-image.png",
};

export const metaTags = `
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${seoConfig.title}</title>

  <!-- SEO Meta Tags -->
  <meta name="description" content="${seoConfig.description}" />
  <meta name="keywords" content="${seoConfig.keywords}" />
  <meta name="robots" content="index, follow" />

  <!-- Open Graph / Facebook / LinkedIn -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${seoConfig.url}" />
  <meta property="og:title" content="${seoConfig.title}" />
  <meta property="og:description" content="${seoConfig.description}" />
  <meta property="og:image" content="${seoConfig.ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${seoConfig.title}" />
  <meta name="twitter:description" content="${seoConfig.description}" />
  <meta name="twitter:image" content="${seoConfig.ogImage}" />

  <!-- Canonical URL -->
  <link rel="canonical" href="${seoConfig.url}" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
`;
