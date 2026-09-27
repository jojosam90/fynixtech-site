/* Fynix Task landing: language switch (shared with the web app), mobile menu, reveal-on-scroll. */
(function () {
  var dict = window.FYNIX_I18N || {};
  var LANGS = ["en", "zh-CN", "zh-TW", "ms"];
  // Same cookie as the web app, so "Try in your browser" opens in the language chosen here.
  var COOKIE = "fynix_locale";

  function readLang() {
    var m = document.cookie.match(/(?:^|; )fynix_locale=([^;]+)/);
    if (m && LANGS.indexOf(m[1]) >= 0) return m[1];
    var n = (navigator.language || "en").toLowerCase();
    if (n.indexOf("zh") === 0) return /tw|hk|mo|hant/.test(n) ? "zh-TW" : "zh-CN";
    if (n.indexOf("ms") === 0) return "ms";
    return "en";
  }

  function apply(lang) {
    var t = dict[lang] || dict.en;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t[el.getAttribute("data-i18n")];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var v = t[el.getAttribute("data-i18n-placeholder")];
      if (v != null) el.setAttribute("placeholder", v);
    });
    var sel = document.getElementById("lang");
    if (sel) sel.value = lang;
    if (window.__hxRerender) window.__hxRerender();
  }

  var lang = readLang();
  apply(lang);
  var sel = document.getElementById("lang");
  if (sel) sel.addEventListener("change", function () {
    document.cookie = COOKIE + "=" + sel.value + "; path=/; max-age=31536000; samesite=lax";
    apply(sel.value);
  });

  // ---- Hero: live app mock. A cursor opens each task and the conversation fills in; visitors can click tasks too ----
  var T = function (k, vars) {
    var s = ((dict[document.documentElement.lang] || dict.en)[k]) || dict.en[k] || k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.replace("{" + v + "}", vars[v]); });
    return s;
  };
  var hx = document.getElementById("hx");
  if (hx) {
    var hxButtons = Array.prototype.slice.call(hx.querySelectorAll(".hx-tasks button"));
    var hxChat = hx.querySelector(".hx-chat");
    var hxTitle = hx.querySelector(".hx-title");
    var hxCursor = hx.querySelector(".hx-cursor");
    var SECS = [72, 48, 35, 56];
    var run = 0, current = 0, tourTimer = null, resumeTimer = null;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

    // Each task's answer, built from the translated strings
    var SVGNS = "http://www.w3.org/2000/svg";
    var html = function (tag, cls, markup) { var n = el(tag, cls); n.innerHTML = markup; return n; };

    // Blue silk sleep mask: real photos of one product (Pexels, see assets/img/shots/CREDITS.md)
    var SHOTS = ["hero", "detail", "flatlay", "inuse", "lifestyle"];

    function stars(n) {
      var full = Math.round(n * 2) / 2, s = "";
      for (var i = 1; i <= 5; i++) s += i <= full ? "★" : (i - 0.5 === full ? '<i class="half">★</i>' : "<i>★</i>");
      return s;
    }

    var outputs = [
      function () { // shop review: KPIs + 30-day revenue chart + plan
        var kpis = html("div", "hx-kpis",
          '<div class="hx-kpi"><small>' + T("hx.0.k1") + '</small><b>$48.6k</b><em class="up">+18%</em></div>' +
          '<div class="hx-kpi"><small>' + T("hx.0.k2") + '</small><b>1,286</b><em class="up">+11%</em></div>' +
          '<div class="hx-kpi"><small>' + T("hx.0.k3") + '</small><b>6.2%</b><em class="down">+0.8</em></div>');
        var data = [32, 36, 30, 41, 38, 45, 43, 48, 44, 52, 50, 57, 55, 61, 58];
        var bars = "", w = 300 / data.length;
        data.forEach(function (v, k) {
          var h = v * 1.4, x = k * w + 3, top = k >= data.length - 4;
          bars += '<rect x="' + x.toFixed(1) + '" y="' + (92 - h) + '" width="' + (w - 6).toFixed(1) + '" height="' + h + '" rx="3" fill="' + (top ? "url(#hxbar)" : "#dbe3ff") + '" style="animation-delay:' + (k * 40) + 'ms"/>';
        });
        var chart = html("div", "hx-chart",
          '<div class="hx-chart-head"><b>' + T("hx.0.chart") + '</b><span>' + T("hx.0.range") + '</span></div>' +
          '<svg viewBox="0 0 300 92" preserveAspectRatio="none"><defs><linearGradient id="hxbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3df5"/><stop offset="1" stop-color="#2f6bff"/></linearGradient></defs>' + bars + '</svg>');
        return [el("h4", null, T("hx.0.h")), kpis, chart, list(["hx.0.l2", "hx.0.l3"])];
      },
      function () { // product images: 5 product photos
        var grid = el("div", "hx-shots");
        for (var i = 0; i < 5; i++) {
          var fig = el("figure", "hx-shot");
          fig.style.animationDelay = (i * 120) + "ms";
          fig.innerHTML = '<img src="assets/img/shots/mask-' + SHOTS[i] + '.webp" alt="" width="400" height="400" decoding="async" />';
          fig.appendChild(el("figcaption", null, T("hx.1.i" + (i + 1))));
          grid.appendChild(fig);
        }
        return [el("h4", null, T("hx.1.h")), grid, el("p", null, T("hx.1.note"))];
      },
      function () { // buyer research: recommendation with star ratings
        var rows = [["hx.2.r1", 4.5], ["hx.2.r2", 5], ["hx.2.r3", 4], ["hx.2.r4", 4.5]];
        var rec = html("div", "hx-rec",
          '<div class="hx-rec-top"><span class="hx-thumb">👍</span><div><b>' + T("hx.2.rec") + '</b><small>' + T("hx.2.recSub") + '</small></div>' +
          '<div class="hx-score"><b>4.6</b><span class="hx-stars">' + stars(4.5) + '</span><small>' + T("hx.2.overall") + '</small></div></div>' +
          rows.map(function (r) { return '<div class="hx-rate"><span>' + T(r[0]) + '</span><span class="hx-stars">' + stars(r[1]) + '</span><em>' + r[1].toFixed(1) + '</em></div>'; }).join("") +
          '<p>' + T("hx.2.l3") + '</p>');
        return [el("h4", null, T("hx.2.h")), list(["hx.2.l1", "hx.2.l2"]), rec];
      },
      function () {
        var t = el("table", "hx-table");
        var rows = [["hx.3.you", "$29", "4.6 ★"], ["hx.3.a", "$25", "4.4 ★"], ["hx.3.b", "$35", "4.7 ★"], ["hx.3.c", "$22", "4.1 ★"]];
        var head = el("tr");
        ["hx.3.c1", "hx.3.c2", "hx.3.c3"].forEach(function (k) { head.appendChild(el("th", null, T(k))); });
        t.appendChild(head);
        rows.forEach(function (r, i) {
          var tr = el("tr", i === 0 ? "me" : null);
          tr.appendChild(el("td", null, T(r[0]))); tr.appendChild(el("td", null, r[1])); tr.appendChild(el("td", null, r[2]));
          t.appendChild(tr);
        });
        return [el("h4", null, T("hx.3.h")), t, el("p", null, T("hx.3.note"))];
      },
    ];
    function list(keys) { var ul = el("ul"); keys.forEach(function (k) { ul.appendChild(el("li", null, T(k))); }); return ul; }

    // Show task i. animate=true plays it like a live run (message, thinking, answer line by line).
    function render(i, animate) {
      var me = ++run;
      current = i;
      hxButtons.forEach(function (b, j) { b.classList.toggle("on", j === i); b.classList.remove("busy"); });
      hxTitle.textContent = T("demo.t" + (i + 1));
      hxChat.innerHTML = "";
      if (i === 4) { renderGroup(me, animate); return; }
      var who = el("div", "hx-who", "Mei Ling "); who.appendChild(el("i", null, "ML"));
      var msg = el("div", "hx-user-msg", T("hx." + i + ".q"));
      var bot = el("div", "hx-bot"); var logo = el("img"); logo.src = "assets/img/logo.png"; logo.alt = ""; bot.appendChild(logo); bot.appendChild(document.createTextNode("Fynix Task"));
      var think = el("div", "hx-think");
      var out = el("div", "hx-out");
      var parts = outputs[i]();
      if (!animate) {
        think.textContent = T("hx.thought", { n: SECS[i] }) + " ›";
        parts.forEach(function (p) { out.appendChild(p); });
        [who, msg, bot, think, out].forEach(function (n) { hxChat.appendChild(n); });
        return;
      }
      hxChat.appendChild(who); hxChat.appendChild(msg);
      var step = function (fn, ms) { setTimeout(function () { if (me === run) fn(); }, ms); };
      step(function () {
        hxButtons[i].classList.add("busy");
        think.textContent = T("hx.thinking") + " ";
        var dots = el("span", "dots"); dots.innerHTML = "<i></i><i></i><i></i>"; think.appendChild(dots);
        hxChat.appendChild(bot); hxChat.appendChild(think);
      }, 500);
      step(function () {
        think.textContent = T("hx.thought", { n: SECS[i] }) + " ›";
        hxChat.appendChild(out);
        parts.forEach(function (p, k) { step(function () { out.appendChild(p); hxChat.scrollTop = hxChat.scrollHeight; if (k === parts.length - 1) hxButtons[i].classList.remove("busy"); }, k * 380); });
      }, 1900);
    }

    // Group chat: several agents work the same brief, handing off to each other.
    var AGENTS = [
      { key: "hx.g.coord", ini: "F", c1: "#5b3df5", c2: "#9b5cf6" },
      { key: "hx.g.src", ini: "S", c1: "#f59e0b", c2: "#ef4444" },
      { key: "hx.g.des", ini: "D", c1: "#ec4899", c2: "#a855f7" },
      { key: "hx.g.mkt", ini: "M", c1: "#d946ef", c2: "#f43f5e" },
    ];
    var GROUP = [[0, "hx.g.m1"], [1, "hx.g.m2"], [2, "hx.g.m3"], [3, "hx.g.m4"], [0, "hx.g.m5"]];
    function agentMsg(a, text) {
      var row = el("div", "hx-gmsg");
      var av = el("span", "hx-gav", a.ini); av.style.background = "linear-gradient(135deg," + a.c1 + "," + a.c2 + ")";
      var body = el("div", "hx-gbody");
      body.appendChild(el("b", null, T(a.key)));
      if (text != null) body.appendChild(el("p", null, text));
      row.appendChild(av); row.appendChild(body);
      return row;
    }
    function renderGroup(me, animate) {
      hxTitle.textContent = T("demo.t5") + " · " + T("hx.g.members");
      var who = el("div", "hx-who", "Mei Ling "); who.appendChild(el("i", null, "ML"));
      hxChat.appendChild(who);
      hxChat.appendChild(el("div", "hx-user-msg", T("hx.4.q")));
      if (!animate) {
        GROUP.forEach(function (g) { hxChat.appendChild(agentMsg(AGENTS[g[0]], T(g[1]))); });
        return;
      }
      var step = function (fn, ms) { setTimeout(function () { if (me === run) fn(); }, ms); };
      hxButtons[4].classList.add("busy");
      var t = 700;
      GROUP.forEach(function (g, k) {
        var a = AGENTS[g[0]];
        var typing;
        step(function () {
          typing = agentMsg(a, null);
          var dots = el("span", "hx-typing"); dots.innerHTML = "<i></i><i></i><i></i>";
          typing.querySelector(".hx-gbody").appendChild(dots);
          hxChat.appendChild(typing); hxChat.scrollTop = hxChat.scrollHeight;
        }, t);
        t += 1100;
        step(function () {
          var done = agentMsg(a, T(g[1]));
          hxChat.replaceChild(done, typing); hxChat.scrollTop = hxChat.scrollHeight;
          if (k === GROUP.length - 1) hxButtons[4].classList.remove("busy");
        }, t);
        t += 450;
      });
    }
    window.__hxRerender = function () { render(current, false); };

    // The guided tour: move the cursor onto the next task, show "Click to explore", click, play it.
    function moveTo(b) {
      var hr = hx.getBoundingClientRect(), br = b.getBoundingClientRect();
      hxCursor.style.transform = "translate(" + (br.left - hr.left + br.width * 0.55) + "px," + (br.top - hr.top + br.height * 0.45) + "px)";
    }
    function tour() {
      var next = (current + 1) % hxButtons.length;
      var b = hxButtons[next];
      moveTo(b);
      tourTimer = setTimeout(function () {
        hxCursor.classList.add("hint");
        tourTimer = setTimeout(function () {
          hxCursor.classList.add("press");
          tourTimer = setTimeout(function () {
            hxCursor.classList.remove("press", "hint");
            render(next, true);
            tourTimer = setTimeout(tour, next === 4 ? 10500 : 6200);
          }, 180);
        }, 900);
      }, 1000);
    }
    hxButtons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        // A visitor took over: stop the tour, play their choice, resume after a quiet spell
        clearTimeout(tourTimer); clearTimeout(resumeTimer);
        hx.classList.add("user");
        render(i, !reduced);
        resumeTimer = setTimeout(function () { hx.classList.remove("user"); tour(); }, 15000);
      });
    });

    render(0, false);
    if (!reduced && window.innerWidth > 600) tourTimer = setTimeout(tour, 1200);
  }

  // ---- Interactive app preview: type, press Enter, get a "this is a preview" reply ----
  var demo = document.getElementById("demo");
  if (demo) {
    var form = demo.querySelector(".demo-composer");
    var box = form.querySelector("textarea");
    var send = form.querySelector(".demo-send");
    var chat = demo.querySelector(".demo-chat");
    var tr = function (k) { return ((dict[document.documentElement.lang] || dict.en)[k]) || dict.en[k] || k; };
    var ICON_OPEN = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    var ICON_DL = '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

    var sync = function () {
      send.disabled = !box.value.trim();
      box.style.height = "auto";
      box.style.height = Math.min(box.scrollHeight, 140) + "px";
    };
    box.addEventListener("input", sync);
    box.addEventListener("keydown", function (e) {
      // Enter sends; Shift+Enter is a new line; ignore Enter while an IME (e.g. Chinese input) is composing
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); }
    });
    demo.querySelectorAll(".demo-chips button").forEach(function (b) {
      b.addEventListener("click", function () { box.value = tr(b.getAttribute("data-prompt")); sync(); box.focus(); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = box.value.trim();
      if (!text) return;
      demo.classList.add("chatting");
      var msg = document.createElement("div");
      msg.className = "demo-msg";
      msg.textContent = text; // user text is never parsed as HTML
      chat.appendChild(msg);
      box.value = "";
      sync();

      var reply = document.createElement("div");
      reply.className = "demo-reply";
      reply.innerHTML = '<div class="demo-reply-head"><img src="assets/img/logo.png" alt="">Fynix Task</div>' +
        '<div class="demo-typing"><i></i><i></i><i></i></div>';
      chat.appendChild(reply);
      chat.scrollTop = chat.scrollHeight;

      setTimeout(function () {
        var card = document.createElement("div");
        card.className = "demo-card";
        card.innerHTML = "<b></b><p></p><div class='demo-card-actions'>" +
          "<a class='primary'>" + ICON_OPEN + "<span></span></a><a class='ghost'>" + ICON_DL + "<span></span></a></div>";
        card.querySelector("b").textContent = tr("demo.previewTitle");
        card.querySelector("p").textContent = tr("demo.previewBody");
        var links = card.querySelectorAll("a");
        links[0].href = "/task/app?q=" + encodeURIComponent(text); // the real app opens with this prompt ready
        links[0].querySelector("span").textContent = tr("demo.open");
        links[1].href = "/downloads/FynixTask-latest.apk";
        links[1].querySelector("span").textContent = tr("demo.android");
        reply.replaceChild(card, reply.querySelector(".demo-typing"));
        chat.scrollTop = chat.scrollHeight;
      }, 900);
    });
  }


  // Pricing: Individual / Team & Enterprise
  document.querySelectorAll(".plan-toggle button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".plan-toggle button").forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", String(x === b)); });
      document.querySelectorAll(".plans[data-group]").forEach(function (g) { g.hidden = g.getAttribute("data-group") !== b.getAttribute("data-plans"); });
    });
  });

  // Mobile menu
  var burger = document.querySelector(".nav-burger");
  var menu = document.querySelector(".nav-mobile");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      burger.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); }
    });
  }

  // Reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }
})();

