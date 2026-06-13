import { setupSidebar } from "../../components/sidebar/sidebar.js";
import { renderCommunityCard } from "../../components/community/community-card.js";
import { renderCommunityIcon } from "../../components/community/icons.js";
import { renderPostCard } from "../../components/post/post-card.js";
import { setupCreatePostModal } from "../../components/community/create-post-modal.js";
import { renderLiveDiscussionShell, renderMembersPanel, setupLiveDiscussion } from "../../components/community/live-discussion.js";
import { renderTrendingPanel } from "../../components/trending/trending-panel.js";
import { animateCards, attachRouteTransitions, fadeInPage } from "../../components/community/motion.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}

async function getJson(url, fallback) {
  try {
    var response = await fetch(url);
    if (!response.ok) return fallback;
    return await response.json();
  } catch (error) {
    return fallback;
  }
}

function heading(kicker, title, text) {
  return [
    '<section class="app-page-heading">',
    '  <p class="eyebrow">' + escapeHtml(kicker) + '</p>',
    '  <h1>' + escapeHtml(title) + '</h1>',
    '  <p>' + escapeHtml(text) + '</p>',
    '</section>'
  ].join("");
}

function emptyBlock(title, text) {
  return '<section class="community-empty-state compact"><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(text) + '</p></section>';
}

function activityItem(item) {
  return [
    '<article class="activity-item">',
    '  <strong>' + escapeHtml(item.communityName || "Community") + '</strong>',
    '  <span>' + escapeHtml(item.message || item.title || "") + '</span>',
    '  <small>' + escapeHtml(item.author || "") + '</small>',
    '</article>'
  ].join("");
}

function compactCommunityItem(community) {
  var onlineCount = Number(community.onlineCount || 0);
  var memberCount = Number(community.memberCount || 0);
  var communityDetail = memberCount > 0 ? memberCount.toLocaleString() + " members" : "New community";
  return [
    '<a class="feed-community-row" href="/app/communities/' + escapeHtml(community.slug) + '">',
    '  <span class="feed-community-icon" aria-hidden="true">' + renderCommunityIcon(community.icon) + '</span>',
    '  <span class="feed-community-copy"><strong>' + escapeHtml(community.name) + '</strong><small>' + escapeHtml(communityDetail) + '</small></span>',
    '  <span class="feed-community-status' + (onlineCount ? ' is-live' : '') + '">' + (onlineCount ? onlineCount.toLocaleString() + ' online' : 'View') + '</span>',
    '</a>'
  ].join("");
}

async function renderFeed(root) {
  var data = await getJson("/api/feed", { recentDiscussions: [], popularDiscussions: [], trendingCommunities: [], communityActivity: [] });
  root.innerHTML = [
    heading("Feed", "Discover communities and conversations", "Start a chat, join a community, or participate in a discussion shaped by real people."),
    '<section class="feed-grid">',
    '  <div class="feed-main">',
    '    <section class="dashboard-panel feed-discussion-panel"><div class="app-section-title"><h2>Recent discussions</h2><button type="button" data-open-create-post>Create Discussion</button></div><div class="topic-list">' + (data.recentDiscussions.length ? data.recentDiscussions.map(renderPostCard).join("") : '<section class="feed-action-empty"><span class="feed-action-mark">S</span><div><h3>No discussions yet.</h3><p>Start the first discussion and help shape the community.</p></div><button class="button primary" type="button" data-open-create-post>Create Discussion</button></section>') + '</div></section>',
    '  </div>',
    '  <aside class="trending-aside">',
    '    <section class="dashboard-panel feed-communities-panel"><div class="app-section-title"><h2>Communities</h2><a href="/app/communities">View all</a></div><div class="feed-community-list">' + data.trendingCommunities.slice(0, 5).map(compactCommunityItem).join("") + '</div></section>',
    (data.communityActivity.length ? '    <section class="dashboard-panel"><h2>Recent community activity</h2><div class="activity-list">' + data.communityActivity.map(activityItem).join("") + '</div></section>' : ''),
    '  </aside>',
    '</section>'
  ].join("");
  animateCards(root);
  attachRouteTransitions(root);
}

