// js/components/Compare.jsx — Vista comparativa 2024/2025/2026
const { fmtNum, fmtPct, YEARS } = window.DuocData;

const YEAR_COLORS = { '2024': '#95A5A6', '2025': '#F5A800', '2026': '#1EBEC8' };
const YEAR_LABELS = { '2024': '2024', '2025': '2025', '2026': '2026 (Ene–Abr)' };

// ── Shared helpers ────────────────────────────────────────────────────────────

function DeltaBadge({ value, base }) {
  if (!base || base === 0) return null;
  const pct = ((value - base) / base) * 100;
  const up  = pct >= 0;
  return (
    <span style={{
      fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:2, marginLeft:8,
      background: up ? '#E8F5E9' : '#FFEBEE',
      color:      up ? '#2E7D32' : '#C62828',
    }}>
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function YearKpiRow({ label, byYear, field, color }) {
  const vals  = YEARS.map(y => byYear[y]?.[field] || 0);
  const avail = YEARS.filter(y => byYear[y]);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`140px repeat(${avail.length},1fr)`, alignItems:'center', gap:0, borderBottom:'1px solid #F5F5F5', padding:'8px 0' }}>
      <div style={{ fontSize:11, color:'#888' }}>{label}</div>
      {avail.map((y, i) => (
        <div key={y} style={{ textAlign:'right', paddingRight:16 }}>
          <span style={{ fontSize:16, fontWeight:800, color: YEAR_COLORS[y] }}>{fmtNum(vals[YEARS.indexOf(y)])}</span>
          {i > 0 && <DeltaBadge value={vals[YEARS.indexOf(y)]} base={vals[YEARS.indexOf(avail[0])]} />}
        </div>
      ))}
    </div>
  );
}

function CompareLineChart({ byYear, field, height = 220, yLabel }) {
  const avail = YEARS.filter(y => byYear[y]);
  // All 12 month labels on x-axis
  const labels = window.DuocData.MONTH_LABELS;
  const datasets = avail.map(y => {
    const monthly = byYear[y]?.monthlyData || [];
    // Map to all 12 months (null for missing)
    const data = labels.map((_, mi) => {
      const key = `${y}-${String(mi+1).padStart(2,'0')}`;
      const m   = monthly.find(d => d.key === key);
      return m ? (m[field] || 0) : null;
    });
    return { label: YEAR_LABELS[y], data, color: YEAR_COLORS[y] };
  });

  const key = JSON.stringify({ byYear: avail.map(y => byYear[y]?.monthlyData?.map(m => m[field])), field });
  const ref = React.useRef(null);
  const inst = React.useRef(null);

  React.useEffect(() => {
    if (!ref.current || !window.Chart) return;
    inst.current?.destroy();
    inst.current = new window.Chart(ref.current.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: datasets.map(ds => ({
          label: ds.label, data: ds.data,
          borderColor: ds.color, backgroundColor: ds.color + '14',
          fill: false, tension: 0.4, pointRadius: 4,
          pointBackgroundColor: ds.color, pointBorderColor: '#fff',
          pointBorderWidth: 1.5, borderWidth: 2.5,
          spanGaps: false,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size:11, family:"'Barlow',sans-serif" }, usePointStyle: true, boxWidth: 8, padding: 14 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.y||0).toLocaleString('es-CL')}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size:10, family:"'Barlow',sans-serif" }, color:'#999' } },
          y: { grid: { color:'rgba(0,0,0,0.05)' }, ticks: { font: { size:10, family:"'Barlow',sans-serif" }, color:'#999' }, border: { display: false } }
        }
      }
    });
    return () => { inst.current?.destroy(); inst.current = null; };
  // eslint-disable-next-line
  }, [key]);

  return <div style={{ height }}><canvas ref={ref} /></div>;
}

