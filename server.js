const express = require("express");
const http = require("http");
const path = require("path");
const crypto = require("crypto");
const { Server } = require("socket.io");
const { pageMap, renderSeoPage, renderSitemap } = require("./seo-pages");
const database = require("./database");

const app = express();
const server = http.createServer(app);
const publicDir = path.join(__dirname, "public");
const emailChallenges = new Map();

const crawlerPattern = /(googlebot|bingbot|google-inspectiontool|inspectiontool)/i;

function sendPublicPage(res, fileName) {
  res.sendFile(path.join(publicDir, fileName));
}

let reactPageTemplate = null;

function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendReactPage(req, res, meta = {}) {
  if (!reactPageTemplate) {
    reactPageTemplate = require("fs").readFileSync(path.join(publicDir, "index.html"), "utf8");
  }
  const title = escapeMarkup(meta.title || "Strango - Talk. Discover. Connect.");
  const description = escapeMarkup(meta.description || "Join communities, discussions and conversations that matter on Strango.");
  const canonicalUrl = escapeMarkup(`https://strango.xyz${meta.canonical || req.path}`);
  let html = reactPageTemplate
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonicalUrl}">`);
  if (meta.noindex) {
    html = html.replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">');
    res.setHeader("X-Robots-Tag", "noindex, follow");
  }
  res.setHeader("Cache-Control", meta.noindex ? "private, no-cache" : "public, max-age=300");
  res.type("html").send(html);
}

function isCrawlerRequest(req) {
  return crawlerPattern.test(req.get("user-agent") || "");
}

function logCrawlerRequest(req, res) {
  if (!isCrawlerRequest(req)) return;
  const startedAt = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log("[crawler]", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      userAgent: req.get("user-agent"),
      contentType: res.getHeader("Content-Type") || null,
      cacheControl: res.getHeader("Cache-Control") || null,
      durationMs: duration
    });
  });
}

const io = new Server(server,{
  cors:{ origin:"*" },
  transports:["websocket","polling"]
});

app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  logCrawlerRequest(req, res);
  next();
});

function parseCookies(req) {
  return String(req.headers.cookie || "").split(";").reduce((cookies, item) => {
    const index = item.indexOf("=");
    if (index === -1) return cookies;
    cookies[item.slice(0, index).trim()] = decodeURIComponent(item.slice(index + 1).trim());
    return cookies;
  }, {});
}

