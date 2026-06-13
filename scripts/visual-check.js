const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const outputDir = path.join(__dirname, "..", "artifacts", "strango-qa");
fs.mkdirSync(outputDir, { recursive: true });

const targets = [
  { name: "home-desktop", url: "http://localhost:5000/", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "communities-desktop", url: "http://localhost:5000/communities", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "community-detail-desktop", url: "http://localhost:5000/communities/ai", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "discussions-desktop", url: "http://localhost:5000/discussions", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "discussion-live-desktop", url: "http://localhost:5000/discussions/ai-replace-engineers", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "live-desktop", url: "http://localhost:5000/live", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "rooms-desktop", url: "http://localhost:5000/rooms", viewport: { width: 1440, height: 1000 }, fullPage: true },
  { name: "chat-desktop", url: "http://localhost:5000/chat", viewport: { width: 1440, height: 1000 }, fullPage: false },
  { name: "communities-mobile", url: "http://localhost:5000/communities", viewport: { width: 390, height: 844 }, fullPage: true },
  { name: "discussion-live-mobile", url: "http://localhost:5000/discussions/ai-replace-engineers", viewport: { width: 390, height: 844 }, fullPage: true },
  { name: "chat-mobile", url: "http://localhost:5000/chat", viewport: { width: 390, height: 844 }, fullPage: false },
  { name: "messages-mobile", url: "http://localhost:5000/messages", viewport: { width: 390, height: 844 }, fullPage: false }
];

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
    const response = await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(900);
    const metrics = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelector("h1")?.textContent?.trim() || "",
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    const checks = {};
    if (target.name === "home-desktop") {
      checks.darkThemeDefault = await page.evaluate(() => document.documentElement.dataset.theme === "dark");
      await page.getByRole("button", { name: "Switch to light mode" }).click();
      checks.lightThemeApplied = await page.evaluate(() => document.documentElement.dataset.theme === "light");
      await page.reload({ waitUntil: "domcontentloaded" });
      checks.lightThemePersisted = await page.evaluate(() => document.documentElement.dataset.theme === "light");
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
    }
    if (target.name === "communities-desktop") {
      await page.getByPlaceholder("Search by topic or community").fill("finance");
      checks.communitySearchWorks = await page.getByRole("heading", { name: "Finance Circle" }).first().isVisible();
      await page.getByRole("button", { name: "Finance", exact: true }).click();
      checks.communityFilterWorks = await page.getByRole("heading", { name: "Finance Circle" }).first().isVisible();
    }
    if (target.name === "discussions-desktop") {
      await page.getByRole("button", { name: "AI", exact: true }).click();
      checks.discussionFilterWorks = await page.getByRole("heading", { name: "Will AI replace software engineers?" }).isVisible();
      const voteButton = page.getByRole("button", { name: "Upvote" }).first();
      await voteButton.click();
      checks.voteStateWorks = await voteButton.getAttribute("class") === "is-voted";
    }
    if (target.name === "community-detail-desktop") {
      checks.communityMarkVisible = await page.locator(".community-mark-hero").isVisible();
      checks.communityStatsVisible = await page.locator(".community-hero-stats").isVisible();
      checks.trendingTopicsVisible = await page.locator(".community-trending-topics").isVisible();
    }
    if (target.name === "discussion-live-desktop") {
      const secondPage = await browser.newPage({ viewport: target.viewport });
      const secondErrors = [];
      secondPage.on("console", (message) => {
        if (message.type() === "error") secondErrors.push(message.text());
      });
      secondPage.on("pageerror", (error) => secondErrors.push(error.message));
      await secondPage.goto(target.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await secondPage.waitForTimeout(700);
      const secondComposer = secondPage.locator(".group-message-composer textarea");
      await secondComposer.fill("Realtime QA message");
      await page.locator(".group-typing-row").waitFor({ timeout: 5000 });
      checks.typingIndicatorVisible = true;
      await secondPage.locator(".group-message-composer button[type='submit']").click();
      await page.getByText("Realtime QA message").last().waitFor({ timeout: 5000 });
      checks.realtimeDiscussionMessage = true;
      checks.presencePanelVisible = await page.locator(".discussion-presence-panel").isVisible();
      checks.secondClientConsoleErrors = secondErrors;
      await secondPage.close();
    }
    if (target.name === "live-desktop") {
      await page.getByRole("button", { name: "Join live" }).first().click();
      checks.liveStageVisible = await page.locator(".live-stage").isVisible();
    }
    if (target.name === "rooms-desktop") {
      await page.getByRole("button", { name: "Join room" }).first().click();
      await page.locator(".active-room-panel form input").fill("Visual QA ping");
      await page.getByRole("button", { name: "Send" }).click();
      await page.getByText("Visual QA ping").waitFor({ timeout: 5000 });
      checks.realtimeRoomMessage = true;
      checks.roomPresenceVisible = await page.locator(".active-room-panel header p").isVisible();
    }
    if (target.name === "chat-mobile" || target.name === "chat-desktop") {
      await page.getByRole("button", { name: "Use prompt" }).click();
      const messageInput = page.getByRole("textbox", { name: "Message" });
      checks.promptInserted = (await messageInput.inputValue()).length > 10;
      checks.promptFocused = await messageInput.evaluate((element) => document.activeElement === element);
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
