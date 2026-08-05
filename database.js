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
    post_votes: [],
    post_saves: [],
    post_shares: [],
    reposts: [],
    post_media: [],
    polls: [],
    poll_options: [],
    poll_votes: [],
    view_events: [],
    drafts: [],
    community_roles: [],
    community_events: [],
    event_rsvps: [],
    voice_rooms: [],
    livestreams: [],
    moderation_actions: [],
    community_reports: [],
    subscriptions: [],
    user_intents: [],
    recommendation_feedback: [],
    user_privacy_settings: [],
    social_links: []
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
    community.rules = Array.isArray(community.rules) && community.rules.length
      ? community.rules
      : ["Be constructive and stay on topic.", "Protect private information.", "Report harmful content instead of escalating."];
    community.banner_url = community.banner_url || null;
    community.logo_url = community.logo_url || null;
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
  let visitorNumber = Number(db.counters.visitors || 0);
  db.users.forEach((user) => {
    if (!user.visitor_number) user.visitor_number = Number(user.id) || ++visitorNumber;
    visitorNumber = Math.max(visitorNumber, Number(user.visitor_number) || 0);
  });
  db.counters.visitors = visitorNumber;
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
  const ownerProfile = community.owner_id
    ? db.profiles.find((profile) => profile.user_id === community.owner_id)
    : null;
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
    logoUrl: community.logo_url || null,
    bannerUrl: community.banner_url || null,
    rules: Array.isArray(community.rules) ? community.rules : [],
    owner: ownerProfile ? { id: community.owner_id, displayName: ownerProfile.display_name } : null,
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
    visitor_number: (db.counters.visitors = (db.counters.visitors || 0) + 1),
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

function getCommunityRole(communityId, userId) {
  if (!communityId || !userId) return null;
  const role = db.community_roles.find((item) => item.community_id === communityId && item.user_id === userId);
  if (role) return role;
  const member = db.community_members.find((item) => item.community_id === communityId && item.user_id === userId);
  return member ? { community_id: communityId, user_id: userId, role: member.role || "Member", permissions: [] } : null;
}

function addModerationAction({ communityId, actorId, targetUserId = null, postId = null, action, reason = "" }) {
  const record = {
    id: nextId(db, "moderation_actions"),
    community_id: communityId,
    actor_id: actorId,
    target_user_id: targetUserId,
    post_id: postId,
    action,
    reason: String(reason || "").trim().slice(0, 500),
    created_at: now()
  };
  db.moderation_actions.push(record);
  saveDb();
  return record;
}

function communityRestriction(communityId, userId, action) {
  const relevant = db.moderation_actions
    .filter((item) => item.community_id === communityId && item.target_user_id === userId && item.action === action)
    .slice(-1)[0];
  if (!relevant) return null;
  if (relevant.expires_at && new Date(relevant.expires_at).getTime() <= Date.now()) return null;
  return relevant;
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

const intentTypes = new Set(["learn", "discuss", "meet", "build", "help", "explore"]);
const intentStatuses = new Set(["active", "paused", "completed", "expired", "cancelled"]);

function normalizeIntentType(value) {
  const type = String(value || "explore").trim().toLowerCase();
  return intentTypes.has(type) ? type : "explore";
}

function normalizeIntentStatus(value) {
  const status = String(value || "active").trim().toLowerCase();
  return intentStatuses.has(status) ? status : "active";
}

function publicIntent(intent) {
  return {
    id: intent.id,
    type: intent.intent_type,
    text: intent.custom_text,
    topicTags: intent.topic_tags || [],
    preferredFormat: intent.preferred_format,
    preferredDuration: intent.preferred_duration,
    language: intent.language,
    visibility: intent.visibility,
    status: intent.status,
    createdAt: intent.created_at,
    updatedAt: intent.updated_at,
    expiresAt: intent.expires_at,
    completedAt: intent.completed_at
  };
}

function listUserIntents(userId, { includeInactive = false, limit = 12 } = {}) {
  return db.user_intents
    .filter((intent) => intent.user_id === userId && (includeInactive || intent.status === "active"))
    .slice()
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, limit)
    .map(publicIntent);
}

