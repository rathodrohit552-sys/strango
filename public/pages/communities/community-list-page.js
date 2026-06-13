import { renderCommunityCard } from "../../components/community/community-card.js";
import { setupCreatePostModal } from "../../components/community/create-post-modal.js";
import { animateCards, attachRouteTransitions, fadeInPage } from "../../components/community/motion.js";
import { setupSidebar } from "../../components/sidebar/sidebar.js";

async function loadCommunities() {
  var response = await fetch("/api/communities");
  if (!response.ok) throw new Error("Unable to load communities");
  var data = await response.json();
  return Array.isArray(data.communities) ? data.communities : [];
}

async function renderList(container) {
  var communities = await loadCommunities();
  container.innerHTML = communities.map(function(community) {
    return renderCommunityCard(community, community.topicCount);
  }).join("");
  animateCards(container);
  attachRouteTransitions(container);
}

function updateHomeHeading(container) {
  var section = container.closest(".communities-section");
  if (!section) return;
  var eyebrow = section.querySelector(".eyebrow");
  var title = section.querySelector(".section-heading h2");
  var text = section.querySelector(".section-heading p:not(.eyebrow)");
  if (eyebrow) eyebrow.textContent = "Communities";
  if (title) title.textContent = "Popular Communities";
  if (text) text.textContent = "Explore active topic spaces across AI, gaming, finance, entertainment, self improvement, beauty, football, and world affairs.";
}

function setupListPage(container) {
  var pageRoot = document.getElementById("communitiesListPage");
  if (!pageRoot) return;
  var modal = setupCreatePostModal(async function(post) {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
    renderList(container);
  });

  fadeInPage(pageRoot);
  pageRoot.querySelectorAll("[data-open-create-post]").forEach(function(button) {
    button.addEventListener("click", function() {
      modal.open();
    });
  });
  window.addEventListener("strango:create-post", function() {
    modal.open();
  });
}

document.addEventListener("DOMContentLoaded", function() {
  setupSidebar();
  var isDetailRoute = /^\/communities\/[^/]+\/?$/.test(window.location.pathname);
  if (isDetailRoute) {
    var listPage = document.getElementById("communitiesListPage");
    if (listPage) listPage.hidden = true;
    return;
  }

  var containers = Array.from(document.querySelectorAll("[data-community-list]"));
  containers.forEach(function(container) {
    updateHomeHeading(container);
    renderList(container);
    setupListPage(container);
  });
});
