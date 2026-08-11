// ============================================
// SCRIPT DE LA PÁGINA PRINCIPAL (index.html)
// ============================================
// Los datos los carga data.js (antes de este archivo en el HTML).

// ============================================
// 1. AÑO AUTOMÁTICO EN EL FOOTER
// ============================================
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================
// 2. EFECTO "MÁQUINA DE ESCRIBIR" EN EL HERO
// ============================================
// Las frases salen de los datos (puedes cambiarlas en admin.html).
let roles = [...DEFAULT_ROLES];

const typewriterEl = document.getElementById('typewriter');
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeTimer = null;

function typeLoop() {
  // Frase que se está escribiendo/borrando en este momento
  const currentRole = roles[roleIndex] || '';

  // Si estamos borrando, restamos una letra; si estamos escribiendo, sumamos una
  if (isDeleting) {
    charIndex--;
  } else {
    charIndex++;
  }

  // substring(0, charIndex) corta el texto hasta la letra actual, dando el efecto de tipeo
  typewriterEl.textContent = currentRole.substring(0, charIndex);

  // Borrar es más rápido (40ms) que escribir (80ms), como en una terminal real
  let delay = isDeleting ? 40 : 80;

  // Si terminamos de escribir la frase completa: hacemos una pausa larga y empezamos a borrar
  if (!isDeleting && charIndex === currentRole.length) {
    delay = 1800; // pausa al terminar de escribir
    isDeleting = true;
  // Si ya borramos toda la frase: pasamos a la siguiente frase del arreglo (o volvemos a la primera)
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length; // % hace que vuelva a 0 al llegar al final
    delay = 300;
  }

  // Se llama a sí misma después del "delay" calculado, creando el bucle infinito
  typeTimer = setTimeout(typeLoop, delay);
}

// Reinicia la máquina de escribir cuando cambian las frases
function restartTypewriter() {
  if (typeTimer) clearTimeout(typeTimer);
  typeTimer = null;
  typewriterEl.textContent = '';
  roleIndex = 0;
  charIndex = 0;
  isDeleting = false;
  if (prefersReducedMotion) {
    typewriterEl.textContent = roles[0] || '';
  } else {
    typeLoop();
  }
}

// Respeta a usuarios que prefieren menos animación
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  typewriterEl.textContent = roles[0];
} else {
  typeLoop();
}

// ============================================
// 3. ANIMACIÓN DE APARICIÓN AL HACER SCROLL
// ============================================
// Cualquier elemento con clase .reveal se anima cuando entra en pantalla.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // pequeño desfase entre elementos para un efecto en cascada
      setTimeout(() => {
        entry.target.classList.add('is-visible');
      }, i * 60);
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px'
});

// Observa los elementos .reveal (también los generados dinámicamente)
function observeReveals(container) {
  const scope = container || document;
  scope.querySelectorAll('.reveal:not(.is-visible)').forEach(el => revealObserver.observe(el));
}
observeReveals(document);

// ============================================
// 4. NAV: fondo sólido al hacer scroll + menú móvil
//    + barra de progreso de lectura + volver arriba
// ============================================
const nav = document.getElementById('nav');
const scrollProgress = document.getElementById('scrollProgress');
const backTop = document.getElementById('backTop');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
  if (scrollProgress) {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  if (backTop) backTop.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

if (backTop) {
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

// tema claro/oscuro
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    themeToggle.setAttribute('aria-pressed', t === 'light');
  };
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('portafolio-theme', next); } catch (e) {}
  });
}

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Cierra el menú móvil al hacer clic en un link
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// 5. FORMULARIO DE CONTACTO (API + base de datos Vercel KV
//    con copia al correo; respaldo por WhatsApp)
// ============================================
const WHATSAPP_NUMBER = '56936621284';
const WHATSAPP_NAME = 'Aileen Oyaneder';

const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

