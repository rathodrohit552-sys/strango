const SITE_URL = "https://strango.xyz";

const coreLinks = [
  { href: "/", label: "Home" },
  { href: "/anonymous-chat", label: "Anonymous Chat" },
  { href: "/random-chat", label: "Random Chat" },
  { href: "/talk-to-strangers", label: "Talk To Strangers" },
  { href: "/omegle-alternative", label: "Omegle Alternative" }
];

const startLinks = [
  { href: "/#chat", label: "Start Chatting" },
  { href: "/anonymous-chat", label: "Anonymous Chat" },
  { href: "/omegle-alternative", label: "Omegle Alternative" }
];

function titleCase(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const seoLandingPages = [
  ["talk-to-strangers", "Talk to Strangers Online", "Start conversations with new people in a simple anonymous text chat built for privacy, speed, and low-pressure discovery.", "meeting someone new without turning the moment into a profile-driven social network", "a friendly first conversation"],
  ["free-online-chat", "Free Online Chat With Strangers", "Use Strango for free real-time text chat with people online, no complicated setup or public profile required.", "starting a free chat quickly while keeping the experience clean and focused", "fast low-friction messaging"],
  ["anonymous-chat", "Anonymous Chat Online", "Explore anonymous chat with a polished interface, instant matching, and practical safety guidance for everyday conversations.", "talking privately without attaching a public identity to every message", "privacy-conscious text chat"],
  ["random-chat", "Random Chat for Real-Time Conversations", "Random chat on Strango helps you meet someone unexpected through a lightweight text-first experience.", "finding a spontaneous conversation when you do not want feeds, followers, or profile browsing", "spontaneous matching"],
  ["chat-with-strangers", "Chat With Strangers Online", "Chat with strangers through a clean real-time messenger that keeps the focus on the conversation itself.", "having a short human exchange without building a permanent social graph", "simple stranger chat"],
  ["chat-online", "Chat Online Instantly", "Strango makes it easy to chat online with random people using a fast, privacy-aware text experience.", "starting online conversations from desktop or mobile without extra steps", "instant online chat"],
  ["anonymous-chat-room", "Anonymous Chat Room", "Join an anonymous chat room style experience where matching is immediate and conversations stay simple.", "using the feel of a chat room without the noise of crowded public channels", "anonymous room-style chat"],
  ["random-chat-room", "Random Chat Room", "A random chat room on Strango gives you a direct path to one-on-one text conversations with new people.", "moving from interest to conversation without waiting through public room clutter", "focused random room chat"],
  ["free-chat-room", "Free Chat Room Online", "Use a free chat room experience designed for quick anonymous text conversations and easy exits.", "trying online chat without cost, registration, or a profile commitment", "free room-style chat"],
  ["text-chat-with-strangers", "Text Chat With Strangers", "Text chat with strangers on Strango is built for people who prefer typing, privacy, and a calmer pace.", "keeping conversations text-first instead of camera-first or profile-first", "private text chat"],
  ["private-chat-online", "Private Chat Online", "Private chat online should feel clear, respectful, and easy to control. Strango keeps the experience direct.", "starting a private conversation with fewer distractions and more personal control", "private online messaging"],
  ["secure-anonymous-chat", "Secure Anonymous Chat", "Secure anonymous chat on Strango focuses on simple controls, safety guidance, and reduced identity exposure.", "choosing anonymous chat with practical trust signals and transparent expectations", "security-minded anonymous chat"],
  ["online-chat-with-random-people", "Online Chat With Random People", "Meet random people online through a fast text chat experience that stays lightweight and easy to use.", "discovering new perspectives without joining another full social platform", "random people online"],
  ["meet-new-people-online", "Meet New People Online", "Strango helps you meet new people online through quick anonymous matching and polished real-time messaging.", "opening the door to new conversations without pressure or profile building", "meeting new people"],
  ["chat-with-random-people", "Chat With Random People", "Chat with random people in a simple messenger built for anonymous, real-time, one-on-one conversation.", "finding a fresh conversation when you want a quick change of perspective", "random one-on-one chat"],
  ["safe-anonymous-chat", "Safe Anonymous Chat", "Safe anonymous chat begins with clear expectations, simple controls, and a platform designed around privacy-aware behavior.", "chatting anonymously while staying mindful about boundaries and personal information", "safer anonymous chat"],
  ["instant-chat-online", "Instant Chat Online", "Instant chat online with Strango means opening the page, starting chat, and matching without unnecessary steps.", "getting from intent to conversation as quickly as possible", "instant messaging with strangers"],
  ["no-signup-chat", "No Signup Chat", "No signup chat lets you start talking without creating a profile, username history, or public account.", "reducing friction for people who want a conversation without a sign-up wall", "no-account chat"],
  ["chat-without-registration", "Chat Without Registration", "Chat without registration on Strango and keep the experience simple, fast, and focused on the conversation.", "avoiding registration forms when a quick anonymous conversation is enough", "registration-free chat"],
  ["real-time-chat", "Real-Time Chat Online", "Real-time chat on Strango gives you responsive anonymous messaging with a modern product feel.", "keeping conversations immediate, clear, and easy to follow", "real-time anonymous messaging"]
].map(([slug, h1, description, angle, useCase]) => ({
  slug,
  type: "seo",
  eyebrow: "Anonymous Chat",
  h1,
  title: `${h1} - Strango`,
  description,
  angle,
  useCase
}));

const omeglePages = [
  ["omegle-alternative", "Omegle Alternative for Text Chat", "A modern Omegle alternative for anonymous text conversations with clean design, fast matching, and safety-focused guidance."],
  ["best-omegle-alternative", "Best Omegle Alternative for Anonymous Chat", "Compare why Strango is a strong Omegle alternative for people who want privacy-aware text chat without complicated setup."],
  ["free-omegle-alternative", "Free Omegle Alternative", "Use Strango as a free Omegle alternative for anonymous random text chat with a polished product experience."],
  ["safe-omegle-alternative", "Safe Omegle Alternative", "A safer Omegle alternative starts with text-first chat, clear safety expectations, and simple controls."],
  ["anonymous-omegle-alternative", "Anonymous Omegle Alternative", "Strango gives anonymous chat users an Omegle-style discovery flow with a cleaner, calmer interface."],
  ["random-chat-alternative", "Random Chat Alternative", "A random chat alternative for people who want simple anonymous messaging and instant matching."],
  ["omegle-replacement", "Omegle Replacement for Text Chat", "Strango is built as an Omegle replacement for users who prefer private text conversations over noisy public feeds."],
  ["sites-like-omegle", "Sites Like Omegle for Text Chat", "Looking for sites like Omegle? Strango focuses on anonymous text chat, fast matching, and trust-focused design."],
  ["omegle-alternatives-for-text-chat", "Omegle Alternatives for Text Chat", "Explore why Strango works well for people seeking Omegle alternatives centered on text chat."]
].map(([slug, h1, description]) => ({
  slug,
  type: "omegle",
  eyebrow: "Omegle Alternative",
  h1,
  title: `${h1} - Strango`,
  description
}));

const comparisonTargets = [
  ["omegle-vs-strango", "Omegle", "Omegle vs Strango", "Compare Omegle and Strango for anonymous text chat, privacy-aware design, safety guidance, and ease of use."],
  ["emerald-chat-vs-strango", "Emerald Chat", "Emerald Chat vs Strango", "Compare Emerald Chat and Strango for users who want simpler anonymous text chat and lower-friction matching."],
  ["chatroulette-vs-strango", "Chatroulette", "Chatroulette vs Strango", "Compare Chatroulette and Strango for people who prefer text-first random chat over camera-first discovery."],
  ["ometv-vs-strango", "OmeTV", "OmeTV vs Strango", "Compare OmeTV and Strango for anonymous conversations, simple controls, and privacy-aware text chat."],
  ["chatrandom-vs-strango", "Chatrandom", "Chatrandom vs Strango", "Compare Chatrandom and Strango for random chat users who want a cleaner text-focused experience."],
  ["monkey-app-vs-strango", "Monkey App", "Monkey App vs Strango", "Compare Monkey App and Strango for lightweight conversations, privacy expectations, and text chat simplicity."],
  ["chatspin-vs-strango", "Chatspin", "Chatspin vs Strango", "Compare Chatspin and Strango for random chat, text-first matching, and safer anonymous conversation habits."],
  ["camsurf-vs-strango", "Camsurf", "Camsurf vs Strango", "Compare Camsurf and Strango for people who want a calmer alternative focused on anonymous text chat."],
  ["talkwithstranger-vs-strango", "TalkWithStranger", "TalkWithStranger vs Strango", "Compare TalkWithStranger and Strango for chat discovery, privacy, and a modern anonymous messaging flow."],
  ["tinychat-vs-strango", "Tinychat", "Tinychat vs Strango", "Compare Tinychat and Strango for users choosing between room-style communities and simple one-on-one anonymous text chat."],
  ["best-random-chat-sites", "random chat sites", "Best Random Chat Sites", "Review what makes a random chat site useful and why Strango is designed for fast anonymous text conversations."]
].map(([slug, competitor, h1, description]) => ({
  slug,
  type: "comparison",
  competitor,
  eyebrow: "Comparison",
  h1,
  title: `${h1} - Strango`,
  description
}));

const trustPages = [
  ["how-strango-works", "How Strango Works", "Learn how Strango matches people for anonymous real-time text chat and what to expect before starting a conversation.", "explains the matching flow, chat controls, and privacy-minded experience"],
  ["is-strango-safe", "Is Strango Safe?", "Understand Strango safety expectations, privacy basics, and practical habits for anonymous online chat.", "answers common safety questions with clear, practical guidance"],
  ["anonymous-chat-safety", "Anonymous Chat Safety", "A safety guide for anonymous chat users, including boundaries, personal information, and reporting instincts.", "helps people chat anonymously with better awareness and boundaries"],
  ["how-to-stay-safe-online", "How to Stay Safe Online", "Practical online safety tips for anonymous chat, random messaging, and meeting new people online.", "covers everyday safety habits for online conversations"],
  ["what-is-anonymous-chat", "What Is Anonymous Chat?", "A clear explanation of anonymous chat, how it differs from social media, and when it is useful.", "defines anonymous chat for new users and searchers"],
  ["why-use-anonymous-chat", "Why Use Anonymous Chat?", "Explore why people use anonymous chat for low-pressure conversation, privacy, and fresh perspectives.", "explains the value of anonymous conversation"],
  ["safety-center", "Strango Safety Center", "The Strango Safety Center collects guidance for safer anonymous chat and more thoughtful online conversations.", "serves as a central trust and safety resource"],
  ["help-center", "Strango Help Center", "Find help for getting started, anonymous chat safety, privacy basics, and common Strango questions.", "answers product and support questions"]
].map(([slug, h1, description, angle]) => ({
  slug,
  type: "trust",
  eyebrow: "Trust & Help",
  h1,
  title: `${h1} - Strango`,
  description,
  angle
}));

const pages = [...seoLandingPages, ...omeglePages, ...comparisonTargets, ...trustPages];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function canonical(slug) {
  return `${SITE_URL}/${slug}`;
}

function breadcrumbSchema(page) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": page.h1, "item": canonical(page.slug) }
    ]
  };
}