function attachSession(req, res) {
  const cookies = parseCookies(req);
  const state = database.getOrCreateAnonymousSession(cookies.strango_session);
  if (!cookies.strango_session || cookies.strango_session !== state.session.token) {
    res.setHeader("Set-Cookie", `strango_session=${encodeURIComponent(state.session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
  }
  return state;
}

function requireParticipant(req, res) {
  const state = attachSession(req, res);
  const mode = state.user.access_mode || (state.user.is_anonymous ? "ghost" : "profile");
  if (mode === "ghost") {
    res.status(403).json({
      error: "Ghost Mode is view-only. Continue incognito or sign in to participate.",
      code: "PARTICIPATION_REQUIRED"
    });
    return null;
  }
  return state;
}

const ownerPermissions = ["edit_community", "delete_community", "manage_moderators", "manage_rules", "approve_content", "remove_post", "mute_user", "ban_user", "view_mod_log"];
const moderatorPermissions = ["approve_content", "remove_post", "mute_user", "ban_user", "view_mod_log"];

function communityAccess(slug, userId) {
  const community = database.db.communities.find((item) => item.slug === slug);
  if (!community) return { community: null, role: null, permissions: [] };
  const role = database.getCommunityRole(community.id, userId);
  return { community, role: role?.role || null, permissions: role?.permissions || [] };
}

function requireCommunityPermission(req, res, permission) {
  const state = requireParticipant(req, res);
  if (!state) return null;
  const access = communityAccess(req.params.slug, state.user.id);
  if (!access.community) {
    res.status(404).json({ error: "Community not found." });
    return null;
  }
  if (access.role !== "Owner" && !access.permissions.includes(permission)) {
    res.status(403).json({ error: "You do not have permission to perform this action.", code: "COMMUNITY_PERMISSION_REQUIRED" });
    return null;
  }
  return { state, ...access };
}

function publicModerationAction(action) {
  const actor = database.db.profiles.find((item) => item.user_id === action.actor_id);
  const target = database.db.profiles.find((item) => item.user_id === action.target_user_id);
  return {
    id: action.id,
    action: action.action,
    reason: action.reason,
    postId: action.post_id,
    actor: actor?.display_name || "Moderator",
    target: target?.display_name || null,
    createdAt: action.created_at
  };
}

function communityOnlineCount(slug) {
  const ids = new Set();
  socketCommunityState.forEach((state, socketId) => {
    if (state.community === slug) ids.add(socketId);
  });
  return ids.size;
}

function channelOnlineCount(slug, channel) {
  const room = communityRoomName(slug, channel);
  return getPresenceSet(room).size;
}

app.get(/^\/sitemap\.xml\/?$/, (req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0");
  res.send(renderSitemap());
});

app.get(/^\/robots\.txt\/?$/, (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0");
  res.sendFile(path.join(publicDir, "robots.txt"));
});

app.get(/^\/favicon\.ico\/?$/, (req, res) => {
  res.setHeader("Content-Type", "image/x-icon");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.sendFile(path.join(publicDir, "favicon.ico"));
});

app.get(/^\/emi-calculator\/?$/, (req, res) => {
  res.sendFile(path.join(publicDir, "tools", "emi-calculator.html"));
});

app.get(/^\/sip-calculator\/?$/, (req, res) => {
  res.sendFile(path.join(publicDir, "tools", "sip-calculator.html"));
});

app.get(/^\/gst-calculator\/?$/, (req, res) => {
  res.sendFile(path.join(publicDir, "tools", "gst-calculator.html"));
});

const reactPageRoutes = [
  ["/", "Strango - Talk. Discover. Connect.", "Join communities, discussions and conversations that matter."],
  ["/chat", "Anonymous Chat - Strango", "Start an anonymous realtime conversation with AI-assisted icebreakers on Strango."],
  ["/communities", "Communities - Strango", "Explore focused Strango communities for finance, technology, gaming, students, self-improvement and more."],
  ["/discussions", "Trending Discussions - Strango", "Vote, comment, reply and share useful discussions across Strango communities."],
  ["/live", "Live Conversations - Strango", "Join active public conversations instantly by topic."],
  ["/rooms", "Live Topic Rooms - Strango", "Enter live study, finance, technology and open mic rooms on Strango."],
  ["/about", "About Strango", "Learn about Strango's Observe, Talk, Connect philosophy."],
  ["/contact", "Contact Strango", "Contact the Strango team for support, safety, partnerships and product feedback."],
  ["/faq", "Strango FAQ", "Answers about Ghost Mode, Incognito Mode, profiles, Sparks and live conversations."],
  ["/support", "Strango Support", "Get product, account and safety support for Strango."],
  ["/pluto", "Strango Pluto - Coming Soon", "Preview the future premium Strango experience."]
];

reactPageRoutes.forEach(([route, title, description]) => {
  app.get(new RegExp("^" + route + "\\/?$"), (req, res) => sendReactPage(req, res, { title, description, canonical: route }));
});

["/dashboard", "/messages", "/notifications", "/sparks", "/profile"].forEach((route) => {
  app.get(new RegExp("^" + route + "\\/?$"), (req, res) => sendReactPage(req, res, {
    title: `${route.slice(1).replace(/(^|-)([a-z])/g, (_, prefix, letter) => `${prefix ? " " : ""}${letter.toUpperCase()}`)} - Strango`,
    noindex: true,
    canonical: route
  }));
});

app.get(/^\/communities\/[a-z0-9-]+\/?$/, (req, res) => {
  const slug = req.path.split("/").filter(Boolean).pop();
  const community = database.db.communities.find((item) => item.slug === slug);
  sendReactPage(req, res, {
    title: `${community ? community.name : "Community"} - Strango`,
    description: community ? community.description : "Explore posts, discussions, events and live conversation in this Strango community.",
    canonical: `/communities/${slug}`
  });
});
app.get(/^\/discussions\/[a-z0-9-]+\/?$/, (req, res) => sendReactPage(req, res, {
  title: "Community Discussion - Strango",
  description: "Read, vote, reply and share a community discussion on Strango.",
  canonical: req.path.replace(/\/$/, "")
}));
app.get(/^\/app(?:\/.*)?$/, (req, res) => res.redirect(301, "/dashboard"));

app.get("/api/session", (req, res) => {
  const state = attachSession(req, res);
  const mode = state.user.access_mode || (state.user.is_anonymous ? "ghost" : "profile");
  res.json({
    user: {
      id: state.user.id,
      email: state.user.email,
      isAnonymous: state.user.is_anonymous,
      mode,
      strangerNumber: state.user.visitor_number || Number(state.user.id),
      ghostExpiresAt: state.user.ghost_expires_at || null,
      profile: state.profile
    }
  });
});

app.post("/api/auth/anonymous", (req, res) => {
  const state = attachSession(req, res);
  state.user.access_mode = req.body && req.body.mode === "incognito" ? "incognito" : "ghost";
  state.user.is_anonymous = true;
  if (state.user.access_mode === "incognito") state.user.ghost_expires_at = null;
  database.saveDb();
  res.json({ ok: true, user: state.user, profile: state.profile });
});

app.get("/api/pluto", (req, res) => {
  const state = attachSession(req, res);
  const interest = database.db.subscriptions.find((item) => item.user_id === state.user.id && item.plan === "pluto");
  res.json({ name: "STRANGO PLUTO", status: "coming_soon", interested: Boolean(interest) });
});

app.post("/api/pluto/interest", (req, res) => {
  const state = attachSession(req, res);
  let interest = database.db.subscriptions.find((item) => item.user_id === state.user.id && item.plan === "pluto");
  if (!interest) {
    interest = { id: database.nextId(database.db, "subscriptions"), user_id: state.user.id, plan: "pluto", status: "interested", created_at: new Date().toISOString() };
    database.db.subscriptions.push(interest);
    database.saveDb();
  }
  res.status(201).json({ ok: true, status: "coming_soon" });
});

app.post("/api/auth/email", async (req, res) => {
  const email = String(req.body && req.body.email || "").trim().toLowerCase();
  const code = String(req.body && req.body.code || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Valid email is required." });
    return;
  }

  if (!code) {
    if (process.env.NODE_ENV === "production" && (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)) {
      res.status(503).json({ error: "Email Login is not configured." });
      return;
    }
    const loginCode = String(crypto.randomInt(100000, 1000000));
    emailChallenges.set(email, {
      hash: crypto.createHash("sha256").update(loginCode).digest("hex"),
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [email],
            subject: "Your Strango login code",
            html: `<p>Your Strango login code is <strong>${loginCode}</strong>.</p><p>It expires in 10 minutes.</p>`
          })
        });
        if (!emailResponse.ok) throw new Error("Email delivery failed.");
      } catch (error) {
        emailChallenges.delete(email);
        res.status(502).json({ error: "Could not send the login code." });
        return;
      }
    }
    res.json({
      ok: true,
      challenge: true,
      devCode: process.env.NODE_ENV === "production" ? undefined : loginCode
    });
    return;
  }

  const challenge = emailChallenges.get(email);
  const submittedHash = crypto.createHash("sha256").update(code).digest("hex");
  const validCode = challenge &&
    challenge.expiresAt > Date.now() &&
    crypto.timingSafeEqual(Buffer.from(challenge.hash), Buffer.from(submittedHash));
  if (!validCode) {
    res.status(401).json({ error: "The login code is invalid or expired." });
    return;
  }
  emailChallenges.delete(email);

  let user = database.db.users.find((item) => item.email === email && item.auth_provider === "email");
  if (!user) {
    user = database.createUser({ authProvider: "email", email, displayName: email.split("@")[0], isAnonymous: false });
  }
  user.access_mode = "profile";
  user.is_anonymous = false;
  const session = database.createSession(user.id);
  const profile = database.db.profiles.find((item) => item.user_id === user.id);
  res.setHeader("Set-Cookie", `strango_session=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
  res.json({ ok: true, user, profile });
});

app.get("/auth/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    res.status(501).json({ error: "Google Login requires GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI environment variables." });
    return;
  }
  const state = crypto.randomBytes(24).toString("hex");
  res.setHeader("Set-Cookie", `strango_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state
  });
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const oauthState = parseCookies(req).strango_oauth_state;
  const requestState = String(req.query.state || "");
  if (!code || !oauthState || oauthState !== requestState || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    res.status(400).json({ error: "Google OAuth configuration or authorization code is missing." });
    return;
  }
  res.setHeader("Set-Cookie", "strango_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });
    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok || !tokens.access_token) throw new Error("Google token exchange failed.");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const googleProfile = await profileResponse.json();
    if (!profileResponse.ok || !googleProfile.sub) throw new Error("Google profile request failed.");

    let user = database.db.users.find((item) => item.google_id === googleProfile.sub);
    if (!user) {
      user = database.createUser({
        authProvider: "google",
        googleId: googleProfile.sub,
        email: googleProfile.email,
        displayName: googleProfile.name || googleProfile.email,
        isAnonymous: false
      });
    }
    user.access_mode = "profile";
    user.is_anonymous = false;
    const profile = database.db.profiles.find((item) => item.user_id === user.id);
    if (profile && googleProfile.picture) profile.avatar_url = googleProfile.picture;
    const session = database.createSession(user.id);
    database.saveDb();
    res.setHeader("Set-Cookie", `strango_session=${encodeURIComponent(session.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("[auth] Google callback failed:", error.message);
    res.status(502).json({ error: "Google Login could not be completed." });
  }
});

app.get("/api/communities", (req, res) => {
  res.json({
    communities: database.db.communities.map((community) => database.publicCommunity(community, communityOnlineCount(community.slug)))
  });
});

app.get("/api/communities/:slug", (req, res) => {
  const community = database.db.communities.find((item) => item.slug === req.params.slug);
  if (!community) {
    res.status(404).json({ error: "Community not found." });
    return;
  }
  const body = database.publicCommunity(community, communityOnlineCount(community.slug));
  const state = attachSession(req, res);
  const viewerRole = database.getCommunityRole(community.id, state.user.id);
  body.viewerRole = viewerRole?.role || null;
  body.viewerPermissions = viewerRole?.permissions || [];
  body.channels = body.channels.map((channel) => ({
    name: channel,
    slug: database.channelSlug(channel),
    onlineCount: channelOnlineCount(community.slug, channel)
  }));
  body.members = database.db.community_members
    .filter((member) => member.community_id === community.id)
    .map((member) => {
      const profile = database.db.profiles.find((item) => item.user_id === member.user_id);
      return {
        id: member.user_id,
        displayName: profile ? profile.display_name : "Anonymous User",
        badge: database.getBadge(member.member_number),
        role: database.getCommunityRole(community.id, member.user_id)?.role || member.role || "Member",
        joinedAt: member.joined_at
      };
    });
  body.moderators = database.db.community_roles
    .filter((role) => role.community_id === community.id && ["Owner", "Moderator"].includes(role.role))
    .map((role) => {
      const profile = database.db.profiles.find((item) => item.user_id === role.user_id);
      return { id: role.user_id, displayName: profile?.display_name || "Anonymous User", role: role.role };
    });
  body.moderationLog = body.viewerRole === "Owner" || body.viewerPermissions.includes("view_mod_log")
    ? database.db.moderation_actions.filter((item) => item.community_id === community.id).slice(-50).reverse().map(publicModerationAction)
    : [];
  body.openReports = body.viewerRole === "Owner" || body.viewerPermissions.includes("view_mod_log")
    ? database.db.community_reports.filter((item) => item.community_id === community.id && item.status === "open").map((item) => ({ id: item.id, postId: item.post_id, userId: item.target_user_id, reason: item.reason, createdAt: item.created_at }))
    : [];
  res.json({ community: body });
});

app.post("/api/communities", (req, res) => {
  const state = requireParticipant(req, res);
  if (!state) return;
  const name = String(req.body && req.body.name || "").trim();
  const slug = normalizeSlug(req.body && req.body.slug || name.toLowerCase().replace(/\s+/g, "-"));
  const description = String(req.body && req.body.description || "").trim();
  const icon = String(req.body && req.body.icon || "spark").trim();
  const category = String(req.body && req.body.category || "General").trim();
  const rules = Array.isArray(req.body?.rules) ? req.body.rules.map((rule) => String(rule).trim().slice(0, 240)).filter(Boolean).slice(0, 12) : [];
  const bannerUrl = String(req.body?.bannerUrl || "").trim().slice(0, 500) || null;
  const logoUrl = String(req.body?.logoUrl || "").trim().slice(0, 500) || null;
  if (!name || !slug || !description) {
    res.status(400).json({ error: "Name, slug, and description are required." });
    return;
  }
  if (database.db.communities.some((item) => item.slug === slug)) {
    res.status(409).json({ error: "Community slug already exists." });
    return;
  }
  const community = {
    id: database.nextId(database.db, "communities"),
    slug,
    name,
    short_name: name,
    description,
    category,
    theme: "Custom",
    rgb: "23,111,77",
    icon,
    logo_url: logoUrl,
    banner_url: bannerUrl,
    rules: rules.length ? rules : ["Be constructive and stay on topic.", "Protect private information.", "Report harmful content instead of escalating."],
    owner_id: state.user.id,
    created_at: new Date().toISOString()
  };
  database.db.communities.push(community);
  database.db.community_channels.push({
    id: database.nextId(database.db, "community_channels"),
    community_id: community.id,
    slug: "general",
    name: "General",
    created_at: new Date().toISOString()
  });
  database.db.community_roles.push({
    id: database.nextId(database.db, "community_roles"),
    community_id: community.id,
    user_id: state.user.id,
    role: "Owner",
    permissions: ownerPermissions,
    created_at: new Date().toISOString()
  });
  const ownership = database.joinCommunity(slug, state.user.id);
  if (ownership?.member) ownership.member.role = "Owner";
  database.saveDb();
  res.status(201).json({ community: database.publicCommunity(community, communityOnlineCount(slug)) });
});

app.patch("/api/communities/:slug", (req, res) => {
  const access = requireCommunityPermission(req, res, "edit_community");
  if (!access) return;
  const { community } = access;
  if (req.body.name !== undefined) community.name = String(req.body.name).trim().slice(0, 80) || community.name;
  if (req.body.description !== undefined) community.description = String(req.body.description).trim().slice(0, 1200);
  if (req.body.category !== undefined) community.category = String(req.body.category).trim().slice(0, 60);
  if (req.body.logoUrl !== undefined) community.logo_url = String(req.body.logoUrl || "").trim().slice(0, 500) || null;
  if (req.body.bannerUrl !== undefined) community.banner_url = String(req.body.bannerUrl || "").trim().slice(0, 500) || null;
  if (Array.isArray(req.body.rules)) community.rules = req.body.rules.map((rule) => String(rule).trim().slice(0, 240)).filter(Boolean).slice(0, 12);
  community.updated_at = new Date().toISOString();
  database.addModerationAction({ communityId: community.id, actorId: access.state.user.id, action: "community_updated", reason: "Community settings updated." });
  res.json({ community: database.publicCommunity(community, communityOnlineCount(community.slug)) });
});

app.delete("/api/communities/:slug", (req, res) => {
  const access = requireCommunityPermission(req, res, "delete_community");
  if (!access) return;
  const communityId = access.community.id;
  ["community_channels", "community_members", "community_messages", "community_roles", "community_events", "moderation_actions", "community_reports"]
    .forEach((table) => { database.db[table] = database.db[table].filter((item) => item.community_id !== communityId); });
  database.db.posts = database.db.posts.filter((item) => item.community_id !== communityId);
  database.db.communities = database.db.communities.filter((item) => item.id !== communityId);
  database.saveDb();
  res.json({ ok: true });
});

app.post("/api/communities/:slug/moderators", (req, res) => {
  const access = requireCommunityPermission(req, res, "manage_moderators");
  if (!access) return;
  const userId = String(req.body?.userId || "");
  const member = database.db.community_members.find((item) => item.community_id === access.community.id && item.user_id === userId);
  if (!member) return res.status(404).json({ error: "The user must join the community first." });
  let role = database.db.community_roles.find((item) => item.community_id === access.community.id && item.user_id === userId);
  if (!role) {
    role = { id: database.nextId(database.db, "community_roles"), community_id: access.community.id, user_id: userId, role: "Moderator", permissions: moderatorPermissions, created_at: new Date().toISOString() };
    database.db.community_roles.push(role);
  } else {
    role.role = "Moderator";
    role.permissions = moderatorPermissions;
  }
  member.role = "Moderator";
  database.addModerationAction({ communityId: access.community.id, actorId: access.state.user.id, targetUserId: userId, action: "moderator_added" });
  res.status(201).json({ ok: true });
});

app.delete("/api/communities/:slug/moderators/:userId", (req, res) => {
  const access = requireCommunityPermission(req, res, "manage_moderators");
  if (!access) return;
  database.db.community_roles = database.db.community_roles.filter((item) => !(item.community_id === access.community.id && item.user_id === req.params.userId && item.role === "Moderator"));
  const member = database.db.community_members.find((item) => item.community_id === access.community.id && item.user_id === req.params.userId);
  if (member) member.role = "Member";
  database.addModerationAction({ communityId: access.community.id, actorId: access.state.user.id, targetUserId: req.params.userId, action: "moderator_removed" });
  res.json({ ok: true });
});

app.post("/api/communities/:slug/reports", (req, res) => {
  const state = requireParticipant(req, res);
  if (!state) return;
  const community = database.db.communities.find((item) => item.slug === req.params.slug);
  if (!community) return res.status(404).json({ error: "Community not found." });
  const report = {
    id: database.nextId(database.db, "community_reports"),
    community_id: community.id,
    reporter_id: state.user.id,
    post_id: req.body?.postId ? String(req.body.postId) : null,
    target_user_id: req.body?.userId ? String(req.body.userId) : null,
    reason: String(req.body?.reason || "Reported for review").trim().slice(0, 500),
    status: "open",
    created_at: new Date().toISOString()
  };
  database.db.community_reports.push(report);
  database.saveDb();
  res.status(201).json({ report: { id: report.id, status: report.status } });
});

app.post("/api/communities/:slug/moderation", (req, res) => {
  const action = String(req.body?.action || "");
  const permission = action === "remove_post" ? "remove_post" : action === "approve_post" ? "approve_content" : action === "mute_user" ? "mute_user" : action === "ban_user" ? "ban_user" : null;
  if (!permission) return res.status(400).json({ error: "Unsupported moderation action." });
  const access = requireCommunityPermission(req, res, permission);
  if (!access) return;
  const postId = req.body?.postId ? String(req.body.postId) : null;
  const targetUserId = req.body?.userId ? String(req.body.userId) : null;
  if (action === "remove_post") {
    const post = database.db.posts.find((item) => item.id === postId && item.community_id === access.community.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    post.removed_at = new Date().toISOString();
    post.removed_by = access.state.user.id;
  }
  if (action === "approve_post") {
    const post = database.db.posts.find((item) => item.id === postId && item.community_id === access.community.id);
    if (!post) return res.status(404).json({ error: "Post not found." });
    post.approved_at = new Date().toISOString();
    post.approved_by = access.state.user.id;
  }
  database.db.community_reports
    .filter((item) => item.community_id === access.community.id && item.status === "open" && ((postId && item.post_id === postId) || (targetUserId && item.target_user_id === targetUserId)))
    .forEach((item) => {
      item.status = action === "approve_post" ? "dismissed" : "resolved";
      item.resolved_by = access.state.user.id;
      item.resolved_at = new Date().toISOString();
    });
  const record = database.addModerationAction({ communityId: access.community.id, actorId: access.state.user.id, targetUserId, postId, action, reason: req.body?.reason });
  res.status(201).json({ action: publicModerationAction(record) });
});

app.post("/api/communities/:slug/join", (req, res) => {
  const state = requireParticipant(req, res);
  if (!state) return;
  const result = database.joinCommunity(req.params.slug, state.user.id);
  if (!result) {
    res.status(404).json({ error: "Community not found." });
    return;
  }
  res.json({
    memberNumber: result.member.member_number,
    badge: result.badge,
    showWelcome: result.firstJoin,
    community: database.publicCommunity(result.community, communityOnlineCount(result.community.slug))
  });
});

app.get("/api/communities/:slug/messages", (req, res) => {
  const channel = String(req.query.channel || "General");
  res.json({ messages: database.latestCommunityMessages(req.params.slug, channel, 100) });
});

app.get("/api/communities/:slug/posts", (req, res) => {
  const community = database.db.communities.find((item) => item.slug === req.params.slug);
  if (!community) {
    res.status(404).json({ error: "Community not found." });
    return;
  }
  const state = attachSession(req, res);
  const viewerRole = database.getCommunityRole(community.id, state.user.id);
  if (!viewerRole) {
    res.json({ posts: [], locked: true });
    return;
  }
  const posts = database.db.posts
    .filter((post) => post.community_id === community.id && !post.removed_at)
    .slice()
    .reverse()
    .map((post) => {
      const profile = database.db.profiles.find((item) => item.user_id === post.user_id);
      return {
        id: post.id,
        title: post.title,
        preview: post.content,
        author: profile ? profile.display_name : "Anonymous User",
        time: post.created_at,
        likes: database.db.reactions.filter((reaction) => reaction.post_id === post.id).length,
        comments: database.db.comments.filter((comment) => comment.post_id === post.id).length
      };
    });
  res.json({ posts, locked: false });
});
app.post("/api/posts", (req, res) => {
  const state = requireParticipant(req, res);
  if (!state) return;
  const community = database.db.communities.find((item) => item.slug === req.body.communitySlug);
  const title = String(req.body.title || "").trim();
  const content = String(req.body.content || "").trim();
  if (!community || !title || !content) {
    res.status(400).json({ error: "Community, title, and content are required." });
    return;
  }
  if (database.communityRestriction(community.id, state.user.id, "ban_user")) {
    res.status(403).json({ error: "You are banned from this community." });
    return;
  }
  if (database.communityRestriction(community.id, state.user.id, "mute_user")) {
    res.status(403).json({ error: "You are muted in this community." });
    return;
  }
  database.joinCommunity(community.slug, state.user.id);
  const post = {
    id: database.nextId(database.db, "posts"),
    community_id: community.id,
    user_id: state.user.id,
    title: title.slice(0, 160),
    content: content.slice(0, 5000),
    created_at: new Date().toISOString()
  };
  database.db.posts.push(post);
  database.awardSparks(state.user.id, "post_created", 5);
  database.saveDb();
  res.status(201).json({ post });
});

app.post("/api/posts/:id/comments", (req, res) => {
  const state = requireParticipant(req, res);
  if (!state) return;
  const post = database.db.posts.find((item) => item.id === req.params.id);
  const content = String(req.body.content || "").trim();
  if (!post || !content) {
    res.status(400).json({ error: "Post and content are required." });
    return;
  }
  const comment = { id: database.nextId(database.db, "comments"), post_id: post.id, user_id: state.user.id, content: content.slice(0, 2000), created_at: new Date().toISOString() };
  database.db.comments.push(comment);
  database.awardSparks(state.user.id, "comment", 2);
  database.saveDb();
  res.status(201).json({ comment });
});

app.post("/api/posts/:id/reactions", (req, res) => {
  const state = requireParticipant(req, res);
  if (!state) return;
  const post = database.db.posts.find((item) => item.id === req.params.id);
  const type = String(req.body.type || "helpful").trim();
  if (!post) {
    res.status(404).json({ error: "Post not found." });
    return;
  }
  if (!database.db.reactions.some((item) => item.post_id === post.id && item.user_id === state.user.id && item.type === type)) {
    database.db.reactions.push({ id: database.nextId(database.db, "reactions"), post_id: post.id, user_id: state.user.id, type, created_at: new Date().toISOString() });
    if (type === "helpful") database.awardSparks(post.user_id, "helpful_reaction", 10);
    database.saveDb();
  }
  res.json({ ok: true });
});

app.get("/api/search", (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  if (!query) {
    res.json({ communities: [], posts: [], users: [], messages: [] });
    return;
  }
  res.json({
    communities: database.db.communities.filter((item) => [item.name, item.description, item.slug].join(" ").toLowerCase().includes(query)).map((item) => database.publicCommunity(item, communityOnlineCount(item.slug))),
    posts: database.db.posts.filter((item) => [item.title, item.content].join(" ").toLowerCase().includes(query)),
    users: database.db.profiles.filter((item) => item.display_name.toLowerCase().includes(query)).map((profile) => ({ id: profile.user_id, displayName: profile.display_name, avatarUrl: profile.avatar_url })),
    messages: database.db.community_messages.filter((item) => item.message.toLowerCase().includes(query)).slice(-50)
  });
});

app.get("/api/notifications", (req, res) => {
  const state = attachSession(req, res);
  res.json({ notifications: database.db.notifications.filter((item) => item.user_id === state.user.id).slice(-50).reverse() });
});

app.get("/api/discussions", (req, res) => {
  const state = attachSession(req, res);
  const joinedCommunityIds = new Set(database.db.community_members.filter((member) => member.user_id === state.user.id).map((member) => member.community_id));
  const discussions = database.db.posts
    .filter((post) => !post.removed_at)
    .slice()
    .reverse()
    .map((post) => {
      const community = database.db.communities.find((item) => item.id === post.community_id);
      const profile = database.db.profiles.find((item) => item.user_id === post.user_id);
      const canView = community && joinedCommunityIds.has(community.id);
      return {
        id: post.id,
        slug: `${normalizeSlug(post.title)}-${post.id}`,
        title: canView ? post.title : `Join ${community ? community.name : "this community"} to view this discussion`,
        body: canView ? post.content : "",
        locked: !canView,
        community: community ? community.name : "Strango",
        communitySlug: community ? community.slug : null,
        author: canView && profile ? profile.display_name : canView ? "Anonymous User" : "Members only",
        votes: database.db.reactions.filter((reaction) => reaction.post_id === post.id).length,
        comments: database.db.comments.filter((comment) => comment.post_id === post.id).length,
        createdAt: post.created_at,
        time: new Date(post.created_at).toLocaleDateString(),
        tag: community ? community.category || community.short_name || "Community" : "Community"
      };
    });
  res.json({ discussions });
});
app.get("/api/sparks", (req, res) => {
  const state = attachSession(req, res);
  const sparks = database.db.user_sparks.find((item) => item.user_id === state.user.id) || {
    points: 0,
    level: "Explorer"
  };
  const achievements = database.db.notifications
    .filter((item) => item.user_id === state.user.id && item.type === "badge_earned")
    .map((item) => item.payload)
    .slice(-20)
    .reverse();
  res.json({ sparks, achievements });
});

app.get("/api/icebreakers", (req, res) => {
  const topic = String(req.query.topic || "general").trim().slice(0, 40);
  const prompts = [
    "What skill would you learn instantly?",
    "What small thing made your week better?",
    "Which place changed the way you see the world?",
    "What opinion have you changed recently?",
    `What is one ${topic === "general" ? "idea" : topic + " idea"} you wish more people discussed?`
  ];
  const offset = Math.floor(Date.now() / 60000) % prompts.length;
  res.json({ prompts: prompts.slice(offset).concat(prompts.slice(0, offset)) });
});

app.get("/api/discovery", (req, res) => {
  const interests = String(req.query.interests || "")
    .toLowerCase()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const score = (text) => interests.reduce((total, interest) => total + (text.toLowerCase().includes(interest) ? 3 : 0), 0);
  const communities = database.db.communities
    .map((community) => database.publicCommunity(community, communityOnlineCount(community.slug)))
    .sort((a, b) => score(`${b.name} ${b.description}`) - score(`${a.name} ${a.description}`) || b.memberCount - a.memberCount)
    .slice(0, 6);
  const discussions = database.db.posts
    .slice()
    .sort((a, b) => score(`${b.title} ${b.content}`) - score(`${a.title} ${a.content}`))
    .slice(0, 6);
  res.json({ communities, discussions, reason: interests.length ? "interest_match" : "platform_trending" });
});

app.get("/api/communities/:slug/summary", (req, res) => {
  const community = database.db.communities.find((item) => item.slug === req.params.slug);
  if (!community) {
    res.status(404).json({ error: "Community not found." });
    return;
  }
  const recentPosts = database.db.posts
    .filter((post) => post.community_id === community.id)
    .slice(-8)
    .reverse();
  const highlights = recentPosts.slice(0, 4).map((post) => post.title);
  res.json({
    title: highlights.length ? `Today's ${community.name} summary` : "No activity to summarize yet",
    highlights,
    generatedAt: new Date().toISOString(),
    generator: process.env.AI_SUMMARY_PROVIDER || "extractive-v1"
  });
});

app.get("/api/live", (req, res) => {
  const conversations = Array.from(discussionPresence.entries())
    .filter(([, participants]) => participants.size > 0)
    .map(([id, participants]) => {
      const post = database.db.posts.find((item) => item.id === id || `${normalizeSlug(item.title)}-${item.id}` === id);
      const community = post ? database.db.communities.find((item) => item.id === post.community_id) : null;
      return {
        id,
        title: post?.title || "Live community discussion",
        topic: community?.name || "Community",
        participantCount: participants.size,
        tags: []
      };
    });
  res.json({ conversations });
});

app.get("/api/rooms", (req, res) => {
  const rooms = Array.from(communityPresence.entries())
    .filter(([, participants]) => participants.size > 0)
    .map(([id, participants]) => ({ id, title: id.replace(/^community-/, "").replace(/-/g, " "), participantCount: participants.size, topic: "Active community room" }));
  res.json({ rooms });
});

app.get("/api/trending", (req, res) => {
  const communities = database.db.communities
    .map((community) => database.publicCommunity(community, communityOnlineCount(community.slug)))
    .sort((a, b) => b.memberCount - a.memberCount);
  const posts = database.db.posts.slice().reverse().map((post) => {
    const community = database.db.communities.find((item) => item.id === post.community_id);
    const profile = database.db.profiles.find((item) => item.user_id === post.user_id);
    return {
      id: post.id,
      title: post.title,
      preview: post.content,
      communityName: community ? community.name : "",
      author: profile ? profile.display_name : "Anonymous User",
      time: post.created_at,
      likes: database.db.reactions.filter((reaction) => reaction.post_id === post.id).length,
      comments: database.db.comments.filter((comment) => comment.post_id === post.id).length
    };
  });
  const messages = database.db.community_messages.slice(-20).reverse();
  res.json({ communities, posts, recentActivity: posts.slice(0, 10), messages });
});

app.get("/api/feed", (req, res) => {
  const communities = database.db.communities
    .map((community) => database.publicCommunity(community, communityOnlineCount(community.slug)))
    .sort((a, b) => b.memberCount - a.memberCount);
  const posts = database.db.posts.slice().reverse().map((post) => {
    const community = database.db.communities.find((item) => item.id === post.community_id);
    const profile = database.db.profiles.find((item) => item.user_id === post.user_id);
    return {
      id: post.id,
      title: post.title,
      preview: post.content,
      communitySlug: community ? community.slug : "",
      communityName: community ? community.name : "",
      author: profile ? profile.display_name : "Anonymous User",
      time: post.created_at,
      likes: database.db.reactions.filter((reaction) => reaction.post_id === post.id).length,
      comments: database.db.comments.filter((comment) => comment.post_id === post.id).length
    };
  });
  const messages = database.db.community_messages.slice(-10).reverse().map((message) => {
    const community = database.db.communities.find((item) => item.id === message.community_id);
    const channel = database.db.community_channels.find((item) => item.id === message.channel_id);
    const profile = database.db.profiles.find((item) => item.user_id === message.user_id);
    return {
      communityName: community ? community.name : "",
      channelName: channel ? channel.name : "",
      author: profile ? profile.display_name : "Anonymous User",
      message: message.message,
      createdAt: message.created_at
    };
  });
  res.json({
    recentDiscussions: posts.slice(0, 10),
    popularDiscussions: posts.slice().sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2)).slice(0, 10),
    trendingCommunities: communities.slice(0, 6),
    communityActivity: messages
  });
});

