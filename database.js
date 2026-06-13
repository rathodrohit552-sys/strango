const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "strango-db.json");
let mongoClient = null;
let mongoStateCollection = null;
let mongoWritePending = false;

const defaultCommunities = [
  ["ai", "AI Community", "AI", "AI tools, model updates, automation ideas, and practical workflows for builders and curious users.", "Purple", "126,87,194", "brain", ["General", "AI Tools", "ChatGPT", "Programming", "AI News"]],
  ["gaming", "Gaming Community", "Gaming", "Game launches, mobile picks, esports storylines, patches, builds, and player reactions.", "Green", "34,197,94", "gamepad", ["General", "GTA6", "Mobile Gaming", "Esports"]],
  ["finance", "Finance Community", "Finance", "Investing, saving, market moves, tax basics, and money habits explained in plain language.", "Gold", "217,151,31", "chart", ["General", "Stocks", "Mutual Funds", "Personal Finance"]],
  ["geopolitics", "Geopolitics Community", "Geopolitics", "Global strategy, diplomacy, trade, security, alliances, and regional power shifts.", "Red", "220,62,62", "globe", ["General", "India", "China", "BRICS", "Global News"]],
  ["bollywood", "Bollywood Community", "Bollywood", "Hindi cinema, music, box office chatter, actors, trailers, and industry updates.", "Pink", "236,72,153", "film", ["General", "Movies", "Actors", "Music", "Box Office"]],
  ["hollywood", "Hollywood Community", "Hollywood", "Global cinema, streaming releases, awards season, superhero debates, and director talk.", "Indigo", "99,102,241", "clapper", ["General", "Marvel", "Awards", "New Releases"]],
  ["self-improvement", "Self Improvement Community", "Self Improvement", "Habits, learning, productivity, books, confidence, routines, and discipline that lasts.", "Teal", "20,184,166", "spark", ["General", "Habits", "Productivity", "Books"]],
  ["beauty", "Beauty Community", "Beauty", "Skin care, hair care, makeup, product experiences, routines, and trend breakdowns.", "Rose", "244,63,94", "flower", ["General", "Skin Care", "Hair Care", "Trends"]],
  ["fifa-2026", "FIFA 2026 Community", "FIFA 2026", "World Cup predictions, team form, players to watch, fixtures, and matchday reactions.", "Blue", "37,99,235", "football", ["General", "Predictions", "Team Analysis", "Match Discussions"]]
];

function now() {
  return new Date().toISOString();
}

function createEmptyDb() {
  return {
    counters: {},
    users: [],
    profiles: [],
    sessions: [],
    communities: [],
    community_channels: [],
    community_members: [],
    community_messages: [],
    notifications: [],
    conversations: [],
    messages: [],
    user_sparks: [],
    posts: [],
    comments: [],
    reactions: [],
    community_roles: [],
    community_events: [],
    event_rsvps: [],
    voice_rooms: [],
    livestreams: [],
    moderation_actions: []
  };
}

function nextId(db, table) {
  db.counters[table] = (db.counters[table] || 0) + 1;
  return String(db.counters[table]);
}

function normalizeChannel(value) {
  return String(value || "General").trim();
}

function channelSlug(value) {
  return normalizeChannel(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}

function seedCommunities(db) {
  defaultCommunities.forEach(([slug, name, shortName, description, theme, rgb, icon, channels]) => {
    let community = db.communities.find((item) => item.slug === slug);
    if (!community) {
      community = {
        id: nextId(db, "communities"),
        slug,
        name,
        short_name: shortName,
        description,
        theme,
        rgb,
        icon,
        owner_id: null,
        created_at: now()
      };
      db.communities.push(community);
    } else {
      Object.assign(community, { name, short_name: shortName, description, theme, rgb, icon });
    }
    channels.forEach((channelName) => {
      const slugValue = channelSlug(channelName);
      if (!db.community_channels.some((channel) => channel.community_id === community.id && channel.slug === slugValue)) {
        db.community_channels.push({
          id: nextId(db, "community_channels"),
          community_id: community.id,
          slug: slugValue,
          name: normalizeChannel(channelName),
          created_at: now()
        });
      }
    });
  });
}

function loadDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  let db = createEmptyDb();
  if (fs.existsSync(dbPath)) {
    try {
      db = Object.assign(db, JSON.parse(fs.readFileSync(dbPath, "utf8")));
    } catch (error) {
      db = createEmptyDb();
    }
  }
  Object.keys(createEmptyDb()).forEach((key) => {
    if (key === "counters") {
      db.counters = db.counters || {};
    } else if (!Array.isArray(db[key])) {
      db[key] = [];
    }
  });
  seedCommunities(db);
  saveDb(db);
  return db;
}

