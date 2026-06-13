import { setupSidebar } from "../../components/sidebar/sidebar.js";
import { setupCreatePostModal } from "../../components/community/create-post-modal.js";
import { fadeInPage } from "../../components/community/motion.js";
import { renderTrendingPanel } from "../../components/trending/trending-panel.js";

document.addEventListener("DOMContentLoaded", function() {
  setupSidebar();
  var root = document.getElementById("trendingPage");
  var modal = setupCreatePostModal(async function(post) {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
    await renderTrendingPanel(root);
  });
  window.addEventListener("strango:create-post", function() {
    modal.open();
  });
  renderTrendingPanel(root);
  fadeInPage(root);
});
