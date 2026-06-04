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
  var startChatTriggers = document.querySelectorAll("[data-start-chat], a[href='#chat']");
  var strangerName = document.getElementById("strangerName");
  var connected = false;
  var typingTimer;
  var strangerId = Math.floor(1000 + Math.random() * 9000);
  var savedScrollY = 0;
  var chatOpen = false;

  if(strangerName){
    strangerName.textContent = "Stranger #" + strangerId;
  }

  function haptic(type){
    if(!window.navigator || !window.navigator.vibrate) return;
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

  function enterChatMode(){
    chatOpen = true;
    if(chatPanel) chatPanel.classList.add("chat-active");
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
      if(input) input.focus({ preventScroll:true });
      if(messages) messages.scrollTop = messages.scrollHeight;
    }, isMobileChat() ? 260 : 80);
  }

  function leaveChatMode(){
    chatOpen = false;
    if(chatPanel) chatPanel.classList.remove("chat-active");
    document.body.classList.remove("chat-mode","chat-input-focused","desktop-chat-open");
    if(chatPanel) chatPanel.removeAttribute("aria-modal");
    startChatTriggers.forEach(function(trigger){
      trigger.setAttribute("aria-expanded", "false");
    });
    if(savedScrollY){
      window.scrollTo(0, savedScrollY);
    }
  }

  function syncChatModeForViewport(){
    if(!chatOpen) return;
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
    status.textContent = text;
    status.classList.remove("waiting","connected","disconnected");
    status.classList.add(state || "waiting");
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
      if(normalized.toLowerCase().indexOf("connected") !== -1){
        connected = true;
        setStatus("Stranger connected", "connected");
        haptic("match");
        addMessage("You are now connected. Say hello.", "stranger");
        return;
      }
      if(normalized.toLowerCase().indexOf("disconnected") !== -1){
        connected = false;
        setStatus("Stranger disconnected", "disconnected");
        addMessage("The stranger disconnected. Tap Next to match again.", "stranger");
        return;
      }
      connected = false;
      setStatus("Waiting for stranger...", "waiting");
    });

    socket.on("message", function(message){
      if(!connected) return;
      if(typing) typing.textContent = "";
      addMessage(String(message || ""), "stranger");
    });

    socket.on("typing", function(state){
      if(!typing || !connected) return;
      typing.textContent = state ? "Stranger is typing..." : "";
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
      connected = false;
      setStatus("Waiting for stranger...", "waiting");
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
      event.preventDefault();
      enterChatMode();
    });
  });

  if(chatBackBtn){
    chatBackBtn.addEventListener("click", function(){
      leaveChatMode();
    });
  }

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
