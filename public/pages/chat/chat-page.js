import { setupSidebar } from "../../components/sidebar/sidebar.js";
import { setupCreatePostModal } from "../../components/community/create-post-modal.js";
import { fadeInPage } from "../../components/community/motion.js";

document.addEventListener("DOMContentLoaded", function() {
  setupSidebar();
  var root = document.querySelector(".app-chat-dashboard");
  var modal = setupCreatePostModal(async function(post) {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post)
    });
    window.location.href = "/app/communities/" + post.communitySlug;
  });

  window.addEventListener("strango:create-post", function() {
    modal.open();
  });

  document.querySelectorAll("[data-focus-random-chat]").forEach(function(button) {
    button.addEventListener("click", function() {
      var input = document.getElementById("messageInput");
      var chat = document.getElementById("random-chat");
      if (chat) chat.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(function() {
        if (input) input.focus({ preventScroll: true });
      }, 360);
    });
  });

  if (root) fadeInPage(root);
});
