console.log('%c✅ charts.js v10 cargada (Spoiler con FM/NOF)', 'background:#0b6b3a;color:#fff;padding:4px 8px;border-radius:4px;');

// ============================================================
// PALETA (misma identidad AFINLAB)
// ============================================================
const COLOR = {
  verde: '#0b6b3a',
  verdeOscuro: '#0a4d2c',
  verdeClaro: '#6fae8c',
  azulMarino: '#0f2942',
  azulMedio: '#163a5c',
  terracota: '#a0522d',
  terracotaClaro: '#c98a63',
  dorado: '#b8860b',
  gris: '#8a94a6',
  bio: '#7fae8c',
  comercial: '#c98a63',
};
const EMPRESAS_COLOR = {
  'CARTAVIO': '#0b6b3a',
  'SAN JACINTO': '#6b7a3a',
  'CASA GRANDE': '#6b4c86',
  'PARAMONGA': '#a0522d',
  'LAREDO': '#3a6b7a',
};

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#4a5568';

let DATA = null;

async function loadData() {
  const res = await fetch('js/data.json');
  DATA = await res.json();
  buildAllCharts();
}
loadData();

function fmt(n, dec = 1) {
  return Number(n).toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// Plugin genérico: dibuja rectángulos de fondo (para cuadrantes / fases)
function zonePlugin(zones) {
  return {
    id: 'zonePlugin_' + Math.random(),
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      zones.forEach(z => {
        ctx.save();
        ctx.fillStyle = z.color;
        const x1 = z.x1 !== undefined ? scales.x.getPixelForValue(z.x1) : chartArea.left;
        const x2 = z.x2 !== undefined ? scales.x.getPixelForValue(z.x2) : chartArea.right;
        const y1 = z.y1 !== undefined ? scales.y.getPixelForValue(z.y1) : chartArea.top;
        const y2 = z.y2 !== undefined ? scales.y.getPixelForValue(z.y2) : chartArea.bottom;
        ctx.fillRect(Math.min(x1,x2), Math.min(y1,y2), Math.abs(x2-x1), Math.abs(y2-y1));
        ctx.restore();
      });
    }
  };
}

function buildAllCharts() {
  chartSpoiler_fmNof();
  chartCceAjustado();
  chartFcoSectorial();
  chartActivoCorriente();
  chartNofComposicion();
  chartPrecioAzucar();
  chartDobleEntrada();
  chartEbitFcoDesacople();
  chartElNino();
  chartPandemia();
  chartImpuesto2021();
  chartEspejismo2021();
  chartDestinoCaja();
  chartDesalineamiento();
  chartPruebaAcida2Def();
  chartComposicionPasivo();
  chartCostoDeuda();
  chartRoicEva();
  chartControlTemporal();
  chartControlTransversal();
  chartDiscordancia();
  chartContrafactualParamonga();
}

// ---------- Sistema 1 · A. CCE Ajustado: descomposición bio vs comercial (2014 vs 2025) ----------
function chartCceAjustado() {
  const ctx = document.getElementById('chart-cce-ajustado').getContext('2d');
  const d = DATA.cce_ajustado;
  const anios = ['2014', '2025'];
  const bio = anios.map(a => d[a].bio);
  const comercial = anios.map(a => d[a].comercial);

  const labelsPlugin = {
    id: 'cceAjustadoLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      anios.forEach((a, i) => {
        const metaBio = chart.getDatasetMeta(0).data[i];
        const metaCom = chart.getDatasetMeta(1).data[i];
        const total = d[a].total;
        const midComY = (metaCom.y + metaBio.y) / 2;
        const barHalfWidth = (metaBio.width || 60) / 2;

        // Total, siempre arriba del tope de la barra
        ctx.font = '700 13px Inter, sans-serif';
        ctx.fillStyle = COLOR.azulMarino;
        ctx.textAlign = 'center';
        ctx.fillText(total + ' d', metaCom.x, metaCom.y - 14);

        // Segmento comercial: SIEMPRE afuera, a la derecha, con línea guía (evita solapes sea cual sea el grosor)
        const lineStartX = metaCom.x + barHalfWidth;
        const labelX = lineStartX + 34;
        ctx.strokeStyle = COLOR.terracota;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lineStartX, midComY);
        ctx.lineTo(labelX - 4, midComY);
        ctx.stroke();
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillStyle = COLOR.terracota;
        ctx.textAlign = 'left';
        ctx.fillText(d[a].comercial + ' d', labelX, midComY + 4);

        // Segmento bio (dentro de la barra, en blanco)
        ctx.font = '700 13px Inter, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(d[a].bio + ' d', metaBio.x, metaBio.y + (chart.chartArea.bottom - metaBio.y) / 2);
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('PAB = ' + d[a].pab_pct + '% del ciclo', metaBio.x, metaBio.y + (chart.chartArea.bottom - metaBio.y) / 2 + 16);
      });
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: anios,
      datasets: [
        { label: 'Período de Activos Biológicos', data: bio, backgroundColor: COLOR.bio, stack: 's' },
        { label: 'Ciclo comercial (financiado con recursos propios)', data: comercial, backgroundColor: COLOR.terracota, stack: 's' },
      ]
    },
    plugins: [labelsPlugin],
    options: {
      responsive: true,
      layout: { padding: { top: 44, right: 100, left: 40 } },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw} días` } }
      },
      scales: {
        y: { title: { display: true, text: 'días' }, min: 0, max: 600 }
      }
    }
  });
}

// ---------- Sistema 1 · B. FCO sectorial 2015-2025 (suma de las 5 empresas) ----------
function chartFcoSectorial() {
  const ctx = document.getElementById('chart-fco-sectorial').getContext('2d');
  const anios = DATA.anios.filter(a => a !== 2014); // 2014 no tiene FCO (año base)
  const empresas = Object.keys(DATA.empresas);
  const fcoSector = anios.map(a => {
    const i = DATA.anios.indexOf(a);
    return empresas.reduce((sum, e) => sum + DATA.empresas[e]['FCO'][i], 0);
  });
  const minIdx = fcoSector.indexOf(Math.min(...fcoSector));
  const maxIdx = fcoSector.indexOf(Math.max(...fcoSector));
  const ebitIdx = anios.indexOf(2017);

  // Plugin: líneas verticales + etiquetas para mínimo, máximo y el punto EBIT-79.7%
  const fcoAnnotationsPlugin = {
    id: 'fcoAnnotationsPlugin',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      ctx.save();
      const drawLine = (idx, label, color, labelY, align) => {
        const x = scales.x.getPixelForValue(idx);
        const yTop = chartArea.top + labelY;
        const yBar = scales.y.getPixelForValue(fcoSector[idx]);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, yTop + 4);
        ctx.lineTo(x, yBar);
        ctx.stroke();
        ctx.font = 'italic 600 11px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = align || 'center';
        const tx = align === 'left' ? x - 4 : align === 'right' ? x + 4 : x;
        ctx.fillText(label, tx, yTop - 4);
      };
      // Alturas escalonadas y alineación hacia los costados para que las 3 etiquetas no se pisen
      drawLine(minIdx, 'mínimo de la serie', COLOR.terracota, 16, 'left');
      drawLine(ebitIdx, 'EBIT −79.7% y la caja aguantó', COLOR.gris, 36, 'center');
      drawLine(maxIdx, 'máximo de la serie', COLOR.verdeOscuro, 16, 'right');
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: anios,
      datasets: [{
        label: 'FCO sectorial',
        data: fcoSector,
        backgroundColor: COLOR.verdeOscuro,
        borderRadius: 4
      }]
    },
    plugins: [fcoAnnotationsPlugin],
    options: {
      responsive: true,
      layout: { padding: { top: 50 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `FCO: S/ ${fmt(c.raw,0)} miles` } }
      },
      scales: { y: { title: { display: true, text: 'S/ miles' } } }
    }
  });

  buildFcoObservationsStrip(anios, empresas);
}

// Franja de observaciones: por año, una barrita por empresa (verde = FCO positivo, roja = negativo)
function buildFcoObservationsStrip(anios, empresas) {
  const cont = document.getElementById('fco-strip');
  if (!cont) return;
  let html = '';
  anios.forEach(a => {
    const i = DATA.anios.indexOf(a);
    html += '<div class="fco-obs-year">';
    empresas.forEach(e => {
      const v = DATA.empresas[e]['FCO'][i];
      const cls = v < 0 ? 'fco-obs-bar neg' : 'fco-obs-bar';
      html += `<div class="${cls}" title="${e} ${a}: S/ ${fmt(v,0)} miles"></div>`;
    });
    html += '</div>';
  });
  cont.innerHTML = html;
}

// ---------- Sistema 1 · D. Composición del activo corriente sectorial 2025 (barra horizontal 100%) ----------
function chartActivoCorriente() {
  const ctx = document.getElementById('chart-activo-corriente').getContext('2d');
  const ac = DATA.activo_corriente_2025;
  const total = ac.total;
  const partes = [
    { key: 'activo_biologico', label: 'Activo biológico', color: COLOR.bio },
    { key: 'cuentas_por_cobrar', label: 'Cuentas por cobrar', color: '#d9d3c7' },
    { key: 'inventarios', label: 'Inventarios', color: '#e4ded2' },
    { key: 'resto', label: 'Resto', color: '#ece7dd' },
    { key: 'efectivo', label: 'Efectivo', color: COLOR.terracota },
  ];
  const pcts = partes.map(p => ac[p.key] / total * 100);

  const labelsPlugin = {
    id: 'activoCorrienteLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      ctx.save();
      const meta = chart.getDatasetMeta(0);
      partes.forEach((p, i) => {
        const bar = meta.data[i];
        if (!bar) return;
        const cx = (bar.base + bar.x) / 2;
        // % dentro de la barra
        ctx.font = '700 13px Inter, sans-serif';
        ctx.fillStyle = (p.key === 'efectivo' || p.key === 'activo_biologico') ? '#fff' : COLOR.azulMarino;
        ctx.textAlign = 'center';
        if (pcts[i] >= 6) ctx.fillText(fmt(pcts[i],1) + '%', cx, bar.y + 4);
        // Nombre + cifra en soles debajo de la barra
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillStyle = COLOR.azulMarino;
        ctx.fillText(p.label, cx, bar.y + 24);
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillStyle = COLOR.gris;
        ctx.fillText('S/ ' + fmt(ac[p.key],0), cx, bar.y + 38);
      });
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['2025'],
      datasets: partes.map(p => ({
        label: p.label,
        data: [ac[p.key]],
        backgroundColor: p.color,
        borderColor: p.key === 'cuentas_por_cobrar' || p.key === 'inventarios' || p.key === 'resto' ? 'rgba(0,0,0,0.06)' : 'transparent',
        borderWidth: 1,
      }))
    },
    plugins: [labelsPlugin],
    options: {
      indexAxis: 'y',
      responsive: true,
      layout: { padding: { top: 4, bottom: 48 } },
      scales: {
        x: { stacked: true, display: false, min: 0, max: total },
        y: { stacked: true, display: false }
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: S/ ${fmt(c.raw,0)} miles (${fmt(c.raw/total*100,1)}%)` } }
      }
    }
  });
}