function faqItems(page) {
  if (page.type === "comparison") {
    return [
      [`Is Strango a good alternative to ${page.competitor}?`, `Strango is a good fit if you want anonymous, text-first random chat with a clean interface and clear safety guidance. ${page.competitor} may suit different preferences, so the best choice depends on whether you want text simplicity, video features, public rooms, or account-based discovery.`],
      [`Does Strango require registration?`, "Strango is designed around a low-friction start. You can open the chat flow quickly without building a public profile first."],
      [`Why choose Strango for random chat?`, "Choose Strango if you want a calmer interface, anonymous matching, mobile-friendly design, and a product experience that keeps attention on the conversation."]
    ];
  }
  if (page.type === "omegle") {
    return [
      ["Is Strango an Omegle alternative?", "Yes. Strango is positioned as a modern anonymous text chat alternative for people who want random conversations without a heavy profile system."],
      ["Is Strango free to start?", "Yes. The core chat experience is built for quick access and low friction."],
      ["Does Strango focus on text chat?", "Yes. Strango emphasizes real-time text chat, which can feel calmer and more private than camera-first discovery."]
    ];
  }
  return [
    [`What is ${page.h1.toLowerCase()} on Strango?`, `${page.h1} on Strango means a simple anonymous text chat experience built around quick matching, privacy-aware design, and clear conversation controls.`],
    ["Do I need to create an account?", "No public profile is needed to start the main chat flow. The product is designed to reduce friction before the first conversation."],
    ["How can I chat more safely?", "Avoid sharing personal details, leave conversations that feel uncomfortable, and review Strango safety guidance before using anonymous chat."]
  ];
}

