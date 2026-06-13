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

function channelKey(channel) {
  return String(channel && channel.name ? channel.name : channel || "General").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "general";
}

function channelName(channel) {
  return String(channel && channel.name ? channel.name : channel || "General");
}

function formatTime(value) {
  var date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderMessage(message) {
  if (message.type === "system") {
    return '<div class="community-chat-system">' + escapeHtml(message.text) + '</div>';
  }
  return [
    '<article class="community-chat-message">',
    '  <span class="community-chat-avatar" aria-hidden="true">' + escapeHtml((message.author || "U").charAt(0)) + '</span>',
    '  <div class="community-chat-bubble">',
    '    <div class="community-chat-meta"><strong>' + escapeHtml(message.author || "User") + '</strong><span>' + formatTime(message.time) + '</span></div>',
    '    <p>' + escapeHtml(message.text || "") + '</p>',
    '  </div>',
    '</article>'
  ].join("");
}

export function renderLiveDiscussionShell(community) {
  var channels = community.channels || ["General"];
  var channelButtons = channels.map(function(channel, index) {
    var name = channelName(channel);
    return '<button class="community-channel-button' + (index === 0 ? " is-active" : "") + '" type="button" data-channel="' + escapeHtml(name) + '"># ' + escapeHtml(name) + '</button>';
  }).join("");
  var channelOptions = channels.map(function(channel) {
    var name = channelName(channel);
    return '<option value="' + escapeHtml(name) + '"># ' + escapeHtml(name) + '</option>';
  }).join("");

  return [
    '<section class="community-live-layout" data-live-discussion>',
    '  <aside class="community-channel-rail" aria-label="' + escapeHtml(community.name) + ' channels">',
    '    <div class="community-channel-title">Channels</div>',
    '    <div class="community-channel-list">' + channelButtons + '</div>',
    '    <select class="community-channel-select" aria-label="Select channel">' + channelOptions + '</select>',
    '  </aside>',
    '  <section class="community-chat-panel">',
    '    <header class="community-chat-header">',
    '      <div>',
    '        <h2>' + escapeHtml(community.name) + ' Discussion</h2>',
    '        <p data-active-channel-label># General</p>',
    '      </div>',
    '      <span class="community-online-pill" data-community-online>' + (Number(community.onlineCount || 0) > 0 ? Number(community.onlineCount).toLocaleString() + ' online' : 'No one online') + '</span>',
    '    </header>',
    '    <div class="community-chat-messages" data-community-messages aria-live="polite"></div>',
    '    <div class="community-typing" data-community-typing aria-live="polite"></div>',
    '    <form class="community-chat-form" data-community-chat-form>',
    '      <input type="text" name="message" autocomplete="off" placeholder="Type message" aria-label="Community message">',
    '      <button class="button primary" type="submit">Send</button>',
    '    </form>',
    '  </section>',
    '</section>'
  ].join("");
}

export function renderMembersPanel(community) {
  var members = Array.isArray(community.members) ? community.members : [];
  return [
    '<section class="community-members-panel">',
    '  <article class="dashboard-panel community-member-directory"><h2>Members</h2>',
    members.length
      ? '  <div class="member-list">' + members.map(function(member) {
          return '<span class="community-member-row"><strong>' + escapeHtml(member.displayName || "Anonymous User") + '</strong><small>' + escapeHtml(member.badge || "Member") + '</small></span>';
        }).join("") + '</div>'
      : '  <div class="community-empty-state compact"><h3>No members yet.</h3><p>Members will appear here after they participate in this community.</p></div>',
    '  </article>',
    '</section>'
  ].join("");
}

export function setupLiveDiscussion(root, community) {
  var live = root.querySelector("[data-live-discussion]");
  if (!live || !window.io) return function(){};

  var socket = window.io({ autoConnect: false, auth: { mode: "community" } });
  var channelButtons = Array.from(live.querySelectorAll("[data-channel]"));
  var channelSelect = live.querySelector(".community-channel-select");
  var activeChannelLabel = live.querySelector("[data-active-channel-label]");
  var onlineNode = live.querySelector("[data-community-online]");
  var messagesNode = live.querySelector("[data-community-messages]");
  var typingNode = live.querySelector("[data-community-typing]");
  var form = live.querySelector("[data-community-chat-form]");
  var input = form ? form.querySelector("input[name='message']") : null;
  var activeChannel = channelName((community.channels && community.channels[0]) || "General");
  var typingTimer = 0;
  var remoteTypingTimer = 0;
  var activated = false;

  function setOnline(count) {
    var safeCount = Math.max(0, Math.round(Number(count) || 0));
    if (onlineNode) onlineNode.textContent = safeCount > 0 ? safeCount.toLocaleString() + " online" : "No one online";
  }

  function setActiveChannel(channel) {
    activeChannel = channel || "General";
    channelButtons.forEach(function(button) {
      button.classList.toggle("is-active", button.getAttribute("data-channel") === activeChannel);
    });
    if (channelSelect) channelSelect.value = activeChannel;
    if (activeChannelLabel) activeChannelLabel.textContent = "# " + activeChannel;
    if (messagesNode) messagesNode.innerHTML = '<div class="community-chat-system">Joining #' + escapeHtml(activeChannel) + '...</div>';
    socket.emit("joinCommunity", {
      community: community.slug,
      communityName: community.name,
      channel: activeChannel
    });
  }

  function appendMessage(message) {
    if (!messagesNode) return;
    if (message.channel && channelKey(message.channel) !== channelKey(activeChannel)) return;
    messagesNode.insertAdjacentHTML("beforeend", renderMessage(message));
    messagesNode.scrollTop = messagesNode.scrollHeight;
  }

  socket.on("connect", function() {
    setActiveChannel(activeChannel);
  });

  socket.on("communityHistory", function(payload) {
    if (payload.channel && channelKey(payload.channel) !== channelKey(activeChannel)) return;
    setOnline(payload.online);
    var messages = Array.isArray(payload.messages) ? payload.messages : [];
    messagesNode.innerHTML = messages.length
      ? messages.map(renderMessage).join("")
      : '<div class="community-chat-system">No live messages yet. Start the #' + escapeHtml(activeChannel) + ' discussion.</div>';
    messagesNode.scrollTop = messagesNode.scrollHeight;
  });

  socket.on("newCommunityMessage", appendMessage);

  socket.on("communityOnline", function(payload) {
    if (payload.community === community.slug) setOnline(payload.count);
  });

  socket.on("communityTyping", function(payload) {
    if (!typingNode || !payload || !payload.isTyping) return;
    if (payload.community !== community.slug || channelKey(payload.channel) !== channelKey(activeChannel)) return;
    typingNode.textContent = payload.author + " is typing...";
    window.clearTimeout(remoteTypingTimer);
    remoteTypingTimer = window.setTimeout(function() {
      typingNode.textContent = "";
    }, 1600);
  });

  socket.on("communityModeration", function(payload) {
    appendMessage({
      type: "system",
      text: payload && payload.reason ? payload.reason : "Message blocked by moderation.",
      time: new Date().toISOString()
    });
  });

  channelButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      setActiveChannel(button.getAttribute("data-channel"));
    });
  });

  if (channelSelect) {
    channelSelect.addEventListener("change", function() {
      setActiveChannel(channelSelect.value);
    });
  }

  if (input) {
    input.addEventListener("input", function() {
      socket.emit("communityTyping", { isTyping: true });
      window.clearTimeout(typingTimer);
      typingTimer = window.setTimeout(function() {
        socket.emit("communityTyping", { isTyping: false });
      }, 900);
    });
  }

  if (form && input) {
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      socket.emit("communityMessage", {
        community: community.slug,
        channel: activeChannel,
        text: text
      });
      socket.emit("communityTyping", { isTyping: false });
      input.value = "";
    });
  }

  function activateLiveDiscussion() {
    if (activated) return;
    activated = true;
    if (messagesNode) messagesNode.innerHTML = '<div class="community-chat-system">Connecting to #' + escapeHtml(activeChannel) + '...</div>';
    socket.connect();
  }

  root.addEventListener("strango:activate-live-discussion", activateLiveDiscussion);

  return function cleanupLiveDiscussion() {
    window.clearTimeout(typingTimer);
    window.clearTimeout(remoteTypingTimer);
    root.removeEventListener("strango:activate-live-discussion", activateLiveDiscussion);
    socket.disconnect();
  };
}