// ---------- Sistema 1 · E. NOF: composición sectorial completa 2015-2025 (6 partidas canónicas) ----------
function chartNofComposicion() {
  const ctx = document.getElementById('chart-nof-composicion').getContext('2d');
  const c = DATA.nof_componentes_full;
  const anios = c.anios;
  const nofNeta = anios.map(a => DATA.nof_sector_miles[DATA.anios.indexOf(a)]);

  const proveedoresNeg = c.proveedores.map(v => -v);
  const beneficiosNeg = c.beneficios_provisiones.map(v => -v);

  const pisoLinePlugin = {
    id: 'pisoLinePlugin',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const y = scales.y.getPixelForValue(402103);
      ctx.save();
      ctx.strokeStyle = COLOR.terracota;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  };

  new Chart(ctx, {
    data: {
      labels: anios,
      datasets: [
        { type: 'bar', label: 'Activo biológico', data: c.activo_biologico, backgroundColor: COLOR.bio, stack: 'pos', order: 2 },
        { type: 'bar', label: 'Inventarios', data: c.inventarios, backgroundColor: '#c9a877', stack: 'pos', order: 2 },
        { type: 'bar', label: 'CxC comerciales', data: c.cxc_comerciales, backgroundColor: COLOR.verdeClaro, stack: 'pos', order: 2 },
        { type: 'bar', label: 'Pagos anticipados', data: c.pagos_anticipados, backgroundColor: '#d8d8d8', stack: 'pos', order: 2 },
        { type: 'bar', label: '(−) Proveedores', data: proveedoresNeg, backgroundColor: COLOR.verdeOscuro, stack: 'neg', order: 2 },
        { type: 'bar', label: '(−) Beneficios y provisiones', data: beneficiosNeg, backgroundColor: COLOR.gris, stack: 'neg', order: 2 },
        { type: 'line', label: 'NOF neta', data: nofNeta, borderColor: '#1a1a1a', backgroundColor: '#1a1a1a', tension: 0.15, pointRadius: 5, pointBackgroundColor: '#fff', pointBorderWidth: 2, borderWidth: 2.4, order: 0 },
      ]
    },
    plugins: [pisoLinePlugin],
    options: {
      responsive: true,
      layout: { padding: { top: 10, right: 10 } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10.5 } } },
        tooltip: {
          callbacks: {
            label: (c) => `${c.dataset.label}: S/ ${fmt(Math.abs(c.raw),0)} miles`,
            afterBody: (items) => {
              const esLineaNof = items.some(it => it.dataset.label === 'NOF neta');
              return esLineaNof ? ['Piso estructural: S/ 402,103 miles'] : [];
            }
          }
        }
      },
      scales: {
        y: { title: { display: true, text: 'S/ miles' } }
      }
    }
  });
}