function faqSchema(page) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems(page).map(([question, answer]) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": { "@type": "Answer", "text": answer }
    }))
  };
}

function pageSchema(page) {
  if (page.type === "comparison") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": page.h1,
      "description": page.description,
      "mainEntityOfPage": canonical(page.slug),
      "author": { "@type": "Organization", "name": "Strango" },
      "publisher": { "@type": "Organization", "name": "Strango" }
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": page.h1,
    "description": page.description,
    "url": canonical(page.slug),
    "isPartOf": { "@type": "WebSite", "name": "Strango", "url": `${SITE_URL}/` }
  };
}

function navHtml() {
  return `<header class="site-header"><a class="brand" href="/" aria-label="Strango home"><span class="brand-mark">S</span><span>Strango</span></a><nav class="nav-links" aria-label="Main navigation"><a href="/talk-to-strangers">Talk</a><a href="/anonymous-chat">Anonymous</a><a href="/random-chat">Random</a><a href="/omegle-alternative">Alternative</a><a href="/help-center">Help</a></nav></header>`;
}

function linkList(links) {
  return links.map((link) => `<a href="${link.href}">${link.label}</a>`).join("");
}

function ctaBlock() {
  return `<div class="seo-cta"><h2>Start a conversation on Strango</h2><p>Open the chat experience when you are ready for a simple anonymous text conversation with someone new.</p><a class="button primary" href="/#chat">Start Chatting</a></div>`;
}

