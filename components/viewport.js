import * as THREE from '/vendor/three/three.module.js';
import { OrbitControls } from '/vendor/three-addons/controls/OrbitControls.js';
import { STLLoader } from '/vendor/three-addons/loaders/STLLoader.js';
import { OBJLoader } from '/vendor/three-addons/loaders/OBJLoader.js';

export function mountViewport(container, options = {}) {
  if (!container) return null;
  container.innerHTML = '';
  container.dataset.viewerStatus = 'starting';

  const width = Math.max(container.clientWidth, 320);
  const height = Math.max(container.clientHeight, 260);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(3.4, 2.2, 4.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const status = document.createElement('div');
  status.className = 'viewer-status';
  status.textContent = 'Preparing viewport';
  container.appendChild(status);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.autoRotate = options.autoRotate ?? true;
  controls.autoRotateSpeed = 1.2;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x38445a, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(5, 6, 4);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);
  let mode = options.mode || 'solid';
  let activeObject;
  let wireGroup = new THREE.Group();
  group.add(wireGroup);

  const grid = new THREE.GridHelper(6, 24, 0x1e6fff, 0xcbd5e1);
  grid.position.y = -1.2;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);

  const resizeObserver = new ResizeObserver(() => {
    const nextWidth = Math.max(container.clientWidth, 320);
    const nextHeight = Math.max(container.clientHeight, 260);
    renderer.setSize(nextWidth, nextHeight);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);

  let disposed = false;
  function animate() {
    if (disposed) return;
    group.rotation.y += options.spin === false ? 0 : 0.003;
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  loadModel()
    .then(() => {
      setStatus('loaded', loadedLabel(options.model));
      setTimeout(() => status.classList.add('quiet'), 1600);
    })
    .catch((error) => {
      console.warn(error);
      usePlaceholder();
      setStatus('fallback', 'Preview geometry');
      setTimeout(() => status.classList.add('quiet'), 1800);
    });

  async function loadModel() {
    const filePath = options.model?.filePath;
    const format = String(options.model?.format || '').toLowerCase();
    if (!filePath || !['stl', 'obj'].includes(format)) {
      usePlaceholder();
      return;
    }

    setStatus('loading', `Loading .${format}`);
    if (format === 'stl') {
      const geometry = await loadStl(filePath);
      if (!geometry.getAttribute('position')?.count) throw new Error('STL geometry was empty');
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, materialFor(mode));
      mesh.castShadow = true;
      setActiveObject(mesh);
      return;
    }

    if (format === 'obj') {
      const object = await loadObj(filePath);
      let meshes = 0;
      object.traverse((child) => {
        if (!child.isMesh) return;
        meshes += 1;
        child.material = materialFor(mode);
        child.castShadow = true;
      });
      if (!meshes) throw new Error('OBJ contained no meshes');
      setActiveObject(object);
    }
  }

  function usePlaceholder() {
    const primitive = options.primitive || options.model?.buildPlan?.previewPrimitive || inferPrimitive(options.model);
    const mesh = new THREE.Mesh(geometryFor(primitive), materialFor(mode));
    mesh.castShadow = true;
    mesh.rotation.set(-0.18, 0.3, 0.1);
    setActiveObject(mesh);
  }

  function setActiveObject(object) {
    disposeActiveObject();
    activeObject = object;
    group.add(activeObject);
    normalizeObject(activeObject);
    rebuildWire();
    applyMode(mode);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function normalizeObject(object) {
    const box = new THREE.Box3().setFromObject(object);
    if (!Number.isFinite(box.min.x) || box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    object.position.sub(center);
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    object.scale.multiplyScalar(2.35 / maxAxis);
    object.updateMatrixWorld(true);
    const normalizedBox = new THREE.Box3().setFromObject(object);
    const bottom = normalizedBox.min.y;
    object.position.y -= bottom + 1.05;
  }

  function rebuildWire() {
    disposeObject(wireGroup);
    group.remove(wireGroup);
    wireGroup = new THREE.Group();
    activeObject?.traverse?.((child) => {
      if (!child.isMesh || !child.geometry) return;
      const line = new THREE.LineSegments(
        new THREE.WireframeGeometry(child.geometry),
        new THREE.LineBasicMaterial({ color: 0x1e6fff, transparent: true, opacity: 0.36 })
      );
      line.position.copy(child.position);
      line.rotation.copy(child.rotation);
      line.scale.copy(child.scale);
      wireGroup.add(line);
    });
    if (activeObject?.isMesh) {
      const line = new THREE.LineSegments(
        new THREE.WireframeGeometry(activeObject.geometry),
        new THREE.LineBasicMaterial({ color: 0x1e6fff, transparent: true, opacity: 0.36 })
      );
      line.position.copy(activeObject.position);
      line.rotation.copy(activeObject.rotation);
      line.scale.copy(activeObject.scale);
      wireGroup.add(line);
    }
    group.add(wireGroup);
  }

  function applyMode(nextMode) {
    mode = nextMode;
    activeObject?.traverse?.((child) => {
      if (!child.isMesh) return;
      child.material?.dispose?.();
      child.material = materialFor(mode);
    });
    if (activeObject?.isMesh) {
      activeObject.material?.dispose?.();
      activeObject.material = materialFor(mode);
    }
    wireGroup.visible = mode !== 'solid';
  }

  function setStatus(state, label) {
    container.dataset.viewerStatus = state;
    status.classList.remove('quiet');
    status.textContent = label;
  }

  return {
    setMode(mode) {
      applyMode(mode);
    },
    reset() {
      camera.position.set(3.4, 2.2, 4.4);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    toggleAutoRotate() {
      controls.autoRotate = !controls.autoRotate;
      return controls.autoRotate;
    },
    dispose() {
      disposed = true;
      resizeObserver.disconnect();
      renderer.dispose();
      disposeActiveObject();
      disposeObject(wireGroup);
    }
  };

  function disposeActiveObject() {
    if (!activeObject) return;
    group.remove(activeObject);
    disposeObject(activeObject);
    activeObject = undefined;
  }
}

function loadedLabel(model = {}) {
  return model.filePath ? `Loaded ${model.format?.toUpperCase() || 'CAD'}` : 'Preview geometry';
}

function loadStl(url) {
  return new Promise((resolve, reject) => {
    new STLLoader().load(url, resolve, undefined, reject);
  });
}

function loadObj(url) {
  return new Promise((resolve, reject) => {
    new OBJLoader().load(url, resolve, undefined, reject);
  });
}

function disposeObject(object) {
  object?.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
    else child.material?.dispose?.();
  });
}

function inferPrimitive(model = {}) {
  const text = `${model.category || ''} ${model.title || ''}`.toLowerCase();
  if (text.includes('wheel') || text.includes('heat') || text.includes('gyroid')) return 'torus';
  if (text.includes('wing') || text.includes('rib')) return 'wing';
  if (text.includes('bio') || text.includes('mesh')) return 'sphere';
  if (text.includes('electronics') || text.includes('cage') || text.includes('enclosure')) return 'box';
  if (text.includes('facade') || text.includes('panel')) return 'panel';
  return 'knot';
}

function geometryFor(primitive) {
  if (primitive === 'torus') return new THREE.TorusKnotGeometry(0.95, 0.28, 160, 22, 2, 3);
  if (primitive === 'sphere') return new THREE.IcosahedronGeometry(1.25, 3);
  if (primitive === 'box') return new THREE.BoxGeometry(1.8, 1.15, 1.25, 4, 4, 4);
  if (primitive === 'panel') return new THREE.BoxGeometry(2.2, 1.35, 0.18, 8, 5, 1);
  if (primitive === 'wing') {
    const shape = new THREE.Shape();
    shape.moveTo(-1.7, -0.3);
    shape.lineTo(1.7, -0.18);
    shape.lineTo(1.35, 0.3);
    shape.lineTo(-1.55, 0.42);
    shape.lineTo(-1.7, -0.3);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 });
  }
  return new THREE.TorusKnotGeometry(0.9, 0.22, 128, 18);
}

function materialFor(mode) {
  if (mode === 'wireframe') {
    return new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, roughness: 0.28, metalness: 0.1 });
  }
  if (mode === 'ghost') {
    return new THREE.MeshPhysicalMaterial({
      color: 0x1e6fff,
      transparent: true,
      opacity: 0.24,
      roughness: 0.12,
      metalness: 0.2,
      transmission: 0.25
    });
  }
  if (mode === 'xray') {
    return new THREE.MeshBasicMaterial({ color: 0x1e6fff, transparent: true, opacity: 0.18, wireframe: true });
  }
  return new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 0.24, metalness: 0.34 });
}