function openWhatsApp(name, email, message) {
  const body =
    'Hola ' + WHATSAPP_NAME + ', soy ' + name +
    ' (' + email + ').' +
    '\n\n' + message;
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
  formNote.textContent = '✓ Abriendo WhatsApp con tu mensaje…';
}

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  const btn = contactForm.querySelector('button[type="submit"]');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'enviando…';
  formNote.textContent = '';

  try {
    const r = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error('api ' + r.status);
    formNote.textContent = d.emailed
      ? '✓ Mensaje enviado. ¡Gracias por escribirme!'
      : '✓ Mensaje guardado. ¡Gracias por escribirme!';
    contactForm.reset();
  } catch (err) {
    openWhatsApp(name, email, message);
    contactForm.reset();
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
});

// ============================================
// 6. DIBUJAR LA PÁGINA DESDE LOS DATOS (data.js)
// ============================================
function renderHero() {
  const nameEl = document.getElementById('heroName');
  if (nameEl) nameEl.textContent = data.hero.name || 'Tu Nombre Apellido';
  const tagEl = document.getElementById('heroTagline');
  if (tagEl) tagEl.textContent = data.hero.tagline || '';
}

function renderAbout() {
  const box = document.getElementById('aboutText');
  if (!box) return;
  box.innerHTML =
    '<p>' + esc(data.about.p1) + '</p>' +
    '<p>' + esc(data.about.p2) + '</p>' +
    '<p class="about-status"><span class="status-dot"></span>' + esc(data.about.availability) + '</p>';
}

function renderSkills() {
  const wrap = document.getElementById('skillsGrid');
  if (!wrap) return;
  wrap.classList.add('skills-carousel');
  wrap.innerHTML = '<div class="skills-track">' + data.skills.map((s, i) => {
    const count = (s.tags || []).length;
    return '<div class="skill-card">' +
      '<span class="skill-glow"></span>' +
      '<div class="skill-card-head">' +
        '<span class="skill-badge">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3>' + esc(s.title) + '</h3>' +
      '</div>' +
      '<ul class="tag-list">' + (s.tags || []).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<div class="skill-card-foot"><span class="sk-com">// ' + count + ' tecnologías</span></div>' +
    '</div>';
  }).join('') + '</div>';
  setupSkillsCarousel(wrap);
}

function setupSkillsCarousel(wrap) {
  const track = wrap.querySelector('.skills-track');
  const cards = track.children;

  let perView = 3;
  const computePerView = () => {
    if (wrap.clientWidth < 560) perView = 1;
    else if (wrap.clientWidth < 920) perView = 2;
    else perView = 3;
  };
  const step = () => {
    const card = cards[0];
    return card ? card.offsetWidth + 20 : 0;
  };
  const maxScroll = () => Math.max(0, track.scrollWidth - wrap.clientWidth);
  const pages = () => Math.max(1, Math.ceil(cards.length / perView));

  const controls = document.createElement('div');
  controls.className = 'skills-controls';
  controls.innerHTML =
    '<button class="skill-arrow" id="skillPrev" aria-label="Anterior">‹</button>' +
    '<div class="skill-dots" id="skillDots"></div>' +
    '<button class="skill-arrow" id="skillNext" aria-label="Siguiente">›</button>';
  wrap.after(controls);
  const dotsWrap = controls.querySelector('.skill-dots');
  const prev = controls.querySelector('#skillPrev');
  const next = controls.querySelector('#skillNext');

  const goTo = page => {
    wrap.scrollTo({ left: Math.min(page * perView * step(), maxScroll()), behavior: 'smooth' });
  };
  const syncDots = () => {
    const s = step() || 1;
    const idx = Math.min(Math.round(wrap.scrollLeft / s), cards.length - 1);
    const page = Math.floor(idx / perView);
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === page));
  };
  const advance = () => {
    if (wrap.scrollLeft >= maxScroll() - 4) { goTo(0); return; }
    goTo(Math.floor((wrap.scrollLeft / step() || 0) / perView) + 1);
  };
  const back = () => {
    goTo(Math.max(0, Math.floor((wrap.scrollLeft / step() || 0) / perView) - 1));
  };
  const buildDots = () => {
    dotsWrap.innerHTML = '';
    for (let p = 0; p < pages(); p++) {
      const d = document.createElement('button');
      d.className = 'skill-dot';
      d.setAttribute('aria-label', 'Ir al grupo ' + (p + 1));
      d.addEventListener('click', () => goTo(p));
      dotsWrap.appendChild(d);
    }
  };

  prev.addEventListener('click', back);
  next.addEventListener('click', advance);

  let timer = null;
  const stopAuto = () => { if (timer) { clearInterval(timer); timer = null; } };
  const startAuto = () => {
    stopAuto();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = setInterval(advance, 4500);
  };
  wrap.addEventListener('mouseenter', stopAuto);
  wrap.addEventListener('mouseleave', startAuto);
  controls.addEventListener('mouseenter', stopAuto);
  controls.addEventListener('mouseleave', startAuto);
  wrap.addEventListener('scroll', syncDots, { passive: true });
  window.addEventListener('resize', () => { computePerView(); buildDots(); syncDots(); });

  computePerView();
  buildDots();
  syncDots();
  startAuto();
}

