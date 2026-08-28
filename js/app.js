/**
 * Orbit — a minimal single page application.
 *
 * Responsibilities of this file:
 *  1. Client-side router: intercepts link clicks and popstate events,
 *     updates the URL via the History API, and never triggers a full
 *     page reload.
 *  2. Content loader: fetches JSON content for the active route
 *     (falling back to the embedded copy in js/data.js on failure),
 *     shows a lightweight loading state, then renders it.
 *  3. View renderers: one function per route that turns route data
 *     into a DOM subtree.
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Route table
  // ---------------------------------------------------------------------
  const routes = {
    "/": { key: "home", title: "Orbit · Home", render: renderHome },
    "/projects": { key: "projects", title: "Orbit · Projects", render: renderProjects },
    "/skills": { key: "skills", title: "Orbit · Skills", render: renderSkills },
    "/contact": { key: "contact", title: "Orbit · Contact", render: renderContact }
  };

  const viewEl = document.getElementById("view");
  const progressEl = document.getElementById("route-progress");
  const navList = document.getElementById("nav-list");
  const navIndicator = document.getElementById("nav-indicator");
  const breadcrumbEl = document.getElementById("breadcrumb");
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.querySelector(".main-nav");
  const mainContent = document.getElementById("main-content");

  const contentCache = new Map();

  let requestToken = 0;

  // ---------------------------------------------------------------------
  // Navigation interception
  // ---------------------------------------------------------------------
  document.addEventListener("click", function (event) {
    const link = event.target.closest("[data-link]");
    if (!link) return;

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    const url = new URL(link.href);
    navigateTo(url.pathname);
  });

  window.addEventListener("popstate", function () {
    renderRoute(location.pathname, { fromHistory: true });
  });

  navToggle.addEventListener("click", function () {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  function navigateTo(path) {
    if (path === location.pathname) return;
    history.pushState({}, "", path);
    renderRoute(path);
    mainNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  // ---------------------------------------------------------------------
  // Route rendering pipeline
  // ---------------------------------------------------------------------
  function renderRoute(path) {
    const route = routes[path];
    const token = ++requestToken;

    setActiveNavLink(path);
    updateBreadcrumb(path);

    if (!route) {
      swapView(renderNotFound(path));
      document.title = "Orbit · Not found";
      return;
    }

    document.title = route.title;
    showProgress();

    getRouteData(route.key)
      .then(function (data) {
        if (token !== requestToken) return;
        const node = route.render(data);
        swapView(node);
        mainContent.focus({ preventScroll: true });
      })
      .catch(function (err) {
        if (token !== requestToken) return;
        swapView(renderError(err));
      })
      .finally(function () {
        if (token === requestToken) hideProgress();
      });
  }

  function getRouteData(key) {
    if (contentCache.has(key)) {
      return Promise.resolve(contentCache.get(key));
    }

    return fetch("data/" + key + ".json")
      .then(function (res) {
        if (!res.ok) throw new Error("Bad response: " + res.status);
        return res.json();
      })
      .catch(function () {
        const fallback = window.ORBIT_DATA && window.ORBIT_DATA[key];
        if (!fallback) throw new Error("No content available for '" + key + "'");
        return fallback;
      })
      .then(function (data) {
        contentCache.set(key, data);
        return data;
      });
  }

  function swapView(newNode) {
    viewEl.classList.add("is-leaving");
    window.setTimeout(function () {
      viewEl.innerHTML = "";
      viewEl.classList.remove("is-leaving");
      viewEl.appendChild(newNode);
    }, 120);
  }

  function showProgress() {
    progressEl.classList.remove("is-done");
    void progressEl.offsetWidth;
    progressEl.classList.add("is-active");
  }

  function hideProgress() {
    progressEl.classList.remove("is-active");
    progressEl.classList.add("is-done");
  }

  // ---------------------------------------------------------------------
  // Nav state
  // ---------------------------------------------------------------------
  function setActiveNavLink(path) {
    const links = navList.querySelectorAll("a");
    let activeLink = null;

    links.forEach(function (link) {
      const linkPath = new URL(link.href).pathname;
      const isActive = linkPath === path;
      link.classList.toggle("active", isActive);
      if (isActive) activeLink = link;
    });

    if (activeLink) moveIndicatorTo(activeLink);
  }

  function moveIndicatorTo(link) {
    const navRect = navList.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    navIndicator.style.width = linkRect.width + "px";
    navIndicator.style.transform = "translateX(" + (linkRect.left - navRect.left) + "px)";
  }

  function updateBreadcrumb(path) {
    const label = path === "/" ? "home" : path.replace("/", "");
    breadcrumbEl.textContent = "/ " + label;
  }

  window.addEventListener("resize", function () {
    const active = navList.querySelector("a.active");
    if (active) moveIndicatorTo(active);
  });

  // ---------------------------------------------------------------------
  // View renderers
  // ---------------------------------------------------------------------
  function renderHome(data) {
    const el = document.createElement("section");
    el.className = "hero";
    el.innerHTML =
      '<span class="eyebrow">' + escapeHtml(data.hero.eyebrow) + "</span>" +
      "<h1>" + escapeHtml(data.hero.heading) + "</h1>" +
      "<p>" + escapeHtml(data.hero.body) + "</p>" +
      '<div class="btn-row">' +
        '<a class="btn btn-primary" data-link href="' + data.hero.primaryCta.route + '">' + escapeHtml(data.hero.primaryCta.label) + "</a>" +
        '<a class="btn btn-ghost" data-link href="' + data.hero.secondaryCta.route + '">' + escapeHtml(data.hero.secondaryCta.label) + "</a>" +
      "</div>";
    return el;
  }

  function renderProjects(data) {
    const el = document.createElement("section");
    const header = document.createElement("div");
    header.innerHTML =
      "<h2 class=\"section-title\">" + escapeHtml(data.title) + "</h2>" +
      "<p class=\"section-subtitle\">" + escapeHtml(data.subtitle) + "</p>";
    el.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "card-grid";
    data.items.forEach(function (item) {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML =
        '<span class="card-tag">' + escapeHtml(item.tag) + "</span>" +
        "<h3>" + escapeHtml(item.name) + "</h3>" +
        "<p>" + escapeHtml(item.description) + "</p>";
      grid.appendChild(card);
    });
    el.appendChild(grid);
    return el;
  }

  function renderSkills(data) {
    const el = document.createElement("section");
    const header = document.createElement("div");
    header.innerHTML =
      "<h2 class=\"section-title\">" + escapeHtml(data.title) + "</h2>" +
      "<p class=\"section-subtitle\">" + escapeHtml(data.subtitle) + "</p>";
    el.appendChild(header);

    const wrap = document.createElement("div");
    wrap.className = "skill-groups";

    data.groups.forEach(function (group) {
      const groupEl = document.createElement("div");
      groupEl.className = "skill-group";
      const heading = document.createElement("h3");
      heading.textContent = group.name;
      groupEl.appendChild(heading);

      group.skills.forEach(function (skill) {
        const row = document.createElement("div");
        row.className = "skill-bar-row";
        row.innerHTML =
          '<span class="label">' + escapeHtml(skill.label) + "</span>" +
          '<span class="skill-bar-track"><span class="skill-bar-fill"></span></span>';
        groupEl.appendChild(row);

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            row.querySelector(".skill-bar-fill").style.width = skill.level + "%";
          });
        });
      });

      wrap.appendChild(groupEl);
    });

    el.appendChild(wrap);
    return el;
  }

  function renderContact(data) {
    const el = document.createElement("section");
    el.innerHTML =
      "<h2 class=\"section-title\">" + escapeHtml(data.title) + "</h2>" +
      "<p class=\"section-subtitle\">" + escapeHtml(data.subtitle) + "</p>";

    const form = document.createElement("form");
    form.className = "contact-form";
    form.noValidate = true;
    form.innerHTML =
      '<div class="field">' +
        '<label for="f-name">Name</label>' +
        '<input id="f-name" name="name" type="text" autocomplete="name" />' +
        '<span class="field-error" id="err-name"></span>' +
      "</div>" +
      '<div class="field">' +
        '<label for="f-email">Email</label>' +
        '<input id="f-email" name="email" type="email" autocomplete="email" />' +
        '<span class="field-error" id="err-email"></span>' +
      "</div>" +
      '<div class="field">' +
        '<label for="f-message">Message</label>' +
        '<textarea id="f-message" name="message" rows="4"></textarea>' +
        '<span class="field-error" id="err-message"></span>' +
      "</div>" +
      '<button type="submit" class="btn btn-primary">Send message</button>' +
      '<div class="form-status success" id="form-status">Message captured locally — this demo does not send data anywhere.</div>';

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const values = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
      };
      const errors = validateContactForm(values);

      ["name", "email", "message"].forEach(function (field) {
        form.querySelector("#err-" + field).textContent = errors[field] || "";
      });

      const statusEl = form.querySelector("#form-status");
      const hasErrors = Object.keys(errors).length > 0;
      statusEl.classList.toggle("is-visible", !hasErrors);
      if (!hasErrors) form.reset();
    });

    el.appendChild(form);
    return el;
  }

  function renderNotFound(path) {
    const el = document.createElement("section");
    el.className = "not-found";
    el.innerHTML =
      '<div class="code">404</div>' +
      "<h2>No route matches " + escapeHtml(path) + "</h2>" +
      '<p>The link may be out of date. <a data-link href="/" class="btn btn-ghost" style="margin-top:12px;">Back to home</a></p>';
    return el;
  }

  function renderError(err) {
    const el = document.createElement("section");
    el.className = "not-found";
    el.innerHTML =
      '<div class="code">!</div>' +
      "<h2>This section couldn't load</h2>" +
      "<p>" + escapeHtml(err && err.message ? err.message : "Unknown error") + "</p>";
    return el;
  }

  // ---------------------------------------------------------------------
  // Validation & utility helpers
  // ---------------------------------------------------------------------
  function validateContactForm(values) {
    const errors = {};
    if (!values.name) errors.name = "Enter your name.";
    if (!values.email) {
      errors.email = "Enter an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "That email address doesn't look right.";
    }
    if (!values.message) {
      errors.message = "Enter a message.";
    } else if (values.message.length < 10) {
      errors.message = "Message should be at least 10 characters.";
    }
    return errors;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    renderRoute(location.pathname);
  });
})();