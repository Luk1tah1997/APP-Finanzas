// filtros.js - Filtros y visibilidad de secciones
'use strict';

//#region MÓDULO: Filtros
//////////////////////////////////////////////////////////////////////
// MÓDULO: Filtros
//////////////////////////////////////////////////////////////////////

function inicializarEstadoFiltros() {
  filtros = {
    periodo: 'mes-actual',
    fechaDesde: null,
    fechaHasta: null,
    tipo: 'TODOS',
    categoria: 'TODAS',
    montoMin: null,
    montoMax: null
  };

  const rangoMes = obtenerRangoMesActual();
  filtros.fechaDesde = rangoMes.desde;
  filtros.fechaHasta = rangoMes.hasta;

  if (selectFiltroPeriodo) selectFiltroPeriodo.value = 'mes-actual';
  if (inputFiltroFechaDesde) inputFiltroFechaDesde.value = filtros.fechaDesde;
  if (inputFiltroFechaHasta) inputFiltroFechaHasta.value = filtros.fechaHasta;
  if (selectFiltroTipo) selectFiltroTipo.value = 'TODOS';
  if (inputFiltroMontoMin) inputFiltroMontoMin.value = '';
  if (inputFiltroMontoMax) inputFiltroMontoMax.value = '';
}

function manejarCambioFiltroPeriodo() {
  if (!selectFiltroPeriodo) return;
  const periodo = selectFiltroPeriodo.value || 'mes-actual';
  aplicarPeriodoEnFechas(periodo);
  aplicarFiltros();
}

function aplicarPeriodoEnFechas(periodo) {
  let rango = null;

  if (periodo === 'hoy') rango = obtenerRangoHoy();
  else if (periodo === 'ultimos-7') rango = obtenerRangoUltimos7Dias();
  else if (periodo === 'mes-actual') rango = obtenerRangoMesActual();
  else if (periodo === 'ultimos-30') rango = obtenerRangoUltimos30Dias();
  else if (periodo === 'ultimos-6-meses') rango = obtenerRangoUltimos6Meses();
  else if (periodo === 'semana-actual') rango = obtenerRangoSemanaActual();
  else if (periodo === 'anio-actual') rango = obtenerRangoAnioActual();
  else if (periodo === 'todo') rango = null;

  filtros.periodo = periodo;

  if (rango) {
    filtros.fechaDesde = rango.desde;
    filtros.fechaHasta = rango.hasta;
    if (inputFiltroFechaDesde) inputFiltroFechaDesde.value = filtros.fechaDesde;
    if (inputFiltroFechaHasta) inputFiltroFechaHasta.value = filtros.fechaHasta;
  } else {
    filtros.fechaDesde = null;
    filtros.fechaHasta = null;
    if (inputFiltroFechaDesde) inputFiltroFechaDesde.value = '';
    if (inputFiltroFechaHasta) inputFiltroFechaHasta.value = '';
  }
}

function obtenerFiltrosDesdeUI() {
  const periodo = selectFiltroPeriodo
    ? selectFiltroPeriodo.value || 'mes-actual'
    : 'mes-actual';

  const fechaDesde =
    inputFiltroFechaDesde && inputFiltroFechaDesde.value
      ? inputFiltroFechaDesde.value
      : null;

  const fechaHasta =
    inputFiltroFechaHasta && inputFiltroFechaHasta.value
      ? inputFiltroFechaHasta.value
      : null;

  const tipo = selectFiltroTipo ? selectFiltroTipo.value || 'TODOS' : 'TODOS';

  const categoria = selectFiltroCategoria
    ? selectFiltroCategoria.value || 'TODAS'
    : 'TODAS';

  const formaPago = selectFiltroFormaPago
    ? selectFiltroFormaPago.value || 'TODAS'
    : 'TODAS';

  const montoMinStr = inputFiltroMontoMin ? inputFiltroMontoMin.value : '';
  const montoMaxStr = inputFiltroMontoMax ? inputFiltroMontoMax.value : '';

  const montoMin = montoMinStr ? parseFloat(montoMinStr) : null;
  const montoMax = montoMaxStr ? parseFloat(montoMaxStr) : null;

  return {
    periodo: periodo,
    fechaDesde: fechaDesde,
    fechaHasta: fechaHasta,
    tipo: tipo,
    categoria: categoria,
    montoMin: !Number.isNaN(montoMin) ? montoMin : null,
    montoMax: !Number.isNaN(montoMax) ? montoMax : null
    ,
    formaPago: formaPago
  };
}