function coreContent(page) {
  return `
    <p>${page.description} This page is written for people who want ${page.angle}. Strango keeps the experience focused on real-time text conversation, clear controls, and a calmer product feel than crowded public chat rooms.</p>
    <h2>Why ${escapeHtml(page.h1)} matters</h2>
    <p>People search for ${escapeHtml(page.h1.toLowerCase())} when they want connection without the weight of a full social profile. A good anonymous chat product should make it easy to begin, easy to leave, and easy to understand what kind of experience you are entering. Strango is designed around that balance: fast matching, text-first conversation, no public profile requirement, and safety guidance that encourages careful choices.</p>
    <p>The best use case is ${escapeHtml(page.useCase)}. You might want a quick exchange during a break, a different perspective from someone outside your usual circle, or a low-pressure place to practice starting conversations. Strango keeps the interface direct so the product does not get in the way of the human moment.</p>
    <h2>What makes Strango different</h2>
    <p>Strango is not trying to feel like an old dashboard, a busy forum, or a feed full of profiles. The experience is closer to a focused messaging app: open the page, start chatting, and match into a conversation. That simplicity is important for anonymous chat because extra complexity often creates confusion about identity, persistence, and expectations.</p>
    <p>The platform also keeps safety information visible through resources such as the <a href="/safety-center">Safety Center</a>, <a href="/anonymous-chat-safety">Anonymous Chat Safety</a>, and <a href="/how-to-stay-safe-online">online safety guide</a>. Those pages help users understand boundaries before they begin.</p>
    <h2>How to get better conversations</h2>
    <p>Start with a friendly opener, keep expectations realistic, and avoid sharing personal details. If a conversation does not feel right, move on. Anonymous chat works best when both people treat the interaction as temporary, respectful, and voluntary. Short conversations can still be meaningful when the interface is fast and the rules are clear.</p>
    <p>For related experiences, explore <a href="/random-chat">Random Chat</a>, <a href="/chat-with-strangers">Chat With Strangers</a>, <a href="/no-signup-chat">No Signup Chat</a>, and <a href="/omegle-alternative">Omegle Alternative</a>.</p>
    <h2>Who should use this page</h2>
    <p>This guide is useful if you are comparing anonymous text chat options, deciding whether a no-registration chat flow is right for you, or looking for a simpler way to meet random people online. It is also useful if you want a chat experience that feels more like a modern product and less like an unmoderated page from an older web era.</p>
    <p>Strango is still a conversation tool, so personal judgment matters. Keep private information private, respect boundaries, and use the product for lightweight conversation rather than risky disclosures. The goal is a better first message, not a permanent identity system.</p>
    <h2>What a good session feels like</h2>
    <p>A good ${escapeHtml(page.h1.toLowerCase())} session usually feels simple from the first click. You understand what the page offers, you can start the chat without decoding a complicated interface, and you can focus on the person on the other side. Strango is built around that rhythm. The homepage explains the product, the chat opens when you intentionally start it, and the conversation area stays focused on messages instead of unrelated widgets.</p>
    <p>This matters because many people searching for anonymous chat are not looking for another full social platform. They want a moment of connection, a place to talk, or a quick way to meet someone outside their routine. Strango supports that by keeping the product lightweight while still giving users access to trust pages, help resources, and internal guides about safer behavior.</p>
    <h2>Before you start chatting</h2>
    <p>Think about what you want from the conversation before you begin. A simple hello, a question about someone's day, or a topic you enjoy can make the first exchange easier. If the other person does not match your tone, move on politely. The most useful anonymous chat experiences are voluntary, brief when needed, and respectful on both sides.</p>
    <p>For a complete path through the site, start with <a href="/what-is-anonymous-chat">What Is Anonymous Chat?</a>, continue to <a href="/why-use-anonymous-chat">Why Use Anonymous Chat?</a>, and then try the chat flow from the homepage. That internal path gives both context and a practical next step.</p>`;
}

