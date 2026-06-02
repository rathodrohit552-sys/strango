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
  var connected = false;
  var typingTimer;

  function haptic(type){
    if(!window.navigator || !window.navigator.vibrate) return;
    if(type === "match") navigator.vibrate([18, 32, 18]);
    if(type === "send") navigator.vibrate(12);
    if(type === "join") navigator.vibrate([10, 24, 10]);
  }

  function syncMobileViewport(){
    var viewport = window.visualViewport;
    var height = viewport ? viewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--mobile-chat-height", height + "px");
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

  syncMobileViewport();
  window.addEventListener("resize", syncMobileViewport, { passive:true });
  window.addEventListener("orientationchange", function(){
    setTimeout(syncMobileViewport, 200);
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
