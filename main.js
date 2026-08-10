import { createRouter } from './utils/router.js';
import { authService } from './services/auth-service.js';
import { renderNavbar, bindNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { renderAiderX, mountAiderX } from './components/aider-x.js';
import { bindInteractions } from './components/interactions.js';
import { showToast } from './components/toast.js';
import { homePage } from './pages/home.js';
import { modelDetailPage } from './pages/model-detail.js';
import { uploadPage } from './pages/upload.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { profilePage } from './pages/profile.js';
import { searchPage } from './pages/search.js';
import { settingsPage } from './pages/settings.js';
import { officialDashboardPage } from './pages/official-dashboard.js';
import { ownerCommandCentrePage } from './pages/owner-command-centre.js';
import { feedbackPage } from './pages/feedback.js';
import { requestsPage } from './pages/requests.js';
import { feedPage } from './pages/feed.js';
import { apiDocsPage } from './pages/api-docs.js';
import { changelogPage } from './pages/changelog.js';

const app = document.querySelector('#app');

const routes = [
  { path: '/', page: homePage },
  { path: '/models/:id', page: modelDetailPage },
  { path: '/upload', page: uploadPage },
  { path: '/login', page: loginPage },
  { path: '/register', page: registerPage },
  { path: '/profile', page: profilePage },
  { path: '/profile/:username', page: profilePage },
  { path: '/search', page: searchPage },
  { path: '/settings', page: settingsPage },
  { path: '/official', page: officialDashboardPage },
  { path: '/owner', page: ownerCommandCentrePage },
  { path: '/feedback', page: feedbackPage },
  { path: '/requests', page: requestsPage },
  { path: '/feed', page: feedPage },
  { path: '/api-docs', page: apiDocsPage },
  { path: '/changelog', page: changelogPage }
];

export const router = createRouter(routes, renderRoute);
window.KaijuRouter = router;
window.KaijuToast = showToast;

async function renderRoute(route, params) {
  const user = authService.currentUser();
  document.documentElement.dataset.theme = user?.role === 'owner' ? 'owner' : 'regular';

  let page;
  try {
    page = await route.page({ params, router, user });
  } catch (error) {
    console.error(error);
    page = {
      title: 'Something went wrong',
      html: `<section class="page"><div class="empty-state">The page could not load. ${escapeHtml(error.message)}</div></section>`
    };
    showToast(error.message || 'Page failed to load');
  }

  document.title = `${page.title || 'Kaiju CAD Library'} | Kaiju`;
  app.innerHTML = `
    <div class="app-shell">
      ${renderNavbar({ user, path: location.pathname })}
      <main class="page">${page.html}</main>
      ${renderFooter()}
      ${renderAiderX()}
    </div>
  `;

  bindNavbar({ router, authService });
  mountAiderX();
  await page.afterRender?.({ params, router, user });
  bindInteractions({ router });
  window.lucide?.createIcons();
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value || '');
  return div.innerHTML;
}

window.addEventListener('auth:changed', () => router.refresh());

await authService.restore();
router.start();

setTimeout(() => {
  document.querySelector('#splash')?.classList.add('hidden');
}, 650);
