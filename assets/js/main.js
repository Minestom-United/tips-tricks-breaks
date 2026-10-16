// main.js: tiny progressive enhancement, no dependencies.
(function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Copy buttons for code blocks
  document.querySelectorAll(".markdown pre").forEach(function (pre) {
    if (pre.querySelector(".code-copy")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.textContent = "copy";
    btn.setAttribute("aria-label", "Copy code block");
    btn.addEventListener("click", function () {
      var code = pre.querySelector("code");
      var text = code ? code.innerText : pre.innerText;
      var done = function () {
        btn.textContent = "copied!";
        setTimeout(function () { btn.textContent = "copy"; }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
    pre.prepend(btn);
  });

  // Anchor links on h2/h3 inside article
  document.querySelectorAll(".markdown h2[id], .markdown h3[id]").forEach(function (h) {
    var a = document.createElement("a");
    a.href = "#" + h.id;
    a.className = "h-anchor";
    a.textContent = " ¶";
    a.setAttribute("aria-label", "Link to this section");
    a.style.cssText = "text-decoration:none;font-size:.8em;";
    h.appendChild(a);
  });

  // Technique finder: text search + category chips, category kept in the URL hash
  var q = document.getElementById("finder-q");
  var items = document.querySelectorAll("#tech-list .tech");
  if (q && items.length) {
    var chips = document.querySelectorAll(".chip");
    var empty = document.getElementById("finder-empty");
    var cat = decodeURIComponent(location.hash.slice(1));
    var apply = function () {
      var words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      items.forEach(function (li) {
        var text = li.getAttribute("data-text");
        var ok = (!cat || li.getAttribute("data-cat") === cat) &&
          words.every(function (w) { return text.indexOf(w) !== -1; });
        li.hidden = !ok;
        if (ok) shown++;
      });
      chips.forEach(function (c) {
        c.classList.toggle("is-on", c.getAttribute("data-cat") === cat);
      });
      empty.hidden = shown > 0;
    };
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        cat = c.getAttribute("data-cat");
        history.replaceState(null, "", cat ? "#" + cat : location.pathname);
        apply();
      });
    });
    q.addEventListener("input", apply);
    apply();
  }
})();