// ---------- Sistema 2 · A. Precio internacional del azúcar 2020-2025 ----------
function chartPrecioAzucar() {
  const ctx = document.getElementById('chart-precio-azucar').getContext('2d');
  const precios = DATA.precio_azucar_ton;
  const anios = Object.keys(precios);
  const valores = anios.map(a => precios[a]);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: anios,
      datasets: [{ label: 'Precio internacional del azúcar', data: valores, borderColor: COLOR.terracota, backgroundColor: COLOR.terracota, tension: 0.15, pointRadius: 5, borderWidth: 3 }]
    },
    plugins: [zonePlugin([
      { x1: anios[0], x2: '2023', y1: -1e9, y2: 1e9, color: 'rgba(11,107,58,0.06)' },
      { x1: '2023', x2: anios[anios.length-1], y1: -1e9, y2: 1e9, color: 'rgba(160,82,45,0.06)' },
    ])],
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `US$ ${fmt(c.raw,0)} / tonelada` } }
      },
      scales: {
        y: { title: { display: true, text: 'US$ por tonelada' } }
      }
    }
  });
}

// ---------- Sistema 2 · B. Doble entrada: CVRAB/UN (izq) y Bio/NOF (der) ----------
function chartDobleEntrada() {
  const d = DATA.doble_entrada;

  // Panel izquierdo: CVRAB / Utilidad Neta sectorial, todos los años
  const ctx1 = document.getElementById('chart-cvrab-un').getContext('2d');
  const anios1 = Object.keys(d.cvrab_un_pct);
  const vals1 = anios1.map(a => d.cvrab_un_pct[a]);
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: anios1,
      datasets: [{ data: vals1, backgroundColor: vals1.map(v => v >= 0 ? COLOR.verdeOscuro : COLOR.terracota) }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${fmt(c.raw,1)}%` } }
      },
      scales: {
        x: { ticks: { font: { size: 9 } } },
        y: { title: { display: true, text: '%' } }
      }
    }
  });

  // Panel derecho: Activo biológico / NOF, 2015-2025, con banda 70-90%
  const ctx2 = document.getElementById('chart-bio-nof').getContext('2d');
  const anios2 = Object.keys(d.bio_nof_pct);
  const vals2 = anios2.map(a => d.bio_nof_pct[a]);
  new Chart(ctx2, {
    type: 'line',
    data: {
      labels: anios2,
      datasets: [{ data: vals2, borderColor: COLOR.bio, backgroundColor: 'rgba(127,174,140,0.42)', fill: 'origin', tension: 0.25, pointRadius: 3 }]
    },
    plugins: [zonePlugin([{ y1: 70, y2: 90, color: 'rgba(0,0,0,0.05)' }])],
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${fmt(c.raw,1)}%` } }
      },
      scales: {
        x: { ticks: { font: { size: 9 } } },
        y: { min: 0, max: 110, title: { display: true, text: '%' } }
      }
    }
  });
}

// ---------- Sistema 2 · C. Desacople EBIT vs FCO sectorial 2015-2025 ----------
function chartEbitFcoDesacople() {
  const ctx = document.getElementById('chart-ebit-fco').getContext('2d');
  const ebit = DATA.ebit_sectorial;
  const anios = Object.keys(ebit);
  const ebitVals = anios.map(a => ebit[a]);
  const empresas = Object.keys(DATA.empresas);
  const fco = anios.map(a => {
    const i = DATA.anios.indexOf(Number(a));
    return empresas.reduce((sum, e) => sum + DATA.empresas[e]['FCO'][i], 0);
  });

  const calloutPlugin = {
    id: 'ebitFcoCallout',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.font = '600 10.5px Inter, sans-serif';
      ctx.fillStyle = COLOR.gris;
      ctx.textAlign = 'left';
      const text = 'En 14 de las 50 transiciones interanuales empresa-año (28.0%) el EBIT';
      const text2 = 'y el FCO se movieron en direcciones opuestas.';
      const w = Math.max(ctx.measureText(text).width, ctx.measureText(text2).width) + 24;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(chartArea.left + 8, chartArea.top + 8, w, 44);
      ctx.fillStyle = COLOR.azulMarino;
      ctx.fillText(text, chartArea.left + 20, chartArea.top + 28);
      ctx.fillText(text2, chartArea.left + 20, chartArea.top + 44);
      ctx.restore();
    }
  };

  new Chart(ctx, {
    data: {
      labels: anios,
      datasets: [
        { type: 'line', label: 'EBIT sectorial', data: ebitVals, borderColor: COLOR.verdeOscuro, backgroundColor: COLOR.verdeOscuro, tension: 0.15, pointRadius: 4, borderWidth: 2.6 },
        { type: 'line', label: 'FCO sectorial (años publicados)', data: fco, borderColor: COLOR.terracota, backgroundColor: COLOR.terracota, borderDash: [6,3], tension: 0.15, pointRadius: 4, pointStyle: 'rect', borderWidth: 2.2 },
      ]
    },
    plugins: [calloutPlugin],
    options: {
      responsive: true,
      layout: { padding: { top: 10 } },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: S/ ${fmt(c.raw,0)} miles` } }
      },
      scales: {
        y: { min: 0, title: { display: true, text: 'S/ miles' } }
      }
    }
  });
}

// ---------- Sistema 2 · D. El Niño: variación del activo biológico corriente por empresa ----------
function chartElNino() {
  const nombreBonito = e => e.charAt(0) + e.slice(1).toLowerCase().replace(/ (\w)/g, (m, c) => ' ' + c.toUpperCase());

  function panel(canvasId, dataObj) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const empresas = Object.keys(dataObj).sort((a,b) => dataObj[a] - dataObj[b]);
    const vals = empresas.map(e => dataObj[e]);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: empresas.map(nombreBonito),
        datasets: [{ data: vals, backgroundColor: vals.map(v => v >= 0 ? COLOR.verdeOscuro : COLOR.terracota) }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw >= 0 ? '+' : ''}${fmt(c.raw,2)}%` } }
        },
        scales: {
          x: { min: -45, max: 26, title: { display: true, text: 'Variación anual (%)' } }
        }
      }
    });
  }

  panel('chart-nino-2017', DATA.el_nino['2017']);
  panel('chart-nino-2023', DATA.el_nino['2023']);
}

