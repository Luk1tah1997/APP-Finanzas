// app.js
// SPA finanzas personales - V2.5 (pseudo-módulos internos para claridad)

'use strict';

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
  mostrarGraficoFormaPago: true
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

// Sidenav DOM
let navToggleFiltros;
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

// Navegación subsecciones herramientas
let navHerramientasPresupuesto;
let navHerramientasGrupal;

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
let sidenavInstance;

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

//////////////////////////////////////////////////////////////////////
// MÓDULO: Config
//////////////////////////////////////////////////////////////////////

function guardarConfigEnStorage(cfg) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error guardando config en localStorage:', e);
  }
}

function cargarConfigDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return { ...DEFAULT_CONFIG };

    const cfg = JSON.parse(raw);
    const calendarioVista =
      cfg.calendarioVistaPreferida === 'semana' ||
      cfg.calendarioVistaPreferida === 'anio'
        ? cfg.calendarioVistaPreferida
        : 'mes';

    return {
      tema: cfg.tema === 'oscuro' ? 'oscuro' : 'claro',
      monedaSimbolo:
        typeof cfg.monedaSimbolo === 'string' && cfg.monedaSimbolo.trim()
          ? cfg.monedaSimbolo.trim()
          : DEFAULT_CONFIG.monedaSimbolo,
      abrirTablaAlInicio:
        typeof cfg.abrirTablaAlInicio === 'boolean'
          ? cfg.abrirTablaAlInicio
          : DEFAULT_CONFIG.abrirTablaAlInicio,
      abrirFiltrosAlInicio:
        typeof cfg.abrirFiltrosAlInicio === 'boolean'
          ? cfg.abrirFiltrosAlInicio
          : DEFAULT_CONFIG.abrirFiltrosAlInicio,
      abrirDashboardAlInicio:
        typeof cfg.abrirDashboardAlInicio === 'boolean'
          ? cfg.abrirDashboardAlInicio
          : DEFAULT_CONFIG.abrirDashboardAlInicio,
      abrirModalAlInicio:
        typeof cfg.abrirModalAlInicio === 'boolean'
          ? cfg.abrirModalAlInicio
          : DEFAULT_CONFIG.abrirModalAlInicio,
      mostrarIconosCategorias:
        typeof cfg.mostrarIconosCategorias === 'boolean'
          ? cfg.mostrarIconosCategorias
          : DEFAULT_CONFIG.mostrarIconosCategorias,
      abrirCalendarioAlInicio:
        typeof cfg.abrirCalendarioAlInicio === 'boolean'
          ? cfg.abrirCalendarioAlInicio
          : DEFAULT_CONFIG.abrirCalendarioAlInicio,
      abrirTimelineAlInicio:
        typeof cfg.abrirTimelineAlInicio === 'boolean'
          ? cfg.abrirTimelineAlInicio
          : DEFAULT_CONFIG.abrirTimelineAlInicio,
      abrirHerramientasAlInicio:
        typeof cfg.abrirHerramientasAlInicio === 'boolean'
          ? cfg.abrirHerramientasAlInicio
          : DEFAULT_CONFIG.abrirHerramientasAlInicio,
      calendarioVistaPreferida: calendarioVista,
      mostrarGraficoFormaPago:
        typeof cfg.mostrarGraficoFormaPago === 'boolean'
          ? cfg.mostrarGraficoFormaPago
          : DEFAULT_CONFIG.mostrarGraficoFormaPago
    };
  } catch (e) {
    console.error('Error cargando config desde localStorage:', e);
    return { ...DEFAULT_CONFIG };
  }
}

// Refresca un <select> de Materialize cuando cambiamos su valor por JS
function refrescarSelectMaterialize(selectElem) {
  if (!window.M || !M.FormSelect || !selectElem) return;

  const instance = M.FormSelect.getInstance(selectElem);
  if (instance) {
    instance.destroy();
  }
  M.FormSelect.init(selectElem);
}

// ====================
//   Config / tema / moneda
// ====================

function aplicarConfigTema() {
  if (!config) return;
  if (config.tema === 'oscuro') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

function obtenerSimboloMoneda() {
  if (
    config &&
    typeof config.monedaSimbolo === 'string' &&
    config.monedaSimbolo.trim()
  ) {
    return config.monedaSimbolo.trim();
  }
  return DEFAULT_CONFIG.monedaSimbolo;
}

function aplicarConfigMoneda() {
  const simbolo = obtenerSimboloMoneda();
  if (resumenSimboloIngresosEl) resumenSimboloIngresosEl.textContent = simbolo;
  if (resumenSimboloGastosEl) resumenSimboloGastosEl.textContent = simbolo;
  if (resumenSimboloBalanceEl) resumenSimboloBalanceEl.textContent = simbolo;
  if (modalEliminarMonedaEl) modalEliminarMonedaEl.textContent = simbolo;

  if (calendarSimboloIngresosEl) calendarSimboloIngresosEl.textContent = simbolo;
  if (calendarSimboloGastosEl) calendarSimboloGastosEl.textContent = simbolo;
  if (calendarSimboloBalanceEl) calendarSimboloBalanceEl.textContent = simbolo;
}

function poblarConfigEnUI() {
  if (!config) return;

  // Tema
  if (selectConfigTema) {
    selectConfigTema.value = config.tema === 'oscuro' ? 'oscuro' : 'claro';
    refrescarSelectMaterialize(selectConfigTema);
  }

  // Moneda
  if (inputConfigMoneda) {
    const simboloActual =
      config.monedaSimbolo || DEFAULT_CONFIG.monedaSimbolo;

    let valorAUsar = simboloActual;
    const opciones = Array.prototype.slice.call(
      inputConfigMoneda.options || []
    );
    const existe = opciones.some(function (opt) {
      return opt.value === simboloActual;
    });
    if (!existe) {
      valorAUsar = DEFAULT_CONFIG.monedaSimbolo;
    }

    inputConfigMoneda.value = valorAUsar;
    refrescarSelectMaterialize(inputConfigMoneda);
  }

  // Calendario vista preferida
  if (selectConfigCalendarioVista) {
    const vista =
      config.calendarioVistaPreferida || DEFAULT_CONFIG.calendarioVistaPreferida;
    selectConfigCalendarioVista.value = vista;
    refrescarSelectMaterialize(selectConfigCalendarioVista);
  }

  // Checkboxes
  if (chkConfigAbrirTabla) {
    chkConfigAbrirTabla.checked = !!config.abrirTablaAlInicio;
  }
  if (chkConfigAbrirFiltros) {
    chkConfigAbrirFiltros.checked = !!config.abrirFiltrosAlInicio;
  }
  if (chkConfigAbrirDashboard) {
    chkConfigAbrirDashboard.checked =
      typeof config.abrirDashboardAlInicio === 'boolean'
        ? config.abrirDashboardAlInicio
        : true;
  }
  if (chkConfigAbrirModal) {
    chkConfigAbrirModal.checked = !!config.abrirModalAlInicio;
  }
  if (chkConfigMostrarGraficoForma) {
    chkConfigMostrarGraficoForma.checked =
      typeof config.mostrarGraficoFormaPago === 'boolean'
        ? config.mostrarGraficoFormaPago
        : true;
  }
  if (chkConfigMostrarIconos) {
    chkConfigMostrarIconos.checked =
      typeof config.mostrarIconosCategorias === 'boolean'
        ? config.mostrarIconosCategorias
        : true;
  }
  if (chkConfigAbrirCalendario) {
    chkConfigAbrirCalendario.checked = !!config.abrirCalendarioAlInicio;
  }
  if (chkConfigAbrirTimeline) {
    chkConfigAbrirTimeline.checked = !!config.abrirTimelineAlInicio;
  }
  if (chkConfigAbrirHerramientas) {
    chkConfigAbrirHerramientas.checked = !!config.abrirHerramientasAlInicio;
  }
}

function guardarConfigDesdeUI() {
  const nuevoTema =
    selectConfigTema && selectConfigTema.value === 'oscuro'
      ? 'oscuro'
      : 'claro';

  const simboloRaw = inputConfigMoneda ? inputConfigMoneda.value.trim() : '';
  const nuevoSimbolo = simboloRaw || DEFAULT_CONFIG.monedaSimbolo;
  const abrirTabla = chkConfigAbrirTabla ? chkConfigAbrirTabla.checked : false;
  const abrirFiltros = chkConfigAbrirFiltros
    ? chkConfigAbrirFiltros.checked
    : false;
  const abrirDashboard = chkConfigAbrirDashboard
    ? chkConfigAbrirDashboard.checked
    : true;
  const abrirModal = chkConfigAbrirModal ? chkConfigAbrirModal.checked : false;
  const mostrarIconos = chkConfigMostrarIconos
    ? chkConfigMostrarIconos.checked
    : true;

  const mostrarGraficoForma = chkConfigMostrarGraficoForma
    ? chkConfigMostrarGraficoForma.checked
    : true;

  const abrirCalendario = chkConfigAbrirCalendario
    ? chkConfigAbrirCalendario.checked
    : false;
  const abrirTimeline = chkConfigAbrirTimeline
    ? chkConfigAbrirTimeline.checked
    : false;
  const abrirHerramientas = chkConfigAbrirHerramientas
    ? chkConfigAbrirHerramientas.checked
    : false;

  const calendarioVista = selectConfigCalendarioVista
    ? selectConfigCalendarioVista.value || 'mes'
    : 'mes';

  config = {
    tema: nuevoTema,
    monedaSimbolo: nuevoSimbolo,
    abrirTablaAlInicio: abrirTabla,
    abrirFiltrosAlInicio: abrirFiltros,
    abrirDashboardAlInicio: abrirDashboard,
    abrirModalAlInicio: abrirModal,
    mostrarIconosCategorias: mostrarIconos,
    mostrarGraficoFormaPago: mostrarGraficoForma,
    abrirCalendarioAlInicio: abrirCalendario,
    abrirTimelineAlInicio: abrirTimeline,
    abrirHerramientasAlInicio: abrirHerramientas,
    calendarioVistaPreferida: calendarioVista
  };

  guardarConfigEnStorage(config);
  aplicarConfigTema();
  aplicarConfigMoneda();
  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();
  renderizarMovimientos();
  actualizarResumen();
  renderizarCalendario();

  // Actualizar selects de vista calendario
  if (selectCalendarViewMode) {
    selectCalendarViewMode.value = calendarioVista;
    refrescarSelectMaterialize(selectCalendarViewMode);
  }

  setFiltrosVisible(config.abrirFiltrosAlInicio);
  setTablaVisible(config.abrirTablaAlInicio);
  setDashboardVisible(config.abrirDashboardAlInicio);
  // Mostrar/ocultar gráfico de forma de pago según la configuración
  setMostrarGraficoForma(!!config.mostrarGraficoFormaPago);
  setCalendarioVisible(config.abrirCalendarioAlInicio);
  setTimelineVisible(config.abrirTimelineAlInicio);
  setHerramientasVisible(!!config.abrirHerramientasAlInicio);

  if (modalConfigInstance) {
    modalConfigInstance.close();
  }

  mostrarMensaje('Configuración guardada.');
}

// ====================
//   Helpers / modelo
// ====================

function crearItemCategoria(tipo, nombre) {
  const li = document.createElement('li');
  li.className = 'collection-item category-item';
  li.dataset.tipo = tipo;
  li.dataset.nombre = nombre;

  const badge = crearBadgeCategoria(tipo, nombre);
  li.appendChild(badge);

  const acciones = document.createElement('div');
  acciones.className = 'secondary-content';

  const btnEditar = document.createElement('a');
  btnEditar.href = '#!';
  btnEditar.className =
    'btn-flat btn-small waves-effect btn-renombrar-categoria';
  btnEditar.innerHTML = '<i class="material-icons">edit</i>';
  acciones.appendChild(btnEditar);

  const btnEliminar = document.createElement('a');
  btnEliminar.href = '#!';
  btnEliminar.className =
    'btn-flat btn-small waves-effect btn-eliminar-categoria';
  btnEliminar.innerHTML = '<i class="material-icons">delete</i>';
  acciones.appendChild(btnEliminar);

  li.appendChild(acciones);

  return li;
}

function calcularSiguienteId() {
  if (movimientos.length === 0) {
    nextId = 1;
    return;
  }
  const maxId = movimientos.reduce(function (max, mov) {
    return mov.id > max ? mov.id : max;
  }, 0);
  nextId = maxId + 1;
}

function obtenerFechaHoyYYYYMMDD() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

// Obtiene el ícono para una categoría dada, o null si no hay categoría
function obtenerIconoCategoria(tipo, categoria) {
  if (!categoria) return null;
  const mapaTipo = categoriaIconos[tipo] || {};
  if (mapaTipo[categoria]) return mapaTipo[categoria];

  const defTipo = DEFAULT_ICONOS_CATEGORIAS[tipo] || {};
  if (defTipo[categoria]) return defTipo[categoria];

  return tipo === 'INGRESO' ? 'trending_up' : 'trending_down';
}

function crearBadgeCategoria(tipo, categoria) {
  const span = document.createElement('span');
  span.className = 'category-badge';

  const iconName = obtenerIconoCategoria(tipo, categoria);
  if (iconName) {
    const i = document.createElement('i');
    i.className = 'material-icons';
    i.textContent = iconName;
    span.appendChild(i);
  }

  const text = document.createElement('span');
  text.textContent = categoria || '-';
  span.appendChild(text);

  return span;
}

function obtenerTipoCategoriaPorNombre(nombre) {
  if (!nombre) return null;
  if ((categorias.INGRESO || []).includes(nombre)) return 'INGRESO';
  if ((categorias.GASTO || []).includes(nombre)) return 'GASTO';
  return null;
}

//////////////////////////////////////////////////////////////////////
// MÓDULO: Init + Eventos
//////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', function () {
  cacheDomElements();

  movimientos = cargarMovimientosDesdeStorage();
  categorias = cargarCategoriasDesdeStorage();
  config = cargarConfigDesdeStorage();
  categoriaIconos = cargarCategoriaIconosDesdeStorage();
  asegurarIconosParaCategoriasExistentes();

  aplicarConfigTema();
  aplicarConfigMoneda();
  renderizarCategoriasManager();

  calcularSiguienteId();
  inicializarEstadoFiltros();

  // Vista de calendario preferida en el select
  if (selectCalendarViewMode && config) {
    selectCalendarViewMode.value =
      config.calendarioVistaPreferida || DEFAULT_CONFIG.calendarioVistaPreferida;
  }

  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();

  renderizarMovimientos();
  actualizarResumen();
  refrescarTimelineDesdeFiltros();

  inicializarMaterialize();
  configurarEventos();

  // Visibilidad inicial según config
  setFiltrosVisible(config.abrirFiltrosAlInicio);
  setTablaVisible(config.abrirTablaAlInicio);
  setDashboardVisible(
    typeof config.abrirDashboardAlInicio === 'boolean'
      ? config.abrirDashboardAlInicio
      : true
  );
  setCalendarioVisible(
    typeof config.abrirCalendarioAlInicio === 'boolean'
      ? config.abrirCalendarioAlInicio
      : false
  );
  setTimelineVisible(
    typeof config.abrirTimelineAlInicio === 'boolean'
      ? config.abrirTimelineAlInicio
      : false
  );
  setHerramientasVisible(
    typeof config.abrirHerramientasAlInicio === 'boolean'
      ? config.abrirHerramientasAlInicio
      : false
  );

  // Herramienta por defecto al abrir Herramientas
  const preferida = (config && config.herramientaPreferida) ? config.herramientaPreferida : 'presupuesto';
  seleccionarHerramienta(preferida);

  if (config.abrirModalAlInicio) {
    abrirModalNuevoMovimiento();
  }
});

