// js/components/App.jsx — Main application with role-based access + year tabs + cloud sync
const { useState, useEffect, useRef } = React;
const { LIBRARIES, MONTH_LABELS, YEARS,
        getLibraryData, getOverviewData, getAvailableMonths, getLibrarySummaries,
        getYearComparison, fmtNum } = window.DuocData;
const Sync = window.DuocSync;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showBenchmark": true
}/*EDITMODE-END*/;

const ADMIN_PASS = 'Duoc@2025';
const YEAR_TABS = [
  { id:'compare', label:'2024 – 2026' },
  { id:'2024',    label:'2024' },
  { id:'2025',    label:'2025' },
  { id:'2026',    label:'2026' },
];

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState(null);
  const [pass, setPass] = useState('');
  const [err,  setErr]  = useState('');

  const tryAdmin = () => {
    if (pass === ADMIN_PASS) onLogin('admin');
    else { setErr('Contraseña incorrecta. Intente nuevamente.'); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#F0F0F0', display:'flex', flexDirection:'column', fontFamily:"'Barlow','Helvetica Neue',sans-serif" }}>

      {/* ── Top header bar — Duoc UC Bibliotecas ── */}
      <div style={{ background:'#1a1a1a', padding:'0 40px', display:'flex', alignItems:'center', height:72, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
          <span style={{ fontSize:30, fontWeight:400, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>Duoc</span>
          <span style={{ fontSize:30, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>UC</span>
          <span style={{ fontSize:13, color:'#888', marginLeft:6, fontWeight:400, letterSpacing:'0.5px', alignSelf:'center' }}>Bibliotecas</span>
        </div>
      </div>

      {/* ── Center card ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px' }}>
        <div style={{ background:'#fff', border:'1px solid #D8D8D8', borderRadius:2, width:'100%', maxWidth:520, boxShadow:'0 2px 16px rgba(0,0,0,0.08)' }}>

          {!mode ? (
            <div style={{ padding:'44px 48px 40px' }}>
              {/* Title */}
              <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', textAlign:'center', lineHeight:1.25, marginBottom:36 }}>
                Panel de Indicadores de Gestión<br />
                <span style={{ fontWeight:400, fontSize:22 }}>Bibliotecas Duoc UC</span>
              </h1>

              {/* Role buttons */}
              <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:32 }}>
                <button onClick={() => setMode('admin')}
                  style={{ background:'#F5A800', border:'none', borderRadius:2, padding:'18px 24px', cursor:'pointer', transition:'background 0.15s', textAlign:'center' }}
                  onMouseEnter={e => e.currentTarget.style.background='#E09800'}
                  onMouseLeave={e => e.currentTarget.style.background='#F5A800'}>
                  <div style={{ fontSize:17, fontWeight:800, color:'#1a1a1a' }}>Administrador</div>
                </button>

                <button onClick={() => onLogin('viewer')}
                  style={{ background:'#F5A800', border:'none', borderRadius:2, padding:'18px 24px', cursor:'pointer', transition:'background 0.15s', textAlign:'center' }}
                  onMouseEnter={e => e.currentTarget.style.background='#E09800'}
                  onMouseLeave={e => e.currentTarget.style.background='#F5A800'}>
                  <div style={{ fontSize:17, fontWeight:800, color:'#1a1a1a' }}>Jefe de Biblioteca</div>
                </button>
              </div>

              {/* Notes */}
              <div style={{ borderTop:'1px solid #EBEBEB', paddingTop:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#F5A800', marginBottom:10 }}>Consideraciones:</div>
                <ul style={{ fontSize:12, color:'#666', paddingLeft:18, lineHeight:1.9 }}>
                  <li>El acceso de Administrador requiere contraseña institucional.</li>
                  <li>Los Jefes de Biblioteca acceden directamente en modo lectura.</li>
                  <li>El uso del sistema está autorizado solo para fines de gestión interna.</li>
                  <li>El acceso es personal e intransferible.</li>
                  <li>Los datos se sincronizan en la nube cuando Firebase está configurado.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ padding:'44px 48px 40px' }}>
              <button onClick={() => { setMode(null); setErr(''); setPass(''); }}
                style={{ background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:13, marginBottom:28, padding:0, display:'flex', alignItems:'center', gap:6 }}>
                ← Volver
              </button>

              <h2 style={{ fontSize:22, fontWeight:800, color:'#1a1a1a', marginBottom:8 }}>Acceso Administrador</h2>
              <p style={{ fontSize:13, color:'#888', marginBottom:28 }}>Ingrese su contraseña para continuar</p>

              <label style={{ fontSize:12, fontWeight:700, color:'#555', display:'block', marginBottom:6 }}>Contraseña</label>
              <input type="password" value={pass}
                onChange={e => { setPass(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && tryAdmin()}
                placeholder="Ingrese su contraseña"
                autoFocus
                style={{ width:'100%', padding:'13px 16px', border:`1.5px solid ${err?'#E74C3C':'#D0D0D0'}`, borderRadius:2, fontSize:14, outline:'none', fontFamily:"'Barlow',sans-serif", color:'#1a1a1a', marginBottom: err ? 8 : 24 }} />
              {err && <div style={{ fontSize:12, color:'#E74C3C', marginBottom:18, display:'flex', alignItems:'center', gap:6 }}>⚠ {err}</div>}

              <button onClick={tryAdmin}
                style={{ width:'100%', padding:'14px', background:'#F5A800', border:'none', borderRadius:2, cursor:'pointer', fontSize:15, fontWeight:800, color:'#1a1a1a', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#E09800'}
                onMouseLeave={e => e.currentTarget.style.background='#F5A800'}>
                Ingresar al sistema
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign:'center', padding:'12px', fontSize:11, color:'#bbb' }}>
        Duoc UC · Sistema de Indicadores de Gestión Bibliotecaria · 2024–2026
      </div>
    </div>
  );
}

// ── Upload Modal — 4 indicator tabs ──────────────────────────────────────────

const UPLOAD_TABS = [
  { id:'cuentapersonas', label:'Cuentapersonas (Torniquetes)',          color:'#F5A800', icon:'👥',
    desc:'Archivos XLSX de torniquetes. Soporta el formato general (Time | Source | Serial | Count) y el formato especial AV/PV (hora | Counter Name | Gente en | Gente fuera). Solo se contabilizan ingresos 07:00–23:00.',
    fields:'Formato A: Time | Source | Serial | Count  ·  Formato B: Time | Counter Name | Gente en | Gente fuera',
    parser: f => window.DuocCPParser.parseFile(f).then(r => ({ results:r, unmatched:r.unmatched, type:'cuentapersonas-torniquetes', summary:r.summary })) },
  { id:'formativas',     label:'Acciones Formativas',     color:'#2E86C1', icon:'🎓',
    desc:'Log de aprendizaje con un registro por asistente. Columnas: SEDE | NOMBRE | NOMBRE DEL PARTICIPANTE | RUT | FECHA EJECUCION | FORMATO | ACTIVIDAD | ESCUELA | CARRERA. Tipos: INDUCCION, TALLER, ASESORIA, CHARLA.',
    fields:'SEDE | NOMBRE | NOMBRE DEL PARTICIPANTE | RUT | FECHA EJECUCION | FORMATO | ACTIVIDAD | ESCUELA | CARRERA',
    parser: f => window.DuocFormativasParser.parseFile(f).then(r => ({ results:r, unmatched:r.unmatched, type:'formativas-detailed', summary:r.summary })) },
  { id:'bibliograficos', label:'Bibliográficos y NB',     color:'#27AE60', icon:'📚',
    desc:'Archivo fila a fila con una transacción por fila. Columnas clave: BIB.PRES (código sede), FECHA PRESTAMO (YYYYMMDDHHMMSS), TIPO TRAN (RENOVACION / AUTOPRESTAMO…)',
    fields:'… | BIB.PRES | FECHA PRESTAMO | TIPO TRAN | …',
    parser: f => window.DuocParsers.parseBibliograficos(f) },
  { id:'digitales',      label:'Recursos Digitales',      color:'#1EBEC8', icon:'💻',
    desc:'Formato ancho (igual a Cuentapersonas) o columnas por recurso (BDD, Libros Digitales, Medialink). Código sede en col B.',
    fields:'Sede | Código | BDD ene-25 | … ó Sede | Mes | BDD | Libros | Medialink',
    parser: f => window.DuocParsers.parseDigitales(f) },
];

function UploadModal({ onClose, onUpload }) {
  const [activeTab, setActiveTab]   = useState('cuentapersonas');
  const [drag,      setDrag]        = useState(false);
  const [status,    setStatus]      = useState(null); // null | {ok, msg, summary, unmatched}
  const [loading,   setLoading]     = useState(false);

  const tab = UPLOAD_TABS.find(t => t.id === activeTab);

  const process = async (file) => {
    setLoading(true); setStatus(null);
    try {
      const parseOut = await tab.parser(file);
      const { results, unmatched, summary } = parseOut;
      const hasData = Array.isArray(results) ? results.length > 0 :
                      results?.hourly  ? Object.keys(results.hourly).length > 0 :
                      results?.records ? results.records.length > 0 : false;
      if (!hasData) throw new Error('No se extrajeron datos. Verifique que el archivo corresponde a este tipo de indicador.');
      onUpload(results, parseOut.type || activeTab);
      setStatus({ ok:true, msg:`Importación exitosa desde "${file.name}"`, summary, unmatched });
    } catch(e) {
      setStatus({ ok:false, msg:e.message });
    } finally { setLoading(false); }
  };

  const handleDrop = e => { e.preventDefault(); setDrag(false); const f=e.dataTransfer.files[0]; if(f) process(f); };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow',sans-serif" }}>
      <div style={{ background:'#fff', width:600, maxHeight:'90vh', overflowY:'auto', borderRadius:3, boxShadow:'0 20px 60px rgba(0,0,0,0.45)', overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ background:'#1a1a1a', padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Cargar Datos Mensuales</div>
            <div style={{ fontSize:11, color:'#666', marginTop:2 }}>Seleccione el tipo de indicador antes de subir el archivo</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:22 }}>×</button>
        </div>

        {/* Indicator tabs */}
        <div style={{ display:'flex', background:'#F8F8F8', borderBottom:'2px solid #EBEBEB', flexShrink:0 }}>
          {UPLOAD_TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setStatus(null); }}
              style={{
                flex:1, padding:'10px 4px', border:'none', cursor:'pointer', fontSize:10, fontWeight:700,
                background: activeTab===t.id ? '#fff' : 'transparent',
                color: activeTab===t.id ? t.color : '#aaa',
                borderBottom: activeTab===t.id ? `2px solid ${t.color}` : '2px solid transparent',
                marginBottom:'-2px', transition:'all 0.15s', lineHeight:1.4
              }}>
              <div style={{ fontSize:16, marginBottom:3 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:'20px 24px', overflowY:'auto' }}>
          {/* Format description */}
          <div style={{ background:`${tab.color}10`, border:`1px solid ${tab.color}30`, borderRadius:3, padding:'10px 14px', marginBottom:16, fontSize:11, color:'#555', lineHeight:1.6 }}>
            <div style={{ fontWeight:700, color:tab.color, marginBottom:4 }}>{tab.icon} {tab.label} — Formato esperado</div>
            <div style={{ marginBottom:6 }}>{tab.desc}</div>
            <code style={{ fontSize:10, background:'rgba(0,0,0,0.06)', padding:'3px 6px', borderRadius:2, display:'block', color:'#666' }}>{tab.fields}</code>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
            onClick={() => !loading && document.getElementById('file-upload-main').click()}
            style={{ border:`2px dashed ${drag?tab.color:'#DDD'}`, borderRadius:3, padding:'24px', textAlign:'center', cursor:loading?'wait':'pointer', background:drag?`${tab.color}08`:'#FAFAFA', transition:'all 0.2s', marginBottom:16 }}>
            <input id="file-upload-main" type="file" accept=".csv,.txt,.xlsx,.xls" style={{ display:'none' }}
              onChange={e => { const f=e.target.files[0]; if(f){process(f); e.target.value='';} }} />
            {loading
              ? <div style={{ color:'#aaa', fontSize:13 }}>⏳ Procesando archivo…</div>
              : <>
                  <div style={{ fontSize:24, marginBottom:6 }}>📂</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#333' }}>Arrastra el archivo aquí</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>o haz clic para seleccionar · .xlsx, .csv, .txt</div>
                </>
            }
          </div>

          {/* Status */}
          {status && (
            <div style={{ borderRadius:3, marginBottom:14 }}>
              <div style={{ padding:'10px 14px', background:status.ok?'#E8F5E9':'#FFEBEE', color:status.ok?'#1B5E20':'#B71C1C', fontSize:13, borderRadius:3, marginBottom: status.unmatched?.length ? 8 : 0 }}>
                {status.ok ? '✓ ' : '✕ '}{status.msg}
                {status.summary && <span style={{ marginLeft:8, fontSize:11, opacity:0.8 }}>— {status.summary}</span>}
              </div>
              {status.unmatched?.length > 0 && (
                <div style={{ padding:'8px 12px', background:'#FFF8E1', border:'1px solid #FFE082', borderRadius:3, fontSize:11, color:'#795548' }}>
                  <strong>⚠ Sedes no reconocidas</strong> (se omitieron): {status.unmatched.join(', ')}
                  <div style={{ marginTop:4, color:'#aaa' }}>Si son códigos numéricos, edite el archivo <code>js/parsers.js</code> → NUMERIC_MAP para agregar el mapeo.</div>
                </div>
              )}
            </div>
          )}

          {/* Numeric map hint for formativas */}
          {activeTab === 'formativas' && (
            <div style={{ fontSize:10, color:'#bbb', padding:'8px 12px', background:'#F8F8F8', borderRadius:3, lineHeight:1.6 }}>
              <strong style={{color:'#888'}}>ℹ Códigos numéricos de sede:</strong> Si la columna SEDE contiene números (ej: 10, 15…), verifique el mapeo en <code>js/parsers.js → NUMERIC_MAP</code>. Los sedes no reconocidos aparecerán en la advertencia amarilla.
            </div>
          )}
        </div>

        <div style={{ padding:'0 24px 20px', flexShrink:0 }}>
          <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'#F5A800', border:'none', borderRadius:3, cursor:'pointer', fontSize:12, fontWeight:800, color:'#1a1a1a' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── KPI Bar ───────────────────────────────────────────────────────────────────

function KpiBar({ data }) {
  if (!data) return null;
  const { cuentapersonas, bdd, libros, medialink, prestamos, renovaciones, usoInterno, revistas,
          calculadoras, notebooks, juegos, inducciones, talleres, asesorias, matricula } = data;
  const totalDig = bdd + libros + medialink;
  const totalRec = prestamos + renovaciones + usoInterno + revistas + calculadoras + notebooks + juegos;
  const totalAF  = inducciones + talleres + asesorias;
  const items = [
    { label:'CUENTAPERSONAS',     value:fmtNum(cuentapersonas), sub:'accesos totales',                              color:'#F5A800' },
    { label:'TOTAL USOS RECURSOS',value:fmtNum(totalRec),       sub:'MBB + MNB',                                    color:'#fff' },
    { label:'RECURSOS DIGITALES', value:fmtNum(totalDig),       sub:`${fmtNum(bdd)} BDD · ${fmtNum(libros)} libros`,color:'#1EBEC8' },
    { label:'ACCIONES FORMATIVAS',value:fmtNum(totalAF),        sub:`${fmtNum(inducciones)} ind · ${fmtNum(talleres)} tall`, color:'#2E86C1' },
    { label:'MATRÍCULA SEDE',     value:fmtNum(matricula),      sub:'estudiantes',                                  color:'#E0E0E0' },
  ];
  return (
    <div style={{ background:'#222', display:'flex', overflowX:'auto', borderBottom:'1px solid #333' }}>
      {items.map((item, i) => (
        <div key={i} style={{ flex:'1 0 160px', padding:'14px 22px', borderRight:i<items.length-1?'1px solid rgba(255,255,255,0.07)':'none' }}>
          <div style={{ fontSize:9, fontWeight:700, color:'#666', letterSpacing:'0.9px', marginBottom:5, textTransform:'uppercase' }}>{item.label}</div>
          <div style={{ fontSize:24, fontWeight:800, color:item.color, lineHeight:1 }}>{item.value}</div>
          <div style={{ fontSize:11, color:'#555', marginTop:4 }}>{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── View Controls ─────────────────────────────────────────────────────────────

function ViewControls({ viewMode, setViewMode, selectedMonth, setSelectedMonth, availableMonths }) {
  return (
    <div style={{ background:'#fff', borderBottom:'2px solid #F0F0F0', padding:'10px 24px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
      <div style={{ display:'flex', borderRadius:3, overflow:'hidden', border:'1px solid #E0E0E0', flexShrink:0 }}>
        {[['annual','Vista anual'],['monthly','Vista mensual']].map(([mode,label]) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{ padding:'5px 14px', border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:viewMode===mode?'#1a1a1a':'#fff', color:viewMode===mode?'#F5A800':'#888', transition:'all 0.15s' }}>{label}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:4, overflowX:'auto' }}>
        {(availableMonths||[]).map((key) => {
          const mi    = parseInt(key.split('-')[1]) - 1;
          const isSel = selectedMonth === key;
          return (
            <button key={key} onClick={() => { setSelectedMonth(key); setViewMode('monthly'); }}
              style={{ padding:'4px 10px', border:'none', borderRadius:2, cursor:'pointer', flexShrink:0, transition:'all 0.15s', background:isSel?'#F5A800':'#F0F0F0', color:isSel?'#1a1a1a':'#555', fontSize:11, fontWeight:isSel?700:400 }}>
              {MONTH_LABELS[mi]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Library Card ──────────────────────────────────────────────────────────────

function LibCard({ lib, onClick }) {
  const [hov, setHov] = useState(false);
  const total = (lib.bdd||0)+(lib.libros||0)+(lib.medialink||0);
  const af    = (lib.inducciones||0)+(lib.talleres||0)+(lib.asesorias||0);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', cursor:'pointer', transition:'all 0.2s', padding:'14px 16px',
        border:`1px solid ${hov?'#F5A800':'#EBEBEB'}`, borderTop:`3px solid ${hov?'#F5A800':'#E0E0E0'}`,
        boxShadow:hov?'0 4px 16px rgba(245,168,0,0.12)':'none' }}>
      <div style={{ fontSize:13, fontWeight:800, color:'#1a1a1a', marginBottom:2 }}>{lib.name}</div>
      <div style={{ fontSize:10, color:'#bbb', marginBottom:12 }}>{lib.city} · {lib.region}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div><div style={{ fontSize:17, fontWeight:800, color:'#F5A800' }}>{fmtNum(lib.cuentapersonas)}</div><div style={{ fontSize:10, color:'#bbb' }}>Cuentapersonas</div></div>
        <div><div style={{ fontSize:17, fontWeight:800, color:'#1EBEC8' }}>{fmtNum(total)}</div><div style={{ fontSize:10, color:'#bbb' }}>Rec. Digitales</div></div>
        <div><div style={{ fontSize:14, fontWeight:700, color:'#27AE60' }}>{fmtNum(lib.prestamos)}</div><div style={{ fontSize:10, color:'#bbb' }}>Préstamos</div></div>
        <div><div style={{ fontSize:14, fontWeight:700, color:'#2E86C1' }}>{fmtNum(af)}</div><div style={{ fontSize:10, color:'#bbb' }}>Acc. Formativas</div></div>
      </div>
    </div>
  );
}

// ── Section routers ───────────────────────────────────────────────────────────

function SectionContent({ tab, data }) {
  const map = { cuentapersonas:CuentaPersonas, digitales:RecDigitales, bibliograficos:Bibliograficos, formativas:AccionesFormativas };
  const Comp = map[tab];
  return Comp ? <Comp annualData={data} /> : null;
}

function CompareSectionContent({ tab, byYear }) {
  const map = { cuentapersonas:CompareCuentapersonas, digitales:CompareDigitales, bibliograficos:CompareBibliograficos, formativas:CompareFormativas };
  const Comp = map[tab];
  return Comp ? <Comp byYear={byYear} /> : null;
}

// ── Compare banner ────────────────────────────────────────────────────────────

function CompareBanner({ name, sub }) {
  return (
    <div style={{ background:'linear-gradient(135deg,#0F1921 0%,#1a2a35 100%)', padding:'28px 40px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', right:-40, top:-40, width:280, height:280, background:'rgba(30,190,200,0.06)', borderRadius:'50%' }} />
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
          {YEARS.map(y => <span key={y} style={{ fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:2, background:window.YEAR_COLORS[y], color:'#1a1a1a' }}>{y}</span>)}
          <span style={{ fontSize:9, fontWeight:700, color:'#444', letterSpacing:'0.8px', textTransform:'uppercase', marginLeft:4 }}>Vista comparativa</span>
        </div>
        <h1 style={{ fontSize:30, fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:6 }}>
          {name} · <span style={{ color:'#1EBEC8' }}>Comparativo Anual</span>
        </h1>
        <div style={{ fontSize:11, color:'#445' }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────

function OverviewPage({ data, months, tab, viewMode, setViewMode, selectedMonth, setSelectedMonth, onLibClick, year, isCompare }) {
  const byYear = isCompare ? getYearComparison(data, 'overview') : null;
  const ovData = isCompare ? null : getOverviewData(data, viewMode==='monthly'?[selectedMonth]:months);
  const libs   = getLibrarySummaries(data, getAvailableMonths(data, 'overview', isCompare?'2025':year));

  return (
    <div>
      {isCompare
        ? <CompareBanner name="Panel de Gestión" sub={`Vista consolidada — ${LIBRARIES.length} sedes · comparativo anual 2024 / 2025 / 2026`} />
        : (
          <div style={{ background:'linear-gradient(135deg,#1a1a1a 0%,#2C2C2C 100%)', padding:'28px 40px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-60, top:-60, width:300, height:300, background:'rgba(245,168,0,0.05)', borderRadius:'50%' }} />
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#555', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:10 }}>— Informe · Período {year} · Sistema de Bibliotecas</div>
              <h1 style={{ fontSize:32, fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:6 }}>Panel de Gestión<br /><span style={{ color:'#F5A800' }}>Sistema de Bibliotecas</span></h1>
              <div style={{ fontSize:11, color:'#555' }}>Vista consolidada — {LIBRARIES.length} sedes</div>
            </div>
          </div>
        )
      }
      {!isCompare && <KpiBar data={ovData} />}
      {!isCompare && <ViewControls viewMode={viewMode} setViewMode={setViewMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} availableMonths={months} />}
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'22px 24px' }}>
        {isCompare ? <CompareSectionContent tab={tab} byYear={byYear} /> : <SectionContent tab={tab} data={ovData} />}
        <div style={{ marginTop:32 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#aaa', letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:14 }}>
            Desglose por Sede — {LIBRARIES.length} Bibliotecas {isCompare?'· datos año 2025':''}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:12 }}>
            {libs.map(lib => <LibCard key={lib.id} lib={lib} onClick={() => onLibClick(lib.id)} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryPage({ libId, data, months, tab, viewMode, setViewMode, selectedMonth, setSelectedMonth, year, isCompare }) {
  const lib       = LIBRARIES.find(l => l.id === libId);
  const byYear    = isCompare ? getYearComparison(data, libId) : null;
  const libMonths = isCompare ? months : (viewMode==='monthly' ? [selectedMonth] : (getAvailableMonths(data, libId, year)||months));
  const libData   = isCompare ? null : getLibraryData(data, libId, libMonths);

  if (!lib) return <div style={{ padding:60, textAlign:'center', color:'#bbb' }}>Biblioteca no encontrada.</div>;
  return (
    <div>
      {isCompare
        ? <CompareBanner name={`Biblioteca ${lib.name}`} sub={`${lib.city} · ${lib.region} · evolución 2024 / 2025 / 2026`} />
        : (
          <div style={{ background:'linear-gradient(135deg,#F5A800 0%,#D4900A 100%)', padding:'28px 40px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', right:-40, top:-40, width:260, height:260, background:'rgba(255,255,255,0.1)', borderRadius:'50%' }} />
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(0,0,0,0.35)', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:10 }}>— Informe · Período {year} · Sistema de Bibliotecas</div>
              <div style={{ fontSize:13, color:'rgba(0,0,0,0.4)', marginBottom:4 }}>Panel de Gestión</div>
              <h1 style={{ fontSize:34, fontWeight:900, color:'#1a1a1a', lineHeight:1.1, marginBottom:6 }}>Biblioteca {lib.name}</h1>
              <div style={{ fontSize:11, color:'rgba(0,0,0,0.4)' }}>{lib.city} · {lib.region}</div>
            </div>
          </div>
        )
      }
      {!isCompare && <KpiBar data={libData} />}
      {!isCompare && <ViewControls viewMode={viewMode} setViewMode={setViewMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} availableMonths={getAvailableMonths(data, libId, year)} />}
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'22px 24px' }}>
        {isCompare ? <CompareSectionContent tab={tab} byYear={byYear} /> : <SectionContent tab={tab} data={libData} />}
      </div>
    </div>
  );
}

// ── Sync Status Badge ─────────────────────────────────────────────────────────

function SyncBadge({ status }) {
  const map = {
    local:      { label:'Local',       bg:'#333',              color:'#888' },
    connecting: { label:'Conectando…', bg:'rgba(245,168,0,.15)', color:'#F5A800' },
    online:     { label:'● En línea',  bg:'rgba(39,174,96,.15)', color:'#27AE60' },
    error:      { label:'Sin conexión',bg:'rgba(231,76,60,.15)', color:'#E74C3C' },
  };
  const s = map[status] || map.local;
  return (
    <div style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:2, background:s.bg, color:s.color, letterSpacing:'0.4px', flexShrink:0 }}>
      {s.label}
    </div>
  );
}

// ── Firebase Setup Wizard (Admin) ─────────────────────────────────────────────

function FirebaseSetup({ onClose }) {
  const [cfg, setCfg] = useState({ apiKey:'', authDomain:'', databaseURL:'', projectId:'', storageBucket:'', messagingSenderId:'', appId:'' });
  const [saved, setSaved] = useState(false);

  const allFilled = cfg.apiKey && cfg.databaseURL && cfg.projectId;

  const handleSave = () => {
    // Persist config in localStorage so it survives page reload on THIS device
    // (admin must repeat on new devices, or hardcode js/config.js)
    localStorage.setItem('duoc_firebase_cfg', JSON.stringify(cfg));
    // Patch the global config and reinit
    Object.assign(window.DUOC_FIREBASE_CONFIG, cfg);
    setSaved(true);
    setTimeout(() => window.location.reload(), 1500);
  };

  const fields = [
    ['apiKey',           'API Key'],
    ['authDomain',       'Auth Domain'],
    ['databaseURL',      'Database URL  ⚠ incluir https://'],
    ['projectId',        'Project ID'],
    ['storageBucket',    'Storage Bucket'],
    ['messagingSenderId','Messaging Sender ID'],
    ['appId',            'App ID'],
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow',sans-serif" }}>
      <div style={{ background:'#1C1C1C', width:540, borderRadius:4, overflow:'hidden', border:'1px solid #2A2A2A', boxShadow:'0 24px 64px rgba(0,0,0,0.7)', maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ background:'#F5A800', padding:'18px 24px' }}>
          <div style={{ fontSize:15, fontWeight:800, color:'#1a1a1a' }}>⚙ Configurar Firebase · Sincronización en la Nube</div>
          <div style={{ fontSize:11, color:'rgba(0,0,0,0.5)', marginTop:3 }}>Solo Administrador · se realiza una sola vez por dispositivo</div>
        </div>
        <div style={{ padding:'24px' }}>
          {/* Steps */}
          <div style={{ background:'#111', borderRadius:3, padding:'14px 16px', marginBottom:20, fontSize:11, color:'#777', lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:'#aaa', marginBottom:8 }}>Pasos para obtener las credenciales:</div>
            <div>1. Ir a <span style={{ color:'#F5A800' }}>console.firebase.google.com</span> e iniciar sesión con Google</div>
            <div>2. Crear proyecto → nombre: <strong style={{ color:'#ddd' }}>duoc-bibliotecas</strong></div>
            <div>3. <strong style={{ color:'#ddd' }}>Realtime Database</strong> → Crear base de datos → Modo de prueba</div>
            <div>4. Configuración del proyecto (⚙) → Tus aplicaciones → icono Web <strong style={{ color:'#ddd' }}>&lt;/&gt;</strong></div>
            <div>5. Registrar la app y copiar el objeto <strong style={{ color:'#ddd' }}>firebaseConfig</strong></div>
            <div>6. En Realtime Database → <strong style={{ color:'#ddd' }}>Reglas</strong>, pegar y publicar:</div>
            <pre style={{ background:'#0A0A0A', padding:'8px 12px', borderRadius:2, marginTop:6, color:'#1EBEC8', fontSize:10, overflowX:'auto' }}>
{`{
  "rules": {
    "data": {
      ".read": true,
      ".write": true
    }
  }
}`}
            </pre>
          </div>

          {/* Fields */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {fields.map(([key, label]) => (
              <div key={key} style={{ gridColumn: key === 'databaseURL' ? '1/-1' : 'auto' }}>
                <div style={{ fontSize:10, color:'#666', fontWeight:600, marginBottom:4 }}>{label}</div>
                <input value={cfg[key]} onChange={e => setCfg(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={key === 'databaseURL' ? 'https://tu-proyecto-default-rtdb.firebaseio.com' : ''}
                  style={{ width:'100%', padding:'8px 10px', background:'#111', border:`1px solid ${cfg[key]?'#333':'#2A2A2A'}`, borderRadius:2, color:'#ddd', fontSize:12, fontFamily:"'Barlow',sans-serif", outline:'none' }} />
              </div>
            ))}
          </div>

          {saved && (
            <div style={{ padding:'10px 14px', background:'#E8F5E9', borderRadius:2, color:'#1B5E20', fontSize:13, marginBottom:14 }}>
              ✓ Configuración guardada. Recargando…
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose}
              style={{ flex:1, padding:'10px', background:'#2A2A2A', border:'1px solid #333', borderRadius:2, cursor:'pointer', fontSize:12, color:'#888', fontWeight:600 }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!allFilled || saved}
              style={{ flex:2, padding:'10px', background: allFilled ? '#F5A800' : '#333', border:'none', borderRadius:2, cursor: allFilled ? 'pointer' : 'default', fontSize:12, fontWeight:800, color: allFilled ? '#1a1a1a' : '#555' }}>
              Guardar y conectar
            </button>
          </div>

          <div style={{ marginTop:14, fontSize:10, color:'#444', lineHeight:1.6 }}>
            💡 Para que todos los dispositivos sincronicen automáticamente, el Administrador también puede editar el archivo <strong style={{ color:'#666' }}>js/config.js</strong> directamente con estas credenciales.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────

function App() {
  const [role,          setRole]          = useState(() => sessionStorage.getItem('duoc_role') || null);
  const [data,          setData]          = useState(null);   // null = loading
  const [syncStatus,    setSyncStatus]    = useState(Sync.getStatus());
  const [currentLib,    setCurrentLib]    = useState('overview');
  const [activeTab,     setActiveTab]     = useState('cuentapersonas');
  const [selectedYear,  setSelectedYear]  = useState('2025');
  const [viewMode,      setViewMode]      = useState('annual');
  const [selectedMonth, setSelectedMonth] = useState('2025-04');
  const [showUpload,    setShowUpload]    = useState(false);
  const [showFirebase,  setShowFirebase]  = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const unsubRef = useRef(null);

  const isCompare = selectedYear === 'compare';
  const isAdmin   = role === 'admin';

  // ── Restore persisted Firebase config from localStorage ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem('duoc_firebase_cfg');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.databaseURL) Object.assign(window.DUOC_FIREBASE_CONFIG, parsed);
      }
    } catch(_) {}
  }, []);

  // ── Load data on mount ──
  useEffect(() => {
    Sync.onStatus(setSyncStatus);
    Sync.loadData().then(({ data: d }) => {
      setData(d);
      // Subscribe to real-time updates
      if (Sync.isConfigured) {
        unsubRef.current = Sync.subscribe(remote => setData(remote));
      }
    });
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  const handleLogin  = r  => { setRole(r); sessionStorage.setItem('duoc_role', r); };
  const handleLogout = () => { setRole(null); sessionStorage.removeItem('duoc_role'); };

  const handleUpload = async (results, type) => {
    let nd;
    if (type === 'cuentapersonas-torniquetes') {
      // results is { hourly: {...} }
      const merged = window.DuocCPParser.mergeHourly(data.__hourly || {}, results.hourly);
      const monthly = window.DuocCPParser.aggregateMonthly(merged);
      nd = JSON.parse(JSON.stringify(data));
      nd.__hourly = merged;
      // Also update monthly cuentapersonas totals
      Object.entries(monthly).forEach(([lib, mos]) => {
        if (!nd[lib]) nd[lib] = {};
        Object.entries(mos).forEach(([mes, total]) => {
          if (!nd[lib][mes]) nd[lib][mes] = {};
          nd[lib][mes].cuentapersonas = total;
        });
      });
    } else if (type === 'formativas-detailed') {
      const merged = window.DuocFormativasParser.mergeRecords(data.__formativas || [], results.records);
      const monthly = window.DuocFormativasParser.aggregateMonthly(merged);
      nd = JSON.parse(JSON.stringify(data));
      nd.__formativas = merged;
      Object.entries(monthly).forEach(([lib, mos]) => {
        if (!nd[lib]) nd[lib] = {};
        Object.entries(mos).forEach(([mes, c]) => {
          if (!nd[lib][mes]) nd[lib][mes] = {};
          nd[lib][mes].inducciones = c.inducciones;
          nd[lib][mes].talleres    = c.talleres;
          nd[lib][mes].asesorias   = c.asesorias;
          nd[lib][mes].charlas     = c.charlas;
        });
      });
    } else {
      nd = window.DuocData.mergePartialData(data, results, type);
    }
    setData(nd);
    await Sync.saveData(nd);
  };

  const handleYearSelect = y => {
    setSelectedYear(y);
    setViewMode('annual');
    if (y !== 'compare') setSelectedMonth(`${y}-04`);
  };

  useEffect(() => {
    const h = e => {
      if (e.data?.type === '__activate_edit_mode')   setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', h);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', h);
  }, []);

  // ── Loading screen ──
  if (!data) return (
    <div style={{ minHeight:'100vh', background:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:900, color:'#F5A800', marginBottom:16 }}>DuocUC</div>
        <div style={{ fontSize:13, color:'#555', letterSpacing:'1px' }}>Cargando datos{Sync.isConfigured ? ' desde la nube' : ' locales'}…</div>
        <div style={{ marginTop:20, width:200, height:3, background:'#222', borderRadius:2, overflow:'hidden', margin:'20px auto 0' }}>
          <div style={{ height:'100%', background:'#F5A800', borderRadius:2, animation:'loadbar 1.4s ease-in-out infinite' }} />
        </div>
      </div>
      <style>{`@keyframes loadbar { 0%{width:0%;margin-left:0} 50%{width:80%;margin-left:10%} 100%{width:0%;margin-left:100%} }`}</style>
    </div>
  );

  if (!role) return <LoginScreen onLogin={handleLogin} />;

  const months = isCompare ? getAvailableMonths(data,'overview') : getAvailableMonths(data,'overview',selectedYear);

  const TABS = [
    { id:'cuentapersonas', label:'Cuentapersonas' },
    { id:'digitales',      label:'Rec. Digitales' },
    { id:'bibliograficos', label:'Bibliográficos y no bibliográficos' },
    { id:'formativas',     label:'Acc. Formativas' },
  ];

  const yearBadge = isCompare ? '2024–2026' : selectedYear;

  return (
    <div style={{ minHeight:'100vh', background:'#F3F3F3', fontFamily:"'Barlow','Helvetica Neue',Helvetica,Arial,sans-serif" }}>

      {/* ── Navbar 1 ── */}
      <nav style={{ background:'#1a1a1a', height:50, display:'flex', alignItems:'stretch', padding:'0 0 0 20px', position:'sticky', top:0, zIndex:500, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', marginRight:4, flexShrink:0 }}>
          <span style={{ fontSize:18, fontWeight:400, color:'#F5A800', letterSpacing:'-1px' }}>Duoc</span>
          <span style={{ fontSize:18, fontWeight:900, color:'#F5A800', marginRight:14 }}>UC</span>
          <span style={{ color:'rgba(255,255,255,0.12)', fontSize:20, marginRight:4 }}>|</span>
        </div>
        <button onClick={() => setCurrentLib('overview')}
          style={{ background:currentLib==='overview'?'#F5A800':'none', border:'none', padding:'0 18px', height:50, cursor:'pointer', flexShrink:0, color:currentLib==='overview'?'#1a1a1a':'#777', fontSize:11, fontWeight:700, letterSpacing:'0.6px', transition:'all 0.2s' }}>
          SISTEMA DE BIBLIOTECAS
        </button>
        <span style={{ color:'rgba(255,255,255,0.08)', fontSize:20, margin:'0 2px', alignSelf:'center' }}>|</span>
        <div style={{ display:'flex', overflowX:'auto', flex:1 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ background:'none', border:'none', whiteSpace:'nowrap', flexShrink:0, borderBottom:activeTab===tab.id?'2px solid #F5A800':'2px solid transparent', padding:'0 16px', height:50, cursor:'pointer', color:activeTab===tab.id?'#F5A800':'#777', fontSize:11, fontWeight:activeTab===tab.id?700:400, letterSpacing:'0.3px', transition:'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 16px', flexShrink:0 }}>
          <select value={currentLib} onChange={e => setCurrentLib(e.target.value)}
            style={{ background:'#2A2A2A', border:'1px solid #3A3A3A', color:currentLib==='overview'?'#888':'#F5A800', padding:'4px 8px', fontSize:11, cursor:'pointer', borderRadius:2, maxWidth:168, fontFamily:"'Barlow',sans-serif" }}>
            <option value="overview">— Todas las sedes —</option>
            {LIBRARIES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {/* Sync status */}
          <SyncBadge status={syncStatus} />
          {/* Role badge */}
          <div style={{ fontSize:10, color:isAdmin?'#F5A800':'#1EBEC8', background:isAdmin?'rgba(245,168,0,0.1)':'rgba(30,190,200,0.1)', padding:'3px 8px', borderRadius:2, fontWeight:700, letterSpacing:'0.5px', flexShrink:0 }}>
            {isAdmin ? '🔐 Admin' : '👁 Jefe'}
          </div>
          {isAdmin && (
            <>
              <button onClick={() => setShowUpload(true)}
                style={{ background:'none', border:'1px solid #3A3A3A', color:'#888', padding:'4px 12px', cursor:'pointer', fontSize:11, borderRadius:2, fontFamily:"'Barlow',sans-serif", fontWeight:600, transition:'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#F5A800'; e.currentTarget.style.color='#F5A800'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#3A3A3A'; e.currentTarget.style.color='#888'; }}>
                ↑ Cargar datos
              </button>
              {!Sync.isConfigured && (
                <button onClick={() => setShowFirebase(true)}
                  style={{ background:'none', border:'1px solid #1EBEC8', color:'#1EBEC8', padding:'4px 12px', cursor:'pointer', fontSize:11, borderRadius:2, fontFamily:"'Barlow',sans-serif", fontWeight:700, transition:'all 0.15s' }}
                  title="Configurar sincronización en la nube">
                  ☁ Nube
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ── Navbar 2: Year tabs ── */}
      <div style={{ background:'#141414', display:'flex', alignItems:'stretch', padding:'0 20px', borderBottom:'2px solid rgba(245,168,0,0.2)', position:'sticky', top:50, zIndex:499 }}>
        <span style={{ fontSize:10, color:'#3A3A3A', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', alignSelf:'center', marginRight:14, flexShrink:0 }}>Período:</span>
        {YEAR_TABS.map(yt => {
          const isSel  = selectedYear === yt.id;
          const isComp = yt.id === 'compare';
          return (
            <button key={yt.id} onClick={() => handleYearSelect(yt.id)}
              style={{ background:'none', border:'none', cursor:'pointer', padding:'0 18px', height:38, borderBottom:isSel?`2px solid ${isComp?'#1EBEC8':'#F5A800'}`:'2px solid transparent', color:isSel?(isComp?'#1EBEC8':'#F5A800'):'#555', fontSize:11, fontWeight:isSel?800:500, letterSpacing:'0.4px', flexShrink:0, transition:'all 0.15s', marginBottom:'-2px' }}>
              {isComp && <span style={{ marginRight:5 }}>⟷</span>}
              {yt.label}
              {isComp && isSel && <span style={{ marginLeft:6, fontSize:9, background:'#1EBEC8', color:'#000', padding:'1px 5px', borderRadius:2, fontWeight:800 }}>COMPARATIVO</span>}
            </button>
          );
        })}
        <div style={{ marginLeft:'auto', alignSelf:'center', background:isCompare?'#1EBEC8':'#F5A800', color:'#1a1a1a', fontSize:11, fontWeight:900, padding:'3px 10px', borderRadius:2, flexShrink:0 }}>
          {yearBadge}
        </div>
      </div>

      {/* ── Page ── */}
      {activeTab === 'cuentapersonas' && !isCompare ? (
        <CuentapersonasDash
          hourly={data.__hourly || {}}
          libs={LIBRARIES}
          isAdmin={isAdmin}
          onUpload={() => setShowUpload(true)}
        />
      ) : activeTab === 'formativas' && !isCompare ? (
        <AccionesFormativasDash
          records={data.__formativas || []}
          libs={LIBRARIES}
          isAdmin={isAdmin}
          onUpload={() => setShowUpload(true)}
        />
      ) : currentLib === 'overview'
        ? <OverviewPage data={data} months={months} tab={activeTab} year={selectedYear} isCompare={isCompare}
            viewMode={viewMode} setViewMode={setViewMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            onLibClick={id => setCurrentLib(id)} />
        : <LibraryPage libId={currentLib} data={data} months={months} tab={activeTab} year={selectedYear} isCompare={isCompare}
            viewMode={viewMode} setViewMode={setViewMode} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
      }

      {/* ── Modals ── */}
      {showUpload  && isAdmin && <UploadModal onClose={() => setShowUpload(false)}  onUpload={handleUpload} />}
      {showFirebase && isAdmin && <FirebaseSetup onClose={() => setShowFirebase(false)} />}

      {/* ── Tweaks panel ── */}
      {editMode && (
        <div style={{ position:'fixed', bottom:20, right:20, background:'#fff', border:'1px solid #E0E0E0', borderRadius:4, padding:20, width:268, boxShadow:'0 8px 32px rgba(0,0,0,0.15)', zIndex:1000 }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:16, color:'#1a1a1a' }}>Tweaks</div>

          {/* Sync status */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6, fontWeight:600 }}>Estado de sincronización</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <SyncBadge status={syncStatus} />
              {isAdmin && !Sync.isConfigured && (
                <button onClick={() => setShowFirebase(true)}
                  style={{ fontSize:11, color:'#1EBEC8', background:'none', border:'1px solid #1EBEC8', padding:'3px 10px', borderRadius:2, cursor:'pointer', fontWeight:700 }}>
                  ☁ Configurar nube
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6, fontWeight:600 }}>Vista de indicadores</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ padding:'6px 4px', border:`1px solid ${activeTab===t.id?'#F5A800':'#E0E0E0'}`, borderRadius:2, cursor:'pointer', fontSize:9, fontWeight:activeTab===t.id?800:400, background:activeTab===t.id?'#FFF8E7':'#fff', color:activeTab===t.id?'#F5A800':'#888', lineHeight:1.3 }}>
                  {t.label.split(' ').slice(0,2).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {isAdmin && (
              <button onClick={async () => { const nd = await Sync.resetData(); setData(nd); }}
                style={{ width:'100%', padding:'8px', background:'#FFF3E0', border:'1px solid #FFE0B2', borderRadius:2, cursor:'pointer', fontSize:11, color:'#E65100', fontWeight:600 }}>
                ↺ Restaurar datos de muestra
              </button>
            )}
            <button onClick={handleLogout}
              style={{ width:'100%', padding:'8px', background:'#F5F5F5', border:'1px solid #E0E0E0', borderRadius:2, cursor:'pointer', fontSize:11, color:'#888', fontWeight:600 }}>
              ← Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