// ---------- Sistema 2 · E. Pandemia: contraste + dispersión de liquidez ----------
function chartPandemia() {
  const p = DATA.pandemia;

  // Panel superior: 3 barras (Producción, Utilidad neta, D/E)
  const ctx1 = document.getElementById('chart-pandemia-kpi').getContext('2d');
  const barras = [
    { label: 'Producción nacional de azúcar', val: p.produccion_nacional_pct, unidad: '%', color: COLOR.terracota },
    { label: 'Utilidad neta sectorial', val: p.utilidad_neta_pct, unidad: '%', color: COLOR.verdeOscuro },
    { label: 'D/E agregado (2020 vs 2019)', val: p.de_agregado_diff_pp, unidad: ' pp', color: COLOR.gris },
  ];
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: barras.map(b => b.label),
      datasets: [{ data: barras.map(b => b.val), backgroundColor: barras.map(b => b.color) }]
    },
    plugins: [{
      id: 'pandemiaValueLabels',
      afterDatasetsDraw(chart) {
        const { ctx, scales } = chart;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        const zeroY = scales.y.getPixelForValue(0);
        meta.data.forEach((bar, i) => {
          const b = barras[i];
          const text = `${b.val >= 0 ? '+' : ''}${fmt(b.val,2)}${b.unidad}`;
          ctx.fillStyle = b.color;
          // Si la barra es muy chica visualmente, la etiqueta se ancla junto a la línea de cero
          const y = Math.abs(bar.y - zeroY) < 14
            ? (b.val >= 0 ? zeroY - 14 : zeroY + 22)
            : (b.val >= 0 ? bar.y - 10 : bar.y + 22);
          ctx.fillText(text, bar.x, y);
        });
        ctx.restore();
      }
    }],
    options: {
      responsive: true,
      layout: { padding: { top: 20 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.raw >= 0 ? '+' : ''}${fmt(c.raw,2)}${barras[c.dataIndex].unidad}` } }
      },
      scales: {
        y: { display: false, min: -55, max: 255 },
        x: { ticks: { font: { size: 10.5 } } }
      }
    }
  });

  // Panel inferior: dispersión de liquidez corriente 2020 por empresa (con notas)
  const ctx2 = document.getElementById('chart-pandemia-liquidez').getContext('2d');
  const nombreBonito = e => e.charAt(0) + e.slice(1).toLowerCase().replace(/ (\w)/g, (m, c) => ' ' + c.toUpperCase());
  const empresas = Object.keys(p.liquidez_2020).sort((a,b) => p.liquidez_2020[a] - p.liquidez_2020[b]);
  const puntos = empresas.map((e, i) => ({ x: p.liquidez_2020[e], y: i, empresa: e }));

  const notasPlugin = {
    id: 'notasLiquidezPlugin',
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      ctx.save();
      ctx.font = '600 10.5px Inter, sans-serif';
      ctx.fillStyle = COLOR.gris;
      ctx.textAlign = 'left';
      puntos.forEach(pt => {
        const x = scales.x.getPixelForValue(pt.x);
        const y = scales.y.getPixelForValue(pt.y);
        ctx.fillText(p.notas[pt.empresa] || '', x + 18, y + 4);
      });
      ctx.restore();
    }
  };

  new Chart(ctx2, {
    type: 'scatter',
    data: {
      datasets: [{ data: puntos, backgroundColor: empresas.map(e => EMPRESAS_COLOR[e]), pointRadius: 9, pointHoverRadius: 11 }]
    },
    plugins: [notasPlugin],
    options: {
      responsive: true,
      layout: { padding: { right: 200 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${nombreBonito(c.raw.empresa)}: ${fmt(c.raw.x,2)}` } }
      },
      scales: {
        x: { min: 0.5, max: 5.4, title: { display: true, text: 'Liquidez corriente 2020' } },
        y: { min: -1, max: empresas.length, ticks: { stepSize: 1, callback: (v) => empresas[v] ? nombreBonito(empresas[v]) : '' } }
      }
    }
  });
}

// ---------- Sistema 2 · F. Impuesto a la renta 2020 vs 2021 ----------
function chartImpuesto2021() {
  const imp = DATA.impuesto_2021;
  const ctx = document.getElementById('chart-impuesto').getContext('2d');

  const multiploPlugin = {
    id: 'multiploPlugin',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      const meta = chart.getDatasetMeta(0);
      const p0 = meta.data[0], p1 = meta.data[1];
      ctx.save();
      const text = '× ' + fmt(imp.multiplo,2);
      const midX = (p0.x + p1.x) / 2;
      const midY = chartArea.top + (p1.y - chartArea.top) * 0.45;
      ctx.font = '700 20px Inter, sans-serif';
      const w = ctx.measureText(text).width + 24;
      const h = 34;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(160,82,45,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(midX - w/2, midY - h/2, w, h, 8); } else { ctx.rect(midX - w/2, midY - h/2, w, h); }
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = COLOR.terracota;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, midX, midY + 1);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['2020', '2021'],
      datasets: [{ data: [imp['2020'], imp['2021']], backgroundColor: [COLOR.gris, COLOR.terracota], borderRadius: 4 }]
    },
    plugins: [multiploPlugin],
    options: {
      responsive: true,
      layout: { padding: { top: 40 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `S/ ${fmt(c.raw,0)} miles` } }
      },
      scales: {
        y: { title: { display: true, text: 'Impuesto a la renta agregado · S/ miles' } }
      }
    }
  });

  // Panel HTML lateral con las rutas regulatorias
  const cont = document.getElementById('impuesto-rutas');
  if (cont) {
    let html = '';
    imp.rutas.forEach(r => {
      const cls = r.titulo.includes('COAZÚCAR') ? 'coazucar' : 'laredo';
      html += `<div class="impuesto-ruta-box ${cls}"><div class="titulo">${r.titulo}</div><div>${r.cuerpo}</div></div>`;
    });
    html += `<div class="impuesto-escalonamiento"><span>${imp.escalonamiento.inicio}</span><span>→</span><span>${imp.escalonamiento.fin}</span></div>`;
    cont.innerHTML = html;
  }
}

// Plugin: dibuja etiquetas de texto con caja de fondo en coordenadas de datos específicas
function labelBoxPlugin(labels) {
  return {
    id: 'labelBoxPlugin_' + Math.random(),
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      labels.forEach(l => {
        const x = scales.x.getPixelForValue(l.xValue);
        const y = scales.y.getPixelForValue(l.yValue);
        ctx.save();
        ctx.font = 'bold 13px Inter, sans-serif';
        const lines = l.text;
        const boxW = Math.max(...lines.map(t => ctx.measureText(t).width)) + 20;
        const boxH = lines.length * 18 + 14;
        const boxX = x + (l.align === 'right' ? -boxW - 8 : 8);
        const boxY = y + (l.dy || 0) - boxH / 2;
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 6) : ctx.rect(boxX, boxY, boxW, boxH);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        lines.forEach((line, i) => {
          ctx.fillText(line, boxX + boxW / 2, boxY + 18 + i * 18);
        });
        ctx.restore();
      });
    }
  };
}

// Plugin: dibuja un porcentaje pequeño encima de cada punto del área apilada
function percentLabelsPlugin(anios, bio, com) {
  return {
    id: 'percentLabelsPlugin',
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      ctx.save();
      ctx.font = '700 10px Inter, sans-serif';
      ctx.fillStyle = '#0a4d2c';
      ctx.textAlign = 'center';
      anios.forEach((anio, i) => {
        const pct = ((bio[i] / (bio[i] + com[i])) * 100).toFixed(0);
        const x = scales.x.getPixelForValue(anio);
        const yTop = scales.y.getPixelForValue(bio[i] + com[i]);
        ctx.fillText(pct + '%', x, yTop - 8);
      });
      ctx.restore();
    }
  };
}

