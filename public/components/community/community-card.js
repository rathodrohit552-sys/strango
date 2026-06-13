import { renderCommunityIcon } from "./icons.js";

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

export function renderCommunityCard(community, postCount) {
  var count = typeof postCount === "number" ? postCount : Number(community.topicCount || 0);
  var members = Number(community.memberCount || 0);
  var metrics = [];
  if (count > 0) metrics.push("<span>" + count.toLocaleString() + " posts</span>");
  if (members > 0) metrics.push("<span>" + members.toLocaleString() + " members</span>");
  return [
    '<a class="community-card" data-motion-card href="/app/communities/' + escapeHtml(community.slug) + '" style="--community-rgb:' + escapeHtml(community.rgb) + '">',
    '  <span class="community-icon" aria-hidden="true">' + renderCommunityIcon(community.icon) + '</span>',
    '  <span class="community-theme">' + escapeHtml(community.theme) + '</span>',
    '  <h3>' + escapeHtml(community.name) + '</h3>',
    '  <p>' + escapeHtml(community.description) + '</p>',
    metrics.length ? '  <span class="community-meta">' + metrics.join("") + '</span>' : '  <span class="community-meta">New community</span>',
    '  <span class="community-join">Open</span>',
    '</a>'
  ].join("");
}
