// js/components/AccionesFormativasDash.jsx — dashboard for Acciones Formativas
// Tabs: Dashboard · Filtros · Detalle
function AccionesFormativasDash({ records, libs, onUpload, isAdmin }) {
  const [tab, setTab] = React.useState('dashboard');
  const [f, setF] = React.useState({
    sedes: ['all'], escuelas: ['all'], carreras: ['all'],
    tipos: ['all'], formatos: ['all'], from: '', to: ''
  });
  const recs = records || [];

  // ── Filters
  const filtered = React.useMemo(() => {
    return recs.filter(r => {
      if (!f.sedes.includes('all')   && !f.sedes.includes(r.libId)) return false;
      if (!f.escuelas.includes('all')&& !f.escuelas.includes(r.escuela)) return false;
      if (!f.carreras.includes('all')&& !f.carreras.includes(r.carrera)) return false;
      if (!f.tipos.includes('all')   && !f.tipos.includes(r.tipo)) return false;
      if (!f.formatos.includes('all')&& !f.formatos.includes(r.formato)) return false;
      if (f.from && r.fecha < f.from) return false;
      if (f.to   && r.fecha > f.to)   return false;
      return true;
    });
  }, [recs, f]);

  const allEscuelas = React.useMemo(() => [...new Set(recs.map(r=>r.escuela).filter(Boolean))].sort(), [recs]);
  const allCarreras = React.useMemo(() => [...new Set(recs.map(r=>r.carrera).filter(Boolean))].sort(), [recs]);
  const fmt = n => Number(n||0).toLocaleString('es-CL');
  const libName = id => (libs.find(l=>l.id===id) || {}).name || id || '—';

  // ── Aggregations
  const byTipo = {induccion:0, taller:0, asesoria:0, charla:0, otro:0};
  const byEscuela = {}, byCarrera = {}, byMes = {}, bySede = {};
  const matrix = {}; // sede → escuela → count
  filtered.forEach(r => {
    byTipo[r.tipo]   = (byTipo[r.tipo] || 0) + 1;
    if (r.escuela) byEscuela[r.escuela] = (byEscuela[r.escuela] || 0) + 1;
    if (r.carrera) byCarrera[r.carrera] = (byCarrera[r.carrera] || 0) + 1;
    byMes[r.mes] = (byMes[r.mes] || 0) + 1;
    if (r.libId)  bySede[r.libId] = (bySede[r.libId] || 0) + 1;
    if (r.libId && r.escuela) {
      if (!matrix[r.libId]) matrix[r.libId] = {};
      matrix[r.libId][r.escuela] = (matrix[r.libId][r.escuela] || 0) + 1;
    }
  });

  return (
    <div style={{ padding:'24px 28px', background:'#F4F5F7', minHeight:'calc(100vh - 90px)', fontFamily:"'Barlow',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#1a1a1a' }}>Acciones Formativas</h1>
          <div style={{ fontSize:11, color:'#666', marginTop:4 }}>
            {fmt(filtered.length)} asistencias · {Object.keys(bySede).length} sedes · {Object.keys(byEscuela).length} escuelas
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:0, marginBottom:18, borderBottom:'1px solid #E0E0E0' }}>
        {[['dashboard','📊 Dashboard'],['filtros','🔍 Filtros'],['detalle','📋 Detalle']].map(([id,l]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 22px', fontSize:13, fontWeight: tab===id?800:500, color: tab===id?'#F5A800':'#888', borderBottom: tab===id?'3px solid #F5A800':'3px solid transparent', marginBottom:'-1px' }}>{l}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:18 }}>
            <KPIc bg="linear-gradient(135deg,#F5A800,#D49000)" title="Total" value={fmt(filtered.length)} sub="asistencias" />
            <KPIc bg="linear-gradient(135deg,#1ABC9C,#16A085)" title="Inducciones" value={fmt(byTipo.induccion)} sub="alumnos" />
            <KPIc bg="linear-gradient(135deg,#3498DB,#2874A6)" title="Talleres"    value={fmt(byTipo.taller)}    sub="alumnos" />
            <KPIc bg="linear-gradient(135deg,#9B59B6,#7D3C98)" title="Asesorías"   value={fmt(byTipo.asesoria)}  sub="alumnos" />
            <KPIc bg="linear-gradient(135deg,#E67E22,#D35400)" title="Charlas"     value={fmt(byTipo.charla)}    sub="alumnos" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <CardF title="Distribución por Tipo de Actividad">
              <DonutChart data={[
                ['Inducciones', byTipo.induccion, '#16A085'],
                ['Talleres',    byTipo.taller,    '#3498DB'],
                ['Asesorías',   byTipo.asesoria,  '#9B59B6'],
                ['Charlas',     byTipo.charla,    '#E67E22'],
              ]} />
            </CardF>
            <CardF title="Tendencia Mensual">
              <MonthlyLine byMes={byMes} />
            </CardF>
          </div>

          <div style={{ marginBottom:14 }}>
            <CardF title="Asistencias por Escuela" subtitle={`${Object.keys(byEscuela).length} escuelas con participación`}>
              <BarsList data={byEscuela} color="#F5A800" />
            </CardF>
          </div>

          <div style={{ marginBottom:14 }}>
            <CardF title="Top 15 Carreras" subtitle="por número de asistencias">
              <BarsList data={byCarrera} color="#1EBEC8" limit={15} />
            </CardF>
          </div>

          <CardF title="Matriz Sede × Escuela" subtitle="Intensidad de asistencias">
            <Matrix matrix={matrix} libs={libs} escuelas={Object.keys(byEscuela).sort()} libName={libName} />
          </CardF>
        </>
      )}

      {tab === 'filtros' && (
        <FiltrosFormativas f={f} setF={setF} libs={libs} escuelas={allEscuelas} carreras={allCarreras} />
      )}

      {tab === 'detalle' && (
        <DetalleFormativas records={filtered} libName={libName} />
      )}

      {isAdmin && (
        <div style={{ position:'fixed', bottom:24, right:24 }}>
          <button onClick={onUpload}
            style={{ background:'#F5A800', border:'none', padding:'12px 18px', borderRadius:30, color:'#1a1a1a', fontWeight:800, fontSize:12, cursor:'pointer', boxShadow:'0 6px 20px rgba(245,168,0,0.4)' }}>
            ↑ Cargar Log Aprendizaje
          </button>
        </div>
      )}
    </div>
  );
}

function KPIc({ bg, title, value, sub }) {
  return (
    <div style={{ background:bg, padding:'16px 18px', borderRadius:6, color:'#fff', minHeight:96 }}>
      <div style={{ fontSize:11, opacity:0.9, fontWeight:600 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:900, lineHeight:1.1, marginTop:5 }}>{value}</div>
      <div style={{ fontSize:10, opacity:0.85, marginTop:2 }}>{sub}</div>
    </div>
  );
}

function CardF({ title, subtitle, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:6, padding:'18px 20px' }}>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#1a1a1a' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((a,b)=>a+b[1],0);
  if (!total) return <div style={{ textAlign:'center', padding:40, color:'#bbb', fontSize:12 }}>Sin datos</div>;
  let acc = 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:30 }}>
      <svg viewBox="0 0 100 100" style={{ width:180, height:180 }}>
        {data.map(([l,v,c]) => {
          if (!v) return null;
          const pct = v/total, start = acc; acc += pct;
          const a1 = start*2*Math.PI - Math.PI/2, a2 = acc*2*Math.PI - Math.PI/2;
          const x1=50+40*Math.cos(a1), y1=50+40*Math.sin(a1);
          const x2=50+40*Math.cos(a2), y2=50+40*Math.sin(a2);
          const large = pct > 0.5 ? 1 : 0;
          return <path key={l} d={`M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`} fill={c} />;
        })}
        <circle cx="50" cy="50" r="22" fill="#fff" />
      </svg>
      <div style={{ flex:1 }}>
        {data.map(([l,v,c]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, fontSize:12 }}>
            <div style={{ width:12, height:12, background:c, borderRadius:2 }} />
            <span style={{ flex:1, color:'#555' }}>{l}</span>
            <span style={{ fontWeight:700 }}>{Number(v).toLocaleString('es-CL')}</span>
            <span style={{ color:'#999', fontSize:10, minWidth:42, textAlign:'right' }}>{total ? (v/total*100).toFixed(1) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthlyLine({ byMes }) {
  const entries = Object.entries(byMes).sort();
  if (!entries.length) return <div style={{ textAlign:'center', padding:40, color:'#bbb', fontSize:12 }}>Sin datos</div>;
  const max = Math.max(...entries.map(e=>e[1]));
  const w = 600, h = 180, pad = 30;
  const pts = entries.map(([m,v],i) => [pad + i*(w-2*pad)/Math.max(1,entries.length-1), h-pad-(v/max)*(h-2*pad)]);
  const path = pts.map((p,i) => (i?'L':'M')+p[0]+','+p[1]).join(' ');
  const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return (
    <svg viewBox={`0 0 ${w} ${h+24}`} style={{ width:'100%' }}>
      <path d={path+` L${pts[pts.length-1][0]},${h-pad} L${pts[0][0]},${h-pad} Z`} fill="#F5A80022" />
      <path d={path} stroke="#F5A800" strokeWidth="2.5" fill="none" />
      {pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#F5A800" />)}
      {entries.map(([m],i) => {
        const [y,mo] = m.split('-');
        return <text key={m} x={pts[i][0]} y={h-pad+15} fontSize="9" fill="#888" textAnchor="middle">{MES[parseInt(mo)-1]} {y.slice(2)}</text>;
      })}
      {pts.map((p,i) => <text key={'v'+i} x={p[0]} y={p[1]-8} fontSize="9" fill="#555" textAnchor="middle" fontWeight="700">{Number(entries[i][1]).toLocaleString('es-CL')}</text>)}
    </svg>
  );
}

function BarsList({ data, color, limit }) {
  let entries = Object.entries(data).sort((a,b)=>b[1]-a[1]);
  if (limit) entries = entries.slice(0, limit);
  if (!entries.length) return <div style={{ textAlign:'center', padding:40, color:'#bbb', fontSize:12 }}>Sin datos</div>;
  const max = entries[0][1];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {entries.map(([k,v]) => (
        <div key={k} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:200, fontSize:11, color:'#444', textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={k}>{k}</div>
          <div style={{ flex:1, background:'#F4F5F7', borderRadius:3, height:18, position:'relative' }}>
            <div style={{ width:`${(v/max)*100}%`, height:'100%', background:color, borderRadius:3 }} />
          </div>
          <div style={{ width:70, fontSize:11, fontWeight:700, color:'#1a1a1a' }}>{Number(v).toLocaleString('es-CL')}</div>
        </div>
      ))}
    </div>
  );
}

function Matrix({ matrix, libs, escuelas, libName }) {
  const sedes = Object.keys(matrix);
  if (!sedes.length || !escuelas.length) return <div style={{ textAlign:'center', padding:40, color:'#bbb', fontSize:12 }}>Sin datos</div>;
  let max = 0;
  sedes.forEach(s => escuelas.forEach(e => { const v = matrix[s]?.[e] || 0; if (v>max) max=v; }));
  const cellColor = v => {
    if (!v) return '#F8F9FA';
    const r = v/max;
    if (r<0.15) return '#FFF6D6';
    if (r<0.35) return '#FFE194';
    if (r<0.55) return '#FFC663';
    if (r<0.75) return '#FF9A3D';
    return '#E84149';
  };
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ borderCollapse:'collapse', fontSize:10 }}>
        <thead>
          <tr>
            <th style={{ padding:6, textAlign:'left', color:'#666', position:'sticky', left:0, background:'#fff' }}>Sede</th>
            {escuelas.map(e => <th key={e} style={{ padding:'6px 4px', color:'#666', writingMode:'vertical-rl', textAlign:'left', maxWidth:24, minHeight:90 }}><div style={{ transform:'rotate(180deg)', whiteSpace:'nowrap' }}>{e}</div></th>)}
          </tr>
        </thead>
        <tbody>
          {sedes.map(s => (
            <tr key={s}>
              <td style={{ padding:'4px 8px', color:'#444', fontWeight:600, position:'sticky', left:0, background:'#fff', whiteSpace:'nowrap' }}>{libName(s)}</td>
              {escuelas.map(e => {
                const v = matrix[s]?.[e] || 0;
                return <td key={e} title={`${libName(s)} · ${e}: ${v}`} style={{ background:cellColor(v), color: v > max*0.5 ? '#fff' : '#444', textAlign:'center', minWidth:34, padding:'4px 2px', fontWeight: v?700:400, fontSize:10 }}>{v || ''}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MesPicker({ f, setF }) {
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const now = new Date();
  const [year, setYear] = React.useState(() => {
    if (f.from) return parseInt(f.from.slice(0,4));
    return now.getFullYear();
  });
  // Determine which month is active (if from/to span a single month)
  const activeMes = React.useMemo(() => {
    if (!f.from || !f.to) return null;
    if (f.from.slice(0,7) !== f.to.slice(0,7)) return null;
    if (parseInt(f.from.slice(0,4)) !== year) return null;
    return parseInt(f.from.slice(5,7));
  }, [f.from, f.to, year]);

  const pickMonth = (m) => {
    if (m === 0) { // Año completo
      setF(s => ({ ...s, from: `${year}-01-01`, to: `${year}-12-31` }));
    } else {
      const last = new Date(year, m, 0).getDate();
      const mm = String(m).padStart(2,'0');
      setF(s => ({ ...s, from: `${year}-${mm}-01`, to: `${year}-${mm}-${last}` }));
    }
  };
  const clear = () => setF(s => ({ ...s, from:'', to:'' }));
  const yearActive = !activeMes && f.from && f.from === `${year}-01-01` && f.to === `${year}-12-31`;

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700 }}>Mes</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>setYear(y=>y-1)} style={yrBtn}>‹</button>
          <input type="number" value={year} onChange={e=>setYear(parseInt(e.target.value)||now.getFullYear())}
            style={{ width:70, padding:'4px 8px', border:'1px solid #DDD', borderRadius:3, fontSize:12, textAlign:'center', fontWeight:700, color:'#1EBEC8' }} />
          <button onClick={()=>setYear(y=>y+1)} style={yrBtn}>›</button>
        </div>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        <button onClick={()=>pickMonth(0)} style={chipStyle(yearActive)}>Año completo</button>
        {MESES.map((m,i) => (
          <button key={m} onClick={()=>pickMonth(i+1)} style={chipStyle(activeMes === i+1)}>{m}</button>
        ))}
        {(f.from || f.to) && <button onClick={clear} style={{ ...chipStyle(false), color:'#999', marginLeft:'auto' }}>✕ Limpiar</button>}
      </div>
    </div>
  );
}
const yrBtn = { background:'#F4F5F7', border:'1px solid #DDD', borderRadius:3, width:24, height:24, cursor:'pointer', fontSize:14, color:'#666', display:'flex', alignItems:'center', justifyContent:'center' };
const chipStyle = (active) => ({
  background: active ? '#1EBEC8' : '#FFF',
  color: active ? '#FFF' : '#666',
  border: '1px solid ' + (active ? '#1EBEC8' : '#DDD'),
  padding: '5px 11px', borderRadius: 3, fontSize: 11, cursor:'pointer',
  fontWeight: active ? 700 : 500, transition: '0.15s'
});

function FiltrosFormativas({ f, setF, libs, escuelas, carreras }) {
  const toggle = (key, val) => setF(s => {
    if (val === 'all') return { ...s, [key]: ['all'] };
    const cur = s[key].filter(x => x !== 'all' && x !== val);
    if (s[key].includes(val)) return { ...s, [key]: cur.length ? cur : ['all'] };
    return { ...s, [key]: [...cur, val] };
  });
  const tipos = [['induccion','Inducción'],['taller','Taller'],['asesoria','Asesoría'],['charla','Charla']];
  const formatos = [['PRESENCIAL','Presencial'],['ONLINE','Online'],['SEMIPRESENCIAL','Semipresencial']];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <CardF title="🔍 Filtros de Consulta">
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <FilterRow label="Sedes" items={[['all','Todas'], ...libs.map(l=>[l.id,l.name])]} selected={f.sedes} onToggle={v=>toggle('sedes',v)} accent="#1EBEC8" />
          <FilterRow label="Escuelas" items={[['all','Todas'], ...escuelas.map(e=>[e,e])]} selected={f.escuelas} onToggle={v=>toggle('escuelas',v)} accent="#F5A800" />
          <FilterRow label="Carreras" items={[['all','Todas'], ...carreras.map(c=>[c,c])]} selected={f.carreras} onToggle={v=>toggle('carreras',v)} accent="#9B59B6" />
          <FilterRow label="Tipo de Actividad" items={[['all','Todas'], ...tipos]} selected={f.tipos} onToggle={v=>toggle('tipos',v)} accent="#27AE60" />
          <FilterRow label="Formato" items={[['all','Todos'], ...formatos]} selected={f.formatos} onToggle={v=>toggle('formatos',v)} accent="#E67E22" />
          <MesPicker f={f} setF={setF} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700, marginBottom:6 }}>Desde</div><input type="date" value={f.from} onChange={e=>setF(s=>({...s,from:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }} /></div>
            <div><div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700, marginBottom:6 }}>Hasta</div><input type="date" value={f.to} onChange={e=>setF(s=>({...s,to:e.target.value}))} style={{ width:'100%', padding:'7px 10px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }} /></div>
          </div>
          <div>
            <button onClick={()=>setF({sedes:['all'],escuelas:['all'],carreras:['all'],tipos:['all'],formatos:['all'],from:'',to:''})}
              style={{ background:'#F4F5F7', border:'1px solid #DDD', padding:'6px 14px', borderRadius:3, fontSize:11, cursor:'pointer', color:'#666' }}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </CardF>
    </div>
  );
}

function FilterRow({ label, items, selected, onToggle, accent }) {
  return (
    <div>
      <div style={{ fontSize:11, color:accent, fontWeight:700, marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', maxHeight:120, overflowY:'auto' }}>
        {items.map(([v,l]) => {
          const on = selected.includes(v);
          return (
            <button key={v} onClick={()=>onToggle(v)} style={{ background: on?accent:'#F4F5F7', color: on?'#fff':'#555', border:'1px solid '+(on?accent:'#E0E0E0'), padding:'4px 10px', borderRadius:14, fontSize:10, cursor:'pointer', fontWeight:600 }}>{l}</button>
          );
        })}
      </div>
    </div>
  );
}

function DetalleFormativas({ records, libName }) {
  const [page, setPage] = React.useState(0);
  const [search, setSearch] = React.useState('');
  const filtered = search ? records.filter(r =>
    r.participante.toLowerCase().includes(search.toLowerCase()) ||
    r.rut.toLowerCase().includes(search.toLowerCase()) ||
    r.nombreActividad.toLowerCase().includes(search.toLowerCase())
  ) : records;
  const pageSize = 50;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const slice = filtered.slice(page*pageSize, (page+1)*pageSize);
  React.useEffect(()=>setPage(0),[search,records.length]);

  const tipoColor = { induccion:'#16A085', taller:'#3498DB', asesoria:'#9B59B6', charla:'#E67E22', otro:'#7F8C8D' };
  const tipoLabel = { induccion:'Inducción', taller:'Taller', asesoria:'Asesoría', charla:'Charla', otro:'Otro' };

  return (
    <CardF title="Detalle de Asistencias" subtitle={`${records.length.toLocaleString('es-CL')} registros · página ${page+1} de ${totalPages || 1}`}>
      <div style={{ marginBottom:12 }}>
        <input type="text" placeholder="Buscar por nombre, RUT o actividad…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width:'100%', padding:'8px 12px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }} />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
          <thead style={{ background:'#F4F5F7' }}>
            <tr>{['Fecha','Sede','Actividad','Tipo','Formato','Participante','RUT','Escuela','Carrera'].map(h => <th key={h} style={{ padding:'8px 6px', textAlign:'left', color:'#666', fontWeight:700, borderBottom:'1px solid #E0E0E0' }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {slice.map((r,i) => (
              <tr key={i} style={{ borderBottom:'1px solid #F0F0F0' }}>
                <td style={{ padding:'6px', color:'#666' }}>{r.fecha}</td>
                <td style={{ padding:'6px', color:'#444' }}>{libName(r.libId) || r.sedeCode}</td>
                <td style={{ padding:'6px', color:'#444' }}>{r.nombreActividad}</td>
                <td style={{ padding:'6px' }}><span style={{ background:tipoColor[r.tipo], color:'#fff', padding:'2px 8px', borderRadius:10, fontSize:9, fontWeight:700 }}>{tipoLabel[r.tipo]}</span></td>
                <td style={{ padding:'6px', color:'#666', fontSize:10 }}>{r.formato}</td>
                <td style={{ padding:'6px', color:'#444' }}>{r.participante}</td>
                <td style={{ padding:'6px', color:'#888', fontSize:10 }}>{r.rut}</td>
                <td style={{ padding:'6px', color:'#666' }}>{r.escuela || '—'}</td>
                <td style={{ padding:'6px', color:'#666' }}>{r.carrera || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:14 }}>
          <button onClick={()=>setPage(Math.max(0,page-1))} disabled={page===0} style={{ padding:'6px 12px', border:'1px solid #DDD', background:'#fff', borderRadius:3, fontSize:11, cursor: page===0 ? 'default':'pointer' }}>← Anterior</button>
          <span style={{ padding:'6px 12px', fontSize:11, color:'#666' }}>Página {page+1} de {totalPages}</span>
          <button onClick={()=>setPage(Math.min(totalPages-1,page+1))} disabled={page>=totalPages-1} style={{ padding:'6px 12px', border:'1px solid #DDD', background:'#fff', borderRadius:3, fontSize:11, cursor: page>=totalPages-1 ? 'default':'pointer' }}>Siguiente →</button>
        </div>
      )}
    </CardF>
  );
}