// ---------- 1. Área CCE biológico vs comercial (apilada, como el original) ----------
function chart01_cceArea() {
  const ctx = document.getElementById('chart-01').getContext('2d');
  const anios = DATA.anios;
  const bio = DATA.cce_componentes.bio;
  const com = DATA.cce_componentes.comercial;
  const comApilado = bio.map((b, i) => b + com[i]); // punto visual = bio + comercial (apilado)
  const total0 = bio[0] + com[0];
  const totalLast = bio[bio.length - 1] + com[com.length - 1];
  const pct0 = ((bio[0] / total0) * 100).toFixed(1);
  const pctLast = ((bio[bio.length - 1] / totalLast) * 100).toFixed(1);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: anios,
      datasets: [
        { label: 'Periodo de activos biológicos', data: bio, borderColor: COLOR.bio, backgroundColor: 'rgba(127,174,140,0.65)', fill: 'origin', tension: 0.3, pointRadius: 3 },
        { label: 'Ciclo comercial', data: comApilado, borderColor: '#3a3a3a', backgroundColor: 'rgba(201,138,99,0.65)', fill: '-1', tension: 0.3, pointRadius: 3 }
      ]
    },
    plugins: [
      percentLabelsPlugin(anios, bio, com),
      labelBoxPlugin([
        { xValue: anios[0], yValue: total0, text: [pct0 + '%', 'biológico'], color: COLOR.verdeOscuro, align: 'left', dy: -20 },
        { xValue: anios[anios.length - 1], yValue: bio[bio.length - 1] / 2, text: [pctLast + '%', 'biológico'], color: COLOR.verdeOscuro, align: 'right', dy: 0 },
      ])
    ],
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 34 } },
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (c) => {
              // Mostrar siempre el valor REAL de cada serie, no el acumulado usado para apilar
              if (c.datasetIndex === 0) return `Periodo de activos biológicos: ${fmt(bio[c.dataIndex])} días`;
              return `Ciclo comercial: ${fmt(com[c.dataIndex])} días`;
            },
            afterBody: (items) => {
              const i = items[0].dataIndex;
              const pct = ((bio[i] / (bio[i] + com[i])) * 100).toFixed(1);
              return [`→ ${pct}% del ciclo total es biológico`];
            }
          }
        }
      },
      scales: { y: { title: { display: true, text: 'Días' } } }
    }
  });
}

// ---------- 3. CCE promedio vs FCO acumulado (dumbbell horizontal) ----------
function chart03_cceVsFco() {
  const ctx = document.getElementById('chart-03').getContext('2d');
  const empresas = Object.keys(DATA.cce_vs_fco);
  const sorted = empresas.sort((a,b) => DATA.cce_vs_fco[b].fco_acum_mm - DATA.cce_vs_fco[a].fco_acum_mm);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted,
      datasets: [{
        label: 'Rango CCE 2014–2025 (días)',
        data: sorted.map(e => [DATA.cce_vs_fco[e].cce_min, DATA.cce_vs_fco[e].cce_max]),
        backgroundColor: sorted.map(e => EMPRESAS_COLOR[e] + '55'),
        borderColor: sorted.map(e => EMPRESAS_COLOR[e]),
        borderWidth: 2, borderSkipped: false, borderRadius: 6,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const e = c.label;
              const d = DATA.cce_vs_fco[e];
              return [`CCE promedio: ${fmt(d.cce_avg,0)} días (rango ${fmt(d.cce_min,0)}–${fmt(d.cce_max,0)})`, `FCO acumulado: S/ ${fmt(d.fco_acum_mm,0)} MM`];
            }
          }
        }
      },
      scales: { x: { title: { display: true, text: 'CCE (días) — rango 2014-2025' } } }
    }
  });
}

// ---------- 8. FM vs NOF (tijera) ----------
function chart08_fmVsNof(canvasId = 'chart-08') {
  const ctx = document.getElementById(canvasId).getContext('2d');
  const anios = DATA.anios;
  const fm = DATA.fm_sector_miles.map(v => v/1000);
  const nof = DATA.nof_sector_miles.map(v => v/1000);
  const ptn = DATA.ptn_millones;
  const puntosClave = [2017, 2021, 2025];

  const ptnLabelsPlugin = {
    id: 'ptnLabelsPlugin_' + canvasId,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      puntosClave.forEach(anio => {
        const i = anios.indexOf(anio);
        const metaFM = chart.getDatasetMeta(0).data[i];
        const metaNOF = chart.getDatasetMeta(1).data[i];
        if (!metaFM || !metaNOF) return;
        const valor = ptn[i];
        const text = `PTN ${valor >= 0 ? '+' : '−'}S/ ${fmt(Math.abs(valor), 0)} MM`;
        const color = valor >= 0 ? COLOR.verdeOscuro : COLOR.terracota;
        const x = (metaFM.x + metaNOF.x) / 2;
        const y = (metaFM.y + metaNOF.y) / 2;
        ctx.font = '700 12px Inter, sans-serif';
        const w = ctx.measureText(text).width + 16;
        const isLast = anio === anios[anios.length - 1];
        const boxX = isLast ? x - w - 10 : x - w / 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(boxX, y - 12, w, 22, 6) : ctx.rect(boxX, y - 12, w, 22);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(text, boxX + w / 2, y + 4);
      });
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: anios,
      datasets: [
        { label: 'Fondo de Maniobra', data: fm, borderColor: COLOR.azulMarino, backgroundColor: 'rgba(15,41,66,0.12)', tension: 0.25, pointRadius: 3, fill: '+1' },
        { label: 'NOF', data: nof, borderColor: COLOR.terracota, backgroundColor: 'transparent', tension: 0.25, pointRadius: 3, fill: false },
      ]
    },
    plugins: [ptnLabelsPlugin],
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 20, right: 40 } },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: S/ ${fmt(c.raw,0)} MM` } }
      },
      scales: { y: { title: { display: true, text: 'S/ millones' } } }
    }
  });
}

// Wrapper: mismo gráfico FM vs NOF, usado como "spoiler" inicial en la primera pestaña
function chartSpoiler_fmNof() {
  chart08_fmVsNof('chart-spoiler-fmnof');
}

// ==================================================================
// SISTEMA 3 · CREACIÓN DE VALOR
// ==================================================================

const nombreBonitoEmpresa = e => e.charAt(0) + e.slice(1).toLowerCase().replace(/ (\w)/g, (m, c) => ' ' + c.toUpperCase());

// ---------- Sistema 3 · A. El espejismo de 2021 ----------
function chartEspejismo2021() {
  const d = DATA.espejismo_2021;

  // KPI cards
  const cont = document.getElementById('espejismo-kpis');
  if (cont) {
    cont.innerHTML = `
      <div class="kpi-card"><div class="value">S/ ${fmt(d.fm,0)}</div><div class="label">Fondo de Maniobra · máximo histórico</div></div>
      <div class="kpi-card"><div class="value">+${fmt(d.ptn,0)}</div><div class="label">PTN · positiva por única vez en 9 años</div></div>
      <div class="kpi-card"><div class="value">${fmt(d.liquidez,2)}</div><div class="label">Liquidez corriente · holgada</div></div>
    `;
  }

  // Efectivo sectorial 2020 vs 2021
  const ctx1 = document.getElementById('chart-espejismo-efectivo').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: ['2020', '2021'],
      datasets: [{ data: [d.efectivo_2020, d.efectivo_2021], backgroundColor: [COLOR.gris, COLOR.terracota], borderRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `S/ ${fmt(c.raw,0)} miles` } } },
      scales: { y: { title: { display: true, text: 'S/ miles' } } }
    }
  });

  // Deuda financiera de corto plazo contratada en 2021, por empresa
  const ctx2 = document.getElementById('chart-espejismo-deuda').getContext('2d');
  const empresas = Object.keys(d.deuda_cp_empresas);
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: empresas,
      datasets: [{ data: empresas.map(e => d.deuda_cp_empresas[e]), backgroundColor: COLOR.terracota }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `S/ ${fmt(c.raw,0)} miles` } } },
      scales: { x: { title: { display: true, text: 'S/ miles' } } }
    }
  });
}

// ---------- Sistema 3 · B. Destino de la caja (payout implícito) ----------
function chartDestinoCaja() {
  const d = DATA.destino_caja;
  const ctx = document.getElementById('chart-destino-caja').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [''],
      datasets: [
        { label: 'Salió hacia los accionistas', data: [d.pct_ai_neto_fco], backgroundColor: COLOR.terracota, stack: 's' },
        { label: 'Quedó', data: [100 - d.pct_ai_neto_fco], backgroundColor: '#e8e4dd', stack: 's' },
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw,1)}%` } }
      },
      scales: {
        x: { stacked: true, min: 0, max: 100, ticks: { callback: v => v + '%' } },
        y: { stacked: true, display: false }
      }
    }
  });

  const cont = document.getElementById('destino-caja-kpis');
  if (cont) {
    cont.innerHTML = `
      <div class="kpi-card"><div class="value">${fmt(d.payout_neto,1)}%</div><div class="label">Payout implícito acumulado sobre S/ ${fmt(d.un_acumulada,0)} miles de utilidad neta</div></div>
      <div class="kpi-card"><div class="value">S/ ${fmt(d.ai_2022,0)}</div><div class="label">Distribución de 2022 en un solo ejercicio</div></div>
      <div class="kpi-card"><div class="value">2.30×</div><div class="label">Equivalente al mejor FCO anual de toda la serie</div></div>
    `;
  }
}

