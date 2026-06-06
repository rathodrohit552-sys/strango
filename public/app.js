(function(){
  var socket = window.io ? io() : null;
  var status = document.getElementById("status");
  var online = document.getElementById("online");
  var activeUsers = document.getElementById("activeUsers");
  var messages = document.getElementById("messages");
  var typing = document.getElementById("typing");
  var input = document.getElementById("messageInput");
  var form = document.getElementById("chatForm");
  var nextBtn = document.getElementById("nextBtn");
  var chatPanel = document.querySelector(".chat-preview");
  var chatBackBtn = document.getElementById("chatBackBtn");
  var chatMinimizeBtn = document.getElementById("chatMinimizeBtn");
  var chatBubble = document.getElementById("chatBubble");
  var chatUnread = document.getElementById("chatUnread");
  var startChatTriggers = document.querySelectorAll("[data-start-chat], a[href='#chat']");
  var strangerName = document.getElementById("strangerName");
  var connected = false;
  var typingTimer;
  var statusTimer;
  var statusShiftTimer;
  var searchStep = 0;
  var strangerId = Math.floor(1000 + Math.random() * 9000);
  var savedScrollY = 0;
  var chatOpen = false;
  var chatMinimized = false;
  var unreadCount = 0;
  var audioContext = null;
  var searchLabels = ["Searching...", "Finding someone..."];

  if(strangerName){
    strangerName.textContent = "Stranger #" + strangerId;
  }

  function haptic(type){
    if(!window.navigator || !window.navigator.vibrate) return;
    if(chatOpen) return;
    if(type === "match") navigator.vibrate([18, 32, 18]);
    if(type === "send") navigator.vibrate(12);
    if(type === "join") navigator.vibrate([10, 24, 10]);
  }

  function syncMobileViewport(){
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight;
    var offsetTop = viewport ? viewport.offsetTop : 0;
    document.documentElement.style.setProperty("--mobile-chat-height", height + "px");
    document.documentElement.style.setProperty("--mobile-chat-offset", offsetTop + "px");
  }

  function isMobileChat(){
    return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  }

  function isDesktopViewport(){
    return !window.matchMedia || window.matchMedia("(min-width: 761px)").matches;
  }

  function updateUnreadBadge(){
    if(!chatUnread || !chatBubble) return;
    var chatBubbleSubcopy = chatBubble.querySelector("small");
    if(unreadCount > 0){
      chatUnread.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
      if(chatBubbleSubcopy) chatBubbleSubcopy.textContent = unreadCount + " unread";
      chatBubble.classList.add("has-unread");
      chatBubble.setAttribute("aria-label", unreadCount + " unread message" + (unreadCount === 1 ? "" : "s") + ". Reopen chat");
      return;
    }
    chatUnread.textContent = "0";
    if(chatBubbleSubcopy) chatBubbleSubcopy.textContent = "Connected";
    chatBubble.classList.remove("has-unread");
    chatBubble.setAttribute("aria-label", "Reopen chat");
  }

  function playNotificationSound(){
    if(!isDesktopViewport()) return;
    try{
      var AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      if(!AudioContextConstructor) return;
      audioContext = audioContext || new AudioContextConstructor();
      if(audioContext.state === "suspended") audioContext.resume();
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(720, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(540, audioContext.currentTime + 0.16);
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    }catch(error){}
  }

  function notifyMinimizedMessage(){
    if(!chatMinimized) return;
    unreadCount += 1;
    updateUnreadBadge();
    playNotificationSound();
    if(window.navigator && window.navigator.vibrate){
      window.navigator.vibrate(200);
    }
  }

  function enterChatMode(){
    chatOpen = true;
    chatMinimized = false;
    unreadCount = 0;
    updateUnreadBadge();
    if(chatPanel) chatPanel.classList.add("chat-active");
    if(chatPanel) chatPanel.classList.remove("chat-minimized");
    document.body.classList.remove("chat-minimized");
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    if(isMobileChat()){
      document.body.classList.remove("desktop-chat-open");
      document.documentElement.style.setProperty("--page-scroll-y", savedScrollY + "px");
      document.body.classList.add("chat-mode");
      if(chatPanel) chatPanel.setAttribute("aria-modal", "true");
    }else{
      document.body.classList.add("desktop-chat-open");
      document.body.classList.remove("chat-mode");
      if(chatPanel) chatPanel.removeAttribute("aria-modal");
    }
    startChatTriggers.forEach(function(trigger){
      trigger.setAttribute("aria-expanded", "true");
    });
    syncMobileViewport();
    setTimeout(function(){
      if(input && !isMobileChat()) input.focus({ preventScroll:true });
      if(messages) messages.scrollTop = messages.scrollHeight;
    }, isMobileChat() ? 260 : 80);
  }

  function leaveChatMode(){
    chatOpen = false;
    chatMinimized = false;
    unreadCount = 0;
    updateUnreadBadge();
    if(chatPanel) chatPanel.classList.remove("chat-active");
    if(chatPanel) chatPanel.classList.remove("chat-minimized");
    if(input) input.blur();
    document.body.classList.remove("chat-mode","chat-input-focused","desktop-chat-open","chat-minimized");
    if(chatPanel) chatPanel.removeAttribute("aria-modal");
    startChatTriggers.forEach(function(trigger){
      trigger.setAttribute("aria-expanded", "false");
    });
    if(savedScrollY){
      window.scrollTo(0, savedScrollY);
    }
  }

  function minimizeChat(){
    if(!chatPanel || !chatOpen) return;
    chatMinimized = true;
    chatPanel.classList.add("chat-minimized");
    if(input) input.blur();
    document.body.classList.remove("chat-mode","chat-input-focused","desktop-chat-open");
    document.body.classList.add("chat-minimized");
    chatPanel.removeAttribute("aria-modal");
    startChatTriggers.forEach(function(trigger){
      trigger.setAttribute("aria-expanded", "false");
    });
    window.scrollTo(0, savedScrollY);
  }

  function syncChatModeForViewport(){
    if(!chatOpen || chatMinimized) return;
    if(isMobileChat()){
      document.body.classList.remove("desktop-chat-open");
      document.body.classList.add("chat-mode");
      document.documentElement.style.setProperty("--page-scroll-y", savedScrollY + "px");
      if(chatPanel) chatPanel.setAttribute("aria-modal", "true");
    }else{
      document.body.classList.remove("chat-mode","chat-input-focused");
      document.body.classList.add("desktop-chat-open");
      if(chatPanel) chatPanel.removeAttribute("aria-modal");
      window.scrollTo(0, savedScrollY);
    }
  }

  function setStatus(text, state){
    if(!status) return;
    clearTimeout(statusShiftTimer);
    status.classList.add("status-shift");
    statusShiftTimer = setTimeout(function(){
      status.textContent = text;
      status.classList.remove("waiting","connected","disconnected");
      status.classList.add(state || "waiting");
      status.classList.remove("status-shift");
    }, 110);
  }

  function stopSearching(){
    clearInterval(statusTimer);
    statusTimer = null;
  }

  function startSearching(){
    connected = false;
    stopSearching();
    searchStep = 0;
    setStatus(searchLabels[searchStep], "waiting");
    statusTimer = setInterval(function(){
      searchStep = (searchStep + 1) % searchLabels.length;
      setStatus(searchLabels[searchStep], "waiting");
    }, 1500);
  }

  function addMessage(text, type){
    if(!messages) return;
    var item = document.createElement("div");
    item.className = "msg " + type;
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function updateCount(count){
    var safeCount = Number(count) || 0;
    if(online) online.textContent = safeCount + (safeCount === 1 ? " online" : " online");
    if(activeUsers) activeUsers.textContent = safeCount.toLocaleString();
  }

  if(socket){
    socket.on("onlineCount", updateCount);

    socket.on("status", function(text){
      var normalized = String(text || "");
      if(normalized.toLowerCase().indexOf("connected") !== -1 && normalized.toLowerCase().indexOf("disconnected") === -1){
        stopSearching();
        connected = true;
        setStatus("Connected ✓", "connected");
        haptic("match");
        addMessage("You are now connected. Say hello.", "stranger");
        return;
      }
      if(normalized.toLowerCase().indexOf("disconnected") !== -1){
        stopSearching();
        connected = false;
        setStatus("Stranger disconnected", "disconnected");
        addMessage("The stranger disconnected. Tap Next to match again.", "stranger");
        return;
      }
      startSearching();
    });

    socket.on("message", function(message){
      if(!connected) return;
      if(typing) typing.textContent = "";
      addMessage(String(message || ""), "stranger");
      notifyMinimizedMessage();
    });

    socket.on("typing", function(state){
      if(!typing || !connected) return;
      typing.textContent = state ? "typing" : "";
    });
  }

  if(socket){
    socket.on("status", function(text){
      var normalized = String(text || "");
      if(normalized.toLowerCase().indexOf("connected") !== -1 && normalized.toLowerCase().indexOf("disconnected") === -1){
        setStatus("Connected \u2713", "connected");
      }
    });
  }

  if(form){
    form.addEventListener("submit", function(event){
      event.preventDefault();
      if(!input || !socket || !connected) return;
      var value = input.value.trim();
      if(!value) return;
      addMessage(value, "you");
      socket.emit("message", value);
      socket.emit("typing", false);
      haptic("send");
      input.value = "";
    });
  }

  if(input && socket){
    input.addEventListener("input", function(){
      if(!connected) return;
      socket.emit("typing", true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function(){
        socket.emit("typing", false);
      }, 700);
    });

    input.addEventListener("focus", function(){
      document.body.classList.add("chat-input-focused");
      setTimeout(function(){
        syncMobileViewport();
        if(messages) messages.scrollTop = messages.scrollHeight;
      }, 80);
    });

    input.addEventListener("blur", function(){
      document.body.classList.remove("chat-input-focused");
      setTimeout(syncMobileViewport, 80);
    });
  }

  if(nextBtn && socket){
    nextBtn.addEventListener("click", function(){
      if(messages) messages.innerHTML = "";
      if(typing) typing.textContent = "";
      startSearching();
      socket.emit("next");
    });
  }

  document.querySelectorAll(".community-card").forEach(function(card){
    card.addEventListener("click", function(){
      haptic("join");
    });
  });

  startChatTriggers.forEach(function(link){
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("click", function(event){
      if(!chatPanel){
        var target = link.getAttribute("href") || "/chat";
        if(target === "#chat"){
          event.preventDefault();
          window.location.href = "/chat";
        }
        return;
      }
      event.preventDefault();
      enterChatMode();
    });
  });

  if(chatBackBtn){
    chatBackBtn.addEventListener("click", function(){
      leaveChatMode();
    });
  }

  if(chatMinimizeBtn){
    chatMinimizeBtn.addEventListener("click", function(){
      minimizeChat();
    });
  }

  if(chatBubble){
    chatBubble.addEventListener("click", function(){
      enterChatMode();
    });
  }

  updateUnreadBadge();
  syncMobileViewport();
  window.addEventListener("resize", function(){
    syncMobileViewport();
    syncChatModeForViewport();
  }, { passive:true });
  window.addEventListener("orientationchange", function(){
    setTimeout(syncMobileViewport, 200);
    setTimeout(syncChatModeForViewport, 220);
  }, { passive:true });
  if(window.visualViewport){
    window.visualViewport.addEventListener("resize", syncMobileViewport, { passive:true });
    window.visualViewport.addEventListener("scroll", syncMobileViewport, { passive:true });
  }

  var banner = document.getElementById("cookieBanner");
  var accept = document.getElementById("acceptCookies");
  try{
    if(banner && localStorage.getItem("strango_cookie_ok") !== "yes"){
      banner.classList.add("show");
    }
    if(accept){
      accept.addEventListener("click", function(){
        localStorage.setItem("strango_cookie_ok", "yes");
        if(banner) banner.classList.remove("show");
      });
    }
  }catch(error){
    if(banner) banner.classList.remove("show");
  }
})();