async function renderCommunities(root) {
  var data = await getJson("/api/communities", { communities: [] });
  root.innerHTML = [
    heading("Communities", "Find your Strango community.", "Join focused spaces powered by real membership and activity records."),
    '<div class="community-list-actions"><button class="button primary" type="button" data-open-create-post>Create Post</button><button class="button secondary" type="button" data-create-community>Create Community</button></div>',
    '<div class="community-grid" aria-label="Strango communities">' + data.communities.map(function(community) { return renderCommunityCard(community, community.topicCount); }).join("") + '</div>'
  ].join("");
  animateCards(root);
  attachRouteTransitions(root);
  var createButton = root.querySelector("[data-create-community]");
  if (createButton) {
    createButton.addEventListener("click", function() {
      openCreateCommunityModal();
    });
  }
}

function openCreateCommunityModal() {
  var modal = document.createElement("div");
  modal.className = "create-post-modal is-open";
  modal.innerHTML = [
    '<div class="create-post-backdrop" data-community-create-close></div>',
    '<section class="create-post-panel" role="dialog" aria-modal="true">',
    '  <button class="create-post-close" type="button" data-community-create-close>Close</button>',
    '  <p class="community-modal-kicker">New community</p>',
    '  <h2>Create Community</h2>',
    '  <form class="create-post-form" data-community-create-form>',
    '    <label>Name</label><input name="name" type="text" required>',
    '    <label>Description</label><textarea name="description" rows="4" required></textarea>',
    '    <label>Icon</label><input name="icon" type="text" placeholder="spark">',
    '    <label>Category</label><input name="category" type="text" placeholder="General">',
    '    <button class="button primary" type="submit">Create Community</button>',
    '  </form>',
    '</section>'
  ].join("");
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-community-create-close]").forEach(function(button) {
    button.addEventListener("click", function() { modal.remove(); });
  });
  modal.querySelector("[data-community-create-form]").addEventListener("submit", async function(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var body = {
      name: form.name.value.trim(),
      description: form.description.value.trim(),
      icon: form.icon.value.trim() || "spark",
      category: form.category.value.trim()
    };
    var response = await fetch("/api/communities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (response.ok) {
      var data = await response.json();
      window.location.href = "/app/communities/" + data.community.slug;
    }
  });
}

function renderEmptyState(community) {
  return [
    '<section class="community-empty-state">',
    '  <span class="community-empty-icon" aria-hidden="true">' + renderCommunityIcon(community.icon) + '</span>',
    '  <h2>No discussions yet</h2>',
    '  <p>Be the first person to start a conversation.</p>',
    '  <button class="button primary large" type="button" data-open-create-post>Create First Post</button>',
    '</section>'
  ].join("");
}

function setupTabs(root) {
  var tabs = Array.from(root.querySelectorAll("[data-community-tab]"));
  var panels = Array.from(root.querySelectorAll("[data-community-panel]"));
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      var target = tab.getAttribute("data-community-tab");
      tabs.forEach(function(item) { item.classList.toggle("is-active", item === tab); });
      panels.forEach(function(panel) { panel.classList.toggle("is-active", panel.getAttribute("data-community-panel") === target); });
      if (target === "live") {
        root.dispatchEvent(new CustomEvent("strango:activate-live-discussion"));
      }
    });
  });
}

function communityMetricMarkup(community) {
  var metrics = [];
  var members = Number(community.memberCount || 0);
  var topics = Number(community.topicCount || 0);
  if (members > 0) metrics.push("<span>" + members.toLocaleString() + " members</span>");
  if (topics > 0) metrics.push("<span>" + topics.toLocaleString() + " posts</span>");
  return metrics.length ? '<div class="community-detail-meta">' + metrics.join("") + "</div>" : "";
}

async function renderCommunityDetail(root, slug) {
  var communityData = await getJson("/api/communities/" + slug, null);
  if (!communityData || !communityData.community) {
    root.innerHTML = emptyBlock("Community not found", "This community is not available.");
    return;
  }
  var community = communityData.community;
  var postsData = await getJson("/api/communities/" + slug + "/posts", { posts: [] });
  var posts = postsData.posts || [];
  root.style.setProperty("--community-rgb", community.rgb);
  root.innerHTML = [
    '<section class="community-detail-hero">',
    '  <a class="community-back-link" href="/app/communities">Back to communities</a>',
    '  <div class="community-detail-icon" aria-hidden="true">' + renderCommunityIcon(community.icon) + '</div>',
    '  <div class="community-detail-copy"><p class="eyebrow">' + escapeHtml(community.theme) + ' community</p><h1>' + escapeHtml(community.name) + '</h1><p>' + escapeHtml(community.description) + '</p>',
    communityMetricMarkup(community),
    '  </div><button class="button primary community-create-button" type="button" data-open-create-post>Create Post</button>',
    '</section>',
    '<nav class="community-tabs" aria-label="' + escapeHtml(community.name) + ' sections"><button class="community-tab is-active" type="button" data-community-tab="posts">Posts</button><button class="community-tab" type="button" data-community-tab="live">Live Discussion</button><button class="community-tab" type="button" data-community-tab="members">Members</button></nav>',
    '<section class="community-tab-panel is-active" data-community-panel="posts">' + (posts.length ? '<section class="topic-list">' + posts.map(renderPostCard).join("") + '</section>' : renderEmptyState(community)) + '</section>',
    '<section class="community-tab-panel" data-community-panel="live">' + renderLiveDiscussionShell(community) + '</section>',
    '<section class="community-tab-panel" data-community-panel="members">' + renderMembersPanel(community) + '</section>',
    '<button class="button primary sticky-create-post" type="button" data-open-create-post>Create Post</button>'
  ].join("");
  setupTabs(root);
  setupLiveDiscussion(root, community);
  animateCards(root);
  attachRouteTransitions(root);
}

