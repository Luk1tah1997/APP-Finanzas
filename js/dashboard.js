// dashboard.js - Dashboard y gráficos principales
'use strict';

//#region MÓDULO: Dashboard + Charts
//////////////////////////////////////////////////////////////////////
// MÓDULO: Dashboard + Charts
//////////////////////////////////////////////////////////////////////

function renderizarDashboard() {
  if (
    !dashboardGastoPromedioDiarioEl ||
    !dashboardDiasConGastoEl ||
    !dashboardCantMovIngresosEl ||
    !dashboardCantMovGastosEl ||
    !dashboardCantMovTotalEl
  ) {
    return;
  }

  const stats = calcularEstadisticasDashboard();
  const simbolo = obtenerSimboloMoneda();

  const promedio = stats.gastoPromedioDiario || 0;
  dashboardGastoPromedioDiarioEl.textContent =
    simbolo + ' ' + promedio.toFixed(2);

  dashboardDiasConGastoEl.textContent = String(stats.diasConGasto);
  dashboardCantMovIngresosEl.textContent = String(stats.cantMovIngresos);
  dashboardCantMovGastosEl.textContent = String(stats.cantMovGastos);
  dashboardCantMovTotalEl.textContent = String(stats.cantMovTotal);

  actualizarChartIngresosGastos(
    stats.totalIngresos,
    stats.totalGastos,
    simbolo
  );

  const listaFiltrada = obtenerMovimientosFiltrados();
  actualizarChartBalanceTiempo(listaFiltrada, simbolo);
  actualizarChartGastosPorCategoria(listaFiltrada);
  // Actualizar gráfico de formas de pago
  actualizarChartFormaPago(listaFiltrada);
  // Asegurar visibilidad según configuración actual
  setMostrarGraficoForma(!!(config && config.mostrarGraficoFormaPago));
}

// ====================
//  Gráficos Chart.js
// ====================

