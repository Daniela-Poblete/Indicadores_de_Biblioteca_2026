// js/cuentapersonas-parser.js — Torniquete file parsers for Cuentapersonas
// Format A: Time | Source | Serial | Count   (general — torniquetes per row)
// Format B: 1ra fila = fecha, luego Time | Counter Name | Gente en | Gente fuera  (AV/PV)
window.DuocCPParser = (function () {
  'use strict';

  // Biblioteca name (any form) → library id
  const ALIAS = {
    'ALAMEDA':'alameda', 'ALONSO OVALLE':'alonso-ovalle','ALONSO DE OVALLE':'alonso-ovalle',
    'ANTONIO VARAS':'antonio-varas','ARAUCO':'arauco',
    'CONCEPCION':'concepcion','CONCEPCIÓN':'concepcion',
    'MAIPU':'maipu','MAIPÚ':'maipu',
    'MELIPILLA':'melipilla','NACIMIENTO':'nacimiento',
    'PLAZA NORTE':'plaza-norte','PLAZA OESTE':'plaza-oeste','PLAZA VESPUCIO':'plaza-vespucio',
    'PUENTE ALTO':'puente-alto','PUERTO MONTT':'puerto-montt',
    'SAN BERNARDO':'san-bernardo','SAN CARLOS':'san-carlos',
    'SAN CARLOS DE APOQUINDO':'san-carlos',
    'SAN JOAQUIN':'san-joaquin','SAN JOAQUÍN':'san-joaquin',
    'VALPARAISO':'valparaiso','VALPARAÍSO':'valparaiso',
    'VILLARRICA':'villarrica','VILLARICA':'villarrica',
    'VIÑA DEL MAR':'vina-del-mar','VINA DEL MAR':'vina-del-mar',
    'CAMARA VIÑA DEL MAR':'vina-del-mar','CAMARA VINA DEL MAR':'vina-del-mar',
    'VALP - LUIS COUSIÑO':'valparaiso','VALP LUIS COUSIÑO':'valparaiso','LUIS COUSIÑO':'valparaiso',
  };

  // Resolve a Source like "Cuenta Personas Maipu 2" or "Camara Viña del Mar 1"
  function resolveSource(s) {
    if (!s) return null;
    let cleaned = String(s).toUpperCase().trim()
      .replace(/^CUENTA\s+PERSONAS?\s*/i,'')
      .replace(/^CUENTAPERSONAS?\s*/i,'')
      .replace(/\s+\d+$/,'')         // strip trailing turnstile number
      .trim();
    if (ALIAS[cleaned]) return ALIAS[cleaned];
    // Try fuzzy
    for (const k of Object.keys(ALIAS)) if (cleaned.includes(k)) return ALIAS[k];
    return null;
  }

  // Parse cell to {date, hour} where date='YYYY-MM-DD' and hour=0..23
  function parseTimeCell(val) {
    if (val == null || val === '') return null;
    // Excel serial number
    if (typeof val === 'number') {
      const ms = Math.round((val - 25569) * 86400 * 1000);
      const d  = new Date(ms);
      return {
        date: `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`,
        hour: d.getUTCHours()
      };
    }
    const s = String(val).trim();
    // "01-04-2026 00:00" or "01/04/2026 14:30"
    let m = s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})\s+(\d{1,2}):(\d{2})/);
    if (m) return { date: `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`, hour: parseInt(m[4]) };
    // "2026-04-01 14:00"
    m = s.match(/^(\d{4})\-(\d{2})\-(\d{2})\s+(\d{1,2}):(\d{2})/);
    if (m) return { date: `${m[1]}-${m[2]}-${m[3]}`, hour: parseInt(m[4]) };
    // pure hour "14:00" — no date
    m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m) return { date: null, hour: parseInt(m[1]) };
    return null;
  }

  // Extract date from "miércoles, 1 de abril de 2026" → "2026-04-01"
  const MES = { enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,octubre:10,noviembre:11,diciembre:12 };
  function parseSpanishDate(s) {
    if (!s) return null;
    const m = String(s).toLowerCase().match(/(\d{1,2})\s+de\s+([a-zñ]+)\s+de\s+(\d{4})/);
    if (!m) return null;
    const mn = MES[m[2]]; if (!mn) return null;
    return `${m[3]}-${String(mn).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }

  async function getSheets(file) {
    const buf = await file.arrayBuffer();
    const wb  = window.XLSX.read(buf, { type:'array', cellDates:false });
    return wb.SheetNames.map(n => ({ name:n, rows: window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header:1, defval:'' }) }));
  }

  // Hourly window 07–23 inclusive
  const inWindow = h => h >= 7 && h <= 23;

  // Returns hourly[libId][YYYY-MM-DD][hour] = count
  async function parseFile(file) {
    const sheets = await getSheets(file);
    const hourly = {};
    const unmatched = new Set();
    let totalRows = 0;

    function add(libId, date, hour, count) {
      if (!libId || !date || hour == null || !inWindow(hour) || !count) return;
      if (!hourly[libId])             hourly[libId] = {};
      if (!hourly[libId][date])       hourly[libId][date] = {};
      hourly[libId][date][hour] = (hourly[libId][date][hour] || 0) + count;
    }

    for (const sh of sheets) {
      const rows = sh.rows;
      if (!rows.length) continue;
      // Detect format
      const header = rows[0].map(c => String(c).toUpperCase().trim());
      const isFormatA = header.includes('SOURCE') || header.some(h => h.includes('SOURCE'));
      const isFormatB = header.some(h => h.includes('COUNTER NAME')) || header.includes('GENTE EN');

      if (isFormatA) {
        // Time | Source | Serial | Count
        const ci = {
          time:   header.findIndex(h => h.includes('TIME') || h.includes('FECHA')),
          source: header.findIndex(h => h.includes('SOURCE')),
          count:  header.findIndex(h => h.includes('COUNT') || h.includes('ENTRADA')),
        };
        if (ci.time < 0)   ci.time = 0;
        if (ci.source < 0) ci.source = 1;
        if (ci.count < 0)  ci.count = 3;
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const t = parseTimeCell(r[ci.time]);
          const lib = resolveSource(r[ci.source]);
          const cnt = parseInt(String(r[ci.count]).replace(/[.,\s]/g,'')) || 0;
          if (!lib && r[ci.source]) unmatched.add(String(r[ci.source]));
          if (t?.date) { add(lib, t.date, t.hour, cnt); totalRows++; }
        }
      } else if (isFormatB) {
        // Format B (AV / PV) — first cell of header row IS the date
        const dateLabel = rows[0][0];
        const sheetDate = parseSpanishDate(dateLabel);
        // Find columns
        const hdr = rows[0].map(c => String(c).toUpperCase().trim());
        const ci = {
          time:    0,
          name:    hdr.findIndex(h => h.includes('COUNTER NAME') || h.includes('NOMBRE')),
          genteEn: hdr.findIndex(h => h.includes('GENTE EN') || h.includes('ENTRADA') || h === 'ENTRADAS'),
        };
        if (ci.name < 0) ci.name = 1;
        if (ci.genteEn < 0) ci.genteEn = 2;
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const tCell = r[ci.time];
          const t = parseTimeCell(tCell);
          const lib = resolveSource(r[ci.name]);
          const cnt = parseInt(String(r[ci.genteEn]).replace(/[.,\s]/g,'')) || 0;
          if (!lib && r[ci.name]) unmatched.add(String(r[ci.name]));
          if (t && lib) {
            const date = t.date || sheetDate;
            if (date) { add(lib, date, t.hour, cnt); totalRows++; }
          }
        }
      } else {
        // Heuristic: try Format A defaults
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const t = parseTimeCell(r[0]);
          const lib = resolveSource(r[1]);
          const cnt = parseInt(String(r[3] || r[2]).replace(/[.,\s]/g,'')) || 0;
          if (t?.date && lib) { add(lib, t.date, t.hour, cnt); totalRows++; }
          else if (r[1]) unmatched.add(String(r[1]));
        }
      }
    }

    // Summary
    const libs = Object.keys(hourly);
    const dates = new Set();
    let totalEntradas = 0;
    libs.forEach(l => Object.keys(hourly[l]).forEach(d => {
      dates.add(d);
      Object.values(hourly[l][d]).forEach(c => totalEntradas += c);
    }));

    return {
      hourly,
      summary: `${fmt(totalEntradas)} entradas · ${libs.length} sedes · ${dates.size} días (filtro 07:00–23:00)`,
      unmatched: [...unmatched],
    };
  }

  function fmt(n) { return Number(n||0).toLocaleString('es-CL'); }

  // Merge new hourly data into existing hourly store
  function mergeHourly(existing, incoming) {
    const out = JSON.parse(JSON.stringify(existing || {}));
    Object.entries(incoming).forEach(([lib, days]) => {
      if (!out[lib]) out[lib] = {};
      Object.entries(days).forEach(([d, hrs]) => {
        out[lib][d] = { ...(out[lib][d] || {}), ...hrs };
      });
    });
    return out;
  }

  // Aggregate hourly → monthly totals per biblioteca, for the legacy data shape
  function aggregateMonthly(hourly) {
    const monthly = {};
    Object.entries(hourly).forEach(([lib, days]) => {
      Object.entries(days).forEach(([date, hrs]) => {
        const mes = date.slice(0,7); // YYYY-MM
        const tot = Object.values(hrs).reduce((a,b) => a+b, 0);
        if (!monthly[lib]) monthly[lib] = {};
        monthly[lib][mes] = (monthly[lib][mes] || 0) + tot;
      });
    });
    return monthly;
  }

  return { parseFile, mergeHourly, aggregateMonthly, resolveSource };
})();
