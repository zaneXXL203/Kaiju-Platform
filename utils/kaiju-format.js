export function createKaijuEnvelope(model, fileInfo = {}) {
  return {
    format: 'kaiju',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      id: model.id,
      title: model.title,
      slug: model.slug,
      category: model.category,
      sourceFormat: model.format,
      source: model.source,
      tags: model.tags || []
    },
    geometry: {
      encoding: 'metadata-preview',
      fileName: fileInfo.originalName || null,
      fileSize: fileInfo.size || model.file_size || 0,
      previewPrimitive: inferPreviewPrimitive(model.category, model.title)
    },
    buildPlan: model.build_plan || model.buildPlan || {},
    rights: {
      visibility: model.visibility,
      creator: model.creator_username || model.creator || null
    }
  };
}

export function buildPlanFromUpload(fields = {}, file = {}) {
  return {
    geometry: fields.geometry || 'Uploaded CAD geometry',
    dimensions: fields.dimensions || 'Measured after conversion',
    material: fields.material || 'Unspecified',
    complexity: fields.complexity || 'Medium',
    simulation: fields.simulation || 'No simulation attached',
    manufacturing: fields.manufacturing || 'Review orientation and tolerances before fabrication',
    sourceFile: file.originalname || '',
    sourceSize: file.size || 0
  };
}

export function inferPreviewPrimitive(category = '', title = '') {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes('wheel') || text.includes('heat') || text.includes('gyroid')) return 'torus';
  if (text.includes('wing') || text.includes('rib')) return 'wing';
  if (text.includes('bio') || text.includes('mesh')) return 'sphere';
  if (text.includes('electronics') || text.includes('cage') || text.includes('enclosure')) return 'box';
  if (text.includes('facade') || text.includes('panel')) return 'panel';
  return 'knot';
}
