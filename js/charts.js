console.log('%c✅ charts.js v9 cargada (ROIC etiquetas horizontales)', 'background:#0b6b3a;color:#fff;padding:4px 8px;border-radius:4px;');

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
  chart01_cceArea();
  chart02_cuadrantePaDe();
  chart03_cceVsFco();
  chart04_heatmapPA();
  chart05_fcoVsEva();
  chart06_ebitFco();
  chart07_periodosComerciales();
  chart08_fmVsNof();
  chart09_nofComposicion();
  chart10_deAgregadoFases();
  chart11_rankingDe();
  chart12_patrimonio();
  chart13_roicWaccEva();
  chart14_burbujaDeSpread();
  chart15_roicContrafactual();
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

// ---------- 2. Cuadrante Prueba Ácida vs D/E 2025 ----------
function chart02_cuadrantePaDe() {
  const ctx = document.getElementById('chart-02').getContext('2d');
  const empresas = Object.keys(DATA.empresas);
  const points = empresas.map(e => {
    const pa = DATA.empresas[e]['Prueba Ácida'][11];
    const de = DATA.empresas[e]['D/E'][11] * 100;
    return { x: pa, y: de, empresa: e, esCoazucar: DATA.grupo_coazucar[e] === 'Coazúcar' };
  });
  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        { label: 'Coazúcar', data: points.filter(p => p.esCoazucar), backgroundColor: COLOR.verde, pointRadius: 8, pointHoverRadius: 11 },
        { label: 'No-Coazúcar', data: points.filter(p => !p.esCoazucar), backgroundColor: COLOR.terracota, pointRadius: 8, pointHoverRadius: 11 }
      ]
    },
    plugins: [
      zonePlugin([
        { x1: 0, x2: 1.0, y1: 100, y2: 300, color: 'rgba(160,82,45,0.08)' },
        { x1: 1.0, x2: 2.0, y1: 0, y2: 100, color: 'rgba(11,107,58,0.08)' },
      ]),
      {
        id: 'quadrantLabelsAndNames',
        afterDatasetsDraw(chart) {
          const { ctx, scales } = chart;
          ctx.save();
          // Textos de cuadrante
          ctx.font = '700 11px Inter, sans-serif';
          ctx.fillStyle = COLOR.terracota;
          ctx.textAlign = 'left';
          ctx.fillText('TENSIÓN DOBLE', scales.x.getPixelForValue(0.35), scales.y.getPixelForValue(178));
          ctx.fillStyle = COLOR.verdeOscuro;
          ctx.textAlign = 'right';
          ctx.fillText('MAYOR HOLGURA', scales.x.getPixelForValue(scales.x.max) - 6, scales.y.getPixelForValue(scales.y.min) - 8);
          // Nombre + cifras junto a cada punto (permanente, no solo tooltip)
          // Desplazamiento manual para pares de puntos muy cercanos (evita solape)
          const offsets = { 'SAN JACINTO': -14, 'CASA GRANDE': 16 };
          ctx.font = '700 11px Inter, sans-serif';
          points.forEach(p => {
            const x = scales.x.getPixelForValue(p.x);
            const yBase = scales.y.getPixelForValue(p.y);
            const yLabel = yBase + (offsets[p.empresa] || 0);
            ctx.textAlign = 'left';
            ctx.fillStyle = p.esCoazucar ? COLOR.verdeOscuro : COLOR.terracota;
            ctx.fillText(p.empresa.charAt(0) + p.empresa.slice(1).toLowerCase(), x + 12, yLabel - 8);
            ctx.font = '600 10px Inter, sans-serif';
            ctx.fillText(`PA ${fmt(p.x,2)} · D/E ${fmt(p.y,0)}%`, x + 12, yLabel + 6);
            ctx.font = '700 11px Inter, sans-serif';
          });
          ctx.restore();
        }
      }
    ],
    options: {
      responsive: true,
      layout: { padding: { top: 10, right: 40 } },
      plugins: {
        legend: { position: 'top', align: 'end' },
        tooltip: { callbacks: { label: (c) => `${c.raw.empresa}: PA ${fmt(c.raw.x,2)} · D/E ${fmt(c.raw.y,0)}%` } }
      },
      scales: {
        x: { title: { display: true, text: 'Prueba Ácida 2025' }, min: 0.3, max: 1.6 },
        y: { title: { display: true, text: 'D/E 2025 (%)' } }
      }
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

// ---------- 4. Heatmap Prueba Ácida (tabla HTML, no canvas) ----------
function chart04_heatmapPA() {
  const cont = document.getElementById('chart-04');
  const empresas = ['PARAMONGA','CARTAVIO','SAN JACINTO','CASA GRANDE','LAREDO'];
  const anios = DATA.anios;
  let html = '<table class="heatmap-table"><thead><tr><th></th>' + anios.map(a => `<th>${a}</th>`).join('') + '</tr></thead><tbody>';
  empresas.forEach(e => {
    html += `<tr><th>${e[0] + e.slice(1).toLowerCase()}</th>`;
    DATA.empresas[e]['Prueba Ácida'].forEach(v => {
      const color = v >= 1 ? `rgba(11,107,58,${Math.min(0.15 + (v-1)*0.35, 0.85)})` : `rgba(160,82,45,${Math.min(0.15 + (1-v)*0.9, 0.85)})`;
      html += `<td style="background:${color}" title="${e}: ${fmt(v,2)}">${fmt(v,2)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  cont.innerHTML = html;
}

// ---------- 5. FCO vs EVA acumulado (creación/destrucción de valor) ----------
function chart05_fcoVsEva() {
  const ctx = document.getElementById('chart-05').getContext('2d');
  const empresas = Object.keys(DATA.fco_vs_eva_valor);
  const points = empresas.map(e => ({ x: DATA.fco_vs_eva_valor[e].fco_acum_mm, y: DATA.fco_vs_eva_valor[e].eva_acum_mm, empresa: e }));
  new Chart(ctx, {
    type: 'scatter',
    data: { datasets: [{ data: points, backgroundColor: points.map(p => p.y >= 0 ? COLOR.verde : COLOR.terracota), pointRadius: 9, pointHoverRadius: 12 }] },
    plugins: [zonePlugin([
      { y1: 0, y2: 600, color: 'rgba(11,107,58,0.06)' },
      { y1: -600, y2: 0, color: 'rgba(160,82,45,0.06)' },
    ])],
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.raw.empresa}: FCO S/${fmt(c.raw.x,0)} MM · EVA S/${fmt(c.raw.y,0)} MM` } }
      },
      scales: {
        x: { title: { display: true, text: 'FCO acumulado 2015–2025 (S/ MM)' } },
        y: { title: { display: true, text: 'EVA acumulado 2015–2025 (S/ MM)' } }
      }
    }
  });
}