// ---------- Sistema 3 · C. Desalineamiento: Deuda CP vs NOF, 2014-2025 ----------
function chartDesalineamiento() {
  const d = DATA.desalineamiento;
  const ctx = document.getElementById('chart-desalineamiento').getContext('2d');
  const anios = d.anios;
  const nof = anios.map(a => DATA.nof_sector_miles[DATA.anios.indexOf(a)]);
  const cobertura = anios.map((a, i) => +(100 * d.deuda_cp[i] / nof[i]).toFixed(1));

  new Chart(ctx, {
    data: {
      labels: anios,
      datasets: [
        { type: 'bar', label: 'Deuda financiera de corto plazo', data: d.deuda_cp, backgroundColor: COLOR.terracota, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'NOF (necesidad permanente)', data: nof, borderColor: COLOR.bio, backgroundColor: COLOR.bio, tension: 0.2, pointRadius: 4, borderWidth: 2.4, yAxisID: 'y', order: 1 },
        { type: 'line', label: 'Cobertura: deuda CP / NOF', data: cobertura, borderColor: COLOR.gris, backgroundColor: COLOR.gris, borderDash: [6,3], tension: 0.2, pointRadius: 3, borderWidth: 1.8, yAxisID: 'y1', order: 0 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (c) => c.dataset.yAxisID === 'y1' ? `Cobertura: ${fmt(c.raw,1)}%` : `${c.dataset.label}: S/ ${fmt(c.raw,0)} miles`
          }
        }
      },
      scales: {
        y: { position: 'left', title: { display: true, text: 'S/ miles' } },
        y1: { position: 'right', min: 0, max: 175, grid: { drawOnChartArea: false }, title: { display: true, text: 'Cobertura (%)' } }
      }
    }
  });
}

// ---------- Sistema 3 · D. Prueba Ácida 2025: dos definiciones ----------
function chartPruebaAcida2Def() {
  const d = DATA.prueba_acida_2025;
  const ctx = document.getElementById('chart-prueba-acida-2def').getContext('2d');
  const empresas = Object.keys(d).sort((a,b) => d[b].estandar - d[a].estandar);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: empresas.map(nombreBonitoEmpresa),
      datasets: [
        { label: 'Prueba Ácida = (Activo Corriente − Inventarios) / Pasivo Corriente', data: empresas.map(e => d[e].estandar), backgroundColor: COLOR.gris },
        { label: 'Estricta = también sin activo biológico', data: empresas.map(e => d[e].estricta), backgroundColor: COLOR.terracota },
      ]
    },
    plugins: [{
      id: 'umbralPlugin',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea, scales } = chart;
        const y = scales.y.getPixelForValue(1.0);
        ctx.save();
        ctx.strokeStyle = COLOR.gris;
        ctx.setLineDash([5,4]);
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }],
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 10 } } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label.split('=')[0].trim()}: ${fmt(c.raw,2)}` } }
      },
      scales: {
        y: { min: 0, max: 1.62, title: { display: true, text: 'Ratio' } }
      }
    }
  });
}

// ---------- Sistema 3 · E. Composición del pasivo sectorial: 2014 vs 2025 ----------
function chartComposicionPasivo() {
  const d = DATA.composicion_pasivo;
  const ctx = document.getElementById('chart-composicion-pasivo').getContext('2d');
  const anios = ['2014', '2025'];
  const deudaFin = anios.map(a => d[a].deuda_fin_pct);
  const operativo = anios.map(a => 100 - d[a].deuda_fin_pct);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: anios,
      datasets: [
        { label: 'Deuda financiera', data: deudaFin, backgroundColor: COLOR.terracota, stack: 's' },
        { label: 'Pasivo operativo y otros', data: operativo, backgroundColor: COLOR.verdeClaro, stack: 's' },
      ]
    },
    plugins: [{
      id: 'pasivoLabelsPlugin',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        anios.forEach((a, i) => {
          const total = d[a].total;
          const barTop = chart.getDatasetMeta(1).data[i]; // tope real del stack (Pasivo operativo va encima)
          ctx.font = '700 11px Inter, sans-serif';
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.fillText('pasivo total', barTop.x, barTop.y - 24);
          ctx.fillText('S/ ' + fmt(total,0) + ' miles', barTop.x, barTop.y - 11);
        });
        ctx.restore();
      }
    }],
    options: {
      responsive: true,
      layout: { padding: { top: 30 } },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw,1)}%` } }
      },
      scales: {
        y: { stacked: true, min: 0, max: 100, ticks: { callback: v => v + '%' } }
      }
    }
  });
}

