export async function loadHeader() {
  
  const slot = document.getElementById("header");
  const url = "partials/header.html";
  if (!slot) return;
  
  try {
    const res = await fetch(url, { cache: "no-store" });
    slot.innerHTML = await res.text();

    const path = location.pathname.split("/").pop() || "index.html";
    slot.querySelectorAll(".nav-link").forEach(a => {
      a.classList.toggle("active", a.getAttribute("href").split("/").pop() === path);
    });

  } catch (e) {
    console.error("Header load failed:", e);
    slot.innerHTML = `<div class="alert alert-danger m-0">Failed to load header.</div>`;
  }
}  