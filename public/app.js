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
  var communityModal = document.getElementById("communityModal");
  var communityModalTitle = document.getElementById("communityModalTitle");
  var communityModalTopics = document.getElementById("communityModalTopics");
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
  var savedScrollY = 0;
  var chatOpen = false;
  var chatMinimized = false;
  var unreadCount = 0;
  var inactiveUnreadCount = 0;
  var originalTitle = document.title || "Strango";
  var audioContext = null;
  var hasUserInteracted = false;
  var searchLabels = ["Searching...", "Finding someone..."];
  var previewSeeded = false;
  var homeDemoTimers = [];

  updateVisitorIdentity();

  function updateVisitorIdentity(){
    if(strangerName){
      strangerName.textContent = "Stranger";
    }
  }

  function shuffleList(list){
    var copy = list.slice();
    for(var i = copy.length - 1; i > 0; i -= 1){
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function initConversationNetwork(){
    var canvas = document.getElementById("conversationNetwork");
    if(!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var particles = [];
    var dust = [];
    var lastTime = 0;
    var frameId = 0;
    var running = false;
    var isVisible = true;
    var inViewport = true;
    var scrollPauseTimer = 0;
    var point = { x:0, y:0 };
    var ghostPoint = { x:0, y:0 };
    var sweepPoint = { x:0, y:0 };
    var palette = [
      { r:116, g:215, b:164 },
      { r:103, g:185, b:218 },
      { r:233, g:220, b:198 },
      { r:246, g:250, b:252 }
    ];

    function resize(){
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    function buildParticles(){
      var count = width < 360 ? 34 : 54;
      particles = [];
      for(var i = 0; i < count; i += 1){
        particles.push({
          progress:i / count,
          speed:.000018 + Math.random() * .000014,
          radius:.85 + Math.random() * 1.65,
          offset:(Math.random() - .5) * .034,
          color:palette[i % palette.length],
          glow:Math.random() * Math.PI * 2,
          lane:(Math.random() - .5) * .038
        });
      }
      dust = [];
      var dustCount = width < 360 ? 8 : 14;
      for(var d = 0; d < dustCount; d += 1){
        dust.push({
          x:.18 + Math.random() * .64,
          y:.14 + Math.random() * .72,
          radius:.7 + Math.random() * 1.4,
          phase:Math.random() * Math.PI * 2,
          alpha:.08 + Math.random() * .12,
          speed:.000045 + Math.random() * .00005,
          color:palette[d % palette.length]
        });
      }
    }

    function sPoint(progress, drift, target){
      var u = ((progress % 1) + 1) % 1;
      var angle = u * Math.PI * 2;
      var cx = width * .5;
      var cy = height * .5;
      var ampX = Math.min(width, height) * .25;
      var ampY = Math.min(width, height) * .37;
      var taper = .9 + Math.cos(angle * 2) * .07;
      target.x = cx + Math.sin(angle * 2) * ampX * taper + Math.sin(angle * 3 + drift) * ampX * .024;
      target.y = cy + Math.sin(angle) * ampY + Math.cos(angle * 2 + drift) * ampY * .026;
      return target;
    }

    function edgeFade(progress){
      return 1;
    }

    function colorString(color, alpha){
      return "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha + ")";
    }

    function schedule(){
      if(reduceMotion || frameId || !isVisible) return;
      running = true;
      frameId = window.requestAnimationFrame(draw);
    }

    function pauseAnimation(){
      isVisible = false;
      if(frameId){
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    function pauseForScroll(){
      if(!inViewport || reduceMotion) return;
      pauseAnimation();
      document.body.classList.add("is-scrolling");
      clearTimeout(scrollPauseTimer);
      scrollPauseTimer = setTimeout(function(){
        document.body.classList.remove("is-scrolling");
        if(inViewport && !document.hidden){
          recoverAnimation();
        }
      }, 180);
    }

    function recoverAnimation(){
      if(reduceMotion) return;
      isVisible = true;
      if(frameId){
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
      lastTime = 0;
      schedule();
    }

    function draw(time){
      if(!isVisible) return;
      window.__strangoNetworkFrames = (window.__strangoNetworkFrames || 0) + 1;
      frameId = 0;
      var delta = Math.min(32, time - lastTime || 16);
      lastTime = time;
      ctx.clearRect(0, 0, width, height);
      var drift = time * .000078;

      var gradient = ctx.createRadialGradient(width * .5, height * .44, 12, width * .5, height * .47, Math.max(width, height) * .64);
      gradient.addColorStop(0, "rgba(246,250,252,.18)");
      gradient.addColorStop(.42, "rgba(116,215,164,.075)");
      gradient.addColorStop(1, "rgba(6,24,41,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      dust.forEach(function(item){
        var floatX = item.x * width + Math.sin(time * item.speed + item.phase) * width * .018;
        var floatY = item.y * height + Math.cos(time * item.speed * .8 + item.phase) * height * .014;
        ctx.beginPath();
        ctx.shadowBlur = 10;
        ctx.shadowColor = colorString(item.color, .24);
        ctx.fillStyle = colorString(item.color, item.alpha);
        ctx.arc(floatX, floatY, item.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      var sweep = (time * .000019) % 1;
      for(var after = 0; after < 2; after += 1){
        particles.forEach(function(particle){
          var ghostProgress = particle.progress - after * .018;
          sPoint(ghostProgress + particle.lane, drift, ghostPoint);
          var ghostFade = Math.max(0, edgeFade(ghostProgress)) * (.18 - after * .06);
          if(ghostFade <= 0) return;
          ctx.beginPath();
          ctx.shadowBlur = 14;
          ctx.shadowColor = colorString(particle.color, ghostFade);
          ctx.fillStyle = colorString(particle.color, ghostFade);
          ctx.arc(ghostPoint.x, ghostPoint.y, particle.radius * (1.35 - after * .28), 0, Math.PI * 2);
          ctx.fill();
        });
      }

      particles.forEach(function(particle){
        if(!reduceMotion){
          particle.progress = (particle.progress + particle.speed * delta) % 1;
          particle.glow += delta * .00025;
        }
        sPoint(particle.progress + particle.offset + particle.lane, drift, point);
        var fade = Math.max(0, edgeFade(particle.progress));
        if(fade <= 0) return;
        var pulse = (Math.sin(particle.glow) + 1) / 2;
        var color = particle.color;
        var radius = particle.radius * (.82 + pulse * .36);
        ctx.beginPath();
        ctx.shadowBlur = 18 + pulse * 12;
        ctx.shadowColor = colorString(color, .56);
        ctx.fillStyle = colorString(color, (.5 + pulse * .38) * fade);
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      for(var s = 0; s < 2; s += 1){
        for(var j = 0; j <= 18; j += 1){
          var segmentProgress = sweep + s * .5 - .045 + j / 18 * .09;
          sPoint(segmentProgress, drift, sweepPoint);
          var alpha = Math.sin(j / 18 * Math.PI) * .42;
          ctx.beginPath();
          ctx.shadowBlur = 22;
          ctx.shadowColor = "rgba(246,250,252,.64)";
          ctx.fillStyle = "rgba(246,250,252," + alpha + ")";
          ctx.arc(sweepPoint.x, sweepPoint.y, 1.4 + alpha * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      schedule();
    }

    resize();
    window.addEventListener("resize", resize, { passive:true });
    document.addEventListener("visibilitychange", function(){
      if(document.hidden){
        pauseAnimation();
      }else{
        recoverAnimation();
      }
    });
    window.addEventListener("focus", function(){
      recoverAnimation();
    }, { passive:true });
    window.addEventListener("blur", function(){
      if(document.hidden) pauseAnimation();
    }, { passive:true });
    window.addEventListener("pageshow", function(){
      recoverAnimation();
    }, { passive:true });
    if("IntersectionObserver" in window){
      var observer = new IntersectionObserver(function(entries){
        var entry = entries[0];
        if(entry && entry.isIntersecting){
          inViewport = true;
          recoverAnimation();
        }else{
          inViewport = false;
          pauseAnimation();
        }
      }, { threshold:.08 });
      observer.observe(canvas);
    }
    window.addEventListener("scroll", pauseForScroll, { passive:true });
    window.setInterval(function(){
      if(!document.hidden && isVisible && !frameId){
        recoverAnimation();
      }
    }, 5000);
    if(reduceMotion){
      draw(0);
    }else if(!running){
      schedule();
    }
  }

  function initCommunityConstellation(){
    var canvas = document.getElementById("communityConstellation");
    if(!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var width = 0;
    var height = 0;
    var dpr = 1;
    var frameId = 0;
    var lastFrame = 0;
    var visible = true;
    var nodes = [
      { x:.18, y:.24, color:[139,92,246], phase:.3 },
      { x:.50, y:.13, color:[59,130,246], phase:1.1 },
      { x:.80, y:.29, color:[16,185,129], phase:2.2 },
      { x:.23, y:.68, color:[246,200,95], phase:2.8 },
      { x:.53, y:.78, color:[236,72,153], phase:3.6 },
      { x:.82, y:.64, color:[103,185,218], phase:4.4 }
    ];
    var edges = [[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[1,3],[2,4]];

    function resize(){
      var rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      draw(0);
    }

    function point(node, time){
      var movement = reduceMotion ? 0 : 4;
      return {
        x:node.x * width + Math.sin(time * .00032 + node.phase) * movement,
        y:node.y * height + Math.cos(time * .00027 + node.phase) * movement
      };
    }

    function rgba(color, alpha){
      return "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + alpha + ")";
    }

    function draw(time){
      frameId = 0;
      if(!visible) return;
      if(!reduceMotion && time - lastFrame < 34){
        frameId = window.requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;
      ctx.clearRect(0,0,width,height);

      var positions = nodes.map(function(node){ return point(node,time); });
      edges.forEach(function(edge,index){
        var start = positions[edge[0]];
        var end = positions[edge[1]];
        var gradient = ctx.createLinearGradient(start.x,start.y,end.x,end.y);
        gradient.addColorStop(0,rgba(nodes[edge[0]].color,.24));
        gradient.addColorStop(1,rgba(nodes[edge[1]].color,.18));
        ctx.beginPath();
        ctx.moveTo(start.x,start.y);
        ctx.lineTo(end.x,end.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();

        if(!reduceMotion){
          var progress = (time * .000055 + index * .17) % 1;
          var pulseX = start.x + (end.x - start.x) * progress;
          var pulseY = start.y + (end.y - start.y) * progress;
          ctx.beginPath();
          ctx.fillStyle = "rgba(238,244,255,.68)";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(139,92,246,.45)";
          ctx.arc(pulseX,pulseY,1.5,0,Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      positions.forEach(function(position,index){
        var node = nodes[index];
        var pulse = reduceMotion ? .5 : (Math.sin(time * .001 + node.phase) + 1) / 2;
        ctx.beginPath();
        ctx.fillStyle = rgba(node.color,.1 + pulse * .05);
        ctx.arc(position.x,position.y,15 + pulse * 3,0,Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = rgba(node.color,.92);
        ctx.shadowBlur = 18;
        ctx.shadowColor = rgba(node.color,.54);
        ctx.arc(position.x,position.y,3.2 + pulse,0,Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      window.__strangoConstellationFrames = (window.__strangoConstellationFrames || 0) + 1;
      if(!reduceMotion) frameId = window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize",resize,{ passive:true });
    document.addEventListener("visibilitychange",function(){
      visible = !document.hidden;
      if(visible && !frameId) frameId = window.requestAnimationFrame(draw);
    });
    if("IntersectionObserver" in window){
      var observer = new IntersectionObserver(function(entries){
        visible = Boolean(entries[0] && entries[0].isIntersecting) && !document.hidden;
        if(visible && !frameId) frameId = window.requestAnimationFrame(draw);
      },{ threshold:.05 });
      observer.observe(canvas);
    }
    if(!reduceMotion) frameId = window.requestAnimationFrame(draw);
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
        vx:random(-.096, .096),
        vy:random(-.08, .08),
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
          node.alpha += (node.target - node.alpha) * .014;
          if(node.age > node.life) node.target = 0;
          if(node.alpha < .035 && node.age > node.life){
            nodes[i] = makeNode(true);
          }
        }
      }

      if(!reduceMotion && time - lastSpawn > 3200 && nodes.length < 20){
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
            var pulse = (Math.sin(time / 1440 + a * 1.7 + b * 2.1) + 1) / 2;
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
    if(!hasUserInteracted) return;
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
    if(isStandaloneChatPage && socket && !socket.connected){
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
    if(!isStandaloneChatPage){
      clearHomeDemoTimers();
    }
    resetInactiveUnread();
    updateUnreadBadge();
    if(chatPanel) chatPanel.classList.remove("chat-active");
    if(chatPanel) chatPanel.classList.remove("home-chat-demo","is-searching-demo");
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
    if(!isStandaloneChatPage){
      previewSeeded = false;
      seedHomeChatPreview();
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
    setStatus("", "waiting");
    statusTimer = setInterval(function(){
      searchStep = (searchStep + 1) % searchLabels.length;
      setStatus("", "waiting");
    }, 1500);
  }

  function seedHomeChatPreview(){
    if(!messages || isStandaloneChatPage || previewSeeded) return;
    previewSeeded = true;
    connected = false;
    if(chatPanel) chatPanel.classList.add("home-demo-preview");
    if(strangerName) strangerName.textContent = "";
    renderHomeEmptyState();
    setStatus("Connected", "connected");
    setTypingIndicator(false);
  }

  function clearHomeDemoTimers(){
    homeDemoTimers.forEach(function(timer){
      window.clearTimeout(timer);
    });
    homeDemoTimers = [];
  }

  function queueHomeDemoStep(callback, delay){
    var timer = window.setTimeout(callback, delay);
    homeDemoTimers.push(timer);
  }

  function renderHomeEmptyState(){
    if(!messages) return;
    messages.innerHTML = '<div class="chat-empty-state"><strong>Start a conversation.</strong><span>Say hello when you are ready.</span></div>';
    messages.scrollTop = 0;
  }

  function activateHomeChatDemo(){
    clearHomeDemoTimers();
    previewSeeded = true;
    connected = false;
    chatOpen = true;
    chatMinimized = false;
    if(chatPanel){
      chatPanel.classList.remove("home-demo-preview","chat-minimized");
      chatPanel.classList.add("chat-active","home-chat-demo","is-searching-demo");
      chatPanel.removeAttribute("aria-modal");
    }
    document.body.classList.add("desktop-chat-open");
    document.body.classList.remove("chat-mode","chat-minimized","chat-input-focused");
    startChatTriggers.forEach(function(trigger){
      trigger.setAttribute("aria-expanded", "true");
    });
    if(strangerName) strangerName.textContent = "";
    if(input){
      input.value = "";
      input.setAttribute("placeholder", "Type a message...");
      input.setAttribute("readonly", "readonly");
      input.setAttribute("tabindex", "-1");
    }
    if(sendBtn) sendBtn.removeAttribute("disabled");
    if(nextBtn) nextBtn.removeAttribute("disabled");
    renderHomeEmptyState();
    setTypingIndicator(false);
    setStatus("Connected", "connected");
    queueHomeDemoStep(function(){
      if(chatPanel) chatPanel.classList.remove("is-searching-demo");
    }, 420);
  }

  function setTypingIndicator(active){
    if(!typing) return;
    if(!active){
      typing.innerHTML = "";
      return;
    }
    typing.textContent = "typing";
  }

  function launchChat(trigger){
    if(trigger){
      trigger.classList.add("is-pressing");
      setTimeout(function(){
        trigger.classList.remove("is-pressing");
      }, 260);
    }
    if(chatPanel){
      chatPanel.classList.add("is-launching");
      setTimeout(function(){
        chatPanel.classList.remove("is-launching");
      }, 780);
    }
    if(!isStandaloneChatPage){
      document.body.classList.add("chat-launching");
      setTimeout(function(){
        activateHomeChatDemo();
      }, 260);
      setTimeout(function(){
        document.body.classList.remove("chat-launching");
      }, 520);
      return;
    }
    document.body.classList.add("chat-launching");
    setTimeout(function(){
      enterChatMode();
    }, 620);
    setTimeout(function(){
      document.body.classList.remove("chat-launching");
    }, 1120);
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

  function initPuzzleCard(){
    var title = document.querySelector("[data-puzzle-title]");
    var question = document.querySelector("[data-puzzle-question]");
    var optionsWrap = document.querySelector("[data-puzzle-options]");
    var feedback = document.querySelector("[data-puzzle-feedback]");
    var refresh = document.querySelector("[data-puzzle-refresh]");
    if(!title || !question || !optionsWrap || !feedback) return;
    var fallbackPuzzles = [
      { type:"Pattern puzzle", question:"2, 4, 8, 16, ?", answers:["24","32","36"], correct:"32", hint:"Doubling every step." },
      { type:"Logic puzzle", question:"A bat and ball cost $1.10. The bat costs $1 more. Ball?", answers:["$0.05","$0.10","$0.50"], correct:"$0.05", hint:"The bat is $1.05 and the ball is $0.05." },
      { type:"Brain teaser", question:"Which word becomes shorter when you add two letters?", answers:["Short","Small","Tiny"], correct:"Short", hint:"Short becomes shorter." },
      { type:"Pattern puzzle", question:"1, 1, 2, 3, 5, ?", answers:["6","8","10"], correct:"8", hint:"Each number is the sum of the two before it." },
      { type:"Logic puzzle", question:"Three switches, one bulb. What helps most?", answers:["One trip","Two bulbs","Guessing"], correct:"One trip", hint:"Use heat and light to identify the switches." },
      { type:"Brain teaser", question:"What has keys but no locks?", answers:["Piano","Map","Clock"], correct:"Piano", hint:"It plays notes." }
    ];
    var puzzles = fallbackPuzzles;
    var queue = shuffleList(puzzles);
    var current = null;
    var shown = 0;
    var intervalId = 0;

    function normalizePuzzles(data){
      var list = data && Array.isArray(data.puzzles) ? data.puzzles : [];
      return list.filter(function(item){
        return item && item.type && item.question && Array.isArray(item.answers) && item.answers.length >= 3 && item.correct;
      }).map(function(item){
        return {
          difficulty:String(item.difficulty || "Medium"),
          type:String(item.type),
          question:String(item.question),
          answers:item.answers.slice(0, 3).map(String),
          correct:String(item.correct),
          hint:String(item.hint || "Think through the pattern carefully.")
        };
      });
    }

    function resetQueue(){
      queue = shuffleList(puzzles);
      shown = 0;
    }

    function pickPuzzle(){
      if(!queue.length) resetQueue();
      current = queue.shift();
      shown += 1;
      title.textContent = current.difficulty ? current.difficulty + " " + current.type : current.type;
      question.textContent = current.question;
      feedback.textContent = "Pick an answer.";
      optionsWrap.innerHTML = "";
      current.answers.forEach(function(answer){
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = answer;
        button.addEventListener("click", function(){
          var isCorrect = answer === current.correct;
          optionsWrap.querySelectorAll("button").forEach(function(item){
            item.classList.remove("is-correct","is-wrong");
          });
          button.classList.add(isCorrect ? "is-correct" : "is-wrong");
          feedback.textContent = isCorrect ? "Correct. " + current.hint : "Not quite. " + current.hint;
        });
        optionsWrap.appendChild(button);
      });
    }

    function startRotation(){
      window.clearInterval(intervalId);
      intervalId = window.setInterval(pickPuzzle, 10000);
    }

    function stopRotation(){
      window.clearInterval(intervalId);
    }

    if(refresh){
      refresh.addEventListener("click", function(){
        pickPuzzle();
        startRotation();
      });
    }
    fetch("/puzzles.json")
      .then(function(response){ return response.ok ? response.json() : null; })
      .then(function(data){
        var loaded = normalizePuzzles(data);
        if(loaded.length >= 500){
          puzzles = loaded;
        }
        resetQueue();
        pickPuzzle();
        startRotation();
      })
      .catch(function(){
        puzzles = normalizePuzzles({ puzzles:fallbackPuzzles });
        resetQueue();
        pickPuzzle();
        startRotation();
      });
    optionsWrap.addEventListener("click", startRotation);
    var puzzleCard = title.closest(".puzzle-card");
    if(puzzleCard){
      puzzleCard.addEventListener("mouseenter", stopRotation, { passive:true });
      puzzleCard.addEventListener("mouseleave", startRotation, { passive:true });
      puzzleCard.addEventListener("focusin", stopRotation);
      puzzleCard.addEventListener("focusout", startRotation);
    }
  }

  function initRotatingFacts(){
    var factCard = document.querySelector(".fact-card");
    var category = document.querySelector("[data-fact-category]");
    var text = document.querySelector("[data-fact-text]");
    var count = document.querySelector("[data-fact-count]");
    if(!factCard || !category || !text || !count) return;
    var fallbackFacts = [
      { category:"Space", text:"There are more stars in the universe than grains of sand on Earth." },
      { category:"Science", text:"Honey never spoils because it is naturally low in moisture and highly acidic." }
    ];
    var facts = fallbackFacts;
    var generalDeck = [];
    var indiaDeck = [];
    var regionalDeck = [];
    var shown = 0;
    var slot = 0;
    var intervalId = 0;
    var factId = 0;

    function normalizeFacts(data){
      var list = [];
      if(data && Array.isArray(data.facts)){
        list = list.concat(data.facts);
      }
      if(data && data.templates){
        Object.keys(data.templates).forEach(function(key){
          data.templates[key].forEach(function(item){
            list.push({ category:key, text:item });
          });
        });
      }
      return list.filter(function(item){
        return item && item.category && item.text;
      }).map(function(item){
        factId += 1;
        return {
          id:factId,
          category:String(item.category),
          text:String(item.text)
        };
      });
    }

    function resetDecks(){
      generalDeck = shuffleList(facts.filter(function(item){
        return item.category !== "India" && item.category !== "Karnataka" && item.category !== "Indian Culture";
      }));
      indiaDeck = shuffleList(facts.filter(function(item){
        return item.category === "India";
      }));
      regionalDeck = shuffleList(facts.filter(function(item){
        return item.category === "Karnataka" || item.category === "Indian Culture";
      }));
    }

    function pullFrom(deck, fallbackDeck){
      if(deck.length) return deck.shift();
      if(fallbackDeck && fallbackDeck.length) return fallbackDeck.shift();
      if(generalDeck.length) return generalDeck.shift();
      if(indiaDeck.length) return indiaDeck.shift();
      if(regionalDeck.length) return regionalDeck.shift();
      resetDecks();
      shown = 0;
      slot = 0;
      return pullFrom(deck, fallbackDeck);
    }

    function selectNextFact(){
      if(shown >= facts.length || (!generalDeck.length && !indiaDeck.length && !regionalDeck.length)){
        resetDecks();
        shown = 0;
        slot = 0;
      }
      var next;
      if(slot === 0){
        next = pullFrom(indiaDeck, regionalDeck);
      }else if(slot === 7){
        next = pullFrom(regionalDeck, indiaDeck);
      }else{
        next = pullFrom(generalDeck, null);
      }
      slot = (slot + 1) % 15;
      return next;
    }

    function showNextFact(){
      var next = selectNextFact();
      if(!next) return;
      shown += 1;
      factCard.classList.add("is-changing");
      window.setTimeout(function(){
        category.textContent = next.category.toUpperCase();
        text.textContent = next.text;
        count.textContent = "Fact " + shown + " / " + facts.length;
        factCard.classList.remove("is-changing");
      }, 500);
    }

    function startRotation(){
      window.clearInterval(intervalId);
      intervalId = window.setInterval(showNextFact, 4000);
    }

    function stopRotation(){
      window.clearInterval(intervalId);
    }

    fetch("/facts.json")
      .then(function(response){ return response.ok ? response.json() : null; })
      .then(function(data){
        var loaded = normalizeFacts(data);
        if(loaded.length >= 1000){
          facts = loaded;
        }
        resetDecks();
        showNextFact();
        startRotation();
      })
      .catch(function(){
        facts = normalizeFacts({ facts:fallbackFacts });
        resetDecks();
        showNextFact();
        startRotation();
      });
    factCard.addEventListener("mouseenter", stopRotation, { passive:true });
    factCard.addEventListener("mouseleave", startRotation, { passive:true });
    factCard.addEventListener("focusin", stopRotation);
    factCard.addEventListener("focusout", startRotation);
  }

  function initConversationStarters(){
    var card = document.querySelector(".starters-card");
    var textNode = document.querySelector("[data-starter-text]");
    if(!card || !textNode) return;
    var prompts = [
      "What would you do if money didn't matter?",
      "What's the most beautiful place you've seen?",
      "Would you rather live on Mars or underwater?",
      "What skill should everyone learn?",
      "What invention changed humanity most?",
      "What moment from today would you replay?",
      "Which city feels like the future?",
      "What do people misunderstand about you?"
    ];
    var queue = shuffleList(prompts);
    var last = textNode.textContent;

    function nextPrompt(){
      if(!queue.length) queue = shuffleList(prompts.filter(function(prompt){ return prompt !== last; }));
      var next = queue.shift();
      if(next === last && queue.length) next = queue.shift();
      last = next;
      card.classList.add("is-changing");
      window.setTimeout(function(){
        textNode.textContent = next;
        card.classList.remove("is-changing");
      }, 500);
    }

    window.setInterval(nextPrompt, 4000);
  }

  function initSectionReveals(){
    var sections = document.querySelectorAll(".trust-section,.why-section,.wait-lab,.communities-section,.community-card");
    if(!sections.length) return;
    sections.forEach(function(section){
      section.classList.add("js-reveal");
    });
    document.body.classList.add("reveal-ready");
    if(!("IntersectionObserver" in window)){
      sections.forEach(function(section){
        section.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold:.12, rootMargin:"0px 0px -8% 0px" });
    sections.forEach(function(section){
      observer.observe(section);
    });
  }

  function initLivePulse(){
    var list = document.getElementById("livePulseList");
    if(!list) return;

    function escapeText(value){
      return String(value || "").replace(/[&<>"']/g, function(character){
        return {
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#39;"
        }[character];
      });
    }

    function timeAgo(value){
      var timestamp = Date.parse(value || "");
      if(!timestamp) return "";
      var diff = Math.max(0, Date.now() - timestamp);
      var minute = 60 * 1000;
      var hour = 60 * minute;
      var day = 24 * hour;
      if(diff < minute) return "just now";
      if(diff < hour) return Math.floor(diff / minute) + "m ago";
      if(diff < day) return Math.floor(diff / hour) + "h ago";
      return Math.floor(diff / day) + "d ago";
    }

    function pulseItem(item){
      var meta = [item.detail, timeAgo(item.time)].filter(Boolean).join(" / ");
      return [
        '<article class="live-pulse-item">',
        '  <span class="live-pulse-marker" aria-hidden="true"></span>',
        '  <div>',
        '    <strong>' + escapeText(item.community) + '</strong>',
        '    <p>' + escapeText(item.label) + '</p>',
        meta ? '    <small>' + escapeText(meta) + '</small>' : '',
        '  </div>',
        '</article>'
      ].join("");
    }

    fetch("/api/feed")
      .then(function(response){ return response.ok ? response.json() : null; })
      .then(function(data){
        var items = [];
        (data && data.communityActivity || []).forEach(function(activity){
          if(!activity || !activity.communityName || !activity.message) return;
          items.push({
            community:activity.communityName,
            label:activity.message,
            detail:activity.channelName ? "Live discussion active" : "Recent activity",
            time:activity.createdAt
          });
        });
        (data && data.recentDiscussions || []).forEach(function(post){
          if(!post || !post.communityName || !post.title) return;
          items.push({
            community:post.communityName,
            label:post.title,
            detail:"New discussion created",
            time:post.time
          });
        });
        items.sort(function(a, b){
          return (Date.parse(b.time || "") || 0) - (Date.parse(a.time || "") || 0);
        });
        items = items.slice(0, 5);
        if(!items.length) return;
        list.innerHTML = items.map(pulseItem).join("");
      })
      .catch(function(){});
  }

  function initVisionHomepage(){
    if(!document.body.classList.contains("vision-home")) return;

    var locale = (navigator.language || "en").toLowerCase();
    var timeZone = "";
    try{
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    }catch(error){}

    var welcome = document.querySelector("[data-localized-welcome]");
    var welcomeText = "Welcome to Strango";
    if(locale.indexOf("hi") === 0 || locale.indexOf("en-in") === 0 || timeZone === "Asia/Calcutta" || timeZone === "Asia/Kolkata"){
      welcomeText = "Namaste. Talk now, belong later.";
    }else if(locale.indexOf("es") === 0){
      welcomeText = "Bienvenido. Talk now, belong later.";
    }else if(locale.indexOf("fr") === 0){
      welcomeText = "Bienvenue. Talk now, belong later.";
    }else if(locale.indexOf("ja") === 0){
      welcomeText = "Welcome. Talk now, belong later.";
    }
    if(welcome) welcome.textContent = welcomeText;

    var liveCounters = Array.prototype.slice.call(document.querySelectorAll("[data-live-count]"));
    liveCounters.forEach(function(counter){
      var base = Number(counter.getAttribute("data-live-count")) || Number(counter.textContent.replace(/,/g, "")) || 0;
      counter.setAttribute("data-live-base", String(base));
      counter.textContent = base.toLocaleString();
    });

    if(!liveCounters.length || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    setInterval(function(){
      liveCounters.forEach(function(counter, index){
        var base = Number(counter.getAttribute("data-live-base")) || 0;
        var wave = Math.sin(Date.now() / (1800 + index * 140) + index) * 5;
        var jitter = Math.floor(Math.random() * 5);
        var next = Math.max(1, Math.round(base + wave + jitter));
        counter.textContent = next.toLocaleString();
      });
    }, 2600);
  }

  if(socket){
    socket.on("onlineCount", updateCount);

    socket.on("status", function(text){
      if(!isStandaloneChatPage && chatOpen) return;
      var normalized = String(text || "");
      if(normalized.toLowerCase().indexOf("connected") !== -1 && normalized.toLowerCase().indexOf("disconnected") === -1){
        stopSearching();
        connected = true;
        setStatus("Connected ✓", "connected");
        haptic("match");
        if(isStandaloneChatPage){
          addMessage("Connected. Say hello.", "stranger system");
        }
        return;
      }
      if(normalized.toLowerCase().indexOf("disconnected") !== -1){
        stopSearching();
        connected = false;
        setStatus("", "disconnected");
        if(isStandaloneChatPage){
          addMessage("The stranger disconnected. Tap Next to match again.", "stranger system");
        }
        return;
      }
      startSearching();
    });

    socket.on("message", function(message){
      if(!connected) return;
      setTypingIndicator(false);
      addMessage(String(message || ""), "stranger");
      notifyInactiveIncomingMessage();
      notifyMinimizedMessage();
    });

    socket.on("typing", function(state){
      if(!typing || !connected) return;
      setTypingIndicator(Boolean(state));
    });

  }

  if(socket && isStandaloneChatPage && !socket.connected){
    socket.connect();
  }

  if(socket){
    socket.on("status", function(text){
      if(!isStandaloneChatPage && chatOpen) return;
      var normalized = String(text || "");
      if(normalized.toLowerCase().indexOf("connected") !== -1 && normalized.toLowerCase().indexOf("disconnected") === -1){
        setStatus("Connected \u2713", "connected");
      }
    });
  }

  if(form){
    form.addEventListener("submit", function(event){
      event.preventDefault();
      if(!isStandaloneChatPage) return;
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
      if(!isStandaloneChatPage) return;
      if(!connected) return;
      socket.emit("typing", true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(function(){
        socket.emit("typing", false);
      }, 700);
    });

    input.addEventListener("focus", function(){
      if(!isStandaloneChatPage) return;
      resetInactiveUnread();
      document.body.classList.add("chat-input-focused");
      setTimeout(function(){
        syncMobileViewport();
        if(messages) messages.scrollTop = messages.scrollHeight;
      }, 80);
    });

    input.addEventListener("blur", function(){
      if(!isStandaloneChatPage) return;
      document.body.classList.remove("chat-input-focused");
      setTimeout(syncMobileViewport, 80);
    });
  }

  if(nextBtn && socket){
    nextBtn.addEventListener("click", function(){
      if(!isStandaloneChatPage) return;
      if(messages) messages.innerHTML = "";
      if(typing) typing.textContent = "";
      startSearching();
      socket.emit("next");
    });
  }

  var communityTopics = {
    "AI":["AI tools","Automation","Future technology","Startups","Creative workflows"],
    "Gaming":["Games","Esports","Gaming culture","New releases","Player communities"],
    "Anime":["Anime series","Manga","Fan theories","Characters","Recommendations"],
    "Finance":["Money","Investing","Wealth","Markets","Personal finance"],
    "Fitness":["Training","Nutrition","Health","Recovery","Daily discipline"],
    "Geopolitics":["Global conflicts","Diplomacy","Elections","Trade","Military strategy"],
    "Entertainment":["Movies","Celebrities","Internet culture","Streaming","Pop culture"],
    "Bollywood":["Indian cinema","Actors","Music","Box office","Entertainment news"],
    "Hollywood":["Global film","Awards","Directors","Streaming","Entertainment"],
    "Beauty":["Skincare","Makeup","Lifestyle","Routines","Product discovery"],
    "Self Improvement":["Habits","Growth","Productivity","Mindset","Learning"],
    "FIFA 2026":["World Cup news","Match predictions","National teams","Transfers","Fan discussions"]
  };

  function openCommunityModal(name){
    if(!communityModal || !communityModalTitle || !communityModalTopics) return;
    var title = name || "Community";
    var topics = communityTopics[title] || ["Discussions","Ideas","News","Questions","Community conversations"];
    communityModalTitle.textContent = title;
    communityModalTopics.innerHTML = "";
    topics.forEach(function(topic){
      var item = document.createElement("li");
      item.textContent = topic;
      communityModalTopics.appendChild(item);
    });
    communityModal.classList.add("is-open");
    communityModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("community-modal-open");
    var closeButton = communityModal.querySelector("[data-community-close]");
    if(closeButton) closeButton.focus({ preventScroll:true });
  }

  function closeCommunityModal(){
    if(!communityModal) return;
    communityModal.classList.remove("is-open");
    communityModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("community-modal-open");
  }

  document.querySelectorAll("[data-community-close]").forEach(function(button){
    button.addEventListener("click", closeCommunityModal);
  });

  document.addEventListener("keydown", function(event){
    if(event.key === "Escape" && communityModal && communityModal.classList.contains("is-open")){
      closeCommunityModal();
    }
  });

  document.querySelectorAll(".community-card[data-community-preview]").forEach(function(card){
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.addEventListener("click", function(){
      haptic("join");
      var title = card.querySelector("h3");
      openCommunityModal(title ? title.textContent.trim() : "");
    });
    card.addEventListener("keydown", function(event){
      if(event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      haptic("join");
      var title = card.querySelector("h3");
      openCommunityModal(title ? title.textContent.trim() : "");
    });
  });

  startChatTriggers.forEach(function(link){
    link.setAttribute("aria-expanded", "false");
    link.addEventListener("click", function(event){
      if(!chatPanel){
        var target = link.getAttribute("href") || "#chat";
        if(target === "#chat"){
          event.preventDefault();
          var hero = document.getElementById("chat");
          if(hero) hero.scrollIntoView({ behavior:"smooth", block:"start" });
        }
        return;
      }
      event.preventDefault();
      launchChat(link);
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
      launchChat(chatBubble);
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

  initConversationNetwork();
  initCommunityConstellation();
  initConnectionNetwork();
  if(!document.body.classList.contains("home-short")){
    initPuzzleCard();
    initRotatingFacts();
    initConversationStarters();
  }
  initVisionHomepage();
  initLivePulse();
  initSectionReveals();
  seedHomeChatPreview();
  updateUnreadBadge();
  syncMobileViewport();
  ["pointerdown", "touchstart", "keydown"].forEach(function(eventName){
    window.addEventListener(eventName, function(){
      hasUserInteracted = true;
    }, { passive:true, once:true });
  });
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