/* Section URLs: /main, /product, /agents, /mobile, /pricing, /faq all show this page, scrolled to the section. */
(function () {
  var SECTIONS = ["product", "agents", "mobile", "pricing", "faq"];
  var navH = function () { var n = document.querySelector(".nav"); return n ? n.offsetHeight : 0; };
  function sectionOf(path) { var p = path.replace(/^\/+|\/+$/g, "").toLowerCase(); return SECTIONS.indexOf(p) >= 0 ? p : null; }
  function go(sec, smooth) {
    var el = sec && document.getElementById(sec);
    var top = el ? el.getBoundingClientRect().top + window.pageYOffset - navH() : 0;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  }
  // Links like href="/pricing" stay on this page: update the URL and scroll instead of reloading.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var href = a.getAttribute("href");
    var sec = sectionOf(href);
    if (!sec && href !== "/main") return;
    if (sec ? !document.getElementById(sec) : !document.getElementById("product")) return; // other pages: normal navigation
    e.preventDefault();
    history.pushState(null, "", sec ? "/" + sec : "/main");
    go(sec, true);
  });
  window.addEventListener("popstate", function () { go(sectionOf(location.pathname), true); });
  // Opened directly at /pricing etc.: jump there once the layout has settled.
  var initial = sectionOf(location.pathname);
  if (initial) {
    if (location.pathname !== "/" + initial) history.replaceState(null, "", "/" + initial);
    window.addEventListener("load", function () { go(initial, false); });
    go(initial, false);
  }
})();

