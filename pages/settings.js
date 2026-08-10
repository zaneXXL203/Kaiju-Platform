export async function settingsPage({ user }) {
  if (!user) return { title: 'Settings', html: '<div class="empty-state">Log in to manage settings.</div>' };
  return {
    title: 'Settings',
    html: `
      <section class="stack">
        <div class="page-title"><h1>Settings</h1><p>Account, appearance, notifications, and future premium controls.</p></div>
        <div class="two-column">
          <div class="panel form">
            <h2>Account</h2>
            <div class="field"><label>Username</label><input value="${escapeAttr(user.username)}"></div>
            <div class="field"><label>Email</label><input value="${escapeAttr(user.email)}"></div>
            <button class="button secondary" type="button">Save Profile</button>
          </div>
          <div class="panel">
            <h2>Preferences</h2>
            <ul class="compact-list">
              <li><label><input type="checkbox" checked> In-app notifications</label></li>
              <li><label><input type="checkbox" checked> Light theme by default</label></li>
              <li><label><input type="checkbox"> Premium tier placeholder</label></li>
            </ul>
          </div>
        </div>
      </section>
    `
  };
}

function escapeAttr(value) {
  return String(value || '').replace(/"/g, '&quot;');
}