function aplicarFiltros() {
  filtros = obtenerFiltrosDesdeUI();
  renderizarMovimientos();
  actualizarResumen();
  if (typeof renderizarDashboard === 'function') {
    renderizarDashboard();
  }
}

function limpiarFiltros() {
  inicializarEstadoFiltros();
  renderizarOpcionesFiltroCategoria();

  if (window.M && M.FormSelect) {
    var selects = [
      selectFiltroPeriodo,
      selectFiltroTipo,
      selectFiltroCategoria,
      selectFiltroFormaPago
    ].filter(Boolean);
    if (selects.length) {
      initMaterializeSelect(selects);
    }
  }

  renderizarMovimientos();
  actualizarResumen();
}

function obtenerMovimientosFiltrados() {
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return [];
  }

  const f = filtros || {};

  const filtrados = movimientos.filter(function (mov) {
    if (f.fechaDesde && mov.fecha < f.fechaDesde) return false;
    if (f.fechaHasta && mov.fecha > f.fechaHasta) return false;
    if (f.tipo && f.tipo !== 'TODOS' && mov.tipo !== f.tipo) return false;
    if (f.categoria && f.categoria !== 'TODAS' && mov.categoria !== f.categoria)
      return false;
    if (f.formaPago && f.formaPago !== 'TODAS' && mov.formaPago !== f.formaPago)
      return false;
    if (typeof f.montoMin === 'number' && mov.monto < f.montoMin) return false;
    if (typeof f.montoMax === 'number' && mov.monto > f.montoMax) return false;
    return true;
  });

  // Ordenar por fecha (más reciente primero)
  filtrados.sort(function (a, b) {
    if (a.fecha > b.fecha) return -1;
    if (a.fecha < b.fecha) return 1;
    return 0;
  });

  return filtrados;
}

// ====================
//   Visibilidad de secciones
// ====================

function setFiltrosVisible(visible) {
  const section = document.getElementById('section-filtros');
  if (!section) return;
  if (visible) section.classList.remove('hide');
  else section.classList.add('hide');
}

function setTablaVisible(visible) {
  const sectionTabla = document.getElementById('section-tabla');
  if (!sectionTabla) return;
  if (visible) sectionTabla.classList.remove('hide');
  else sectionTabla.classList.add('hide');
}

function setDashboardVisible(visible) {
  const section = document.getElementById('section-dashboard');
  if (!section) return;
  if (visible) section.classList.remove('hide');
  else section.classList.add('hide');
}

function setCalendarioVisible(visible) {
  const section = document.getElementById('section-calendario');
  if (!section) return;
  if (visible) section.classList.remove('hide');
  else section.classList.add('hide');
}

function setTimelineVisible(visible) {
  const section = document.getElementById('section-timeline');
  if (!section) return;
  if (visible) section.classList.remove('hide');
  else section.classList.add('hide');
}

function setCategoriasVisible(visible) {
  if (!sectionCategorias) return;
  if (visible) sectionCategorias.classList.remove('hide');
  else sectionCategorias.classList.add('hide');
}

function setHerramientasVisible(visible) {
  const section = sectionHerramientas || document.getElementById('section-herramientas');
  if (!section) return;
  // FIX navegacion herramientas: garantizar que siempre se quite/añada la clase 'hide' sin condiciones extra
  if (visible) {
    section.classList.remove('hide');
  } else {
    section.classList.add('hide');
  }
}

