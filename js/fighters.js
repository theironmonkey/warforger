import { loadHeader } from "js/ui.js";

let currentPage = 1;
const itemsPerPage = 10;

let allFighters = [];

const fighterFilters = {
  grandAlliance: [],
  warband: [],
  runemark: [],
  points: [],
  movement: [],
  toughness: [],
  wounds: []
};

const norm = s => (typeof s === "string" ? s.trim().toLowerCase() : "");

// Load page
document.addEventListener("DOMContentLoaded", () => {
  loadHeader();

  const searchInput   = document.getElementById("fighterSearchBar");
  const clearBtn      = document.getElementById("fightersClearFiltersBtn");
  const scrollTopBtn  = document.getElementById("scrollToTopFightersBtn");

  // Fetch fighters
  fetch("https://krisling049.github.io/warcry_data/fighters.json")
    .then(r => r.json())
    .then(data => {
      allFighters = Array.isArray(data) ? data : [];
      populateFilters(allFighters);
      updateFilterDisplay();
      searchBar();
    })
    .catch(err => console.error("Failed to fetch:", err));

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", () => searchBar());
  }

  // Clear
  document.getElementById("fightersClearFiltersBtn").addEventListener("click", () => {
    clearFilters();
  });

  // Scroll to top
  window.addEventListener("scroll", () => {
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("d-none", window.scrollY <= 200);
    }
  });
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
});

// Populate filters
function populateFilters(fighters) {
  const grandAllianceFilter = document.getElementById("fightersGrandAllianceFilter");
  const warbandFilter       = document.getElementById("fightersWarbandFilter");
  const runemarkFilter      = document.getElementById("fightersRunemarkFilter");
  const pointsFilter        = document.getElementById("fightersPointsFilter");
  const movementFilter      = document.getElementById("fightersMovementFilter");
  const toughnessFilter     = document.getElementById("fightersToughnessFilter");
  const woundsFilter        = document.getElementById("fightersWoundsFilter");

  const grandAlliances = Array.from(
    new Set(fighters.map(f => norm(f.grand_alliance || "Unknown"))))
    .filter(v => v && v !== "unknown").sort();

  const warbands = Array.from(
    new Set(fighters.map(f => norm(f.warband || "Unknown")))
  ).filter(v => v && v !== "unknown").sort();

  const runemarks = Array.from(
    new Set(fighters.flatMap(f => (f.runemarks || []).map(norm)))
  ).filter(v => v && v !== "unknown").sort();

  const points = Array.from(new Set(
    fighters.map(f => Number(f.points)).filter(n => !Number.isNaN(n))
  )).sort((a, b) => a - b);

  const movements = Array.from(new Set(
    fighters.map(f => Number(f.movement)).filter(n => !Number.isNaN(n))
  )).sort((a, b) => a - b);

  const toughnesses = Array.from(new Set(
    fighters.map(f => Number(f.toughness)).filter(n => !Number.isNaN(n))
  )).sort((a, b) => a - b);

  const wounds = Array.from(new Set(
    fighters.map(f => Number(f.wounds)).filter(n => !Number.isNaN(n))
  )).sort((a, b) => a - b);

  populateDropdown(grandAllianceFilter, grandAlliances, "grandAlliance");
  populateDropdown(warbandFilter,       warbands,       "warband");
  populateDropdown(runemarkFilter,      runemarks,      "runemark");
  populateDropdown(pointsFilter,        points,         "points");
  populateDropdown(movementFilter,      movements,      "movement");
  populateDropdown(toughnessFilter,     toughnesses,    "toughness");
  populateDropdown(woundsFilter,        wounds,         "wounds");
}

// Populate dropdown filters
function populateDropdown(filterElement, dataSet, filterKey) {
  if (!filterElement) return;

  filterElement.innerHTML = "";
  dataSet.forEach(item => {
    const wrapper = document.createElement("div");
    wrapper.className = "dropdown-item form-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = String(item);
    checkbox.className = "form-check-input me-2";
    checkbox.id = `filter-${filterKey}-${String(item).replace(/\s+/g, "-")}`;

    const label = document.createElement("label");
    label.className = "form-check-label";
    label.setAttribute("for", checkbox.id);
    label.textContent = String(item);

    checkbox.addEventListener("change", (e) => {
      const value = String(item).toLowerCase();
      const arr = fighterFilters[filterKey] || [];

      if (e.target.checked) {
        fighterFilters[filterKey] = Array.from(new Set([...arr, value]));
      } else {
        fighterFilters[filterKey] = arr.filter(v => v !== value);
      }
    
      currentPage = 1;
      searchBar();
      updateFilterDisplay();
    });

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    filterElement.appendChild(wrapper);
  });
}