// ---------- Sistema 3 · F. Costo de la deuda: gastos financieros y cobertura ----------
function chartCostoDeuda() {
  const d = DATA.costo_deuda;
  const anios = d.anios;

  // Panel superior: Gastos financieros (barras) + GF/EBIT (línea, eje derecho)
  const ctx1 = document.getElementById('chart-costo-gf').getContext('2d');
  const gfSobreEbit = anios.map((a, i) => d.ebit_full[i] > 0 ? +(100 * d.gastos_financieros[i] / d.ebit_full[i]).toFixed(2) : null);
  new Chart(ctx1, {
    data: {
      labels: anios,
      datasets: [
        { type: 'bar', label: 'Gastos financieros', data: d.gastos_financieros, backgroundColor: COLOR.terracotaClaro, yAxisID: 'y', order: 2 },
        { type: 'line', label: 'Gastos financieros / EBIT', data: gfSobreEbit, borderColor: '#1a1a1a', backgroundColor: '#1a1a1a', tension: 0.2, pointRadius: 4, borderWidth: 2, yAxisID: 'y1', order: 0 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => c.dataset.yAxisID === 'y1' ? `${fmt(c.raw,2)}% del EBIT` : `S/ ${fmt(c.raw,0)} miles` } }
      },
      scales: {
        y: { position: 'left', title: { display: true, text: 'S/ miles' } },
        y1: { position: 'right', min: 0, max: 62, grid: { drawOnChartArea: false }, title: { display: true, text: '% del EBIT' } }
      }
    }
  });

  // Panel inferior: Deuda financiera / FCO (años), solo con FCO publicado
  const ctx2 = document.getElementById('chart-costo-veces').getContext('2d');
  const empresas = Object.keys(DATA.empresas);
  const aniosConFco = anios.filter(a => a >= 2015);
  const veces = aniosConFco.map(a => {
    const i = DATA.anios.indexOf(a);
    const fco = empresas.reduce((sum, e) => sum + DATA.empresas[e]['FCO'][i], 0);
    const dfin = d.deuda_financiera_total[String(a)];
    return +(dfin / fco).toFixed(2);
  });
  new Chart(ctx2, {
    type: 'line',
    data: {
      labels: aniosConFco,
      datasets: [{ label: 'Deuda financiera / FCO', data: veces, borderColor: COLOR.gris, backgroundColor: COLOR.gris, borderDash: [6,3], tension: 0.15, pointRadius: 5, pointStyle: 'rect', borderWidth: 2.2 }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${fmt(c.raw,2)} años` } }
      },
      scales: {
        y: { min: 0, max: 7.6, title: { display: true, text: 'Años' } }
      }
    }
  });
}

// ---------- Sistema 3 · G. ROIC vs WACC, EVA sectorial y sensibilidad ----------
function chartRoicEva() {
  const d = DATA.roic_eva_detalle;
  const anios = d.anios;
  const roic = anios.map(a => DATA.roic_sectorial[String(a)]);

  const ctx1 = document.getElementById('chart-roic-wacc').getContext('2d');
  new Chart(ctx1, {
    data: {
      labels: anios,
      datasets: [
        { type: 'line', label: 'ROIC agregado', data: roic, borderColor: COLOR.verdeOscuro, backgroundColor: COLOR.verdeOscuro, tension: 0.15, pointRadius: 4, borderWidth: 2.4 },
        { type: 'line', label: 'WACC promedio', data: d.wacc_promedio, borderColor: COLOR.terracota, backgroundColor: COLOR.terracota, borderDash: [4,3], tension: 0.15, pointRadius: 5, pointStyle: 'rectRot', borderWidth: 1.8 },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top', labels: { font: { size: 10 } } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw,2)}%` } }
      },
      scales: {
        y: { min: 0, max: 15, ticks: { callback: v => v + '%' } }
      }
    }
  });

  const ctx2 = document.getElementById('chart-eva-sectorial').getContext('2d');
  new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: anios,
      datasets: [{ label: 'EVA sectorial', data: d.eva_sectorial_miles, backgroundColor: d.eva_sectorial_miles.map(v => v >= 0 ? COLOR.verdeOscuro : COLOR.terracota) }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `S/ ${fmt(c.raw,0)} miles` } }
      },
      scales: {
        y: { title: { display: true, text: 'S/ miles' } }
      }
    }
  });

  const eva2025 = d.eva_sectorial_miles[d.anios.indexOf(2025)];
  const delta = 0.02 * d.capital_invertido_sector_2025;
  const filas = [
    { label: 'WACC −200 pb', val: eva2025 + delta },
    { label: 'EVA 2025 base', val: eva2025 },
    { label: 'WACC +200 pb', val: eva2025 - delta },
  ];
  const cont = document.getElementById('roic-eva-sensibilidad');
  if (cont) {
    let html = `<div class="sens-titulo">SENSIBILIDAD</div><div class="sens-subtitulo">EVA 2025 · S/ miles</div>`;
    filas.forEach(f => {
      html += `<div class="sens-fila"><div class="sens-label">${f.label}</div><div class="sens-valor" style="color:${f.val >= 0 ? COLOR.verdeOscuro : COLOR.terracota}">${fmt(f.val,0)}</div></div>`;
    });
    html += `<div class="sens-nota">cada punto de WACC ≈ S/ 49 millones anuales</div>`;
    cont.innerHTML = html;
  }
}

// ==================================================================
// SISTEMA 5 · PRUEBAS DE ROBUSTEZ (TEST)
// ==================================================================

// ---------- L18 · Control temporal: 2017 vs 2025 ----------
function chartControlTemporal() {
  const d = DATA.control_temporal;
  const cont = document.getElementById('test-l18');
  if (!cont) return;
  let html = `
    <div class="tt-header">
      <div></div>
      <div><div class="tt-year">2017</div><div class="tt-year-sub">El Niño Costero</div></div>
      <div><div class="tt-year">2025</div><div class="tt-year-sub">Reversión de precios</div></div>
    </div>
  `;
  d.bloques.forEach(b => {
    html += `<div class="tt-block tt-${b.tipo}"><div class="tt-block-title">${b.titulo}</div>`;
    b.filas.forEach(f => {
      html += `<div class="tt-row"><div>${f[0]}</div><div class="tt-v1">${f[1]}</div><div class="tt-v2">${f[2]}</div></div>`;
    });
    html += `</div>`;
  });
  cont.innerHTML = html;
}

// ---------- L19 · Control transversal: matriz 2x2 ----------
function chartControlTransversal() {
  const d = DATA.control_transversal;
  const cont = document.getElementById('test-l19');
  if (cont) {
    function celda(clase, eyebrow, obj) {
      let rows = obj.filas.map(f => `<div class="tm-row"><span class="tm-label">${f[0]}</span><span class="tm-value">${f[1]}</span></div>`).join('');
      return `<div class="tm-cell ${clase}"><div class="tm-eyebrow">${eyebrow}</div><div class="tm-title">${obj.titulo}</div>${rows}</div>`;
    }
    cont.innerHTML =
      `<div class="tm-col-header tm-h-verde">Balance original</div>` +
      `<div class="tm-col-header tm-h-terracota">Balance transformado</div>` +
      celda('tm-verde', 'Daño de 2017', d.sector) +
      `<div class="tm-cell tm-vacia"><div class="tm-eyebrow">Daño de 2017</div><div class="tm-vacia-guion">—</div></div>` +
      celda('tm-verde', 'Daño de 2025', d.laredo) +
      celda('tm-terracota', 'Daño de 2025', d.coazucar);
  }
  const vuelco = document.getElementById('test-l19-vuelco');
  if (vuelco) vuelco.innerHTML = `<strong>EL VUELCO:</strong> ${d.vuelco}`;
}

