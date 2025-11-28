// timeline.js - Gráfico de timeline
'use strict';

//#region MÓDULO: Timeline
//////////////////////////////////////////////////////////////////////
// MÓDULO: Timeline
//////////////////////////////////////////////////////////////////////

function refrescarTimelineDesdeFiltros() {
  const lista = obtenerMovimientosFiltrados();
  const simbolo = obtenerSimboloMoneda();
  actualizarChartTimeline(lista, simbolo);
}

function obtenerClaveGrupoTimeline(fecha, periodo) {
  const year = fecha.getFullYear();
  const month = fecha.getMonth() + 1;

  if (periodo === 'mes') {
    const key = year + '-' + String(month).padStart(2, '0');
    const label =
      String(month).padStart(2, '0') + '/' + String(year).slice(-2);
    return { key: key, label: label };
  }

  if (periodo === 'semana') {
    const day = fecha.getDay(); // 0=Dom
    const diff = day === 0 ? -6 : 1 - day; // lunes
    const inicio = new Date(fecha);
    inicio.setDate(fecha.getDate() + diff);
    const key = convertirFechaADateString(inicio);
    const label = 'Sem ' + formatearDiaMes(inicio);
    return { key: key, label: label };
  }

  const key = convertirFechaADateString(fecha);
  const label = formatearDiaMes(fecha);
  return { key: key, label: label };
}

function construirGruposTimeline(listaMovimientos, periodo) {
  const mapa = {};

  listaMovimientos.forEach(function (mov) {
    const fecha = parseFechaYYYYMMDD(mov.fecha);
    if (!fecha) return;

    const clave = obtenerClaveGrupoTimeline(fecha, periodo);
    const key = clave.key;

    if (!mapa[key]) {
      mapa[key] = {
        label: clave.label,
        ingresos: 0,
        gastos: 0
      };
    }

    const g = mapa[key];
    if (mov.tipo === 'INGRESO') {
      g.ingresos += mov.monto;
    } else if (mov.tipo === 'GASTO') {
      g.gastos += mov.monto;
    }
  });

  const keys = Object.keys(mapa).sort();
  return keys.map(function (k) {
    const g = mapa[k];
    return {
      label: g.label,
      ingresos: g.ingresos,
      gastos: g.gastos
    };
  });
}

function actualizarChartTimeline(listaMovimientos, simbolo) {
  const canvas = document.getElementById('chart-timeline');
  if (!canvas || typeof Chart === 'undefined') return;

  const periodo = selectTimelinePeriodo ? selectTimelinePeriodo.value : 'dia';
  const mostrarIngresos =
    !chkTimelineIngresos || chkTimelineIngresos.checked;
  const mostrarGastos = !chkTimelineGastos || chkTimelineGastos.checked;
  const mostrarBalance = !chkTimelineBalance || chkTimelineBalance.checked;

  const grupos = construirGruposTimeline(listaMovimientos, periodo);

  const labels = grupos.map(function (g) {
    return g.label;
  });

  const datasets = [];

  if (mostrarIngresos) {
    datasets.push({
      label: 'Ingresos (' + simbolo + ')',
      data: grupos.map(function (g) {
        return g.ingresos;
      }),
      borderColor: '#16a34a',
      backgroundColor: '#16a34a',
      tension: 0.25,
      fill: false
    });
  }

  if (mostrarGastos) {
    datasets.push({
      label: 'Gastos (' + simbolo + ')',
      data: grupos.map(function (g) {
        return g.gastos;
      }),
      borderColor: '#ef4444',
      backgroundColor: '#ef4444',
      tension: 0.25,
      fill: false
    });
  }

  if (mostrarBalance) {
    datasets.push({
      label: 'Balance (' + simbolo + ')',
      data: grupos.map(function (g) {
        return g.ingresos - g.gastos;
      }),
      borderColor: '#2563eb',
      backgroundColor: '#2563eb',
      tension: 0.25,
      fill: false
    });
  }

  if (!labels.length || !datasets.length) {
    if (chartTimeline) {
      chartTimeline.destroy();
      chartTimeline = null;
    }
    return;
  }

  if (chartTimeline) {
    chartTimeline.data.labels = labels;
    chartTimeline.data.datasets = datasets;
    chartTimeline.update();
    return;
  }

  chartTimeline = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

//#endregion MÓDULO: Timeline

