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

export function renderPostCard(post) {
  var metrics = [];
  var likes = Number(post.likes || 0);
  var comments = Number(post.comments || 0);
  if (likes > 0) metrics.push('<span>' + likes.toLocaleString() + ' likes</span>');
  if (comments > 0) metrics.push('<span>' + comments.toLocaleString() + ' comments</span>');

  return [
    '<article class="topic-card" data-motion-card>',
    '  <div class="topic-card-main">',
    '    <h3>' + escapeHtml(post.title) + '</h3>',
    '    <p>' + escapeHtml(post.preview || post.content || "") + '</p>',
    '  </div>',
    '  <div class="topic-card-footer">',
    '    <span>By ' + escapeHtml(post.author || "Anonymous member") + '</span>',
    '    <span>' + escapeHtml(post.time || "Just now") + '</span>',
    metrics.join(""),
    '  </div>',
    '</article>'
  ].join("");
}
