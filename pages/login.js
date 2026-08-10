import { authService } from '../services/auth-service.js';
import { showToast } from '../components/toast.js';

export async function loginPage({ router }) {
  return {
    title: 'Login',
    html: `
      <div class="auth-wrap">
        <form class="auth-card form" data-login-form>
          <img class="auth-mark" src="/assets/kaiju-logo-transparent.png" alt="Kaiju">
          <h1>Login</h1>
          <p class="muted">Demo accounts are available for local testing.</p>
          <div class="field"><label>Email or username</label><input name="identity" autocomplete="username" required></div>
          <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div>
          <button class="button" type="submit">Enter Platform</button>
          <p class="muted">Owner demo: owner@kaiju.local / owner-demo<br>Official demo: official@kaiju.local / official-demo</p>
        </form>
      </div>
    `,
    afterRender() {
      document.querySelector('[data-login-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const form = new FormData(event.currentTarget);
          const user = await authService.login({
            identity: form.get('identity'),
            password: form.get('password')
          });
          showToast(`Welcome back, ${user.username}`);
          router.navigate(user.role === 'owner' ? '/owner' : '/');
        } catch (error) {
          showToast(error.message);
        }
      });
    }
  };
}