// ---------- 6. Waterfall EBIT -> FCO ----------
function chart06_ebitFco() {
  const ctx = document.getElementById('chart-06').getContext('2d');
  const w = DATA.waterfall_2022;
  const steps = [
    { label: 'EBIT', val: w.EBIT, base: 0 },
    { label: '+ Dep./Amort.', val: w.Dep, base: w.EBIT },
    { label: '− Impuestos', val: w.Impuestos, base: w.EBIT + w.Dep + w.Impuestos },
    { label: '− ΔNOF', val: w.dNOF, base: w.EBIT + w.Dep + w.Impuestos + w.dNOF },
    { label: 'Otros ajustes', val: w.Otros, base: w.EBIT + w.Dep + w.Impuestos + w.dNOF + w.Otros },
    { label: 'FCO', val: w.FCO, base: 0 },
  ];
  const floating = steps.map((s, i) => {
    if (i === 0 || i === steps.length - 1) return [0, s.val];
    const start = s.base;
    const end = s.base + s.val;
    return [Math.min(start, s.base), Math.max(start,s.base)].concat();
  });
  // Construcción manual de floating bars correcta
  let running = 0;
  const bars = [];
  steps.forEach((s, i) => {
    if (i === 0 || i === steps.length - 1) { bars.push([0, s.val]); running = s.val; }
    else { const from = running; running += s.val; bars.push([Math.min(from, running), Math.max(from, running)]); }
  });
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: steps.map(s => s.label),
      datasets: [{
        data: bars,
        backgroundColor: steps.map((s,i) => i===0 || i===steps.length-1 ? COLOR.azulMarino : (s.val >= 0 ? COLOR.verde : COLOR.terracota)),
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => { const s = steps[c.dataIndex]; return `${s.label}: ${s.val >= 0 ? '+' : ''}S/ ${fmt(s.val,0)} MM`; } } }
      },
      scales: { y: { title: { display: true, text: 'S/ millones' } } }
    }
  });
}

