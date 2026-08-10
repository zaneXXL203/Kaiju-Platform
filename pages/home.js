import { modelService } from '../services/model-service.js';
import { modelCard } from '../components/model-card.js';
import { mountViewport } from '../components/viewport.js';

const categories = ['All', 'Mechanical', 'Aerospace', 'Bio-Medical', 'Architecture', 'Electronics', 'Abstract'];

export async function homePage() {
  const [{ models }, announcementData] = await Promise.all([
    modelService.list(),
    fetch('/api/announcements').then((res) => res.json())
  ]);
  const featured = models.filter((model) => model.isFeatured).slice(0, 3);
  const trending = [...models].sort((a, b) => b.downloads - a.downloads).slice(0, 10);
  const officialCount = models.filter((model) => ['official', 'owner'].includes(model.creatorRole)).length;
  const downloads = models.reduce((sum, model) => sum + model.downloads, 0);

  return {
    title: 'The World\'s Geometry',
    html: `
      ${announcementData.announcements?.[0] ? announcement(announcementData.announcements[0]) : ''}
      <section class="hero">
        <div class="hero-copy">
          <h1>The World's Geometry</h1>
          <p>Publish, inspect, compare, and download CAD models with tiered Official and Owner workflows, .kaiju metadata, and live geometry context.</p>
          <div class="hero-actions">
            <a class="button" href="/upload" data-link><i data-lucide="upload"></i>Upload Model</a>
            <a class="button secondary" href="/search?official=true" data-link><i data-lucide="badge-check"></i>Official Only</a>
            <a class="button ghost" href="/api-docs" data-link><i data-lucide="code-2"></i>API</a>
          </div>
          <div class="hero-metrics">
            <div class="hero-metric"><strong>${formatNumber(models.length)}</strong><span>Models indexed</span></div>
            <div class="hero-metric"><strong>${formatNumber(officialCount)}</strong><span>Official assets</span></div>
            <div class="hero-metric"><strong>${formatNumber(downloads)}</strong><span>Total downloads</span></div>
          </div>
        </div>
        <div id="hero-viewport" class="viewport-hero" aria-label="Rotating Kaiju geometry preview"></div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <h2>Staff Picks</h2>
            <p class="muted">Featured geometry curated by Official and Owner accounts.</p>
          </div>
          <a class="button secondary" href="/search?featured=true" data-link>View Featured</a>
        </div>
        <div class="model-grid">${featured.map(modelCard).join('')}</div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <h2>Discovery Grid</h2>
            <p class="muted">Filter models by category, native format, and Official status.</p>
          </div>
        </div>
        <div class="filter-bar" data-home-filters>
          ${categories.map((category) => `<button class="button secondary ${category === 'All' ? 'is-active' : ''}" type="button" data-category="${category}">${category}</button>`).join('')}
          <button class="button secondary" type="button" data-official="true">Official Only</button>
        </div>
        <div class="grid-layout" style="margin-top:16px;">
          <div class="model-grid" data-model-grid>${models.map(modelCard).join('')}</div>
          <aside class="panel">
            <h2>Trending</h2>
            <ul class="compact-list">
              ${trending.map((model, index) => `<li><strong>${index + 1}. ${escapeHtml(model.title)}</strong><br><span class="muted">${model.downloads} downloads this week</span></li>`).join('')}
            </ul>
          </aside>
        </div>
      </section>
    `,
    afterRender() {
      mountViewport(document.querySelector('#hero-viewport'), { primitive: 'knot', autoRotate: true });
      bindHomeFilters();
    }
  };
}

function announcement(item) {
  return `
    <div class="announcement">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.body)}</span>
    </div>
  `;
}

function bindHomeFilters() {
  const grid = document.querySelector('[data-model-grid]');
  document.querySelector('[data-home-filters]')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const params = {};
    if (button.dataset.category && button.dataset.category !== 'All') params.category = button.dataset.category;
    if (button.dataset.official) params.official = 'true';
    document.querySelectorAll('[data-home-filters] .button').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    const { models } = await modelService.list(params);
    grid.innerHTML = models.length ? models.map(modelCard).join('') : '<div class="empty-state">No models matched that filter.</div>';
    window.lucide?.createIcons();
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en', { notation: value > 999 ? 'compact' : 'standard' }).format(value);
}
