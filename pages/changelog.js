export async function changelogPage() {
  return {
    title: 'Changelog',
    html: `
      <section class="stack">
        <div class="page-title"><h1>Changelog</h1><p>Platform release history and implementation milestones.</p></div>
        <div class="panel">
          <ul class="activity-list">
            <li><strong>1.0.0 Local Build</strong><br>Full-stack scaffold, auth tiers, model upload, Three.js viewer, dashboards, AIDER-X, telemetry, request board, feedback, API docs.</li>
            <li><strong>0.9.0 Planning</strong><br>Converted the Kaiju platform plan into an executable build order.</li>
          </ul>
        </div>
      </section>
    `
  };
}