// ---------- 7. Periodos comerciales (slope 2014 vs 2025) ----------
// Plugin: dibuja texto plano (sin caja) junto al punto final de cada línea, con valor y % de cambio
// Usa la posición YA CALCULADA del punto por Chart.js (más confiable que recalcular con getPixelForValue,
// especialmente en ejes invertidos como el ranking).
function endpointLabelsPlugin(items) {
  return {
    id: 'endpointLabelsPlugin_' + Math.random(),
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.textAlign = 'left';
      items.forEach(it => {
        const meta = chart.getDatasetMeta(it.datasetIndex);
        const point = meta.data[it.dataIndex];
        if (!point) return;
        const x = point.x + 12;
        const y = point.y;
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillStyle = it.color;
        ctx.fillText(it.line1, x, y - 4);
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText(it.line2, x, y + 12);
      });
      ctx.restore();
    }
  };
}

function chart07_periodosComerciales() {
  const ctx = document.getElementById('chart-07').getContext('2d');
  const s = DATA.slope_comercial;
  const colors = [COLOR.azulMedio, COLOR.comercial, COLOR.terracota];
  const keys = Object.keys(s);
  const datasets = keys.map((k, i) => {
    return { label: k, data: [s[k]["2014"], s[k]["2025"]], borderColor: colors[i], backgroundColor: colors[i], pointRadius: 6, tension: 0 };
  });
  const endpointItems = keys.map((k, i) => {
    const v2014 = s[k]["2014"], v2025 = s[k]["2025"];
    const pct = ((v2025 - v2014) / v2014 * 100).toFixed(1);
    return { datasetIndex: i, dataIndex: 1, color: colors[i], line1: fmt(v2025, 2) + ' días', line2: (pct >= 0 ? '+' : '') + pct + '%' };
  });
  new Chart(ctx, {
    type: 'line',
    data: { labels: ['2014', '2025'], datasets },
    plugins: [endpointLabelsPlugin(endpointItems)],
    options: {
      responsive: true,
      layout: { padding: { right: 60 } },
      plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw,2)} días` } } },
      scales: { y: { title: { display: true, text: 'Días' } } }
    }
  });
}

// ---------- 8. FM vs NOF (tijera) ----------
function chart08_fmVsNof() {
  const ctx = document.getElementById('chart-08').getContext('2d');
  const anios = DATA.anios;
  const fm = DATA.fm_sector_miles.map(v => v/1000);
  const nof = DATA.nof_sector_miles.map(v => v/1000);
  const ptn = DATA.ptn_millones;
  const puntosClave = [2017, 2021, 2025];

  const ptnLabelsPlugin = {
    id: 'ptnLabelsPlugin',
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

// ---------- 9. Composición NOF (100% apilado) ----------
function chart09_nofComposicion() {
  const ctx = document.getElementById('chart-09').getContext('2d');
  const anios = DATA.anios;
  const c = DATA.nof_componentes;
  const total = anios.map((_, i) => c.activo_biologico[i] + c.inventarios[i] + c.cxc[i] + c.proveedores[i]);
  const pct = (arr) => arr.map((v, i) => +(v / total[i] * 100).toFixed(1));
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: anios,
      datasets: [
        { label: 'Activo biológico', data: pct(c.activo_biologico), backgroundColor: COLOR.verde },
        { label: 'Inventarios', data: pct(c.inventarios), backgroundColor: COLOR.terracota },
        { label: 'Cuentas por cobrar', data: pct(c.cxc), backgroundColor: COLOR.azulMedio },
        { label: 'Proveedores (financiación)', data: pct(c.proveedores), backgroundColor: COLOR.dorado },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw,1)}%` } } },
      scales: { x: { stacked: true }, y: { stacked: true, max: 100, title: { display: true, text: 'Participación relativa (%)' } } }
    }
  });
}