function createUserIntent({ userId, type, text = "", topicTags = [], preferredFormat = "text", preferredDuration = "10", language = "English", visibility = "private", expiresAt = null }) {
  const record = {
    id: nextId(db, "user_intents"),
    user_id: userId,
    intent_type: normalizeIntentType(type),
    custom_text: String(text || "").trim().slice(0, 180),
    topic_tags: Array.isArray(topicTags) ? topicTags.map((tag) => String(tag).trim().slice(0, 32)).filter(Boolean).slice(0, 8) : [],
    preferred_format: ["text", "voice", "video"].includes(String(preferredFormat).toLowerCase()) ? String(preferredFormat).toLowerCase() : "text",
    preferred_duration: String(preferredDuration || "10").replace(/[^0-9]/g, "").slice(0, 3) || "10",
    language: String(language || "English").trim().slice(0, 40),
    visibility: ["private", "community", "public"].includes(String(visibility).toLowerCase()) ? String(visibility).toLowerCase() : "private",
    status: "active",
    created_at: now(),
    updated_at: now(),
    expires_at: expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    completed_at: null
  };
  db.user_intents.push(record);
  saveDb();
  return publicIntent(record);
}

function updateUserIntent(intentId, userId, patch = {}) {
  const intent = db.user_intents.find((item) => item.id === intentId && item.user_id === userId);
  if (!intent) return null;
  if (patch.type) intent.intent_type = normalizeIntentType(patch.type);
  if (Object.prototype.hasOwnProperty.call(patch, "text")) intent.custom_text = String(patch.text || "").trim().slice(0, 180);
  if (Array.isArray(patch.topicTags)) intent.topic_tags = patch.topicTags.map((tag) => String(tag).trim().slice(0, 32)).filter(Boolean).slice(0, 8);
  if (patch.preferredFormat) intent.preferred_format = ["text", "voice", "video"].includes(String(patch.preferredFormat).toLowerCase()) ? String(patch.preferredFormat).toLowerCase() : intent.preferred_format;
  if (patch.preferredDuration) intent.preferred_duration = String(patch.preferredDuration).replace(/[^0-9]/g, "").slice(0, 3) || intent.preferred_duration;
  if (patch.language) intent.language = String(patch.language).trim().slice(0, 40);
  if (patch.visibility) intent.visibility = ["private", "community", "public"].includes(String(patch.visibility).toLowerCase()) ? String(patch.visibility).toLowerCase() : intent.visibility;
  if (patch.status) {
    intent.status = normalizeIntentStatus(patch.status);
    intent.completed_at = intent.status === "completed" ? now() : intent.completed_at;
  }
  intent.updated_at = now();
  saveDb();
  return publicIntent(intent);
}

function deleteUserIntent(intentId, userId) {
  const before = db.user_intents.length;
  db.user_intents = db.user_intents.filter((intent) => !(intent.id === intentId && intent.user_id === userId));
  if (db.user_intents.length === before) return false;
  saveDb();
  return true;
}

function recordRecommendationFeedback({ userId, targetType, targetId, action, reason = "" }) {
  const allowedActions = new Set(["not_interested", "show_fewer", "hide_creator", "hide_community", "why", "reset", "mute_topic", "follow_topic", "report", "save", "show_more"]);
  const record = {
    id: nextId(db, "recommendation_feedback"),
    user_id: userId,
    target_type: String(targetType || "feed_item").slice(0, 40),
    target_id: String(targetId || "").slice(0, 80),
    action: allowedActions.has(String(action)) ? String(action) : "not_interested",
    reason: String(reason || "").trim().slice(0, 240),
    created_at: now()
  };
  db.recommendation_feedback.push(record);
  saveDb();
  return record;
}

const contentTypes = new Set(["discussion", "short_post", "standard_post", "reel"]);
const visibilityTypes = new Set(["public", "community", "followers", "private", "only_me"]);
const reactionTypes = new Set(["like", "helpful", "insightful", "support"]);

function normalizeContentType(value) {
  const raw = String(value || "discussion").trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (["post", "standard", "standard_post", "normal_post"].includes(raw)) return "standard_post";
  if (["short", "shortpost", "short_post", "thought"].includes(raw)) return "short_post";
  if (["reel", "reels", "video"].includes(raw)) return "reel";
  if (["discussion", "community_discussion", "reddit"].includes(raw)) return "discussion";
  return "discussion";
}