function projectCard(p) {
  const image = p.image
    ? esc(p.image)
    : 'https://placehold.co/640x400/241627/ff9ecb?text=' + encodeURIComponent('Tu proyecto');
  const tags = (p.tags || []).map(t => '<li>' + esc(t) + '</li>').join('');
  let links = '';
  if (p.demo) links += '<a href="' + esc(p.demo) + '" target="_blank" rel="noopener">↗ Demo en vivo</a>';
  if (p.code) links += '<a href="' + esc(p.code) + '" target="_blank" rel="noopener">Código fuente</a>';
  return (
    '<article class="project-card reveal"' + (p.demo && p.demo !== '#' ? ' data-demo="' + esc(p.demo) + '"' : '') + '>' +
      '<div class="project-media"><img src="' + image + '" alt="Captura de ' + esc(p.title) + '"></div>' +
      '<div class="project-body">' +
        '<div class="project-head">' +
          '<h3>' + esc(p.title) + '</h3>' +
          (p.kind ? '<span class="project-kind">' + esc(p.kind) + '</span>' : '') +
        '</div>' +
        '<p>' + esc(p.desc) + '</p>' +
        (tags ? '<ul class="tag-list tag-list-sm">' + tags + '</ul>' : '') +
        (links ? '<div class="project-links">' + links + '</div>' : '') +
      '</div>' +
    '</article>'
  );
}

function renderProjects() {
  const container = document.getElementById('userProjects');
  if (!container) return;
  container.innerHTML = data.projects.map(projectCard).join('');
  // toda la tarjeta abre el enlace demo al hacer clic (los botones internos no se afectan)
  container.onclick = (e) => {
    if (e.target.closest('a')) return;
    const card = e.target.closest('.project-card');
    if (!card || !card.dataset.demo) return;
    window.open(card.dataset.demo, '_blank', 'noopener');
  };
}

function renderFormation() {
  const list = document.getElementById('formationList');
  if (!list) return;
  const total = data.formation.length;
  list.innerHTML = data.formation.map((f, i) =>
    '<li class="timeline-item reveal">' +
      '<span class="timeline-dot"></span>' +
      '<div class="timeline-card">' +
        '<div class="timeline-head">' +
          '<span class="timeline-date">' + esc(f.date) + '</span>' +
          '<span class="timeline-num">' + String(i + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0') + '</span>' +
        '</div>' +
        '<h3>' + esc(f.title) + '</h3>' +
        '<p class="timeline-place"><span class="tl-at">@</span> ' + esc(f.place) + '</p>' +
        '<p class="timeline-desc">' + esc(f.desc) + '</p>' +
      '</div>' +
    '</li>'
  ).join('');
}

function renderContact() {
  const c = data.contact || {};
  const email = c.email || 'tu.correo@email.com';
  const setLink = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.href = value;
  };
  setLink('heroEmail', 'mailto:' + email);
  setLink('footerEmail', 'mailto:' + email);
  setLink('ctaEmail', 'mailto:' + email);
  setLink('heroGithub', c.github || 'https://github.com/tu-usuario');
  setLink('footerGithub', c.github || 'https://github.com/tu-usuario');
  setLink('heroLinkedin', c.linkedin || 'https://linkedin.com/in/tu-usuario');
  setLink('footerLinkedin', c.linkedin || 'https://linkedin.com/in/tu-usuario');
  setLink('cEmail', 'mailto:' + email);
  setLink('cGithub', c.github || 'https://github.com/tu-usuario');
  setLink('cLinkedin', c.linkedin || 'https://linkedin.com/in/tu-usuario');
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  const userOf = url => String(url || '').replace(/\/+$/, '').split('/').pop() || '';
  setText('cEmailText', email.replace(/^mailto:/, ''));
  setText('cGithubText', '@' + userOf(c.github || 'https://github.com/tu-usuario'));
  setText('cLinkedinText', '/in/' + userOf(c.linkedin || 'https://linkedin.com/in/tu-usuario'));
  const introEl = document.getElementById('contactIntro');
  if (introEl) introEl.textContent = c.intro || '';
}