/* Web + phone demo: a task types itself on the web, appears on the phone at the same moment, and both stream the answer. */
(function () {
  var demo = document.getElementById("demo");
  var phone = document.querySelector(".demo-phone");
  if (!demo || !phone) return;
  var dict = window.FYNIX_I18N || {};
  var T = function (k) { return ((dict[document.documentElement.lang] || dict.en || {})[k]) || (dict.en || {})[k] || k; };
  var box = demo.querySelector(".demo-composer textarea");
  var send = demo.querySelector(".demo-send");
  var chat = demo.querySelector(".demo-chat");
  var tasks = demo.querySelector(".demo-tasks");
  var pchat = phone.querySelector(".dp-chat");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  var timers = [], stopped = false, started = false, scene = 0;
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
  var clearTimers = function () { timers.forEach(clearTimeout); timers = []; };

  var SCENES = [
    { prompt: "demo.p4", title: "auto.a.t", head: "auto.a.h", lines: ["auto.a.l1", "auto.a.l2", "auto.a.l3"] },
    { prompt: "demo.p1", title: "auto.b.t", head: "auto.b.h", lines: ["auto.b.l1", "auto.b.l2", "auto.b.l3"] },
  ];

  function bot(cls) { var b = el("div", cls); var i = el("img"); i.src = "assets/img/logo.png"; i.alt = ""; b.appendChild(i); b.appendChild(document.createTextNode("Fynix Task")); return b; }
  function thinking(cls) { var t = el("div", cls, T("hx.thinking") + " "); t.insertAdjacentHTML("beforeend", "<i></i><i></i><i></i>"); return t; }

  function reset() {
    chat.innerHTML = ""; pchat.innerHTML = "";
    demo.classList.remove("chatting"); phone.classList.remove("chatting");
    box.value = ""; send.disabled = true;
    tasks.querySelectorAll("a.new").forEach(function (a) { a.remove(); });
  }

  function play() {
    if (stopped) return;
    reset();
    var sc = SCENES[scene++ % SCENES.length];
    var text = T(sc.prompt);
    // 1. type on the web
    var i = 0;
    (function type() {
      if (stopped) return;
      box.value = text.slice(0, ++i); send.disabled = false;
      if (i < text.length) later(type, 28); else later(sendIt, 500);
    })();
    function sendIt() {
      box.value = ""; send.disabled = true;
      demo.classList.add("chatting"); phone.classList.add("chatting");
      // task appears in the web history
      tasks.querySelectorAll("a.on").forEach(function (a) { a.classList.remove("on"); });
      var t = el("a", "on new", T(sc.title)); tasks.insertBefore(t, tasks.firstChild);
      // 2. the message shows on both screens
      chat.appendChild(el("div", "demo-msg", text));
      later(function () { pchat.appendChild(el("div", "dp-msg", text)); pchat.appendChild(el("div", "sync-pill", "⟳ " + T("auto.synced"))); }, 250);
      // 3. both think, then stream the same answer
      var wr = el("div", "demo-reply"); wr.appendChild(bot("demo-reply-head")); var wt = thinking("dp-think"); wr.appendChild(wt);
      var pb = bot("dp-bot"); var pt = thinking("dp-think");
      later(function () { chat.appendChild(wr); pchat.appendChild(pb); pchat.appendChild(pt); }, 700);
      later(function () {
        var wa = el("div", "demo-ans"), pa = el("div", "dp-ans");
        wa.appendChild(el("b", null, T(sc.head))); pa.appendChild(el("b", null, T(sc.head)));
        var wu = el("ul"), pu = el("ul"); wa.appendChild(wu); pa.appendChild(pu);
        wr.replaceChild(wa, wt); pchat.replaceChild(pa, pt);
        sc.lines.forEach(function (k, n) {
          later(function () { wu.appendChild(el("li", null, T(k))); pu.appendChild(el("li", null, T(k))); pchat.scrollTop = pchat.scrollHeight; chat.scrollTop = chat.scrollHeight; }, n * 450);
        });
        later(play, sc.lines.length * 450 + 4200);
      }, 2200);
    }
  }

  // A visitor takes over: stop the autoplay and give them a clean composer.
  function takeOver() {
    if (stopped) return;
    stopped = true; clearTimers(); reset();
  }
  box.addEventListener("focus", takeOver);
  demo.querySelectorAll(".demo-chips button").forEach(function (b) { b.addEventListener("pointerdown", takeOver); });

  // Mirror the visitor's own messages on the phone too (capture phase: runs before the web demo clears the box).
  document.addEventListener("submit", function (e) {
    if (!demo.contains(e.target)) return;
    var text = box.value.trim();
    if (!text) return;
    phone.classList.add("chatting");
    pchat.appendChild(el("div", "dp-msg", text));
    pchat.appendChild(el("div", "sync-pill", "⟳ " + T("auto.synced")));
    var pb = bot("dp-bot"), pt = thinking("dp-think");
    pchat.appendChild(pb); pchat.appendChild(pt);
    setTimeout(function () { var a = el("div", "dp-ans"); a.appendChild(el("b", null, T("demo.previewTitle"))); a.appendChild(document.createTextNode(T("auto.phoneNote"))); pchat.replaceChild(a, pt); pchat.scrollTop = pchat.scrollHeight; }, 900);
    pchat.scrollTop = pchat.scrollHeight;
  }, true);

  // Start when the demo scrolls into view (desktop only; phones don't show the mirror).
  if (reduced || window.innerWidth <= 820) return;
  var io = new IntersectionObserver(function (es) {
    if (es.some(function (x) { return x.isIntersecting; }) && !started) { started = true; later(play, 600); io.disconnect(); }
  }, { threshold: 0.35 });
  io.observe(demo);
})();

