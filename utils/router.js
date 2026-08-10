export function createRouter(routes, onRoute) {
  function match(pathname) {
    for (const route of routes) {
      const keys = [];
      const pattern = route.path
        .replace(/\//g, '\\/')
        .replace(/:([A-Za-z0-9_]+)/g, (_all, key) => {
          keys.push(key);
          return '([^/]+)';
        });
      const matchResult = pathname.match(new RegExp(`^${pattern}$`));
      if (!matchResult) continue;
      const params = Object.fromEntries(keys.map((key, index) => [key, decodeURIComponent(matchResult[index + 1])]));
      return { route, params };
    }
    return { route: routes[0], params: {} };
  }

  async function render() {
    const { route, params } = match(location.pathname);
    await onRoute(route, params);
  }

  function navigate(path) {
    history.pushState({}, '', path);
    render();
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-link]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    event.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', render);

  return {
    start: render,
    refresh: render,
    navigate
  };
}