function CompareBarChart({ byYear, field, height = 180 }) {
  const avail   = YEARS.filter(y => byYear[y]);
  const labels  = window.DuocData.MONTH_LABELS;
  const chartDs = avail.map(y => {
    const monthly = byYear[y]?.monthlyData || [];
    const data = labels.map((_, mi) => {
      const key = `${y}-${String(mi+1).padStart(2,'0')}`;
      const m   = monthly.find(d => d.key === key);
      return m ? (m[field] || 0) : null;
    });
    return { label: YEAR_LABELS[y], data, backgroundColor: YEAR_COLORS[y] + 'CC', borderRadius: 3 };
  });

  const key = JSON.stringify(avail.map(y => byYear[y]?.monthlyData?.map(m => m[field])));
  const ref  = React.useRef(null);
  const inst = React.useRef(null);

  React.useEffect(() => {
    if (!ref.current || !window.Chart) return;
    inst.current?.destroy();
    inst.current = new window.Chart(ref.current.getContext('2d'), {
      type: 'bar',
      data: { labels, datasets: chartDs },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size:10, family:"'Barlow',sans-serif" }, usePointStyle: true, boxWidth:7, padding:12 } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size:10 }, color:'#999' } },
          y: { grid: { color:'rgba(0,0,0,0.05)' }, ticks: { font: { size:10 }, color:'#999' }, border: { display: false } }
        }
      }
    });
    return () => { inst.current?.destroy(); inst.current = null; };
  // eslint-disable-next-line
  }, [key]);

  return <div style={{ height }}><canvas ref={ref} /></div>;
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function CCard({ title, right, accent, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderTop:`2px solid ${accent||'#E0E0E0'}`, padding:'18px 22px' }}>
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

// ── Year header row ───────────────────────────────────────────────────────────

function YearHeaderRow({ byYear }) {
  const avail = YEARS.filter(y => byYear[y]);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`140px repeat(${avail.length},1fr)`, gap:0, marginBottom:4 }}>
      <div />
      {avail.map(y => (
        <div key={y} style={{ textAlign:'right', paddingRight:16, fontSize:10, fontWeight:800, color: YEAR_COLORS[y], letterSpacing:'0.6px', textTransform:'uppercase' }}>
          {YEAR_LABELS[y]}
        </div>
      ))}
    </div>
  );
}

// ── Summary KPI cards ─────────────────────────────────────────────────────────