function normalizeVisibility(value, fallback = "community") {
  const raw = String(value || fallback).trim().toLowerCase().replace(/[-\s]+/g, "_");
  return visibilityTypes.has(raw) ? raw : fallback;
}

function normalizeText(value, limit) {
  return String(value || "").trim().slice(0, limit);
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((tag) => normalizeText(tag, 32)).filter(Boolean).slice(0, 8);
  return String(value || "")
    .split(/[#,]/)
    .map((tag) => normalizeText(tag, 32))
    .filter(Boolean)
    .slice(0, 8);
}

function isSafeHttpUrl(value) {
  const text = normalizeText(value, 800);
  if (!text) return "";
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeMedia(input, contentType) {
  const items = Array.isArray(input) ? input : input ? [input] : [];
  return items.map((item) => {
    const url = isSafeHttpUrl(typeof item === "string" ? item : item?.url);
    if (!url) return null;
    const kind = normalizeText(item?.kind || item?.type || (contentType === "reel" ? "video" : "image"), 20).toLowerCase();
    if (!["image", "video", "link"].includes(kind)) return null;
    return {
      id: "media-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      kind,
      url,
      thumbnailUrl: isSafeHttpUrl(item?.thumbnailUrl || item?.poster || ""),
      altText: normalizeText(item?.altText || item?.alt || "", 180)
    };
  }).filter(Boolean).slice(0, contentType === "standard_post" ? 4 : 1);
}

function getPostCommunity(post) {
  return post?.community_id ? db.communities.find((item) => item.id === post.community_id) : null;
}

function getUserProfile(userId) {
  return db.profiles.find((item) => item.user_id === userId);
}

function isCommunityMember(communityId, userId) {
  if (!communityId) return true;
  return db.community_members.some((member) => member.community_id === communityId && member.user_id === userId);
}

function postStats(postId, viewerId = null) {
  const votes = db.post_votes.filter((vote) => vote.post_id === postId).reduce((total, vote) => total + Number(vote.value || 0), 0);
  const viewerVote = viewerId ? db.post_votes.find((vote) => vote.post_id === postId && vote.user_id === viewerId)?.value || 0 : 0;
  const reactions = db.reactions.filter((reaction) => reaction.post_id === postId);
  return {
    votes,
    viewerVote,
    likes: reactions.filter((reaction) => reaction.type === "like" || reaction.type === "helpful").length,
    viewerLiked: viewerId ? reactions.some((reaction) => reaction.post_id === postId && reaction.user_id === viewerId && (reaction.type === "like" || reaction.type === "helpful")) : false,
    comments: db.comments.filter((comment) => comment.post_id === postId && !comment.deleted_at).length,
    shares: db.post_shares.filter((share) => share.post_id === postId).length,
    saves: db.post_saves.filter((save) => save.post_id === postId).length,
    viewerSaved: viewerId ? db.post_saves.some((save) => save.post_id === postId && save.user_id === viewerId) : false,
    reposts: db.reposts.filter((repost) => repost.post_id === postId).length,
    views: db.view_events.filter((view) => view.post_id === postId).length
  };
}

function publicPost(post, { viewerId = null, restrictCommunityContent = false } = {}) {
  const community = getPostCommunity(post);
  const profile = getUserProfile(post.user_id);
  const contentType = normalizeContentType(post.content_type || post.contentType);
  const body = post.body !== undefined ? post.body : post.content;
  const joined = !community || isCommunityMember(community.id, viewerId);
  const locked = Boolean(restrictCommunityContent && community && !joined);
  const stats = postStats(post.id, viewerId);
  const title = normalizeText(post.title, 180);
  const visibleTitle = locked ? `Join ${community.name} to view this ${contentType === "reel" ? "reel" : contentType === "discussion" ? "discussion" : "post"}` : title;
  const visibleBody = locked ? "" : normalizeText(body, 5000);
  const media = locked ? [] : (Array.isArray(post.media) ? post.media : []);
  return {
    id: post.id,
    slug: title ? `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${post.id}` : post.id,
    contentType,
    content_type: contentType,
    title: visibleTitle,
    body: visibleBody,
    content: visibleBody,
    preview: visibleBody,
    media,
    thumbnailUrl: locked ? "" : post.thumbnail_url || post.thumbnailUrl || media[0]?.thumbnailUrl || "",
    topicTags: Array.isArray(post.topic_tags) ? post.topic_tags : [],
    language: post.language || "English",
    visibility: post.visibility || "community",
    moderationState: post.moderation_state || "visible",
    aiLabel: post.ai_label || "human",
    pinned: Boolean(post.pinned_at),
    edited: Boolean(post.edited_at),
    deleted: Boolean(post.deleted_at),
    locked,
    author: locked ? "Members only" : profile?.display_name || "Anonymous User",
    authorId: locked ? null : post.user_id,
    community: community?.name || "Strango",
    communitySlug: community?.slug || null,
    tag: community?.category || community?.short_name || "Community",
    votes: stats.votes,
    viewerVote: stats.viewerVote,
    likes: stats.likes,
    viewerLiked: stats.viewerLiked,
    comments: stats.comments,
    shares: stats.shares,
    saves: stats.saves,
    viewerSaved: stats.viewerSaved,
    reposts: stats.reposts,
    views: stats.views,
    createdAt: post.created_at,
    updatedAt: post.updated_at || post.created_at,
    time: post.created_at ? new Date(post.created_at).toLocaleDateString() : "now"
  };
}

function listPublicPosts({ viewerId = null, communitySlug = null, contentType = "all", cursor = null, limit = 20, restrictCommunityContent = false } = {}) {
  const normalizedType = normalizeContentType(contentType);
  const includeAll = !contentType || ["all", "posts"].includes(String(contentType).toLowerCase());
  const community = communitySlug ? db.communities.find((item) => item.slug === communitySlug) : null;
  const max = Math.min(Math.max(Number(limit) || 20, 1), 30);
  let items = db.posts.filter((post) => !post.removed_at && !post.deleted_at);
  if (communitySlug) items = community ? items.filter((post) => post.community_id === community.id) : [];
  if (!includeAll) items = items.filter((post) => normalizeContentType(post.content_type || post.contentType) === normalizedType);
  if (cursor) items = items.filter((post) => new Date(post.created_at).getTime() < new Date(cursor).getTime());
  items = items.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const page = items.slice(0, max);
  return {
    items: page.map((post) => publicPost(post, { viewerId, restrictCommunityContent })),
    nextCursor: items.length > max ? page[page.length - 1]?.created_at || null : null,
    hasMore: items.length > max
  };
}

function createPost({ userId, communitySlug, contentType, title, body, content, media, thumbnailUrl, topicTags, language, visibility, altText, quotePostId, poll }) {
  const type = normalizeContentType(contentType);
  const community = communitySlug ? db.communities.find((item) => item.slug === communitySlug) : null;
  const textBody = normalizeText(body !== undefined ? body : content, type === "short_post" ? 500 : 5000);
  const textTitle = normalizeText(title, 180);
  const postMedia = normalizeMedia(media, type);
  const safeThumbnail = isSafeHttpUrl(thumbnailUrl || "");
  if ((type === "discussion" || type === "reel") && !community) return { error: "Community is required for this content type.", status: 400 };
  if (community && communityRestriction(community.id, userId, "ban_user")) return { error: "You are banned from this community.", status: 403 };
  if (community && communityRestriction(community.id, userId, "mute_user")) return { error: "You are muted in this community.", status: 403 };
  if (type === "discussion" && !textTitle) return { error: "Discussion title is required.", status: 400 };
  if (type === "short_post" && !textBody) return { error: "Short posts cannot be empty.", status: 400 };
  if (type === "standard_post" && !textBody && !postMedia.length) return { error: "Add text or media before publishing.", status: 400 };
  if (type === "reel" && !postMedia.some((item) => item.kind === "video")) return { error: "A safe video URL is required for reels.", status: 400 };
  if (community) joinCommunity(community.slug, userId);
  const record = {
    id: nextId(db, "posts"),
    community_id: community?.id || null,
    user_id: userId,
    content_type: type,
    title: type === "discussion" ? textTitle : textTitle || (type === "reel" ? "Strango Reel" : ""),
    body: textBody,
    content: textBody,
    media: postMedia,
    thumbnail_url: safeThumbnail || postMedia[0]?.thumbnailUrl || "",
    topic_tags: normalizeTags(topicTags),
    language: normalizeText(language || "English", 40) || "English",
    visibility: normalizeVisibility(visibility, community ? "community" : "public"),
    comment_policy: "open",
    moderation_state: "visible",
    ai_label: "human",
    quote_post_id: quotePostId ? String(quotePostId) : null,
    poll: poll && typeof poll === "object" ? {
      question: normalizeText(poll.question, 160),
      options: Array.isArray(poll.options) ? poll.options.map((option) => normalizeText(option, 80)).filter(Boolean).slice(0, 4) : []
    } : null,
    alt_text: normalizeText(altText, 180),
    created_at: now(),
    updated_at: now(),
    edited_at: null,
    deleted_at: null,
    removed_at: null,
    pinned_at: null
  };
  db.posts.push(record);
  awardSparks(userId, type === "reel" ? "reel_created" : type === "short_post" ? "short_post_created" : type === "standard_post" ? "post_created" : "discussion_created", 5);
  saveDb();
  return { post: publicPost(record, { viewerId: userId }) };
}

function updatePost(postId, userId, patch = {}) {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at);
  if (!post) return { error: "Post not found.", status: 404 };
  if (post.user_id !== userId) return { error: "Only the author can edit this post.", status: 403 };
  const type = normalizeContentType(post.content_type || post.contentType);
  if (Object.prototype.hasOwnProperty.call(patch, "title")) post.title = normalizeText(patch.title, 180);
  if (Object.prototype.hasOwnProperty.call(patch, "body") || Object.prototype.hasOwnProperty.call(patch, "content")) {
    post.body = normalizeText(patch.body !== undefined ? patch.body : patch.content, type === "short_post" ? 500 : 5000);
    post.content = post.body;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "topicTags")) post.topic_tags = normalizeTags(patch.topicTags);
  if (Object.prototype.hasOwnProperty.call(patch, "visibility")) post.visibility = normalizeVisibility(patch.visibility, post.visibility);
  post.updated_at = now();
  post.edited_at = now();
  saveDb();
  return { post: publicPost(post, { viewerId: userId }) };
}

function deletePost(postId, userId) {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at);
  if (!post) return { error: "Post not found.", status: 404 };
  if (post.user_id !== userId) return { error: "Only the author can delete this post.", status: 403 };
  post.deleted_at = now();
  post.updated_at = now();
  saveDb();
  return { ok: true };
}

