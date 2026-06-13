function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getFramerMotion() {
  return window.framerMotion || window.FramerMotion || window.Motion || null;
}

export function animateElement(element, keyframes, options) {
  if (!element || prefersReducedMotion()) return null;
  var motion = getFramerMotion();
  if (motion && typeof motion.animate === "function") {
    return motion.animate(element, keyframes, options || {});
  }
  if (typeof element.animate === "function") {
    return element.animate(keyframes, Object.assign({ fill: "both" }, options || {}));
  }
  return null;
}

export function fadeInPage(element) {
  animateElement(element, { opacity: [0, 1], transform: ["translateY(12px)", "translateY(0)"] }, {
    duration: 420,
    easing: "cubic-bezier(.2,.8,.2,1)"
  });
}

export function animateCards(root) {
  var cards = Array.from((root || document).querySelectorAll("[data-motion-card]"));
  cards.forEach(function(card, index) {
    animateElement(card, { opacity: [0, 1], transform: ["translateY(14px) scale(.98)", "translateY(0) scale(1)"] }, {
      duration: 340,
      delay: Math.min(index * 42, 280),
      easing: "cubic-bezier(.2,.8,.2,1)"
    });
  });
}

export function animateModalOpen(panel) {
  animateElement(panel, { opacity: [0, 1], transform: ["translateY(18px) scale(.96)", "translateY(0) scale(1)"] }, {
    duration: 260,
    easing: "cubic-bezier(.2,.8,.2,1)"
  });
}

export function attachRouteTransitions(root) {
  var links = Array.from((root || document).querySelectorAll("a[href^='/communities'],a[href^='/app']"));
  links.forEach(function(link) {
    link.addEventListener("click", function(event) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var href = link.getAttribute("href");
      if (!href || href === window.location.pathname) return;
      event.preventDefault();
      var main = document.querySelector("main");
      var animation = animateElement(main, { opacity: [1, 0], transform: ["translateY(0)", "translateY(8px)"] }, {
        duration: 160,
        easing: "cubic-bezier(.4,0,1,1)"
      });
      window.setTimeout(function() {
        window.location.href = href;
      }, animation ? 150 : 0);
    });
  });
}