/* Agents marketplace mock: cursor clicks "Chat" (adds the agent) and "Create agent" (a custom agent appears). */
(function () {
  var box = document.getElementById("agmock");
  if (!box) return;
  var dict = window.FYNIX_I18N || {};
  var T = function (k) { return ((dict[document.documentElement.lang] || dict.en || {})[k]) || (dict.en || {})[k] || k; };
  var grid = box.querySelector(".ag-grid");
  var count = box.querySelector(".ag-count");
  var toast = box.querySelector(".ag-toast");
  var cursor = box.querySelector(".ag-cursor");
  var bubble = cursor.querySelector("span");
  var create = box.querySelector(".ag-create");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timers = [], user = false, installed = 4, toastTimer;
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

  function showToast(text) { toast.textContent = text; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 2200); }
  function bump(n) { installed += n; count.textContent = installed; count.classList.add("bump"); setTimeout(function () { count.classList.remove("bump"); }, 250); }

  function addAgent(card) {
    var btn = card.querySelector(".ag-chat");
    if (btn.classList.contains("added")) return;
    btn.classList.add("added");
    btn.querySelector("span").textContent = "✓ " + T("ag.added");
    bump(1);
    showToast(T("a" + card.getAttribute("data-agent") + ".name") + " " + T("ag.joined"));
  }
  function createAgent() {
    var card = document.createElement("div");
    card.className = "ag-card new mine";
    card.innerHTML = '<span class="ag-more">···</span><span class="ag-av" style="--c1:#5b3df5;--c2:#9b5cf6"><svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg></span><b></b><span class="ag-by"></span><p></p><button type="button" class="ag-chat added"><span></span></button>';
    card.querySelector("b").textContent = T("ag.newName");
    card.querySelector(".ag-by").textContent = T("ag.byYou");
    card.querySelector("p").textContent = T("ag.newDesc");
    card.querySelector(".ag-chat span").textContent = "✓ " + T("ag.added");
    grid.insertBefore(card, grid.firstChild);
    if (grid.children.length > 6) grid.removeChild(grid.lastElementChild);
    bump(1);
    showToast(T("ag.created"));
  }
  function reset() {
    grid.querySelectorAll(".ag-card.mine").forEach(function (c) { c.remove(); });
    grid.querySelectorAll(".ag-chat.added").forEach(function (b) { b.classList.remove("added"); b.querySelector("span").textContent = T("ag.chat"); });
    installed = 4; count.textContent = "4"; closeDialog();
  }
  function moveTo(elm) {
    var hr = box.getBoundingClientRect(), r = elm.getBoundingClientRect();
    var x = r.left - hr.left + r.width * 0.55;
    var flip = x > hr.width - 200;
    cursor.classList.toggle("flip", flip);
    // flipped: the bubble sits left of the pointer, so shift the whole cursor left by the bubble's width
    var shift = flip ? Math.max(0, cursor.offsetWidth - 26) : 0;
    cursor.style.transform = "translate(" + (x - shift) + "px," + (r.top - hr.top + r.height * 0.5) + "px)";
  }
  function press(elm, then) { elm.classList.add("press"); cursor.classList.add("press"); later(function () { elm.classList.remove("press"); cursor.classList.remove("press"); then(); }, 180); }

  var modal = box.querySelector(".ag-modal");
  var typed = box.querySelector(".ag-typed");
  var role = box.querySelector(".ag-role");
  var confirmBtn = box.querySelector(".ag-confirm");
  function openDialog() { typed.textContent = ""; role.textContent = ""; modal.hidden = false; }
  function closeDialog() { modal.hidden = true; }
  function typeName(text, ms) {
    var i = 0;
    (function step() { typed.textContent = text.slice(0, ++i); if (i < text.length) later(step, ms); else later(function () { role.textContent = T("ag.newDesc"); }, 250); })();
  }
  var pick = 1;
  function tour() {
    if (user) return;
    reset();
    later(function () { moveTo(create); }, 400);
    later(function () { press(create, openDialog); }, 1500);
    later(function () { typeName(T("ag.newName"), 60); }, 2100);
    later(function () { moveTo(confirmBtn); }, 3500);
    later(function () { press(confirmBtn, function () { closeDialog(); createAgent(); }); }, 4500);
    later(tour, 8500);
  }

  // Visitors can click too; the tour stops while they do
  function takeOver() { user = true; timers.forEach(clearTimeout); timers = []; box.classList.add("user"); cursor.style.opacity = "0"; }
  grid.addEventListener("click", function (e) {
    var btn = e.target.closest(".ag-chat"); if (!btn) return;
    takeOver(); var card = btn.closest(".ag-card"); if (!card.classList.contains("mine")) addAgent(card);
  });
  create.addEventListener("click", function () { takeOver(); openDialog(); typeName(T("ag.newName"), 45); });
  confirmBtn.addEventListener("click", function () { takeOver(); closeDialog(); createAgent(); });
  box.querySelector(".ag-cancel").addEventListener("click", function () { takeOver(); closeDialog(); });

  if (reduced || window.innerWidth <= 820) { cursor.style.display = "none"; return; }
  var io = new IntersectionObserver(function (es) {
    if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); later(tour, 500); }
  }, { threshold: 0.35 });
  io.observe(box);
})();

