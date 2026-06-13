export const communities = [
  { slug: "ai", name: "AI Collective", category: "AI", icon: "AI", mark: "brain", accent: "#8b5cf6", accent2: "#4f46e5", description: "Practical AI workflows, model news, research, and honest conversations about what comes next.", members: "24.8k", online: 684, color: "#d8d4fe", featured: true, activity: "12 new posts today", trends: ["Agents", "Open models", "AI careers"] },
  { slug: "technology", name: "Builders & Tech", category: "Technology", icon: "</>", mark: "code", accent: "#3b82f6", accent2: "#06b6d4", description: "Products, engineering, startups, and the systems shaping tomorrow.", members: "18.6k", online: 396, color: "#cfe3ff", featured: true, activity: "Live room active", trends: ["Ship faster", "Dev tools", "System design"] },
  { slug: "finance", name: "Finance Circle", category: "Finance", icon: "$", mark: "chart", accent: "#10b981", accent2: "#0f766e", description: "Money habits, investing, taxes, and markets explained without the noise.", members: "18.4k", online: 284, color: "#c9f1dc", featured: true, activity: "8 new discussions", trends: ["Market outlook", "SIP strategy", "Tax planning"] },
  { slug: "gaming", name: "Gaming Lounge", category: "Gaming", icon: "GG", mark: "game", accent: "#ec4899", accent2: "#8b5cf6", description: "Releases, competitive play, builds, reviews, and relaxed squad talk.", members: "11.2k", online: 321, color: "#e8dcff", featured: true, activity: "Tournament tonight", trends: ["Squad finder", "New releases", "Esports"] },
  { slug: "students", name: "Student Desk", category: "Students", icon: "ST", mark: "book", accent: "#f59e0b", accent2: "#ea580c", description: "Study rooms, career questions, exams, campus life, and peer support.", members: "9.7k", online: 173, color: "#ffedc5", activity: "Study sprint live", trends: ["Exam prep", "AI learning", "Career paths"] },
  { slug: "fitness", name: "Everyday Fitness", category: "Fitness", icon: "FT", mark: "activity", accent: "#22c55e", accent2: "#14b8a6", description: "Sustainable training, nutrition, mobility, recovery, and accountability.", members: "8.9k", online: 126, color: "#d7f3e8", activity: "42 check-ins today", trends: ["Mobility", "Protein basics", "Run club"] },
  { slug: "movies", name: "Screen Society", category: "Movies", icon: "MV", mark: "film", accent: "#f43f5e", accent2: "#db2777", description: "Films, streaming, recommendations, reviews, and sharp cultural debates.", members: "7.4k", online: 76, color: "#fbd9e8", activity: "Watchlist updated", trends: ["Weekend watch", "New releases", "Film craft"] },
  { slug: "startups", name: "Startup Foundry", category: "Startups", icon: "SU", mark: "rocket", accent: "#6366f1", accent2: "#2563eb", description: "Build in public, customer discovery, fundraising, product craft, and founder support.", members: "6.8k", online: 92, color: "#d6e7ff", activity: "Pitch review at 6 PM", trends: ["Customer calls", "Fundraising", "Launch notes"] },
  { slug: "self-improvement", name: "Better Every Day", category: "Fitness", icon: "+", mark: "growth", accent: "#f97316", accent2: "#eab308", description: "Practical habits, books, routines, focus, health, and accountability.", members: "8.1k", online: 98, color: "#ffe1dd", activity: "Habit circle active", trends: ["Deep work", "Sleep", "Atomic habits"] }
];

