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
