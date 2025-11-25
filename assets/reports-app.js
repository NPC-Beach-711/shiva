// reports-app.js

const REPORTS_JSON_URL = 'reports.json';

const els = {
  searchInput: document.getElementById('search-input'),
  yearFilter: document.getElementById('year-filter'),
  categoryFilter: document.getElementById('category-filter'),
  resetBtn: document.getElementById('reset-filters'),
  resultsInfo: document.getElementById('results-info'),
  reportsGrid: document.getElementById('reports-grid'),
};

let allReports = [];
let visibleReports = [];

// Init
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing reports app...');
  setFooterYear();
  loadReports();
});

function setFooterYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

async function loadReports() {
  try {
    console.log('Loading reports...');
    
    // Check if required elements exist
    if (!els.reportsGrid) {
      throw new Error('Reports grid element not found');
    }

    const resp = await fetch(REPORTS_JSON_URL);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (!Array.isArray(data)) {
      throw new Error('reports.json must be an array');
    }

    allReports = data;
    visibleReports = [...allReports];

    populateFilters(allReports);
    bindEvents();
    renderReports();
    updateResultsInfo();
    
    console.log('Reports loaded successfully');
  } catch (err) {
    console.error('Error loading reports:', err);
    if (els.resultsInfo) {
      els.resultsInfo.textContent = 'Failed to load reports.';
    }
    if (els.reportsGrid) {
      els.reportsGrid.innerHTML =
        '<p>There was a problem loading the reports list. Check reports.json and try again.</p>';
    }
  }
}

function populateFilters(reports) {
  if (!els.yearFilter || !els.categoryFilter) return;
  
  const years = new Set();
  const categories = new Set();

  for (const r of reports) {
    const year = (r.year || '').toString().trim();
    const category = (r.category || '').trim();

    // Ignore "Inferred/Unknown" for year filter – those will still show in results
    if (year && year.toLowerCase() !== 'inferred/unknown') {
      years.add(year);
    }
    if (category) {
      categories.add(category);
    }
  }

  const sortedYears = Array.from(years).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      return nb - na; // newest first
    }
    return a.localeCompare(b);
  });

  const sortedCategories = Array.from(categories).sort((a, b) =>
    a.localeCompare(b)
  );

  // Clear existing (leave first "All" option)
  clearFilterOptions(els.yearFilter);
  clearFilterOptions(els.categoryFilter);

  for (const y of sortedYears) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    els.yearFilter.appendChild(opt);
  }

  for (const c of sortedCategories) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    els.categoryFilter.appendChild(opt);
  }
}

function clearFilterOptions(selectEl) {
  if (!selectEl) return;
  while (selectEl.options.length > 1) {
    selectEl.remove(1);
  }
}

function bindEvents() {
  if (els.searchInput) {
    els.searchInput.addEventListener('input', handleFilterChange);
  }
  if (els.yearFilter) {
    els.yearFilter.addEventListener('change', handleFilterChange);
  }
  if (els.categoryFilter) {
    els.categoryFilter.addEventListener('change', handleFilterChange);
  }

  if (els.resetBtn) {
    els.resetBtn.addEventListener('click', () => {
      if (els.searchInput) els.searchInput.value = '';
      if (els.yearFilter) els.yearFilter.value = '';
      if (els.categoryFilter) els.categoryFilter.value = '';
      visibleReports = [...allReports];
      renderReports();
      updateResultsInfo();
      if (els.searchInput) els.searchInput.focus();
    });
  }
}

function handleFilterChange() {
  const query = els.searchInput ? els.searchInput.value.trim().toLowerCase() : '';
  const year = els.yearFilter ? els.yearFilter.value : '';
  const category = els.categoryFilter ? els.categoryFilter.value : '';

  visibleReports = allReports.filter((r) => {
    const rYear = (r.year || '').toString();
    const rCategory = r.category || '';

    if (year && rYear !== year) return false;
    if (category && rCategory !== category) return false;

    if (query) {
      const haystack = [
        r.title || '',
        rYear,
        rCategory,
        r.type || '',
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  renderReports();
  updateResultsInfo();
}

function updateResultsInfo() {
  if (!els.resultsInfo) return;
  
  const total = allReports.length;
  const shown = visibleReports.length;

  if (!total) {
    els.resultsInfo.textContent = 'No reports available.';
    return;
  }

  if (shown === 0) {
    els.resultsInfo.textContent = `No reports match your filters (0 of ${total}).`;
  } else if (shown === total) {
    els.resultsInfo.textContent = `Showing all ${total} reports.`;
  } else {
    els.resultsInfo.textContent = `Showing ${shown} of ${total} reports.`;
  }
}

function renderReports() {
  if (!els.reportsGrid) return;
  
  if (!visibleReports.length) {
    els.reportsGrid.innerHTML =
      '<p>No reports match your search. Try clearing filters.</p>';
    return;
  }

  const cardsHtml = visibleReports
    .map((r) => {
      const title = r.title || 'Untitled item';
      const rawYear = (r.year || '').toString().trim();
      const year =
        rawYear && rawYear.toLowerCase() !== 'inferred/unknown'
          ? rawYear
          : 'n.d.';
      const format = r.type || '';
      const category = r.category || '';
      const url = r.url || '';

      const tags = [];
      if (category) tags.push(category);
      if (format) tags.push(format);

      return `
        <article class="report-card">
          <div class="report-meta-row">
            <span class="report-year-badge">${escapeHtml(year)}</span>
            ${
              format
                ? `<span class="report-format">${escapeHtml(format)}</span>`
                : ''
            }
          </div>

          <h2 class="report-title">${escapeHtml(title)}</h2>

          ${
            category
              ? `<p class="report-description">${escapeHtml(
                  category
                )}</p>`
              : ''
          }

          <div class="report-tags">
            ${tags
              .map((t) => `<span>${escapeHtml(t)}</span>`)
              .join('')}
          </div>

          <div class="report-actions">
            ${
              url
                ? `<a href="${escapeAttribute(
                    url
                  )}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
                     Open
                   </a>`
                : ''
            }
          </div>
        </article>
      `;
    })
    .join('');

  els.reportsGrid.innerHTML = cardsHtml;
}

// Basic HTML escaping to avoid any weird characters causing issues
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttribute(str) {
  // For URLs and attributes
  return escapeHtml(str).replace(/\s/g, '%20');
}