// ====================
//   Cacheo DOM
// ====================

function cacheDomElements() {
  formMovimiento = document.getElementById('form-movimiento');
  inputFecha = document.getElementById('fecha');
  inputMonto = document.getElementById('monto');
  inputNota = document.getElementById('nota');
  movimientoErrorEl = document.getElementById('movimiento-error');
  montoQuickActionsContainer = document.getElementById('monto-quick-actions');
  inputCategoriaBusqueda = document.getElementById('categoria-busqueda');
  selectCategoriaMovimiento = document.getElementById('categoria');
  selectFormaPagoMovimiento = document.getElementById('forma-pago');
  tablaBody = document.getElementById('tabla-movimientos-body');
  totalIngresosEl = document.getElementById('total-ingresos');
  totalGastosEl = document.getElementById('total-gastos');
  totalBalanceEl = document.getElementById('total-balance');

  dashboardGastoPromedioDiarioEl =
    document.getElementById('dashboard-gasto-promedio-diario');
  dashboardDiasConGastoEl =
    document.getElementById('dashboard-dias-con-gasto');
  dashboardCantMovIngresosEl =
    document.getElementById('dashboard-cant-mov-ingresos');
  dashboardCantMovGastosEl =
    document.getElementById('dashboard-cant-mov-gastos');
  dashboardCantMovTotalEl =
    document.getElementById('dashboard-cant-mov-total');

  fabNuevoMov = document.getElementById('btn-fab-nuevo-mov');

  inputImportarBackup = document.getElementById('input-importar-backup');

  selectFiltroPeriodo = document.getElementById('filtro-periodo');
  inputFiltroFechaDesde = document.getElementById('filtro-fecha-desde');
  inputFiltroFechaHasta = document.getElementById('filtro-fecha-hasta');
  selectFiltroTipo = document.getElementById('filtro-tipo');
  selectFiltroCategoria = document.getElementById('filtro-categoria');
  selectFiltroFormaPago = document.getElementById('filtro-forma-pago');
  inputFiltroMontoMin = document.getElementById('filtro-monto-min');
  inputFiltroMontoMax = document.getElementById('filtro-monto-max');
  btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
  btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

  btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

  radiosTipoMovimiento = formMovimiento
    ? formMovimiento.querySelectorAll('input[name="tipo"]')
    : [];

  modalMovimientoTitulo = document.getElementById('modal-movimiento-titulo');

  resumenSimboloIngresosEl =
    document.getElementById('resumen-simbolo-ingresos');
  resumenSimboloGastosEl = document.getElementById('resumen-simbolo-gastos');
  resumenSimboloBalanceEl =
    document.getElementById('resumen-simbolo-balance');

  modalEliminarMonedaEl = document.getElementById('modal-eliminar-moneda');

  selectConfigTema = document.getElementById('config-tema');
  inputConfigMoneda = document.getElementById('config-moneda');
  chkConfigAbrirTabla = document.getElementById('config-abrir-tabla');
  chkConfigAbrirFiltros = document.getElementById('config-abrir-filtros');
  chkConfigAbrirDashboard = document.getElementById('config-abrir-dashboard');
  chkConfigAbrirModal = document.getElementById('config-abrir-modal');
  chkConfigMostrarGraficoForma = document.getElementById('config-mostrar-grafico-forma');
  chkConfigMostrarIconos = document.getElementById('config-mostrar-iconos');
  chkConfigAbrirCalendario = document.getElementById('config-abrir-calendario');
  chkConfigAbrirTimeline = document.getElementById('config-abrir-timeline');
  chkConfigAbrirHerramientas = document.getElementById('config-abrir-herramientas');
  selectConfigCalendarioVista =
    document.getElementById('config-calendario-vista');

  btnGuardarConfig = document.getElementById('btn-guardar-config');
  btnOpenConfigModal = document.getElementById('btn-open-config-modal');

  // Menú lateral
  navToggleFiltros = document.getElementById('nav-toggle-filtros');
  navToggleTabla = document.getElementById('nav-toggle-tabla');
  navDashboard = document.getElementById('nav-dashboard');
  navExportarBackup = document.getElementById('nav-exportar-backup');
  navImportarBackup = document.getElementById('nav-importar-backup');
  navExportarCSV = document.getElementById('nav-exportar-csv');
  navImprimir = document.getElementById('nav-imprimir');
  btnSidenavToggle = document.getElementById('btn-sidenav-toggle');
  navCalendario = document.getElementById('nav-calendario');
  navTimeline = document.getElementById('nav-timeline');
  navHerramientas = document.getElementById('nav-herramientas');

  // Categorías
  sectionCategorias = document.getElementById('section-categorias');
  listaCategoriasIngresoEl = document.getElementById('lista-categorias-ingreso');
  listaCategoriasGastoEl = document.getElementById('lista-categorias-gasto');
  formCategoria = document.getElementById('form-categoria');
  selectCategoriaTipo = document.getElementById('categoria-tipo');
  inputCategoriaNombre = document.getElementById('categoria-nombre');
  navCategorias = document.getElementById('nav-categorias');

  // Navegación subsecciones herramientas
  navHerramientasPresupuesto = document.getElementById('nav-herramientas-presupuesto');
  navHerramientasGrupal = document.getElementById('nav-herramientas-grupal');

  // Calendario
  calendarGridEl = document.getElementById('calendar-grid');
  calendarMonthLabelEl = document.getElementById('calendar-current-month-label');
  calendarDayDateLabelEl = document.getElementById('calendar-day-date-label');
  calendarDayTotalIngresosEl = document.getElementById('calendar-day-total-ingresos');
  calendarDayTotalGastosEl = document.getElementById('calendar-day-total-gastos');
  calendarDayTotalBalanceEl = document.getElementById('calendar-day-total-balance');
  calendarMovimientosDiaEl = document.getElementById('calendar-movimientos-dia');
  calendarMovimientosEmptyEl = document.getElementById('calendar-movimientos-empty');
  btnCalendarPrev = document.getElementById('btn-calendar-prev');
  btnCalendarNext = document.getElementById('btn-calendar-next');
  btnCalendarToday = document.getElementById('btn-calendar-today');
  selectCalendarViewMode = document.getElementById('calendar-view-mode');
  calendarWeekdaysRowEl = document.querySelector('.calendar-weekdays');

  // Timeline
  selectTimelinePeriodo = document.getElementById('timeline-periodo');
  chkTimelineIngresos = document.getElementById('timeline-toggle-ingresos');
  chkTimelineGastos = document.getElementById('timeline-toggle-gastos');
  chkTimelineBalance = document.getElementById('timeline-toggle-balance');

  // Herramientas
  formHerramientaPresupuesto = document.getElementById('form-herramienta-presupuesto');
  hpMontoDisponibleElem = document.getElementById('hp-monto-disponible');
  hpDiasRestantesElem = document.getElementById('hp-dias-restantes');
  hpResultadoElem = document.getElementById('hp-resultado');
  hpBtnLimpiarElem = document.getElementById('hp-btn-limpiar');

  formHerramientaGrupal = document.getElementById('form-herramienta-grupal');
  hgMontoTotalElem = document.getElementById('hg-monto-total');
  hgCantidadPersonasElem = document.getElementById('hg-cantidad-personas');
  hgPersonasContainerElem = document.getElementById('hg-personas-container');
  hgBtnAgregarPersonaElem = document.getElementById('hg-btn-agregar-persona');
  hgPersonasListaElem = document.getElementById('hg-personas-lista');
  hgResultadoElem = document.getElementById('hg-resultado');
  hgBtnLimpiarElem = document.getElementById('hg-btn-limpiar');
  sectionHerramientas = document.getElementById('section-herramientas');

  // Centro de herramientas (menú y paneles)
  herramientasMenuElem = document.getElementById('herramientas-menu-lista');
  itemHerramientaPresupuesto = document.getElementById('herramienta-item-presupuesto');
  itemHerramientaGrupal = document.getElementById('herramienta-item-grupal');
  itemHerramientaDivisas = document.getElementById('herramienta-item-divisas');
  itemHerramientaInteres = document.getElementById('herramienta-item-interes');
  itemHerramientaObjetivo = document.getElementById('herramienta-item-objetivo');
  panelHerramientaPresupuesto = document.getElementById('herramienta-panel-presupuesto');
  panelHerramientaGrupal = document.getElementById('herramienta-panel-grupal');
  panelHerramientaDivisas = document.getElementById('herramienta-panel-divisas');
  panelHerramientaInteres = document.getElementById('herramienta-panel-interes');
  panelHerramientaObjetivo = document.getElementById('herramienta-panel-objetivo');

  // Divisas
  formHerramientaDivisas = document.getElementById('form-herramienta-divisas');
  hdMontoElem = document.getElementById('hd-monto');
  hdMonedaOrigenElem = document.getElementById('hd-moneda-origen');
  hdMonedaDestinoElem = document.getElementById('hd-moneda-destino');
  hdResultadoElem = document.getElementById('hd-resultado');
  hdBtnLimpiarElem = document.getElementById('hd-btn-limpiar');

  // Interés
  formHerramientaInteres = document.getElementById('form-herramienta-interes');
  hiMontoInicialElem = document.getElementById('hi-monto-inicial');
  hiAporteMensualElem = document.getElementById('hi-aporte-mensual');
  hiTasaAnualElem = document.getElementById('hi-tasa-anual');
  hiPlazoAniosElem = document.getElementById('hi-plazo-anios');
  hiResultadoElem = document.getElementById('hi-resultado');
  hiBtnLimpiarElem = document.getElementById('hi-btn-limpiar');

  // Objetivo
  formHerramientaObjetivo = document.getElementById('form-herramienta-objetivo');
  hoMontoObjetivoElem = document.getElementById('ho-monto-objetivo');
  hoMesesElem = document.getElementById('ho-meses');
  hoAporteActualElem = document.getElementById('ho-aporte-actual');
  hoResultadoElem = document.getElementById('ho-resultado');
  hoBtnLimpiarElem = document.getElementById('ho-btn-limpiar');

  modalResultadoPresupuesto = document.getElementById('modal-resultado-presupuesto');
  modalResultadoGrupal = document.getElementById('modal-resultado-grupal');
  modalHistorialHerramientas = document.getElementById('modal-historial-herramientas');
  btnVerHistorialHerramientas = document.getElementById('btn-ver-historial-herramientas');
  btnLimpiarHistorial = document.getElementById('btn-limpiar-historial');

  // Calendario símbolos
  calendarSimboloIngresosEl =
    document.querySelector('.calendar-day-simbolo-ingresos');
  calendarSimboloGastosEl =
    document.querySelector('.calendar-day-simbolo-gastos');
  calendarSimboloBalanceEl =
    document.querySelector('.calendar-day-simbolo-balance');
}

