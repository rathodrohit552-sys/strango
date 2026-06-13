const { pages, renderSeoPage, renderSitemap } = require("../seo-pages");

const required = [
  "/chat-guides",
  "/free-online-chat",
  "/talk-to-strangers",
  "/anonymous-chat",
  "/omegle-alternative",
  "/chat-with-strangers",
  "/random-chat",
  "/chat-online",
  "/no-signup-chat",
  "/chat-without-registration",
  "/real-time-chat",
  "/safe-anonymous-chat",
  "/best-random-chat-sites",
  "/how-strango-works",
  "/why-use-anonymous-chat",
  "/safety-center",
  "/help-center",
  "/random-text-chat",
  "/online-chat-rooms",
  "/instant-random-chat",
  "/talk-to-random-people",
  "/private-chat-room",
  "/free-chat-no-signup",
  "/best-chat-sites",
  "/anonymous-text-chat",
  "/random-chat-site",
  "/meet-new-people-online"
];

function duplicateValues(items, key) {
  const counts = new Map();
  items.forEach((item) => counts.set(item[key], (counts.get(item[key]) || 0) + 1));
  return Array.from(counts.entries()).filter(([, count]) => count > 1);
}

function extractSchemas(html) {
  return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)).map((match) => JSON.parse(match[1]));
}

function wordCount(html) {
  const article = (html.match(/<article[\s\S]*?<\/article>/) || [""])[0];
  return article
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function relatedCount(html) {
  const related = (html.match(/<section class="seo-links"><h2>Related Pages<\/h2>([\s\S]*?)<\/section>/) || ["", ""])[1];
  return (related.match(/<a /g) || []).length;
}

const sitemap = renderSitemap();
const missing = required.filter((path) => !sitemap.includes(`https://strango.xyz${path}`));
const badSchema = [];
const top = ["free-online-chat", "talk-to-strangers", "anonymous-chat", "omegle-alternative"].map((slug) => {
  const page = pages.find((item) => item.slug === slug);
  const html = renderSeoPage(page);
  let faqItems = 0;
  try {
    const faq = extractSchemas(html).find((schema) => schema["@type"] === "FAQPage");
    faqItems = faq ? faq.mainEntity.length : 0;
  } catch (error) {
    badSchema.push(slug);
  }
  return {
    slug,
    words: wordCount(html),
    faqItems,
    related: relatedCount(html)
  };
});

pages.forEach((page) => {
  try {
    const schemas = extractSchemas(renderSeoPage(page));
    const faq = schemas.find((schema) => schema["@type"] === "FAQPage");
    const breadcrumb = schemas.find((schema) => schema["@type"] === "BreadcrumbList");
    if (!faq || faq.mainEntity.length < 8 || !breadcrumb) badSchema.push(page.slug);
    if (page.slug !== "chat-guides" && breadcrumb.itemListElement.length < 3) badSchema.push(page.slug);
  } catch (error) {
    badSchema.push(page.slug);
  }
});

const report = {
  pages: pages.length,
  missing,
  duplicateTitles: duplicateValues(pages, "title"),
  duplicateDescriptions: duplicateValues(pages, "description"),
  top,
  badSchema: Array.from(new Set(badSchema)),
  hubMissingLinks: pages
    .filter((page) => page.slug !== "chat-guides")
    .filter((page) => !renderSeoPage(pages.find((item) => item.slug === "chat-guides")).includes(`href="/${page.slug}"`))
    .map((page) => page.slug)
};

console.log(JSON.stringify(report, null, 2));

if (
  report.missing.length ||
  report.duplicateTitles.length ||
  report.duplicateDescriptions.length ||
  report.badSchema.length ||
  report.hubMissingLinks.length ||
  report.top.some((page) => page.words < 800 || page.words > 1200 || page.faqItems < 8 || page.related !== 6)
) {
  process.exitCode = 1;
}
