// ============================================
// PANEL DE ADMINISTRACIÓN — dashboard (admin.html)
// ============================================
// Página separada de tu portafolio. Pide contraseña y permite
// administrar todo el contenido. Los datos los comparte con
// index.html mediante data.js y localStorage.

const ADMIN_PASSWORD = 'rosa2026'; // << cambia aquí tu contraseña

// --- elementos ---
const loginScreen = document.getElementById('loginScreen');
const adminShell = document.getElementById('adminShell');
const adminPass = document.getElementById('adminPass');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginNote = document.getElementById('adminLoginNote');
const adminLogout = document.getElementById('adminLogout');
const adminSave = document.getElementById('adminSave');
const adminSaveNote = document.getElementById('adminSaveNote');

const welcomeName = document.getElementById('welcomeName');
const statProjects = document.getElementById('statProjects');
const statFormation = document.getElementById('statFormation');
const statSkills = document.getElementById('statSkills');

// proyectos
const adminProjectGrid = document.getElementById('adminProjectGrid');
const newProjectBtn = document.getElementById('newProjectBtn');
const projectEditor = document.getElementById('projectEditor');
const editorTitle = document.getElementById('editorTitle');
const editorClose = document.getElementById('editorClose');
const adminForm = document.getElementById('adminForm');
const adminTitleInput = document.getElementById('adminTitleInput');
const adminKind = document.getElementById('adminKind');
const adminDesc = document.getElementById('adminDesc');
const adminTags = document.getElementById('adminTags');
const adminDemo = document.getElementById('adminDemo');
const adminCode = document.getElementById('adminCode');
const adminImageUrl = document.getElementById('adminImageUrl');
const adminImageFile = document.getElementById('adminImageFile');
const dropZone = document.getElementById('dropZone');
const adminProjectSubmit = document.getElementById('adminProjectSubmit');
const adminProjectCancel = document.getElementById('adminProjectCancel');
const adminNote = document.getElementById('adminNote');
const editorPreview = document.getElementById('editorPreview');

// formación
const adminFormationList = document.getElementById('adminFormationList');
const adminFormationForm = document.getElementById('adminFormationForm');
const formationFormTitle = document.getElementById('formationFormTitle');
const adminFormationSubmit = document.getElementById('adminFormationSubmit');
const adminFormationCancel = document.getElementById('adminFormationCancel');
const adminFormationNote = document.getElementById('adminFormationNote');

let editingProjectId = null;
let editingFormationId = null;
let uploadedImage = '';

// ============================================
// CONTRASEÑA
// ============================================
function tryLogin() {
  if (adminPass.value === ADMIN_PASSWORD) {
    data = loadData();
    loginScreen.hidden = true;
    adminShell.hidden = false;
    adminPass.value = '';
    adminLoginNote.textContent = '';
    populateAdminForm();
  } else {
    adminLoginNote.textContent = 'Contraseña incorrecta.';
    adminPass.select();
  }
}

function showLogin() {
  loginScreen.hidden = false;
  adminShell.hidden = true;
  adminPass.value = '';
  adminLoginNote.textContent = '';
  adminSaveNote.textContent = '';
  closeProjectEditor();
  cancelEditFormation();
}

adminLoginBtn.addEventListener('click', tryLogin);
adminPass.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
adminLogout.addEventListener('click', showLogin);

// ============================================
// EXPORTAR DATOS (descarga JSON a la PC)
// ============================================
const adminExport = document.getElementById('adminExport');
adminExport.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(loadData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio_data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ============================================
// NAVEGACIÓN ENTRE PÁGINAS
// ============================================
function activateTab(name) {
  document.querySelectorAll('.admin-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === 'page-' + name);
  });
  if (name === 'proyectos') drawProjectsGrid();
  if (name === 'formacion') drawFormationList();
  if (name === 'mensajes') loadMessages();
}