// Helpers de fecha locales (evitan duplicar dependencias si no existen en core)
function parseFechaYYYYMMDD(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null;
  const parts = fechaStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dt = new Date(y, m, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function formatearEtiquetaFecha(dateObj) {
  if (!(dateObj instanceof Date)) return '';
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  return d + '/' + m;
}

function diasEntreIncluyendo(desdeStr, hastaStr) {
  const d = parseFechaYYYYMMDD(desdeStr);
  const h = parseFechaYYYYMMDD(hastaStr);
  if (!d || !h) return 0;
  const ms = h.getTime() - d.getTime();
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  return dias > 0 ? dias : 0;
}

function calcularEstadisticasDashboard() {
  const lista = obtenerMovimientosFiltrados ? obtenerMovimientosFiltrados() : [];

  let totalIngresos = 0;
  let totalGastos = 0;
  let cantMovIngresos = 0;
  let cantMovGastos = 0;
  const diasConGastoSet = new Set();

  (lista || []).forEach(function (mov) {
    if (mov.tipo === 'INGRESO') {
      totalIngresos += mov.monto;
      cantMovIngresos += 1;
    } else if (mov.tipo === 'GASTO') {
      totalGastos += mov.monto;
      cantMovGastos += 1;
      if (mov.fecha) diasConGastoSet.add(mov.fecha);
    }
  });

  // Días en período para promedio: si hay fechaDesde/hasta usar el rango, sino días distintos presentes
  let diasPeriodo = 0;
  if (typeof filtros === 'object' && filtros && filtros.fechaDesde && filtros.fechaHasta) {
    diasPeriodo = diasEntreIncluyendo(filtros.fechaDesde, filtros.fechaHasta);
  }
  if (!diasPeriodo) {
    const diasPresentes = new Set((lista || []).map(function (m) { return m.fecha; }).filter(Boolean));
    diasPeriodo = diasPresentes.size || 1;
  }

  const gastoPromedioDiario = diasPeriodo > 0 ? totalGastos / diasPeriodo : 0;

  return {
    totalIngresos: totalIngresos,
    totalGastos: totalGastos,
    cantMovIngresos: cantMovIngresos,
    cantMovGastos: cantMovGastos,
    cantMovTotal: cantMovIngresos + cantMovGastos,
    diasConGasto: diasConGastoSet.size,
    gastoPromedioDiario: gastoPromedioDiario
  };
}

function construirSerieBalancePorFecha(listaMovimientos) {
  const mapaPorFecha = {};
  (listaMovimientos || []).forEach(function (mov) {
    if (!mov || !mov.fecha) return;
    if (!mapaPorFecha[mov.fecha]) {
      mapaPorFecha[mov.fecha] = { ingresos: 0, gastos: 0 };
    }
    if (mov.tipo === 'INGRESO') mapaPorFecha[mov.fecha].ingresos += mov.monto;
    else if (mov.tipo === 'GASTO') mapaPorFecha[mov.fecha].gastos += mov.monto;
  });

  const fechasOrdenadas = Object.keys(mapaPorFecha).sort();
  let acumulado = 0;
  const labels = [];
  const valores = [];

  fechasOrdenadas.forEach(function (fStr) {
    const f = parseFechaYYYYMMDD(fStr);
    const neto = (mapaPorFecha[fStr].ingresos || 0) - (mapaPorFecha[fStr].gastos || 0);
    acumulado += neto;
    labels.push(f ? formatearEtiquetaFecha(f) : fStr);
    valores.push(acumulado);
  });

  return { labels: labels, valores: valores };
}

function actualizarChartIngresosGastos(totalIngresos, totalGastos, simbolo) {
  const canvas = document.getElementById('chart-bar-ingresos-gastos');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = ['Ingresos', 'Gastos'];
  const dataValores = [totalIngresos, totalGastos];

  const dataset = {
    label: 'Monto (' + simbolo + ')',
    data: dataValores,
    backgroundColor: ['#26a69a', '#ef5350']
  };

  if (chartIngresosGastos) {
    chartIngresosGastos.data.labels = labels;
    chartIngresosGastos.data.datasets[0] = dataset;
    chartIngresosGastos.update();
    return;
  }

  chartIngresosGastos = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [dataset]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

function actualizarChartGastosPorCategoria(listaMovimientos) {
  const canvas = document.getElementById('chart-pie-gastos-categoria');
  if (!canvas || typeof Chart === 'undefined') return;

  const totalesPorCategoria = {};

  listaMovimientos.forEach(function (mov) {
    if (mov.tipo !== 'GASTO') return;
    const cat = mov.categoria || 'Sin categoría';
    if (!totalesPorCategoria[cat]) {
      totalesPorCategoria[cat] = 0;
    }
    totalesPorCategoria[cat] += mov.monto;
  });

  const labels = Object.keys(totalesPorCategoria);
  const dataValores = labels.map(function (label) {
    return totalesPorCategoria[label];
  });

  if (!labels.length) {
    if (chartGastosPorCategoria) {
      chartGastosPorCategoria.destroy();
      chartGastosPorCategoria = null;
    }
    return;
  }

  const coloresBase = [
    '#ef5350',
    '#ab47bc',
    '#5c6bc0',
    '#29b6f6',
    '#26a69a',
    '#9ccc65',
    '#ffee58',
    '#ffa726',
    '#8d6e63'
  ];

  const backgroundColors = labels.map(function (_, index) {
    return coloresBase[index % coloresBase.length];
  });

  const dataset = { data: dataValores, backgroundColor: backgroundColors };

  if (chartGastosPorCategoria) {
    chartGastosPorCategoria.data.labels = labels;
    chartGastosPorCategoria.data.datasets[0] = dataset;
    chartGastosPorCategoria.update();
    return;
  }

  chartGastosPorCategoria = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels: labels, datasets: [dataset] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function actualizarChartFormaPago(listaMovimientos) {
  const canvas = document.getElementById('chart-forma-pago');
  if (!canvas || typeof Chart === 'undefined') return;

  const totalesIngreso = {};
  const totalesGasto = {};

  (listaMovimientos || []).forEach(function (mov) {
    const forma = mov.formaPago || 'Sin forma';
    if (mov.tipo === 'INGRESO') {
      totalesIngreso[forma] = (totalesIngreso[forma] || 0) + mov.monto;
    } else if (mov.tipo === 'GASTO') {
      totalesGasto[forma] = (totalesGasto[forma] || 0) + mov.monto;
    }
  });

  const labels = Array.from(
    new Set([].concat(Object.keys(totalesIngreso), Object.keys(totalesGasto)))
  ).filter(Boolean);

  if (!labels.length) {
    if (chartFormaPago) {
      chartFormaPago.destroy();
      chartFormaPago = null;
    }
    return;
  }

  const dataIngreso = labels.map(function (l) {
    return totalesIngreso[l] || 0;
  });
  const dataGasto = labels.map(function (l) {
    return totalesGasto[l] || 0;
  });

  const datasetIngreso = {
    label: 'Ingresos (' + obtenerSimboloMoneda() + ')',
    data: dataIngreso,
    backgroundColor: '#16a34a'
  };

  const datasetGasto = {
    label: 'Gastos (' + obtenerSimboloMoneda() + ')',
    data: dataGasto,
    backgroundColor: '#ef4444'
  };

  if (chartFormaPago) {
    chartFormaPago.data.labels = labels;
    chartFormaPago.data.datasets = [datasetIngreso, datasetGasto];
    chartFormaPago.update();
    return;
  }

  chartFormaPago = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [datasetIngreso, datasetGasto]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: false },
        y: { beginAtZero: true }
      }
    }
  });
}

function setMostrarGraficoForma(visible) {
  try {
    const canvas = document.getElementById('chart-forma-pago');
    if (!canvas) return;
    const card = canvas.closest('.card');
    if (!card) return;
    card.style.display = visible ? '' : 'none';
  } catch (e) {
    console.error('Error alternando visibilidad del gráfico forma de pago:', e);
  }
}

function actualizarChartBalanceTiempo(listaMovimientos, simbolo) {
  const canvas = document.getElementById('chart-line-balance-tiempo');
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  const serie = construirSerieBalancePorFecha(listaMovimientos);

  if (!serie.labels.length) {
    if (chartBalanceTiempo) {
      chartBalanceTiempo.destroy();
      chartBalanceTiempo = null;
    }
    return;
  }

  const dataset = {
    label: 'Balance (' + simbolo + ')',
    data: serie.valores,
    fill: false,
    borderColor: '#26a69a',
    tension: 0.25,
    pointRadius: 3,
    pointHoverRadius: 4
  };

  if (chartBalanceTiempo) {
    chartBalanceTiempo.data.labels = serie.labels;
    chartBalanceTiempo.data.datasets[0] = dataset;
    chartBalanceTiempo.update();
    return;
  }

  chartBalanceTiempo = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: serie.labels,
      datasets: [dataset]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

//#endregion MÓDULO: Dashboard + Charts