// Populate fighters
function populateFighters(fighters) {
  const container = document.getElementById("fightersContainer");
  const resultsEl = document.getElementById("fightersResultsCount");
  const pagTop = document.getElementById("fightersPaginationTop");
  const pagBot = document.getElementById("fightersPaginationBottom");
  if (!container) return;

  // Group by warband, sort warbands, then flatten
  const grouped = fighters.reduce((acc, f) => {
    const wb = f.warband || "Unassigned";
    (acc[wb] ||= []).push(f);
    return acc;
  }, {});
  const warbands = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const flat = warbands.flatMap(wb => grouped[wb].map(f => ({ warband: wb, fighter: f })));
  const total = flat.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = flat.slice(start, start + itemsPerPage);

  if (resultsEl) {
    resultsEl.textContent = `${total} result${total !== 1 ? "s" : ""}`;
  }

  container.innerHTML = "";

  pageItems.forEach(({ warband, fighter }) => {
    let wbSection = container.querySelector(`.warband-section[data-warband="${warband}"]`);
    if (!wbSection) {
      wbSection = document.createElement("div");
      wbSection.className = "warband-section p-4 m-4 border rounded-3";
      wbSection.dataset.warband = warband;

      const h3 = document.createElement("h3");
      h3.textContent = warband.toUpperCase();
      wbSection.appendChild(h3);

      container.appendChild(wbSection);
    }

    const weaponsHtml = Array.isArray(fighter.weapons) && fighter.weapons.length
      ? fighter.weapons.map(w => `
          <div class="weapon-card">
            <tr>
              <td>${w.runemark}</td>
              <td>${w.min_range}-${w.max_range}</td>
              <td>${w.attacks}</td>
              <td>${w.strength}</td>
              <td>${w.dmg_hit}/${w.dmg_crit}</td>
            <tr>
          </div>
        `).join("")
      : "<p>No weapons available</p>";

    const card = document.createElement("div");
    card.className = "card m-5 bg-dark opacity-75";

    card.innerHTML = `
      <div class="card-header">
        <h2>${fighter.name || "Name unavailable"}</h2>
      </div>
      <div class="card-body">
        <p><b>Grand Alliance:</b> ${fighter.grand_alliance || "none"}</p>
        <p><b>Warband:</b> ${(fighter.warband || "none").toLowerCase()}</p>
        <p><b>Subfaction:</b> ${(fighter.subfaction || 'none').toLowerCase()}</p>
        <p><b>Runemarks:</b> ${Array.isArray(fighter.runemarks) ? fighter.runemarks.join(", ") : "none"}</p>

        <table class="table table-sm table-hover">
          <thead>
            <tr>
              <th>Points</th>
              <th>Movement</th>
              <th>Toughness</th>
              <th>Wounds</th>
            </tr>
          </thead>
            <tbody>
              <tr>
                <td>${fighter.points ?? 'N/A'}</td>
                <td>${fighter.movement ?? 'N/A'}</td>
                <td>${fighter.toughness ?? 'N/A'}</td>
                <td>${fighter.wounds ?? 'N/A'}</td>
              </tr>
            </tbody>
        </table>

        <div class="weapons-section">
          <h3>Weapons</h3>
          <table class="table table-sm table-hover">
            <thead>
              <tr>
                <th>Runemark</th>
                <th>Range</th>
                <th>Attack</th>
                <th>Strength</th>
                <th>Damage (Hit/Crit)</th>
              </tr>
            </thead>
            <tbody>${weaponsHtml}</tbody>
          </table>
        </div>

        <button class="btn btn-secondary mt-3"
        onclick="window.open(
        'fighter-detail.html?_id=${encodeURIComponent(fighter._id)}',
        '_blank')">
          View More Details
        </button>

      </div>
    `;
    wbSection.appendChild(card);
  });

  renderPagination(pagTop, totalPages);
  renderPagination(pagBot, totalPages);
}