// ====================
//   Eventos
// ====================

function configurarEventos() {
  if (formMovimiento) {
    formMovimiento.addEventListener('submit', manejarSubmitMovimiento);
  }

  // Limpiar errores al editar campos del modal
  if (inputFecha) inputFecha.addEventListener('input', limpiarErrorMovimiento);
  if (inputMonto) inputMonto.addEventListener('input', limpiarErrorMovimiento);
  if (inputNota) inputNota.addEventListener('input', limpiarErrorMovimiento);

  if (selectCategoriaMovimiento) {
    selectCategoriaMovimiento.addEventListener('change', function () {
      limpiarErrorMovimiento();
      manejarCambioCategoriaEnModal();
    });
  }
  if (radiosTipoMovimiento && radiosTipoMovimiento.length) {
    radiosTipoMovimiento.forEach(function (radio) {
      radio.addEventListener('change', function () {
        limpiarErrorMovimiento();
        renderizarCategoriasSelect(null);
      });
    });
  }

  // Botones de monto rápido
  if (montoQuickActionsContainer && inputMonto) {
    montoQuickActionsContainer.addEventListener('click', function (event) {
      const btn = event.target.closest('.btn-monto-rapido');
      if (!btn) return;
      event.preventDefault();
      limpiarErrorMovimiento();

      const action = btn.dataset.action;
      if (action === 'add') {
        const value = parseFloat(btn.dataset.value || '0');
        if (Number.isNaN(value)) return;
        const actual = parseFloat(inputMonto.value || '0') || 0;
        const nuevo = actual + value;
        inputMonto.value = nuevo.toFixed(2).replace(/\.00$/, '');
        if (window.M && M.updateTextFields) M.updateTextFields();
      } else if (action === 'copiar-ultimo') {
        copiarUltimoMontoPorCategoria();
      }
    });
  }

  // Búsqueda de categoría
  if (inputCategoriaBusqueda) {
    inputCategoriaBusqueda.addEventListener('input', function () {
      const seleccionActual = selectCategoriaMovimiento
        ? selectCategoriaMovimiento.value
        : null;
      renderizarCategoriasSelect(seleccionActual);
    });
  }

  if (btnSidenavToggle) {
    btnSidenavToggle.addEventListener(
      'click',
      function (e) {
        if (!sidenavInstance) return;

        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') {
          e.stopImmediatePropagation();
        }

        if (sidenavInstance.isOpen) {
          sidenavInstance.close();
        } else {
          sidenavInstance.open();
        }
      },
      true
    );
  }

  if (navCategorias) {
    navCategorias.addEventListener('click', function (e) {
      e.preventDefault();
      setCategoriasVisible(true);
      const section = document.getElementById('section-categorias');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  // Navegación subsecciones herramientas
  if (navHerramientasPresupuesto) {
    navHerramientasPresupuesto.addEventListener('click', function (e) {
      e.preventDefault();
      setHerramientasVisible(true);
      const card = document.getElementById('herramienta-presupuesto');
      if (card && card.scrollIntoView) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navHerramientasGrupal) {
    navHerramientasGrupal.addEventListener('click', function (e) {
      e.preventDefault();
      setHerramientasVisible(true);
      const card = document.getElementById('herramienta-grupal');
      if (card && card.scrollIntoView) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navCalendario) {
    navCalendario.addEventListener('click', function (e) {
      e.preventDefault();
      setCalendarioVisible(true);
      const section = document.getElementById('section-calendario');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navTimeline) {
    navTimeline.addEventListener('click', function (e) {
      e.preventDefault();
      setTimelineVisible(true);
      const section = document.getElementById('section-timeline');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navHerramientas) {
    navHerramientas.addEventListener('click', function (e) {
      const isCollapsibleHeader = navHerramientas.classList.contains('collapsible-header');
      setHerramientasVisible(true);
      const section = sectionHerramientas || document.getElementById('section-herramientas');
      if (isCollapsibleHeader) {
        // Dejar que el collapsible maneje la apertura; sólo hacemos scroll a la sección
        setTimeout(function () {
          if (section && section.scrollIntoView) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
      } else {
        e.preventDefault();
        if (section && section.scrollIntoView) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        cerrarSidenav();
      }
    });
  }

  // Navegación del calendario (mes anterior / siguiente / hoy)
  if (btnCalendarPrev) {
    btnCalendarPrev.addEventListener('click', function () {
      const d =
        calendarCurrentDate instanceof Date
          ? new Date(calendarCurrentDate)
          : new Date();
      d.setMonth(d.getMonth() - 1);
      calendarCurrentDate = d;
      renderizarCalendario();
    });
  }

  if (btnCalendarNext) {
    btnCalendarNext.addEventListener('click', function () {
      const d =
        calendarCurrentDate instanceof Date
          ? new Date(calendarCurrentDate)
          : new Date();
      d.setMonth(d.getMonth() + 1);
      calendarCurrentDate = d;
      renderizarCalendario();
    });
  }

  if (btnCalendarToday) {
    btnCalendarToday.addEventListener('click', function () {
      const hoy = new Date();
      calendarCurrentDate = hoy;
      calendarSelectedDate = obtenerFechaHoyYYYYMMDD();
      renderizarCalendario();
    });
  }

  if (selectCalendarViewMode) {
    selectCalendarViewMode.addEventListener('change', function () {
      const vista = selectCalendarViewMode.value || 'mes';
      if (config) {
        config.calendarioVistaPreferida = vista;
        guardarConfigEnStorage(config);
      }
      renderizarCalendario();
    });
  }

  if (formCategoria) {
    formCategoria.addEventListener('submit', manejarSubmitCategoria);
  }

  if (listaCategoriasIngresoEl) {
    listaCategoriasIngresoEl.addEventListener(
      'click',
      manejarClickListaCategorias
    );
  }
  if (listaCategoriasGastoEl) {
    listaCategoriasGastoEl.addEventListener(
      'click',
      manejarClickListaCategorias
    );
  }

  if (tablaBody) {
    tablaBody.addEventListener('click', function (event) {
      const btnEditar = event.target.closest('.btn-editar');
      const btnEliminar = event.target.closest('.btn-eliminar');

      if (btnEditar) {
        const idEditar = parseInt(btnEditar.dataset.id, 10);
        if (!Number.isNaN(idEditar)) {
          iniciarEdicionMovimiento(idEditar);
        }
        return;
      }

      if (btnEliminar) {
        const idEliminar = parseInt(btnEliminar.dataset.id, 10);
        if (!Number.isNaN(idEliminar)) {
          prepararEliminacionMovimiento(idEliminar);
        }
      }
    });
  }

  if (fabNuevoMov) {
    fabNuevoMov.addEventListener('click', abrirModalNuevoMovimiento);
  }

  if (inputImportarBackup) {
    inputImportarBackup.addEventListener('change', manejarImportarBackup);
  }

  if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener('click', aplicarFiltros);
  }
  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
  }

  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);
  }

  // Navegación sidenav
  if (navToggleFiltros) {
    navToggleFiltros.addEventListener('click', function (e) {
      e.preventDefault();
      setFiltrosVisible(true);
      const section = document.getElementById('section-filtros');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navToggleTabla) {
    navToggleTabla.addEventListener('click', function (e) {
      e.preventDefault();
      setTablaVisible(true);
      const section = document.getElementById('section-tabla');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navDashboard) {
    navDashboard.addEventListener('click', function (e) {
      e.preventDefault();
      setDashboardVisible(true);
      const section = document.getElementById('section-dashboard');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
    });
  }

  if (navExportarBackup) {
    navExportarBackup.addEventListener('click', function () {
      exportarBackupJSON();
      cerrarSidenav();
    });
  }
  if (navImportarBackup) {
    navImportarBackup.addEventListener('click', function () {
      if (inputImportarBackup) {
        inputImportarBackup.value = '';
        inputImportarBackup.click();
      }
      cerrarSidenav();
    });
  }
  if (navExportarCSV) {
    navExportarCSV.addEventListener('click', function () {
      exportarCSV();
      cerrarSidenav();
    });
  }
  if (navImprimir) {
    navImprimir.addEventListener('click', function () {
      window.print();
      cerrarSidenav();
    });
  }

  if (btnOpenConfigModal) {
    btnOpenConfigModal.addEventListener('click', function () {
      poblarConfigEnUI();
      if (modalConfigInstance) {
        modalConfigInstance.open();
      }
      cerrarSidenav();
    });
  }

  if (btnGuardarConfig) {
    btnGuardarConfig.addEventListener('click', guardarConfigDesdeUI);
  }

  if (selectFiltroPeriodo) {
    selectFiltroPeriodo.addEventListener('change', manejarCambioFiltroPeriodo);
  }

  // Controles del timeline
  if (selectTimelinePeriodo) {
    selectTimelinePeriodo.addEventListener(
      'change',
      refrescarTimelineDesdeFiltros
    );
  }
  if (chkTimelineIngresos) {
    chkTimelineIngresos.addEventListener(
      'change',
      refrescarTimelineDesdeFiltros
    );
  }
  if (chkTimelineGastos) {
    chkTimelineGastos.addEventListener(
      'change',
      refrescarTimelineDesdeFiltros
    );
  }
  if (chkTimelineBalance) {
    chkTimelineBalance.addEventListener(
      'change',
      refrescarTimelineDesdeFiltros
    );
  }

  if (formHerramientaPresupuesto) {
    formHerramientaPresupuesto.addEventListener(
      'submit',
      manejarSubmitHerramientaPresupuesto
    );
  }
  if (hpBtnLimpiarElem) {
    hpBtnLimpiarElem.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarHerramientaPresupuesto();
    });
  }

  if (formHerramientaGrupal) {
    formHerramientaGrupal.addEventListener(
      'submit',
      manejarSubmitHerramientaGrupal
    );
  }
  if (hgBtnLimpiarElem) {
    hgBtnLimpiarElem.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarHerramientaGrupal();
    });
  }

  // Evento para agregar persona en gastos grupales
  if (hgBtnAgregarPersonaElem) {
    hgBtnAgregarPersonaElem.addEventListener('click', agregarPersonaAGastosGrupales);
  }

  // Evento para sincronizar cantidad de personas con las filas
  if (hgCantidadPersonasElem) {
    hgCantidadPersonasElem.addEventListener('input', sincronizarFilasPersonasConCantidad);
  }

  // Centro de herramientas: selección
  function bindHerramientaItem(el, nombre) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      seleccionarHerramienta(nombre);
    });
  }
  bindHerramientaItem(itemHerramientaPresupuesto, 'presupuesto');
  bindHerramientaItem(itemHerramientaGrupal, 'grupal');
  bindHerramientaItem(itemHerramientaDivisas, 'divisas');
  bindHerramientaItem(itemHerramientaInteres, 'interes');
  bindHerramientaItem(itemHerramientaObjetivo, 'objetivo');

  // Divisas
  if (formHerramientaDivisas) {
    formHerramientaDivisas.addEventListener('submit', manejarSubmitHerramientaDivisas);
  }
  if (hdBtnLimpiarElem) {
    hdBtnLimpiarElem.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarHerramientaDivisas();
    });
  }

  // Interés compuesto
  if (formHerramientaInteres) {
    formHerramientaInteres.addEventListener('submit', manejarSubmitHerramientaInteres);
  }
  if (hiBtnLimpiarElem) {
    hiBtnLimpiarElem.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarHerramientaInteres();
    });
  }

  // Objetivo de ahorro
  if (formHerramientaObjetivo) {
    formHerramientaObjetivo.addEventListener('submit', manejarSubmitHerramientaObjetivo);
  }
  if (hoBtnLimpiarElem) {
    hoBtnLimpiarElem.addEventListener('click', function (e) {
      e.preventDefault();
      limpiarHerramientaObjetivo();
    });
  }
}

function inicializarMaterialize() {
  try {
    if (window.M && M.Modal) {
      const modalElems = document.querySelectorAll('.modal');
      if (modalElems && modalElems.length) {
        const modalInstances = M.Modal.init(modalElems);
        if (Array.isArray(modalInstances)) {
          modalInstances.forEach(function (instance) {
            const elem = instance && instance.el;
            if (elem && elem.id === 'modal-movimiento') {
              modalMovimientoInstance = instance;
            } else if (elem && elem.id === 'modal-eliminar') {
              modalEliminarInstance = instance;
            } else if (elem && elem.id === 'modal-config') {
              modalConfigInstance = instance;
            } else if (elem && elem.id === 'modal-resultado-presupuesto') {
              modalResultadoPresupuestoInstance = instance;
            } else if (elem && elem.id === 'modal-resultado-grupal') {
              modalResultadoGrupalInstance = instance;
            } else if (elem && elem.id === 'modal-historial-herramientas') {
              modalHistorialHerramientasInstance = instance;
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Error inicializando modales Materialize:', err);
  }

  try {
    if (window.M && M.Sidenav) {
      const sidenavElems = document.querySelectorAll('.sidenav');
      if (sidenavElems && sidenavElems.length) {
        const sidenavInstances = M.Sidenav.init(sidenavElems);
        if (Array.isArray(sidenavInstances) && sidenavInstances.length > 0) {
          sidenavInstance = sidenavInstances[0];
        } else if (sidenavInstances) {
          sidenavInstance = sidenavInstances;
        }
      }
    }
  } catch (err) {
    console.error('Error inicializando sidenav Materialize:', err);
  }

  try {
    if (window.M && M.FloatingActionButton) {
      const fabElems = document.querySelectorAll('.fixed-action-btn');
      if (fabElems && fabElems.length) M.FloatingActionButton.init(fabElems);
    }
  } catch (err) {
    console.error('Error inicializando FAB Materialize:', err);
  }

  try {
    if (window.M && M.FormSelect) {
      const selects = document.querySelectorAll('select');
      if (selects && selects.length) M.FormSelect.init(selects);
    }
  } catch (err) {
    console.error('Error inicializando selects Materialize:', err);
  }

  try {
    if (window.M && M.Collapsible) {
      const collapsibles = document.querySelectorAll('.collapsible');
      if (collapsibles && collapsibles.length) M.Collapsible.init(collapsibles);
    }
  } catch (err) {
    console.error('Error inicializando collapsibles Materialize:', err);
  }

  try {
    if (window.M && M.updateTextFields) {
      M.updateTextFields();
    }
  } catch (err) {
    console.error('Error llamando M.updateTextFields():', err);
  }
}

//////////////////////////////////////////////////////////////////////
// MÓDULO: Categorías
//////////////////////////////////////////////////////////////////////

function renderizarCategoriasManager() {
  if (!listaCategoriasIngresoEl || !listaCategoriasGastoEl) return;

  listaCategoriasIngresoEl.innerHTML = '';
  listaCategoriasGastoEl.innerHTML = '';

  (categorias.INGRESO || []).forEach(function (cat) {
    const li = crearItemCategoria('INGRESO', cat);
    listaCategoriasIngresoEl.appendChild(li);
  });

  (categorias.GASTO || []).forEach(function (cat) {
    const li = crearItemCategoria('GASTO', cat);
    listaCategoriasGastoEl.appendChild(li);
  });
}

function manejarSubmitCategoria(event) {
  event.preventDefault();
  if (!selectCategoriaTipo || !inputCategoriaNombre) return;

  const tipo = selectCategoriaTipo.value === 'GASTO' ? 'GASTO' : 'INGRESO';
  const nombreRaw = inputCategoriaNombre.value.trim();
  if (!nombreRaw) {
    mostrarMensaje('El nombre de la categoría es obligatorio.');
    return;
  }

  const nombre = nombreRaw;

  if ((categorias[tipo] || []).includes(nombre)) {
    mostrarMensaje(
      'Esa categoría ya existe en ' +
        (tipo === 'INGRESO' ? 'Ingresos' : 'Gastos') +
        '.'
    );
    return;
  }

  categorias[tipo].push(nombre);
  asegurarIconosParaCategoriasExistentes();
  guardarCategoriasEnStorage(categorias);
  guardarCategoriaIconosEnStorage(categoriaIconos);

  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();
  renderizarCalendario();

  inputCategoriaNombre.value = '';
  if (window.M && M.updateTextFields) M.updateTextFields();

  mostrarMensaje('Categoría agregada.');
}

function manejarClickListaCategorias(event) {
  const btnRenombrar = event.target.closest('.btn-renombrar-categoria');
  const btnEliminar = event.target.closest('.btn-eliminar-categoria');
  const item = event.target.closest('.category-item');
  if (!item) return;

  const tipo = item.dataset.tipo === 'GASTO' ? 'GASTO' : 'INGRESO';
  const nombre = item.dataset.nombre;

  if (btnRenombrar) {
    renombrarCategoria(tipo, nombre);
    return;
  }
  if (btnEliminar) {
    eliminarCategoria(tipo, nombre);
    return;
  }
}

function renombrarCategoria(tipo, nombreActual) {
  const nuevoNombre = window.prompt(
    'Nuevo nombre para la categoría:',
    nombreActual
  );
  if (!nuevoNombre) return;

  const nombreTrim = nuevoNombre.trim();
  if (!nombreTrim) return;

  if ((categorias[tipo] || []).includes(nombreTrim)) {
    if (nombreTrim !== nombreActual) {
      mostrarMensaje('Ya existe una categoría con ese nombre.');
    }
    return;
  }

  categorias[tipo] = (categorias[tipo] || []).map(function (c) {
    return c === nombreActual ? nombreTrim : c;
  });

  // Movimientos que usan esta categoría
  movimientos = movimientos.map(function (mov) {
    if (mov.categoria === nombreActual) {
      return { ...mov, categoria: nombreTrim };
    }
    return mov;
  });

  // Icono
  const iconoActual =
    categoriaIconos[tipo] && categoriaIconos[tipo][nombreActual];
  if (!categoriaIconos[tipo]) categoriaIconos[tipo] = {};
  if (iconoActual) {
    categoriaIconos[tipo][nombreTrim] = iconoActual;
  } else {
    categoriaIconos[tipo][nombreTrim] = obtenerIconoCategoria(
      tipo,
      nombreTrim
    );
  }
  delete categoriaIconos[tipo][nombreActual];

  guardarCategoriasEnStorage(categorias);
  guardarMovimientosEnStorage(movimientos);
  guardarCategoriaIconosEnStorage(categoriaIconos);

  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();
  renderizarMovimientos();
  actualizarResumen();
  renderizarCalendario();

  mostrarMensaje('Categoría renombrada.');
}

function eliminarCategoria(tipo, nombre) {
  const enUso = movimientos.filter(function (mov) {
    return mov.categoria === nombre && mov.tipo === tipo;
  });

  if (enUso.length > 0) {
    const confirma = window.confirm(
      'La categoría "' +
        nombre +
        '" se usa en ' +
        enUso.length +
        ' movimiento(s). Si la eliminas, no podrás filtrar por ella.\n\n¿Deseas continuar?'
    );
    if (!confirma) return;
  }

  categorias[tipo] = (categorias[tipo] || []).filter(function (c) {
    return c !== nombre;
  });

  if (categoriaIconos[tipo]) {
    delete categoriaIconos[tipo][nombre];
  }

  guardarCategoriasEnStorage(categorias);
  guardarCategoriaIconosEnStorage(categoriaIconos);

  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();
  renderizarCalendario();

  mostrarMensaje('Categoría eliminada.');
}

// ====================
//   Render principal tabla / selects
// ====================

function renderizarCategoriasSelect(valorSeleccionadoExplicito) {
  if (!selectCategoriaMovimiento) return;

  selectCategoriaMovimiento.innerHTML = '';

  const tipoSeleccionado =
    radiosTipoMovimiento && radiosTipoMovimiento.length
      ? Array.prototype.find.call(radiosTipoMovimiento, function (radio) {
          return radio.checked;
        })?.value || 'INGRESO'
      : 'INGRESO';

  const listaBase = categorias[tipoSeleccionado] || [];

  const textoBusqueda = inputCategoriaBusqueda
    ? inputCategoriaBusqueda.value.trim().toLowerCase()
    : '';
  const listaFiltrada = textoBusqueda
    ? listaBase.filter(function (cat) {
        return cat.toLowerCase().includes(textoBusqueda);
      })
    : listaBase.slice();

  const seleccionActual =
    valorSeleccionadoExplicito != null
      ? valorSeleccionadoExplicito
      : selectCategoriaMovimiento.value || null;

  listaFiltrada.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    if (seleccionActual && seleccionActual === cat) {
      option.selected = true;
    }
    selectCategoriaMovimiento.appendChild(option);
  });

  if (window.M && M.FormSelect) {
    M.FormSelect.init(selectCategoriaMovimiento);
  }
}

function renderizarOpcionesFiltroCategoria() {
  if (!selectFiltroCategoria) return;

  selectFiltroCategoria.innerHTML = '';

  const optionTodas = document.createElement('option');
  optionTodas.value = 'TODAS';
  optionTodas.textContent = 'Todas';
  optionTodas.selected = true;
  selectFiltroCategoria.appendChild(optionTodas);

  const todasCategorias = Array.from(
    new Set([].concat(categorias.INGRESO, categorias.GASTO))
  )
    .filter(Boolean)
    .sort();

  todasCategorias.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    selectFiltroCategoria.appendChild(option);
  });

  if (window.M && M.FormSelect) {
    M.FormSelect.init(selectFiltroCategoria);
  }
}

function renderizarMovimientos() {
  if (!tablaBody) return;

  tablaBody.innerHTML = '';

  const lista = obtenerMovimientosFiltrados();

  if (!lista.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.textContent = 'No hay movimientos para los filtros actuales.';
    td.classList.add('center-align');
    tr.appendChild(td);
    tablaBody.appendChild(tr);
    return;
  }

  const simbolo = obtenerSimboloMoneda();

  lista.forEach(function (mov) {
    const tr = document.createElement('tr');

    const tdFecha = document.createElement('td');
    tdFecha.textContent = mov.fecha;
    tr.appendChild(tdFecha);

    const tdTipo = document.createElement('td');
    tdTipo.textContent = mov.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto';
    tr.appendChild(tdTipo);

    const tdCategoria = document.createElement('td');
    if (config && config.mostrarIconosCategorias) {
      const badge = crearBadgeCategoria(mov.tipo, mov.categoria || '-');
      tdCategoria.appendChild(badge);
    } else {
      tdCategoria.textContent = mov.categoria || '-';
    }
    tr.appendChild(tdCategoria);

      const tdForma = document.createElement('td');
      tdForma.textContent = mov.formaPago || '-';
      tr.appendChild(tdForma);

    const tdMonto = document.createElement('td');
    tdMonto.classList.add('left-align');
    tdMonto.textContent = simbolo + ' ' + mov.monto.toFixed(2);
    tr.appendChild(tdMonto);

    const tdNota = document.createElement('td');
    tdNota.textContent = mov.nota || '';
    tr.appendChild(tdNota);

    const tdAcciones = document.createElement('td');
    tdAcciones.classList.add('center-align', 'no-print', 'actions-cell');

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className =
      'btn-small waves-effect waves-light teal btn-editar';
    btnEditar.dataset.id = mov.id;
    btnEditar.textContent = 'Editar';

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className =
      'btn-small waves-effect waves-light red btn-eliminar';
    btnEliminar.dataset.id = mov.id;
    btnEliminar.textContent = 'Eliminar';

    tdAcciones.appendChild(btnEditar);
    tdAcciones.appendChild(btnEliminar);
    tr.appendChild(tdAcciones);

    tablaBody.appendChild(tr);
  });
}

function actualizarResumen() {
  if (!totalIngresosEl || !totalGastosEl || !totalBalanceEl) return;

  const lista = obtenerMovimientosFiltrados();

  let totalIngresos = 0;
  let totalGastos = 0;

  lista.forEach(function (mov) {
    if (mov.tipo === 'INGRESO') {
      totalIngresos += mov.monto;
    } else if (mov.tipo === 'GASTO') {
      totalGastos += mov.monto;
    }
  });

  const balance = totalIngresos - totalGastos;

  totalIngresosEl.textContent = totalIngresos.toFixed(2);
  totalGastosEl.textContent = totalGastos.toFixed(2);
  totalBalanceEl.textContent = balance.toFixed(2);

  renderizarDashboard();
  refrescarTimelineDesdeFiltros();
  renderizarCalendario();
}

// ====================
//  Dashboard / fechas
// ====================

// Convierte 'YYYY-MM-DD' a Date
function parseFechaYYYYMMDD(str) {
  if (!str || typeof str !== 'string') return null;
  const partes = str.split('-');
  if (partes.length !== 3) return null;
  const year = parseInt(partes[0], 10);
  const month = parseInt(partes[1], 10);
  const day = parseInt(partes[2], 10);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

// Diferencia de días (inclusive)
function diferenciaDiasInclusive(fechaDesde, fechaHasta) {
  if (!(fechaDesde instanceof Date) || !(fechaHasta instanceof Date)) {
    return 0;
  }
  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  const diffMs = fechaHasta.getTime() - fechaDesde.getTime();
  const diffDias = Math.floor(diffMs / MS_POR_DIA);
  return diffDias >= 0 ? diffDias + 1 : 0;
}

// Nombres de meses en español
const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

function formatearFechaLarga(fechaStr) {
  const d = parseFechaYYYYMMDD(fechaStr);
  if (!d) return fechaStr || '';
  const dia = d.getDate();
  const mesNombre = NOMBRES_MESES[d.getMonth()] || '';
  const anio = d.getFullYear();
  return dia + ' de ' + mesNombre + ' de ' + anio;
}

function formatearDiaMes(fecha) {
  const d = fecha.getDate();
  const m = fecha.getMonth() + 1;
  return String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0');
}

function calcularEstadisticasDashboard() {
  const lista = obtenerMovimientosFiltrados();

  const resultado = {
    totalIngresos: 0,
    totalGastos: 0,
    diasEnPeriodo: 0,
    diasConGasto: 0,
    gastoPromedioDiario: 0,
    cantMovIngresos: 0,
    cantMovGastos: 0,
    cantMovTotal: 0
  };

  if (!lista.length) {
    return resultado;
  }

  const f = filtros || {};

  let fechaMinStr = f.fechaDesde || null;
  let fechaMaxStr = f.fechaHasta || null;

  const diasConGastoSet = new Set();

  lista.forEach(function (mov) {
    if (mov.tipo === 'INGRESO') {
      resultado.totalIngresos += mov.monto;
      resultado.cantMovIngresos++;
    } else if (mov.tipo === 'GASTO') {
      resultado.totalGastos += mov.monto;
      resultado.cantMovGastos++;
      if (mov.fecha) {
        diasConGastoSet.add(mov.fecha);
      }
    }

    if (!f.fechaDesde || !f.fechaHasta) {
      if (!fechaMinStr || mov.fecha < fechaMinStr) fechaMinStr = mov.fecha;
      if (!fechaMaxStr || mov.fecha > fechaMaxStr) fechaMaxStr = mov.fecha;
    }
  });

  resultado.cantMovTotal =
    resultado.cantMovIngresos + resultado.cantMovGastos;
  resultado.diasConGasto = diasConGastoSet.size;

  const fechaDesdeDate = parseFechaYYYYMMDD(fechaMinStr);
  const fechaHastaDate = parseFechaYYYYMMDD(fechaMaxStr);

  resultado.diasEnPeriodo = diferenciaDiasInclusive(
    fechaDesdeDate,
    fechaHastaDate
  );

  if (resultado.diasEnPeriodo > 0) {
    resultado.gastoPromedioDiario =
      resultado.totalGastos / resultado.diasEnPeriodo;
  }

  return resultado;
}

function construirSerieBalancePorFecha(listaMovimientos) {
  const netoPorFecha = {};

  listaMovimientos.forEach(function (mov) {
    if (!mov.fecha) return;

    let factor = 0;
    if (mov.tipo === 'INGRESO') {
      factor = 1;
    } else if (mov.tipo === 'GASTO') {
      factor = -1;
    }

    if (!netoPorFecha[mov.fecha]) {
      netoPorFecha[mov.fecha] = 0;
    }
    netoPorFecha[mov.fecha] += mov.monto * factor;
  });

  const fechas = Object.keys(netoPorFecha).sort();

  const labels = [];
  const valores = [];
  let acumulado = 0;

  fechas.forEach(function (fecha) {
    acumulado += netoPorFecha[fecha];
    labels.push(fecha);
    valores.push(acumulado);
  });

  return {
    labels: labels,
    valores: valores
  };
}

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

//////////////////////////////////////////////////////////////////////
// MÓDULO: Herramientas
//////////////////////////////////////////////////////////////////////

// ====================
// ====================
//  Presupuesto diario
// ====================

function manejarSubmitHerramientaPresupuesto(event) {
  event.preventDefault();
  if (!hpMontoDisponibleElem || !hpDiasRestantesElem || !hpResultadoElem) return;

  const montoDisponible = parseFloat(hpMontoDisponibleElem.value || '0');
  const diasRestantes = parseInt(hpDiasRestantesElem.value || '0', 10);

  if (!montoDisponible || montoDisponible <= 0 || !diasRestantes || diasRestantes <= 0) {
    hpResultadoElem.textContent = 'Completá un monto disponible y días restantes válidos.';
    return;
  }

  const porDia = montoDisponible / diasRestantes;
  const simbolo = obtenerSimboloMoneda();

  hpResultadoElem.textContent =
    'Podés gastar ' +
    simbolo +
    ' ' +
    porDia.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) +
    ' por día.';
}

function limpiarHerramientaPresupuesto() {
  if (!hpMontoDisponibleElem || !hpDiasRestantesElem || !hpResultadoElem) return;
  hpMontoDisponibleElem.value = '';
  hpDiasRestantesElem.value = '';
  hpResultadoElem.textContent = '';
  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }
}

// ====================
//  Gastos grupales
// ====================

// Funciones auxiliares para gastos grupales
function calcularSumaAportes() {
  if (!hgPersonasListaElem) return 0;
  const filas = hgPersonasListaElem.querySelectorAll('.hg-persona-row');
  let suma = 0;
  filas.forEach(fila => {
    const aporteInput = fila.querySelector('.hg-persona-aporte');
    const aporte = parseFloat(aporteInput?.value || '0');
    suma += aporte;
  });
  return suma;
}

function validarAporteIndividual(aporteInput) {
  if (!aporteInput || !hgMontoTotalElem) return true;
  
  const montoTotal = parseFloat(hgMontoTotalElem.value || '0');
  const aporte = parseFloat(aporteInput.value || '0');
  
  // Si no hay monto total, no validar
  if (montoTotal <= 0) {
    aporteInput.classList.remove('invalid');
    return true;
  }
  
  // Validar que aporte individual no supere el total
  if (aporte > montoTotal) {
    aporteInput.classList.add('invalid');
    if (hgResultadoElem) {
      hgResultadoElem.innerHTML = '<span style="color: #ef5350;">El aporte individual no puede ser mayor al monto total.</span>';
    }
    return false;
  }
  
  aporteInput.classList.remove('invalid');
  return true;
}

function validarSumaAportes() {
  if (!hgMontoTotalElem) return true;
  
  const montoTotal = parseFloat(hgMontoTotalElem.value || '0');
  
  // Si no hay monto total, no validar
  if (montoTotal <= 0) return true;
  
  const suma = calcularSumaAportes();
  
  if (suma > montoTotal) {
    if (hgResultadoElem) {
      hgResultadoElem.innerHTML = '<span style="color: #ef5350;">La suma de aportes (' + suma.toFixed(2) + ') no puede superar el monto total (' + montoTotal.toFixed(2) + ').</span>';
    }
    return false;
  }
  
  return true;
}

function ajustarUltimaPersonaAlTotal() {
  if (!hgMontoTotalElem || !hgPersonasListaElem) return;
  
  const montoTotal = parseFloat(hgMontoTotalElem.value || '0');
  if (montoTotal <= 0) return;
  
  const filas = hgPersonasListaElem.querySelectorAll('.hg-persona-row');
  if (filas.length < 2) return;
  
  const ultimaFila = filas[filas.length - 1];
  const aporteInput = ultimaFila.querySelector('.hg-persona-aporte');
  if (!aporteInput) return;
  
  // Calcular suma de todos menos el último
  let sumaSinUltimo = 0;
  for (let i = 0; i < filas.length - 1; i++) {
    const input = filas[i].querySelector('.hg-persona-aporte');
    sumaSinUltimo += parseFloat(input?.value || '0');
  }
  
  const restante = montoTotal - sumaSinUltimo;
  if (restante >= 0) {
    aporteInput.value = restante.toFixed(2);
    if (window.M && M.updateTextFields) {
      M.updateTextFields();
    }
  }
}

function calcularTransferencias(personas, promedio) {
  // Crear listas de acreedores y deudores
  const acreedores = [];
  const deudores = [];
  
  personas.forEach(p => {
    const diferencia = p.aporte - promedio;
    if (diferencia > 0.01) {
      acreedores.push({ nombre: p.nombre, monto: diferencia });
    } else if (diferencia < -0.01) {
      deudores.push({ nombre: p.nombre, monto: Math.abs(diferencia) });
    }
  });
  
  // Algoritmo greedy para generar transferencias
  const transferencias = [];
  let i = 0, j = 0;
  
  while (i < deudores.length && j < acreedores.length) {
    const deudor = deudores[i];
    const acreedor = acreedores[j];
    
    const montoPago = Math.min(deudor.monto, acreedor.monto);
    
    transferencias.push({
      de: deudor.nombre,
      para: acreedor.nombre,
      monto: montoPago
    });
    
    deudor.monto -= montoPago;
    acreedor.monto -= montoPago;
    
    if (deudor.monto < 0.01) i++;
    if (acreedor.monto < 0.01) j++;
  }
  
  return transferencias;
}

function crearFilaPersonaGrupal(indice) {
  const div = document.createElement('div');
  div.className = 'hg-persona-row';
  div.dataset.indice = indice;
  div.innerHTML = `
    <div class="input-field">
      <input type="text" class="hg-persona-nombre" placeholder="Nombre" />
    </div>
    <div class="input-field">
      <input type="number" step="0.01" class="hg-persona-aporte" placeholder="Aporte" />
    </div>
    <button type="button" class="btn-small red hg-persona-eliminar">
      <i class="material-icons">close</i>
    </button>
  `;
  
  // Evento eliminar
  div.querySelector('.hg-persona-eliminar').addEventListener('click', function() {
    div.remove();
    // Si ya no hay filas, ocultar el contenedor
    if (!hgPersonasListaElem.querySelector('.hg-persona-row')) {
      hgPersonasContainerElem.style.display = 'none';
    }
  });

  // Evento de validación en input de aporte
  const aporteInput = div.querySelector('.hg-persona-aporte');
  aporteInput.addEventListener('input', function() {
    validarAporteIndividual(aporteInput);
  });
  
  return div;
}

function agregarPersonaAGastosGrupales() {
  if (!hgPersonasListaElem || !hgPersonasContainerElem) return;
  
  // Mostrar contenedor si está oculto
  if (hgPersonasContainerElem.style.display === 'none') {
    hgPersonasContainerElem.style.display = '';
  }
  
  const filasActuales = hgPersonasListaElem.querySelectorAll('.hg-persona-row').length;
  const nuevaFila = crearFilaPersonaGrupal(filasActuales + 1);
  hgPersonasListaElem.appendChild(nuevaFila);

  // Autocompletar aporte si hay monto total
  const montoTotal = parseFloat(hgMontoTotalElem?.value || '0');
  if (montoTotal > 0) {
    const sumaAportesActuales = calcularSumaAportes();
    const restante = montoTotal - sumaAportesActuales;
    if (restante > 0) {
      const aporteInput = nuevaFila.querySelector('.hg-persona-aporte');
      if (aporteInput) {
        aporteInput.value = restante.toFixed(2);
        if (window.M && M.updateTextFields) {
          M.updateTextFields();
        }
      }
    }
  }
}

function sincronizarFilasPersonasConCantidad() {
  if (!hgCantidadPersonasElem || !hgPersonasListaElem || !hgPersonasContainerElem) return;
  
  const cantidad = parseInt(hgCantidadPersonasElem.value || '0', 10);
  
  if (cantidad <= 0) {
    // Limpiar todas las filas y ocultar contenedor
    hgPersonasListaElem.innerHTML = '';
    hgPersonasContainerElem.style.display = 'none';
    return;
  }
  
  // Mostrar contenedor
  hgPersonasContainerElem.style.display = '';
  
  const filasActuales = hgPersonasListaElem.querySelectorAll('.hg-persona-row');
  const cantidadFilas = filasActuales.length;
  const montoTotal = parseFloat(hgMontoTotalElem?.value || '0');
  
  if (cantidad > cantidadFilas) {
    // Agregar filas faltantes
    for (let i = cantidadFilas; i < cantidad; i++) {
      const nuevaFila = crearFilaPersonaGrupal(i + 1);
      hgPersonasListaElem.appendChild(nuevaFila);
      
      // Autocompletar última persona si hay monto total
      if (i === cantidad - 1 && montoTotal > 0) {
        const sumaAportesActuales = calcularSumaAportes();
        const restante = montoTotal - sumaAportesActuales;
        if (restante > 0) {
          const aporteInput = nuevaFila.querySelector('.hg-persona-aporte');
          if (aporteInput) {
            aporteInput.value = restante.toFixed(2);
            if (window.M && M.updateTextFields) {
              M.updateTextFields();
            }
          }
        }
      }
    }
  } else if (cantidad < cantidadFilas) {
    // Eliminar filas sobrantes
    for (let i = cantidadFilas - 1; i >= cantidad; i--) {
      filasActuales[i].remove();
    }
  }
}

function obtenerPersonasGastoGrupal() {
  if (!hgPersonasListaElem) return [];
  
  const filas = hgPersonasListaElem.querySelectorAll('.hg-persona-row');
  const personas = [];
  
  filas.forEach((fila) => {
    const nombreInput = fila.querySelector('.hg-persona-nombre');
    const aporteInput = fila.querySelector('.hg-persona-aporte');
    
    const nombre = nombreInput?.value.trim() || 'Sin nombre';
    const aporte = parseFloat(aporteInput?.value || '0');
    
    personas.push({ nombre, aporte });
  });
  
  return personas;
}

function renderizarResultadoGastoGrupal(total, personas) {
  if (!hgResultadoElem) return;
  
  const simbolo = obtenerSimboloMoneda();
  
  // Calcular promedio
  const promedioPorPersona = total / personas.length;
  
  // Calcular transferencias
  const transferencias = calcularTransferencias(personas, promedioPorPersona);
  
  // Construir HTML del resultado
  let html = '<div style="margin-top: 1rem;">';
  html += '<p><strong>Monto total:</strong> ' + simbolo + ' ' + total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>';
  html += '<p><strong>Promedio por persona:</strong> ' + simbolo + ' ' + promedioPorPersona.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>';
  
  if (transferencias.length > 0) {
    html += '<p><strong>Transferencias necesarias:</strong></p>';
    html += '<ul class="herramienta-grupal-lista">';
    
    transferencias.forEach(t => {
      html += '<li><span class="persona-paga">' + t.de + '</span> debe pagar a <span class="persona-recibe">' + t.para + '</span> ' + simbolo + ' ' + t.monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</li>';
    });
    
    html += '</ul>';
  } else {
    html += '<p style="color: #66bb6a;">✓ Todos los aportes están balanceados.</p>';
  }
  
  html += '</div>';
  hgResultadoElem.innerHTML = html;
}

function manejarSubmitHerramientaGrupal(event) {
  event.preventDefault();
  if (!hgMontoTotalElem || !hgCantidadPersonasElem || !hgResultadoElem) return;

  const montoTotal = parseFloat(hgMontoTotalElem.value || '0');
  const cantidadPersonas = parseInt(hgCantidadPersonasElem.value || '0', 10);

  if (!montoTotal || montoTotal <= 0 || !cantidadPersonas || cantidadPersonas <= 0) {
    hgResultadoElem.innerHTML = '<span style="color: #ef5350;">Completá un monto total y una cantidad de personas válidos.</span>';
    return;
  }

  // Verificar si hay personas con aportes detallados
  const personas = obtenerPersonasGastoGrupal();
  
  if (personas.length > 0) {
    // Ajustar última persona si la suma no llega al total
    const sumaAportes = calcularSumaAportes();
    if (personas.length >= 2 && sumaAportes < montoTotal) {
      ajustarUltimaPersonaAlTotal();
      // Recalcular personas después del ajuste
      const personasActualizadas = obtenerPersonasGastoGrupal();
      
      // Validar que ningún aporte supere el total
      let hayError = false;
      personasActualizadas.forEach(p => {
        if (p.aporte > montoTotal) {
          hayError = true;
        }
      });
      
      if (hayError) {
        hgResultadoElem.innerHTML = '<span style="color: #ef5350;">Hay aportes que superan el monto total. Verificá los valores.</span>';
        return;
      }
      
      // Validar suma total
      if (!validarSumaAportes()) {
        return;
      }
      
      // Modo detallado: calcular balances y transferencias
      renderizarResultadoGastoGrupal(montoTotal, personasActualizadas);
    } else {
      // Validar que ningún aporte supere el total
      let hayError = false;
      personas.forEach(p => {
        if (p.aporte > montoTotal) {
          hayError = true;
        }
      });
      
      if (hayError) {
        hgResultadoElem.innerHTML = '<span style="color: #ef5350;">Hay aportes que superan el monto total. Verificá los valores.</span>';
        return;
      }
      
      // Validar suma total
      if (!validarSumaAportes()) {
        return;
      }
      
      // Modo detallado: calcular balances y transferencias
      renderizarResultadoGastoGrupal(montoTotal, personas);
    }
  } else {
    // Modo simple: división equitativa
    const porPersona = montoTotal / cantidadPersonas;
    const simbolo = obtenerSimboloMoneda();

    hgResultadoElem.innerHTML =
      '<div style="margin-top: 1rem;"><p>Cada persona debe aportar ' +
      simbolo +
      ' ' +
      porPersona.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) +
      '.</p></div>';
  }
}

function limpiarHerramientaGrupal() {
  if (!hgMontoTotalElem || !hgCantidadPersonasElem || !hgResultadoElem) return;
  hgMontoTotalElem.value = '';
  hgCantidadPersonasElem.value = '';
  hgResultadoElem.innerHTML = '';
  
  // Limpiar personas
  if (hgPersonasListaElem) {
    hgPersonasListaElem.innerHTML = '';
  }
  if (hgPersonasContainerElem) {
    hgPersonasContainerElem.style.display = 'none';
  }
  
  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }
}

