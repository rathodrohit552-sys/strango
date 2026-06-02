(function(){
  var storageKey = "strango_theme";
  var root = document.documentElement;

  function preferredTheme(){
    try{
      var saved = localStorage.getItem(storageKey);
      if(saved === "dark" || saved === "light") return saved;
    }catch(error){}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme){
    root.setAttribute("data-theme", theme);
    var button = document.querySelector("[data-theme-toggle]");
    if(button){
      button.textContent = theme === "dark" ? "Light" : "Dark";
      button.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    }
  }

  applyTheme(preferredTheme());

  document.addEventListener("DOMContentLoaded", function(){
    var header = document.querySelector(".site-header");
    if(!header || document.querySelector("[data-theme-toggle]")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.setAttribute("data-theme-toggle", "true");
    header.appendChild(button);
    applyTheme(root.getAttribute("data-theme") || preferredTheme());

    button.addEventListener("click", function(){
      var nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try{
        localStorage.setItem(storageKey, nextTheme);
      }catch(error){}
      applyTheme(nextTheme);
    });
  });
})();