// ---------- 10. D/E agregado con fases ----------
function chart10_deAgregadoFases() {
  const ctx = document.getElementById('chart-10').getContext('2d');
  const anios = DATA.anios;
  const de = anios.map(a => DATA.de_agregado[String(a)]);
  new Chart(ctx, {
    type: 'line',
    data: { labels: anios, datasets: [{ label: 'D/E agregado (%)', data: de, borderColor: COLOR.terracota, backgroundColor: 'transparent', stepped: true, pointRadius: 4 }] },
    plugins: [
      zonePlugin([
        { x1: 2014, x2: 2020.5, y1: 0, y2: 100, color: 'rgba(0,0,0,0.05)' },
        { x1: 2020.5, x2: 2022.5, y1: 0, y2: 100, color: 'rgba(160,82,45,0.10)' },
        { x1: 2022.5, x2: 2025, y1: 0, y2: 100, color: 'rgba(160,82,45,0.05)' },
      ]),
      {
        id: 'fasesLabelsPlugin',
        afterDatasetsDraw(chart) {
          const { ctx, scales } = chart;
          ctx.save();
          // Títulos de fase arriba de cada banda
          ctx.font = '700 12px Inter, sans-serif';
          ctx.textAlign = 'center';
          const yTitle = scales.y.getPixelForValue(scales.y.max) + 16;
          ctx.fillStyle = '#6b7280';
          ctx.fillText('Meseta', scales.x.getPixelForValue(2017), yTitle);
          ctx.fillStyle = COLOR.terracota;
          ctx.fillText('Quiebre', scales.x.getPixelForValue(2021.5), yTitle);
          ctx.fillText('Consolidación', scales.x.getPixelForValue(2023.7), yTitle);

          // Cajas destacadas de porcentaje en los años clave
          const highlights = [
            { anio: 2017, dy: -22, bg: '#8a94a6' },
            { anio: 2021, dy: -22, bg: COLOR.terracota },
            { anio: 2022, dy: 22, bg: COLOR.terracota },
            { anio: 2025, dy: -22, bg: COLOR.terracota },
          ];
          highlights.forEach(h => {
            const idx = anios.indexOf(h.anio);
            const val = de[idx];
            const text = fmt(val, 2) + '%';
            const x = scales.x.getPixelForValue(h.anio);
            const y = scales.y.getPixelForValue(val) + h.dy;
            ctx.font = '700 12px Inter, sans-serif';
            const w = ctx.measureText(text).width + 16;
            ctx.fillStyle = h.bg;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x - w / 2, y - 12, w, 22, 6) : ctx.rect(x - w / 2, y - 12, w, 22);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillText(text, x, y + 4);
          });
          ctx.restore();
        }
      }
    ],
    options: {
      responsive: true,
      layout: { padding: { top: 34 } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `D/E agregado: ${fmt(c.raw,2)}%` } } },
      scales: { y: { title: { display: true, text: 'D/E agregado (%)' } } }
    }
  });
}