// ====================
//  Conversor de divisas
// ====================

const TASAS_DIVISAS = {
  ARS: { ARS: 1, USD: 1 / 1000, EUR: 1 / 1100 },
  USD: { ARS: 1000, USD: 1, EUR: 1.1 },
  EUR: { ARS: 1100, USD: 0.9, EUR: 1 }
};

function manejarSubmitHerramientaDivisas(event) {
  event.preventDefault();
  if (!hdMontoElem || !hdMonedaOrigenElem || !hdMonedaDestinoElem || !hdResultadoElem) return;
  const monto = parseFloat(hdMontoElem.value || '0');
  const origen = hdMonedaOrigenElem.value || 'ARS';
  const destino = hdMonedaDestinoElem.value || 'USD';
  if (!monto || monto <= 0) {
    hdResultadoElem.innerHTML = '<span style="color:#ef5350;">Ingresá un monto válido.</span>';
    return;
  }
  const tasa = (TASAS_DIVISAS[origen] && TASAS_DIVISAS[origen][destino]) ? TASAS_DIVISAS[origen][destino] : null;
  if (!tasa) {
    hdResultadoElem.innerHTML = '<span style="color:#ef5350;">Monedas no soportadas.</span>';
    return;
  }
  const convertido = monto * tasa;
  hdResultadoElem.innerHTML = '<p><strong>Resultado:</strong> ' + convertido.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + destino + '</p>';
}