export const discussions = [
  { id: "best-investment-advice", community: "Finance Circle", communitySlug: "finance", author: "Aarav K.", time: "8 min", title: "What is your best investment advice?", body: "Not a stock tip. What principle has saved you from the most expensive mistakes over time?", votes: 284, comments: 63, viewers: 48, tag: "Finance" },
  { id: "ai-replace-engineers", community: "AI Collective", communitySlug: "ai", author: "Mira S.", time: "16 min", title: "Will AI replace software engineers?", body: "Which parts of the job change first, and which human skills become more valuable as coding gets cheaper?", votes: 397, comments: 118, viewers: 91, tag: "AI" },
  { id: "best-productivity-habit", community: "Better Every Day", communitySlug: "self-improvement", author: "Ghost 148", time: "24 min", title: "What is your best productivity habit?", body: "Looking for one small practice that survives busy weeks, low motivation, and changing schedules.", votes: 219, comments: 82, viewers: 37, tag: "Productivity" },
  { id: "students-learn-ai", community: "Student Desk", communitySlug: "students", author: "Naina P.", time: "31 min", title: "Should students learn AI before they learn to code?", body: "Could AI-first learning build confidence, or does it make the fundamentals harder to understand later?", votes: 263, comments: 94, viewers: 72, tag: "Students" },
  { id: "games-with-great-communities", community: "Gaming Lounge", communitySlug: "gaming", author: "NovaPlayer", time: "41 min", title: "Games with genuinely welcoming communities?", body: "Looking for something social where a new player can learn without being treated like a burden.", votes: 163, comments: 54, viewers: 44, tag: "Gaming" },
  { id: "founder-customer-interviews", community: "Startup Foundry", communitySlug: "startups", author: "Dev R.", time: "1 hr", title: "What changed after your first 20 customer interviews?", body: "Share the assumption you were most confident about and the thing customers proved wrong.", votes: 142, comments: 36, viewers: 29, tag: "Startups" }
];

export const liveConversations = [
  { id: "market-open", title: "Market open: what are you watching?", topic: "Finance", people: 38, duration: "42 min", accent: "#14b8a6", speakers: ["AK", "MS", "RV"] },
  { id: "build-in-public", title: "Building in public without burning out", topic: "Startups", people: 24, duration: "28 min", accent: "#6366f1", speakers: ["NJ", "PI", "SG"] },
  { id: "ai-careers", title: "AI careers: skills worth learning now", topic: "Technology", people: 67, duration: "1 hr 06 min", accent: "#8b5cf6", speakers: ["MR", "AN", "KV"] },
  { id: "late-night-study", title: "Late night study check-in", topic: "Students", people: 51, duration: "54 min", accent: "#f59e0b", speakers: ["GS", "AN", "K"] },
  { id: "open-mic", title: "Open mic: stories from this week", topic: "Community", people: 17, duration: "19 min", accent: "#ec4899", speakers: ["R", "ZM", "AT"] }
];

export const rooms = [
  { id: "ai-lounge", title: "AI Lounge", category: "Technology", description: "Tools, model releases, prompts, workflows, and thoughtful AI debate.", people: 74, status: "Very active", color: "#8b5cf6" },
  { id: "finance-talk", title: "Finance Talk", category: "Finance", description: "Markets, money decisions, and practical personal finance.", people: 42, status: "Active now", color: "#14b8a6" },
  { id: "study-together", title: "Study Together", category: "Students", description: "Quiet focus sprints with lightweight accountability.", people: 86, status: "Focus sprint", color: "#f59e0b" },
  { id: "open-mic", title: "Open Mic", category: "Social", description: "Casual voice-led conversation and community stories.", people: 29, status: "Open stage", color: "#ec4899" },
  { id: "gaming-hub", title: "Gaming Hub", category: "Gaming", description: "Squad finder, recommendations, competitive talk, and launch nights.", people: 61, status: "High activity", color: "#3b82f6" }
];

export const notifications = [
  { type: "reply", title: "Mira replied to your discussion", detail: "That framework works especially well for long-term goals.", time: "4 min" },
  { type: "mention", title: "You were mentioned in Finance Circle", detail: "Could you share the calculator you used?", time: "18 min" },
  { type: "badge", title: "New badge: Helpful Voice", detail: "Your replies received 25 helpful reactions.", time: "1 hr" },
  { type: "invite", title: "Room invitation", detail: "Aarav invited you to Market open.", time: "3 hr" },
  { type: "message", title: "New message request", detail: "Mira S. wants to connect.", time: "Yesterday" }
];

export const messages = [
  { id: "mira", name: "Mira S.", status: "online", preview: "The summary was useful, thank you.", time: "10:42", unread: 2, avatar: "MS" },
  { id: "aarav", name: "Aarav K.", status: "last seen 8 min ago", preview: "Joining the finance room?", time: "10:18", unread: 0, avatar: "AK" },
  { id: "study", name: "Study Room Crew", status: "12 participants", preview: "Next sprint starts in five minutes.", time: "09:55", unread: 4, avatar: "SR" },
  { id: "nova", name: "NovaPlayer", status: "online", preview: "I sent the game list.", time: "Yesterday", unread: 0, avatar: "NP" }
];

export const icebreakers = [
  "What skill would you learn instantly?",
  "What place changed your life?",
  "If money wasn't a concern, what would you build?",
  "What small thing made your week better?",
  "What topic could you talk about for an hour?"
];