// ============================================
// MENSAJES DEL FORMULARIO (API + base de datos)
// ============================================
function escMsg(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function loadMessages() {
  const box = document.getElementById('messagesList');
  if (!box) return;
  box.innerHTML = '<p class="messages-empty">cargando…</p>';
  try {
    const r = await fetch('/api/contact');
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error('api ' + r.status);
    if (!d.messages.length) {
      box.innerHTML = '<p class="messages-empty">todavía no hay mensajes. Cuando alguien use el formulario de tu página, aparecerán aquí.</p>';
      return;
    }
    box.innerHTML = d.messages.map(m => (
      '<article class="msg-card">' +
        '<div class="msg-head">' +
          '<strong>' + escMsg(m.name) + '</strong>' +
          '<a class="msg-email" href="mailto:' + escMsg(m.email) + '">' + escMsg(m.email) + '</a>' +
          '<span class="msg-date">' + escMsg(new Date(m.date).toLocaleString('es-CL')) + '</span>' +
          '<button type="button" class="msg-del" data-id="' + escMsg(m.id) + '" aria-label="Eliminar mensaje" title="Eliminar">×</button>' +
        '</div>' +
        '<p class="msg-text">' + escMsg(m.message) + '</p>' +
      '</article>'
    )).join('');
  } catch (e) {
    box.innerHTML = '<p class="messages-empty">no se pudo cargar. ¿La base de datos Vercel KV está creada y vinculada al proyecto?</p>';
  }
}

document.getElementById('messagesRefresh').addEventListener('click', loadMessages);
document.getElementById('messagesList').addEventListener('click', async (e) => {
  const btn = e.target.closest('.msg-del');
  if (!btn) return;
  try {
    await fetch('/api/contact', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: btn.dataset.id })
    });
  } catch (err) { /* si falla, se intenta igual recargar */ }
  loadMessages();
});

document.querySelectorAll('.admin-nav-item').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});
document.querySelectorAll('.quick-card').forEach(card => {
  card.addEventListener('click', () => activateTab(card.dataset.goto));
});

// ============================================
// LLENAR EL PANEL CON LOS DATOS
// ============================================
function populateAdminForm() {
  const brand = document.getElementById('shellBrandName');
  if (brand) brand.textContent = (data.hero.name || 'tu-nombre').trim().split(/\s+/).slice(0, 2).join('-') || 'tu-nombre';

  document.getElementById('aHeroName').value = data.hero.name;
  document.getElementById('aRoles').value = data.hero.roles.join('\n');
  document.getElementById('aTagline').value = data.hero.tagline;

  document.getElementById('aAbout1').value = data.about.p1;
  document.getElementById('aAbout2').value = data.about.p2;
  document.getElementById('aAvailability').value = data.about.availability;

  document.getElementById('aContactEmail').value = data.contact.email;
  document.getElementById('aContactGithub').value = data.contact.github;
  document.getElementById('aContactLinkedin').value = data.contact.linkedin;
  document.getElementById('aContactIntro').value = data.contact.intro;

  drawSkillsAdmin();
  drawProjectsGrid();
  drawFormationList();
  updateOverview();
}

function updateOverview() {
  const first = (data.hero.name || '').trim().split(/\s+/)[0];
  welcomeName.textContent = first || 'bienvenida';
  statProjects.textContent = data.projects.length;
  statFormation.textContent = data.formation.length;
  statSkills.textContent = data.skills.length;
}

// ============================================
// HABILIDADES — formulario generado
// ============================================
function drawSkillsAdmin() {
  const wrap = document.getElementById('aSkillsWrap');
  wrap.innerHTML = data.skills.map((s, i) =>
    '<div class="admin-skill-card">' +
      '<div class="admin-row">' +
        '<label for="askTitle' + i + '">Nombre de la categoría</label>' +
        '<input type="text" id="askTitle' + i + '" class="ask-title" data-i="' + i + '" value="' + esc(s.title) + '">' +
      '</div>' +
      '<div class="admin-row">' +
        '<label for="askTags' + i + '">Habilidades (una por línea)</label>' +
        '<textarea id="askTags' + i + '" class="ask-tags" data-i="' + i + '" rows="4">' + esc(s.tags.join('\n')) + '</textarea>' +
      '</div>' +
    '</div>'
  ).join('');
}

