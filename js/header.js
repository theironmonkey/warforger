const BASE = "/" + location.pathname.split("/")[1];

export async function loadHeader() {
  const el = document.getElementById("header");
  if (!el) return;

  // Repo base: "/WarForger"
  const base = "/" + location.pathname.split("/")[1];
  const url = `${base}/partials/header.html`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    el.innerHTML = await res.text();

    const path = location.pathname.split("/").pop() || "index.html";
    el.querySelectorAll(".nav-link").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      a.classList.toggle("active", href === path);
    });
  } catch (e) {
    console.error("Header load failed:", e);
    el.innerHTML = `<div class="alert alert-danger m-0">Failed to load header.</div>`;
  }
}