// ============================================
// DATOS DE LA PÁGINA (guardados en el navegador)
// ============================================
// Este archivo lo usan tanto index.html como admin.html.
// Todo el contenido editable vive en un solo objeto (portfolio_data)
// guardado en localStorage, y se dibuja desde él.

const DATA_KEY = 'portfolio_data';
const LEGACY_KEY = 'portfolio_user_projects'; // datos de un panel antiguo

const DEFAULT_ROLES = [
  'Estudiante de Ingeniería en Informática',
  'Especialización en Desarrollo de Software',
  'Full-Stack: React + Node.js',
  'Aprendiendo algo nuevo cada semana'
];

function defaultData() {
  return {
    hero: {
      name: 'Aileen Oyaneder',
      roles: [...DEFAULT_ROLES],
      tagline: 'Estudio Ingeniería en Informática con especialización en desarrollo de software. Construyo software con la misma atención con la que reviso un pull request: con calma, sin atajos y pensando en quien lo va a mantener después.'
    },
    about: {
      p1: 'Soy Aileen Oyaneder, estudiante de Ingeniería en Informática con especialización en desarrollo de software. Me concentro en el desarrollo web y en las buenas prácticas de ingeniería: me importa no solo escribir código que funcione, sino código que otra persona pueda leer, mantener y hacer crecer sin sufrir.',
      p2: 'Durante la carrera profundizo en el desarrollo full-stack, la arquitectura de APIs y las buenas prácticas de control de versiones y de trabajo en equipo (Git, metodologías ágiles). Fuera del código, me gusta [tu hobby / interés — ej: la fotografía, el ajedrez, los videojuegos indie].',
      availability: 'Disponible para trabajar — práctica profesional / part-time / proyectos'
    },
    skills: [
      { title: 'Lenguajes de programación', tags: ['Python', 'Java', 'JavaScript', 'SQL', 'HTML', 'CSS', 'C# (según el ramo)'] },
      { title: 'Frameworks', tags: ['React', 'Spring Boot (Java)', '.NET / ASP.NET', 'Node.js + Express'] },
      { title: 'Librerías', tags: ['Bootstrap', 'Tailwind CSS', 'Axios', 'Entity Framework', 'Hibernate', 'Pandas', 'NumPy'] },
      { title: 'Bases de datos', tags: ['SQL Server (principal)', 'MySQL', 'PostgreSQL', 'Bases de datos relacionales'] },
      { title: 'Cloud', tags: ['Microsoft Azure', 'Servicios cloud', 'Almacenamiento', 'Máquinas virtuales', 'DevOps'] },
      { title: 'Herramientas de desarrollo', tags: ['VS Code', 'Visual Studio', 'IntelliJ IDEA / NetBeans', 'Postman', 'Docker', 'Azure DevOps'] },
      { title: 'Control de versiones', tags: ['Git', 'GitHub'] },
      { title: 'Metodologías', tags: ['Scrum', 'Kanban', 'Metodologías ágiles'] },
      { title: 'Arquitectura de software', tags: ['Patrones de diseño', 'APIs REST', 'Microservicios (introducción)'] },
      { title: 'Testing y calidad', tags: ['Pruebas unitarias', 'Pruebas funcionales', 'Calidad de software'] },
      { title: 'Desarrollo móvil', tags: ['Android (Java / Kotlin)', 'Flutter / React Native'] }
    ],
    projects: [
      {
        id: 'catrian',
        title: 'Catrian Racing',
        kind: 'Proyecto Personal',
        desc: 'Sitio web de Catrian Racing: taller de motos, venta de motos y repuestos, mantención y preparación para competición. Incluye catálogo con precios, servicios, galería, testimonios, mapa de ubicación, cotización y agendamiento por WhatsApp.',
        tags: ['HTML', 'CSS', 'JavaScript', 'animaciones CSS (scroll-reveal', 'marquee', 'auto-scroll galería)', 'responsive design', 'consumir imágenes desde API externa (Openverse/Flickr)', 'formularios que abren WhatsApp', 'integración Google Maps', 'deployment con Vercel CLI', 'Git y npm.'],
        demo: 'https://catrianracing.vercel.app',
        code: 'https://github.com/krhisteel/catrian-racing',
        image: 'assets/catrian-racing.jpg'
      }
    ],
    formation: [
      { id: 'f1', date: '2022 — 2026', title: 'Ingeniería en Informática', place: '[Nombre de tu Universidad o Instituto]', desc: 'Estudiante de Ingeniería en Informática con especialización en desarrollo de software. Proyecto de título enfocado en desarrollo web full-stack.' },
      { id: 'f2', date: '2025', title: 'Certificación en Desarrollo Web Full-Stack', place: 'Plataforma online (ej. Coursera / Udemy / freeCodeCamp)', desc: 'Curso enfocado en JavaScript moderno, React y Node.js.' },
      { id: 'f3', date: '2024', title: 'Curso de Bases de Datos y SQL', place: 'Plataforma online', desc: 'Modelado relacional, consultas avanzadas y optimización.' }
    ],
    contact: {
      email: 'oyanederaileen77@gmail.com',
      github: 'https://github.com/krhisteel',
      linkedin: 'https://www.linkedin.com/in/aileen-oyaneder-b9610b353/',
      intro: 'Estoy buscando mi primera oportunidad como desarrolladora. Si tienes una vacante, un proyecto o simplemente quieres conversar de código, escríbeme.'
    }
  };
}

