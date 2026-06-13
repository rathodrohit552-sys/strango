const STORAGE_KEY = "strango-community-posts";

function readStoredPosts() {
  try {
    var raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeStoredPosts(posts) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    return;
  }
}

export function getUserPosts() {
  return readStoredPosts();
}

export function addUserPost(post) {
  var posts = readStoredPosts();
  var nextPost = {
    id: "local-" + Date.now(),
    title: post.title,
    preview: post.content,
    content: post.content,
    communitySlug: post.communitySlug,
    author: "Anonymous member",
    time: "Just now",
    likes: 0,
    comments: 0,
    isLocal: true
  };
  posts.unshift(nextPost);
  writeStoredPosts(posts);
  return nextPost;
}

export function getPostsForCommunity(community) {
  var userPosts = readStoredPosts().filter(function(post) {
    return post.communitySlug === community.slug;
  });
  return userPosts.concat(community.posts || []);
}