function renderFooter() {
  const nameEl = document.getElementById('footerName');
  if (nameEl) nameEl.textContent = data.hero.name || 'Tu Nombre';
}

// contadores de perfil: calcula los números desde los datos reales
function renderStats() {
  const set = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.dataset.count = String(n);
  };
  const yearsRaw = (data.formation || []).map(f => (String(f.date).match(/\d{4}/g) || []).map(Number)).flat();
  const years = yearsRaw.length ? Math.max(...yearsRaw) - Math.min(...yearsRaw) : 0;
  const techs = new Set();
  (data.skills || []).forEach(s => (s.tags || []).forEach(t => techs.add(t)));
  set('statYears', years || 4);
  set('statProjects', (data.projects || []).length);
  set('statTechs', techs.size);
  set('statCerts', (data.formation || []).length);
}

// anima los contadores con cuenta ascendente cuando entran en pantalla
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.count || '0', 10);
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        const start = performance.now();
        const dur = 900;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });
}

// si el usuario cambió su nombre en el panel, también se refleja en el logo
function renderNavLogo() {
  const logoEl = document.getElementById('navLogoName');
  if (logoEl) {
    const firstWords = (data.hero.name || 'tu-nombre').trim().split(/\s+/).slice(0, 2).join('-').toLowerCase();
    logoEl.textContent = firstWords || 'tu-nombre';
  }
}

// actualiza las frases de la máquina de escribir si cambiaron
function syncRoles() {
  const newRoles = (data.hero.roles || []).filter(Boolean);
  if (newRoles.length && JSON.stringify(roles) !== JSON.stringify(newRoles)) {
    roles = newRoles;
    restartTypewriter();
  }
}

function renderAll() {
  renderHero();
  renderNavLogo();
  renderAbout();
  renderStats();
  renderSkills();
  renderProjects();
  renderFormation();
  renderContact();
  renderFooter();
  syncRoles();
  observeReveals();
  animateCounters();
}

// ============================================
// 8. FONDO: cielo estrellado rosado (constelación)
// ============================================
(function initStars() {
  const canvas = document.getElementById('bgStars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const colors = [
    '255,158,203',   // rosa suave
    '224,85,159',    // rosa profundo
    '255,204,229'    // rosa casi blanco
  ];
  let parts = [];
  let w = 0;
  let h = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(80, Math.floor(w * h / 22000));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vy: -(0.05 + Math.random() * 0.22),
      vx: (Math.random() - 0.5) * 0.12,
      tw: Math.random() * Math.PI * 2,
      sp: 0.01 + Math.random() * 0.03,
      a: 0.35 + Math.random() * 0.5,
      c: colors[Math.floor(Math.random() * colors.length)]
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const lineDist = 110;
    // líneas tipo constelación
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x;
        const dy = parts[i].y - parts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < lineDist) {
          ctx.strokeStyle = 'rgba(255,158,203,' + (0.14 * (1 - d / lineDist)).toFixed(3) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(parts[i].x, parts[i].y);
          ctx.lineTo(parts[j].x, parts[j].y);
          ctx.stroke();
        }
      }
    }
    // estrellas
    for (const p of parts) {
      p.tw += p.sp;
      const blink = 0.55 + 0.45 * Math.sin(p.tw);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * blink).toFixed(3) + ')';
      ctx.fill();
    }
  }

  function move() {
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
    }
  }

  function loop() {
    move();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  resize();
  if (reduced) {
    draw();
  } else {
    loop();
  }
})();
renderAll();