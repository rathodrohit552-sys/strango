import { communities as communityList, getCommunityBySlug } from "./communities.js";

export const communityConfig = communityList.reduce(function(config, community) {
  config[community.slug] = community;
  return config;
}, {});

export const communities = communityList;

export function getCommunity(slug) {
  return getCommunityBySlug(slug);
}

export function getAllPosts() {
  return communities.flatMap(function(community) {
    return (community.posts || []).map(function(post) {
      return Object.assign({ communitySlug: community.slug, communityName: community.name }, post);
    });
  });
}
