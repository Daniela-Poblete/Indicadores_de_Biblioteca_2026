// js/formativas-parser.js — Acciones Formativas con Escuela y Carrera
// Columnas esperadas: SEDE | NOMBRE | NOMBRE DEL PARTICIPANTE | RUT | FECHA EJECUCION | FORMATO | ACTIVIDAD | ESCUELA | CARRERA
// Devuelve registros fila-a-fila para permitir filtros dinámicos.
window.DuocFormativasParser = (function () {
  'use strict';

  async function getRows(file) {
    const isCsv = /\.csv$/i.test(file.name);
    if (isCsv) {
      const text = await file.text();
      // Detect separator (; or ,)
      const firstLine = text.split(/\r?\n/)[0] || '';
      const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
      return text.split(/\r?\n/).filter(l => l.trim()).map(l => {
        // Simple split (sample doesn't use quoted commas inside fields)
        return l.split(sep).map(c => c.trim());
      });
    }
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type:'array', cellDates:false });
    return window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:'' });
  }

  function findCol(headers, ...keys) {
    for (const k of keys) {
      const i = headers.findIndex(h => h.includes(k));
      if (i >= 0) return i;
    }
    return -1;
  }

  function parseFecha(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') {
      const ms = Math.round((v - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
    const s = String(v).trim();
    let m = s.match(/^(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    m = s.match(/^(\d{4})\-(\d{1,2})\-(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    return null;
  }

  function activityType(s) {
    const u = String(s||'').toUpperCase();
    if (u.includes('CHARLA'))   return 'charla';
    if (u.includes('ASESO'))    return 'asesoria';
    if (u.includes('TALLER'))   return 'taller';
    if (u.includes('INDUC'))    return 'induccion';
    return 'otro';
  }

  async function parseFile(file) {
    const rows = await getRows(file);
    if (!rows.length) return { records:[], summary:'Archivo vacío', unmatched:[] };

    // Find header row
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const h = rows[i].map(c => String(c).toUpperCase().trim());
      if (h.some(c => c.includes('SEDE')) && h.some(c => c.includes('FECHA'))) { headerIdx = i; break; }
    }
    const header = rows[headerIdx].map(c => String(c).toUpperCase().trim());

    const ci = {
      sede:      findCol(header, 'SEDE'),
      nombreAct: findCol(header, 'NOMBRE ACT', 'ACTIVIDAD NOMBRE') >= 0 ? findCol(header, 'NOMBRE ACT', 'ACTIVIDAD NOMBRE') : 1,
      participante: findCol(header, 'PARTICIPANTE','NOMBRE DEL PARTIC'),
      rut:       findCol(header, 'RUT'),
      fecha:     findCol(header, 'FECHA EJEC','FECHA'),
      formato:   findCol(header, 'FORMATO','MODALIDAD'),
      actividad: findCol(header, 'ACTIVIDAD ','ACTIVIDAD\t','ACTIVIDAD'),
      escuela:   findCol(header, 'ESCUELA'),
      carrera:   findCol(header, 'CARRERA'),
    };
    // Default to "ACTIVIDAD" col (the type) — but if there's a NOMBRE ACTIVIDAD col too, pick the last "ACTIVIDAD"
    if (ci.actividad < 0) {
      for (let i = header.length - 1; i >= 0; i--) {
        if (header[i].trim() === 'ACTIVIDAD' || header[i].includes('ACTIVIDAD')) { ci.actividad = i; break; }
      }
    }

    const records = [];
    const unmatched = new Set();
    const resolveSede = window.DuocParsers?.resolveCode || (x => null);

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => !String(c||'').trim())) continue;
      const sedeRaw = r[ci.sede];
      const libId = resolveSede(sedeRaw);
      if (!libId && sedeRaw != null && sedeRaw !== '') unmatched.add(String(sedeRaw));
      const fecha = parseFecha(r[ci.fecha]);
      if (!fecha) continue;
      const tipo = activityType(r[ci.actividad]);
      records.push({
        libId: libId || null,
        sedeCode: String(sedeRaw||'').trim(),
        nombreActividad: String(r[ci.nombreAct] || '').trim(),
        participante: String(r[ci.participante] || '').trim(),
        rut: String(r[ci.rut] || '').trim(),
        fecha,
        mes: fecha.slice(0,7),
        formato: String(r[ci.formato] || '').toUpperCase().trim() || 'PRESENCIAL',
        tipo,
        escuela: ci.escuela >= 0 ? String(r[ci.escuela] || '').trim() : '',
        carrera: ci.carrera >= 0 ? String(r[ci.carrera] || '').trim() : '',
      });
    }

    const libs = new Set(records.map(r => r.libId).filter(Boolean));
    const escuelas = new Set(records.map(r => r.escuela).filter(Boolean));
    return {
      records,
      unmatched: [...unmatched],
      type: 'formativas-detailed',
      summary: `${records.length.toLocaleString('es-CL')} asistencias · ${libs.size} sedes · ${escuelas.size} escuelas`,
    };
  }

  function mergeRecords(existing, incoming) {
    // De-dup by (rut + fecha + nombreActividad)
    const key = r => `${r.rut}|${r.fecha}|${r.nombreActividad}`;
    const map = new Map((existing || []).map(r => [key(r), r]));
    incoming.forEach(r => map.set(key(r), r));
    return [...map.values()];
  }

  // Aggregate detailed records → monthly per biblioteca (for legacy data shape)
  function aggregateMonthly(records) {
    const monthly = {};
    records.forEach(r => {
      if (!r.libId) return;
      if (!monthly[r.libId]) monthly[r.libId] = {};
      if (!monthly[r.libId][r.mes]) monthly[r.libId][r.mes] = { inducciones:0, talleres:0, asesorias:0, charlas:0 };
      const o = monthly[r.libId][r.mes];
      if (r.tipo === 'induccion') o.inducciones++;
      else if (r.tipo === 'taller') o.talleres++;
      else if (r.tipo === 'asesoria') o.asesorias++;
      else if (r.tipo === 'charla') o.charlas++;
    });
    return monthly;
  }

  return { parseFile, mergeRecords, aggregateMonthly };
})();