function YearSummaryCards({ byYear }) {
  const avail = YEARS.filter(y => byYear[y]);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${avail.length},1fr)`, gap:14 }}>
      {avail.map((y, i) => {
        const d = byYear[y];
        const totalDig = (d.bdd||0)+(d.libros||0)+(d.medialink||0);
        const totalAF  = (d.inducciones||0)+(d.talleres||0)+(d.asesorias||0);
        const base     = byYear[avail[0]];
        return (
          <div key={y} style={{ background:'#fff', border:`1px solid #EBEBEB`, borderTop:`4px solid ${YEAR_COLORS[y]}`, padding:'20px 22px' }}>
            <div style={{ fontSize:11, fontWeight:800, color: YEAR_COLORS[y], letterSpacing:'0.6px', marginBottom:14, textTransform:'uppercase' }}>
              {YEAR_LABELS[y]}
              {i > 0 && <DeltaBadge value={d.cuentapersonas} base={base?.cuentapersonas} />}
            </div>
            {[
              ['Cuentapersonas', d.cuentapersonas, YEAR_COLORS[y]],
              ['Rec. Digitales', totalDig, '#555'],
              ['Préstamos MBB',  d.prestamos, '#666'],
              ['Acc. Formativas',totalAF, '#666'],
            ].map(([lbl, val, c]) => (
              <div key={lbl} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #F5F5F5' }}>
                <span style={{ fontSize:11, color:'#aaa' }}>{lbl}</span>
                <span style={{ fontSize:13, fontWeight:800, color:c }}>{fmtNum(val)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Main comparative sections ─────────────────────────────────────────────────

function CompareCuentapersonas({ byYear }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <YearSummaryCards byYear={byYear} />
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:14 }}>
        <CCard title="Cuentapersonas · Evolución mensual comparada" accent="#F5A800">
          <CompareLineChart byYear={byYear} field="cuentapersonas" height={240} />
        </CCard>
        <CCard title="Detalle anual" accent="#F5A800">
          <YearHeaderRow byYear={byYear} />
          {[
            ['Cuentapersonas', 'cuentapersonas'],
            ['Matrícula', 'matricula'],
          ].map(([lbl, f]) => <YearKpiRow key={f} label={lbl} byYear={byYear} field={f} />)}
        </CCard>
      </div>
      <CCard title="Cuentapersonas por mes · Barras comparativas" accent="#F5A800">
        <CompareBarChart byYear={byYear} field="cuentapersonas" height={200} />
      </CCard>
    </div>
  );
}

function CompareDigitales({ byYear }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <YearSummaryCards byYear={byYear} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <CCard title="Bases de datos · Evolución comparada" accent="#1EBEC8">
          <CompareLineChart byYear={byYear} field="bdd" height={220} />
        </CCard>
        <CCard title="Libros digitales · Evolución comparada" accent="#2E86C1">
          <CompareLineChart byYear={byYear} field="libros" height={220} />
        </CCard>
      </div>
      <CCard title="Detalle recursos digitales" accent="#1EBEC8">
        <YearHeaderRow byYear={byYear} />
        {[['Bases de datos','bdd'],['Libros digitales','libros'],['Medialink','medialink']].map(([lbl,f]) =>
          <YearKpiRow key={f} label={lbl} byYear={byYear} field={f} />
        )}
      </CCard>
    </div>
  );
}

function CompareBibliograficos({ byYear }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <YearSummaryCards byYear={byYear} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <CCard title="Préstamos MBB · Evolución comparada" accent="#27AE60">
          <CompareLineChart byYear={byYear} field="prestamos" height={220} />
        </CCard>
        <CCard title="Renovaciones · Evolución comparada" accent="#27AE60">
          <CompareLineChart byYear={byYear} field="renovaciones" height={220} />
        </CCard>
      </div>
      <CCard title="Detalle MBB + MNB" accent="#27AE60">
        <YearHeaderRow byYear={byYear} />
        {[['Préstamos','prestamos'],['Renovaciones','renovaciones'],['Uso interno','usoInterno'],
          ['Revistas','revistas'],['Calculadoras','calculadoras'],['Notebooks','notebooks'],['Juegos','juegos']].map(([lbl,f]) =>
          <YearKpiRow key={f} label={lbl} byYear={byYear} field={f} />
        )}
      </CCard>
    </div>
  );
}

function CompareFormativas({ byYear }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <YearSummaryCards byYear={byYear} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
        <CCard title="Inducciones · Comparado" accent="#F5A800">
          <CompareBarChart byYear={byYear} field="inducciones" height={180} />
        </CCard>
        <CCard title="Talleres · Comparado" accent="#1EBEC8">
          <CompareBarChart byYear={byYear} field="talleres" height={180} />
        </CCard>
        <CCard title="Asesorías · Comparado" accent="#2E86C1">
          <CompareBarChart byYear={byYear} field="asesorias" height={180} />
        </CCard>
      </div>
      <CCard title="Detalle acciones formativas" accent="#F5A800">
        <YearHeaderRow byYear={byYear} />
        {[['Inducciones','inducciones'],['Talleres','talleres'],['Asesorías','asesorias']].map(([lbl,f]) =>
          <YearKpiRow key={f} label={lbl} byYear={byYear} field={f} />
        )}
      </CCard>
    </div>
  );
}

Object.assign(window, { CompareCuentapersonas, CompareDigitales, CompareBibliograficos, CompareFormativas, YEAR_COLORS, YEAR_LABELS });