function limpiarHerramientaDivisas() {
  if (!hdMontoElem || !hdResultadoElem) return;
  hdMontoElem.value = '';
  hdResultadoElem.innerHTML = '';
  if (window.M && M.updateTextFields) M.updateTextFields();
}

// ====================
//  Interés compuesto
// ====================

function manejarSubmitHerramientaInteres(event) {
  event.preventDefault();
  if (!hiMontoInicialElem || !hiAporteMensualElem || !hiTasaAnualElem || !hiPlazoAniosElem || !hiResultadoElem) return;
  const montoInicial = parseFloat(hiMontoInicialElem.value || '0');
  const aporteMensual = parseFloat(hiAporteMensualElem.value || '0');
  const tasaAnual = parseFloat(hiTasaAnualElem.value || '0');
  const plazoAnios = parseInt(hiPlazoAniosElem.value || '0', 10);
  if (plazoAnios <= 0 || tasaAnual < 0 || montoInicial < 0 || aporteMensual < 0) {
    hiResultadoElem.innerHTML = '<span style="color:#ef5350;">Ingresá valores válidos.</span>';
    return;
  }
  const tasaMensual = (tasaAnual / 100) / 12;
  const meses = plazoAnios * 12;
  let saldo = montoInicial;
  let totalAportado = 0;
  for (let m = 0; m < meses; m++) {
    saldo = saldo * (1 + tasaMensual);
    saldo += aporteMensual;
    totalAportado += aporteMensual;
  }
  const intereses = saldo - (montoInicial + totalAportado);
  const simbolo = obtenerSimboloMoneda();
  hiResultadoElem.innerHTML =
    '<p><strong>Total aportado:</strong> ' + simbolo + ' ' + totalAportado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>' +
    '<p><strong>Total final:</strong> ' + simbolo + ' ' + saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>' +
    '<p><strong>Intereses generados:</strong> ' + simbolo + ' ' + intereses.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>';
}

