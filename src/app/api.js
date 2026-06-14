export async function api(path, options = {}) {
  try {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

export function formatCount(value) {
  const number = Number(value || 0);
  if (number >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
  return String(number);
}

export function mergeCommunities(remote, fallback) {
  if (!Array.isArray(remote) || !remote.length) return fallback;
  const designBySlug = new Map(fallback.map((community) => [community.slug, community]));
  return remote.map((community, index) => {
    const design = designBySlug.get(community.slug) || fallback[index % fallback.length] || {};
    return {
      ...design,
      ...community,
      name: community.name,
      description: community.description,
      category: community.category || community.shortName || design.category || "Community",
      icon: design.icon || community.shortName?.slice(0, 2).toUpperCase() || community.name.slice(0, 1),
      members: Number(community.memberCount || 0),
      online: Number(community.onlineCount || 0),
      topics: Number(community.topicCount || 0),
      activity: community.topicCount ? `${community.topicCount} ${community.topicCount === 1 ? "discussion" : "discussions"}` : "No activity yet"
    };
  });
}