app.get("/api/profile", (req, res) => {
  const state = attachSession(req, res);
  const joinedCommunityIds = database.db.community_members.filter((item) => item.user_id === state.user.id).map((item) => item.community_id);
  const communities = database.db.communities
    .filter((community) => joinedCommunityIds.includes(community.id))
    .map((community) => database.publicCommunity(community, communityOnlineCount(community.slug)));
  const posts = database.db.posts.filter((post) => post.user_id === state.user.id);
  const comments = database.db.comments.filter((comment) => comment.user_id === state.user.id);
  const sparks = database.db.user_sparks.find((item) => item.user_id === state.user.id) || { points: 0, level: "Explorer" };
  const badges = database.db.community_members
    .filter((member) => member.user_id === state.user.id)
    .map((member) => {
      const community = database.db.communities.find((item) => item.id === member.community_id);
      return { community: community ? community.name : "", badge: database.getBadge(member.member_number), memberNumber: member.member_number };
    });
  res.json({
    profile: state.profile,
    user: state.user,
    joinedCommunities: communities,
    posts,
    comments,
    sparks,
    badges
  });
});

app.post("/api/conversations", (req, res) => {
  const state = attachSession(req, res);
  const otherUserId = String(req.body && req.body.userId || "");
  if (!database.db.users.some((user) => user.id === otherUserId)) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  let conversation = database.db.conversations.find((item) => item.participant_ids.includes(state.user.id) && item.participant_ids.includes(otherUserId));
  if (!conversation) {
    conversation = { id: database.nextId(database.db, "conversations"), participant_ids: [state.user.id, otherUserId], created_at: new Date().toISOString() };
    database.db.conversations.push(conversation);
    database.saveDb();
  }
  res.json({ conversation });
});

