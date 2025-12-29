import { loadHeader } from "./ui.js";

let currentPage = 1;
const itemsPerPage = 10;

let allAbilities = [];
let allBattleTraits = [];
let allFighters = [];
let combinedAbilities = [];

const abilityFilters = {
  grandAlliance: [],
  warband: [],
  runemark: [],
  cost: []
};

const norm = v => String(v ?? "").trim().toLowerCase();
//const pretty = s => String(s || "").replace(/\b\w/g, m => m.toUpperCase());

let __uidCounter = 0;
const safeId = (s) =>
  `hidden-fighters-${
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
  }-${Math.random().toString(36).slice(2,7)}`;

// Load page
document.addEventListener("DOMContentLoaded", async () => {
  loadHeader();

  const searchInput  = document.getElementById("abilitiesSearchBar");
  const clearBtn     = document.getElementById("abilitiesClearFiltersBtn");
  const scrollTopBtn = document.getElementById("scrollToTopAbilitiesBtn");

  // Fetch abilities and battle traits
  try {
    const [abilities, battleTraits, fighters] = await Promise.all([
      fetch("https://krisling049.github.io/warcry_data/abilities.json").then(r => r.json()),
      fetch("https://krisling049.github.io/warcry_data/battletraits.json").then(r => r.json()),
      fetch("https://krisling049.github.io/warcry_data/fighters.json").then(r => r.json())
    ]);

    allAbilities      = Array.isArray(abilities) ? abilities : [];
    allBattleTraits   = Array.isArray(battleTraits) ? battleTraits : [];
    allFighters       = Array.isArray(fighters) ? fighters : [];
    combinedAbilities = [...allAbilities, ...allBattleTraits];

    populateFilters(combinedAbilities);
    updateFilterDisplay();
    searchBar();
  } catch (err) {
    console.error("Failed to fetch:", err);
  }

  // Search
  if (searchInput) {
    searchInput.addEventListener("input", () => searchBar());
  }

  // Clear
  document.getElementById("abilitiesClearFiltersBtn").addEventListener("click", () => {
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
function populateFilters(items) {
  const grandAllianceFilter = document.getElementById("grandAllianceFilter");
  const warbandFilter       = document.getElementById("warbandFilter");
  const runemarkFilter      = document.getElementById("runemarkFilter");
  const costFilter          = document.getElementById("costFilter");

  const grandAlliance = Array.from(
    new Set(allFighters.map(f => norm(f.grand_alliance ?? f.grandAlliance ?? f.GA))
    .filter(Boolean))).sort()

  const warbands = Array.from(
    new Set(items.map(a => norm(a.warband))
    .filter(Boolean))).sort()

  const runemarks = Array.from(
    new Set(items.flatMap(a => {
      const r = a.runemarks || a.runemark || [];
      return (Array.isArray(r) ? r : [r]).map(norm);})
    .filter(Boolean))).sort();

  const costs = Array.from(
    new Set(items.map(a => String(a.cost ?? a.Cost ?? "").trim())
    .filter(Boolean))).sort();

  populateDropdown(grandAllianceFilter, grandAlliance, "grandAlliance");
  populateDropdown(warbandFilter,       warbands, "warband");
  populateDropdown(runemarkFilter,      runemarks, "runemark");
  populateDropdown(costFilter,          costs, "cost");
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
      const val = String(item).toLowerCase();
      const arr = abilityFilters[filterKey] || [];

      if (e.target.checked) {
        abilityFilters[filterKey] = Array.from(new Set([...arr, val]));
      } else {
        abilityFilters[filterKey] = arr.filter(v => v !== val);
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

// Populate abilities
function populateAbilities(items) {
  const container = document.getElementById("abilitiesContainer");
  const resultsEl = document.getElementById("abilitiesResultsCount");
  const pagTop = document.getElementById("abilitiesPaginationTop");
  const pagBot = document.getElementById("abilitiesPaginationBottom");
  if (!container) return;

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = items.slice(start, start + itemsPerPage);

  if (resultsEl) {
    resultsEl.textContent = `${total} result${total !== 1 ? "s" : ""}`;
  }

  container.innerHTML = "";

  const byWarband = pageItems.reduce((acc, it) => {
    const wb = it.warband || "Unassigned";
    (acc[wb] ||= []).push(it);
    return acc;
  }, {});

  Object.keys(byWarband).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })).forEach(wb => {
    const section = document.createElement("div");
    section.className = "warband-section p-4 m-4 border rounded-3";
    
    const h3 = document.createElement("h3");
    h3.textContent = wb.toUpperCase();
    section.appendChild(h3);

    byWarband[wb].forEach(item => {
      const runesText = (() => {
        const r = item.runemarks || item.runemark || [];
        const arr = Array.isArray(r) ? r : [r];
        return arr.length ? arr.join(", ") : "none";
      })();

      const matchingFighters = allFighters.filter(fighter => {
        const abilityWarband = String(item.warband || '').toLowerCase();
        const matchesUniversalOrSpecificWarband =
          abilityWarband === 'universal' ||
          String(fighter.warband || '').toLowerCase() === abilityWarband ||
          String(fighter.subfaction || '').toLowerCase() === abilityWarband;

        const abilityRunemarks = (() => {
          const r = item.runemarks || item.runemark || [];
          return Array.isArray(r) ? r : [r];
        })();

        const matchesRunemark =
          abilityRunemarks.length === 0 ||
          abilityRunemarks.some(runemark => (fighter.runemarks || []).includes(runemark));

        return matchesUniversalOrSpecificWarband && matchesRunemark;
      });

      const fighterLinks = matchingFighters.map(
        fighter => `<a href="fighter-detail.html?_id=${encodeURIComponent(fighter._id)}" target="_blank">${fighter.name}</a>`
      );

      const isLongList = fighterLinks.length > 5;
      const visibleLinks = isLongList ? fighterLinks.slice(0, 5).join(', ') : fighterLinks.join(', ');
      const hiddenLinks = isLongList ? fighterLinks.slice(5).join(', ') : '';
      const uniqueId = `${safeId(item.name || item.title || item.warband || "ability")}-${__uidCounter++}`;
      const derivedDisplayGA = (() => {
        const warbandKey = norm(item.warband);
        if (!warbandKey || warbandKey === "universal") return item.grand_alliance ?? item.grandAlliance ?? "Universal";
        const gases = new Set(
          allFighters
            .filter(f => norm(f.warband) === warbandKey || norm(f.subfaction) === warbandKey)
            .map(f => f.grand_alliance)
            .filter(Boolean)
        );
        return gases.size ? Array.from(gases).join(", ") : (item.grand_alliance ?? item.grandAlliance ?? "N/A");
      })();

      const card = document.createElement("div");
      card.className = "card m-5 bg-dark opacity-75";

      card.innerHTML = `
        <div class="card-header">
          <h2>${item.name || item.title || "Name unavailable"}</h2>
        </div>
        <div class="card-body">
          <p><b>Grand Alliance:</b> ${derivedDisplayGA || "none"}</p>
          <p><b>Warband:</b> ${(item.warband || "none").toLowerCase()}</p>
          <p><b>Runemarks:</b> ${runesText || "none"}</p>
          <p><b>Cost:</b> ${item.cost || "none"}</p>
          ${item.description ? `<h3>Description</h3>${item.description || "Description unavailable"}` : ""}
          <h3>Fighters</h3>
          <p>${visibleLinks}${isLongList ? 
            `<span class=\"collapse\" id=\"${uniqueId}\" style=\"display:none\">, ${hiddenLinks}</span>
            <button type="button" class="btn btn-secondary" onclick="toggleHiddenLinks(event, '${uniqueId}')">+</button>` : ''}
          </p>
        </div>
      `;
      section.appendChild(card);
    });

    container.appendChild(section);
  });

  renderPagination(pagTop, totalPages);
  renderPagination(pagBot, totalPages);
}

// Filter
function filterAbilities(items, searchQuery) {
  const words = searchQuery.split(/\s+/).filter(Boolean);

  return items.filter(item => {
    const selected = abilityFilters;
    const warbandKey = norm(item.warband);
    const derivedGAs = (() => {
      if (!warbandKey || warbandKey === "universal") return [];
      const gases = new Set(
        allFighters
          .filter(f => norm(f.warband) === warbandKey || norm(f.subfaction) === warbandKey)
          .map(f => norm(f.grand_alliance))
          .filter(Boolean)
      );
      return Array.from(gases);
    })();

    const itemGA = norm(item.grand_alliance ?? item.grandAlliance ?? item["grand alliance"] ?? item.GA);
    const gaCandidates = itemGA ? [itemGA] : derivedGAs;

    const hasGA = selected.grandAlliance.length === 0 ||
      gaCandidates.length === 0 ||
      gaCandidates.some(ga => selected.grandAlliance.includes(ga));

    const hasWB = selected.warband.length === 0 ||
      selected.warband.includes(warbandKey);

    const runes = (() => {
      const r = item.runemarks || item.runemark || [];
      const arr = Array.isArray(r) ? r : [r];
      return arr.map(x => norm(x));
    })();

    const hasRM = selected.runemark.length === 0 ||
      selected.runemark.some(v => runes.includes(v));

    const costStr = norm(item.cost ?? item.Cost);
    const hasCost = selected.cost.length === 0 ||
      selected.cost.includes(costStr);

    if (!(hasGA && hasWB && hasRM && hasCost)) return false;
    if (words.length === 0) return true;

    const haystack = [
      item.name, item.title, item.description, item.warband, ...runes
    ].flat().map(v => String(v || "").toLowerCase());

    return words.every(w => haystack.some(field => field.includes(w)));
  });
}

// Filters - update
function updateFilterDisplay() {
  const display = document.getElementById("abilitiesFiltersDisplay");
  if (!display) return;

  const text = Object.entries(abilityFilters)
    .map(([k, vals]) => (vals && vals.length ? `${k.toUpperCase()}: ${vals.join(", ")}` : null))
    .filter(Boolean)
    .join("<br>");

  display.innerHTML = text || "none";
}

// Filters - clear
function clearFilters() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => (cb.checked = false));

  const searchInput = document.getElementById("abilitiesSearchBar");
  if (!searchInput) return;
  document.getElementById("abilitiesSearchBar").value = "";

  Object.keys(abilityFilters).forEach(k => { abilityFilters[k] = []; });
  currentPage = 1;

  updateFilterDisplay();
  populateAbilities(combinedAbilities);
}

// Search bar
function searchBar({ keepPage = false } = {}) {
  const searchInput = document.getElementById("abilitiesSearchBar");
  const query = (searchInput?.value || "").trim().toLowerCase();

  if (!keepPage) currentPage = 1;

  const results = filterAbilities(combinedAbilities, query);
  populateAbilities(results);
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

// UI helper - toggle links
function toggleHiddenLinks(event, targetId) {
  event.preventDefault();
  event.stopPropagation();
  const el = document.getElementById(targetId);
  if (!el) return;

  // Simple toggle
  const currentlyHidden = (el.style.display === 'none' || getComputedStyle(el).display === 'none');
  el.style.display = currentlyHidden ? 'inline' : 'none';

  // Update button text
  const btn = event.currentTarget || event.target;
  if (btn) btn.textContent = currentlyHidden ? '-' : '+';
}
// Ensure toggleHiddenLinks is available to inline handlers even in module scripts
if (typeof window !== 'undefined') { window.toggleHiddenLinks = toggleHiddenLinks; }