// ---------- 11. Ranking D/E (bump chart) ----------
function chart11_rankingDe() {
  const ctx = document.getElementById('chart-11').getContext('2d');
  const anios = DATA.anios;
  const empresas = Object.keys(DATA.ranking_de);
  const datasets = empresas.map(e => ({
    label: e, data: DATA.ranking_de[e], borderColor: EMPRESAS_COLOR[e], backgroundColor: EMPRESAS_COLOR[e],
    pointRadius: 5, tension: 0, borderWidth: 2.5
  }));
  const nombreBonito = e => e.charAt(0) + e.slice(1).toLowerCase().replace(/ (\w)/g, (m, c) => ' ' + c.toUpperCase());
  const endpointItems = empresas.map((e, i) => {
    const deLast = DATA.empresas[e]['D/E'][11] * 100;
    return { datasetIndex: i, dataIndex: anios.length - 1, color: EMPRESAS_COLOR[e], line1: nombreBonito(e), line2: fmt(deLast, 1) + '%' };
  });
  new Chart(ctx, {
    type: 'line',
    data: { labels: anios, datasets },
    plugins: [zonePlugin([{ x1: 2021, x2: 2022, y1: 0.5, y2: 5.5, color: 'rgba(184,134,11,0.08)' }]), endpointLabelsPlugin(endpointItems)],
    options: {
      responsive: true,
      layout: { padding: { right: 90 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: #${c.raw} en D/E` } }
      },
      scales: { y: { reverse: true, min: 0.5, max: 5.5, ticks: { stepSize: 1, callback: v => '#' + v }, title: { display: true, text: 'Posición (ranking)' } } }
    }
  });
}

// ---------- 12. Patrimonio waterfall ----------
function chart12_patrimonio() {
  const ctx = document.getElementById('chart-12').getContext('2d');
  const w = DATA.patrimonio_waterfall;
  const steps = [
    { label: 'Patrimonio pico', val: w.pico },
    { label: 'Utilidades', val: w.utilidades },
    { label: 'Revaluación', val: w.revaluaciones },
    { label: 'Ajuste implícito', val: w.ajuste },
    { label: 'Otros', val: w.otros },
    { label: 'Patrimonio cierre', val: w.cierre },
  ];
  let running = 0;
  const bars = steps.map((s, i) => {
    if (i === 0 || i === steps.length - 1) { running = s.val; return [0, s.val]; }
    const from = running; running += s.val;
    return [Math.min(from, running), Math.max(from, running)];
  });
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: steps.map(s => s.label),
      datasets: [{ data: bars, backgroundColor: steps.map((s,i) => i===0||i===steps.length-1 ? COLOR.azulMarino : (s.val>=0?COLOR.verde:COLOR.terracota)), borderRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => { const s = steps[c.dataIndex]; return `${s.label}: ${s.val>=0?'+':''}S/ ${fmt(s.val,0)} MM`; } } } },
      scales: { y: { title: { display: true, text: 'S/ millones' } } }
    }
  });
}