function omegleContent(page) {
  return `
    <p>${page.description} Many people looking for Omegle-style chat want the same core idea: meet someone unexpected and start talking quickly. Strango focuses that idea into a text-first experience with less clutter, clearer trust pages, and a modern interface.</p>
    <h2>Benefits of choosing Strango</h2>
    <p>Strango is built for users who prefer anonymous text chat over complicated profile browsing. The main benefit is speed: you can move from landing page to conversation without a long setup flow. The second benefit is clarity. The interface explains the product without pretending the homepage is the full app, and the chat experience opens only when you choose to start.</p>
    <p>Another benefit is safety context. Anonymous chat always requires good judgment, so Strango links to guidance about staying safe online, anonymous chat boundaries, and community expectations. That makes the experience easier to understand for new users and more trustworthy for returning users.</p>
    <h2>Comparison overview</h2>
    <table class="seo-table"><thead><tr><th>Feature</th><th>Strango</th><th>Typical older random chat</th></tr></thead><tbody><tr><td>Primary mode</td><td>Anonymous text chat</td><td>Often mixed or video-first</td></tr><tr><td>Start flow</td><td>Quick start from the homepage</td><td>May include more distractions</td></tr><tr><td>Design</td><td>Modern product-style interface</td><td>Often utility or widget-like</td></tr><tr><td>Safety resources</td><td>Dedicated help and safety pages</td><td>Varies by platform</td></tr></tbody></table>
    <h2>When Strango is a better fit</h2>
    <p>Strango is a better fit when you want text chat, anonymity, and a calmer interface. It is not trying to become a social network, public room directory, or profile marketplace. The product is built around simple matching and conversation control.</p>
    <p>Explore related pages like <a href="/free-omegle-alternative">Free Omegle Alternative</a>, <a href="/safe-omegle-alternative">Safe Omegle Alternative</a>, <a href="/sites-like-omegle">Sites Like Omegle</a>, and <a href="/random-chat-alternative">Random Chat Alternative</a>.</p>
    <h2>Safety and expectations</h2>
    <p>Any random chat product depends on user judgment. Avoid sharing private information, leave uncomfortable chats, and remember that anonymous conversations are best treated as temporary. Strango supports that mindset with a direct interface and easy access to safety guidance.</p>
    <p>If you want to compare specific platforms, read <a href="/omegle-vs-strango">Omegle vs Strango</a>, <a href="/chatroulette-vs-strango">Chatroulette vs Strango</a>, or <a href="/best-random-chat-sites">Best Random Chat Sites</a>.</p>
    <h2>What to look for in an alternative</h2>
    <p>A useful Omegle alternative should do more than copy the old idea of random matching. It should make the entry point clear, explain whether the experience is text-first or video-first, and provide enough safety context for users to make informed decisions. Strango focuses on text because typing can feel calmer, less exposed, and easier to leave when a conversation is not right.</p>
    <p>Design also matters. A chat product that looks rushed can make users question whether the experience is trustworthy. Strango uses a cleaner homepage, dedicated landing pages, and a focused chat interface so the product feels intentional. That does not remove every risk of anonymous conversation, but it does make the environment easier to understand.</p>
    <h2>How Strango supports discovery</h2>
    <p>The discovery model is simple: open the site, choose to start chatting, and enter a real-time text conversation. This is useful for people who want a quick exchange without choosing rooms, filling out profile fields, or browsing public user lists. The product keeps the pathway short while still linking to pages about privacy, safety, and how anonymous chat works.</p>
    <p>For a broader journey, visit <a href="/anonymous-chat">Anonymous Chat</a>, <a href="/random-chat">Random Chat</a>, <a href="/text-chat-with-strangers">Text Chat With Strangers</a>, and <a href="/secure-anonymous-chat">Secure Anonymous Chat</a>. Those pages explain the same product from different search intents without requiring users to guess what Strango does.</p>`;
}