// ============================================
// PROYECTOS — grilla de tarjetas
// ============================================
function drawProjectsGrid() {
  if (!data.projects.length) {
    adminProjectGrid.innerHTML =
      '<div class="empty-state">' +
        '<p>Todavía no tienes proyectos</p>' +
        '<p>Pulsa "+ Nuevo proyecto" para agregar el primero.</p>' +
      '</div>';
    return;
  }
  adminProjectGrid.innerHTML = data.projects.map(p => {
    const image = p.image
      ? esc(p.image)
      : 'https://placehold.co/640x400/241627/ff9ecb?text=' + encodeURIComponent('Tu proyecto');
    const tags = (p.tags || []).slice(0, 3).map(t => '<span>' + esc(t) + '</span>').join('');
    return (
      '<div class="project-mini">' +
        '<div class="project-mini-media"><img src="' + image + '" alt="Captura de ' + esc(p.title) + '"></div>' +
        '<div class="project-mini-body">' +
          '<div class="project-mini-head"><h3>' + esc(p.title) + '</h3>' +
            (p.kind ? '<span>' + esc(p.kind) + '</span>' : '') +
          '</div>' +
          (tags ? '<div class="project-mini-tags">' + tags + '</div>' : '') +
          '<div class="project-mini-actions">' +
            '<button type="button" class="mini-edit" data-id="' + p.id + '">Editar</button>' +
            '<button type="button" class="mini-delete" data-id="' + p.id + '">Eliminar</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

adminProjectGrid.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.mini-edit');
  const delBtn = e.target.closest('.mini-delete');
  if (editBtn) {
    openProjectEditor(editBtn.getAttribute('data-id'));
    editorTitle.textContent = 'Editar proyecto';
    projectEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (delBtn) {
    const id = delBtn.getAttribute('data-id');
    if (confirm('¿Eliminar este proyecto? Se quitará de tu página.')) {
      data.projects = data.projects.filter(p => p.id !== id);
      saveData(data);
      drawProjectsGrid();
      updateOverview();
    }
  }
});

newProjectBtn.addEventListener('click', () => {
  openProjectEditor(null);
});
editorClose.addEventListener('click', closeProjectEditor);
adminProjectCancel.addEventListener('click', closeProjectEditor);

function openProjectEditor(id) {
  editingProjectId = id || null;
  uploadedImage = '';
  adminForm.reset();
  adminNote.textContent = '';
  if (editingProjectId) {
    const p = data.projects.find(x => x.id === editingProjectId);
    if (!p) return;
    editorTitle.textContent = 'Editar proyecto';
    adminTitleInput.value = p.title || '';
    adminKind.value = p.kind || '';
    adminDesc.value = p.desc || '';
    adminTags.value = (p.tags || []).join(', ');
    adminDemo.value = p.demo || '';
    adminCode.value = p.code || '';
    const isDataUrl = p.image && p.image.startsWith('data:');
    adminImageUrl.value = isDataUrl ? '' : (p.image || '');
    uploadedImage = isDataUrl ? p.image : '';
  } else {
    editorTitle.textContent = 'Nuevo proyecto';
  }
  projectEditor.hidden = false;
  updatePreview();
  projectEditor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => adminTitleInput.focus(), 200);
}

function closeProjectEditor() {
  projectEditor.hidden = true;
  editingProjectId = null;
  uploadedImage = '';
  adminForm.reset();
  adminNote.textContent = '';
}

// --- vista previa en vivo ---
function buildProjectCard(values) {
  const image = values.image
    ? esc(values.image)
    : 'https://placehold.co/640x400/241627/ff9ecb?text=' + encodeURIComponent('Tu proyecto');
  const tags = (values.tags || []).map(t => '<li>' + esc(t) + '</li>').join('');
  let links = '';
  if (values.demo) links += '<a href="' + esc(values.demo) + '">↗ Demo en vivo</a>';
  if (values.code) links += '<a href="' + esc(values.code) + '">Código fuente</a>';
  return (
    '<article class="project-card">' +
      '<div class="project-media"><img src="' + image + '" alt="Captura de ' + esc(values.title) + '"></div>' +
      '<div class="project-body">' +
        '<div class="project-head">' +
          '<h3>' + esc(values.title || 'Nombre del proyecto') + '</h3>' +
          (values.kind ? '<span class="project-kind">' + esc(values.kind) + '</span>' : '') +
        '</div>' +
        '<p>' + esc(values.desc) + '</p>' +
        (tags ? '<ul class="tag-list tag-list-sm">' + tags + '</ul>' : '') +
        (links ? '<div class="project-links">' + links + '</div>' : '') +
      '</div>' +
    '</article>'
  );
}

function updatePreview() {
  const tags = adminTags.value.split(',').map(t => t.trim()).filter(Boolean);
  editorPreview.innerHTML = buildProjectCard({
    title: adminTitleInput.value.trim(),
    kind: adminKind.value.trim(),
    desc: adminDesc.value.trim(),
    tags,
    demo: adminDemo.value.trim(),
    code: adminCode.value.trim(),
    image: uploadedImage || adminImageUrl.value.trim()
  });
}

[adminTitleInput, adminKind, adminDesc, adminTags, adminDemo, adminCode, adminImageUrl]
  .forEach(field => field.addEventListener('input', updatePreview));

// --- subir imagen (clic o arrastrar y soltar) ---
dropZone.addEventListener('click', (e) => {
  if (e.target !== adminImageUrl) adminImageFile.click();
});
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) readImageFile(file);
});

adminImageFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) readImageFile(file);
});

function readImageFile(file) {
  if (!file.type.startsWith('image/')) {
    adminNote.textContent = 'El archivo debe ser una imagen.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    uploadedImage = reader.result;
    adminNote.textContent = 'Imagen lista. Guarda para aplicarla.';
    updatePreview();
  };
  reader.readAsDataURL(file);
}

// --- guardar proyecto (nuevo o editado) ---
adminForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = adminTitleInput.value.trim();
  if (!title) {
    adminNote.textContent = 'Escribe el nombre del proyecto.';
    adminTitleInput.focus();
    return;
  }
  const tags = adminTags.value.split(',').map(t => t.trim()).filter(Boolean);
  const image = uploadedImage || adminImageUrl.value.trim();

  let msg;
  if (editingProjectId) {
    const p = data.projects.find(x => x.id === editingProjectId);
    if (p) Object.assign(p, {
      title,
      kind: adminKind.value.trim(),
      desc: adminDesc.value.trim(),
      tags,
      demo: adminDemo.value.trim(),
      code: adminCode.value.trim(),
      image
    });
    msg = 'Proyecto actualizado. Ya aparece así en tu página.';
  } else {
    data.projects.unshift({
      id: Date.now().toString(36),
      title,
      kind: adminKind.value.trim(),
      desc: adminDesc.value.trim(),
      tags,
      demo: adminDemo.value.trim(),
      code: adminCode.value.trim(),
      image
    });
    msg = '¡Proyecto agregado! Ya aparece en tu página.';
  }

  saveData(data);
  closeProjectEditor();
  drawProjectsGrid();
  updateOverview();
  adminNote.textContent = msg;
  setTimeout(() => { adminNote.textContent = ''; }, 4000);
});

// ============================================
// FORMACIÓN
// ============================================
function drawFormationList() {
  if (!data.formation.length) {
    adminFormationList.innerHTML =
      '<div class="empty-state">' +
        '<p>Todavía no hay formación</p>' +
        '<p>Agrega la primera con el formulario de abajo.</p>' +
      '</div>';
    return;
  }
  adminFormationList.innerHTML = data.formation.map(f =>
    '<div class="admin-item">' +
      '<div class="admin-item-main">' +
        '<strong>' + esc(f.title) + '</strong>' +
        '<small>' + esc(f.date) + (f.place ? ' · ' + esc(f.place) : '') + '</small>' +
      '</div>' +
      '<div class="admin-item-actions">' +
        '<button type="button" class="btn-edit" data-id="' + f.id + '">Editar</button>' +
        '<button type="button" class="btn-delete" data-id="' + f.id + '">Eliminar</button>' +
      '</div>' +
    '</div>'
  ).join('');
}