function limpiarHerramientaInteres() {
  if (!hiMontoInicialElem || !hiAporteMensualElem || !hiTasaAnualElem || !hiPlazoAniosElem || !hiResultadoElem) return;
  hiMontoInicialElem.value = '';
  hiAporteMensualElem.value = '';
  hiTasaAnualElem.value = '';
  hiPlazoAniosElem.value = '';
  hiResultadoElem.innerHTML = '';
  if (window.M && M.updateTextFields) M.updateTextFields();
}

// ====================
//  Objetivo de ahorro
// ====================

function manejarSubmitHerramientaObjetivo(event) {
  event.preventDefault();
  if (!hoMontoObjetivoElem || !hoMesesElem || !hoResultadoElem) return;
  const montoObjetivo = parseFloat(hoMontoObjetivoElem.value || '0');
  const meses = parseInt(hoMesesElem.value || '0', 10);
  const aporteActual = parseFloat(hoAporteActualElem?.value || '0');
  if (montoObjetivo <= 0 || meses <= 0) {
    hoResultadoElem.innerHTML = '<span style="color:#ef5350;">Ingresá un objetivo y meses válidos.</span>';
    return;
  }
  const simbolo = obtenerSimboloMoneda();
  if (!aporteActual || aporteActual <= 0) {
    const aporteMensualNecesario = montoObjetivo / meses;
    const aporteDiarioNecesario = aporteMensualNecesario / 30;
    hoResultadoElem.innerHTML =
      '<p><strong>Aporte mensual necesario:</strong> ' + simbolo + ' ' + aporteMensualNecesario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>' +
      '<p><strong>Aporte diario necesario:</strong> ' + simbolo + ' ' + aporteDiarioNecesario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>';
  } else {
    const totalAhorradoConActual = aporteActual * meses;
    if (totalAhorradoConActual >= montoObjetivo) {
      hoResultadoElem.innerHTML = '<p style="color:#66bb6a;"><strong>¡Objetivo alcanzado!</strong> Con tu aporte actual lograrías ' + simbolo + ' ' + totalAhorradoConActual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '.</p>';
    } else {
      const faltante = montoObjetivo - totalAhorradoConActual;
      const aporteNecesario = (montoObjetivo / meses);
      hoResultadoElem.innerHTML =
        '<p><strong>Con tu aporte actual ahorrarías:</strong> ' + simbolo + ' ' + totalAhorradoConActual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>' +
        '<p><strong>Faltante:</strong> ' + simbolo + ' ' + faltante.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>' +
        '<p><strong>Aporte mensual necesario para alcanzar:</strong> ' + simbolo + ' ' + aporteNecesario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>';
    }
  }
}