app.get("/api/conversations", (req, res) => {
  const state = attachSession(req, res);
  const conversations = database.db.conversations
    .filter((conversation) => conversation.participant_ids.includes(state.user.id))
    .map((conversation) => {
      const messages = database.db.messages.filter((message) => message.conversation_id === conversation.id);
      const lastMessage = messages[messages.length - 1] || null;
      return { conversation, lastMessage, unreadCount: messages.filter((message) => message.user_id !== state.user.id && !message.read_at).length };
    });
  res.json({ conversations });
});

app.get("/api/conversations/:id/messages", (req, res) => {
  const state = attachSession(req, res);
  const conversation = database.db.conversations.find((item) => item.id === req.params.id && item.participant_ids.includes(state.user.id));
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found." });
    return;
  }
  const messages = database.db.messages.filter((message) => message.conversation_id === conversation.id);
  messages.forEach((message) => {
    if (message.user_id !== state.user.id && !message.read_at) message.read_at = new Date().toISOString();
  });
  database.saveDb();
  res.json({ messages });
});

app.post("/api/conversations/:id/messages", (req, res) => {
  const state = attachSession(req, res);
  const conversation = database.db.conversations.find((item) => item.id === req.params.id && item.participant_ids.includes(state.user.id));
  const text = String(req.body && req.body.message || "").trim();
  if (!conversation || !text) {
    res.status(400).json({ error: "Conversation and message are required." });
    return;
  }
  const message = { id: database.nextId(database.db, "messages"), conversation_id: conversation.id, user_id: state.user.id, message: text.slice(0, 1000), created_at: new Date().toISOString() };
  database.db.messages.push(message);
  database.saveDb();
  res.status(201).json({ message });
});

