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

function discussionCard(post) {
  return [
    '<article class="home-data-card">',
    '  <span>' + escapeHtml(post.communityName || "Community") + '</span>',
    '  <h3>' + escapeHtml(post.title || "Discussion") + '</h3>',
    '  <p>' + escapeHtml(post.preview || "") + '</p>',
    '  <small>' + Number(post.comments || 0).toLocaleString() + ' comments · ' + Number(post.likes || 0).toLocaleString() + ' likes</small>',
    '</article>'
  ].join("");
}

function activityCard(item) {
  return [
    '<article class="home-data-card">',
    '  <span>' + escapeHtml(item.communityName || "Community") + '</span>',
    '  <h3>' + escapeHtml(item.author || "Member") + '</h3>',
    '  <p>' + escapeHtml(item.message || item.title || "") + '</p>',
    '</article>'
  ].join("");
}

function emptyCard(text) {
  return '<article class="home-data-card is-empty"><h3>No real activity yet</h3><p>' + escapeHtml(text) + '</p><a class="button secondary mini" href="/app">Open App</a></article>';
}

document.addEventListener("DOMContentLoaded", function() {
  var trending = document.querySelector("[data-home-trending]");
  var activity = document.querySelector("[data-home-activity]");
  if (!trending && !activity) return;

  fetch("/api/feed")
    .then(function(response) { return response.ok ? response.json() : null; })
    .then(function(data) {
      data = data || { popularDiscussions: [], communityActivity: [] };
      if (trending) {
        trending.innerHTML = data.popularDiscussions && data.popularDiscussions.length
          ? data.popularDiscussions.slice(0, 3).map(discussionCard).join("")
          : emptyCard("Trending discussions appear after members create posts, comments, or reactions.");
      }
      if (activity) {
        activity.innerHTML = data.communityActivity && data.communityActivity.length
          ? data.communityActivity.slice(0, 4).map(activityCard).join("")
          : emptyCard("Recent community activity appears after real posts or live discussion messages.");
      }
    })
    .catch(function() {
      if (trending) trending.innerHTML = emptyCard("Unable to load real discussion data right now.");
      if (activity) activity.innerHTML = emptyCard("Unable to load real activity data right now.");
    });
});
