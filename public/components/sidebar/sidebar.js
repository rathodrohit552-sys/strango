import { animateElement } from "../community/motion.js";

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

function currentPath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function isActiveRoute(href) {
  var path = currentPath();
  if (href === "/app") return path === "/app";
  if (href === "/app/communities") return path === "/app/communities" || path.indexOf("/app/communities/") === 0;
  return path === href;
}

var sidebarIcons = {
  home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  live: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2a6 6 0 0 1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.5"/><path d="M19.1 4.9a10 10 0 0 1 0 14.1"/>',
  communities: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  discussions: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8"/><path d="M8 13h5"/>',
  messages: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 5L2 7"/>',
  notifications: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  profile: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.97 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.52-1.03H3v-4h.08A1.7 1.7 0 0 0 4.6 8.94a1.7 1.7 0 0 0-.34-1.88L4.2 7l2.83-2.83.06.06a1.7 1.7 0 0 0 1.88.34H9A1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.03 1.52 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 7l-.06.06a1.7 1.7 0 0 0-.34 1.88v.03A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>'
};

function sidebarIcon(name) {
  return '<svg class="app-nav-svg" viewBox="0 0 24 24" aria-hidden="true">' + sidebarIcons[name] + '</svg>';
}

function sidebarMarkup() {
  return [
    '<div class="app-sidebar-inner">',
    '  <a class="app-sidebar-brand" href="/" aria-label="Go to Strango home"><span class="brand-mark">S</span><span class="app-sidebar-brand-copy"><strong>STRANGO</strong><small>Talk Now. Belong Later.</small></span></a>',
    '  <nav class="app-sidebar-nav app-sidebar-primary" aria-label="Primary navigation">',
    '    <a class="app-nav-link app-nav-primary" href="/app" data-sidebar-link data-route="/app"><span class="app-nav-icon">' + sidebarIcon("home") + '</span><span>Feed</span></a>',
    '    <a class="app-nav-link app-nav-primary" href="/app/chat" data-sidebar-link data-route="/app/chat"><span class="app-nav-icon">' + sidebarIcon("live") + '</span><span>Chat</span></a>',
    '    <a class="app-nav-link app-nav-primary" href="/app/communities" data-sidebar-link data-route="/app/communities"><span class="app-nav-icon">' + sidebarIcon("communities") + '</span><span>Communities</span></a>',
    '  </nav>',
    '  <div class="app-sidebar-divider" aria-hidden="true"></div>',
    '  <nav class="app-sidebar-nav app-sidebar-secondary" aria-label="Secondary navigation">',
    '    <a class="app-nav-link app-nav-secondary" href="/app/trending" data-sidebar-link data-route="/app/trending"><span class="app-nav-icon">' + sidebarIcon("discussions") + '</span><span>Trending</span></a>',
    '    <a class="app-nav-link app-nav-secondary" href="/app/messages" data-sidebar-link data-route="/app/messages"><span class="app-nav-icon">' + sidebarIcon("messages") + '</span><span>Messages</span></a>',
    '    <a class="app-nav-link app-nav-secondary" href="/app/notifications" data-sidebar-link data-route="/app/notifications"><span class="app-nav-icon">' + sidebarIcon("notifications") + '</span><span>Notifications</span></a>',
    '    <a class="app-nav-link app-nav-secondary" href="/app/profile" data-sidebar-link data-route="/app/profile"><span class="app-nav-icon">' + sidebarIcon("profile") + '</span><span>Profile</span></a>',
    '    <a class="app-nav-link app-nav-secondary" href="/app/settings" data-sidebar-link data-route="/app/settings"><span class="app-nav-icon">' + sidebarIcon("settings") + '</span><span>Settings</span></a>',
    '  </nav>',
    '  <button class="app-nav-link app-nav-button app-compose-button" type="button" data-sidebar-create-post><span class="app-nav-icon">' + sidebarIcon("plus") + '</span><span>Create Discussion</span></button>',
    '  <section class="sidebar-auth-panel">',
    '    <span class="sidebar-auth-label">Your identity</span>',
    '    <strong data-sidebar-profile>Anonymous mode</strong>',
    '    <form data-sidebar-email-login>',
      '      <input type="email" name="email" placeholder="Email login" aria-label="Email login">',
    '      <button type="submit">Login</button>',
    '    </form>',
    '    <a class="sidebar-google-login" href="/auth/google">Google Login</a>',
    '  </section>',
    '</div>'
  ].join("");
}

