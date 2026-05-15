// js/components/CuentapersonasDash.jsx — ERLS-style dashboard with Duoc UC identity
// Two tabs: Dashboard + Filtros · uses window.DuocHourly (set by App)

function CuentapersonasDash({ hourly, libs, onUpload, isAdmin }) {
  const [tab, setTab] = React.useState('dashboard');
  const [sede, setSede] = React.useState('all');

  // ── Aggregations ──────────────────────────────────────────────────────────
  const data = React.useMemo(() => {
    const H = hourly || {};
    const libIds = sede === 'all' ? Object.keys(H) : [sede];
    const byDate = {};     // date → total
    const byHour = {};     // hour → total
    const byLib  = {};     // libId → total
    const byMonth= {};     // YYYY-MM → total
    const byDateHour = {}; // date → { hour → total } (heatmap)
    const byDayOfWeek = [0,0,0,0,0,0,0];

    libIds.forEach(l => {
      Object.entries(H[l] || {}).forEach(([date, hrs]) => {
        if (!byDateHour[date]) byDateHour[date] = {};
        Object.entries(hrs).forEach(([h, c]) => {
          const hr = parseInt(h), n = Number(c)||0;
          byDate[date]  = (byDate[date]||0) + n;
          byHour[hr]    = (byHour[hr]||0) + n;
          byLib[l]      = (byLib[l]||0) + n;
          const mo = date.slice(0,7);
          byMonth[mo]   = (byMonth[mo]||0) + n;
          byDateHour[date][hr] = (byDateHour[date][hr]||0) + n;
          const dow = new Date(date + 'T12:00:00').getDay(); // 0=Sun
          byDayOfWeek[dow] += n;
        });
      });
    });
    return { byDate, byHour, byLib, byMonth, byDateHour, byDayOfWeek };
  }, [hourly, sede]);

  const dates = Object.keys(data.byDate).sort();
  const latestDate = dates[dates.length - 1];
  const entradasHoy = latestDate ? data.byDate[latestDate] : 0;
  const horaPunta = Object.entries(data.byHour).sort((a,b)=>b[1]-a[1])[0];
  const promHora = Object.values(data.byHour).length
    ? Math.round(Object.values(data.byHour).reduce((a,b)=>a+b,0) / Object.values(data.byHour).length)
    : 0;
  const totalSedes = Object.keys(data.byLib).length || 18;
  const fmt = n => Number(n||0).toLocaleString('es-CL');
  const libName = id => (libs.find(l => l.id===id) || {}).name || id;

  return (
    <div style={{ padding:'24px 28px', background:'#F4F5F7', minHeight:'calc(100vh - 90px)', fontFamily:"'Barlow',sans-serif" }}>

      {/* Page header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#1a1a1a' }}>
            {tab === 'dashboard' ? 'Dashboard' : 'Filtros de Consulta'}
          </h1>
          <div style={{ fontSize:11, color:'#666', marginTop:4, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:3, background:'#F5A800' }}></span>
            Última actualización: {latestDate || '—'}
          </div>
        </div>
        <select value={sede} onChange={e=>setSede(e.target.value)}
          style={{ background:'#fff', border:'1px solid #DDD', padding:'8px 12px', fontSize:12, borderRadius:3, minWidth:180 }}>
          <option value="all">Todas las sedes</option>
          {libs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #E0E0E0' }}>
        {[['dashboard','📊 Dashboard'],['filtros','🔍 Filtros']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 22px', fontSize:13, fontWeight: tab===id?800:500,
              color: tab===id?'#F5A800':'#888',
              borderBottom: tab===id?'3px solid #F5A800':'3px solid transparent',
              marginBottom:'-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' ? (
        <>
          {/* KPI cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
            <KPI bg="linear-gradient(135deg,#1ABC9C,#16A085)" title="Entradas Hoy" value={fmt(entradasHoy)} sub="entradas" icon="👥" />
            <KPI bg="linear-gradient(135deg,#E67E22,#D35400)" title="Hora Punta" value={horaPunta?`${String(horaPunta[0]).padStart(2,'0')}:00`:'—'} sub={horaPunta?`${fmt(horaPunta[1])} entradas`:'sin datos'} icon="⏰" />
            <KPI bg="linear-gradient(135deg,#3498DB,#2874A6)" title="Promedio/Hora" value={fmt(promHora)} sub="entradas" icon="📈" />
            <KPI bg="linear-gradient(135deg,#F5A800,#D49000)" title="Total Sedes" value={totalSedes} sub="bibliotecas" icon="🏛" />
          </div>

          {/* Ranking + Distribución */}
          <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16, marginBottom:16 }}>
            <Card title="Ranking de Sedes" subtitle="Entradas totales en el período">
              <RankingBars byLib={data.byLib} libName={libName} />
            </Card>
            <Card title="Distribución por Hora" subtitle="07:00 – 23:00">
              <HourlyBars byHour={data.byHour} />
            </Card>
          </div>

          {/* Comparativa mensual */}
          <Card title="Comparativa Mensual" subtitle="Entradas acumuladas por mes">
            <MonthlyCompare byMonth={data.byMonth} />
          </Card>

          {/* Heatmap */}
          <div style={{ marginTop:16 }}>
            <Card title="Mapa de Calor" subtitle={`Intensidad de entradas por día y hora · ${latestDate ? latestDate.slice(0,7) : ''}`}>
              <Heatmap byDateHour={data.byDateHour} latestMonth={latestDate ? latestDate.slice(0,7) : null} />
            </Card>
          </div>

          {/* Día de la semana */}
          <div style={{ marginTop:16 }}>
            <Card title="Afluencia por Día de la Semana">
              <WeekdayBars byDow={data.byDayOfWeek} />
            </Card>
          </div>
        </>
      ) : (
        <FiltrosTab hourly={hourly} libs={libs} />
      )}

      {isAdmin && (
        <div style={{ position:'fixed', bottom:24, right:24 }}>
          <button onClick={onUpload}
            style={{ background:'#F5A800', border:'none', padding:'12px 18px', borderRadius:30, color:'#1a1a1a', fontWeight:800, fontSize:12, cursor:'pointer', boxShadow:'0 6px 20px rgba(245,168,0,0.4)' }}>
            ↑ Cargar archivo torniquetes
          </button>
        </div>
      )}
    </div>
  );
}