function seleccionarHerramienta(nombre) {
  // FIX navegacion herramientas: fallback seguro si el nombre es inválido, siempre mostrar al menos 'presupuesto'
  const items = [
    { el: itemHerramientaPresupuesto, panel: panelHerramientaPresupuesto, key: 'presupuesto' },
    { el: itemHerramientaGrupal, panel: panelHerramientaGrupal, key: 'grupal' },
    { el: itemHerramientaDivisas, panel: panelHerramientaDivisas, key: 'divisas' },
    { el: itemHerramientaInteres, panel: panelHerramientaInteres, key: 'interes' },
    { el: itemHerramientaObjetivo, panel: panelHerramientaObjetivo, key: 'objetivo' }
  ];

  items.forEach(function (it) {
    if (it.el) it.el.classList.remove('activa');
    if (it.panel) it.panel.style.display = 'none';
  });

  let target = items.find(function (it) { return it.key === nombre; });
  if (!target) {
    // nombre inválido -> usar presupuesto
    target = items.find(function (it) { return it.key === 'presupuesto'; });
    nombre = 'presupuesto';
  }
  if (target) {
    if (target.el) target.el.classList.add('activa');
    if (target.panel) target.panel.style.display = '';
  }

  // Guardar preferencia de herramienta seleccionada
  if (config) {
    config.herramientaPreferida = nombre;
    guardarConfigEnStorage(config);
  }
}

function cerrarSidenav() {
  if (sidenavInstance && typeof sidenavInstance.close === 'function') {
    sidenavInstance.close();
  }
}

// ====================
//   Rangos de fecha
// ====================

function obtenerRangoMesActual() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const desde = new Date(year, month, 1);
  const hasta = new Date(year, month + 1, 0);

  return {
    desde: convertirFechaADateString(desde),
    hasta: convertirFechaADateString(hasta)
  };
}

function obtenerRangoSemanaActual() {
  const hoy = new Date();
  const day = hoy.getDay();
  const diffDesde = day === 0 ? -6 : 1 - day;
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() + diffDesde);

  const hasta = new Date(desde);
  hasta.setDate(desde.getDate() + 6);

  return {
    desde: convertirFechaADateString(desde),
    hasta: convertirFechaADateString(hasta)
  };
}

function obtenerRangoAnioActual() {
  const hoy = new Date();
  const year = hoy.getFullYear();

  const desde = new Date(year, 0, 1);
  const hasta = new Date(year, 11, 31);

  return {
    desde: convertirFechaADateString(desde),
    hasta: convertirFechaADateString(hasta)
  };
}

function obtenerRangoUltimos30Dias() {
  const hoy = new Date();
  const hasta = new Date(hoy);
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - 29);

  return {
    desde: convertirFechaADateString(desde),
    hasta: convertirFechaADateString(hasta)
  };
}

function obtenerRangoHoy() {
  const hoy = new Date();
  return {
    desde: convertirFechaADateString(hoy),
    hasta: convertirFechaADateString(hoy)
  };
}

function obtenerRangoUltimos7Dias() {
  const hoy = new Date();
  const hasta = new Date(hoy);
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - 6);

  return {
    desde: convertirFechaADateString(desde),
    hasta: convertirFechaADateString(hasta)
  };
}

function obtenerRangoUltimos6Meses() {
  const hoy = new Date();
  const hasta = new Date(hoy);
  const desde = new Date(hoy);
  desde.setMonth(hoy.getMonth() - 6);

  return {
    desde: convertirFechaADateString(desde),
    hasta: convertirFechaADateString(hasta)
  };
}

function obtenerRangoPorCodigo(periodoCodigo) {
  if (periodoCodigo === 'hoy') return obtenerRangoHoy();
  if (periodoCodigo === 'ultimos-7') return obtenerRangoUltimos7Dias();
  if (periodoCodigo === 'mes-actual') return obtenerRangoMesActual();
  if (periodoCodigo === 'ultimos-30') return obtenerRangoUltimos30Dias();
  if (periodoCodigo === 'ultimos-6-meses') return obtenerRangoUltimos6Meses();
  if (periodoCodigo === 'semana-actual') return obtenerRangoSemanaActual();
  if (periodoCodigo === 'anio-actual') return obtenerRangoAnioActual();
  if (periodoCodigo === 'todo') return null;
  return obtenerRangoMesActual();
}

function convertirFechaADateString(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

//#endregion MÓDULO: Filtros