// ---------- 13. Spread ROIC-WACC + EVA sectorial ----------
function chart13_roicWaccEva() {
  const ctx = document.getElementById('chart-13').getContext('2d');
  const anios = DATA.anios;
  const spread = anios.map(a => +(DATA.roic_sectorial[String(a)] - DATA.wacc_sectorial[String(a)]).toFixed(2));
  const eva = DATA.eva_sector_millones;
  const spreadPos = spread.map(v => v >= 0 ? v : null);
  const spreadNeg = spread.map(v => v < 0 ? v : null);
  new Chart(ctx, {
    data: {
      labels: anios,
      datasets: [
        { type: 'bar', label: 'Spread positivo', data: spreadPos, backgroundColor: COLOR.verde, yAxisID: 'y', stack: 'spread' },
        { type: 'bar', label: 'Spread negativo', data: spreadNeg, backgroundColor: COLOR.terracota, yAxisID: 'y', stack: 'spread' },
        { type: 'line', label: 'EVA', data: eva, borderColor: '#1a1a1a', backgroundColor: '#1a1a1a', yAxisID: 'y1', tension: 0.2, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { callbacks: { label: (c) => c.dataset.yAxisID === 'y' ? `Spread: ${fmt(c.raw,2)} pp` : `EVA: S/ ${fmt(c.raw,0)} MM` } }
      },
      scales: {
        // Rangos simétricos alrededor de cero en ambos ejes para que el 0 quede a la misma
        // altura visual y las barras / la línea se lean en la misma "fila" cuando corresponde.
        y: { position: 'left', min: -6, max: 6, title: { display: true, text: 'ROIC − WACC (pp)' } },
        y1: { position: 'right', min: -200, max: 200, grid: { drawOnChartArea: false }, title: { display: true, text: 'EVA sectorial (S/ MM)' } }
      }
    }
  });
}

// ---------- 14. Burbuja D/E vs spread (tamaño = capital) ----------
function chart14_burbujaDeSpread() {
  const ctx = document.getElementById('chart-14').getContext('2d');
  const empresas = Object.keys(DATA.spread_promedio);
  const points = empresas.map(e => ({
    x: DATA.empresas[e]['D/E'][11] * 100,
    y: DATA.spread_promedio[e],
    r: Math.sqrt(DATA.capital_invertido_2025[e]) / 2.6,
    empresa: e
  }));
  new Chart(ctx, {
    type: 'bubble',
    data: { datasets: [{ data: points, backgroundColor: points.map(p => (DATA.grupo_coazucar[p.empresa]==='Coazúcar'?COLOR.verdeOscuro:COLOR.terracota) + 'aa') }] },
    plugins: [zonePlugin([
      { y1: 0, y2: 10, color: 'rgba(11,107,58,0.05)' },
      { y1: -10, y2: 0, color: 'rgba(160,82,45,0.05)' },
    ])],
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.raw.empresa}: D/E ${fmt(c.raw.x,0)}% · spread ${fmt(c.raw.y,2)} pp · capital S/${fmt(DATA.capital_invertido_2025[c.raw.empresa],0)} MM` } }
      },
      scales: {
        x: { title: { display: true, text: 'D/E 2025 (%)' } },
        y: { title: { display: true, text: 'Spread ROIC − WACC promedio (pp)' } }
      }
    }
  });
}

// ---------- 15. ROIC reportado vs contrafactual (Paramonga) ----------
function chart15_roicContrafactual() {
  const ctx = document.getElementById('chart-15').getContext('2d');
  const reportado = { '2022': DATA.empresas['PARAMONGA']['ROIC'][8]*100, '2024': DATA.empresas['PARAMONGA']['ROIC'][10]*100 };
  const cf = DATA.roic_paramonga_contrafactual;

  const roicLabelsPlugin = {
    id: 'roicLabelsPlugin',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      [0, 1].forEach(datasetIndex => {
        const meta = chart.getDatasetMeta(datasetIndex);
        const p0 = meta.data[0]; // ROIC reportado
        const p1 = meta.data[1]; // ROIC contrafactual
        if (!p0 || !p1) return;
        const color = datasetIndex === 0 ? COLOR.verdeOscuro : COLOR.terracota;
        const year = datasetIndex === 0 ? '2022' : '2024';
        const v0 = datasetIndex === 0 ? reportado['2022'] : reportado['2024'];
        const v1 = datasetIndex === 0 ? cf['2022'] : cf['2024'];
        const diff = (v1 - v0).toFixed(2);

        // Etiqueta en el punto de inicio (año + valor)
        ctx.font = '700 12px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(year, p0.x - 14, p0.y - 4);
        ctx.fillText(fmt(v0, 2) + '%', p0.x - 14, p0.y + 12);

        // Etiqueta en el punto final (valor)
        ctx.textAlign = 'left';
        ctx.fillText(fmt(v1, 2) + '%', p1.x + 14, p1.y + 4);

        // Caja "+X.XX pp" en el punto medio de la línea (misma fila que la recta)
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        const text = '+' + diff + ' pp';
        ctx.font = '700 12px Inter, sans-serif';
        const w = ctx.measureText(text).width + 16;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(midX - w / 2, midY - 12, w, 22, 6) : ctx.rect(midX - w / 2, midY - 12, w, 22);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(text, midX, midY + 4);
      });
      ctx.restore();
    }
  };

  new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        { label: '2022', data: [{ x: 1, y: reportado['2022'] }, { x: 9, y: cf['2022'] }], borderColor: COLOR.verde, backgroundColor: COLOR.verde, pointRadius: 6, borderWidth: 3 },
        { label: '2024', data: [{ x: 1, y: reportado['2024'] }, { x: 9, y: cf['2024'] }], borderColor: COLOR.terracota, backgroundColor: COLOR.terracota, pointRadius: 6, borderWidth: 3 },
      ]
    },
    plugins: [roicLabelsPlugin],
    options: {
      responsive: true,
      layout: { padding: { left: 20, right: 20, top: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.raw.y,2)}%` } }
      },
      scales: {
        x: {
          type: 'linear', min: 0, max: 10,
          ticks: {
            stepSize: 1,
            maxRotation: 0, minRotation: 0,
            callback: (v) => v === 1 ? 'ROIC reportado' : v === 9 ? ['ROIC contrafactual', '(planta congelada)'] : ''
          },
          grid: { display: false }
        },
        y: { title: { display: true, text: 'ROIC (%)' } }
      }
    }
  });
}