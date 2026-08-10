export function renderFooter() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div class="stack">
          <a class="brand" href="/" data-link>
            <img src="/assets/kaiju-logo-transparent.png" alt="">
            <span class="brand-text">
              <span>Kaiju CAD Library</span>
              <small>The World's Geometry</small>
            </span>
          </a>
          <p class="muted">Built by Mantiz for ZaneOmotoye. Publish, discover, compare, and share geometry in the native .kaiju format.</p>
          <div class="row">
            <a class="nav-link" href="/upload" data-link>Upload</a>
            <a class="nav-link" href="/search" data-link>Search</a>
            <a class="nav-link" href="/api-docs" data-link>API Docs</a>
            <a class="nav-link" href="/feedback" data-link>Feedback</a>
            <a class="nav-link" href="/changelog" data-link>Changelog</a>
          </div>
        </div>
        <div class="footer-logos">
          <div class="footer-logo-card">
            <img src="/assets/blackwolf.png" alt="BlackWolf logo">
            <div><strong>ZaneOmotoye</strong><br><span class="muted">Creator & Founder</span></div>
          </div>
          <div class="footer-logo-card">
            <img src="/assets/mantiz-logo.png" alt="Mantiz logo">
            <div><strong>Mantiz</strong><br><span class="muted">Creative Development & Branding</span></div>
          </div>
        </div>
      </div>
    </footer>
  `;
}
