import { animateModalOpen } from "./motion.js";

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

function modalMarkup() {
  return [
    '<div id="createPostModal" class="create-post-modal" aria-hidden="true">',
    '  <div class="create-post-backdrop" data-create-post-close></div>',
    '  <section class="create-post-panel" role="dialog" aria-modal="true" aria-labelledby="createPostTitle">',
    '    <button class="create-post-close" type="button" aria-label="Close create post" data-create-post-close>Close</button>',
    '    <p class="community-modal-kicker">New discussion</p>',
    '    <h2 id="createPostTitle">Create Post</h2>',
    '    <form id="createPostForm" class="create-post-form" novalidate>',
    '      <label for="postTitle">Title</label>',
    '      <input id="postTitle" name="title" type="text" autocomplete="off" placeholder="What should people discuss?">',
    '      <p class="field-error" data-error-for="title"></p>',
    '      <label for="postContent">Content</label>',
    '      <textarea id="postContent" name="content" rows="5" placeholder="Share context, a question, or your take."></textarea>',
    '      <p class="field-error" data-error-for="content"></p>',
    '      <label for="postCommunity">Community</label>',
    '      <select id="postCommunity" name="communitySlug"></select>',
    '      <button class="button primary create-post-submit" type="submit">Submit</button>',
    '    </form>',
    '  </section>',
    '</div>'
  ].join("");
}

export function setupCreatePostModal(onSubmit) {
  var existing = document.getElementById("createPostModal");
  if (!existing) {
    document.body.insertAdjacentHTML("beforeend", modalMarkup());
  }

  var modal = document.getElementById("createPostModal");
  var panel = modal.querySelector(".create-post-panel");
  var form = document.getElementById("createPostForm");
  var title = document.getElementById("postTitle");
  var content = document.getElementById("postContent");
  var community = document.getElementById("postCommunity");
  var titleError = modal.querySelector("[data-error-for='title']");
  var contentError = modal.querySelector("[data-error-for='content']");

  function loadCommunities() {
    fetch("/api/communities")
      .then(function(response) { return response.ok ? response.json() : null; })
      .then(function(data) {
        var communities = data && Array.isArray(data.communities) ? data.communities : [];
        community.innerHTML = communities.map(function(item) {
          return '<option value="' + escapeHtml(item.slug) + '">' + escapeHtml(item.name) + '</option>';
        }).join("");
      })
      .catch(function(){});
  }

  loadCommunities();

  function clearErrors() {
    titleError.textContent = "";
    contentError.textContent = "";
    title.removeAttribute("aria-invalid");
    content.removeAttribute("aria-invalid");
  }

  function open(defaultCommunitySlug) {
    clearErrors();
    form.reset();
    if (defaultCommunitySlug) community.value = defaultCommunitySlug;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("community-modal-open");
    animateModalOpen(panel);
    window.setTimeout(function() {
      title.focus({ preventScroll: true });
    }, 40);
  }

  function close() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("community-modal-open");
  }

  modal.querySelectorAll("[data-create-post-close]").forEach(function(button) {
    button.addEventListener("click", close);
  });

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    clearErrors();
    var titleValue = title.value.trim();
    var contentValue = content.value.trim();
    var hasError = false;

    if (!titleValue) {
      titleError.textContent = "Title is required.";
      title.setAttribute("aria-invalid", "true");
      hasError = true;
    }

    if (!contentValue) {
      contentError.textContent = "Content is required.";
      content.setAttribute("aria-invalid", "true");
      hasError = true;
    }

    if (hasError) {
      (titleValue ? content : title).focus({ preventScroll: true });
      return;
    }

    onSubmit({
      title: titleValue,
      content: contentValue,
      communitySlug: community.value
    });
    close();
  });

  return { open: open, close: close };
}