app.post("/api/community-events", (req, res) => {
  const state = attachSession(req, res);
  const community = database.db.communities.find((item) => item.slug === req.body.communitySlug);
  if (!community || !req.body.title || !req.body.scheduledAt) {
    res.status(400).json({ error: "Community, title, and scheduledAt are required." });
    return;
  }
  const event = { id: database.nextId(database.db, "community_events"), community_id: community.id, owner_id: state.user.id, title: String(req.body.title).trim(), scheduled_at: String(req.body.scheduledAt), created_at: new Date().toISOString() };
  database.db.community_events.push(event);
  database.saveDb();
  res.status(201).json({ event });
});

app.post("/api/community-events/:id/rsvp", (req, res) => {
  const state = attachSession(req, res);
  const event = database.db.community_events.find((item) => item.id === req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found." });
    return;
  }
  let rsvp = database.db.event_rsvps.find((item) => item.event_id === event.id && item.user_id === state.user.id);
  if (!rsvp) {
    rsvp = { id: database.nextId(database.db, "event_rsvps"), event_id: event.id, user_id: state.user.id, status: "going", created_at: new Date().toISOString() };
    database.db.event_rsvps.push(rsvp);
  } else {
    rsvp.status = String(req.body.status || "going");
  }
  database.saveDb();
  res.json({ rsvp });
});