function setPostVote(postId, userId, value) {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at && !item.removed_at);
  if (!post) return { error: "Post not found.", status: 404 };
  const voteValue = Number(value) > 0 ? 1 : Number(value) < 0 ? -1 : 0;
  const existing = db.post_votes.find((vote) => vote.post_id === postId && vote.user_id === userId);
  if (voteValue === 0) {
    db.post_votes = db.post_votes.filter((vote) => !(vote.post_id === postId && vote.user_id === userId));
  } else if (existing) {
    existing.value = voteValue;
    existing.updated_at = now();
  } else {
    db.post_votes.push({ id: nextId(db, "post_votes"), post_id: postId, user_id: userId, value: voteValue, created_at: now(), updated_at: now() });
  }
  saveDb();
  return { post: publicPost(post, { viewerId: userId }) };
}

function togglePostReaction(postId, userId, type = "like") {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at && !item.removed_at);
  if (!post) return { error: "Post not found.", status: 404 };
  const reactionType = reactionTypes.has(String(type)) ? String(type) : "like";
  const before = db.reactions.length;
  db.reactions = db.reactions.filter((item) => !(item.post_id === postId && item.user_id === userId && item.type === reactionType));
  if (db.reactions.length === before) {
    db.reactions.push({ id: nextId(db, "reactions"), post_id: postId, user_id: userId, type: reactionType, created_at: now() });
    if (["helpful", "like"].includes(reactionType)) awardSparks(post.user_id, "post_reaction", 3);
  }
  saveDb();
  return { post: publicPost(post, { viewerId: userId }) };
}