// Filter
function filterFighters(fighters, searchQuery) {
  const words = searchQuery.split(/\s+/).filter(Boolean);

  return fighters.filter(fighter => {
    const ok = Object.entries(fighterFilters).every(([key, values]) => {
      const selected = (values || []).map(v => String(v).toLowerCase());
      if (selected.length === 0) return true;

      if (key === "grandAlliance") {
        return selected.includes(String(fighter.grand_alliance || "").toLowerCase());
      }
      if (key === "warband") {
        return selected.includes(String(fighter.warband || "").toLowerCase());
      }
      if (key === "runemark") {
        const r = (fighter.runemarks || []).map(x => String(x).toLowerCase());
        return selected.some(v => r.includes(v));
      }
      if (["points","movement","toughness","wounds"].includes(key)) {
        const n = Number(fighter[key]);
        return selected.some(v => !Number.isNaN(Number(v)) && n === Number(v));
      }
      return true;
    });
    if (!ok) return false;

    if (words.length === 0) return true;
    const haystack = [
      fighter.name,
      fighter.description,
      fighter.warband,
      ...(fighter.runemarks || [])
    ].map(v => String(v || "").toLowerCase());

    return words.every(w => haystack.some(field => field.includes(w)));
  });
}

// Filters - update
function updateFilterDisplay() {
  const display = document.getElementById("fightersFiltersDisplay");
  if (!display) return;

  const text = Object.entries(fighterFilters)
    .map(([k, vals]) => (vals && vals.length ? `${k.toUpperCase()}: ${vals.join(", ")}` : null))
    .filter(Boolean)
    .join("<br>");

  display.innerHTML = text || "none";
}

// Filters - clear
function clearFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));

  const searchInput = document.getElementById("fighterSearchBar");
  if (!searchInput) return;
  document.getElementById("fighterSearchBar").value = "";

  Object.keys(fighterFilters).forEach(k => { fighterFilters[k] = []; });
  currentPage = 1;

  updateFilterDisplay();
  populateFighters(allFighters);
}

// Search bar
function searchBar({ keepPage = false } = {}) {
  const searchInput = document.getElementById("fighterSearchBar");
  const query = (searchInput?.value || "").trim().toLowerCase();

  if (!keepPage) currentPage = 1;

  const results = filterFighters(allFighters, query);
  populateFighters(results);
}

// Pagination
function renderPagination(container, totalPages) {
  if (!container) return;
  container.innerHTML = "";
  
  if (totalPages <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination justify-content-center";

  const makeItem = (label, disabled, onClick, active = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;
    if (!disabled) a.addEventListener("click", e => { e.preventDefault(); onClick(); });
    li.appendChild(a);
    return li;
  };

  // Previous
  ul.appendChild(makeItem("Previous", currentPage === 1, () => {
    currentPage--;
    searchBar({ keepPage: true });
  }));

  // Page numbers
  const maxButtons = 5;
  const start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  const end = Math.min(totalPages, start + maxButtons - 1);

  if (start > 1) {
    ul.appendChild(makeItem("1", false, () => { currentPage = 1; searchBar({ keepPage: true }); }));
    if (start > 2) {
      const ell = document.createElement("li");
      ell.className = "page-item disabled";
      ell.innerHTML = `<span class="page-link">…</span>`;
      ul.appendChild(ell);
    }
  }

  for (let i = start; i <= end; i++) {
    ul.appendChild(makeItem(String(i), false, () => {
      currentPage = i;
      searchBar({ keepPage: true });
    }, i === currentPage));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const ell = document.createElement("li");
      ell.className = "page-item disabled";
      ell.innerHTML = `<span class="page-link">…</span>`;
      ul.appendChild(ell);
    }
    ul.appendChild(makeItem(String(totalPages), false, () => {
      currentPage = totalPages;
      searchBar({ keepPage: true });
    }));
  }

  // Next
  ul.appendChild(makeItem("Next", currentPage === totalPages, () => {
    currentPage++;
    searchBar({ keepPage: true });
  }));

  container.appendChild(ul);
}