function comparisonContent(page) {
  const competitor = escapeHtml(page.competitor);
  return `
    <p>${page.description} This comparison is written for people choosing between ${competitor} and Strango for online conversations. The right choice depends on whether you want profile features, video discovery, public rooms, or a simpler anonymous text-first product.</p>
    <h2>Comparison table</h2>
    <table class="seo-table"><thead><tr><th>Category</th><th>Strango</th><th>${competitor}</th></tr></thead><tbody><tr><td>Core focus</td><td>Anonymous real-time text chat</td><td>Depends on the platform experience and feature mix</td></tr><tr><td>Best for</td><td>Low-friction private conversations</td><td>Users who prefer that platform's discovery style</td></tr><tr><td>Profile requirement</td><td>Designed around quick access</td><td>May vary by feature and region</td></tr><tr><td>Interface style</td><td>Modern, focused, product-led</td><td>May feel more like a directory, room, or legacy random chat flow</td></tr><tr><td>Safety emphasis</td><td>Dedicated safety and help resources</td><td>Varies by product policy and implementation</td></tr></tbody></table>
    <h2>Pros and cons</h2>
    <div class="seo-grid"><section><h3>Strango pros</h3><ul><li>Text-first anonymous chat flow.</li><li>Quick start from the homepage.</li><li>Modern visual design and mobile-friendly layout.</li><li>Internal safety and privacy resources.</li></ul></section><section><h3>Things to consider</h3><ul><li>It is focused on simple chat rather than a large social network.</li><li>Anonymous chat still requires personal judgment.</li><li>Feature needs vary by user preference.</li></ul></section></div>
    <h2>Why choose Strango</h2>
    <p>Choose Strango if your priority is a clean anonymous text chat experience. The product is designed to reduce friction before the first message and to keep the interface focused once the conversation begins. That makes it appealing for people who want a quick exchange without navigating profiles, rooms, or heavy account systems.</p>
    <p>Strango also provides internal trust pages like <a href="/is-strango-safe">Is Strango Safe?</a>, <a href="/anonymous-chat-safety">Anonymous Chat Safety</a>, and <a href="/how-strango-works">How Strango Works</a>. Those pages make expectations easier to understand before you chat.</p>
    <h2>Which option is right for you?</h2>
    <p>If you want a simple text conversation with someone random, Strango is a strong option. If you want a different format, such as public rooms, camera-first matching, or a profile-based network, another platform may fit better. The important thing is matching the product to the kind of conversation you actually want.</p>
    <p>For more comparisons, see <a href="/omegle-vs-strango">Omegle vs Strango</a>, <a href="/chatroulette-vs-strango">Chatroulette vs Strango</a>, and <a href="/best-random-chat-sites">Best Random Chat Sites</a>.</p>
    <h2>Decision guide</h2>
    <p>When comparing ${competitor} with Strango, start by naming your preferred format. Some users want video discovery, some want public communities, and some simply want a private text conversation with a random person. Strango is strongest in the third case. It keeps the product focused on anonymous messaging and avoids turning the experience into a large public profile system.</p>
    <p>The next factor is comfort. A calmer interface can make it easier to decide whether to continue a chat or leave. Strango's design emphasizes direct controls, a clear start point, and internal safety resources. That combination is useful for people who are curious about random chat but do not want the noise of a crowded room or the pressure of camera-first matching.</p>
    <h2>Safety comparison</h2>
    <p>No comparison page can guarantee that one online chat product is right for every user. Safety depends on product design, user behavior, moderation expectations, and personal judgment. Strango's approach is to provide a text-first flow, reduce unnecessary identity exposure, and keep educational safety links close to the chat experience. Users should still avoid sharing sensitive details and should leave any conversation that feels wrong.</p>
    <p>If your priority is a lightweight place to talk, Strango is worth trying. If your priority is a different format that ${competitor} specializes in, compare carefully and choose the product that matches your expectations. Either way, the safest habit is to keep boundaries clear from the first message.</p>`;
}

