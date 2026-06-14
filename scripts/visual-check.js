const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const outputDir = path.join(__dirname, "..", "artifacts", "strango-qa");
fs.mkdirSync(outputDir, { recursive: true });

const allTargets = [
  { name: "home-desktop", url: "http://localhost:5000/", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "communities-desktop", url: "http://localhost:5000/communities", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "community-detail-desktop", url: "http://localhost:5000/communities/ai", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "discussions-desktop", url: "http://localhost:5000/discussions", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "discussion-create-desktop", url: "http://localhost:5000/discussions/new", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "pluto-desktop", url: "http://localhost:5000/pluto", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "chat-desktop", url: "http://localhost:5000/chat", viewport: { width: 1440, height: 1000 }, fullPage: false },
  { name: "communities-tablet", url: "http://localhost:5000/communities", viewport: { width: 820, height: 1180 }, fullPage: true },
  { name: "discussion-create-mobile", url: "http://localhost:5000/discussions/new", viewport: { width: 390, height: 844 }, fullPage: true },
  { name: "pluto-mobile", url: "http://localhost:5000/pluto", viewport: { width: 390, height: 844 }, fullPage: true },
  { name: "chat-mobile", url: "http://localhost:5000/chat", viewport: { width: 390, height: 844 }, fullPage: false }
];
const requestedTarget = process.argv[2];
const targets = requestedTarget ? allTargets.filter((target) => target.name === requestedTarget) : allTargets;

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });
  const results = [];

  for (const target of targets) {
    const page = await browser.newPage({ viewport: target.viewport });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    const response = await page.goto(target.url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(350);

    const metrics = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    const checks = {};

    if (target.name === "home-desktop") {
      checks.constellationVisible = await page.locator(".community-constellation").isVisible();
      checks.localizedHeadline = (await page.locator(".hero-copy h1").innerText()).trim();
    }

    if (target.name.startsWith("communities-")) {
      const toolbar = page.locator(".discovery-toolbar");
      checks.discoveryVisible = await toolbar.isVisible();
      checks.categoryCount = await page.locator(".discovery-toolbar .category-pills button").count();
      checks.toolbarPosition = await toolbar.evaluate((element) => getComputedStyle(element).position);
    }

    if (target.name === "community-detail-desktop") {
      checks.compactHeaderVisible = await page.locator(".community-hero").isVisible();
      checks.headerHeight = Math.round((await page.locator(".community-hero").boundingBox()).height);
    }

    if (target.name === "discussions-desktop") {
      checks.creationControls = await page.locator("a, button").evaluateAll((elements) => elements
        .map((element) => ({
          tag: element.tagName,
          text: element.textContent.trim(),
          href: element.getAttribute("href")
        }))
        .filter((item) => /discussion/i.test(item.text)));
      await page.getByRole("button", { name: "New discussion" }).click();
      await page.waitForURL("**/discussions/new");
      checks.creationUsesDedicatedPage = page.url().endsWith("/discussions/new");
      checks.legacyModalAbsent = await page.locator(".form-modal").count() === 0;
    }

    if (target.name.startsWith("discussion-create-")) {
      checks.dedicatedComposerVisible = await page.locator(".discussion-create-form").isVisible();
      checks.suggestionCount = await page.locator(".question-suggestion-list button").count();
      await page.locator(".question-suggestion-list button").first().click();
      checks.suggestionInserted = (await page.locator(".discussion-create-form input").last().inputValue()).length > 10;
    }

    if (target.name.startsWith("pluto-")) {
      checks.benefitCount = await page.locator(".pluto-benefit-grid article").count();
      checks.paymentAbsent = (await page.locator("body").innerText()).toLowerCase().includes("no pricing or payment");
    }

    if (target.name.startsWith("chat-")) {
      checks.conversationVisible = await page.locator(".chat-conversation").isVisible();
      checks.adReserveCount = await page.locator(".chat-ad-reserve").count();
      checks.visibleAdReserveCount = await page.locator(".chat-ad-reserve:visible").count();
      await page.getByRole("button", { name: "Use prompt" }).click();
      const messageInput = page.getByRole("textbox", { name: "Message" });
      checks.promptInserted = (await messageInput.inputValue()).length > 10;
      checks.promptFocused = await messageInput.evaluate((element) => document.activeElement === element);
      checks.startedStateVisible = await page.getByText("Conversation starter ready").isVisible();
    }

    const screenshot = path.join(outputDir, `${target.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: target.fullPage });
    results.push({
      name: target.name,
      status: response ? response.status() : null,
      screenshot,
      consoleErrors,
      checks,
      ...metrics
    });
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(outputDir, "results.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