let db = loadDb();

function saveDb(nextDb = db) {
  fs.writeFileSync(dbPath, JSON.stringify(nextDb, null, 2));
  if (mongoStateCollection && !mongoWritePending) {
    mongoWritePending = true;
    setImmediate(async () => {
      try {
        await mongoStateCollection.replaceOne(
          { _id: "strango-state" },
          { _id: "strango-state", snapshot: db, updated_at: now() },
          { upsert: true }
        );
      } catch (error) {
        console.error("[database] MongoDB snapshot write failed:", error.message);
      } finally {
        mongoWritePending = false;
      }
    });
  }
}

async function initializePersistence() {
  if (!process.env.MONGODB_URI) {
    console.log("[database] Using local JSON development store.");
    return { driver: "json" };
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI, {
    maxPoolSize: Number(process.env.MONGODB_POOL_SIZE || 10),
    serverSelectionTimeoutMS: 5000
  });
  await mongoClient.connect();
  const mongoDb = mongoClient.db(process.env.MONGODB_DB || "strango");
  mongoStateCollection = mongoDb.collection("platform_state");
  const stored = await mongoStateCollection.findOne({ _id: "strango-state" });

  if (stored && stored.snapshot) {
    const empty = createEmptyDb();
    Object.keys(empty).forEach((key) => {
      if (key === "counters") {
        db.counters = stored.snapshot.counters || {};
      } else {
        db[key] = Array.isArray(stored.snapshot[key]) ? stored.snapshot[key] : [];
      }
    });
    seedCommunities(db);
  } else {
    await mongoStateCollection.replaceOne(
      { _id: "strango-state" },
      { _id: "strango-state", snapshot: db, updated_at: now() },
      { upsert: true }
    );
  }

  await Promise.all([
    mongoStateCollection.createIndex({ updated_at: -1 }),
    mongoDb.collection("event_log").createIndex({ created_at: -1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })
  ]);
  console.log("[database] MongoDB persistence connected.");
  return { driver: "mongodb" };
}

function publicCommunity(community, onlineCount = 0) {
  const channels = db.community_channels.filter((channel) => channel.community_id === community.id);
  return {
    id: community.id,
    slug: community.slug,
    name: community.name,
    shortName: community.short_name,
    description: community.description,
    category: community.category || null,
    theme: community.theme,
    rgb: community.rgb,
    icon: community.icon,
    channels: channels.map((channel) => channel.name),
    memberCount: db.community_members.filter((member) => member.community_id === community.id).length,
    topicCount: db.posts.filter((post) => post.community_id === community.id).length,
    onlineCount
  };
}

function getBadge(memberNumber) {
  if (memberNumber === 1) return "Founder";
  if (memberNumber <= 10) return "Early Pioneer";
  if (memberNumber <= 25) return "Pioneer";
  if (memberNumber <= 50) return "Early Member";
  return "Member";
}

function awardSparks(userId, reason, points) {
  if (!userId || !points) return null;
  let sparks = db.user_sparks.find((item) => item.user_id === userId);
  if (!sparks) {
    sparks = { id: nextId(db, "user_sparks"), user_id: userId, points: 0, level: "Explorer", updated_at: now() };
    db.user_sparks.push(sparks);
  }
  sparks.points += points;
  sparks.level = sparks.points >= 500 ? "Pioneer" : sparks.points >= 250 ? "Veteran" : sparks.points >= 100 ? "Contributor" : sparks.points >= 30 ? "Connector" : "Explorer";
  sparks.updated_at = now();
  db.notifications.push({
    id: nextId(db, "notifications"),
    user_id: userId,
    type: "badge_earned",
    payload: { reason, points, total: sparks.points, level: sparks.level },
    read_at: null,
    created_at: now()
  });
  saveDb();
  return sparks;
}