app.post("/api/voice-rooms", (req, res) => {
  const state = attachSession(req, res);
  const community = database.db.communities.find((item) => item.slug === req.body.communitySlug);
  if (!community || !req.body.channel) {
    res.status(400).json({ error: "Community and channel are required." });
    return;
  }
  const voiceRoom = { id: database.nextId(database.db, "voice_rooms"), community_id: community.id, channel: String(req.body.channel), created_by: state.user.id, created_at: new Date().toISOString() };
  database.db.voice_rooms.push(voiceRoom);
  database.saveDb();
  res.status(201).json({ voiceRoom });
});

app.post("/api/livestreams", (req, res) => {
  const state = attachSession(req, res);
  const community = database.db.communities.find((item) => item.slug === req.body.communitySlug);
  if (!community || !req.body.title) {
    res.status(400).json({ error: "Community and title are required." });
    return;
  }
  const livestream = { id: database.nextId(database.db, "livestreams"), community_id: community.id, host_id: state.user.id, title: String(req.body.title).trim(), status: "live", created_at: new Date().toISOString() };
  database.db.livestreams.push(livestream);
  database.saveDb();
  res.status(201).json({ livestream });
});

const pageRoutes = {
  "/app": "app.html",
  "/communities": "communities.html",
  "/trending": "trending.html",
  "/chat": "chat.html",
  "/about": "about-page.html",
  "/contact": "contact-page.html",
  "/privacy-policy": "privacy-policy.html",
  "/terms-of-service": "terms-of-service.html",
  "/community-guidelines": "community-guidelines.html",
  "/help": path.join("help", "index.html"),
  "/help/chat": path.join("help", "chat.html"),
  "/help/getting-started": path.join("help", "getting-started.html"),
  "/help/safety": path.join("help", "safety.html"),
  "/help/privacy": path.join("help", "privacy.html")
};

pageMap.forEach((page, route) => {
  app.get(new RegExp("^" + route + "\\/?$"), (req, res) => {
    res.type("html");
    res.setHeader("Cache-Control", "public, max-age=0");
    res.send(renderSeoPage(page));
  });
});

Object.entries(pageRoutes).forEach(([route, fileName]) => {
  app.get(new RegExp("^" + route + "\\/?$"), (req, res) => {
    sendPublicPage(res, fileName);
  });
});

app.get(/^\/communities\/(?:ai|gaming|finance|geopolitics|bollywood|hollywood|self-improvement|beauty|fifa-2026)\/?$/, (req, res) => {
  sendPublicPage(res, "communities.html");
});

app.get(/^\/app\/app\/(.*)$/, (req, res) => {
  res.redirect(301, "/app/" + req.params[0]);
});

app.get(/^\/app(?:\/.*)?$/, (req, res) => {
  sendPublicPage(res, "app.html");
});

app.use(express.static(publicDir, {
  setHeaders: (res, path) => {
    if (path.endsWith("sitemap.xml")) {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
    }
    if (path.endsWith("robots.txt")) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    if (path.endsWith("favicon.ico")) {
      res.setHeader("Content-Type", "image/x-icon");
    }
  }
}));

let waitingQueue = [];
const communityHistory = new Map();
const communityPresence = new Map();
const socketCommunityState = new Map();
const socketRateLimits = new Map();
const discussionHistory = new Map();
const discussionPresence = new Map();

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48);
}

function normalizeChannel(value) {
  return String(value || "general")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "general";
}

function communityRoomName(community, channel) {
  return "community-" + normalizeSlug(community) + "-" + normalizeChannel(channel);
}

function displayChannel(value) {
  return String(value || "General").trim().slice(0, 60) || "General";
}

function getCommunityHistory(room) {
  if (!communityHistory.has(room)) communityHistory.set(room, []);
  return communityHistory.get(room);
}

function rememberCommunityMessage(room, message) {
  const history = getCommunityHistory(room);
  history.push(message);
  if (history.length > 100) history.splice(0, history.length - 100);
}

function getPresenceSet(room) {
  if (!communityPresence.has(room)) communityPresence.set(room, new Set());
  return communityPresence.get(room);
}

function discussionRoomName(discussionId) {
  return "discussion-" + normalizeSlug(discussionId);
}

function getDiscussionHistory(discussionId) {
  if (!discussionHistory.has(discussionId)) discussionHistory.set(discussionId, []);
  return discussionHistory.get(discussionId);
}

function getDiscussionPresence(discussionId) {
  if (!discussionPresence.has(discussionId)) discussionPresence.set(discussionId, new Map());
  return discussionPresence.get(discussionId);
}

function emitDiscussionPresence(discussionId) {
  const participants = Array.from(getDiscussionPresence(discussionId).values());
  io.to(discussionRoomName(discussionId)).emit("discussionPresence", {
    discussionId,
    count: participants.length,
    participants
  });
}

function leaveDiscussion(socket) {
  const discussionId = socket.data.discussionId;
  if (!discussionId) return;
  getDiscussionPresence(discussionId).delete(socket.id);
  socket.leave(discussionRoomName(discussionId));
  socket.data.discussionId = null;
  emitDiscussionPresence(discussionId);
}

