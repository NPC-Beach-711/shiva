// members.js
document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("membersTableBody");
  const searchInput = document.getElementById("memberSearch");
  const categorySelect = document.getElementById("categoryFilter");

  let allMembers = [];

  // --- Helpers to sort by last name ---
  const SUFFIXES = ["jr.", "jr", "sr.", "sr", "ii", "iii", "iv"];

  function getLastNameKey(fullName) {
    if (!fullName) return "";

    const parts = fullName
      .trim()
      .replace(/\s+/g, " ")
      .split(" ");

    if (parts.length === 0) return "";

    let last = parts[parts.length - 1].replace(/[,.-]/g, "").toLowerCase();

    // If last token is a suffix, use the previous one
    if (SUFFIXES.includes(last) && parts.length > 1) {
      last = parts[parts.length - 2].replace(/[,.-]/g, "").toLowerCase();
    }

    return last;
  }

  function sortByLastName(a, b) {
    const lastA = getLastNameKey(a.name);
    const lastB = getLastNameKey(b.name);

    if (lastA < lastB) return -1;
    if (lastA > lastB) return 1;

    // Tie-breaker: full name
    const fullA = (a.name || "").toLowerCase();
    const fullB = (b.name || "").toLowerCase();
    if (fullA < fullB) return -1;
    if (fullA > fullB) return 1;
    return 0;
  }

  // --- Fetch and init ---
  fetch("members.json")
    .then((res) => res.json())
    .then((data) => {
      // sort once by last name
      allMembers = data.slice().sort(sortByLastName);
      populateCategoryFilter(allMembers);
      renderTable(allMembers);
    })
    .catch((err) => {
      console.error("Error loading members.json:", err);
      tableBody.innerHTML =
        '<div class="members-table-row"><div>Unable to load members.</div></div>';
    });

  // --- Populate category filter ---
  function populateCategoryFilter(members) {
    const categories = Array.from(
      new Set(members.map((m) => m.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    // keep the "All categories" option that’s already in the HTML
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  // --- Render table rows ---
  function renderTable(members) {
    tableBody.innerHTML = "";

    if (!members.length) {
      const row = document.createElement("div");
      row.className = "members-table-row";
      row.innerHTML =
        '<div>No members found.</div><div></div><div></div>';
      tableBody.appendChild(row);
      return;
    }

    members.forEach((member) => {
      const row = document.createElement("div");
      row.className = "members-table-row";

      const nameCell = document.createElement("div");
      nameCell.innerHTML = `
        <div class="member-name">${member.name || ""}</div>
        ${
          member.title
            ? `<div class="member-title">${member.title}</div>`
            : ""
        }
      `;

      const orgCell = document.createElement("div");
      orgCell.textContent = member.organization || "";

      const catCell = document.createElement("div");
      catCell.textContent = member.category || "";

      row.appendChild(nameCell);
      row.appendChild(orgCell);
      row.appendChild(catCell);
      tableBody.appendChild(row);
    });
  }

  // --- Filtering (search + category) ---
  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;

    let filtered = allMembers;

    if (category) {
      filtered = filtered.filter((m) => m.category === category);
    }

    if (query) {
      filtered = filtered.filter((m) => {
        const name = (m.name || "").toLowerCase();
        const org = (m.organization || "").toLowerCase();
        const title = (m.title || "").toLowerCase();
        return (
          name.includes(query) ||
          org.includes(query) ||
          title.includes(query)
        );
      });
    }

    // allMembers is already sorted by last name, so filtered keeps that order
    renderTable(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  categorySelect.addEventListener("change", applyFilters);
});
