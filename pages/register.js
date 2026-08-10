import { authService } from '../services/auth-service.js';
import { attachSecretEntry } from '../components/secret-entry.js';
import { showToast } from '../components/toast.js';

export async function registerPage({ router }) {
  return {
    title: 'Register',
    html: `
      <div class="auth-wrap">
        <form class="auth-card form" data-register-form>
          <button class="auth-logo" type="button" data-secret-trigger aria-label="Kaiju">
            <img src="/assets/kaiju-logo-transparent.png" alt="">
            <span class="secret-indicator" data-secret-indicator></span>
          </button>
          <input class="secret-code-input" data-secret-input autocomplete="off" aria-hidden="true">
          <h1>Create Account</h1>
          <p class="muted">Join the geometry library and publish models in the Kaiju ecosystem.</p>
          <div class="field"><label>Username</label><input name="username" autocomplete="username" required minlength="3"></div>
          <div class="field"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>
          <div class="field"><label>Password</label><input name="password" type="password" autocomplete="new-password" required minlength="6"></div>
          <button class="button" type="submit">Create Account</button>
        </form>
      </div>
    `,
    afterRender() {
      let secretCode = '';
      let secretRole = '';
      attachSecretEntry({
        trigger: document.querySelector('[data-secret-trigger]'),
        indicator: document.querySelector('[data-secret-indicator]'),
        input: document.querySelector('[data-secret-input]'),
        onAccepted(code, role) {
          secretCode = code;
          secretRole = role;
        }
      });

      document.querySelector('[data-register-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          const form = new FormData(event.currentTarget);
          const user = await authService.register({
            username: form.get('username'),
            email: form.get('email'),
            password: form.get('password'),
            secretCode
          });
          showToast(secretRole ? `${secretRole.toUpperCase()} account created` : `Welcome, ${user.username}`);
          router.navigate(user.role === 'owner' ? '/owner' : '/');
        } catch (error) {
          showToast(error.message);
        }
      });
    }
  };
}
