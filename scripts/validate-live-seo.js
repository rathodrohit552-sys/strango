const http = require("http");

const paths = [
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
  "/meet-new-people-online",
  "/sitemap.xml"
];

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ hostname: "localhost", port: 5000, path }, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ path, status: res.statusCode, type: res.headers["content-type"] || "", body });
        });
      })
      .on("error", reject);
  });
}

(async () => {
  const [home, ...results] = await Promise.all(["/"].concat(paths).map(get));
  const bad = results.filter((result) => result.status !== 200);
  const htmlIssues = results
    .filter((result) => result.path !== "/sitemap.xml")
    .map((result) => ({
      path: result.path,
      status: result.status,
      canonical: /<link rel="canonical" href="[^"]+">/.test(result.body),
      faq: /"@type":"FAQPage"/.test(result.body),
      breadcrumb: /"@type":"BreadcrumbList"/.test(result.body),
      related: /<h2>Related Pages<\/h2>/.test(result.body),
      robots: /<meta name="robots" content="index, follow">/.test(result.body)
    }))
    .filter((result) => !result.canonical || !result.faq || !result.breadcrumb || !result.related || !result.robots);
  const sitemap = results.find((result) => result.path === "/sitemap.xml");
  const homepageRequired = [
    "/free-online-chat",
    "/talk-to-strangers",
    "/anonymous-chat",
    "/omegle-alternative",
    "/random-chat",
    "/chat-with-strangers",
    "/safe-anonymous-chat",
    "/no-signup-chat",
    "/chat-online",
    "/real-time-chat"
  ];
  const footerRequired = [
    "/free-online-chat",
    "/talk-to-strangers",
    "/anonymous-chat",
    "/omegle-alternative",
    "/random-chat",
    "/chat-with-strangers",
    "/safe-anonymous-chat",
    "/no-signup-chat"
  ];
  const homepageLinks = homepageRequired.filter((path) => home.body.includes(`href="${path}"`));
  const footerLinks = footerRequired.filter((path) => home.body.includes(`href="${path}"`));
  const report = {
    bad,
    htmlIssues,
    homepage: {
      status: home.status,
      popularHeading: home.body.includes("Popular Chat Pages"),
      popularLinks: homepageLinks.length,
      footerCategory: home.body.includes("Popular Pages"),
      footerLinks: footerLinks.length
    },
    sitemap: {
      status: sitemap.status,
      type: sitemap.type,
      hasNew: sitemap.body.includes("https://strango.xyz/random-text-chat"),
      hasRequired: paths.filter((path) => path !== "/sitemap.xml").every((path) => sitemap.body.includes(`https://strango.xyz${path}`))
    }
  };
  console.log(JSON.stringify(report, null, 2));
  if (
    bad.length ||
    htmlIssues.length ||
    !report.homepage.popularHeading ||
    report.homepage.popularLinks !== homepageRequired.length ||
    !report.homepage.footerCategory ||
    report.homepage.footerLinks !== footerRequired.length ||
    !report.sitemap.hasNew ||
    !report.sitemap.hasRequired
  ) {
    process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
