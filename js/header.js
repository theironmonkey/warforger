export async function loadHeader() {
  const slot = document.getElementById("header");
  if (!slot) return;

  // Resolve /partials/header.html relative to where header.js lives
  const url = new URL("../partials/header.html", import.meta.url);

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    slot.innerHTML = await res.text();

    const path = location.pathname.split("/").pop() || "index.html";
    slot.querySelectorAll(".nav-link").forEach(a => {
      a.classList.toggle(
        "active",
        a.getAttribute("href").split("/").pop() === path
      );
    });

  } catch (e) {
    console.error("Header load failed:", e);
    slot.innerHTML =
      `<div class="alert alert-danger m-0">Failed to load header.</div>`;
  }
}