function limpiarHerramientaObjetivo() {
  if (!hoMontoObjetivoElem || !hoMesesElem || !hoResultadoElem) return;
  hoMontoObjetivoElem.value = '';
  hoMesesElem.value = '';
  if (hoAporteActualElem) hoAporteActualElem.value = '';
  hoResultadoElem.innerHTML = '';
  if (window.M && M.updateTextFields) M.updateTextFields();
}

// ====================
//  Índice de movimientos por día
// ====================

function construirIndiceMovimientosPorDia() {
  const indice = {};

  movimientos.forEach(function (mov) {
    if (!mov.fecha) return;

    if (!indice[mov.fecha]) {
      indice[mov.fecha] = {
        ingresos: 0,
        gastos: 0,
        balance: 0,
        lista: []
      };
    }

    const entry = indice[mov.fecha];
    if (mov.tipo === 'INGRESO') {
      entry.ingresos += mov.monto;
    } else if (mov.tipo === 'GASTO') {
      entry.gastos += mov.monto;
    }
    entry.balance = entry.ingresos - entry.gastos;
    entry.lista.push(mov);
  });

  return indice;
}

//////////////////////////////////////////////////////////////////////
// MÓDULO: Movimientos, CRUD
//////////////////////////////////////////////////////////////////////

function limpiarFormularioMovimiento() {
  movimientoEnEdicion = null;

  if (formMovimiento) formMovimiento.reset();

  const hoy = obtenerFechaHoyYYYYMMDD();
  if (inputFecha) inputFecha.value = hoy;

  if (radiosTipoMovimiento && radiosTipoMovimiento.length) {
    radiosTipoMovimiento.forEach(function (radio) {
      radio.checked = radio.value === 'INGRESO';
    });
  }

  if (inputCategoriaBusqueda) {
    inputCategoriaBusqueda.value = '';
  }

  renderizarCategoriasSelect(null);
  limpiarErrorMovimiento();

  // Reset forma de pago a la opción por defecto si existe
  if (selectFormaPagoMovimiento) {
    // si existe una opción 'Efectivo' la dejamos, si no dejamos la primera
    const opciones = Array.prototype.slice.call(selectFormaPagoMovimiento.options || []);
    const existeEfectivo = opciones.some(function (o) { return o.value === 'Efectivo'; });
    selectFormaPagoMovimiento.value = existeEfectivo ? 'Efectivo' : (opciones[0] ? opciones[0].value : '');
    refrescarSelectMaterialize(selectFormaPagoMovimiento);
  }

  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }
}


function obtenerTipoSeleccionadoEnFormulario() {
  if (!radiosTipoMovimiento || !radiosTipoMovimiento.length) return 'INGRESO';

  const seleccionado = Array.prototype.find.call(
    radiosTipoMovimiento,
    function (radio) {
      return radio.checked;
    }
  );
  return seleccionado ? seleccionado.value : 'INGRESO';
}

function manejarSubmitMovimiento(event) {
  event.preventDefault();
  if (!formMovimiento) return;

  const tipo = obtenerTipoSeleccionadoEnFormulario();
  const fecha = inputFecha ? inputFecha.value : '';
  const montoStr = inputMonto ? inputMonto.value : '0';
  const categoria = selectCategoriaMovimiento
    ? selectCategoriaMovimiento.value
    : '';
  const formaPago = selectFormaPagoMovimiento
    ? selectFormaPagoMovimiento.value || ''
    : '';
  const nota = inputNota ? inputNota.value.trim() : '';

  limpiarErrorMovimiento();

  if (!fecha) {
    mostrarErrorMovimiento('La fecha es obligatoria.');
    return;
  }

  const monto = parseFloat(montoStr);
  if (Number.isNaN(monto) || monto <= 0) {
    mostrarErrorMovimiento(
      'El monto debe ser un número válido mayor que 0.'
    );
    return;
  }

  if (!categoria) {
    mostrarErrorMovimiento('Seleccioná una categoría.');
    return;
  }

  if (movimientoEnEdicion) {
    movimientoEnEdicion.fecha = fecha;
    movimientoEnEdicion.tipo = tipo;
    movimientoEnEdicion.categoria = categoria;
    movimientoEnEdicion.formaPago = formaPago;
    movimientoEnEdicion.monto = monto;
    movimientoEnEdicion.nota = nota;

    movimientos = movimientos.map(function (mov) {
      return mov.id === movimientoEnEdicion.id ? movimientoEnEdicion : mov;
    });

    mostrarMensaje('Movimiento actualizado.');
  } else {
    const nuevoMov = {
      id: nextId++,
      fecha: fecha,
      tipo: tipo,
      categoria: categoria,
      formaPago: formaPago,
      monto: monto,
      nota: nota
    };
    movimientos.push(nuevoMov);
    mostrarMensaje('Movimiento agregado.');
  }

  guardarMovimientosEnStorage(movimientos);
  renderizarMovimientos();
  actualizarResumen();

  if (modalMovimientoInstance) modalMovimientoInstance.close();
  limpiarFormularioMovimiento();
}

function iniciarEdicionMovimiento(id) {
  const mov = movimientos.find(function (m) {
    return m.id === id;
  });
  if (!mov) return;

  movimientoEnEdicion = { ...mov };

  if (modalMovimientoTitulo) {
    modalMovimientoTitulo.textContent = 'Editar movimiento';
  }

  if (inputFecha) inputFecha.value = mov.fecha;
  if (inputMonto) inputMonto.value = String(mov.monto);
  if (inputNota) inputNota.value = mov.nota || '';

  if (radiosTipoMovimiento && radiosTipoMovimiento.length) {
    radiosTipoMovimiento.forEach(function (radio) {
      radio.checked = radio.value === mov.tipo;
    });
  }

  if (inputCategoriaBusqueda) {
    inputCategoriaBusqueda.value = '';
  }

  renderizarCategoriasSelect(mov.categoria);
  limpiarErrorMovimiento();

  // Poblar forma de pago en el modal
  if (selectFormaPagoMovimiento) {
    selectFormaPagoMovimiento.value = mov.formaPago || selectFormaPagoMovimiento.value || 'Efectivo';
    refrescarSelectMaterialize(selectFormaPagoMovimiento);
  }

  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }

  if (modalMovimientoInstance) {
    modalMovimientoInstance.open();
  }
}

function abrirModalNuevoMovimiento() {
  movimientoEnEdicion = null;

  if (modalMovimientoTitulo) {
    modalMovimientoTitulo.textContent = 'Nuevo movimiento';
  }

  limpiarFormularioMovimiento();

  if (modalMovimientoInstance) {
    modalMovimientoInstance.open();
  }
}

function prepararEliminacionMovimiento(id) {
  const mov = movimientos.find(function (m) {
    return m.id === id;
  });
  if (!mov) return;

  movimientoEnEliminacion = mov;

  const spanFecha = document.getElementById('modal-eliminar-fecha');
  const spanTipo = document.getElementById('modal-eliminar-tipo');
  const spanCategoria = document.getElementById('modal-eliminar-categoria');
  const spanMonto = document.getElementById('modal-eliminar-monto');
  const spanNota = document.getElementById('modal-eliminar-nota');

  if (spanFecha) spanFecha.textContent = mov.fecha;
  if (spanTipo)
    spanTipo.textContent = mov.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto';
  if (spanCategoria) spanCategoria.textContent = mov.categoria || '-';
  if (spanMonto) spanMonto.textContent = mov.monto.toFixed(2);
  if (spanNota) spanNota.textContent = mov.nota || '';

  if (modalEliminarInstance) {
    modalEliminarInstance.open();
  }
}

function confirmarEliminacion() {
  if (!movimientoEnEliminacion) return;

  movimientos = movimientos.filter(function (mov) {
    return mov.id !== movimientoEnEliminacion.id;
  });

  guardarMovimientosEnStorage(movimientos);
  renderizarMovimientos();
  actualizarResumen();

  movimientoEnEliminacion = null;

  if (modalEliminarInstance) modalEliminarInstance.close();

  mostrarMensaje('Movimiento eliminado.');
}

function copiarUltimoMontoPorCategoria() {
  if (!selectCategoriaMovimiento || !inputMonto) return;
  const categoriaSeleccionada = selectCategoriaMovimiento.value;
  if (!categoriaSeleccionada) {
    mostrarErrorMovimiento(
      'Elegí una categoría para copiar el último monto.'
    );
    return;
  }

  const tipoFormulario = obtenerTipoSeleccionadoEnFormulario();

  for (let i = movimientos.length - 1; i >= 0; i--) {
    const mov = movimientos[i];
    if (
      mov.categoria === categoriaSeleccionada &&
      mov.tipo === tipoFormulario
    ) {
      inputMonto.value = mov.monto.toString();
      if (window.M && M.updateTextFields) M.updateTextFields();
      limpiarErrorMovimiento();
      return;
    }
  }

  mostrarErrorMovimiento(
    'No se encontró un monto previo para esa categoría.'
  );
}

function manejarCambioCategoriaEnModal() {
  if (!selectCategoriaMovimiento || !radiosTipoMovimiento) return;
  const nombre = selectCategoriaMovimiento.value;
  const tipoCat = obtenerTipoCategoriaPorNombre(nombre);
  if (!tipoCat) return;

  radiosTipoMovimiento.forEach(function (radio) {
    radio.checked = radio.value === tipoCat;
  });
}

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

  if (periodo === 'mes-actual') rango = obtenerRangoMesActual();
  else if (periodo === 'semana-actual') rango = obtenerRangoSemanaActual();
  else if (periodo === 'anio-actual') rango = obtenerRangoAnioActual();
  else if (periodo === 'ultimos-30') rango = obtenerRangoUltimos30Dias();
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
}

function limpiarFiltros() {
  inicializarEstadoFiltros();
  renderizarOpcionesFiltroCategoria();

  if (window.M && M.FormSelect) {
    if (selectFiltroPeriodo) M.FormSelect.init(selectFiltroPeriodo);
    if (selectFiltroTipo) M.FormSelect.init(selectFiltroTipo);
    if (selectFiltroCategoria) M.FormSelect.init(selectFiltroCategoria);
    if (selectFiltroFormaPago) M.FormSelect.init(selectFiltroFormaPago);
  }

  renderizarMovimientos();
  actualizarResumen();
}

