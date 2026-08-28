# Orbit — SPA Demo

A dependency-free single page application demonstrating client-side
routing, History API navigation, and dynamic content loading.

## Run it

Because the app fetches JSON content files (`data/*.json`), it should
be served over a local HTTP server rather than opened directly as a
`file://` path (browsers block `fetch()` of local files under
`file://`). If opened directly anyway, the app still works — it falls
back to the content embedded in `js/data.js`.

Any of these work:

```bash
# Option 1: Node's serve package
npx serve .

# Option 2: Python
python3 -m http.server 5500

# Option 3: VS Code "Live Server" extension
# Right-click index.html -> "Open with Live Server"
```

Then open the printed local URL (e.g. `http://localhost:5500`) in a
browser.

## Project structure
spa-project/
├── index.html # Single HTML shell — all routes render inside #view
├── css/
│ └── style.css # Design system, layout, transitions, responsiveness
├── js/
│ ├── data.js # Embedded fallback content (used if fetch fails)
│ └── app.js # Router, content loader, view renderers
└── data/
├── home.json
├── projects.json
├── skills.json
└── contact.json

## Routes

| Path         | View                          |
|--------------|-------------------------------|
| `/`          | Home / hero                   |
| `/projects`  | Project cards                 |
| `/skills`    | Skill bars grouped by category |
| `/contact`   | Validated contact form         |

Any other path renders a 404 view without leaving the SPA.
