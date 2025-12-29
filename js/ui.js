export function loadHeader() {

  const el = document.getElementById("header");
  if (!el) return;

  fetch("partials/header.html")
    .then((r) => r.text())
    .then((html) => {
      el.innerHTML = html;
      const path = location.pathname.split("/").pop() || "index.html";
      el.querySelectorAll(".nav-link").forEach((a) => {
        const same = (a.getAttribute("href") || "").split("/").pop() === path;
        a.classList.toggle("active", same);
      });
    })
    .catch(console.error);
}