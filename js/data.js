/**
 * Fallback content store.
 *
 * The router (js/app.js) tries to fetch each route's content from
 * /data/<route>.json first, to demonstrate genuine dynamic loading.
 * If that fetch fails — most commonly because the project was opened
 * directly as a file:// path instead of through a local server, which
 * blocks fetch() for local files — it falls back to this in-memory
 * copy so the app still works out of the box.
 */
window.ORBIT_DATA = {
  home: {
    title: "Home",
    hero: {
      eyebrow: "Orbit · SPA Demo",
      heading: "One page. Many views. Zero reloads.",
      body: "Orbit is a small single page application that swaps content in and out of a single container using JavaScript, while keeping the address bar, browser history, and back/forward buttons fully working.",
      primaryCta: { label: "View projects", route: "/projects" },
      secondaryCta: { label: "See how it's built", route: "/skills" }
    }
  },
  projects: {
    title: "Projects",
    subtitle: "A few things built while learning the stack.",
    items: [
      {
        tag: "Full-Stack",
        name: "Job & Internship Portal",
        description: "React front end, Spring Boot REST API, MongoDB storage, and JWT-based role access for students and recruiters."
      },
      {
        tag: "SPA",
        name: "Orbit (this project)",
        description: "A dependency-free single page app demonstrating client-side routing, the History API, and dynamic content loading."
      },
      {
        tag: "Practice",
        name: "Daily DSA Log",
        description: "A running log of daily problem-solving practice, used to track patterns across arrays, strings, and graphs."
      },
      {
        tag: "Hackathon",
        name: "SIH Concept Sprint",
        description: "An idea currently in the problem-scoping stage, aimed at Smart India Hackathon this cycle."
      }
    ]
  },
  skills: {
    title: "Skills",
    subtitle: "Grouped by where they sit in the stack.",
    groups: [
      {
        name: "Languages",
        skills: [
          { label: "Java", level: 80 },
          { label: "JavaScript", level: 45 },
          { label: "HTML / CSS", level: 65 }
        ]
      },
      {
        name: "Frameworks & Tools",
        skills: [
          { label: "React", level: 30 },
          { label: "Spring Boot", level: 35 },
          { label: "MongoDB", level: 30 }
        ]
      },
      {
        name: "Practice",
        skills: [
          { label: "DSA (LeetCode)", level: 55 }
        ]
      }
    ]
  },
  contact: {
    title: "Contact",
    subtitle: "This is a demo form — it validates input and simulates a submission locally; nothing is sent over the network."
  }
};