async function renderChat(root) {
  var data = await getJson("/api/feed", { communityActivity: [] });
  var activity = (data.communityActivity || []).slice(0, 6);
  root.innerHTML = [
    heading("Chat", "Choose how you want to talk.", "Random chat, topic-led discovery, and community discussion rooms are separated so every chat path has one purpose."),
    '<section class="chat-lanes-grid">',
    '  <article id="random-chat" class="chat-choice-card"><span class="chat-choice-icon" aria-hidden="true">R</span><h2>Random Chat</h2><p>Jump into fast anonymous text chat with a stranger.</p><a class="button primary large" href="/chat">Start Random Chat</a></article>',
    '  <article id="topic-chat" class="chat-choice-card"><span class="chat-choice-icon" aria-hidden="true">T</span><h2>Topic Chat</h2><p>Pick a subject first, then join conversations around shared interests.</p><a class="button secondary large" href="/app/communities">Browse Topics</a></article>',
    '  <article id="community-chat" class="chat-choice-card"><span class="chat-choice-icon" aria-hidden="true">C</span><h2>Community Discussion Rooms</h2><p>Enter live room discussions attached to focused communities.</p><a class="button secondary large" href="/app/communities">View Rooms</a></article>',
    '</section>',
    '<section class="dashboard-panel chat-rooms-panel"><div class="app-section-title"><h2>Recent Activity</h2><a href="/app/communities">All communities</a></div><div class="activity-list">' + (activity.length ? activity.map(activityItem).join("") : '<article class="activity-item"><strong>No recent activity</strong><span>Community activity will appear here as members join discussions.</span></article>') + '</div></section>'
  ].join("");
  animateCards(root);
  attachRouteTransitions(root);
}

async function renderNotifications(root) {
  var data = await getJson("/api/notifications", { notifications: [] });
  root.innerHTML = heading("Notifications", "Your notifications.", "Replies, mentions, badges, and community updates.") + '<section class="dashboard-panel"><div class="activity-list">' + (data.notifications.length ? data.notifications.map(function(item) { return '<article class="activity-item"><strong>' + escapeHtml(item.type) + '</strong><span>' + escapeHtml(JSON.stringify(item.payload || {})) + '</span><small>' + escapeHtml(item.created_at) + '</small></article>'; }).join("") : '<article class="activity-item"><strong>No notifications</strong><span>Real notifications will appear here.</span></article>') + '</div></section>';
}

async function renderMessages(root) {
  var data = await getJson("/api/conversations", { conversations: [] });
  root.innerHTML = heading("Messages", "Direct messages.", "Real user-to-user conversations and read status.") + '<section class="dashboard-panel"><div class="activity-list">' + (data.conversations.length ? data.conversations.map(function(item) {
    var unread = Number(item.unreadCount || 0);
    return '<article class="activity-item"><strong>Conversation #' + escapeHtml(item.conversation.id) + '</strong><span>' + escapeHtml(item.lastMessage ? item.lastMessage.message : "No messages yet") + '</span>' + (unread > 0 ? '<small>' + unread.toLocaleString() + ' unread</small>' : '') + '</article>';
  }).join("") : '<article class="activity-item"><strong>No conversations</strong><span>Your real inbox will appear here.</span></article>') + '</div></section>';
}

