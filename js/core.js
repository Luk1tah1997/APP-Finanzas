// core.js - Estado global + helpers
'use strict';

//#region MÓDULO: Estado global
//////////////////////////////////////////////////////////////////////
// MÓDULO: Estado global
//////////////////////////////////////////////////////////////////////

// Claves de localStorage
const STORAGE_KEYS = {
  MOVIMIENTOS: 'finanzas_movimientos',
  CATEGORIAS: 'finanzas_categorias',
  CONFIG: 'finanzas_config',
  CATEGORIA_ICONOS: 'finanzas_categoria_iconos',
  HISTORIAL_HERRAMIENTAS: 'finanzas_historial_herramientas'
};

// Categorías por tipo
const DEFAULT_CATEGORIAS = {
  INGRESO: ['Salario', 'Freelance', 'Reintegro', 'Otro ingreso'],
  GASTO: [
    'Alquiler',
    'Servicios',
    'Comida',
    'Transporte',
    'Ocio',
    'Salud',
    'Educación',
    'Deudas',
    'Otro gasto'
  ]
};

// Iconos por categoría (Material Icons)
const DEFAULT_ICONOS_CATEGORIAS = {
  INGRESO: {
    'Salario': 'payments',
    'Freelance': 'computer',
    'Reintegro': 'undo',
    'Otro ingreso': 'add_circle'
  },
  GASTO: {
    'Alquiler': 'home',
    'Servicios': 'bolt',
    'Comida': 'restaurant',
    'Transporte': 'directions_bus',
    'Ocio': 'stadium',
    'Salud': 'local_hospital',
    'Educación': 'school',
    'Deudas': 'receipt_long',
    'Otro gasto': 'remove_circle'
  }
};

// Config por defecto
const DEFAULT_CONFIG = {
  tema: 'claro',
  monedaSimbolo: '$',
  abrirTablaAlInicio: true,
  abrirFiltrosAlInicio: false,
  abrirDashboardAlInicio: true,
  abrirModalAlInicio: false,
  mostrarIconosCategorias: true,
  abrirCalendarioAlInicio: false,
  abrirTimelineAlInicio: false,
  abrirHerramientasAlInicio: false,
  calendarioVistaPreferida: 'mes' // 'mes' | 'semana' | 'anio'
  ,
  mostrarGraficoFormaPago: true,
  tasasDivisas: {
    USD: 1000, // 1 USD = 1000 ARS (por defecto)
    EUR: 1100  // 1 EUR = 1100 ARS (por defecto)
  }
};

// Instancias de gráficos (Chart.js)
let chartIngresosGastos = null;
let chartGastosPorCategoria = null;
let chartBalanceTiempo = null;
let chartTimeline = null;
let chartFormaPago = null;

// Estado en memoria
let movimientos = [];
let categorias = { INGRESO: [], GASTO: [] };
let config = null;
let categoriaIconos = { INGRESO: {}, GASTO: {} };

// Filtros actuales
let filtros = {
  periodo: 'mes-actual',
  fechaDesde: null,
  fechaHasta: null,
  tipo: 'TODOS',
  categoria: 'TODAS',
  formaPago: 'TODAS',
  montoMin: null,
  montoMax: null
};

// Movimiento en edición / eliminación
let movimientoEnEdicion = null;
let movimientoEnEliminacion = null;

// ID incremental
let nextId = 1;

// Calendario
let calendarCurrentDate = new Date(); // referencia de mes/año actual
let calendarSelectedDate = null;      // 'YYYY-MM-DD' seleccionada

// ====================
//   Helpers de fecha (compartidos)
// ====================

/**
 * Parsea una fecha en formato YYYY-MM-DD a objeto Date
 * @param {string} fechaStr - Fecha en formato 'YYYY-MM-DD'
 * @returns {Date|null} - Objeto Date o null si es inválido
 */
