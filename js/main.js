// ---------- NAVEGACIÓN POR PESTAÑAS ----------
// Solo una sección visible a la vez (incluye la portada como una "sección" más).
// Los gráficos de Chart.js que estaban ocultos (display:none) necesitan un
// resize() al mostrarse, porque el canvas no tiene tamaño real mientras está oculto.
const tabButtons = document.querySelectorAll('[data-target]');
const sections = document.querySelectorAll('.section');

function goToSection(target) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('navbar-link--active', b.dataset.target === target);
  });

  sections.forEach(sec => sec.classList.toggle('active', sec.id === target));

  requestAnimationFrame(() => {
    const activeSection = document.getElementById(target);
    if (!activeSection) return;
    activeSection.querySelectorAll('canvas').forEach(canvas => {
      const chart = window.Chart && Chart.getChart(canvas);
      if (chart) chart.resize();
    });
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => goToSection(btn.dataset.target));
});

// ---------- REACCIONES POR SECCIÓN ----------
// Contador local por dispositivo (no compartido entre asistentes: no hay backend).
document.querySelectorAll('.reaction-btn').forEach(btn => {
  let count = parseInt(btn.dataset.count || '0', 10);
  btn.addEventListener('click', () => {
    count++;
    btn.querySelector('.count').textContent = count;
    btn.classList.add('just-clicked');
    setTimeout(() => btn.classList.remove('just-clicked'), 400);
  });
});