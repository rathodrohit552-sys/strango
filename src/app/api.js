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
  const remoteBySlug = new Map(remote.map((community) => [community.slug, community]));
  const merged = fallback.map((base) => {
    const community = remoteBySlug.get(base.slug);
    if (!community) return base;
    remoteBySlug.delete(base.slug);
    return {
      ...base,
      name: base.name,
      icon: base.icon,
      description: community.description || base.description,
      category: community.category || base.category,
      members: community.memberCount > 100 ? formatCount(community.memberCount) : base.members,
      online: community.onlineCount || base.online
    };
  });
  remoteBySlug.forEach((community, slug) => {
    const index = merged.length;
    merged.push({
      slug,
      name: community.name,
      icon: community.shortName?.slice(0, 2).toUpperCase() || community.name.slice(0, 1),
      description: community.description,
      category: community.category || community.shortName || "Community",
      members: community.memberCount ? formatCount(community.memberCount) : "New",
      online: community.onlineCount || 0,
      color: fallback[index % fallback.length].color,
      activity: "Recently active"
    });
  });
  return merged;
}