function parseFechaYYYYMMDD(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null;
  const parts = fechaStr.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  const dt = new Date(y, m, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

/**
 * Formatea una fecha YYYY-MM-DD al formato argentino DD/MM/YYYY
 * @param {string} fechaStr - Fecha en formato 'YYYY-MM-DD'
 * @returns {string} - Fecha en formato 'DD/MM/YYYY' o string vacío si es inválido
 */
function formatearFechaArgentina(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return '';
  const partes = fechaStr.split('-');
  if (partes.length !== 3) return fechaStr;
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

// ====================
//   Referencias DOM
// ====================

let formMovimiento;
let inputFecha;
let inputMonto;
let inputNota;
let movimientoErrorEl;
let montoQuickActionsContainer;
let inputCategoriaBusqueda;
let selectCategoriaMovimiento;
let selectFormaPagoMovimiento;
let tablaBody;
let totalIngresosEl;
let totalGastosEl;
let totalBalanceEl;

let fabNuevoMov;

let inputImportarBackup;
let inputImportarExcel;
let navExportarPlantillaExcel;
let navImportarExcel;

let selectFiltroPeriodo;
let inputFiltroFechaDesde;
let inputFiltroFechaHasta;
let selectFiltroTipo;
let selectFiltroCategoria;
let selectFiltroFormaPago;
let inputFiltroMontoMin;
let inputFiltroMontoMax;
let btnAplicarFiltros;
let btnLimpiarFiltros;
let btnConfirmarEliminar;

let radiosTipoMovimiento;
let modalMovimientoTitulo;

let chkConfigMostrarIconos;
let chkConfigAbrirCalendario;
let chkConfigAbrirTimeline;
let chkConfigAbrirHerramientas;
let selectConfigCalendarioVista;

// Resumen símbolos
let resumenSimboloIngresosEl;
let resumenSimboloGastosEl;
let resumenSimboloBalanceEl;

// Calendario símbolos
let calendarSimboloIngresosEl;
let calendarSimboloGastosEl;
let calendarSimboloBalanceEl;

// Dashboard DOM
let dashboardGastoPromedioDiarioEl;
let dashboardDiasConGastoEl;
let dashboardCantMovIngresosEl;
let dashboardCantMovGastosEl;
let dashboardCantMovTotalEl;

// Insights comparativos
let dashboardInsightIngresosEl;
let dashboardInsightGastosEl;
let dashboardInsightMaxIngresoEl;
let dashboardInsightMaxGastoEl;

// Modal eliminar símbolo
let modalEliminarMonedaEl;

// Config DOM
let selectConfigTema;
let inputConfigMoneda;
let chkConfigAbrirTabla;
let chkConfigAbrirFiltros;
let chkConfigAbrirDashboard;
let chkConfigAbrirModal;
let btnGuardarConfig;
let btnOpenConfigModal;
let chkConfigMostrarGraficoForma;
let inputConfigTasaUSD;
let inputConfigTasaEUR;

// Sidenav DOM
let navToggleTabla;
let navDashboard;
let navExportarBackup;
let navImportarBackup;
let navExportarCSV;
let navImprimir;
let btnSidenavToggle;
let navCalendario;
let navTimeline;
let navHerramientas;

// Categorías DOM
let sectionCategorias;
let listaCategoriasIngresoEl;
let listaCategoriasGastoEl;
let formCategoria;
let selectCategoriaTipo;
let inputCategoriaNombre;
let navCategorias;

// Calendario DOM
let calendarGridEl;
let calendarMonthLabelEl;
let calendarDayDateLabelEl;
let calendarDayTotalIngresosEl;
let calendarDayTotalGastosEl;
let calendarDayTotalBalanceEl;
let calendarMovimientosDiaEl;
let calendarMovimientosEmptyEl;
let btnCalendarPrev;
let btnCalendarNext;
let btnCalendarToday;
let selectCalendarViewMode;
let calendarWeekdaysRowEl;

// Timeline DOM
let selectTimelinePeriodo;
let chkTimelineIngresos;
let chkTimelineGastos;
let chkTimelineBalance;

// Herramientas DOM
let formHerramientaPresupuesto;
let hpMontoDisponibleElem;
let hpDiasRestantesElem;
let hpResultadoElem;
let hpBtnLimpiarElem;

let formHerramientaGrupal;
let hgMontoTotalElem;
let hgCantidadPersonasElem;
let hgPersonasContainerElem;
let hgBtnAgregarPersonaElem;
let hgPersonasListaElem;
let hgResultadoElem;
let hgBtnLimpiarElem;
let sectionHerramientas;

// Centro de herramientas
let herramientasMenuElem;
let itemHerramientaPresupuesto;
let itemHerramientaGrupal;
let itemHerramientaDivisas;
let itemHerramientaInteres;
let itemHerramientaObjetivo;
let panelHerramientaPresupuesto;
let panelHerramientaGrupal;
let panelHerramientaDivisas;
let panelHerramientaInteres;
let panelHerramientaObjetivo;

// Herramienta: Divisas
let formHerramientaDivisas;
let hdMontoElem;
let hdMonedaOrigenElem;
let hdMonedaDestinoElem;
let hdResultadoElem;
let hdBtnLimpiarElem;

// Herramienta: Interés compuesto
let formHerramientaInteres;
let hiMontoInicialElem;
let hiAporteMensualElem;
let hiTasaAnualElem;
let hiPlazoAniosElem;
let hiResultadoElem;
let hiBtnLimpiarElem;

// Herramienta: Objetivo de ahorro
let formHerramientaObjetivo;
let hoMontoObjetivoElem;
let hoMesesElem;
let hoAporteActualElem;
let hoResultadoElem;
let hoBtnLimpiarElem;

let modalResultadoPresupuesto;
let modalResultadoGrupal;
let modalHistorialHerramientas;
let btnVerHistorialHerramientas;
let btnLimpiarHistorial;

// Instancias de Materialize
let modalMovimientoInstance;
let modalEliminarInstance;
let modalConfigInstance;
let modalResultadoPresupuestoInstance;
let modalResultadoGrupalInstance;
let modalHistorialHerramientasInstance;
let modalImprimirInstance;
let sidenavInstance;

// Modal de impresión
let modalImprimirEl;
let btnConfirmarImprimir;
let radiosImpPeriodoModo;
let selectImpPeriodoRapido;
let inputImpFechaDesde;
let inputImpFechaHasta;
let impPeriodoRapidoContainer;
let impRangoPersonalizadoContainer;

//#endregion MÓDULO: Estado global

//#region MÓDULO: Helpers
//////////////////////////////////////////////////////////////////////
// MÓDULO: Helpers
//////////////////////////////////////////////////////////////////////

function mostrarMensaje(mensaje) {
  if (window.M && M.toast) {
    M.toast({ html: mensaje });
  } else {
    alert(mensaje);
  }
}

function mostrarErrorMovimiento(mensaje) {
  if (movimientoErrorEl) {
    movimientoErrorEl.textContent = mensaje || '';
  }
}

function limpiarErrorMovimiento() {
  mostrarErrorMovimiento('');
}

function guardarMovimientosEnStorage(lista) {
  try {
    localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(lista));
  } catch (e) {
    console.error('Error guardando movimientos en localStorage:', e);
  }
}

function cargarMovimientosDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS);
    if (!raw) return [];
    const lista = JSON.parse(raw);
    if (!Array.isArray(lista)) return [];
    return lista.map(function (mov) {
      return {
        id: mov.id,
        fecha: mov.fecha,
        tipo: mov.tipo,
        categoria: mov.categoria,
        monto:
          typeof mov.monto === 'number'
            ? mov.monto
            : parseFloat(mov.monto) || 0,
        nota: mov.nota || '',
        formaPago: mov.formaPago || ''
      };
    });
  } catch (e) {
    console.error('Error cargando movimientos desde localStorage:', e);
    return [];
  }
}

