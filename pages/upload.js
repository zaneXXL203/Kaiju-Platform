import { modelService } from '../services/model-service.js';
import { mountViewport } from '../components/viewport.js';
import { showToast } from '../components/toast.js';

export async function uploadPage({ router, user }) {
  if (!user) {
    return {
      title: 'Login Required',
      html: `<div class="empty-state">Log in to upload CAD models.<br><br><a class="button" href="/login" data-link>Login</a></div>`
    };
  }

  const official = ['official', 'owner'].includes(user.role);
  return {
    title: 'Upload Model',
    html: `
      <div class="page-title">
        <h1>Upload Model</h1>
        <p>${official ? 'Official bulk upload and enhanced metadata are available for this account.' : 'Regular uploads support one CAD file up to 500MB.'}</p>
      </div>
      <div class="upload-rail" style="margin-top:18px;">
        <div class="upload-step"><strong>1. File</strong><span>CAD source and preview</span></div>
        <div class="upload-step"><strong>2. Metadata</strong><span>Build plan and visibility</span></div>
        <div class="upload-step"><strong>3. Publish</strong><span>.kaiju wrapping and badges</span></div>
      </div>
      <div class="two-column" style="margin-top:22px;">
        <form class="panel form" data-upload-form>
          <label class="drop-zone" data-drop-zone>
            <span><span class="drop-zone-icon"><i data-lucide="file-up"></i></span><strong>Drop CAD file here</strong><br>.kaiju, .stl, .obj, .iges, .step, .3mf, .fbx</span>
            <input class="sr-only" type="file" name="file" required accept=".kaiju,.stl,.obj,.iges,.igs,.step,.stp,.3mf,.fbx">
          </label>
          <div class="field"><label>Title</label><input name="title" required></div>
          <div class="field"><label>Description</label><textarea name="description"></textarea></div>
          <div class="field">
            <label>Category</label>
            <select name="category">
              <option>Mechanical</option><option>Aerospace</option><option>Bio-Medical</option>
              <option>Architecture</option><option>Electronics</option><option>Abstract</option>
            </select>
          </div>
          <div class="field"><label>Tags</label><input name="tags" placeholder="lattice, thermal, printable"></div>
          <div class="field"><label>Visibility</label><select name="visibility"><option value="public">Public</option><option value="private">Private</option></select></div>
          <label class="row"><input type="checkbox" name="convertToKaiju" value="true" checked> Convert or wrap as .kaiju</label>
          <div class="field"><label>Material</label><input name="material" placeholder="AlSi10Mg, PETG, TPU..."></div>
          <div class="field"><label>Dimensions</label><input name="dimensions" placeholder="120 x 80 x 40 mm"></div>
          ${official ? '<div class="field"><label>Official Notes</label><textarea name="officialNotes"></textarea></div><label class="row"><input type="checkbox" name="featuredRequest" value="true"> Request homepage feature</label>' : ''}
          <button class="button" type="submit"><i data-lucide="upload-cloud"></i>Publish Model</button>
        </form>
        <aside class="stack">
          <div class="viewport-small" id="upload-preview"></div>
          <div class="panel">
            <h2>Upload Rules</h2>
            <ul class="compact-list">
              <li>Regular max: 500MB</li>
              <li>Official/Owner max: 2GB</li>
              <li>Private models are hidden from regular users</li>
              <li>Official and Owner uploads receive platform badges</li>
            </ul>
          </div>
        </aside>
      </div>
    `,
    afterRender() {
      mountViewport(document.querySelector('#upload-preview'), { primitive: 'box' });
      bindUploadForm(router);
    }
  };
}

function bindUploadForm(router) {
  const form = document.querySelector('[data-upload-form]');
  const dropZone = document.querySelector('[data-drop-zone]');
  const fileInput = form?.elements.file;
  if (!form) return;

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
    if (event.dataTransfer.files?.[0]) {
      fileInput.files = event.dataTransfer.files;
      form.elements.title.value ||= event.dataTransfer.files[0].name.replace(/\.[^.]+$/, '');
    }
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) form.elements.title.value ||= fileInput.files[0].name.replace(/\.[^.]+$/, '');
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const result = await modelService.upload(new FormData(form));
      showToast('Model published');
      router.navigate(`/models/${result.model.id}`);
    } catch (error) {
      showToast(error.message);
    }
  });
}