function communityUserName(socket) {
  return socket.communityUserName || "Anonymous User";
}

function emitCommunityOnline(room, community) {
  io.to(room).emit("communityOnline", {
    room,
    community,
    count: getPresenceSet(room).size
  });
}

function communitySystemMessage(room, community, channel, text) {
  const message = {
    id: "system-" + Date.now() + "-" + Math.random().toString(16).slice(2),
    community,
    channel,
    type: "system",
    author: "System",
    text,
    time: new Date().toISOString()
  };
  io.to(room).emit("newCommunityMessage", message);
}

function leaveCommunityRoom(socket, state) {
  if (!state || !state.room) return;
  socket.leave(state.room);
  getPresenceSet(state.room).delete(socket.id);
  communitySystemMessage(state.room, state.community, state.channel, communityUserName(socket) + " left " + state.communityName);
  emitCommunityOnline(state.room, state.community);
  socketCommunityState.delete(socket.id);
}

function moderateCommunityText(socket, text) {
  const nowMs = Date.now();
  const bucket = socketRateLimits.get(socket.id) || [];
  const recent = bucket.filter((time) => nowMs - time < 10000);
  recent.push(nowMs);
  socketRateLimits.set(socket.id, recent);
  if (recent.length > 8) return { ok: false, reason: "Rate limit reached. Slow down before sending another message." };
  const linkCount = (text.match(/https?:\/\//gi) || []).length;
  if (linkCount > 1) return { ok: false, reason: "Link abuse detection blocked this message." };
  const normalized = text.toLowerCase();
  const toxicTerms = ["kill yourself", "terrorist", "rape", "nazi"];
  if (toxicTerms.some((term) => normalized.includes(term))) {
    return { ok: false, reason: "Toxicity detection blocked this message." };
  }
  if (/(.)\1{12,}/.test(text)) return { ok: false, reason: "Spam detection blocked this message." };
  return { ok: true };
}

function translationMetadata(text) {
  const value = String(text || "").trim();
  const lower = value.toLowerCase();
  const phrasebook = new Map([
    ["hola amigo", ["Spanish", "Hello friend"]],
    ["bonjour mon ami", ["French", "Hello my friend"]],
    ["नमस्ते दोस्त", ["Hindi", "Hello friend"]],
    ["ನಮಸ್ಕಾರ ಸ್ನೇಹಿತ", ["Kannada", "Hello friend"]],
    ["مرحبا يا صديقي", ["Arabic", "Hello my friend"]],
    ["こんにちは友達", ["Japanese", "Hello friend"]]
  ]);
  if (phrasebook.has(lower)) {
    const [language, translatedText] = phrasebook.get(lower);
    return { detectedLanguage: language, translatedText, status: "local_phrasebook" };
  }
  let detectedLanguage = null;
  if (/[\u0600-\u06ff]/.test(value)) detectedLanguage = "Arabic";
  else if (/[\u3040-\u30ff\u4e00-\u9faf]/.test(value)) detectedLanguage = "Japanese";
  else if (/[\u0900-\u097f]/.test(value)) detectedLanguage = "Hindi";
  else if (/[\u0c80-\u0cff]/.test(value)) detectedLanguage = "Kannada";
  else if (/\b(hola|gracias|amigo|amiga|buenos)\b/i.test(value)) detectedLanguage = "Spanish";
  else if (/\b(bonjour|merci|salut|ami|amie)\b/i.test(value)) detectedLanguage = "French";
  return detectedLanguage ? { detectedLanguage, translatedText: null, status: "provider_required" } : null;
}

function tryMatch(){
  while(waitingQueue.length >= 2){

    const user1 = waitingQueue.shift();
    const user2 = waitingQueue.shift();

    if(!user1 || !user2) return;

    const room = user1.id + "#" + user2.id;

    user1.join(room);
    user2.join(room);

    user1.room = room;
    user2.room = room;

    user1.emit("chatIdentity", { self: user1.strangerNumber, partner: user2.strangerNumber });
    user2.emit("chatIdentity", { self: user2.strangerNumber, partner: user1.strangerNumber });
    io.to(room).emit("status","Stranger connected");
  }
}

function resetStrangerPeer(socket, status = "Waiting for stranger...") {
  if (!socket) return;
  socket.room = null;
  socket.emit("chatIdentity", { self: socket.strangerNumber || null, partner: null });
  socket.emit("typing", false);
  socket.emit("status", status);
}

io.on("connection",(socket)=>{
  socket.on("joinDiscussion", (payload = {}) => {
    const discussionId = normalizeSlug(payload.discussionId || "");
    if (!discussionId) return;
    if (socket.data.discussionId && socket.data.discussionId !== discussionId) {
      leaveDiscussion(socket);
    }
    const author = String(payload.author || "Ghost member").trim().slice(0, 60) || "Ghost member";
    const avatar = String(payload.avatar || author.slice(0, 2)).trim().slice(0, 2).toUpperCase();
    socket.join(discussionRoomName(discussionId));
    socket.data.discussionId = discussionId;
    socket.data.discussionAuthor = author;
    getDiscussionPresence(discussionId).set(socket.id, {
      id: socket.id,
      author,
      avatar,
      joinedAt: new Date().toISOString()
    });
    socket.emit("discussionHistory", {
      discussionId,
      messages: getDiscussionHistory(discussionId)
    });
    emitDiscussionPresence(discussionId);
  });

  socket.on("discussionMessage", (payload = {}) => {
    const discussionId = normalizeSlug(payload.discussionId || "");
    const message = String(payload.message || "").trim().slice(0, 1200);
    if (!discussionId || !message || socket.data.discussionId !== discussionId) return;
    const record = {
      id: "discussion-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      discussionId,
      author: socket.data.discussionAuthor || "Ghost member",
      avatar: String(payload.avatar || socket.data.discussionAuthor || "GM").slice(0, 2).toUpperCase(),
      message,
      translation: translationMetadata(message),
      createdAt: new Date().toISOString()
    };
    const history = getDiscussionHistory(discussionId);
    history.push(record);
    if (history.length > 150) history.splice(0, history.length - 150);
    io.to(discussionRoomName(discussionId)).emit("discussionMessage", record);
    socket.to(discussionRoomName(discussionId)).emit("discussionTyping", {
      discussionId,
      author: record.author,
      isTyping: false
    });
  });

  socket.on("discussionTyping", (payload = {}) => {
    const discussionId = normalizeSlug(payload.discussionId || "");
    if (!discussionId || socket.data.discussionId !== discussionId) return;
    socket.to(discussionRoomName(discussionId)).emit("discussionTyping", {
      discussionId,
      author: socket.data.discussionAuthor || "Someone",
      isTyping: Boolean(payload.isTyping)
    });
  });

  socket.on("leaveDiscussion", () => {
    leaveDiscussion(socket);
  });

  socket.on("joinPlatformRoom", (payload = {}) => {
    const roomId = normalizeSlug(payload.roomId || "");
    if (!roomId) return;
    const roomName = `platform:${roomId}`;
    socket.join(roomName);
    socket.data.platformRoom = roomName;
    const participantCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    io.to(roomName).emit("platformRoomPresence", { roomId, participantCount });
  });

  socket.on("platformRoomMessage", (payload = {}) => {
    const roomId = normalizeSlug(payload.roomId || "");
    const message = String(payload.message || "").trim().slice(0, 1000);
    if (!roomId || !message || socket.data.platformRoom !== `platform:${roomId}`) return;
    io.to(`platform:${roomId}`).emit("platformRoomMessage", {
      roomId,
      message,
      author: String(payload.author || "Anonymous User").slice(0, 60),
      createdAt: new Date().toISOString()
    });
  });

  console.log("User connected:", socket.id);

  const count = io.engine.clientsCount;
io.emit("onlineCount", count);


  // ✅ AUTO JOIN QUEUE ON CONNECT
  const isCommunitySocket = socket.handshake.auth && socket.handshake.auth.mode === "community";
  const socketCookies = String(socket.handshake.headers.cookie || "").split(";").reduce((cookies, item) => {
    const index = item.indexOf("=");
    if (index === -1) return cookies;
    cookies[item.slice(0, index).trim()] = decodeURIComponent(item.slice(index + 1).trim());
    return cookies;
  }, {});
  const socketSession = database.getOrCreateAnonymousSession(socketCookies.strango_session);
  if(socketSession){
    socket.communityUserId = socketSession.user.id;
    socket.communityUserName = socketSession.profile ? socketSession.profile.display_name : "Anonymous User";
    socket.strangerNumber = socketSession.user.visitor_number || Number(socketSession.user.id);
  }

  if(!isCommunitySocket){
    waitingQueue.push(socket);
    socket.emit("status","Waiting for stranger...");
    tryMatch();
  }

  socket.on("joinCommunity",(payload = {})=>{
    const community = normalizeSlug(payload.community || payload.communitySlug);
    if(!community) return;
    const channel = displayChannel(payload.channel || "General");
    const room = communityRoomName(community, channel);
    const communityName = String(payload.communityName || community).slice(0, 80);
    const previous = socketCommunityState.get(socket.id);
    const membership = database.joinCommunity(community, socket.communityUserId);
    if(!membership) return;
    if (database.communityRestriction(membership.community.id, socket.communityUserId, "ban_user")) {
      socket.emit("communityModeration", { ok: false, reason: "You are banned from this community." });
      return;
    }

    if(previous && previous.room === room){
      socket.emit("communityHistory", {
        room,
        community,
        channel,
        messages:database.latestCommunityMessages(community, channel, 100),
        online:getPresenceSet(room).size
      });
      return;
    }

    leaveCommunityRoom(socket, previous);
    socket.join(room);
    getPresenceSet(room).add(socket.id);
    socketCommunityState.set(socket.id, { room, community, channel, communityName });
    socket.emit("communityHistory", {
      room,
      community,
      channel,
      messages:database.latestCommunityMessages(community, channel, 100),
      online:getPresenceSet(room).size
    });
    communitySystemMessage(room, community, channel, communityUserName(socket) + " joined " + communityName);
    emitCommunityOnline(room, community);
  });

  socket.on("communityMessage",(payload = {})=>{
    const state = socketCommunityState.get(socket.id);
    if(!state) return;
    const text = String(payload.text || "").trim().slice(0, 1000);
    if(!text) return;
    const communityRecord = database.db.communities.find((item) => item.slug === state.community);
    if (communityRecord && database.communityRestriction(communityRecord.id, socket.communityUserId, "mute_user")) {
      socket.emit("communityModeration", { ok: false, reason: "You are muted in this community." });
      return;
    }
    const moderation = moderateCommunityText(socket, text);
    if(!moderation.ok){
      socket.emit("communityModeration", moderation);
      return;
    }
    const saved = database.saveCommunityMessage({
      communitySlug:state.community,
      channelName:state.channel,
      userId:socket.communityUserId,
      message:text,
      translation:translationMetadata(text)
    });
    if(!saved) return;
    const member = database.db.community_members.find((item) => item.community_id === saved.community.id && item.user_id === socket.communityUserId);
    io.to(state.room).emit("newCommunityMessage", {
      id:saved.record.id,
      community:state.community,
      channel:state.channel,
      type:"message",
      author:communityUserName(socket),
      badge:member ? database.getBadge(member.member_number) : "Member",
      text,
      translation:saved.record.translation || null,
      time:saved.record.created_at
    });
  });

  socket.on("communityTyping",(payload = {})=>{
    const state = socketCommunityState.get(socket.id);
    if(!state) return;
    socket.to(state.room).emit("communityTyping", {
      community:state.community,
      channel:state.channel,
      author:communityUserName(socket),
      isTyping:Boolean(payload.isTyping)
    });
  });

  socket.on("joinVoiceRoom",(payload = {})=>{
    const community = normalizeSlug(payload.community || payload.communitySlug);
    const channel = normalizeChannel(payload.channel || "general");
    if(!community) return;
    socket.join("voice-" + community + "-" + channel);
  });

  socket.on("voiceSignal",(payload = {})=>{
    const community = normalizeSlug(payload.community || payload.communitySlug);
    const channel = normalizeChannel(payload.channel || "general");
    if(!community) return;
    socket.to("voice-" + community + "-" + channel).emit("voiceSignal", {
      community,
      channel,
      from:socket.id,
      signal:payload.signal || null
    });
  });

  socket.on("joinLivestream",(payload = {})=>{
    const livestreamId = String(payload.livestreamId || "");
    if(livestreamId) socket.join("livestream-" + livestreamId);
  });

  socket.on("livestreamSignal",(payload = {})=>{
    const livestreamId = String(payload.livestreamId || "");
    if(!livestreamId) return;
    socket.to("livestream-" + livestreamId).emit("livestreamSignal", {
      livestreamId,
      from:socket.id,
      signal:payload.signal || null
    });
  });

  socket.on("message",(msg)=>{
    if(socket.room){
      const text = String(typeof msg === "object" ? msg.text : msg || "").trim().slice(0, 2000);
      if (!text) return;
      socket.to(socket.room).emit("message", { text, translation: translationMetadata(text) });
    }
  });

  socket.on("typing",(state)=>{
    if(socket.room){
      socket.to(socket.room).emit("typing",state);
    }
  });

  socket.on("next",()=>{

    if(socket.room){

      const room = socket.room;

      socket.to(room).emit("status","Stranger disconnected");

      const clients = io.sockets.adapter.rooms.get(room);

      if(clients){
        clients.forEach(id=>{
          const s = io.sockets.sockets.get(id);
          if(!s) return;

          s.leave(room);

          if(s.id !== socket.id){
            waitingQueue.push(s);
            resetStrangerPeer(s);
          }
        });
      }

      waitingQueue = waitingQueue.filter(s=>s.id !== socket.id);
      waitingQueue.unshift(socket);
      resetStrangerPeer(socket);

    }else{
      waitingQueue = waitingQueue.filter(s=>s.id !== socket.id);
      waitingQueue.unshift(socket);
      resetStrangerPeer(socket);
    }

    tryMatch();
  });

  socket.on("disconnect",()=>{

    console.log("User disconnected:", socket.id);

    const count = io.engine.clientsCount;
  io.emit("onlineCount", count);


    // ✅ REMOVE USER FROM QUEUE
    waitingQueue = waitingQueue.filter(s=>s.id !== socket.id);
    socketRateLimits.delete(socket.id);
    leaveDiscussion(socket);
    leaveCommunityRoom(socket, socketCommunityState.get(socket.id));

    if(socket.room){

      socket.to(socket.room).emit("status","Stranger disconnected");

      const room = socket.room;
      const clients = io.sockets.adapter.rooms.get(room);

      if(clients){
        clients.forEach(id=>{
          const s = io.sockets.sockets.get(id);
          if(s){
            s.leave(room);
            if(s.id !== socket.id){
              resetStrangerPeer(s);
              waitingQueue.push(s);
            }
          }
        });
      }

      tryMatch();
    }
  });

});

database.initializePersistence()
  .catch((error) => {
    console.error("[database] MongoDB unavailable, continuing with local store:", error.message);
  })
  .finally(() => {
    server.listen(Number(process.env.PORT || 5000), "0.0.0.0", () => {
      console.log(`Server running on port ${process.env.PORT || 5000}...`);
    });
  });