/* Back-to-top button: shown after scrolling past the first screen */
(function () {
  var b = document.querySelector(".to-top");
  if (!b) return;
  var sync = function () { b.classList.toggle("show", window.scrollY > window.innerHeight * 0.8); };
  window.addEventListener("scroll", sync, { passive: true });
  sync();
  b.addEventListener("click", function (e) { e.preventDefault(); history.pushState(null, "", "/main"); window.scrollTo({ top: 0, behavior: "smooth" }); });
})();

/* Footer language menu */
(function () {
  var menu = document.querySelector(".lang-menu"); if (!menu) return;
  var sel = document.getElementById("lang"), btn = menu.querySelector(".lang-btn"), cur = menu.querySelector(".lang-cur");
  var items = menu.querySelectorAll(".lang-list li");
  function sync() {
    items.forEach(function (li) { var on = li.getAttribute("data-lang") === sel.value; li.classList.toggle("on", on); li.setAttribute("aria-selected", on); if (on) cur.textContent = li.textContent; });
  }
  items.forEach(function (li) {
    li.addEventListener("click", function () {
      sel.value = li.getAttribute("data-lang");
      sel.dispatchEvent(new Event("change"));
      sync(); menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.blur();
    });
  });
  btn.addEventListener("click", function () { var o = menu.classList.toggle("open"); btn.setAttribute("aria-expanded", String(o)); });
  document.addEventListener("click", function (e) { if (!menu.contains(e.target)) { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  sync();
})();

/* Public site without the web app: app buttons open a "launching soon" dialog with a WhatsApp link */
(function () {
  if (!document.documentElement.hasAttribute("data-app-soon")) return;
  var dict = window.FYNIX_I18N || {};
  function t(k) { return ((dict[document.documentElement.lang] || dict.en || {})[k]) || (dict.en || {})[k] || k; }
  var wa = document.querySelector(".wa-float");
  var dlg = null;
  function open() {
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.className = "soon";
      dlg.innerHTML = '<div class="soon-card" role="dialog" aria-modal="true" aria-labelledby="soon-t">' +
        '<img src="assets/img/logo.png" alt="" width="44" height="44" /><h3 id="soon-t"></h3><p></p>' +
        '<div class="soon-actions"><a class="btn btn-accent soon-wa" target="_blank" rel="noopener"></a>' +
        '<button type="button" class="btn soon-close"></button></div></div>';
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest(".soon-close")) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }
    dlg.querySelector("h3").textContent = t("soon.title");
    dlg.querySelector("p").textContent = t("soon.body");
    var a = dlg.querySelector(".soon-wa"); a.textContent = t("soon.wa"); a.href = wa ? wa.href : "https://wa.me/6591237341";
    dlg.querySelector(".soon-close").textContent = t("soon.close");
    dlg.classList.add("open"); a.focus();
  }
  function close() { if (dlg) dlg.classList.remove("open"); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || (a.getAttribute("href") || "").indexOf("/task/app") !== 0) return;
    e.preventDefault(); e.stopPropagation(); open();
  }, true);
})();