adminFormationList.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.btn-edit');
  const delBtn = e.target.closest('.btn-delete');
  if (editBtn) {
    startEditFormation(editBtn.getAttribute('data-id'));
    adminFormationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (delBtn) {
    const id = delBtn.getAttribute('data-id');
    if (confirm('¿Eliminar esta formación?')) {
      data.formation = data.formation.filter(f => f.id !== id);
      saveData(data);
      drawFormationList();
      updateOverview();
    }
  }
});

function startEditFormation(id) {
  const f = data.formation.find(x => x.id === id);
  if (!f) return;
  editingFormationId = id;
  document.getElementById('aFDate').value = f.date || '';
  document.getElementById('aFTitle').value = f.title || '';
  document.getElementById('aFPlace').value = f.place || '';
  document.getElementById('aFDesc').value = f.desc || '';
  formationFormTitle.textContent = 'Editar formación';
  adminFormationSubmit.textContent = 'Guardar cambios';
  adminFormationCancel.hidden = false;
  adminFormationNote.textContent = '';
}

function cancelEditFormation() {
  editingFormationId = null;
  adminFormationForm.reset();
  formationFormTitle.textContent = 'Agregar formación';
  adminFormationSubmit.textContent = 'Agregar formación';
  adminFormationCancel.hidden = true;
  adminFormationNote.textContent = '';
}
adminFormationCancel.addEventListener('click', cancelEditFormation);

adminFormationForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('aFTitle').value.trim();
  if (!title) {
    adminFormationNote.textContent = 'Escribe el título.';
    return;
  }
  const entry = {
    date: document.getElementById('aFDate').value.trim(),
    title,
    place: document.getElementById('aFPlace').value.trim(),
    desc: document.getElementById('aFDesc').value.trim()
  };

  let msg;
  if (editingFormationId) {
    const f = data.formation.find(x => x.id === editingFormationId);
    if (f) Object.assign(f, entry);
    msg = 'Formación actualizada.';
  } else {
    data.formation.unshift(Object.assign({ id: Date.now().toString(36) }, entry));
    msg = '¡Formación agregada!';
  }

  saveData(data);
  cancelEditFormation();
  drawFormationList();
  updateOverview();
  adminFormationNote.textContent = msg;
  setTimeout(() => { adminFormationNote.textContent = ''; }, 4000);
});

// ============================================
// GUARDAR TODOS LOS CAMBIOS
// ============================================
function collectAdminForm() {
  const name = document.getElementById('aHeroName').value.trim();
  if (name) data.hero.name = name;
  const roleLines = document.getElementById('aRoles').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (roleLines.length) data.hero.roles = roleLines;
  data.hero.tagline = document.getElementById('aTagline').value.trim();

  data.about.p1 = document.getElementById('aAbout1').value.trim();
  data.about.p2 = document.getElementById('aAbout2').value.trim();
  data.about.availability = document.getElementById('aAvailability').value.trim();

  document.querySelectorAll('.ask-title').forEach(inp => {
    data.skills[+inp.dataset.i].title = inp.value.trim();
  });
  document.querySelectorAll('.ask-tags').forEach(ta => {
    data.skills[+ta.dataset.i].tags = ta.value.split('\n').map(s => s.trim()).filter(Boolean);
  });

  data.contact.email = document.getElementById('aContactEmail').value.trim();
  data.contact.github = document.getElementById('aContactGithub').value.trim();
  data.contact.linkedin = document.getElementById('aContactLinkedin').value.trim();
  data.contact.intro = document.getElementById('aContactIntro').value.trim();
}

adminSave.addEventListener('click', () => {
  collectAdminForm();
  saveData(data);
  updateOverview();
  adminSaveNote.textContent = '¡Cambios guardados! Ya están en tu página (index.html).';
  setTimeout(() => { adminSaveNote.textContent = ''; }, 4000);
});