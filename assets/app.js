(function () {
  const params = new URLSearchParams(location.search);
  const cal = params.get("c");
  const day = Number(params.get("d"));
  const preview = params.has("preview");

  const $ = (id) => document.getElementById(id);
  const eyebrow = $("eyebrow");
  const title = $("title");
  const message = $("message");
  const frame = $("door-frame");
  const door = $("door");
  const hint = $("door-hint");
  const reveal = $("reveal");

  const MONTHS = "December";

  function show(opts) {
    if (opts.eyebrow !== undefined) eyebrow.textContent = opts.eyebrow;
    if (opts.title !== undefined) title.textContent = opts.title;
    message.textContent = opts.message || "";
    message.hidden = !opts.message;
  }

  function storageKey(year) {
    return "advent:" + cal + ":" + year + ":" + day;
  }
  function wasOpened(year) {
    try { return localStorage.getItem(storageKey(year)) !== null; } catch (e) { return false; }
  }
  function markOpened(year) {
    if (preview) return;
    try { localStorage.setItem(storageKey(year), new Date().toISOString()); } catch (e) {}
  }

  function lockDoor(text) {
    frame.hidden = false;
    frame.className = "door-frame is-locked";
    door.disabled = true;
    hint.textContent = text;
  }

  function button(label, href, opts) {
    const a = document.createElement("a");
    a.className = "btn" + (opts && opts.ghost ? " ghost" : "");
    a.textContent = label;
    a.href = href;
    if (opts && opts.download) a.setAttribute("download", "");
    else { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  async function buildReveal(asset, year) {
    reveal.innerHTML = "";
    const actions = document.createElement("div");
    actions.className = "actions";

    if (asset.type === "image") {
      const img = new Image();
      img.alt = "Your surprise for December " + day;
      img.addEventListener("load", () => markOpened(year));
      img.src = asset.url;
      reveal.append(img);
    } else if (asset.type === "video") {
      const v = document.createElement("video");
      v.controls = true;
      v.playsInline = true;
      v.addEventListener("loadeddata", () => markOpened(year));
      v.src = asset.url;
      reveal.append(v);
    } else {
      let href = asset.url;
      let label = "Open PDF";
      let icon = "📜";
      let text = "A document is waiting for you.";
      if (asset.type === "link") {
        const raw = (await (await fetch(asset.url, { cache: "no-store" })).text()).trim().split(/\s+/)[0] || "";
        if (!/^https?:\/\//i.test(raw)) throw new Error("bad link");
        href = raw;
        label = "Open your surprise";
        icon = "🎁";
        text = "Today's surprise is waiting behind this link.";
      }
      const card = document.createElement("div");
      card.className = "file-card";
      card.innerHTML = '<div class="big" aria-hidden="true"></div><p></p>';
      card.firstChild.textContent = icon;
      card.lastChild.textContent = text;
      reveal.append(card);
      actions.append(button(label, href));
      markOpened(year);
    }

    if (actions.children.length) reveal.append(actions);
  }

  async function init() {
    // Landing page (no QR code parameters)
    if (!cal && !params.has("d")) {
      show({
        eyebrow: "Advent Calendar",
        title: "Scan a door to begin",
        message: "Each door has its own QR code. Scan it with your phone on the right day to see what is hiding behind it.",
      });
      return;
    }

    if (!validCalendar(cal) || !Number.isInteger(day) || day < 1 || day > 24) {
      show({ eyebrow: "Advent Calendar", title: "This door does not exist", message: "Please check the QR code and try again." });
      return;
    }

    const cfg = await loadConfig(cal);
    if (!cfg) {
      show({ eyebrow: "Advent Calendar", title: "Calendar not found", message: "Please check the QR code and try again." });
      return;
    }

    document.title = cfg.title + " – Door " + day;
    $("door-number").textContent = day;
    door.setAttribute("aria-label", "Open door " + day);

    if (params.has("reset")) {
      try { localStorage.removeItem(storageKey(cfg.year)); } catch (e) {}
    }
    $("preview-banner").hidden = !preview;

    const base = { eyebrow: cfg.title, title: MONTHS + " " + day };

    // Too early?
    const unlock = new Date(cfg.year, 11, day);
    const now = new Date();
    if (!preview && now < unlock) {
      const days = Math.ceil((unlock - now) / 86400000);
      show(Object.assign(base, {
        message: "Not yet! This door opens on " + MONTHS + " " + day + ", " + cfg.year +
          " — " + (days === 1 ? "only 1 more sleep." : days + " more sleeps."),
      }));
      lockDoor("Patience");
      return;
    }

    // Already opened on this device?
    if (!preview && wasOpened(cfg.year)) {
      show(Object.assign(base, { message: "This door has already been opened. Each door opens only once." }));
      lockDoor("Opened");
      return;
    }

    const asset = await findAsset(cal, day);
    if (!asset) {
      show(Object.assign(base, { message: "There is nothing behind this door." }));
      lockDoor("Empty");
      return;
    }

    show(Object.assign(base, { message: "Tap the door to open it." }));
    frame.hidden = false;
    frame.className = "door-frame is-ready";
    door.addEventListener("click", async function once() {
      door.removeEventListener("click", once);
      door.disabled = true;
      frame.className = "door-frame is-open";
      try {
        await buildReveal(asset, cfg.year);
      } catch (e) {
        show(Object.assign(base, { message: "Something went wrong loading this door. Please try again later." }));
        frame.className = "door-frame is-locked";
        return;
      }
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => {
        frame.hidden = true;
        message.hidden = true;
        reveal.hidden = false;
      }, reduced ? 0 : 1000);
    });
  }

  // ---------- Gentle snowfall ----------
  function snow() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = $("snow");
    const ctx = c.getContext("2d");
    let w, h, flakes;
    function resize() {
      w = c.width = innerWidth;
      h = c.height = innerHeight;
      flakes = Array.from({ length: Math.min(70, Math.round(w / 9)) }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2 + 0.6, s: Math.random() * 0.5 + 0.2, p: Math.random() * 6.28,
      }));
    }
    resize();
    addEventListener("resize", resize);
    (function tick(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(248,239,224,0.55)";
      for (const f of flakes) {
        f.y += f.s;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(f.x + Math.sin(t / 1800 + f.p) * 8, f.y, f.r, 0, 6.28);
        ctx.fill();
      }
      requestAnimationFrame(tick);
    })(0);
  }

  snow();
  init();
})();
