// js/components/Sections.jsx — 4 indicator section panels
const { fmtNum, fmtPct } = window.DuocData;
const SC = { yellow:'#F5A800', teal:'#1EBEC8', blue:'#2E86C1', green:'#27AE60', orange:'#E67E22', gray:'#95A5A6' };

// ── Shared UI ─────────────────────────────────────────────────────────────────

function BigKpi({ label, value, sub, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderTop:`3px solid ${color||'#EBEBEB'}`, padding:'18px 22px' }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:30, fontWeight:800, color:color||'#1a1a1a', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#bbb', marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, right, children, accent }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderTop:`2px solid ${accent||'#EBEBEB'}`, padding:'18px 22px' }}>
      {(title||right) && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#555', textTransform:'uppercase', letterSpacing:'0.6px' }}>{title}</div>
          <div style={{ fontSize:11, color:'#bbb' }}>{right}</div>
        </div>
      )}
      {children}
    </div>
  );
}

function MiniKpi({ label, value, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:20, fontWeight:800, color:color||'#1a1a1a' }}>{value}</div>
      <div style={{ fontSize:10, color:'#aaa', marginTop:2 }}>{label}</div>
    </div>
  );
}

function MonthBars({ monthlyData, field, color }) {
  const vals = monthlyData.map(m => m[field] || 0);
  const max = Math.max(...vals, 1);
  const peak = vals.indexOf(Math.max(...vals));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {monthlyData.map((m, i) => {
        const pct = (vals[i] / max) * 100;
        const isMax = i === peak;
        return (
          <div key={m.key} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'#aaa', width:26, flexShrink:0 }}>{m.label}</span>
            <div style={{ flex:1, height:14, background:'#F5F5F5', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background: isMax ? color : color+'66', transition:'width 0.4s' }} />
            </div>
            <span style={{ fontSize:11, fontWeight:isMax?700:400, color:isMax?color:'#888', width:54, textAlign:'right', flexShrink:0 }}>
              {fmtNum(vals[i])}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── CuentaPersonas ────────────────────────────────────────────────────────────

function CuentaPersonas({ annualData }) {
  if (!annualData) return <Empty />;
  const { monthlyData, cuentapersonas } = annualData;
  const maxM = monthlyData.reduce((a,b) => b.cuentapersonas > a.cuentapersonas ? b : a, monthlyData[0] || {});
  const avg  = Math.round(cuentapersonas / (monthlyData.length || 1));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <BigKpi label="Total Accesos" value={fmtNum(cuentapersonas)} sub="accesos acumulados del período" color={SC.yellow} />
        <BigKpi label="Mes de Mayor Acceso" value={maxM.label||'—'} sub={`${fmtNum(maxM.cuentapersonas)} accesos registrados`} color={SC.teal} />
        <BigKpi label="Promedio Mensual" value={fmtNum(avg)} sub="accesos por mes" color="#777" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card title="Cuentapersonas · Tendencia anual" right={`${fmtNum(cuentapersonas)} accesos`} accent={SC.yellow}>
          <LineChart
            labels={monthlyData.map(m=>m.label)}
            datasets={[{ label:'Accesos', data:monthlyData.map(m=>m.cuentapersonas), color:SC.yellow, fill:true }]}
            height={230}
          />
        </Card>
        <Card title="Distribución mensual" accent={SC.yellow}>
          <MonthBars monthlyData={monthlyData} field="cuentapersonas" color={SC.yellow} />
        </Card>
      </div>
    </div>
  );
}

// ── Recursos Digitales ────────────────────────────────────────────────────────

function RecDigitales({ annualData }) {
  if (!annualData) return <Empty />;
  const { monthlyData, bdd, libros, medialink } = annualData;
  const total = bdd + libros + medialink;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <BigKpi label="Total Recursos Digitales" value={fmtNum(total)} sub="usos acumulados del período" color={SC.teal} />
        <BigKpi label="Bases de Datos" value={fmtNum(bdd)} sub={`${fmtPct(bdd,total)} del total digital`} color="#777" />
        <BigKpi label="Libros Digitales" value={fmtNum(libros)} sub={`${fmtPct(libros,total)} del total digital`} color={SC.blue} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14 }}>
        <Card title="Evolución mensual · Recursos digitales" right={`${fmtNum(total)} usos`} accent={SC.teal}>
          <LineChart
            labels={monthlyData.map(m=>m.label)}
            datasets={[
              { label:'Bases de datos', data:monthlyData.map(m=>m.bdd),      color:'#555' },
              { label:'Libros digitales',data:monthlyData.map(m=>m.libros),   color:SC.teal },
              { label:'Medialink',       data:monthlyData.map(m=>m.medialink),color:SC.orange },
            ]}
            height={230}
          />
        </Card>
        <Card title="Distribución y detalle mensual" accent={SC.teal}>
          <DonutChart
            labels={['BDD','Libros Dig.','Medialink']}
            values={[bdd,libros,medialink]}
            colors={['#555',SC.teal,SC.orange]}
            size={150}
          />
          <div style={{ marginTop:12, overflowY:'auto', maxHeight:130 }}>
            <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
              <thead>
                <tr>{['Mes','Total','BDD','Libros','MLink'].map(h=>(
                  <th key={h} style={{ padding:'3px 5px', textAlign:h==='Mes'?'left':'right', color:'#bbb', fontWeight:700, borderBottom:'1px solid #f0f0f0' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {monthlyData.map(m=>(
                  <tr key={m.key} style={{ borderBottom:'1px solid #f8f8f8' }}>
                    <td style={{ padding:'3px 5px', fontWeight:600 }}>{m.label}</td>
                    <td style={{ padding:'3px 5px', textAlign:'right' }}>{fmtNum(m.bdd+m.libros+m.medialink)}</td>
                    <td style={{ padding:'3px 5px', textAlign:'right' }}>{fmtNum(m.bdd)}</td>
                    <td style={{ padding:'3px 5px', textAlign:'right', color:SC.teal }}>{fmtNum(m.libros)}</td>
                    <td style={{ padding:'3px 5px', textAlign:'right' }}>{fmtNum(m.medialink)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Bibliográficos & No Bibliográficos ────────────────────────────────────────

function Bibliograficos({ annualData }) {
  if (!annualData) return <Empty />;
  const { monthlyData, prestamos, renovaciones, usoInterno, revistas, calculadoras, notebooks, juegos } = annualData;
  const totalMBB = prestamos + renovaciones + usoInterno + revistas;
  const totalMNB = calculadoras + notebooks + juegos;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <BigKpi label="Total MBB Impresos" value={fmtNum(totalMBB)} sub="todos los usos: prést/reno/interno" color={SC.green} />
        <BigKpi label="Total MNB" value={fmtNum(totalMNB)} sub="calculadoras, notebooks, juegos" color="#777" />
        <BigKpi label="Préstamos Directos" value={fmtNum(prestamos)} sub={`${fmtPct(prestamos,totalMBB)} del total MBB`} color={SC.orange} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <Card title="Bibliográficos impresos (MBB)" right={`${fmtNum(totalMBB)} usos totales`} accent={SC.green}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:14 }}>
            {[['Préstamos',prestamos,SC.green],['Renovaciones',renovaciones,SC.teal],['Uso Interno',usoInterno,SC.blue],['Revistas',revistas,SC.gray]].map(([l,v,c])=>(
              <MiniKpi key={l} label={l} value={fmtNum(v)} color={c} />
            ))}
          </div>
          <LineChart
            labels={monthlyData.map(m=>m.label)}
            datasets={[
              { label:'Préstamos',   data:monthlyData.map(m=>m.prestamos),   color:SC.green },
              { label:'Renovaciones',data:monthlyData.map(m=>m.renovaciones),color:SC.teal },
              { label:'Uso Interno', data:monthlyData.map(m=>m.usoInterno),  color:SC.blue },
              { label:'Revistas',    data:monthlyData.map(m=>m.revistas),    color:SC.gray },
            ]}
            height={190}
          />
        </Card>
        <Card title="No bibliográficos (MNB)" right={`${fmtNum(totalMNB)} préstamos`} accent={SC.orange}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:14 }}>
            {[['Calculadoras',calculadoras,SC.blue],['Notebooks',notebooks,'#666'],['Juegos',juegos,SC.teal]].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:c }}>{fmtNum(v)}</div>
                <div style={{ fontSize:10, color:'#aaa' }}>{l}</div>
                <div style={{ fontSize:10, color:'#ccc' }}>{fmtPct(v,totalMNB)}</div>
              </div>
            ))}
          </div>
          <StackedBarChart
            labels={monthlyData.map(m=>m.label)}
            datasets={[
              { label:'Calculadoras',data:monthlyData.map(m=>m.calculadoras),color:SC.blue },
              { label:'Notebooks',   data:monthlyData.map(m=>m.notebooks),   color:'#888' },
              { label:'Juegos',      data:monthlyData.map(m=>m.juegos),      color:SC.teal },
            ]}
            height={190}
          />
        </Card>
      </div>
    </div>
  );
}

// ── Acciones Formativas ───────────────────────────────────────────────────────

function AccionesFormativas({ annualData }) {
  if (!annualData) return <Empty />;
  const { monthlyData, inducciones, talleres, asesorias, matricula } = annualData;
  const totalAF = inducciones + talleres + asesorias;
  const alcance = matricula > 0 ? Math.min(100, (inducciones / matricula) * 100) : 0;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <BigKpi label="Inducciones · Asistencias" value={fmtNum(inducciones)} sub="alumnos inicio alcanzados" color={SC.yellow} />
        <BigKpi label="Talleres · Asistencias"    value={fmtNum(talleres)}    sub="solo alumnos" color={SC.teal} />
        <BigKpi label="Asesorías · Asistencias"   value={fmtNum(asesorias)}   sub="solo alumnos" color={SC.blue} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        <Card title="Inducciones · Asistencias" right={fmtNum(inducciones)} accent={SC.yellow}>
          <BarChart labels={monthlyData.map(m=>m.label)} values={monthlyData.map(m=>m.inducciones)} color={SC.yellow} height={170} />
        </Card>
        <Card title="Talleres · Asistencias" right={fmtNum(talleres)} accent={SC.teal}>
          <BarChart labels={monthlyData.map(m=>m.label)} values={monthlyData.map(m=>m.talleres)} color={SC.teal} height={170} />
        </Card>
        <Card title="Asesorías · Asistencias" right={fmtNum(asesorias)} accent={SC.blue}>
          <BarChart labels={monthlyData.map(m=>m.label)} values={monthlyData.map(m=>m.asesorias)} color={SC.blue} height={170} />
        </Card>
      </div>
      <Card title="Alcance inducción sobre matrícula de inicio" right={`${fmtNum(inducciones)} de ${fmtNum(matricula)} alumnos`} accent={SC.yellow}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:11, color:'#aaa', flexShrink:0, width:170 }}>% alumnos inicio alcanzados</span>
          <div style={{ flex:1, height:22, background:'#F0F0F0', borderRadius:2, overflow:'hidden' }}>
            <div style={{ width:`${Math.min(alcance,100)}%`, height:'100%', background:SC.yellow, transition:'width 0.5s' }} />
          </div>
          <span style={{ fontSize:18, fontWeight:800, color:SC.yellow, flexShrink:0, minWidth:52, textAlign:'right' }}>{alcance.toFixed(1)}%</span>
        </div>
        <div style={{ fontSize:11, color:'#ccc', marginTop:8 }}>
          Tendencia anual · Ind + Tall + Ases = {fmtNum(totalAF)} asistencias totales
        </div>
      </Card>
    </div>
  );
}

function Empty() {
  return <div style={{ padding:60, textAlign:'center', color:'#ccc', fontSize:14 }}>Sin datos disponibles</div>;
}

Object.assign(window, { CuentaPersonas, RecDigitales, Bibliograficos, AccionesFormativas });