function togglePostSave(postId, userId) {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at && !item.removed_at);
  if (!post) return { error: "Post not found.", status: 404 };
  const before = db.post_saves.length;
  db.post_saves = db.post_saves.filter((item) => !(item.post_id === postId && item.user_id === userId));
  if (db.post_saves.length === before) db.post_saves.push({ id: nextId(db, "post_saves"), post_id: postId, user_id: userId, created_at: now() });
  saveDb();
  return { post: publicPost(post, { viewerId: userId }) };
}

function recordPostShare(postId, userId, target = "copy") {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at && !item.removed_at);
  if (!post) return { error: "Post not found.", status: 404 };
  db.post_shares.push({ id: nextId(db, "post_shares"), post_id: postId, user_id: userId, target: normalizeText(target, 40) || "copy", created_at: now() });
  saveDb();
  return { post: publicPost(post, { viewerId: userId }) };
}

function recordPostView(postId, userId) {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at && !item.removed_at);
  if (!post) return { error: "Post not found.", status: 404 };
  const recentCutoff = Date.now() - 15 * 60 * 1000;
  const duplicate = db.view_events.some((item) => item.post_id === postId && item.user_id === userId && new Date(item.created_at).getTime() >= recentCutoff);
  if (!duplicate) {
    db.view_events.push({ id: nextId(db, "view_events"), post_id: postId, user_id: userId, created_at: now() });
    saveDb();
  }
  return { post: publicPost(post, { viewerId: userId }) };
}