function trustContent(page) {
  return `
    <p>${page.description} This resource ${page.angle}. Strango is designed for anonymous text chat, which means the product must be simple, clear, and honest about the role of user judgment.</p>
    <h2>What users should know</h2>
    <p>Anonymous chat can be useful because it lowers the pressure of starting a conversation. At the same time, it should be used carefully. Do not share private information, financial details, location data, or anything that could identify you. If a chat feels uncomfortable, leave and start again.</p>
    <p>Strango keeps the experience text-first and direct. The homepage explains the product, the chat opens when you choose to start, and related resources provide context for safety, privacy, and better conversation habits.</p>
    <h2>Trust principles</h2>
    <p>The most important principles are clarity, control, and restraint. Clarity means users should understand what the product does before they begin. Control means users should be able to move on from a conversation. Restraint means the product should avoid unnecessary identity collection or confusing social features when the core use case is simple chat.</p>
    <p>Use <a href="/anonymous-chat-safety">Anonymous Chat Safety</a>, <a href="/how-to-stay-safe-online">How To Stay Safe Online</a>, and <a href="/community-guidelines">Community Guidelines</a> as companion resources before chatting.</p>
    <h2>How Strango fits into online chat</h2>
    <p>Strango is useful for short conversations, meeting new people online, and exploring anonymous text chat without building a public profile. It is not a substitute for emergency support, professional advice, or trusted personal relationships. Treat chats as temporary interactions and keep boundaries clear.</p>
    <p>If you are new to Strango, read <a href="/how-strango-works">How Strango Works</a>, then try <a href="/talk-to-strangers">Talk To Strangers</a> or <a href="/random-chat">Random Chat</a> when you are ready.</p>
    <h2>Practical safety checklist</h2>
    <ul><li>Keep personal information private.</li><li>Leave any conversation that feels unsafe or manipulative.</li><li>Do not move to another platform unless you trust the situation.</li><li>Remember that anonymous chat is best for lightweight conversation.</li><li>Use Strango safety resources to understand expectations.</li></ul>
    <p>These habits make anonymous chat more useful and reduce unnecessary risk. The best experience is simple: start respectfully, stay aware, and leave when the conversation is no longer right for you.</p>
    <h2>How to use this resource</h2>
    <p>Use this page as a reference before starting a chat or when comparing Strango with other random chat products. The goal is not to make anonymous chat sound risk-free. The goal is to make the experience easier to understand so users can make better choices. A trustworthy chat product should explain what it offers, link to safety resources, and avoid hiding important expectations behind vague marketing language.</p>
    <p>For new users, the recommended path is simple. First, understand the basics of anonymous chat. Second, read the safety guidance that applies to online conversations. Third, start a chat only when you are comfortable with the temporary and anonymous nature of the interaction. That sequence helps reduce confusion and sets better expectations for both people in the conversation.</p>
    <h2>Related Strango guidance</h2>
    <p>Strango's trust content is connected intentionally. <a href="/what-is-anonymous-chat">What Is Anonymous Chat?</a> explains the concept, <a href="/why-use-anonymous-chat">Why Use Anonymous Chat?</a> explains the motivation, <a href="/is-strango-safe">Is Strango Safe?</a> addresses common concerns, and <a href="/how-strango-works">How Strango Works</a> explains the product flow. Together, these pages create a clearer path for users who want to understand the service before using it.</p>
    <p>If you are ready to try the product, return to the homepage and use the Start Chatting button. Keep the safety checklist in mind, start with a respectful message, and remember that leaving a chat is always an acceptable choice when the conversation is not right for you.</p>`;
}

