// Shared helpers for the door page and the QR code page.

const TYPES = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"],
  pdf: ["pdf"],
  video: ["mp4", "webm", "mov"],
  link: ["txt"],
};

function validCalendar(name) {
  return typeof name === "string" && /^[A-Za-z0-9_-]{1,60}$/.test(name);
}

function calendarPath(name) {
  return "calendars/" + name + "/";
}

async function loadConfig(name) {
  try {
    const res = await fetch(calendarPath(name) + "config.json", { cache: "no-store" });
    if (!res.ok) return null;
    const cfg = await res.json();
    return {
      title: typeof cfg.title === "string" ? cfg.title : "Advent Calendar",
      year: Number.isInteger(cfg.year) ? cfg.year : new Date().getFullYear(),
    };
  } catch (e) {
    return null;
  }
}

// Looks for a file named after the day (05.jpg, 05.pdf, 05.txt, ...).
// Returns { type, url } or null when the door is empty.
async function findAsset(name, day) {
  const names = [String(day).padStart(2, "0")];
  if (day < 10) names.push(String(day));
  const candidates = [];
  for (const type of Object.keys(TYPES)) {
    for (const ext of TYPES[type]) {
      for (const n of names) {
        candidates.push({ type, url: calendarPath(name) + n + "." + ext });
        candidates.push({ type, url: calendarPath(name) + n + "." + ext.toUpperCase() });
      }
    }
  }
  const found = await Promise.all(
    candidates.map((c) =>
      limited(async () => {
        try {
          const res = await fetch(c.url, { method: "HEAD", cache: "no-store" });
          return res.ok ? c : null;
        } catch (e) {
          return null;
        }
      })
    )
  );
  return found.find(Boolean) || null;
}

// Runs at most 8 requests at the same time so the host is not flooded.
let running = 0;
const waiting = [];
function limited(task) {
  return new Promise((resolve) => {
    const start = () => {
      running++;
      task().then((v) => {
        running--;
        resolve(v);
        if (waiting.length) waiting.shift()();
      });
    };
    if (running < 8) start();
    else waiting.push(start);
  });
}

// On GitHub Pages: reads the folder listing of a calendar in one request.
// Returns an array with index 1..24 holding { type, url } or null,
// or null when the listing is not available (then fall back to findAsset).
async function listAssets(name, owner, repo) {
  if (!owner || !repo) {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/i);
    const seg = location.pathname.split("/")[1];
    if (!m || !seg) return null;
    owner = m[1];
    repo = seg;
  }
  try {
    const res = await fetch(
      "https://api.github.com/repos/" + owner + "/" + repo + "/contents/calendars/" + name,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const files = await res.json();
    if (!Array.isArray(files)) return null;
    const doors = new Array(25).fill(null);
    for (const f of files) {
      const m = /^0?(\d{1,2})\.([A-Za-z0-9]+)$/.exec(f.name);
      if (!m) continue;
      const day = Number(m[1]);
      const ext = m[2].toLowerCase();
      const type = Object.keys(TYPES).find((t) => TYPES[t].includes(ext));
      if (!type || day < 1 || day > 24 || doors[day]) continue;
      doors[day] = { type, url: calendarPath(name) + f.name };
    }
    return doors;
  } catch (e) {
    return null;
  }
}
