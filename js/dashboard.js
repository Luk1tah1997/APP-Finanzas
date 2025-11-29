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
    simbolo + ' ' + Math.round(promedio).toLocaleString('es-AR');

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
  
  // Renderizar insights comparativos
  renderizarInsightsMesActual();
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

function formatoYYYYMMDD(dateObj) {
  if (!(dateObj instanceof Date)) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
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

// Helper: formatear monto con símbolo y separador de miles
function formatearMontoResumen(monto) {
  var simbolo = obtenerSimboloMoneda();
  var montoRedondeado = Math.round(monto);
  return simbolo + ' ' + montoRedondeado.toLocaleString('es-AR');
}

// Helper: calcular rango del mes anterior dado el rango del mes actual
function calcularRangoMesAnteriorDesde(rangoMesActual) {
  if (!rangoMesActual || !rangoMesActual.desde) return null;
  var fechaActualDesde = parseFechaYYYYMMDD(rangoMesActual.desde);
  if (!fechaActualDesde) return null;
  
  var anio = fechaActualDesde.getFullYear();
  var mes = fechaActualDesde.getMonth(); // 0-11
  
  var mesAnterior = mes - 1;
  var anioAnterior = anio;
  if (mesAnterior < 0) {
    mesAnterior = 11;
    anioAnterior -= 1;
  }
  
  var primerDiaMesAnterior = new Date(anioAnterior, mesAnterior, 1);
  var ultimoDiaMesAnterior = new Date(anioAnterior, mesAnterior + 1, 0);
  
  return {
    desde: formatoYYYYMMDD(primerDiaMesAnterior),
    hasta: formatoYYYYMMDD(ultimoDiaMesAnterior)
  };
}

// Renderizar insights comparativos (mes actual vs mes anterior)
function renderizarInsightsMesActual() {
  if (!dashboardInsightIngresosEl || !dashboardInsightGastosEl || 
      !dashboardInsightMaxIngresoEl || !dashboardInsightMaxGastoEl) {
    return;
  }
  
  // Obtener rango del mes actual
  var rangoActual = obtenerRangoMesActual();
  if (!rangoActual || !rangoActual.desde || !rangoActual.hasta) {
    dashboardInsightIngresosEl.textContent = 'No hay datos del mes actual.';
    dashboardInsightGastosEl.textContent = '';
    dashboardInsightMaxIngresoEl.textContent = '';
    dashboardInsightMaxGastoEl.textContent = '';
    return;
  }
  
  // Filtrar movimientos del mes actual
  var movMesActual = (movimientos || []).filter(function (m) {
    return m.fecha >= rangoActual.desde && m.fecha <= rangoActual.hasta;
  });
  
  // Calcular rango mes anterior
  var rangoAnterior = calcularRangoMesAnteriorDesde(rangoActual);
  var movMesAnterior = [];
  if (rangoAnterior) {
    movMesAnterior = (movimientos || []).filter(function (m) {
      return m.fecha >= rangoAnterior.desde && m.fecha <= rangoAnterior.hasta;
    });
  }
  
  // Sumar ingresos y gastos de ambos meses
  var ingresosActual = 0;
  var gastosActual = 0;
  movMesActual.forEach(function (m) {
    if (m.tipo === 'INGRESO') ingresosActual += m.monto;
    else if (m.tipo === 'GASTO') gastosActual += m.monto;
  });
  
  var ingresosAnterior = 0;
  var gastosAnterior = 0;
  movMesAnterior.forEach(function (m) {
    if (m.tipo === 'INGRESO') ingresosAnterior += m.monto;
    else if (m.tipo === 'GASTO') gastosAnterior += m.monto;
  });
  
  // Construir texto de variación para ingresos
  var textoIngresos = 'Este mes tus ingresos: ';
  if (movMesAnterior.length === 0) {
    textoIngresos += formatearMontoResumen(ingresosActual) + ' (sin datos del mes anterior)';
  } else {
    var difIngresos = ingresosActual - ingresosAnterior;
    var porcIngresos = ingresosAnterior !== 0 
      ? ((difIngresos / ingresosAnterior) * 100).toFixed(1) 
      : 0;
    if (difIngresos > 0) {
      textoIngresos += 'subieron ' + formatearMontoResumen(Math.abs(difIngresos)) 
                     + ' (+' + porcIngresos + '%)';
    } else if (difIngresos < 0) {
      textoIngresos += 'bajaron ' + formatearMontoResumen(Math.abs(difIngresos)) 
                     + ' (' + porcIngresos + '%)';
    } else {
      textoIngresos += 'se mantuvieron igual (0%)';
    }
  }
  dashboardInsightIngresosEl.textContent = textoIngresos;
  
  // Construir texto de variación para gastos
  var textoGastos = 'Este mes tus gastos: ';
  if (movMesAnterior.length === 0) {
    textoGastos += formatearMontoResumen(gastosActual) + ' (sin datos del mes anterior)';
  } else {
    var difGastos = gastosActual - gastosAnterior;
    var porcGastos = gastosAnterior !== 0 
      ? ((difGastos / gastosAnterior) * 100).toFixed(1) 
      : 0;
    if (difGastos > 0) {
      textoGastos += 'subieron ' + formatearMontoResumen(Math.abs(difGastos)) 
                   + ' (+' + porcGastos + '%)';
    } else if (difGastos < 0) {
      textoGastos += 'bajaron ' + formatearMontoResumen(Math.abs(difGastos)) 
                   + ' (' + porcGastos + '%)';
    } else {
      textoGastos += 'se mantuvieron igual (0%)';
    }
  }
  dashboardInsightGastosEl.textContent = textoGastos;
  
  // Mayor ingreso del mes actual
  var mayoresIngresos = movMesActual.filter(function (m) { return m.tipo === 'INGRESO'; });
  if (mayoresIngresos.length > 0) {
    mayoresIngresos.sort(function (a, b) { return b.monto - a.monto; });
    var maxIngreso = mayoresIngresos[0];
    dashboardInsightMaxIngresoEl.textContent = 
      'Este mes tu ingreso más grande fue: ' + formatearMontoResumen(maxIngreso.monto) 
      + ' (' + maxIngreso.categoria + ')';
  } else {
    dashboardInsightMaxIngresoEl.textContent = 'Este mes tu ingreso más grande fue: sin ingresos';
  }
  
  // Mayor gasto del mes actual
  var mayoresGastos = movMesActual.filter(function (m) { return m.tipo === 'GASTO'; });
  if (mayoresGastos.length > 0) {
    mayoresGastos.sort(function (a, b) { return b.monto - a.monto; });
    var maxGasto = mayoresGastos[0];
    dashboardInsightMaxGastoEl.textContent = 
      'Este mes tu gasto más grande fue: ' + formatearMontoResumen(maxGasto.monto) 
      + ' (' + maxGasto.categoria + ')';
  } else {
    dashboardInsightMaxGastoEl.textContent = 'Este mes tu gasto más grande fue: sin gastos';
  }
}

// Calcula estadísticas sobre una lista de movimientos y un rango opcional
function calcularEstadisticasSobreLista(lista, rangoOpcional) {
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

  // Días en período para promedio
  let diasPeriodo = 0;
  if (rangoOpcional && rangoOpcional.desde && rangoOpcional.hasta) {
    diasPeriodo = diasEntreIncluyendo(rangoOpcional.desde, rangoOpcional.hasta);
  } else if (typeof filtros === 'object' && filtros && filtros.fechaDesde && filtros.fechaHasta) {
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

function calcularEstadisticasDashboard() {
  const lista = obtenerMovimientosFiltrados ? obtenerMovimientosFiltrados() : [];
  return calcularEstadisticasSobreLista(lista, null);
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

