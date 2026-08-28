# Orbit — Technical Report
### Single Page Application: Dynamic Content Loading & Client-Side Routing

---

## 1. Project Objective

The goal was to build a small single page application (SPA) that:

- Loads and swaps content dynamically inside one HTML shell, with no full page reloads.
- Manages browser history and the URL bar via JavaScript, so back/forward buttons and direct links behave correctly.
- Presents a polished, transition-driven UI.

The chosen subject is **Orbit**, a lightweight personal dev-space with four routes: Home, Projects, Skills, and Contact.

---

## 2. Project Plan

The build was broken into five stages:

1. **Structure** — decide the routes, the shared shell (header/nav/footer), and where dynamic content mounts (a single `#view` container inside `<main>`).
2. **Static shell** — build `index.html` with the navigation and an empty content region.
3. **Styling** — a consistent visual system (color tokens, typography, spacing) applied uniformly across all four views, plus transition and loading states.
4. **Routing logic** — intercept navigation clicks, use `history.pushState`/`popstate` instead of real navigation, and map paths to render functions.
5. **Content loading** — treat each route's content as data, not hardcoded markup, and load it asynchronously (via `fetch`, with a fallback) rather than baking it directly into the HTML.

This mirrors, on a small scale, how real SPA frameworks (React Router, Vue Router) separate *routing* from *view rendering* from *data fetching*.

---

## 3. Architecture
Browser click on [data-link]
│
▼
event.preventDefault() ──► history.pushState(path)
│
▼
renderRoute(path)
│
├─ look up route in the route table
├─ show top progress bar
├─ getRouteData(key)
│ ├─ check in-memory cache
│ ├─ fetch('data/<key>.json')
│ └─ on failure, fall back to js/data.js
├─ route.render(data) → builds a DOM subtree
└─ swap it into #view with a fade/slide transition

**Key design decisions:**

- **Route table as data, not a chain of `if/else`.** Each route is an object `{ key, title, render }` in a single map. Adding a new route is one new entry, not new branching logic scattered through the file — this was a direct trade against readability/maintainability, which matters for anyone reviewing the code.
- **Content separated from markup.** Each view's text lives in a JSON file (`data/*.json`) and is fetched at runtime, rather than being written directly into the HTML/JS. This is what makes the loading "dynamic" in a meaningful sense — the render functions are generic templates that accept any data shaped correctly, not a wall of static text.
- **Graceful fallback over a hard dependency on a server.** `fetch()` of local files is blocked by browsers under the `file://` protocol (a CORS restriction). Rather than requiring the grader to run a local server, `getRouteData()` catches the fetch failure and falls back to an embedded copy of the same content in `js/data.js`. This was the single biggest practical issue encountered (see §4) and shaped the whole data-loading design.
- **A request token guards against race conditions.** If a user clicks two nav links quickly, an older, slower request could resolve after a newer one and overwrite the correct view. `requestToken` is incremented on every navigation; a response is only applied if its token still matches the latest one.
- **Escaping all interpolated content.** Since view data is injected into `innerHTML`, an `escapeHtml()` helper runs all dynamic text through `textContent` first to neutralize any HTML/script injection from the data source — relevant defensive practice even though the data here is trusted.

---

## 4. Implementation Challenges & Solutions

| Challenge | Approach taken |
|---|---|
| `fetch()` fails silently when the project is opened as a double-clicked HTML file (`file://`) rather than served over HTTP | Added a `.catch()` fallback to an embedded data object (`js/data.js`), so the app works either way. Documented the recommended local-server run methods in the README. |
| Keeping the nav's active-state indicator visually in sync with route changes, including on window resize | Calculated the active link's bounding box relative to the nav list and moved a positioned `.nav-indicator` element with a CSS transform, recalculated on both route change and `resize`. |
| Avoiding a jarring instant content swap | Added a short `is-leaving` class that fades/slides the outgoing view out over ~120ms before the new view is mounted and animates in, rather than swapping `innerHTML` instantly. |
| Handling unknown routes and failed loads without breaking the SPA shell | Two dedicated render paths — `renderNotFound()` for unmatched paths and `renderError()` for a data-loading failure — both stay inside the same shell instead of showing a browser error page. |
| Preventing a fast double-navigation from showing a stale response | Introduced the `requestToken` counter described in §3, checked before applying any fetched data. |
| Accessibility of a JS-driven route change (no real page load, so screen readers/keyboard users get no natural focus reset) | On every successful route render, focus is moved to `#main-content` (`tabindex="-1"`), and the view container uses `aria-live="polite"` so assistive tech announces new content. A skip-link is also included. |
| Client-side form validation without a backend | The contact form intercepts `submit`, runs manual validation (required fields, email pattern, minimum message length), displays inline field errors, and shows a local-only success message — demonstrating state management without needing a real API. |

---

## 5. Dynamic Content Management — Summary

Content for each route is fully decoupled from the page shell:

- **Source:** `data/<route>.json`, fetched by `key` per route.
- **Caching:** a `Map` keyed by route avoids re-fetching a route already visited in the session.
- **Rendering:** one pure function per route (`renderHome`, `renderProjects`, `renderSkills`, `renderContact`) turns a data object into a DOM node — no function reads global state beyond what it's passed.
- **Resilience:** any failure to load falls back to embedded data rather than breaking the view.

---

## 6. Navigation & URL State

- `history.pushState({}, "", path)` updates the address bar without a reload whenever an internal `[data-link]` is clicked.
- The `popstate` event (fired on browser back/forward) re-renders the route for `location.pathname`, so history navigation stays in sync with the visible view.
- `document.title` is updated per route so the browser tab and history entries are distinguishable.
- A breadcrumb (`/ projects`, `/ skills`, etc.) mirrors the current path in the footer for a visible confirmation of state.

**Known limitation:** because this is a purely client-side router with no backend, a hard refresh on a deep link (e.g. `/projects`) will 404 unless the static host is configured to always serve `index.html` (a standard SPA-hosting rewrite rule, used by Netlify/Vercel/etc.). This was a deliberate scope decision — implementing that rewrite requires host-level configuration outside a plain static ZIP, so it's called out here rather than silently left unhandled.

---

## 7. Testing Performed

- Verified all four routes render correctly on first load and via nav clicks.
- Verified browser Back/Forward buttons move through history correctly and re-render the matching view.
- Verified an invalid path (e.g. `/nothing`) renders the in-app 404 view rather than a browser error.
- Verified the app still functions when opened directly via `file://` (fallback data path) and when served via `npx serve` (real `fetch` path).
- Verified the contact form rejects empty fields, an invalid email, and a too-short message, and shows a success state on valid input.
- Verified layout responsiveness down to a mobile width (collapsible nav via the hamburger toggle).
- Checked `prefers-reduced-motion` is respected (animations shortened to near-zero).

---

## 8. Possible Extensions

- Add a server-side (or hosting-config) rewrite rule so deep-link refreshes work in production.
- Replace the hand-rolled router with a minimal published router library if the project grows past four routes.
- Add unit tests for `validateContactForm()` and the router's path-matching logic.