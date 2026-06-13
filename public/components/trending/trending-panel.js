import { renderCommunityIcon } from "../community/icons.js";
import { renderPostCard } from "../post/post-card.js";
import { animateCards } from "../community/motion.js";

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

function activityItem(post) {
  var details = [];
  if (post.time) details.push(escapeHtml(post.time));
  if (Number(post.comments || 0) > 0) {
    details.push(Number(post.comments).toLocaleString() + " comments");
  }

  return [
    '<article class="activity-item">',
    '  <strong>' + escapeHtml(post.communityName) + '</strong>',
    '  <span>' + escapeHtml(post.title) + '</span>',
    details.length ? '  <small>' + details.join(" / ") + '</small>' : "",
    '</article>'
  ].join("");
}

function popularCommunity(community) {
  var members = Number(community.memberCount || 0);
  return [
    '<a class="popular-community" href="/app/communities/' + escapeHtml(community.slug) + '" style="--community-rgb:' + escapeHtml(community.rgb) + '">',
    '  <span class="community-icon" aria-hidden="true">' + renderCommunityIcon(community.icon) + '</span>',
    '  <span><strong>' + escapeHtml(community.name) + '</strong><small>' + (members > 0 ? members.toLocaleString() + " members" : "New community") + '</small></span>',
    '</a>'
  ].join("");
}

export async function renderTrendingPanel(root) {
  var response = await fetch("/api/trending");
  var data = response.ok ? await response.json() : { communities: [], posts: [], recentActivity: [] };
  var posts = (data.posts || []).slice().sort(function(a, b) {
    return (b.likes + b.comments * 2) - (a.likes + a.comments * 2);
  });
  var topPosts = posts.slice(0, 5);
  var popular = (data.communities || []).slice(0, 5);
  var recent = (data.recentActivity || []).slice(0, 7);
  var emptyPosts = '<section class="community-empty-state compact"><h2>No discussions yet</h2><p>Create a post to make it appear here.</p></section>';
  var emptyActivity = '<article class="activity-item"><strong>No recent activity</strong><span>Real activity will appear here when members post.</span></article>';
  var emptyCommunities = '<div class="community-empty-state compact"><h2>No communities yet</h2><p>Communities will appear here as members join.</p></div>';

  root.innerHTML = [
    '<section class="app-page-heading">',
    '  <p class="eyebrow">Trending</p>',
    '  <h1>What Strango is talking about now.</h1>',
    '  <p>Fast-moving discussions, active communities, and recent activity across the platform.</p>',
    '</section>',
    '<section class="trending-layout">',
    '  <div class="trending-main">',
    '    <div class="app-section-title"><h2>Trending discussions</h2></div>',
    '    <div class="topic-list">' + (topPosts.length ? topPosts.map(renderPostCard).join("") : emptyPosts) + '</div>',
    '  </div>',
    '  <aside class="trending-aside">',
    '    <section class="dashboard-panel"><h2>Popular communities</h2><div class="popular-community-list">' + (popular.length ? popular.map(popularCommunity).join("") : emptyCommunities) + '</div></section>',
    '    <section class="dashboard-panel"><h2>Recent activity</h2><div class="activity-list">' + (recent.length ? recent.map(activityItem).join("") : emptyActivity) + '</div></section>',
    '  </aside>',
    '</section>'
  ].join("");
  animateCards(root);
}