function publicComment(comment, viewerId = null, depth = 0) {
  const profile = getUserProfile(comment.user_id);
  return {
    id: comment.id,
    postId: comment.post_id,
    parentId: comment.parent_comment_id || null,
    author: profile?.display_name || "Anonymous User",
    authorId: comment.user_id,
    body: comment.deleted_at ? "This comment was deleted." : comment.content,
    depth: Math.min(depth, 3),
    edited: Boolean(comment.edited_at),
    deleted: Boolean(comment.deleted_at),
    createdAt: comment.created_at,
    updatedAt: comment.updated_at || comment.created_at,
    own: viewerId ? comment.user_id === viewerId : false
  };
}

function listPostComments(postId, { viewerId = null, sort = "best", limit = 80 } = {}) {
  const postComments = db.comments.filter((comment) => comment.post_id === postId && !comment.deleted_at);
  const children = new Map();
  postComments.forEach((comment) => {
    const parentId = comment.parent_comment_id || "root";
    if (!children.has(parentId)) children.set(parentId, []);
    children.get(parentId).push(comment);
  });
  const sortComments = (items) => items.sort((a, b) => {
    if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const flattened = [];
  function walk(parentId, depth) {
    sortComments(children.get(parentId) || []).forEach((comment) => {
      if (flattened.length >= limit) return;
      flattened.push(publicComment(comment, viewerId, depth));
      walk(comment.id, depth + 1);
    });
  }
  walk("root", 0);
  return flattened;
}

function createPostComment({ postId, userId, content, parentId = null }) {
  const post = db.posts.find((item) => item.id === postId && !item.deleted_at && !item.removed_at);
  const text = normalizeText(content, 2000);
  if (!post || !text) return { error: "Post and content are required.", status: 400 };
  const parent = parentId ? db.comments.find((item) => item.id === parentId && item.post_id === postId && !item.deleted_at) : null;
  if (parentId && !parent) return { error: "Parent comment not found.", status: 404 };
  const comment = { id: nextId(db, "comments"), post_id: postId, parent_comment_id: parent?.id || null, user_id: userId, content: text, created_at: now(), updated_at: now(), edited_at: null, deleted_at: null };
  db.comments.push(comment);
  awardSparks(userId, "comment", 2);
  saveDb();
  return { comment: publicComment(comment, userId) };
}
function saveCommunityMessage({ communitySlug, channelName, userId, message, translation = null }) {
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
    translation,
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
        translation: message.translation || null,
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
  getCommunityRole,
  addModerationAction,
  communityRestriction,
  joinCommunity,
  saveCommunityMessage,
  latestCommunityMessages,
  listUserIntents,
  createUserIntent,
  updateUserIntent,
  deleteUserIntent,
  recordRecommendationFeedback,
  awardSparks
};