async function renderProfile(root) {
  var data = await getJson("/api/profile", null);
  if (!data) {
    root.innerHTML = emptyBlock("Profile unavailable", "Could not load profile.");
    return;
  }
  var displayName = data.profile.display_name || "Anonymous User";
  var avatarUrl = data.profile.avatar_url || "";
  var initial = displayName.trim().charAt(0).toUpperCase() || "S";
  var sparkPoints = Number(data.sparks.points || 0);
  root.innerHTML = [
    heading("Profile", displayName, "Your avatar, communities, posts, badges, and sparks."),
    '<section class="dashboard-panel profile-summary-panel">',
    '  <div class="profile-avatar">' + (avatarUrl ? '<img src="' + escapeHtml(avatarUrl) + '" alt="">' : '<span>' + escapeHtml(initial) + '</span>') + '</div>',
    '  <div><h2>' + escapeHtml(displayName) + '</h2><p>' + escapeHtml(data.user.isAnonymous ? "Anonymous profile" : data.user.email || "Strango profile") + '</p></div>',
    '</section>',
    '<section class="profile-grid">',
    '  <article class="dashboard-panel"><h2>Sparks</h2>' + (sparkPoints > 0 ? '<p class="profile-score">' + sparkPoints.toLocaleString() + '</p><strong>' + escapeHtml(data.sparks.level || "Explorer") + '</strong>' : '<div class="activity-item"><strong>No Sparks yet</strong><span>Earn real recognition through community participation.</span></div>') + '</article>',
    '  <article class="dashboard-panel"><h2>Joined Communities</h2><div class="activity-list">' + (data.joinedCommunities.length ? data.joinedCommunities.map(function(community) { var members = Number(community.memberCount || 0); return '<article class="activity-item"><strong>' + escapeHtml(community.name) + '</strong><span>' + (members > 0 ? members.toLocaleString() + ' members' : 'New community') + '</span></article>'; }).join("") : '<article class="activity-item"><strong>No communities joined</strong><span>Join a community to see it here.</span></article>') + '</div></article>',
    '  <article class="dashboard-panel"><h2>Posts</h2><div class="activity-list">' + (data.posts.length ? data.posts.slice().reverse().map(function(post) { return '<article class="activity-item"><strong>' + escapeHtml(post.title) + '</strong><span>' + escapeHtml(post.created_at || "") + '</span></article>'; }).join("") : '<article class="activity-item"><strong>No posts yet</strong><span>Your posts will appear here.</span></article>') + '</div></article>',
    '  <article class="dashboard-panel"><h2>Badges</h2><div class="activity-list">' + (data.badges.length ? data.badges.map(function(badge) { return '<article class="activity-item"><strong>' + escapeHtml(badge.badge) + '</strong><span>' + escapeHtml(badge.community) + ' member #' + Number(badge.memberNumber).toLocaleString() + '</span></article>'; }).join("") : '<article class="activity-item"><strong>No badges yet</strong><span>Join communities to earn badges.</span></article>') + '</div></article>',
    '</section>'
  ].join("");
}

function renderSettings(root) {
  root.innerHTML = heading("Settings", "Platform settings.", "Authentication and account controls.") + '<section class="dashboard-panel"><h2>Authentication</h2><p>Anonymous mode remains available. Use the sidebar for Email Login or Google Login.</p></section>';
}

async function route() {
  setupSidebar();
  var root = document.getElementById("appRoot");
  var path = window.location.pathname.replace(/\/$/, "") || "/app";
  var modal = setupCreatePostModal(async function(post) {
    await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(post) });
    route();
  });
  window.addEventListener("strango:create-post", function() { modal.open(); }, { once: true });
  if (path === "/app") await renderFeed(root);
  else if (path === "/app/communities") await renderCommunities(root);
  else if (path.indexOf("/app/communities/") === 0) await renderCommunityDetail(root, path.split("/").pop());
  else if (path === "/app/trending") await renderTrendingPanel(root);
  else if (path === "/app/chat") await renderChat(root);
  else if (path === "/app/notifications") await renderNotifications(root);
  else if (path === "/app/messages") await renderMessages(root);
  else if (path === "/app/profile") await renderProfile(root);
  else if (path === "/app/settings") renderSettings(root);
  else root.innerHTML = emptyBlock("Page not found", "This app route is not available.");
  root.querySelectorAll("[data-open-create-post]").forEach(function(button) {
    button.addEventListener("click", function() { modal.open(path.indexOf("/app/communities/") === 0 ? path.split("/").pop() : undefined); });
  });
  fadeInPage(root);
}

document.addEventListener("DOMContentLoaded", route);
