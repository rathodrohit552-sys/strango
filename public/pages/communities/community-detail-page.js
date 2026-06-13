import { renderCommunityIcon } from "../../components/community/icons.js";
import { renderPostCard } from "../../components/post/post-card.js";
import { setupCreatePostModal } from "../../components/community/create-post-modal.js";
import { animateCards, attachRouteTransitions, fadeInPage } from "../../components/community/motion.js";
import { setupSidebar } from "../../components/sidebar/sidebar.js";
import { renderLiveDiscussionShell, renderMembersPanel, setupLiveDiscussion } from "../../components/community/live-discussion.js";

function getSlugFromPath() {
  var parts = window.location.pathname.replace(/\/$/, "").split("/");
  if (parts.length < 3) return "";
  return parts[2];
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

var cleanupLiveDiscussion = null;

async function loadCommunity(slug) {
  var response = await fetch("/api/communities/" + slug);
  if (!response.ok) return null;
  var data = await response.json();
  return data.community || null;
}

async function loadPosts(slug) {
  var response = await fetch("/api/communities/" + slug + "/posts");
  if (!response.ok) return [];
  var data = await response.json();
  return Array.isArray(data.posts) ? data.posts : [];
}

function showWelcomeModal(community, joinResult) {
  if (!joinResult || !joinResult.showWelcome) return;
  var modal = document.createElement("div");
  modal.className = "create-post-modal is-open";
  modal.setAttribute("aria-hidden", "false");
  modal.innerHTML = [
    '<div class="create-post-backdrop" data-welcome-close></div>',
    '<section class="create-post-panel welcome-panel" role="dialog" aria-modal="true">',
    '  <button class="create-post-close" type="button" data-welcome-close>Close</button>',
    '  <p class="community-modal-kicker">Welcome</p>',
    '  <h2>Welcome to ' + community.name + '</h2>',
    '  <p>You are member #' + Number(joinResult.memberNumber).toLocaleString() + '</p>',
    '  <p><strong>Badge earned:</strong> ' + joinResult.badge + '</p>',
    '  <button class="button primary" type="button" data-welcome-close>Continue</button>',
    '</section>'
  ].join("");
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-welcome-close]").forEach(function(button) {
    button.addEventListener("click", function() {
      modal.remove();
    });
  });
}

function renderDetail(root, community, posts) {
  if (cleanupLiveDiscussion) {
    cleanupLiveDiscussion();
    cleanupLiveDiscussion = null;
  }
  document.title = community.name + " - Strango";
  root.style.setProperty("--community-rgb", community.rgb);
  root.innerHTML = [
    '<section class="community-detail-hero">',
    '  <a class="community-back-link" href="/app/communities">Back to communities</a>',
    '  <div class="community-detail-icon" aria-hidden="true">' + renderCommunityIcon(community.icon) + '</div>',
    '  <div class="community-detail-copy">',
    '    <p class="eyebrow">' + community.theme + ' community</p>',
    '    <h1>' + community.name + '</h1>',
    '    <p>' + community.description + '</p>',
    '    <div class="community-detail-meta">',
    '      <span>' + Number(community.memberCount || 0).toLocaleString() + ' members</span>',
    '      <span>' + Number(community.topicCount || posts.length || 0).toLocaleString() + ' topics</span>',
    '    </div>',
    '  </div>',
    '  <button class="button primary community-create-button" type="button" data-open-create-post>Create Post</button>',
    '</section>',
    '<nav class="community-tabs" aria-label="' + community.name + ' sections">',
    '  <button class="community-tab is-active" type="button" data-community-tab="posts">Posts</button>',
    '  <button class="community-tab" type="button" data-community-tab="live">Live Discussion</button>',
    '  <button class="community-tab" type="button" data-community-tab="members">Members</button>',
    '</nav>',
    '<section class="community-tab-panel is-active" data-community-panel="posts">',
    posts.length ? '<section class="topic-list" aria-label="' + community.name + ' posts">' + posts.map(renderPostCard).join("") + '</section>' : renderEmptyState(community),
    '</section>',
    '<section class="community-tab-panel" data-community-panel="live">' + renderLiveDiscussionShell(community) + '</section>',
    '<section class="community-tab-panel" data-community-panel="members">' + renderMembersPanel(community) + '</section>',
    '<button class="button primary sticky-create-post" type="button" data-open-create-post>Create Post</button>'
  ].join("");
  fadeInPage(root);
  animateCards(root);
  attachRouteTransitions(root);
  setupCommunityTabs(root);
  cleanupLiveDiscussion = setupLiveDiscussion(root, community);
}

function setupCommunityTabs(root) {
  var tabs = Array.from(root.querySelectorAll("[data-community-tab]"));
  var panels = Array.from(root.querySelectorAll("[data-community-panel]"));
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      var target = tab.getAttribute("data-community-tab");
      tabs.forEach(function(item) {
        var active = item === tab;
        item.classList.toggle("is-active", active);
        if (active) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      });
      panels.forEach(function(panel) {
        panel.classList.toggle("is-active", panel.getAttribute("data-community-panel") === target);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", async function() {
  setupSidebar();
  var root = document.getElementById("communityDetailPage");
  if (!root) return;
  var slug = getSlugFromPath();
  if (!slug) return;
  var community = await loadCommunity(slug);
  if (!community) {
    root.innerHTML = '<section class="community-empty-state"><h1>Community not found</h1><p>This Strango community is not available yet.</p><a class="button primary" href="/app/communities">View communities</a></section>';
    return;
  }
  var posts = await loadPosts(slug);
  var joinResponse = await fetch("/api/communities/" + slug + "/join", { method: "POST" });
  var joinResult = joinResponse.ok ? await joinResponse.json() : null;
  if (joinResult && joinResult.community) community = joinResult.community;

  var modal = setupCreatePostModal(async function(post) {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
    if (post.communitySlug !== community.slug) {
      window.location.href = "/app/communities/" + post.communitySlug;
      return;
    }
    community = await loadCommunity(slug);
    posts = await loadPosts(slug);
    renderDetail(root, community, posts);
    bindCreateButtons();
  });

  function bindCreateButtons() {
    root.querySelectorAll("[data-open-create-post]").forEach(function(button) {
      button.addEventListener("click", function() {
        modal.open(community.slug);
      });
    });
  }

  window.addEventListener("strango:create-post", function() {
    modal.open(community.slug);
  });

  renderDetail(root, community, posts);
  showWelcomeModal(community, joinResult);
  bindCreateButtons();
});