// ---------- L20 · Discordancia: D/E vs Spread ROIC-WACC (burbuja) ----------
function chartDiscordancia() {
  const d = DATA.discordancia;
  const ctx = document.getElementById('chart-discordancia').getContext('2d');
  const empresas = Object.keys(d.spread_promedio);
  const maxActivo = Math.max(...Object.values(d.activos_2025));
  const nombreBonito = e => e.charAt(0) + e.slice(1).toLowerCase().replace(/ (\w)/g, (m, c) => ' ' + c.toUpperCase());

  const puntos = empresas.map(e => ({
    x: d.de_2025[e], y: d.spread_promedio[e], empresa: e,
    r: 8 + 22 * d.activos_2025[e] / maxActivo
  }));

  const labelPos = {
    'CARTAVIO':     { dx: 0,   above: false },
    'SAN JACINTO':  { dx: 46,  above: true  },
    'CASA GRANDE':  { dx: -18, above: false },
    'PARAMONGA':    { dx: 0,   above: false },
    'LAREDO':       { dx: -6,  above: true  },
  };

  const labelsPlugin = {
    id: 'discordanciaLabels',
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      ctx.save();
      puntos.forEach(p => {
        const cfg = labelPos[p.empresa] || { dx: 0, above: false };
        const x = scales.x.getPixelForValue(p.x) + cfg.dx;
        const yBase = scales.y.getPixelForValue(p.y);
        const sign = cfg.above ? -1 : 1;
        const y1 = yBase + sign * (p.r + 16);
        const y2 = yBase + sign * (p.r + 29);
        const linea1 = nombreBonito(p.empresa);
        const linea2 = `D/E ${fmt(p.x,0)}% · spread ${p.y >= 0 ? '+' : ''}${fmt(p.y,2)} pp`;
        ctx.textAlign = 'center';
        ctx.font = '700 10.5px Inter, sans-serif';
        ctx.fillStyle = COLOR.azulMarino;
        ctx.fillText(linea1, x, cfg.above ? y1 - 8 : y1);
        ctx.font = '600 9.5px Inter, sans-serif';
        ctx.fillText(linea2, x, cfg.above ? y2 - 21 : y2);
      });
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [{ data: puntos, backgroundColor: puntos.map(p => EMPRESAS_COLOR[p.empresa] + 'cc') }]
    },
    plugins: [
      zonePlugin([
        { y1: 0, y2: 15, color: 'rgba(11,107,58,0.07)' },
        { y1: -15, y2: 0, color: 'rgba(160,82,45,0.06)' },
      ]),
      labelsPlugin
    ],
    options: {
      responsive: true,
      layout: { padding: { top: 30, bottom: 20 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${nombreBonito(c.raw.empresa)}: D/E ${fmt(c.raw.x,0)}%, spread ${fmt(c.raw.y,2)}pp` } }
      },
      scales: {
        x: { min: 40, max: 185, title: { display: true, text: 'D/E 2025 (%)' } },
        y: { min: -8, max: 8.5, title: { display: true, text: 'Spread ROIC − WACC promedio 2014–2025 (pp)' } }
      }
    }
  });
}

// ---------- E4 · ROIC contrafactual de Paramonga ----------
function chartContrafactualParamonga() {
  const d = DATA.contrafactual_paramonga;
  const ctx = document.getElementById('chart-contrafactual-paramonga').getContext('2d');
  const anios = ['2022', '2024'];
  // Posiciones X manuales: cada año ocupa un par (x0=reportado, x1=contrafactual) separado,
  // igual que el original, para que la línea que los une salga diagonal en vez de vertical.
  const xPos = { '2022': [0, 0.9], '2024': [2.0, 2.9] };

  const puntosReportado = anios.map(a => ({ x: xPos[a][0], y: d[a].reportado }));
  const puntosContrafactual = anios.map(a => ({ x: xPos[a][1], y: d[a].contrafactual }));

  const dumbbellPlugin = {
    id: 'dumbbellPlugin',
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      ctx.save();
      anios.forEach((a, i) => {
        const p0px = { x: scales.x.getPixelForValue(puntosReportado[i].x), y: scales.y.getPixelForValue(puntosReportado[i].y) };
        const p1px = { x: scales.x.getPixelForValue(puntosContrafactual[i].x), y: scales.y.getPixelForValue(puntosContrafactual[i].y) };
        ctx.strokeStyle = COLOR.terracota;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(p0px.x, p0px.y);
        ctx.lineTo(p1px.x, p1px.y);
        ctx.stroke();

        const diff = d[a].contrafactual - d[a].reportado;
        const midX = (p0px.x + p1px.x) / 2, midY = (p0px.y + p1px.y) / 2;
        const text = `+${fmt(diff,2)} pp`;
        ctx.font = '700 12px Inter, sans-serif';
        const w = ctx.measureText(text).width + 16;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = COLOR.terracota;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(midX - w/2, midY - 11, w, 22, 6) : ctx.rect(midX - w/2, midY - 11, w, 22);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = COLOR.azulMarino;
        ctx.textAlign = 'center';
        ctx.fillText(text, midX, midY + 4);

        // Etiqueta del año, centrada bajo cada par de puntos
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(a, midX, scales.y.getPixelForValue(0) + 22);
      });
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'ROIC reportado', data: puntosReportado, backgroundColor: COLOR.gris, pointRadius: 7 },
        { label: 'ROIC congelando el PPE en su nivel de 2020', data: puntosContrafactual, backgroundColor: COLOR.terracota, pointRadius: 7 },
      ]
    },
    plugins: [dumbbellPlugin],
    options: {
      responsive: true,
      layout: { padding: { top: 10, bottom: 10 } },
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw.y,2)}%` } }
      },
      scales: {
        x: { min: -0.6, max: 3.5, display: false },
        y: { min: 0, max: 18, ticks: { callback: v => v + '%' }, title: { display: true, text: 'ROIC' } }
      }
    }
  });

  const cont = document.getElementById('contrafactual-info');
  if (cont) {
    const c = d.crecimiento_capital;
    cont.innerHTML = `
      <div class="sens-titulo">Crecimiento del capital invertido 2014–2025</div>
      <div class="sens-fila"><div class="sens-label">Paramonga</div><div class="sens-valor" style="color:${COLOR.terracota}">+${fmt(c.Paramonga,1)}%</div></div>
      <div class="sens-fila"><div class="sens-label">Sector</div><div class="sens-valor">+${fmt(c.Sector,1)}%</div></div>
      <div class="sens-fila"><div class="sens-label">Casa Grande</div><div class="sens-valor">+${fmt(c['Casa Grande'],1)}%</div></div>
    `;
  }
}