function createUser({ authProvider, email, googleId, displayName, isAnonymous }) {
  const user = {
    id: nextId(db, "users"),
    auth_provider: authProvider,
    email: email || null,
    google_id: googleId || null,
    is_anonymous: Boolean(isAnonymous),
    access_mode: isAnonymous ? "ghost" : "profile",
    ghost_expires_at: isAnonymous ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : null,
    created_at: now()
  };
  db.users.push(user);
  db.profiles.push({
    id: nextId(db, "profiles"),
    user_id: user.id,
    display_name: displayName || (isAnonymous ? "Anonymous User" : "Strango User"),
    avatar_url: null,
    created_at: now(),
    updated_at: now()
  });
  db.user_sparks.push({ id: nextId(db, "user_sparks"), user_id: user.id, points: 0, level: "Explorer", updated_at: now() });
  saveDb();
  return user;
}

function createSession(userId) {
  const session = {
    id: nextId(db, "sessions"),
    token: "session-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    user_id: userId,
    created_at: now()
  };
  db.sessions.push(session);
  saveDb();
  return session;
}

function getSession(token) {
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.user_id);
  const profile = db.profiles.find((item) => item.user_id === session.user_id);
  return user ? { session, user, profile } : null;
}

function getOrCreateAnonymousSession(token) {
  const existing = getSession(token);
  if (existing) return existing;
  const user = createUser({ authProvider: "anonymous", isAnonymous: true, displayName: "Anonymous User" });
  const session = createSession(user.id);
  return { session, user, profile: db.profiles.find((item) => item.user_id === user.id) };
}

function joinCommunity(communitySlug, userId) {
  const community = db.communities.find((item) => item.slug === communitySlug);
  if (!community || !userId) return null;
  let member = db.community_members.find((item) => item.community_id === community.id && item.user_id === userId);
  if (member) return { community, member, firstJoin: false, badge: getBadge(member.member_number) };
  const memberNumber = db.community_members.filter((item) => item.community_id === community.id).length + 1;
  member = {
    id: nextId(db, "community_members"),
    community_id: community.id,
    user_id: userId,
    joined_at: now(),
    member_number: memberNumber,
    has_seen_welcome: true,
    role: "Member"
  };
  db.community_members.push(member);
  const badge = getBadge(memberNumber);
  db.notifications.push({
    id: nextId(db, "notifications"),
    user_id: userId,
    type: "community_join",
    payload: { community_id: community.id, member_number: memberNumber, badge },
    read_at: null,
    created_at: now()
  });
  db.notifications.push({
    id: nextId(db, "notifications"),
    user_id: userId,
    type: "badge_earned",
    payload: { community_id: community.id, badge },
    read_at: null,
    created_at: now()
  });
  saveDb();
  return { community, member, firstJoin: true, badge };
}

function getChannel(communityId, channelSlugValue) {
  return db.community_channels.find((channel) => channel.community_id === communityId && channel.slug === channelSlugValue);
}

function saveCommunityMessage({ communitySlug, channelName, userId, message }) {
  const community = db.communities.find((item) => item.slug === communitySlug);
  if (!community) return null;
  const channel = getChannel(community.id, channelSlug(channelName));
  if (!channel) return null;
  const record = {
    id: nextId(db, "community_messages"),
    community_id: community.id,
    channel_id: channel.id,
    user_id: userId,
    message: String(message || "").slice(0, 1000),
    created_at: now()
  };
  db.community_messages.push(record);
  awardSparks(userId, "discussion_message", 1);
  saveDb();
  return { record, community, channel };
}

function latestCommunityMessages(communitySlug, channelName, limit = 100) {
  const community = db.communities.find((item) => item.slug === communitySlug);
  if (!community) return [];
  const channel = getChannel(community.id, channelSlug(channelName));
  if (!channel) return [];
  return db.community_messages
    .filter((message) => message.community_id === community.id && message.channel_id === channel.id)
    .slice(-limit)
    .map((message) => {
      const profile = db.profiles.find((item) => item.user_id === message.user_id);
      const member = db.community_members.find((item) => item.community_id === community.id && item.user_id === message.user_id);
      return {
        id: message.id,
        community: community.slug,
        channel: channel.name,
        type: "message",
        author: profile ? profile.display_name : "Anonymous User",
        badge: member ? getBadge(member.member_number) : "Member",
        text: message.message,
        time: message.created_at
      };
    });
}

module.exports = {
  db,
  saveDb,
  initializePersistence,
  nextId,
  channelSlug,
  publicCommunity,
  getBadge,
  createUser,
  createSession,
  getSession,
  getOrCreateAnonymousSession,
  joinCommunity,
  saveCommunityMessage,
  latestCommunityMessages,
  awardSparks
};