// combina lo guardado con los valores por defecto (por si faltan campos)
function normalizeData(raw) {
  const d = defaultData();
  if (!raw || typeof raw !== 'object') return d;
  return {
    hero: {
      name: (raw.hero && raw.hero.name) || d.hero.name,
      roles: (raw.hero && Array.isArray(raw.hero.roles) && raw.hero.roles.length) ? raw.hero.roles : d.hero.roles,
      tagline: (raw.hero && raw.hero.tagline) || d.hero.tagline
    },
    about: {
      p1: (raw.about && raw.about.p1) || d.about.p1,
      p2: (raw.about && raw.about.p2) || d.about.p2,
      availability: (raw.about && raw.about.availability) || d.about.availability
    },
    skills: Array.isArray(raw.skills) && raw.skills.length ? raw.skills.map((s, i) => ({
      title: (s && s.title) || (d.skills[i] && d.skills[i].title) || '',
      tags: (s && Array.isArray(s.tags)) ? s.tags : []
    })) : d.skills,
    projects: Array.isArray(raw.projects) ? raw.projects : d.projects,
    formation: Array.isArray(raw.formation) ? raw.formation : d.formation,
    contact: {
      email: (raw.contact && raw.contact.email) || d.contact.email,
      github: (raw.contact && raw.contact.github) || d.contact.github,
      linkedin: (raw.contact && raw.contact.linkedin) || d.contact.linkedin,
      intro: (raw.contact && raw.contact.intro) || d.contact.intro
    }
  };
}

function loadData() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(DATA_KEY)); } catch (e) { raw = null; }
  let d = normalizeData(raw);
  // actualiza solo si el navegador todavía tiene los textos de ejemplo (una versión anterior)
  if (d.hero.name === 'Tu Nombre Apellido' || d.formation[0] && d.formation[0].desc.indexOf('Egresada') !== -1) {
    const def = defaultData();
    d.hero = def.hero;
    d.about = def.about;
    if (d.formation[0] && d.formation[0].desc.indexOf('Egresada') !== -1) {
      d.formation[0].desc = def.formation[0].desc;
    }
  }
  // sustituye las habilidades antiguas (4 categorías genéricas) por la nueva lista
  const OLD_SKILL_TITLES = ['Lenguajes', 'Frameworks & Librerías', 'Bases de datos', 'Herramientas & Flujo de trabajo'];
  const isOldSkills = raw && Array.isArray(raw.skills) &&
    raw.skills.length === OLD_SKILL_TITLES.length &&
    OLD_SKILL_TITLES.every((t, i) => raw.skills[i] && raw.skills[i].title === t);
  if (isOldSkills) d.skills = defaultData().skills;
  // actualiza el contacto si el navegador tenía los valores de ejemplo
  if (raw && raw.contact) {
    const OLD_CONTACT = ['tu.correo@email.com', 'https://github.com/tu-usuario', 'https://linkedin.com/in/tu-usuario'];
    const oldFields = [raw.contact.email, raw.contact.github, raw.contact.linkedin];
    if (oldFields.some(v => OLD_CONTACT.indexOf(v) !== -1)) {
      d.contact = defaultData().contact;
    }
  }
  // migra los proyectos de un panel anterior, si existían
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (Array.isArray(legacy) && legacy.length) {
      d.projects = legacy.concat(d.projects);
      localStorage.removeItem(LEGACY_KEY);
    }
  } catch (e) { /* sin datos antiguos */ }
  return d;
}

function saveData(d) {
  localStorage.setItem(DATA_KEY, JSON.stringify(d));
}

// escapa caracteres especiales para no romper el HTML
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

let data = loadData();