function highlightActiveLinks(root) {
  root.querySelectorAll("[data-sidebar-link]").forEach(function(link) {
    var href = link.getAttribute("href") || "";
    var route = link.getAttribute("data-route") || href.split("#")[0];
    var active = isActiveRoute(route);
    if (href.indexOf("/app/communities/") === 0) {
      active = currentPath() === href;
    }
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
  root.querySelectorAll("[data-sidebar-group-route]").forEach(function(group) {
    group.classList.toggle("is-active", isActiveRoute(group.getAttribute("data-sidebar-group-route")));
  });
}

function bindCloseOnLinks(root, closeSidebar) {
  root.querySelectorAll("[data-sidebar-link]").forEach(function(link) {
    link.addEventListener("click", closeSidebar);
  });
}

export function setupSidebar(options) {
  var mount = document.querySelector("[data-app-sidebar]");
  var toggle = document.querySelector("[data-sidebar-toggle]");
  var overlay = document.querySelector("[data-sidebar-overlay]");
  if (!mount) return;

  function closeSidebar() {
    document.body.classList.remove("app-sidebar-open");
  }

  mount.innerHTML = sidebarMarkup();
  highlightActiveLinks(mount);

  fetch("/api/communities")
    .then(function(response) { return response.ok ? response.json() : null; })
    .then(function(data) {
      var holder = mount.querySelector("[data-sidebar-communities]");
      var communities = data && Array.isArray(data.communities) ? data.communities : [];
      if (!holder) return;
      holder.innerHTML = communities.map(function(community) {
        return '<a class="app-subnav-link" href="/app/communities/' + escapeHtml(community.slug) + '" data-sidebar-link>' + escapeHtml(community.shortName || community.name) + '</a>';
      }).join("");
      highlightActiveLinks(mount);
      bindCloseOnLinks(holder, closeSidebar);
    })
    .catch(function(){});

  fetch("/api/session")
    .then(function(response) { return response.ok ? response.json() : null; })
    .then(function(data) {
      var profile = mount.querySelector("[data-sidebar-profile]");
      if (profile && data && data.user && data.user.profile) {
        profile.textContent = data.user.profile.display_name || "Anonymous mode";
      }
    })
    .catch(function(){});

  var emailForm = mount.querySelector("[data-sidebar-email-login]");
  if (emailForm) {
    emailForm.addEventListener("submit", function(event) {
      event.preventDefault();
      var email = emailForm.email.value.trim();
      if (!email) return;
      fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      }).then(function(response) {
        if (response.ok) window.location.reload();
      });
    });
  }

  function openSidebar() {
    document.body.classList.add("app-sidebar-open");
    animateElement(mount, { transform: ["translateX(-100%)", "translateX(0)"], opacity: [0, 1] }, {
      duration: 220,
      easing: "cubic-bezier(.2,.8,.2,1)"
    });
  }

  if (toggle) {
    toggle.addEventListener("click", function() {
      if (document.body.classList.contains("app-sidebar-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (overlay) overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") closeSidebar();
  });

  bindCloseOnLinks(mount, closeSidebar);

  mount.querySelector("[data-sidebar-create-post]").addEventListener("click", function() {
    closeSidebar();
    window.dispatchEvent(new CustomEvent("strango:create-post", { detail: options || {} }));
  });
}
