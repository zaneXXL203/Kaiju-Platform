import { apiClient } from '../services/api-client.js';
import { showToast } from '../components/toast.js';

export async function feedbackPage() {
  return {
    title: 'Feedback',
    html: `
      <section class="two-column">
        <div class="page-title">
          <h1>Feedback</h1>
          <p>Send reviews, bugs, and improvement notes into the platform queue.</p>
        </div>
        <form class="panel form" data-feedback-form>
          <div class="field"><label>Name</label><input name="name" required></div>
          <div class="field"><label>Email</label><input name="email" type="email"></div>
          <div class="field"><label>Rating</label><select name="rating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
          <div class="field"><label>Message</label><textarea name="message" required></textarea></div>
          <button class="button" type="submit">Send Feedback</button>
        </form>
      </section>
    `,
    afterRender() {
      document.querySelector('[data-feedback-form]')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await apiClient.request('/api/feedback', {
          method: 'POST',
          body: Object.fromEntries(form.entries())
        });
        showToast('Feedback sent');
        event.currentTarget.reset();
      });
    }
  };
}
