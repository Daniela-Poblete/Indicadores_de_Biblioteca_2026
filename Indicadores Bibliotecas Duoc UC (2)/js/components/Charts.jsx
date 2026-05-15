// js/components/Charts.jsx — Chart.js wrappers for Duoc UC dashboard
const { useRef, useEffect } = React;

const CC = {
  yellow:  '#F5A800',
  teal:    '#1EBEC8',
  blue:    '#2E86C1',
  green:   '#27AE60',
  orange:  '#E67E22',
  gray:    '#95A5A6',
  dark:    '#2C3E50',
};

const TICK_STYLE = { font: { size: 10, family: "'Barlow', sans-serif" }, color: '#999' };
const GRID_COLOR = 'rgba(0,0,0,0.05)';
const LEGEND_OPTS = {
  display: true, position: 'bottom',
  labels: { font: { size: 10, family: "'Barlow', sans-serif" }, usePointStyle: true, boxWidth: 7, padding: 12 }
};

function useChart(type, buildData, buildOptions, deps) {
  const ref = useRef(null);
  const inst = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (inst.current) { inst.current.destroy(); inst.current = null; }
    inst.current = new window.Chart(ref.current.getContext('2d'), {
      type, data: buildData(), options: buildOptions()
    });
    return () => { inst.current?.destroy(); inst.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function BarChart({ labels, values, color = CC.yellow, height = 180 }) {
  const key = JSON.stringify({ labels, values, color });
  const ref = useChart('bar',
    () => ({ labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 4, borderSkipped: false }] }),
    () => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + ctx.parsed.y.toLocaleString('es-CL') } } },
      scales: {
        x: { grid: { display: false }, ticks: TICK_STYLE },
        y: { grid: { color: GRID_COLOR }, ticks: TICK_STYLE, border: { display: false } }
      }
    }),
    [key]
  );
  return <div style={{ height }}><canvas ref={ref} /></div>;
}

function LineChart({ labels, datasets, height = 220 }) {
  const key = JSON.stringify({ labels, datasets });
  const ref = useChart('line',
    () => ({
      labels,
      datasets: datasets.map(ds => ({
        label: ds.label, data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.fill ? ds.color + '18' : 'transparent',
        fill: !!ds.fill, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: ds.color, pointBorderColor: '#fff',
        pointBorderWidth: 1.5, borderWidth: 2
      }))
    }),
    () => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: datasets.length > 1 ? LEGEND_OPTS : { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: TICK_STYLE },
        y: { grid: { color: GRID_COLOR }, ticks: TICK_STYLE, border: { display: false } }
      }
    }),
    [key]
  );
  return <div style={{ height }}><canvas ref={ref} /></div>;
}

function StackedBarChart({ labels, datasets, height = 200 }) {
  const key = JSON.stringify({ labels, datasets });
  const ref = useChart('bar',
    () => ({
      labels,
      datasets: datasets.map(ds => ({
        label: ds.label, data: ds.data,
        backgroundColor: ds.color, borderRadius: 2, borderSkipped: false
      }))
    }),
    () => ({
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: LEGEND_OPTS },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: TICK_STYLE },
        y: { stacked: true, grid: { color: GRID_COLOR }, ticks: TICK_STYLE, border: { display: false } }
      }
    }),
    [key]
  );
  return <div style={{ height }}><canvas ref={ref} /></div>;
}

function DonutChart({ labels, values, colors, size = 160 }) {
  const key = JSON.stringify({ labels, values, colors });
  const ref = useChart('doughnut',
    () => ({ labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverBorderWidth: 3 }] }),
    () => ({
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: LEGEND_OPTS }
    }),
    [key]
  );
  return <div style={{ height: size }}><canvas ref={ref} /></div>;
}

Object.assign(window, { BarChart, LineChart, StackedBarChart, DonutChart, CC });