function guardarCategoriasEnStorage(cats) {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(cats));
  } catch (e) {
    console.error('Error guardando categorías en localStorage:', e);
  }
}

function cargarCategoriasDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIAS);
    if (!raw) {
      return {
        INGRESO: DEFAULT_CATEGORIAS.INGRESO.slice(),
        GASTO: DEFAULT_CATEGORIAS.GASTO.slice()
      };
    }
    const obj = JSON.parse(raw);
    const ingreso = Array.isArray(obj.INGRESO)
      ? obj.INGRESO
      : DEFAULT_CATEGORIAS.INGRESO.slice();
    const gasto = Array.isArray(obj.GASTO)
      ? obj.GASTO
      : DEFAULT_CATEGORIAS.GASTO.slice();
    return { INGRESO: ingreso, GASTO: gasto };
  } catch (e) {
    console.error('Error cargando categorías desde localStorage:', e);
    return {
      INGRESO: DEFAULT_CATEGORIAS.INGRESO.slice(),
      GASTO: DEFAULT_CATEGORIAS.GASTO.slice()
    };
  }
}

function clonarDefaultIconosCategorias() {
  return {
    INGRESO: { ...DEFAULT_ICONOS_CATEGORIAS.INGRESO },
    GASTO: { ...DEFAULT_ICONOS_CATEGORIAS.GASTO }
  };
}

function cargarCategoriaIconosDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIA_ICONOS);
    if (!raw) {
      return clonarDefaultIconosCategorias();
    }
    const obj = JSON.parse(raw);
    const ingreso =
      obj.INGRESO && typeof obj.INGRESO === 'object' ? obj.INGRESO : {};
    const gasto =
      obj.GASTO && typeof obj.GASTO === 'object' ? obj.GASTO : {};
    return { INGRESO: ingreso, GASTO: gasto };
  } catch (e) {
    console.error('Error cargando iconos de categorías:', e);
    return clonarDefaultIconosCategorias();
  }
}

function guardarCategoriaIconosEnStorage(iconos) {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIA_ICONOS, JSON.stringify(iconos));
  } catch (e) {
    console.error('Error guardando iconos de categorías:', e);
  }
}

function asegurarIconosParaCategoriasExistentes() {
  ['INGRESO', 'GASTO'].forEach(function (tipo) {
    if (!categoriaIconos[tipo]) {
      categoriaIconos[tipo] = {};
    }
    (categorias[tipo] || []).forEach(function (cat) {
      if (!categoriaIconos[tipo][cat]) {
        const iconDefault = DEFAULT_ICONOS_CATEGORIAS[tipo][cat];
        categoriaIconos[tipo][cat] =
          iconDefault || (tipo === 'INGRESO' ? 'trending_up' : 'trending_down');
      }
    });
  });
  guardarCategoriaIconosEnStorage(categoriaIconos);
}

//#endregion MÓDULO: Helpers

