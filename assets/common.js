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
    candidates.map(async (c) => {
      try {
        const res = await fetch(c.url, { method: "HEAD", cache: "no-store" });
        return res.ok ? c : null;
      } catch (e) {
        return null;
      }
    })
  );
  return found.find(Boolean) || null;
}
