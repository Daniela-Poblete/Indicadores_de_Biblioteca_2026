// js/parsers.js — Specific file parsers for each indicator type
// Handles Excel (.xlsx) via SheetJS and CSV/text formats
window.DuocParsers = (function () {
  'use strict';

  // ── Month name → number ───────────────────────────────────────────────────
  const MONTH_ES = {
    ene:1, feb:2, mar:3, abr:4, may:5, jun:6,
    jul:7, ago:8, sep:9, oct:10, nov:11, dic:12,
    // fallback english
    jan:1, apr:4, aug:8, dec:12
  };

  // ── Alpha sede code → library ID ──────────────────────────────────────────
  const ALPHA_MAP = {
    // Two-letter codes (official Duoc SEDE_cods)
    'AL':'alameda','AO':'alonso-ovalle','AV':'antonio-varas',
    'AR':'arauco','CO':'concepcion','MA':'maipu',
    'ME':'melipilla','ML':'melipilla',
    'NA':'nacimiento','PN':'plaza-norte',
    'PO':'plaza-oeste','PV':'plaza-vespucio','PA':'puente-alto',
    'PM':'puerto-montt','SB':'san-bernardo','SC':'san-carlos',
    'SJ':'san-joaquin','VA':'valparaiso','QU':'valparaiso','LC':'valparaiso',
    'VR':'villarrica','VI':'villarrica','VM':'vina-del-mar',
    'PM':'puerto-montt','SB':'san-bernardo','SC':'san-carlos',
    'SJ':'san-joaquin','VA':'valparaiso','QU':'valparaiso',
    'VR':'villarrica','VM':'vina-del-mar',
    // Full names
    'ALAMEDA':'alameda',
    'PADRE ALONSO DE OVALLE':'alonso-ovalle','ALONSO DE OVALLE':'alonso-ovalle',
    'ANTONIO VARAS':'antonio-varas',
    'ARAUCO':'arauco','CAMPUS ARAUCO':'arauco',
    'CONCEPCION':'concepcion','CONCEPCIÓN':'concepcion','SAN ANDRES DE CONCEPCION':'concepcion','SAN ANDRÉS DE CONCEPCIÓN':'concepcion',
    'MAIPU':'maipu','MAIPÚ':'maipu',
    'MELIPILLA':'melipilla',
    'NACIMIENTO':'nacimiento','CAMPUS NACIMIENTO':'nacimiento',
    'PLAZA NORTE':'plaza-norte','PLAZA OESTE':'plaza-oeste','PLAZA VESPUCIO':'plaza-vespucio',
    'PUENTE ALTO':'puente-alto','PUERTO MONTT':'puerto-montt',
    'SAN BERNARDO':'san-bernardo',
    'SAN CARLOS':'san-carlos','SAN CARLOS DE APOQUINDO':'san-carlos',
    'SAN JOAQUIN':'san-joaquin','SAN JOAQUÍN':'san-joaquin',
    'VALPARAISO':'valparaiso','VALPARAÍSO':'valparaiso',
    'VALP - BRASIL':'valparaiso','VALP. BRASIL':'valparaiso','VALP - BRASIL ':'valparaiso',
    'VALP - QUILLOTA':'valparaiso','VALP. QUILLOTA':'valparaiso',
    'VALP - LUIS COUSIÑO':'valparaiso','VALP. LUIS COUSIÑO':'valparaiso',
    'VILLARRICA':'villarrica','VILLARICA':'villarrica','CAMPUS VILLARRICA':'villarrica',
    'VIÑA DEL MAR':'vina-del-mar','VINA DEL MAR':'vina-del-mar',
  };

  // Numeric code → library ID (official Duoc SEDE_cod codes)
  const NUMERIC_MAP = {
    '3':'valparaiso',       // VALP - BRASIL
    '5':'concepcion',       // San Andrés de Concepción
    '6':'vina-del-mar',     // Viña del Mar
    '8':'antonio-varas',    // Antonio Varas
    '9':'san-carlos',       // San Carlos de Apoquindo
    '10':'alameda',         // Alameda
    '11':'plaza-vespucio',  // Plaza Vespucio
    '12':'plaza-oeste',     // Plaza Oeste
    '13':'puente-alto',     // Puente Alto
    '14':'maipu',           // Maipú
    '16':'san-joaquin',     // San Joaquín
    '18':'san-bernardo',    // San Bernardo
    '19':'plaza-norte',     // Plaza Norte
    '29':'nacimiento',      // Campus Nacimiento
    '71':'valparaiso',      // Valp - Quillota
    '74':'arauco',          // Campus Arauco
    '75':'melipilla',       // Melipilla
    '76':'puerto-montt',    // Puerto Montt
    '77':'villarrica',      // Campus Villarrica
    '79':'alonso-ovalle',   // Padre Alonso de Ovalle
  };

  function resolveCode(raw) {
    if (!raw && raw !== 0) return null;
    const s = String(raw).trim();
    const upper = s.toUpperCase();
    return ALPHA_MAP[upper] || ALPHA_MAP[s] || NUMERIC_MAP[s] || null;
  }

  // Parse "ene-25", "sep-25", "ene-2025" → "2025-01"
  function parseMonthHeader(cell) {
    const s = String(cell || '').toLowerCase().trim();
    const m = s.match(/^([a-záéíóú]+)[_\-\s]?(\d{2,4})$/);
    if (!m) return null;
    const key = m[1].slice(0, 3).replace(/á/g,'a').replace(/é/g,'e');
    const num = MONTH_ES[key];
    if (!num) return null;
    const yr = m[2].length === 2 ? '20' + m[2] : m[2];
    return `${yr}-${String(num).padStart(2,'0')}`;
  }

  // Parse FECHA PRESTAMO: 20260301125728 (YYYYMMDDHHMMSS) → "2026-03"
  function parseFechaPrestamo(val) {
    const s = String(val || '').replace(/\D/g, '');
    if (s.length >= 6) return `${s.slice(0,4)}-${s.slice(4,6)}`;
    return null;
  }

  // Parse FECHA EJECUCION: "24-03-2026" or "24/03/2026" → "2026-03"
  // Also handles "2026-03-24" and numeric Excel dates
  function parseFechaEjecucion(val) {
    if (!val && val !== 0) return null;
    // Excel serial date (number)
    if (typeof val === 'number') {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      const y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1;
      return `${y}-${String(mo).padStart(2,'0')}`;
    }
    const s = String(val).trim();
    const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m1) return `${m1[3]}-${m1[2].padStart(2,'0')}`;
    const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m2) return `${m2[1]}-${m2[2].padStart(2,'0')}`;
    // "Mar 2026" or "marzo 2026"
    const m3 = s.toLowerCase().match(/^([a-z]+)[\s\-]+(\d{4})$/);
    if (m3) {
      const num = MONTH_ES[m3[1].slice(0,3)];
      if (num) return `${m3[2]}-${String(num).padStart(2,'0')}`;
    }
    return null;
  }

  function cleanNumber(val) {
    if (typeof val === 'number') return val;
    return parseInt(String(val || 0).replace(/[.,\s$]/g, '')) || 0;
  }

  // ── Read file → 2D array of rows ─────────────────────────────────────────
  async function getRows(file) {
    const name = file.name.toLowerCase();
    const isXLSX = name.match(/\.xlsx?$/i);
    if (isXLSX && window.XLSX) {
      const buf = await file.arrayBuffer();
      const wb  = window.XLSX.read(buf, { type:'array', cellDates:false });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      return window.XLSX.utils.sheet_to_json(ws, { header:1, defval:'' });
    }
    // CSV / TXT fallback
    const text = await file.text();
    const sep  = text.includes('\t') ? '\t' : ',';
    return text.trim().split(/\r?\n/).map(l =>
      l.split(sep).map(v => v.trim().replace(/^["']|["']$/g,''))
    );
  }

  // ── Find a column index by partial header names ───────────────────────────
  function findCol(headers, ...keywords) {
    const h = headers.map(c => String(c).toUpperCase().trim());
    for (const kw of keywords) {
      const i = h.findIndex(c => c.includes(kw.toUpperCase()));
      if (i >= 0) return i;
    }
    return -1;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARSER 1 — CUENTAPERSONAS
  // Format: wide, rows = sedes, col A = name, col B = code, cols C+ = months
  // ══════════════════════════════════════════════════════════════════════════
  async function parseCuentapersonas(file) {
    const rows = await getRows(file);
    const results = [];
    const unmatched = [];
    let headerIdx = -1, monthCols = [];

    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const found = [];
      rows[i].forEach((cell, ci) => {
        const mes = parseMonthHeader(cell);
        if (mes) found.push({ ci, mes });
      });
      if (found.length >= 3) { headerIdx = i; monthCols = found; break; }
    }
    if (headerIdx < 0) throw new Error('No se encontraron columnas de meses (ene-XX, feb-XX…)');

    // Find sede code column — look for a column that contains 2-letter codes
    // Default: col 0 = name, col 1 = code (as seen in screenshot)
    const codeColIdx = 1;

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      const nameVal = String(r[0] || '').trim();
      const codeVal = String(r[codeColIdx] || '').trim();
      if (!nameVal) continue;
      if (['TOTAL','TOTALES','SISTEMA'].some(t => nameVal.toUpperCase().includes(t))) continue;

      const libId = resolveCode(codeVal) || resolveCode(nameVal);
      if (!libId) { unmatched.push(`"${codeVal||nameVal}"`); continue; }

      monthCols.forEach(({ ci, mes }) => {
        const val = cleanNumber(r[ci]);
        if (val > 0) results.push({ biblioteca_id:libId, mes, cuentapersonas:val });
      });
    }

    return { results, unmatched:[...new Set(unmatched)], type:'cuentapersonas',
      summary: `${results.length} registros · ${[...new Set(results.map(r=>r.biblioteca_id))].length} sedes` };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARSER 2 — ACCIONES FORMATIVAS
  // Format: row-level, one row per participant/asistente
  // SEDE (numeric), ..., FECHA EJECUCION (DD-MM-AAAA), ..., ACTIVIDAD
  // ══════════════════════════════════════════════════════════════════════════
  async function parseAccionesFormativas(file) {
    const rows = await getRows(file);
    const counts = {};  // {libId: {mes: {ind, tall, ases}}}
    const unmatched = [];
    let headerIdx = -1;
    let colSede = 0, colFecha = 4, colActividad = 6;

    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const r = rows[i];
      const h = r.map(c => String(c).toUpperCase().trim());
      if (h.includes('SEDE') || h.some(c => c.includes('FECHA EJEC'))) {
        headerIdx = i;
        const s = findCol(h,'SEDE'); if (s>=0) colSede=s;
        const f = findCol(h,'FECHA EJEC','FECHA'); if (f>=0) colFecha=f;
        const a = findCol(h,'ACTIVIDAD'); if (a>=0) colActividad=a;
        break;
      }
    }

    const start = headerIdx >= 0 ? headerIdx + 1 : 1;

    for (let i = start; i < rows.length; i++) {
      const r = rows[i];
      const sedeRaw  = r[colSede];
      const fechaRaw = r[colFecha];
      const actRaw   = String(r[colActividad] || '').toUpperCase().trim();
      if (!sedeRaw && sedeRaw !== 0) continue;

      const libId = resolveCode(sedeRaw);
      const mes   = parseFechaEjecucion(fechaRaw);
      if (!libId) { unmatched.push(String(sedeRaw)); continue; }
      if (!mes) continue;

      if (!counts[libId]) counts[libId] = {};
      if (!counts[libId][mes]) counts[libId][mes] = { ind:0, tall:0, ases:0 };

      if (actRaw.includes('ASESO')) counts[libId][mes].ases++;
      else if (actRaw.includes('TALLER')) counts[libId][mes].tall++;
      else counts[libId][mes].ind++; // INDUCCION + default
    }

    const results = [];
    Object.entries(counts).forEach(([libId, months]) => {
      Object.entries(months).forEach(([mes, c]) => {
        results.push({ biblioteca_id:libId, mes,
          inducciones:c.ind, talleres:c.tall, asesorias:c.ases });
      });
    });

    return { results, unmatched:[...new Set(unmatched)], type:'formativas',
      summary:`${Object.values(counts).reduce((a,b)=>a+Object.values(b).reduce((x,y)=>x+y.ind+y.tall+y.ases,0),0)} asistencias · ${[...new Set(results.map(r=>r.biblioteca_id))].length} sedes` };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARSER 3 — RECURSOS BIBLIOGRÁFICOS Y NO BIBLIOGRÁFICOS
  // Format: row-level, one row per transaction
  // Cols: …BIB.PRES…FECHA PRESTAMO…TIPO TRAN…
  // ══════════════════════════════════════════════════════════════════════════
  async function parseBibliograficos(file) {
    const rows = await getRows(file);
    const counts = {};
    const unmatched = [];
    let headerIdx = -1;
    // Fallback positions from screenshot (0-indexed): BIB.PRES=9, FECHA=10, TIPO=11
    let colBib = 9, colFecha = 10, colTipo = 11;

    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const h = rows[i].map(c => String(c).toUpperCase().trim());
      const b = findCol(h,'BIB.PRES','BIB PRES','BIBLIOTECA');
      const f = findCol(h,'FECHA PREST','FECHA_PRES','FECHAPREST');
      const t = findCol(h,'TIPO TRAN','TIPO_TRAN','TIPOTRAN','TIPO');
      if (b >= 0 || f >= 0) {
        headerIdx = i;
        if (b >= 0) colBib   = b;
        if (f >= 0) colFecha = f;
        if (t >= 0) colTipo  = t;
        break;
      }
    }

    const start = headerIdx >= 0 ? headerIdx + 1 : 1;

    for (let i = start; i < rows.length; i++) {
      const r = rows[i];
      const bibRaw   = String(r[colBib]  || '').trim().toUpperCase();
      const fechaRaw = r[colFecha];
      const tipoRaw  = String(r[colTipo] || '').toUpperCase().trim();
      if (!bibRaw) continue;

      const libId = resolveCode(bibRaw);
      const mes   = parseFechaPrestamo(fechaRaw) || parseFechaEjecucion(fechaRaw);
      if (!libId) { unmatched.push(bibRaw); continue; }
      if (!mes) continue;

      if (!counts[libId]) counts[libId] = {};
      if (!counts[libId][mes]) counts[libId][mes] = { prest:0, reno:0, interno:0, rev:0, calc:0, note:0, jueg:0 };
      const c = counts[libId][mes];

      if (tipoRaw.includes('RENOV'))                    c.reno++;
      else if (tipoRaw.includes('AUTOPRES') || tipoRaw.includes('AUTO-PRES')) c.prest++;
      else if (tipoRaw.includes('PRES'))                c.prest++;
      else if (tipoRaw.includes('INTERNO'))             c.interno++;
      else if (tipoRaw.includes('REVISTA'))             c.rev++;
      else if (tipoRaw.includes('CALC'))                c.calc++;
      else if (tipoRaw.includes('NOTE') || tipoRaw.includes('NOTEBOOK')) c.note++;
      else if (tipoRaw.includes('JUEG'))                c.jueg++;
      else                                              c.prest++; // default
    }

    const results = [];
    Object.entries(counts).forEach(([libId, months]) => {
      Object.entries(months).forEach(([mes, c]) => {
        results.push({
          biblioteca_id:libId, mes,
          prestamos:c.prest, renovaciones:c.reno,
          usoInterno:c.interno, revistas:c.rev,
          calculadoras:c.calc, notebooks:c.note, juegos:c.jueg,
        });
      });
    });

    const total = Object.values(counts).reduce((a,b)=>a+Object.values(b).reduce((x,y)=>x+y.prest+y.reno+y.interno+y.rev,0),0);
    return { results, unmatched:[...new Set(unmatched)], type:'bibliograficos',
      summary:`${total} transacciones · ${[...new Set(results.map(r=>r.biblioteca_id))].length} sedes` };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PARSER 4 — RECURSOS DIGITALES
  // Format TBD — supports both wide (like cuentapersonas) and column-per-resource
  // ══════════════════════════════════════════════════════════════════════════
  async function parseDigitales(file) {
    const rows = await getRows(file);
    const results = [];
    const unmatched = [];
    let headerIdx = -1, monthCols = [];
    let colBDD = -1, colLibros = -1, colMedia = -1;

    for (let i = 0; i < Math.min(rows.length, 8); i++) {
      const r   = rows[i];
      const h   = r.map(c => String(c).toUpperCase().trim());
      // Check month-wide format
      const mCols = [];
      r.forEach((cell, ci) => { const m = parseMonthHeader(cell); if (m) mCols.push({ci,mes:m}); });
      if (mCols.length >= 3) { headerIdx = i; monthCols = mCols; break; }
      // Check named resource columns
      const b = findCol(h,'BDD','BASE DE DATOS','BASES DE DATOS');
      const l = findCol(h,'LIBRO DIGITAL','LIBROS DIGITAL','LIBRO_DIG');
      const ml= findCol(h,'MEDIA','MEDIALINK');
      if (b>=0 || l>=0) { headerIdx=i; colBDD=b; colLibros=l; colMedia=ml; break; }
    }

    if (headerIdx < 0) throw new Error('Formato no reconocido. Se esperan columnas de meses (ene-XX) o columnas BDD / Libros Digitales.');

    if (monthCols.length > 0) {
      // Wide format
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        const nameVal = String(r[0]||'').trim();
        const codeVal = String(r[1]||'').trim();
        if (!nameVal || nameVal.toUpperCase().includes('TOTAL')) continue;
        const libId = resolveCode(codeVal) || resolveCode(nameVal);
        if (!libId) { unmatched.push(codeVal||nameVal); continue; }
        monthCols.forEach(({ci,mes}) => {
          const val = cleanNumber(r[ci]);
          if (val > 0) results.push({biblioteca_id:libId, mes, bdd:val, libros:0, medialink:0});
        });
      }
    } else {
      // Column-per-resource format: rows have SEDE, MES, BDD, LIBROS, MEDIALINK
      const hRow = rows[headerIdx].map(c=>String(c).toUpperCase().trim());
      const colSede = findCol(hRow,'SEDE','BIBLIOTECA'); // fallback 0
      const colMes  = findCol(hRow,'MES','PERIODO','FECHA');
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        const sedeRaw = r[colSede >= 0 ? colSede : 0];
        const mesRaw  = colMes >= 0 ? r[colMes] : null;
        const libId   = resolveCode(sedeRaw);
        const mes     = mesRaw ? (parseMonthHeader(mesRaw)||parseFechaEjecucion(mesRaw)) : null;
        if (!libId || !mes) { if (!libId) unmatched.push(String(sedeRaw||'')); continue; }
        results.push({
          biblioteca_id:libId, mes,
          bdd:     colBDD    >= 0 ? cleanNumber(r[colBDD])    : 0,
          libros:  colLibros >= 0 ? cleanNumber(r[colLibros]) : 0,
          medialink: colMedia  >= 0 ? cleanNumber(r[colMedia])  : 0,
        });
      }
    }

    return { results, unmatched:[...new Set(unmatched)], type:'digitales',
      summary:`${results.length} registros · ${[...new Set(results.map(r=>r.biblioteca_id))].length} sedes` };
  }

  // ── Numeric code map for admin inspection ────────────────────────────────
  const NUMERIC_MAP_INFO = NUMERIC_MAP; // exported for display

  return {
    parseCuentapersonas, parseAccionesFormativas,
    parseBibliograficos, parseDigitales,
    resolveCode, ALPHA_MAP, NUMERIC_MAP_INFO,
    parseMonthHeader, parseFechaPrestamo, parseFechaEjecucion,
  };
})();
