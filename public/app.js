(function(){
  var socket = window.io ? io({ autoConnect:false }) : null;
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
  var activeChatWidget = document.getElementById("activeChatWidget");
  var activeWidgetStatus = document.querySelector("[data-active-chat-status]");
  var startChatTriggers = document.querySelectorAll("[data-start-chat], a[href='#chat']");
  var strangerName = document.getElementById("strangerName");
  var isStandaloneChatPage = document.body.classList.contains("chat-page");
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
  var inactiveUnreadCount = 0;
  var originalTitle = document.title || "Strango";
  var audioContext = null;
  var searchLabels = ["Searching...", "Finding someone..."];

  if(strangerName){
    strangerName.textContent = "Stranger #" + strangerId;
  }

  function initConnectionNetwork(){
    var canvas = document.getElementById("connectionNetwork");
    if(!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var nodes = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var lastSpawn = 0;
    var palette = [
      { r:121, g:215, b:167 },
      { r:143, g:179, b:255 },
      { r:228, g:184, b:93 },
      { r:244, g:245, b:243 }
    ];

    function random(min, max){
      return min + Math.random() * (max - min);
    }

    function makeNode(isNew){
      var color = palette[Math.floor(Math.random() * palette.length)];
      return {
        x:random(width * .12, width * .88),
        y:random(height * .14, height * .86),
        vx:random(-.12, .12),
        vy:random(-.1, .1),
        radius:random(1.7, 3.4),
        alpha:isNew ? 0 : random(.48, .9),
        target:random(.42, .88),
        age:0,
        life:random(900, 1600),
        color:color
      };
    }

    function resizeNetwork(){
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var targetCount = width < 320 ? 13 : 17;
      nodes = [];
      for(var i = 0; i < targetCount; i += 1){
        nodes.push(makeNode(false));
      }
    }

    function drawNode(node){
      var color = node.color;
      ctx.beginPath();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(" + color.r + "," + color.g + "," + color.b + ",.5)";
      ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + "," + node.alpha + ")";
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function drawConnection(a, b, alpha, progress){
      var drawX = a.x + (b.x - a.x) * progress;
      var drawY = a.y + (b.y - a.y) * progress;
      var gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      gradient.addColorStop(0, "rgba(" + a.color.r + "," + a.color.g + "," + a.color.b + "," + alpha + ")");
      gradient.addColorStop(1, "rgba(" + b.color.r + "," + b.color.g + "," + b.color.b + "," + alpha * .8 + ")");
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(drawX, drawY);
      ctx.stroke();
    }

    function render(time){
      ctx.clearRect(0, 0, width, height);

      for(var i = 0; i < nodes.length; i += 1){
        var node = nodes[i];
        if(!reduceMotion){
          node.x += node.vx;
          node.y += node.vy;
          node.age += 1;
          if(node.x < width * .08 || node.x > width * .92) node.vx *= -1;
          if(node.y < height * .1 || node.y > height * .9) node.vy *= -1;
          node.alpha += (node.target - node.alpha) * .018;
          if(node.age > node.life) node.target = 0;
          if(node.alpha < .035 && node.age > node.life){
            nodes[i] = makeNode(true);
          }
        }
      }

      if(!reduceMotion && time - lastSpawn > 2600 && nodes.length < 20){
        nodes.push(makeNode(true));
        lastSpawn = time;
      }

      var maxDistance = Math.min(width, height) * .42;
      for(var a = 0; a < nodes.length; a += 1){
        for(var b = a + 1; b < nodes.length; b += 1){
          var first = nodes[a];
          var second = nodes[b];
          var dx = first.x - second.x;
          var dy = first.y - second.y;
          var distance = Math.sqrt(dx * dx + dy * dy);
          if(distance < maxDistance){
            var pulse = (Math.sin(time / 1150 + a * 1.7 + b * 2.1) + 1) / 2;
            if(pulse > .26 || reduceMotion){
              var alpha = (1 - distance / maxDistance) * Math.min(first.alpha, second.alpha) * .22;
              var progress = reduceMotion ? 1 : Math.min(1, .25 + pulse * .9);
              drawConnection(first, second, alpha, progress);
            }
          }
        }
      }

      for(var n = 0; n < nodes.length; n += 1){
        drawNode(nodes[n]);
      }

      if(!reduceMotion){
        window.requestAnimationFrame(render);
      }
    }

    resizeNetwork();
    render(0);
    window.addEventListener("resize", resizeNetwork, { passive:true });
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

  function isTabActive(){
    return !document.hidden && (!document.hasFocus || document.hasFocus());
  }

  function updateDocumentTitle(){
    document.title = inactiveUnreadCount > 0 ? "(" + inactiveUnreadCount + ") Strango" : originalTitle;
  }

  function resetInactiveUnread(){
    inactiveUnreadCount = 0;
    updateDocumentTitle();
  }

  function showDesktopNotification(){
    if(!("Notification" in window) || Notification.permission !== "granted") return;
    try{
      new Notification("New message on Strango", {
        body:"Someone sent you a message",
        tag:"strango-new-message"
      });
    }catch(error){}
  }

  function notifyInactiveIncomingMessage(){
    if(isTabActive()) return;
    inactiveUnreadCount += 1;
    updateDocumentTitle();
    showDesktopNotification();
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
    resetInactiveUnread();
    updateUnreadBadge();
    if(socket && !socket.connected){
      socket.connect();
    }
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
    resetInactiveUnread();
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
      if(activeWidgetStatus) activeWidgetStatus.textContent = text;
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
      notifyInactiveIncomingMessage();
      notifyMinimizedMessage();
    });

    socket.on("typing", function(state){
      if(!typing || !connected) return;
      typing.textContent = state ? "typing" : "";
    });
  }

  if(socket && isStandaloneChatPage && !socket.connected){
    socket.connect();
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
      resetInactiveUnread();
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

  if(activeChatWidget){
    activeChatWidget.addEventListener("click", function(){
      resetInactiveUnread();
      if(input) input.focus({ preventScroll:true });
      if(messages) messages.scrollTop = messages.scrollHeight;
    });
  }

  if(chatPanel && window.location.pathname.replace(/\/$/, "") === "/chat"){
    setTimeout(enterChatMode, 120);
  }

  initConnectionNetwork();
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
  window.addEventListener("focus", resetInactiveUnread);
  document.addEventListener("visibilitychange", function(){
    if(!document.hidden) resetInactiveUnread();
  });
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
