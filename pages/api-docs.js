export async function apiDocsPage() {
  const endpoints = [
    ['GET', '/api/health', 'Platform health check'],
    ['POST', '/api/auth/register', 'Register regular, Official, or Owner users'],
    ['POST', '/api/auth/login', 'Issue JWT session token'],
    ['GET', '/api/models', 'List visible models with filters'],
    ['POST', '/api/models', 'Upload a CAD model'],
    ['GET', '/api/models/:id/download', 'Download or export .kaiju envelope'],
    ['GET', '/api/owner/telemetry', 'Owner-only live telemetry snapshot'],
    ['WS', '/ws/owner-telemetry', 'Owner-only telemetry stream'],
    ['WS', '/ws/aider-x', 'AIDER-X assistant socket']
  ];
  return {
    title: 'API Docs',
    html: `
      <section class="stack">
        <div class="page-title"><h1>API Documentation</h1><p>REST and WebSocket endpoints for Kaiju platform integrations.</p></div>
        <div class="panel">
          <table class="table">
            <thead><tr><th>Method</th><th>Endpoint</th><th>Purpose</th></tr></thead>
            <tbody>${endpoints.map(([method, path, purpose]) => `<tr><td><span class="status-badge">${method}</span></td><td><code>${path}</code></td><td>${purpose}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <pre class="code-block"><code>Authorization: Bearer &lt;jwt&gt;
Content-Type: application/json

POST /api/auth/login
{
  "identity": "owner@kaiju.local",
  "password": "owner-demo"
}</code></pre>
      </section>
    `
  };
}
