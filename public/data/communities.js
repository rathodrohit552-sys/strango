export const communities = [
  {
    slug: "ai",
    name: "AI Community",
    shortName: "AI",
    description: "AI tools, model updates, automation ideas, and practical workflows for builders and curious users.",
    theme: "Purple",
    rgb: "126,87,194",
    icon: "brain",
    channels: ["General", "AI Tools", "ChatGPT", "Programming", "AI News"]
  },
  {
    slug: "gaming",
    name: "Gaming Community",
    shortName: "Gaming",
    description: "Game launches, mobile picks, esports storylines, patches, builds, and player reactions.",
    theme: "Green",
    rgb: "34,197,94",
    icon: "gamepad",
    channels: ["General", "GTA6", "Mobile Gaming", "Esports"]
  },
  {
    slug: "finance",
    name: "Finance Community",
    shortName: "Finance",
    description: "Investing, saving, market moves, tax basics, and money habits explained in plain language.",
    theme: "Gold",
    rgb: "217,151,31",
    icon: "chart",
    channels: ["General", "Stocks", "Mutual Funds", "Personal Finance"]
  },
  {
    slug: "geopolitics",
    name: "Geopolitics Community",
    shortName: "Geopolitics",
    description: "Global strategy, diplomacy, trade, security, alliances, and regional power shifts.",
    theme: "Red",
    rgb: "220,62,62",
    icon: "globe",
    channels: ["General", "India", "China", "BRICS", "Global News"]
  },
  {
    slug: "bollywood",
    name: "Bollywood Community",
    shortName: "Bollywood",
    description: "Hindi cinema, music, box office chatter, actors, trailers, and industry updates.",
    theme: "Pink",
    rgb: "236,72,153",
    icon: "film",
    channels: ["General", "Movies", "Actors", "Music", "Box Office"]
  },
  {
    slug: "hollywood",
    name: "Hollywood Community",
    shortName: "Hollywood",
    description: "Global cinema, streaming releases, awards season, superhero debates, and director talk.",
    theme: "Indigo",
    rgb: "99,102,241",
    icon: "clapper",
    channels: ["General", "Marvel", "Awards", "New Releases"]
  },
  {
    slug: "self-improvement",
    name: "Self Improvement Community",
    shortName: "Self Improvement",
    description: "Habits, learning, productivity, books, confidence, routines, and discipline that lasts.",
    theme: "Teal",
    rgb: "20,184,166",
    icon: "spark",
    channels: ["General", "Habits", "Productivity", "Books"]
  },
  {
    slug: "beauty",
    name: "Beauty Community",
    shortName: "Beauty",
    description: "Skin care, hair care, makeup, product experiences, routines, and trend breakdowns.",
    theme: "Rose",
    rgb: "244,63,94",
    icon: "flower",
    channels: ["General", "Skin Care", "Hair Care", "Trends"]
  },
  {
    slug: "fifa-2026",
    name: "FIFA 2026 Community",
    shortName: "FIFA 2026",
    description: "World Cup predictions, team form, players to watch, fixtures, and matchday reactions.",
    theme: "Blue",
    rgb: "37,99,235",
    icon: "football",
    channels: ["General", "Predictions", "Team Analysis", "Match Discussions"]
  }
];

export function getCommunityBySlug(slug) {
  return communities.find(function(community) {
    return community.slug === slug;
  }) || null;
}