function bodyContent(page) {
  if (page.type === "comparison") return comparisonContent(page);
  if (page.type === "omegle") return omegleContent(page);
  if (page.type === "trust") return trustContent(page);
  return coreContent(page);
}

function nextStepContent(page) {
  return `<section><h2>Next step for ${escapeHtml(page.h1)}</h2><p>Use this page as a practical entry point, then follow the related internal links to understand the wider Strango experience. The most important path is simple: learn what anonymous chat means, review safety expectations, compare alternatives if needed, and start chatting only when the product matches your intent. Strango's SEO pages are connected so users and search engines can move from broad questions to specific actions without landing on thin or isolated content. That structure supports better discovery while keeping the product promise clear: anonymous, real-time text chat with a modern interface and a privacy-aware mindset.</p></section>`;
}

function schemaScripts(page) {
  return [pageSchema(page), faqSchema(page), breadcrumbSchema(page)]
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join("");
}

function faqHtml(page) {
  return `<section class="seo-faq"><h2>FAQ</h2>${faqItems(page).map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}</section>`;
}

function renderSeoPage(page) {
  const allLinks = page.type === "comparison" ? [...coreLinks, ...startLinks] : coreLinks;
  const uniqueLinks = allLinks.filter((link, index, arr) => arr.findIndex((item) => item.href === link.href) === index);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical(page.slug)}">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:type" content="${page.type === "comparison" ? "article" : "website"}">
  <meta property="og:url" content="${canonical(page.slug)}">
  <meta property="og:site_name" content="Strango">
  <meta property="og:image" content="${SITE_URL}/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
  <script src="/theme.js"></script>
  ${schemaScripts(page)}
</head>
<body>
  ${navHtml()}
  <main class="page-main seo-page">
    <nav class="seo-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>${escapeHtml(page.h1)}</span></nav>
    <section class="page-hero">
      <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <div class="hero-actions"><a class="button primary" href="/#chat">Start Chatting</a><a class="button secondary" href="/safety-center">Safety Center</a></div>
    </section>
    <article class="content-card seo-article">
      ${bodyContent(page)}
      ${nextStepContent(page)}
      ${ctaBlock()}
      <section class="seo-links"><h2>Related Strango pages</h2>${linkList(uniqueLinks)}</section>
      ${faqHtml(page)}
    </article>
  </main>
  <footer class="footer">${linkList(coreLinks)}<a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms</a></footer>
</body>
</html>`;
}

function renderSitemap() {
  const staticRoutes = [
    ["", "1.0"],
    ["about", "0.7"],
    ["contact", "0.7"],
    ["privacy-policy", "0.7"],
    ["terms-of-service", "0.7"],
    ["community-guidelines", "0.7"],
    ["help", "0.8"],
    ["help/chat", "0.7"],
    ["help/getting-started", "0.7"],
    ["help/safety", "0.7"],
    ["help/privacy", "0.7"]
  ];
  const seoRoutes = pages.map((page) => [page.slug, page.type === "comparison" ? "0.82" : "0.9"]);
  const rows = [...staticRoutes, ...seoRoutes]
    .map(([slug, priority]) => `  <url>\n    <loc>${SITE_URL}/${slug}</loc>\n    <priority>${priority}</priority>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

const pageMap = new Map(pages.map((page) => [`/${page.slug}`, page]));

module.exports = {
  SITE_URL,
  pages,
  pageMap,
  renderSeoPage,
  renderSitemap
};
