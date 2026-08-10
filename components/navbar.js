export function renderNavbar({ user, path }) {
  const canOfficial = user && ['official', 'owner'].includes(user.role);
  const isOwner = user?.role === 'owner';
  return `
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/" data-link aria-label="Kaiju CAD Library home">
          <img src="/assets/kaiju-logo-transparent.png" alt="">
          <span class="brand-text">
            <span>Kaiju CAD Library</span>
            <small>The World's Geometry</small>
          </span>
        </a>
        <form class="nav-search" data-nav-search>
          <i data-lucide="search" aria-hidden="true"></i>
          <input name="q" type="search" placeholder="Search geometry">
        </form>
        <button class="icon-button nav-toggle" type="button" data-nav-toggle aria-label="Toggle navigation">
          <i data-lucide="menu"></i>
        </button>
        <nav class="nav-actions" data-nav-menu aria-label="Primary">
          <a class="nav-link ${path === '/search' ? 'active' : ''}" href="/search" data-link>Search</a>
          <a class="nav-link ${path === '/requests' ? 'active' : ''}" href="/requests" data-link>Requests</a>
          <a class="nav-link ${path === '/feed' ? 'active' : ''}" href="/feed" data-link>Feed</a>
          ${user ? `<a class="button" href="/upload" data-link><i data-lucide="upload"></i>Upload</a>` : ''}
          ${canOfficial ? `<a class="nav-link ${path === '/official' ? 'active' : ''}" href="/official" data-link>Official</a>` : ''}
          ${isOwner ? `<a class="button owner" href="/owner" data-link><i data-lucide="crown"></i>Owner</a>` : ''}
          ${user ? userMenu(user) : guestLinks()}
        </nav>
      </div>
    </header>
  `;
}

function guestLinks() {
  return `
    <a class="nav-link" href="/login" data-link>Login</a>
    <a class="button" href="/register" data-link>Register</a>
  `;
}

function userMenu(user) {
  const badge = user.role === 'owner'
    ? '<span class="badge-owner">Owner</span>'
    : user.role === 'official'
      ? '<span class="badge-official">Official</span>'
      : '';
  return `
    <a class="nav-link nav-user" href="/profile" data-link><span class="avatar-dot">${initials(user.username)}</span>${badge}<span>${user.username}</span></a>
    <button class="nav-link" type="button" data-logout>Logout</button>
  `;
}

export function bindNavbar({ router, authService }) {
  document.querySelector('[data-nav-toggle]')?.addEventListener('click', () => {
    document.querySelector('[data-nav-menu]')?.classList.toggle('open');
  });

  document.querySelector('[data-nav-search]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get('q') || '';
    router.navigate(`/search?q=${encodeURIComponent(q)}`);
  });

  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    authService.logout();
    router.navigate('/');
  });
}

function initials(username = '') {
  return String(username).trim().slice(0, 1).toUpperCase() || 'K';
}