function KPI({ bg, title, value, sub, icon }) {
  return (
    <div style={{ background:bg, padding:'18px 20px', borderRadius:6, color:'#fff', position:'relative', overflow:'hidden', minHeight:108 }}>
      <div style={{ fontSize:12, opacity:0.9, fontWeight:600 }}>{title}</div>
      <div style={{ fontSize:32, fontWeight:900, lineHeight:1.1, marginTop:6 }}>{value}</div>
      <div style={{ fontSize:11, opacity:0.85, marginTop:3 }}>{sub}</div>
      <div style={{ position:'absolute', right:14, top:14, fontSize:22, background:'rgba(255,255,255,0.18)', width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
    </div>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:6, padding:'18px 20px' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#1a1a1a' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function RankingBars({ byLib, libName }) {
  const sorted = Object.entries(byLib).sort((a,b)=>b[1]-a[1]).slice(0,18);
  const max = sorted[0]?.[1] || 1;
  const colors = ['#16A085','#1ABC9C','#3498DB','#2E86C1','#9B59B6','#8E44AD','#E91E63','#E74C3C','#E67E22','#F39C12','#F5A800','#27AE60','#1EBEC8','#2ECC71','#34495E','#7F8C8D','#16A085','#1ABC9C'];
  if (!sorted.length) return <div style={{ textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:12 }}>Sin datos disponibles</div>;
  return (
    <div style={{ display:'flex', alignItems:'flex-end', height:240, gap:6, padding:'10px 0 28px', position:'relative' }}>
      {sorted.map(([id,v],i) => {
        const h = Math.max(2, (v/max)*200);
        return (
          <div key={id} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
            <div style={{ fontSize:9, color:'#666', marginBottom:2 }}>{Number(v).toLocaleString('es-CL')}</div>
            <div style={{ width:'80%', height:h, background:colors[i%colors.length], borderRadius:'4px 4px 0 0' }} />
            <div style={{ fontSize:9, color:'#666', marginTop:6, transform:'rotate(-35deg)', transformOrigin:'top left', position:'absolute', bottom:-22, whiteSpace:'nowrap', left:'50%' }}>
              {libName(id)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HourlyBars({ byHour }) {
  const hours = [];
  for (let h=7; h<=23; h++) hours.push(h);
  const max = Math.max(...hours.map(h => byHour[h]||0), 1);
  if (!Object.keys(byHour).length) return <div style={{ textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:12 }}>Sin datos disponibles</div>;
  return (
    <div style={{ display:'flex', alignItems:'flex-end', height:240, gap:3, padding:'10px 0 20px' }}>
      {hours.map(h => {
        const v = byHour[h] || 0;
        const ht = Math.max(2, (v/max)*200);
        return (
          <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ width:'90%', height:ht, background:'linear-gradient(180deg,#F5A800,#D49000)', borderRadius:'3px 3px 0 0' }} title={`${h}:00 · ${v}`} />
            <div style={{ fontSize:9, color:'#888', marginTop:4 }}>{String(h).padStart(2,'0')}</div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyCompare({ byMonth }) {
  const entries = Object.entries(byMonth).sort();
  if (!entries.length) return <div style={{ textAlign:'center', padding:'60px 0', color:'#bbb', fontSize:12 }}>Sin datos disponibles</div>;
  const max = Math.max(...entries.map(e=>e[1]));
  const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return (
    <div style={{ display:'flex', alignItems:'flex-end', height:200, gap:4 }}>
      {entries.map(([mo,v]) => {
        const [y,m] = mo.split('-');
        const yColor = y==='2024' ? '#BBBBBB' : y==='2025' ? '#1EBEC8' : '#F5A800';
        return (
          <div key={mo} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ fontSize:9, color:'#666', marginBottom:2 }}>{Number(v).toLocaleString('es-CL')}</div>
            <div style={{ width:'70%', height:Math.max(2,(v/max)*160), background:yColor, borderRadius:'3px 3px 0 0' }} />
            <div style={{ fontSize:9, color:'#888', marginTop:6, fontWeight:600 }}>{MES[parseInt(m)-1]}</div>
            <div style={{ fontSize:8, color:'#bbb' }}>{y}</div>
          </div>
        );
      })}
    </div>
  );
}

function Heatmap({ byDateHour, latestMonth }) {
  if (!latestMonth) return <div style={{ padding:'40px 0', textAlign:'center', color:'#bbb', fontSize:12 }}>Sin datos disponibles</div>;
  const days = Object.keys(byDateHour).filter(d => d.startsWith(latestMonth)).sort();
  const hours = []; for (let h=7; h<=23; h++) hours.push(h);
  let maxV = 0;
  days.forEach(d => hours.forEach(h => { const v = byDateHour[d]?.[h] || 0; if (v>maxV) maxV = v; }));
  if (maxV === 0) return <div style={{ padding:'40px 0', textAlign:'center', color:'#bbb', fontSize:12 }}>Sin datos disponibles</div>;

  const color = v => {
    if (!v) return '#F4F6F8';
    const r = v/maxV;
    if (r < 0.2) return '#D6F3FF';
    if (r < 0.4) return '#7ED8F2';
    if (r < 0.6) return '#FFD982';
    if (r < 0.8) return '#FF9E5C';
    return '#E84149';
  };
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:`60px repeat(${hours.length},1fr)`, gap:2, minWidth:760 }}>
        <div></div>
        {hours.map(h => <div key={h} style={{ fontSize:9, color:'#888', textAlign:'center', padding:'4px 0' }}>{String(h).padStart(2,'0')}</div>)}
        {days.map(d => (
          <React.Fragment key={d}>
            <div style={{ fontSize:9, color:'#666', padding:'3px 4px' }}>{d.slice(8)}/{d.slice(5,7)}</div>
            {hours.map(h => {
              const v = byDateHour[d]?.[h] || 0;
              return <div key={h} title={`${d} ${h}:00 · ${v}`} style={{ background:color(v), height:14, borderRadius:2 }} />;
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, fontSize:10, color:'#888' }}>
        <span>0</span>
        {['#D6F3FF','#7ED8F2','#FFD982','#FF9E5C','#E84149'].map(c => <div key={c} style={{ width:30, height:10, background:c, borderRadius:2 }} />)}
        <span>{Number(maxV).toLocaleString('es-CL')}</span>
      </div>
    </div>
  );
}

function WeekdayBars({ byDow }) {
  const labels = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const max = Math.max(...byDow, 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', height:160, gap:14 }}>
      {byDow.map((v,i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ fontSize:10, color:'#666', marginBottom:3 }}>{Number(v).toLocaleString('es-CL')}</div>
          <div style={{ width:'70%', height:Math.max(2,(v/max)*120), background:'#1EBEC8', borderRadius:'3px 3px 0 0' }} />
          <div style={{ fontSize:10, color:'#888', marginTop:6, fontWeight:600 }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

// ── Filtros tab ──────────────────────────────────────────────────────────────

function FiltrosTab({ hourly, libs }) {
  const [from, setFrom] = React.useState('');
  const [to,   setTo]   = React.useState('');
  const [hFrom, setHFrom] = React.useState(7);
  const [hTo,   setHTo]   = React.useState(23);
  const [selSedes, setSelSedes] = React.useState(['all']);
  const [ejeX, setEjeX] = React.useState('fecha');
  const [metrica, setMetrica] = React.useState('total');
  const [tipo, setTipo] = React.useState('barras');
  const [consulted, setConsulted] = React.useState(false);

  const setQuick = (kind) => {
    const today = new Date();
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (kind === 'hoy')        { setFrom(fmt(today)); setTo(fmt(today)); }
    else if (kind === 'ayer')  { const d=new Date(today); d.setDate(d.getDate()-1); setFrom(fmt(d)); setTo(fmt(d)); }
    else if (kind === '7')     { const d=new Date(today); d.setDate(d.getDate()-7); setFrom(fmt(d)); setTo(fmt(today)); }
    else if (kind === '30')    { const d=new Date(today); d.setDate(d.getDate()-30); setFrom(fmt(d)); setTo(fmt(today)); }
    else if (kind === 'mes')   { setFrom(fmt(new Date(today.getFullYear(),today.getMonth(),1))); setTo(fmt(today)); }
    else if (kind === 'pasado'){ setFrom(fmt(new Date(today.getFullYear(),today.getMonth()-1,1))); setTo(fmt(new Date(today.getFullYear(),today.getMonth(),0))); }
  };

  const result = React.useMemo(() => {
    if (!consulted || !from || !to) return null;
    const H = hourly || {};
    const sedeIds = selSedes.includes('all') ? Object.keys(H) : selSedes;
    const agg = {};
    sedeIds.forEach(s => {
      Object.entries(H[s] || {}).forEach(([date, hrs]) => {
        if (date < from || date > to) return;
        Object.entries(hrs).forEach(([h, c]) => {
          const hr = parseInt(h);
          if (hr < hFrom || hr > hTo) return;
          let key;
          const dt = new Date(date+'T12:00:00');
          if      (ejeX === 'hora')    key = String(hr).padStart(2,'0')+':00';
          else if (ejeX === 'dia-sem') key = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][dt.getDay()];
          else if (ejeX === 'fecha')   key = date;
          else if (ejeX === 'mes')     key = date.slice(0,7);
          else if (ejeX === 'sede')    key = (libs.find(l=>l.id===s)||{}).name || s;
          agg[key] = (agg[key]||0) + (Number(c)||0);
        });
      });
    });
    return agg;
  }, [consulted, from, to, hFrom, hTo, selSedes, ejeX, hourly, libs]);

  const toggleSede = (id) => {
    setSelSedes(prev => {
      if (id === 'all') return ['all'];
      const without = prev.filter(s => s !== 'all' && s !== id);
      if (prev.includes(id)) return without.length ? without : ['all'];
      return [...without, id];
    });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Card title="🔍 Filtros de Consulta">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700, marginBottom:6 }}>Período rápido</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[['hoy','Hoy'],['ayer','Ayer'],['7','7 días'],['30','30 días'],['mes','Este mes'],['pasado','Mes pasado']].map(([k,l]) => (
                <button key={k} onClick={()=>setQuick(k)} style={{ background:'#F4F5F7', border:'1px solid #E0E0E0', padding:'4px 10px', borderRadius:3, fontSize:11, cursor:'pointer', color:'#555' }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><div style={{ fontSize:11, color:'#888', marginBottom:4 }}>Desde</div><input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ width:'100%', padding:'7px 10px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }} /></div>
            <div><div style={{ fontSize:11, color:'#888', marginBottom:4 }}>Hasta</div><input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{ width:'100%', padding:'7px 10px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }} /></div>
          </div>

          <div>
            <div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700, marginBottom:6 }}>Rango horario</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <select value={hFrom} onChange={e=>setHFrom(parseInt(e.target.value))} style={{ padding:'7px 10px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }}>
                {Array.from({length:17},(_,i)=>i+7).map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
              </select>
              <select value={hTo} onChange={e=>setHTo(parseInt(e.target.value))} style={{ padding:'7px 10px', border:'1px solid #DDD', borderRadius:3, fontSize:12 }}>
                {Array.from({length:17},(_,i)=>i+7).map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700, marginBottom:6 }}>Sedes</div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              <button onClick={()=>toggleSede('all')} style={{ background: selSedes.includes('all')?'#1EBEC8':'#F4F5F7', color: selSedes.includes('all')?'#fff':'#555', border:'1px solid '+(selSedes.includes('all')?'#1EBEC8':'#E0E0E0'), padding:'4px 12px', borderRadius:14, fontSize:10, cursor:'pointer', fontWeight:600 }}>Todas</button>
              {libs.map(l => (
                <button key={l.id} onClick={()=>toggleSede(l.id)} style={{ background: selSedes.includes(l.id)?'#F5A800':'#F4F5F7', color: selSedes.includes(l.id)?'#1a1a1a':'#555', border:'1px solid '+(selSedes.includes(l.id)?'#F5A800':'#E0E0E0'), padding:'4px 10px', borderRadius:14, fontSize:10, cursor:'pointer', fontWeight:600 }}>{l.name}</button>
              ))}
            </div>
          </div>

          <div style={{ textAlign:'right' }}>
            <button onClick={()=>setConsulted(true)} disabled={!from || !to}
              style={{ background: (from && to) ? '#1EBEC8' : '#CCC', color:'#fff', border:'none', padding:'8px 22px', borderRadius:3, fontSize:12, fontWeight:700, cursor: (from && to) ? 'pointer' : 'default' }}>
              🔍 Consultar
            </button>
          </div>
        </div>
      </Card>

      <Card title="Visualización">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18 }}>
          <RadioGroup label="EJE X" value={ejeX} onChange={setEjeX} options={[['hora','Hora del día','Distribución por hora (07:00–23:00)'],['dia-sem','Día de semana','Lun–Dom agregado'],['fecha','Fecha','Una barra por día'],['mes','Mes','Agrupado por mes'],['sede','Sede','Total por sede']]} />
          <RadioGroup label="MÉTRICA (EJE Y)" value={metrica} onChange={setMetrica} options={[['total','Total','Suma de todas las entradas'],['promedio','Promedio','Promedio por día del período']]} />
          <RadioGroup label="TIPO DE GRÁFICO" value={tipo} onChange={setTipo} options={[['barras','📊 Barras',''],['lineal','📈 Lineal',''],['circular','◯ Circular',''],['heatmap','▦ Mapa de calor','']]} />
        </div>
      </Card>

      <Card title="Resultados">
        {!result ? (
          <div style={{ padding:'60px 20px', textAlign:'center', color:'#999' }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🔍</div>
            <div style={{ fontSize:13, fontWeight:600 }}>Selecciona un rango de fechas para consultar</div>
            <div style={{ fontSize:11, color:'#bbb', marginTop:4 }}>Usa los filtros de arriba y presiona "Consultar"</div>
          </div>
        ) : (
          <ResultViz result={result} tipo={tipo} metrica={metrica} from={from} to={to} />
        )}
      </Card>
    </div>
  );
}

function RadioGroup({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize:11, color:'#1EBEC8', fontWeight:700, marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {options.map(([k, l, d]) => (
          <label key={k} onClick={()=>onChange(k)} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', background:value===k?'#EBF8FF':'transparent', border:'1px solid '+(value===k?'#3498DB':'transparent'), borderRadius:3, cursor:'pointer' }}>
            <span style={{ marginTop:1, width:12, height:12, borderRadius:6, border:'2px solid '+(value===k?'#3498DB':'#CCC'), background:value===k?'#3498DB':'#fff', flexShrink:0 }}></span>
            <div>
              <div style={{ fontSize:12, fontWeight: value===k?700:500, color: value===k?'#2874A6':'#555' }}>{l}</div>
              {d && <div style={{ fontSize:10, color:'#999', marginTop:1 }}>{d}</div>}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function ResultViz({ result, tipo, metrica, from, to }) {
  const entries = Object.entries(result).sort();
  if (!entries.length) return <div style={{ padding:'40px 0', textAlign:'center', color:'#bbb', fontSize:12 }}>Sin datos en el rango seleccionado</div>;

  let display = entries;
  if (metrica === 'promedio' && from && to) {
    const days = Math.max(1, Math.round((new Date(to) - new Date(from))/86400000)+1);
    display = entries.map(([k,v]) => [k, Math.round(v/days)]);
  }
  const total = display.reduce((a,b)=>a+b[1],0);
  const max = Math.max(...display.map(e=>e[1]), 1);

  if (tipo === 'circular') {
    const colors = ['#F5A800','#1EBEC8','#27AE60','#2E86C1','#9B59B6','#E67E22','#E74C3C','#16A085','#34495E','#F39C12'];
    let acc = 0;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:30 }}>
        <svg viewBox="0 0 100 100" style={{ width:220, height:220 }}>
          {display.map(([k,v],i) => {
            const pct = v/total;
            const start = acc; acc += pct;
            const a1 = start*2*Math.PI - Math.PI/2;
            const a2 = acc*2*Math.PI - Math.PI/2;
            const x1=50+45*Math.cos(a1), y1=50+45*Math.sin(a1);
            const x2=50+45*Math.cos(a2), y2=50+45*Math.sin(a2);
            const large = pct > 0.5 ? 1 : 0;
            return <path key={k} d={`M50,50 L${x1},${y1} A45,45 0 ${large},1 ${x2},${y2} Z`} fill={colors[i%colors.length]} />;
          })}
        </svg>
        <div style={{ flex:1 }}>
          {display.map(([k,v],i) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:12 }}>
              <div style={{ width:12, height:12, background:colors[i%colors.length], borderRadius:2 }} />
              <span style={{ flex:1, color:'#555' }}>{k}</span>
              <span style={{ fontWeight:700 }}>{Number(v).toLocaleString('es-CL')}</span>
              <span style={{ color:'#999', fontSize:10 }}>{(v/total*100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tipo === 'lineal') {
    const w=700, h=220, pad=30;
    const pts = display.map(([k,v],i) => [pad+i*(w-2*pad)/Math.max(1,display.length-1), h-pad-(v/max)*(h-2*pad)]);
    const path = pts.map((p,i)=> (i?'L':'M')+p[0]+','+p[1]).join(' ');
    return (
      <svg viewBox={`0 0 ${w} ${h+30}`} style={{ width:'100%' }}>
        <path d={path} stroke="#F5A800" strokeWidth="2.5" fill="none" />
        {pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#F5A800" />)}
        {display.map(([k],i) => <text key={k} x={pts[i][0]} y={h+10} fontSize="9" fill="#888" textAnchor="middle">{String(k).slice(-7)}</text>)}
      </svg>
    );
  }

  // bars or heatmap fallback
  return (
    <div>
      <div style={{ marginBottom:8, fontSize:11, color:'#666' }}>Total: <strong style={{ color:'#1a1a1a' }}>{Number(total).toLocaleString('es-CL')}</strong> · {display.length} valores</div>
      <div style={{ display:'flex', alignItems:'flex-end', height:240, gap:3, padding:'10px 0 24px' }}>
        {display.map(([k,v]) => (
          <div key={k} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
            <div style={{ fontSize:9, color:'#666' }}>{Number(v).toLocaleString('es-CL')}</div>
            <div style={{ width:'80%', height:Math.max(2,(v/max)*200), background:'#3498DB', borderRadius:'3px 3px 0 0' }} title={`${k} · ${v}`} />
            <div style={{ fontSize:8, color:'#999', marginTop:4, transform: display.length > 10 ? 'rotate(-45deg)' : 'none', transformOrigin:'top left', whiteSpace:'nowrap' }}>{String(k).slice(-8)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
