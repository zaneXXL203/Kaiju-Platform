import { modelService } from '../services/model-service.js';
import { modelCard } from '../components/model-card.js';

export async function searchPage() {
  const query = new URLSearchParams(location.search);
  const params = Object.fromEntries(query.entries());
  const { models } = await modelService.search(params);
  return {
    title: 'Search',
    html: `
      <section class="stack">
        <div class="page-title">
          <h1>Search Geometry</h1>
          <p>Find public, Official, Owner, and .kaiju models across the platform.</p>
        </div>
        <form class="panel form" data-search-form>
          <div class="two-column">
            <div class="field"><label>Query</label><input name="q" value="${escapeAttr(params.q || '')}" placeholder="heat exchanger, wing rib, rover"></div>
            <div class="field">
              <label>Category</label>
              <select name="category">
                ${['All', 'Mechanical', 'Aerospace', 'Bio-Medical', 'Architecture', 'Electronics', 'Abstract'].map((cat) => `<option ${params.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
              </select>
            </div>
          </div>
          <label class="row"><input type="checkbox" name="official" value="true" ${params.official === 'true' ? 'checked' : ''}> Official and Owner only</label>
          <button class="button" type="submit">Search</button>
        </form>
        <div class="section-head"><h2>${models.length} Results</h2></div>
        <div class="model-grid">${models.length ? models.map(modelCard).join('') : '<div class="empty-state">No models found.</div>'}</div>
      </section>
    `,
    afterRender({ router }) {
      document.querySelector('[data-search-form]')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const qs = new URLSearchParams();
        for (const [key, value] of form.entries()) {
          if (value && value !== 'All') qs.set(key, value);
        }
        router.navigate(`/search?${qs}`);
      });
    }
  };
}

function escapeAttr(value) {
  return String(value || '').replace(/"/g, '&quot;');
}
