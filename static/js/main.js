/* ══════════════════════════════════════
   Portfolio JS — main.js
══════════════════════════════════════ */

// ── CURSOR ──────────────────────────────
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});
function animateTrail() {
  trailX += (mouseX - trailX) * 0.12;
  trailY += (mouseY - trailY) * 0.12;
  cursorTrail.style.left = trailX + 'px';
  cursorTrail.style.top = trailY + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();

// ── NAV SCROLL ──────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── HAMBURGER ──────────────────────────
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('mobile-open');
});

// ── REVEAL ON SCROLL ──────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 80);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revealObserver.observe(el));

// ── COUNTER ANIMATION ──────────────────
const counters = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current;
        if (current >= target) clearInterval(timer);
      }, 30);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

// ── SKILL BAR ANIMATION ──────────────
const skillBars = document.querySelectorAll('.skill-fill');
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animated');
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
skillBars.forEach(bar => skillObserver.observe(bar));

// ── YEAR ──────────────────────────────
document.getElementById('year').textContent = new Date().getFullYear();

// ══ PROJECTS ════════════════════════════
let allProjects = [];
let activeFilter = 'all';

async function fetchProjects() {
  try {
    // Seed on first load
    await fetch('/api/seed', { method: 'POST' });
    const res = await fetch('/api/projects');
    allProjects = await res.json();
    renderProjects(allProjects);
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    document.getElementById('projectsGrid').innerHTML =
      '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem">Could not load projects. Check your MongoDB connection.</p>';
  }
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  if (!projects.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:3rem">No projects found. Add one!</p>';
    return;
  }
  grid.innerHTML = projects.map(p => createProjectCard(p)).join('');
  // Attach delete handlers
  grid.querySelectorAll('.card-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProject(btn.dataset.id));
  });
}

function createProjectCard(p) {
  const tech = (p.tech_stack || []).map(t => `<span class="tech-pill">${t}</span>`).join('');
  const featured = p.featured ? '<span class="card-featured-badge">★ Featured</span>' : '';
  const github = p.github_url ? `<a href="${p.github_url}" target="_blank" class="card-link"><span class="card-link-icon">🐙</span> GitHub</a>` : '';
  const live = p.live_url ? `<a href="${p.live_url}" target="_blank" class="card-link"><span class="card-link-icon">🔗</span> Live Demo</a>` : '';
  return `
    <div class="project-card ${p.featured ? 'featured' : ''}" data-category="${p.category || 'Other'}">
      <div class="card-top">
        <span class="card-category">${p.category || 'Other'}</span>
        ${featured}
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-desc">${p.description}</p>
        <div class="card-tech">${tech}</div>
        <div class="card-links">
          ${github}
          ${live}
          <button class="card-delete" data-id="${p._id}" title="Delete project">✕ Delete</button>
        </div>
      </div>
    </div>
  `;
}

// ── FILTER ──────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    const filtered = activeFilter === 'all'
      ? allProjects
      : allProjects.filter(p => p.category === activeFilter);
    renderProjects(filtered);
  });
});

// ── DELETE PROJECT ──────────────────────
async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    allProjects = allProjects.filter(p => p._id !== id);
    const filtered = activeFilter === 'all'
      ? allProjects
      : allProjects.filter(p => p.category === activeFilter);
    renderProjects(filtered);
  } catch (err) {
    alert('Failed to delete project.');
  }
}

// ══ ADD PROJECT MODAL ═══════════════════
const modalOverlay = document.getElementById('modalOverlay');
const addProjectBtn = document.getElementById('addProjectBtn');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');

function openModal() { modalOverlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal() { modalOverlay.classList.remove('open'); document.body.style.overflow = ''; }

addProjectBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

document.getElementById('saveProjectBtn').addEventListener('click', async () => {
  const title = document.getElementById('pTitle').value.trim();
  const desc = document.getElementById('pDesc').value.trim();
  const tech = document.getElementById('pTech').value.trim();
  const msg = document.getElementById('formMsg');

  if (!title || !desc || !tech) {
    msg.className = 'form-msg error';
    msg.textContent = 'Please fill in Title, Description, and Tech Stack.';
    return;
  }

  const project = {
    title,
    description: desc,
    tech_stack: tech.split(',').map(t => t.trim()).filter(Boolean),
    category: document.getElementById('pCategory').value,
    github_url: document.getElementById('pGithub').value.trim(),
    live_url: document.getElementById('pLive').value.trim(),
    featured: document.getElementById('pFeatured').checked
  };

  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    const data = await res.json();
    if (res.ok) {
      allProjects.unshift(data.project);
      renderProjects(activeFilter === 'all' ? allProjects : allProjects.filter(p => p.category === activeFilter));
      msg.className = 'form-msg success';
      msg.textContent = '🎉 Project added successfully!';
      // Reset form
      ['pTitle','pDesc','pTech','pGithub','pLive'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('pFeatured').checked = false;
      setTimeout(closeModal, 1500);
    } else {
      throw new Error(data.error || 'Failed');
    }
  } catch (err) {
    msg.className = 'form-msg error';
    msg.textContent = 'Failed to add project. Try again.';
  }
});

// ══ CONTACT FORM ═══════════════════════
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('contactMsg');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const message = document.getElementById('cMessage').value.trim();

  if (!name || !email || !message) {
    msg.className = 'contact-msg error';
    msg.textContent = 'Please fill in all required fields.';
    return;
  }

  submitBtn.textContent = 'Sending…';
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        subject: document.getElementById('cSubject').value.trim(),
        message
      })
    });
    const data = await res.json();
    if (res.ok) {
      msg.className = 'contact-msg success';
      msg.textContent = '✉️ ' + data.message;
      e.target.reset();
    } else {
      throw new Error();
    }
  } catch {
    msg.className = 'contact-msg error';
    msg.textContent = 'Something went wrong. Please try again.';
  } finally {
    submitBtn.textContent = 'Send Message →';
    submitBtn.disabled = false;
  }
});

// ── CV DOWNLOAD (placeholder) ──────────
document.getElementById('downloadCV').addEventListener('click', e => {
  e.preventDefault();
  alert('CV download link not set yet. Update the href in the About section!');
});

// ── SMOOTH SCROLL ──────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── INIT ───────────────────────────────
fetchProjects();