function obtenerMovimientosFiltrados() {
  if (!Array.isArray(movimientos) || movimientos.length === 0) {
    return [];
  }

  const f = filtros || {};

  return movimientos.filter(function (mov) {
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
  if (visible) section.classList.remove('hide');
  else section.classList.add('hide');
}

function seleccionarHerramienta(nombre) {
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

  const found = items.find(function (it) { return it.key === nombre; });
  if (found) {
    if (found.el) found.el.classList.add('activa');
    if (found.panel) found.panel.style.display = '';
  }

  // Opcional: recordar preferencia
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

function convertirFechaADateString(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

//////////////////////////////////////////////////////////////////////
// MÓDULO: Calendario
//////////////////////////////////////////////////////////////////////

function renderizarCalendario() {
  if (!calendarGridEl || !calendarMonthLabelEl) return;

  const indice = construirIndiceMovimientosPorDia();

  const base =
    calendarCurrentDate instanceof Date
      ? new Date(calendarCurrentDate)
      : new Date();
  const year = base.getFullYear();
  const month = base.getMonth(); // 0-11

  if (!calendarSelectedDate) {
    calendarSelectedDate = obtenerFechaHoyYYYYMMDD();
  }

  const vista =
    selectCalendarViewMode && selectCalendarViewMode.value
      ? selectCalendarViewMode.value
      : (config && config.calendarioVistaPreferida) ||
        DEFAULT_CONFIG.calendarioVistaPreferida;

  // Mostrar/ocultar nombres de días
  if (calendarWeekdaysRowEl) {
    if (vista === 'anio') {
      calendarWeekdaysRowEl.style.display = 'none';
    } else {
      calendarWeekdaysRowEl.style.display = 'grid';
    }
  }

  if (vista === 'anio') {
    renderizarCalendarioAnual(indice, year);
  } else if (vista === 'semana') {
    renderizarCalendarioSemanal(indice);
  } else {
    renderizarCalendarioMensual(indice, year, month);
  }

  actualizarDetalleCalendario(calendarSelectedDate, indice);
}

function renderizarCalendarioMensual(indice, year, month) {
  calendarGridEl.innerHTML = '';
  calendarGridEl.classList.remove('calendar-grid-year');

  const mesNombre = NOMBRES_MESES[month] || '';
  calendarMonthLabelEl.textContent = mesNombre + ' ' + year;

  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeek = firstOfMonth.getDay(); // 0=Dom ... 6=Sab
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // lunes=0
  const startDate = new Date(year, month, 1 - offset);

  const hoyStr = obtenerFechaHoyYYYYMMDD();

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const iso = convertirFechaADateString(d);

    const infoDia =
      indice[iso] || { ingresos: 0, gastos: 0, balance: 0, lista: [] };

    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.dataset.date = iso;

    if (infoDia.balance > 0) {
      dayEl.classList.add('calendar-day-positive');
    } else if (infoDia.balance < 0) {
      dayEl.classList.add('calendar-day-negative');
    }

    if (d.getMonth() !== month) {
      dayEl.classList.add('calendar-day-outside');
    }
    if (iso === hoyStr) {
      dayEl.classList.add('calendar-day-today');
    }
    if (iso === calendarSelectedDate) {
      dayEl.classList.add('calendar-day-selected');
    }

    const numEl = document.createElement('div');
    numEl.className = 'calendar-day-number';
    numEl.textContent = d.getDate();
    dayEl.appendChild(numEl);

    const amountEl = document.createElement('div');
    amountEl.className = 'calendar-day-amount';

    if (infoDia.ingresos !== 0 || infoDia.gastos !== 0) {
      const simbolo = obtenerSimboloMoneda();
      const balance = infoDia.balance;
      const prefijo = balance > 0 ? '+' : balance < 0 ? '-' : '';
      amountEl.textContent =
        prefijo + simbolo + ' ' + Math.abs(balance).toFixed(0);
    } else {
      amountEl.textContent = '';
    }

    dayEl.appendChild(amountEl);

    dayEl.addEventListener('click', function () {
      calendarSelectedDate = iso;
      calendarCurrentDate = new Date(d);
      renderizarCalendario();
    });

    calendarGridEl.appendChild(dayEl);
  }
}

function renderizarCalendarioSemanal(indice) {
  calendarGridEl.innerHTML = '';
  calendarGridEl.classList.remove('calendar-grid-year');

  let referencia = calendarSelectedDate
    ? parseFechaYYYYMMDD(calendarSelectedDate)
    : new Date();
  if (!(referencia instanceof Date) || isNaN(referencia.getTime())) {
    referencia = new Date();
  }

  const day = referencia.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day; // lunes
  const lunes = new Date(referencia);
  lunes.setDate(referencia.getDate() + diff);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  calendarMonthLabelEl.textContent =
    'Semana ' + formatearDiaMes(lunes) + ' - ' + formatearDiaMes(domingo);

  const hoyStr = obtenerFechaHoyYYYYMMDD();
  const simbolo = obtenerSimboloMoneda();

  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const iso = convertirFechaADateString(d);

    const infoDia =
      indice[iso] || { ingresos: 0, gastos: 0, balance: 0, lista: [] };

    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.dataset.date = iso;

    if (infoDia.balance > 0) {
      dayEl.classList.add('calendar-day-positive');
    } else if (infoDia.balance < 0) {
      dayEl.classList.add('calendar-day-negative');
    }

    if (iso === hoyStr) {
      dayEl.classList.add('calendar-day-today');
    }
    if (iso === calendarSelectedDate) {
      dayEl.classList.add('calendar-day-selected');
    }

    const numEl = document.createElement('div');
    numEl.className = 'calendar-day-number';
    numEl.textContent = d.getDate();
    dayEl.appendChild(numEl);

    const amountEl = document.createElement('div');
    amountEl.className = 'calendar-day-amount';

    if (infoDia.ingresos !== 0 || infoDia.gastos !== 0) {
      const balance = infoDia.balance;
      const prefijo = balance > 0 ? '+' : balance < 0 ? '-' : '';
      amountEl.textContent =
        prefijo + simbolo + ' ' + Math.abs(balance).toFixed(0);
    } else {
      amountEl.textContent = '';
    }

    dayEl.appendChild(amountEl);

    dayEl.addEventListener('click', function () {
      calendarSelectedDate = iso;
      calendarCurrentDate = new Date(d);
      renderizarCalendario();
    });

    calendarGridEl.appendChild(dayEl);
  }
}

function renderizarCalendarioAnual(indice, year) {
  calendarGridEl.innerHTML = '';
  calendarGridEl.classList.add('calendar-grid-year');

  calendarMonthLabelEl.textContent = 'Año ' + year;

  const simbolo = obtenerSimboloMoneda();
  const totalesPorMes = [];
  for (let m = 0; m < 12; m++) {
    totalesPorMes[m] = { ingresos: 0, gastos: 0 };
  }

  Object.keys(indice).forEach(function (fechaStr) {
    const d = parseFechaYYYYMMDD(fechaStr);
    if (!d || d.getFullYear() !== year) return;
    const mes = d.getMonth();
    const info = indice[fechaStr];
    totalesPorMes[mes].ingresos += info.ingresos;
    totalesPorMes[mes].gastos += info.gastos;
  });

  const base =
    calendarCurrentDate instanceof Date
      ? new Date(calendarCurrentDate)
      : new Date();
  const mesActual = base.getMonth();

  for (let m = 0; m < 12; m++) {
    const totalIng = totalesPorMes[m].ingresos;
    const totalGas = totalesPorMes[m].gastos;
    const balance = totalIng - totalGas;

    const cell = document.createElement('div');
    cell.className = 'calendar-month-cell';

    if (balance > 0) {
      cell.classList.add('calendar-month-positive');
    } else if (balance < 0) {
      cell.classList.add('calendar-month-negative');
    }

    if (m === mesActual) {
      cell.classList.add('calendar-month-current');
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'calendar-month-name';
    nameEl.textContent = NOMBRES_MESES[m].slice(0, 3);
    cell.appendChild(nameEl);

    const amountEl = document.createElement('div');
    amountEl.className = 'calendar-month-amount';

    if (balance !== 0) {
      const prefijo = balance > 0 ? '+' : '-';
      amountEl.textContent =
        prefijo + simbolo + ' ' + Math.abs(balance).toFixed(0);
    } else {
      amountEl.textContent = simbolo + ' 0';
    }
    cell.appendChild(amountEl);

    cell.addEventListener('click', function () {
      const nuevaFecha = new Date(year, m, 1);
      calendarCurrentDate = nuevaFecha;
      calendarSelectedDate = convertirFechaADateString(nuevaFecha);

      if (selectCalendarViewMode) {
        selectCalendarViewMode.value = 'mes';
        if (config) {
          config.calendarioVistaPreferida = 'mes';
          guardarConfigEnStorage(config);
        }
        refrescarSelectMaterialize(selectCalendarViewMode);
      }

      renderizarCalendario();
    });

    calendarGridEl.appendChild(cell);
  }
}

function actualizarDetalleCalendario(fechaStr, indice) {
  if (
    !calendarDayDateLabelEl ||
    !calendarDayTotalIngresosEl ||
    !calendarDayTotalGastosEl ||
    !calendarDayTotalBalanceEl ||
    !calendarMovimientosDiaEl ||
    !calendarMovimientosEmptyEl
  ) {
    return;
  }

  const map = indice || construirIndiceMovimientosPorDia();
  const infoDia =
    (fechaStr && map && map[fechaStr]) || {
      ingresos: 0,
      gastos: 0,
      balance: 0,
      lista: []
    };

  calendarDayDateLabelEl.textContent = fechaStr
    ? formatearFechaLarga(fechaStr)
    : 'Sin seleccionar';

  calendarDayTotalIngresosEl.textContent = infoDia.ingresos.toFixed(2);
  calendarDayTotalGastosEl.textContent = infoDia.gastos.toFixed(2);
  calendarDayTotalBalanceEl.textContent = infoDia.balance.toFixed(2);

  calendarMovimientosDiaEl.innerHTML = '';

  if (!infoDia.lista.length) {
    calendarMovimientosEmptyEl.style.display = 'block';
    return;
  }

  calendarMovimientosEmptyEl.style.display = 'none';

  const simbolo = obtenerSimboloMoneda();

  infoDia.lista.forEach(function (mov) {
    const li = document.createElement('li');
    li.className = 'collection-item';

    const tipoStr = mov.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto';
    const montoStr = simbolo + ' ' + mov.monto.toFixed(2);
    const categoriaStr = mov.categoria || '-';
    const notaStr = mov.nota ? ' · ' + mov.nota : '';

    li.textContent =
      tipoStr + ' · ' + categoriaStr + ' · ' + montoStr + notaStr;

    calendarMovimientosDiaEl.appendChild(li);
  });
}

//////////////////////////////////////////////////////////////////////
// MÓDULO: Backup + Export
//////////////////////////////////////////////////////////////////////

function exportarBackupJSON() {
  const data = {
    version: 3,
    fecha_exportacion: new Date().toISOString(),
    movimientos: movimientos,
    categorias: categorias,
    categoriaIconos: categoriaIconos,
    configuracion: config
  };

  const contenido = JSON.stringify(data, null, 2);
  const nombre = 'backup-finanzas-' + obtenerFechaHoyYYYYMMDD() + '.json';

  descargarArchivo(nombre, contenido, 'application/json;charset=utf-8;');
  mostrarMensaje('Backup JSON exportado.');
}

function manejarImportarBackup(event) {
  const archivo = event.target.files && event.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = function (e) {
    try {
      const contenido = e.target.result;
      const data = JSON.parse(contenido);

      if (
        !data ||
        typeof data !== 'object' ||
        !Array.isArray(data.movimientos) ||
        !data.categorias ||
        !data.configuracion
      ) {
        mostrarMensaje('El archivo no tiene el formato esperado.');
        return;
      }

      movimientos = data.movimientos.map(function (mov) {
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

      categorias = data.categorias;
      config = data.configuracion;

      if (data.categoriaIconos) {
        categoriaIconos = data.categoriaIconos;
      } else {
        categoriaIconos = clonarDefaultIconosCategorias();
      }
      asegurarIconosParaCategoriasExistentes();

      guardarMovimientosEnStorage(movimientos);
      guardarCategoriasEnStorage(categorias);
      guardarConfigEnStorage(config);

      aplicarConfigTema();
      aplicarConfigMoneda();

      calcularSiguienteId();
      inicializarEstadoFiltros();
      renderizarCategoriasManager();

      renderizarCategoriasSelect(null);
      renderizarOpcionesFiltroCategoria();
      renderizarMovimientos();
      actualizarResumen();

      if (selectCalendarViewMode && config) {
        selectCalendarViewMode.value =
          config.calendarioVistaPreferida ||
          DEFAULT_CONFIG.calendarioVistaPreferida;
        refrescarSelectMaterialize(selectCalendarViewMode);
      }

      setFiltrosVisible(config.abrirFiltrosAlInicio);
      setTablaVisible(config.abrirTablaAlInicio);
      setDashboardVisible(
        typeof config.abrirDashboardAlInicio === 'boolean'
          ? config.abrirDashboardAlInicio
          : true
      );
      setCalendarioVisible(
        typeof config.abrirCalendarioAlInicio === 'boolean'
          ? config.abrirCalendarioAlInicio
          : false
      );
      setTimelineVisible(
        typeof config.abrirTimelineAlInicio === 'boolean'
          ? config.abrirTimelineAlInicio
          : false
      );

      mostrarMensaje('Backup importado correctamente.');
    } catch (err) {
      console.error('Error importando backup:', err);
      mostrarMensaje('Error leyendo el archivo de backup.');
    }
  };

  lector.readAsText(archivo);
}

function descargarArchivo(nombre, contenido, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function exportarCSV() {
  const lista = obtenerMovimientosFiltrados();

  if (!lista.length) {
    mostrarMensaje('No hay movimientos para exportar.');
    return;
  }

  const lineas = [];
  // Añadimos columna forma de pago
  lineas.push('fecha,tipo,categoria,forma,monto,nota');

  lista.forEach(function (mov) {
    const fecha = mov.fecha;
    const tipo = mov.tipo;
    const categoria = (mov.categoria || '').replace(/"/g, '""');
    const nota = (mov.nota || '').replace(/"/g, '""');
    const forma = (mov.formaPago || '').replace(/"/g, '""');
    const monto = mov.monto.toFixed(2);

    const linea =
      fecha +
      ',' +
      tipo +
      ',' +
      '"' +
      categoria +
      '",' +
      '"' +
      forma +
      '",' +
      monto +
      ',' +
      '"' +
      nota +
      '"';

    lineas.push(linea);
  });

  const csv = lineas.join('\n');
  const nombre =
    'movimientos-finanzas-' + obtenerFechaHoyYYYYMMDD() + '.csv';

  descargarArchivo(nombre, csv, 'text/csv;charset=utf-8;');
  mostrarMensaje('CSV exportado.');
}
