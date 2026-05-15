// js/data.js — Duoc UC Library Data Manager (multi-year)
window.DuocData = (function () {
  'use strict';

  const LIBRARIES = [
    { id: 'antonio-varas',   name: 'Antonio Varas',   city: 'Santiago',     region: 'RM',         mult: 1.2 },
    { id: 'alonso-ovalle',   name: 'Alonso Ovalle',   city: 'Santiago',     region: 'RM',         mult: 1.1 },
    { id: 'alameda',         name: 'Alameda',          city: 'Santiago',     region: 'RM',         mult: 2.5 },
    { id: 'arauco',          name: 'Arauco',           city: 'Arauco',       region: 'Bío-Bío',    mult: 1.0 },
    { id: 'concepcion',      name: 'Concepción',       city: 'Concepción',   region: 'Bío-Bío',    mult: 1.6 },
    { id: 'maipu',           name: 'Maipú',            city: 'Maipú',        region: 'RM',         mult: 1.2 },
    { id: 'melipilla',       name: 'Melipilla',        city: 'Melipilla',    region: 'RM',         mult: 0.5 },
    { id: 'nacimiento',      name: 'Nacimiento',       city: 'Nacimiento',   region: 'Bío-Bío',    mult: 0.3 },
    { id: 'plaza-norte',     name: 'Plaza Norte',      city: 'Santiago',     region: 'RM',         mult: 1.1 },
    { id: 'plaza-oeste',     name: 'Plaza Oeste',      city: 'Santiago',     region: 'RM',         mult: 1.0 },
    { id: 'plaza-vespucio',  name: 'Plaza Vespucio',   city: 'Santiago',     region: 'RM',         mult: 1.8 },
    { id: 'puente-alto',     name: 'Puente Alto',      city: 'Puente Alto',  region: 'RM',         mult: 0.9 },
    { id: 'puerto-montt',    name: 'Puerto Montt',     city: 'Puerto Montt', region: 'Los Lagos',  mult: 0.8 },
    { id: 'san-bernardo',    name: 'San Bernardo',     city: 'San Bernardo', region: 'RM',         mult: 0.9 },
    { id: 'san-carlos',      name: 'San Carlos',       city: 'San Carlos',   region: 'Ñuble',      mult: 0.4 },
    { id: 'san-joaquin',     name: 'San Joaquín',      city: 'Santiago',     region: 'RM',         mult: 2.0 },
    { id: 'valparaiso',      name: 'Valparaíso',       city: 'Valparaíso',   region: 'Valparaíso', mult: 1.1 },
    { id: 'villarrica',      name: 'Villarrica',       city: 'Villarrica',   region: 'Araucanía',  mult: 0.3 },
    { id: 'vina-del-mar',    name: 'Viña del Mar',     city: 'Viña del Mar', region: 'Valparaíso', mult: 1.5 },
  ];

  const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const SEASONALITY  = [0.70, 0.50, 1.20, 1.40, 1.30, 1.10, 0.60, 1.00, 1.10, 1.20, 1.30, 0.50];

  // Years and their available months (2026 only up to April = current date)
  const YEARS = ['2024','2025','2026'];
  const YEAR_MONTHS = {
    '2024': Array.from({length:12}, (_,i) => `2024-${String(i+1).padStart(2,'0')}`),
    '2025': Array.from({length:12}, (_,i) => `2025-${String(i+1).padStart(2,'0')}`),
    '2026': Array.from({length:4},  (_,i) => `2026-${String(i+1).padStart(2,'0')}`), // Jan–Apr
  };
  // All month keys across all years
  const ALL_MONTH_KEYS = [...YEAR_MONTHS['2024'], ...YEAR_MONTHS['2025'], ...YEAR_MONTHS['2026']];
  // Legacy alias
  const MONTH_KEYS = YEAR_MONTHS['2025'];

  // Year growth factors (2024 baseline → 2025 +8% → 2026 partial)
  const YEAR_GROWTH = { '2024': 0.93, '2025': 1.0, '2026': 1.08 };

  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return () => {
      s += 0x6D2B79F5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const BASE = {
    cuentapersonas: 640, bdd: 19.8, libros: 64.6, medialink: 3.9,
    prestamos: 16.5, renovaciones: 29.7, usoInterno: 16.0, revistas: 1.2,
    calculadoras: 11.2, notebooks: 7.9, juegos: 5.4,
    inducciones: 11.8, talleres: 5.2, asesorias: 0.8,
  };

  function generateSampleData() {
    const rand = makeRng(42);
    const result = {};
    LIBRARIES.forEach(lib => {
      result[lib.id] = {};
      YEARS.forEach(year => {
        const g = YEAR_GROWTH[year];
        YEAR_MONTHS[year].forEach((key, mi) => {
          const s = SEASONALITY[mi], m = lib.mult;
          const v = base => Math.max(0, Math.round(base * m * s * g * (0.88 + rand() * 0.24)));
          result[lib.id][key] = {
            cuentapersonas: v(BASE.cuentapersonas),
            bdd: v(BASE.bdd), libros: v(BASE.libros), medialink: v(BASE.medialink),
            prestamos: v(BASE.prestamos), renovaciones: v(BASE.renovaciones),
            usoInterno: v(BASE.usoInterno), revistas: v(BASE.revistas),
            calculadoras: v(BASE.calculadoras), notebooks: v(BASE.notebooks), juegos: v(BASE.juegos),
            inducciones: v(BASE.inducciones), talleres: v(BASE.talleres), asesorias: Math.max(0, v(BASE.asesorias)),
            matricula: Math.round(840 * m * g),
          };
        });
      });
    });
    return result;
  }

  const STORAGE_KEY = 'duoc_lib_v4';

  function loadData() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return JSON.parse(s);
    } catch (_) {}
    const sample = generateSampleData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
    return sample;
  }

  function saveData(data)  { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  function resetData()     { localStorage.removeItem(STORAGE_KEY); return loadData(); }

  const FIELDS = ['cuentapersonas','bdd','libros','medialink','prestamos','renovaciones',
    'usoInterno','revistas','calculadoras','notebooks','juegos','inducciones','talleres','asesorias'];

  function getAvailableMonths(data, libId, year) {
    const keys = year ? (YEAR_MONTHS[year] || []) : ALL_MONTH_KEYS;
    if (libId === 'overview') {
      const set = new Set();
      LIBRARIES.forEach(l => Object.keys(data[l.id] || {}).forEach(k => set.add(k)));
      return keys.filter(k => set.has(k));
    }
    return keys.filter(k => data[libId] && data[libId][k]);
  }

  function getLibraryData(data, libId, months) {
    const lib = data[libId]; if (!lib) return null;
    const totals = Object.fromEntries(FIELDS.map(f => [f, 0]));
    const monthly = months.map(key => {
      const d = lib[key] || {};
      FIELDS.forEach(f => totals[f] += d[f] || 0);
      const mi = parseInt(key.split('-')[1]) - 1;
      return { key, label: MONTH_LABELS[mi], yearMonth: key, ...d };
    });
    totals.matricula = lib[months[0]]?.matricula || 0;
    totals.monthlyData = monthly;
    totals.availableMonths = months;
    return totals;
  }

  function getOverviewData(data, months) {
    const totals = Object.fromEntries(FIELDS.map(f => [f, 0]));
    totals.matricula = 0;
    LIBRARIES.forEach(lib => {
      const d = data[lib.id]; if (!d) return;
      months.forEach(key => {
        const m = d[key]; if (!m) return;
        FIELDS.forEach(f => totals[f] += m[f] || 0);
      });
      totals.matricula += data[lib.id]?.[months[0]]?.matricula || 0;
    });
    const monthly = months.map(key => {
      const m = { key, label: MONTH_LABELS[parseInt(key.split('-')[1]) - 1], yearMonth: key };
      FIELDS.forEach(f => m[f] = 0); m.matricula = 0;
      LIBRARIES.forEach(lib => {
        const d = data[lib.id]?.[key]; if (!d) return;
        FIELDS.forEach(f => m[f] += d[f] || 0);
        m.matricula += d.matricula || 0;
      });
      return m;
    });
    totals.monthlyData = monthly; totals.availableMonths = months;
    return totals;
  }

  function getLibrarySummaries(data, months) {
    return LIBRARIES.map(lib => ({ ...lib, ...getLibraryData(data, lib.id, months) }));
  }

  // Returns {year: aggregatedData} for comparative view
  function getYearComparison(data, libId) {
    const result = {};
    YEARS.forEach(year => {
      const months = getAvailableMonths(data, libId, year);
      if (!months.length) return;
      result[year] = libId === 'overview'
        ? getOverviewData(data, months)
        : getLibraryData(data, libId, months);
    });
    return result;
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const vals = line.split(',').map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
    });
  }

  function parseXML(text) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const err = doc.querySelector('parsererror');
    if (err) throw new Error('XML inválido: ' + err.textContent.slice(0, 120));
    const items = doc.querySelectorAll('registro');
    if (!items.length) throw new Error('No se encontraron elementos <registro> en el XML.');
    return Array.from(items).map(r => {
      const g = tag => r.querySelector(tag)?.textContent?.trim() || '';
      return {
        mes: g('mes'), biblioteca_id: g('biblioteca_id'),
        cuentapersonas: g('cuentapersonas'), bdd: g('bdd'),
        libros_digitales: g('libros_digitales'), medialink: g('medialink'),
        prestamos: g('prestamos'), renovaciones: g('renovaciones'),
        uso_interno: g('uso_interno'), revistas: g('revistas'),
        calculadoras: g('calculadoras'), notebooks: g('notebooks'), juegos: g('juegos'),
        inducciones: g('inducciones'), talleres: g('talleres'),
        asesorias: g('asesorias'), matricula: g('matricula'),
      };
    });
  }

  // Partial merge — only overwrites fields relevant to the indicator type
  function mergePartialData(existing, updates, type) {
    const fieldMap = {
      cuentapersonas: ['cuentapersonas'],
      formativas:     ['inducciones','talleres','asesorias'],
      bibliograficos: ['prestamos','renovaciones','usoInterno','revistas','calculadoras','notebooks','juegos'],
      digitales:      ['bdd','libros','medialink'],
    };
    const fields = fieldMap[type] || [];
    const nd = JSON.parse(JSON.stringify(existing));
    updates.forEach(u => {
      const { biblioteca_id:id, mes } = u;
      if (!id || !mes) return;
      if (!nd[id]) nd[id] = {};
      if (!nd[id][mes]) nd[id][mes] = {};
      fields.forEach(f => { if (u[f] !== undefined) nd[id][mes][f] = u[f]; });
    });
    return nd;
  }

  function mergeUploadedData(existing, rows) {
    const nd = JSON.parse(JSON.stringify(existing));
    rows.forEach(r => {
      const id = r.biblioteca_id, month = r.mes;
      if (!id || !month) return;
      if (!nd[id]) nd[id] = {};
      nd[id][month] = {
        cuentapersonas: +r.cuentapersonas || 0,
        bdd: +r.bdd || 0, libros: +r.libros_digitales || 0, medialink: +r.medialink || 0,
        prestamos: +r.prestamos || 0, renovaciones: +r.renovaciones || 0,
        usoInterno: +r.uso_interno || 0, revistas: +r.revistas || 0,
        calculadoras: +r.calculadoras || 0, notebooks: +r.notebooks || 0, juegos: +r.juegos || 0,
        inducciones: +r.inducciones || 0, talleres: +r.talleres || 0, asesorias: +r.asesorias || 0,
        matricula: +r.matricula || 0,
      };
    });
    return nd;
  }

  function getCSVTemplate() {
    const header = 'mes,biblioteca_id,cuentapersonas,bdd,libros_digitales,medialink,prestamos,renovaciones,uso_interno,revistas,calculadoras,notebooks,juegos,inducciones,talleres,asesorias,matricula';
    const rows = LIBRARIES.slice(0, 3).map(l =>
      `2026-05,${l.id},${Math.round(800*l.mult)},${Math.round(20*l.mult)},${Math.round(60*l.mult)},${Math.round(4*l.mult)},${Math.round(15*l.mult)},${Math.round(28*l.mult)},${Math.round(15*l.mult)},1,${Math.round(10*l.mult)},${Math.round(7*l.mult)},${Math.round(5*l.mult)},${Math.round(12*l.mult)},${Math.round(5*l.mult)},1,${Math.round(840*l.mult)}`
    ).join('\n');
    return `${header}\n${rows}`;
  }

  function getXMLTemplate() {
    const rows = LIBRARIES.slice(0, 2).map(l => `
  <registro>
    <mes>2026-05</mes>
    <biblioteca_id>${l.id}</biblioteca_id>
    <cuentapersonas>${Math.round(800*l.mult)}</cuentapersonas>
    <bdd>${Math.round(20*l.mult)}</bdd>
    <libros_digitales>${Math.round(60*l.mult)}</libros_digitales>
    <medialink>${Math.round(4*l.mult)}</medialink>
    <prestamos>${Math.round(15*l.mult)}</prestamos>
    <renovaciones>${Math.round(28*l.mult)}</renovaciones>
    <uso_interno>${Math.round(15*l.mult)}</uso_interno>
    <revistas>1</revistas>
    <calculadoras>${Math.round(10*l.mult)}</calculadoras>
    <notebooks>${Math.round(7*l.mult)}</notebooks>
    <juegos>${Math.round(5*l.mult)}</juegos>
    <inducciones>${Math.round(12*l.mult)}</inducciones>
    <talleres>${Math.round(5*l.mult)}</talleres>
    <asesorias>1</asesorias>
    <matricula>${Math.round(840*l.mult)}</matricula>
  </registro>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<datos>${rows}\n</datos>`;
  }

  const fmtNum = n => Math.round(n || 0).toLocaleString('es-CL');
  const fmtPct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) + '%' : '0%';

  return {
    LIBRARIES, YEARS, YEAR_MONTHS, ALL_MONTH_KEYS,
    MONTH_LABELS, MONTH_KEYS, SEASONALITY,
    loadData, saveData, resetData,
    getAvailableMonths, getLibraryData, getOverviewData, getLibrarySummaries, getYearComparison,
    parseCSV, parseXML, mergeUploadedData, mergePartialData, getCSVTemplate, getXMLTemplate,
    fmtNum, fmtPct,
  };
})();
