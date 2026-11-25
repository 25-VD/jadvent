# Advent Calendar

A small QR-code advent calendar for GitHub Pages. Every door has its own QR code.
Scanning it opens the door page; the door can be opened once, on or after its day.

## Put it online

1. Create a new **public** repository on GitHub and upload all files of this folder.
2. In the repository: **Settings → Pages → Source: "Deploy from a branch" → Branch: `main` / `(root)` → Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Fill a calendar

Each folder inside `calendars/` is one calendar (`calendar-1`, `calendar-2`, `demo`).
For another calendar, copy a folder and give it a new name (letters, numbers, `-` and `_` only).

Upload one file per door into the calendar folder and name it after the day:

| Door content | File name (example for door 5) |
| --- | --- |
| Photo | `05.jpg`, `05.png`, `05.gif`, `05.webp` |
| PDF | `05.pdf` |
| Video | `05.mp4` |
| Link | `05.txt` – a text file that contains only the address, e.g. `https://example.com` |

- Use only **one** file per door. Doors without a file stay empty.
- iPhone photos in HEIC format do not work in browsers – convert them to JPG first.
- `config.json` holds the title shown on the page and the year of the calendar.

## QR codes

Open `https://<your-username>.github.io/<repository-name>/qr.html`, enter the calendar
folder name and print the page. Only doors that contain a file get a QR code.

## Testing

- Add `&preview=1` to a door link to ignore the date and the one-time lock.
- Add `&reset=1` to make a door you already opened openable again on your device.
- The `demo` calendar is set to 2025, so all its doors are already unlocked.

## Good to know

The site has no server. The date check and the "open only once" rule run in the visitor's
browser and are remembered per device – fine for family and friends, but not tamper-proof.
Files in a public repository can be found by anyone who knows where to look.
