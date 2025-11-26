// app.js
// Fase 1 completa con:
// - Movimientos + filtros
// - Modal alta/edición + confirmación de eliminación
// - Tema / configuración
// - Menú lateral (sidenav) con todas las acciones
// - Exportar/importar backup JSON
// - Exportar CSV
// - Imprimir / PDF

'use strict';

// Claves de localStorage
const STORAGE_KEYS = {
  MOVIMIENTOS: 'finanzas_movimientos',
  CATEGORIAS: 'finanzas_categorias',
  CONFIG: 'finanzas_config'
};

// Categorías por tipo
const DEFAULT_CATEGORIES = {
  INGRESO: [
    'Salario',
    'Horas extras',
    'Freelance',
    'Ventas',
    'Reembolsos',
    'Intereses',
    'Dividendos',
    'Otros ingresos'
  ],
  GASTO: [
    'Comida',
    'Supermercado',
    'Transporte',
    'Combustible',
    'Vivienda',
    'Servicios',
    'Ocio',
    'Salud',
    'Educación',
    'Deudas',
    'Suscripciones',
    'Otros gastos'
  ]
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  tema: 'claro',
  monedaSimbolo: '$',
  abrirTablaAlInicio: false,
  abrirFiltrosAlInicio: false,
  abrirModalAlInicio: false
};

// Estado en memoria
let movimientos = [];
let categorias = { INGRESO: [], GASTO: [] };
let nextId = 1;
let config = null;

// Filtros actuales
let filtros = {
  periodo: 'mes-actual',
  fechaDesde: null,
  fechaHasta: null,
  tipo: 'TODOS',
  categoria: 'TODAS',
  montoMin: null,
  montoMax: null
};

// Movimiento en edición / eliminación
let movimientoEnEdicion = null;
let movimientoAEliminar = null;

// Referencias DOM
let formMovimiento;
let inputFecha;
let inputMonto;
let inputNota;
let selectCategoriaMovimiento;
let tablaBody;
let totalIngresosEl;
let totalGastosEl;
let totalBalanceEl;

let btnOpenModalMovimiento;
let btnGuardarMovimiento;
let btnToggleFiltros;
let btnToggleTabla;
let fabNuevoMov;

let btnExportarBackup;
let btnImportarBackup;
let inputImportarBackup;
let btnExportarCSV;
let btnImprimir;

let selectFiltroPeriodo;
let inputFiltroFechaDesde;
let inputFiltroFechaHasta;
let selectFiltroTipo;
let selectFiltroCategoria;
let inputFiltroMontoMin;
let inputFiltroMontoMax;
let btnAplicarFiltros;
let btnLimpiarFiltros;
let btnConfirmarEliminar;

let radiosTipoMovimiento;
let modalMovimientoTitulo;

// Resumen símbolos
let resumenSimboloIngresosEl;
let resumenSimboloGastosEl;
let resumenSimboloBalanceEl;

// Modal eliminar símbolo
let modalEliminarMonedaEl;

// Config DOM
let selectConfigTema;
let inputConfigMoneda;
let chkConfigAbrirTabla;
let chkConfigAbrirFiltros;
let chkConfigAbrirModal;
let btnGuardarConfig;
let btnOpenConfigModal;

// Sidenav DOM
let navNuevoMov;
let navToggleFiltros;
let navToggleTabla;
let navExportarBackup;
let navImportarBackup;
let navExportarCSV;
let navImprimir;

// Instancias de Materialize
let modalMovimientoInstance = null;
let modalEliminarInstance = null;
let modalConfigInstance = null;
let sidenavInstance = null;

document.addEventListener('DOMContentLoaded', function () {
  cacheDomElements();

  movimientos = cargarMovimientosDesdeStorage();
  categorias = cargarCategoriasDesdeStorage();
  config = cargarConfigDesdeStorage();

  aplicarConfigTema();
  aplicarConfigMoneda();

  calcularSiguienteId();
  inicializarEstadoFiltros();

  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();

  renderizarMovimientos();
  actualizarResumen();

  inicializarMaterialize();
  configurarEventos();

  // Visibilidad inicial según config
  setFiltrosVisible(config.abrirFiltrosAlInicio);
  setTablaVisible(config.abrirTablaAlInicio);

  if (config.abrirModalAlInicio) {
    abrirModalNuevoMovimiento();
  }
});

// ====================
//    Inicialización
// ====================

function cacheDomElements() {
  formMovimiento = document.getElementById('form-movimiento');
  inputFecha = document.getElementById('fecha');
  inputMonto = document.getElementById('monto');
  inputNota = document.getElementById('nota');
  selectCategoriaMovimiento = document.getElementById('categoria');
  tablaBody = document.getElementById('tabla-movimientos-body');
  totalIngresosEl = document.getElementById('total-ingresos');
  totalGastosEl = document.getElementById('total-gastos');
  totalBalanceEl = document.getElementById('total-balance');

  btnOpenModalMovimiento = document.getElementById('btn-open-modal-movimiento');
  btnGuardarMovimiento = document.getElementById('btn-guardar-movimiento');
  btnToggleFiltros = document.getElementById('btn-toggle-filtros');
  btnToggleTabla = document.getElementById('btn-toggle-tabla');
  fabNuevoMov = document.getElementById('btn-fab-nuevo-mov');

  btnExportarBackup = document.getElementById('btn-exportar-backup');
  btnImportarBackup = document.getElementById('btn-importar-backup');
  inputImportarBackup = document.getElementById('input-importar-backup');
  btnExportarCSV = document.getElementById('btn-exportar-csv');
  btnImprimir = document.getElementById('btn-imprimir');

  selectFiltroPeriodo = document.getElementById('filtro-periodo');
  inputFiltroFechaDesde = document.getElementById('filtro-fecha-desde');
  inputFiltroFechaHasta = document.getElementById('filtro-fecha-hasta');
  selectFiltroTipo = document.getElementById('filtro-tipo');
  selectFiltroCategoria = document.getElementById('filtro-categoria');
  inputFiltroMontoMin = document.getElementById('filtro-monto-min');
  inputFiltroMontoMax = document.getElementById('filtro-monto-max');
  btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
  btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

  btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

  radiosTipoMovimiento = formMovimiento
    ? formMovimiento.querySelectorAll('input[name="tipo"]')
    : [];

  modalMovimientoTitulo = document.getElementById('modal-movimiento-titulo');

  resumenSimboloIngresosEl = document.getElementById('resumen-simbolo-ingresos');
  resumenSimboloGastosEl = document.getElementById('resumen-simbolo-gastos');
  resumenSimboloBalanceEl = document.getElementById('resumen-simbolo-balance');

  modalEliminarMonedaEl = document.getElementById('modal-eliminar-moneda');

  selectConfigTema = document.getElementById('config-tema');
  inputConfigMoneda = document.getElementById('config-moneda');
  chkConfigAbrirTabla = document.getElementById('config-abrir-tabla');
  chkConfigAbrirFiltros = document.getElementById('config-abrir-filtros');
  chkConfigAbrirModal = document.getElementById('config-abrir-modal');
  btnGuardarConfig = document.getElementById('btn-guardar-config');
  btnOpenConfigModal = document.getElementById('btn-open-config-modal');

  // Items del menú lateral
  navNuevoMov = document.getElementById('nav-nuevo-mov');
  navToggleFiltros = document.getElementById('nav-toggle-filtros');
  navToggleTabla = document.getElementById('nav-toggle-tabla');
  navExportarBackup = document.getElementById('nav-exportar-backup');
  navImportarBackup = document.getElementById('nav-importar-backup');
  navExportarCSV = document.getElementById('nav-exportar-csv');
  navImprimir = document.getElementById('nav-imprimir');
}

function configurarEventos() {
  if (formMovimiento) {
    formMovimiento.addEventListener('submit', manejarSubmitMovimiento);
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
          abrirModalEliminar(idEliminar);
        }
      }
    });
  }

  if (btnOpenModalMovimiento) {
    btnOpenModalMovimiento.addEventListener('click', function () {
      abrirModalNuevoMovimiento();
    });
  }

  if (fabNuevoMov) { 
    fabNuevoMov.addEventListener('click', function (e) {
      e.preventDefault();
      abrirModalNuevoMovimiento();
    });
  }

  if (btnToggleFiltros) {
    btnToggleFiltros.addEventListener('click', function () {
      const section = document.getElementById('section-filtros');
      if (!section) return;
      const oculto = section.classList.contains('hide');
      setFiltrosVisible(oculto);
    });
  }

  if (btnToggleTabla) {
    btnToggleTabla.addEventListener('click', function () {
      const section = document.getElementById('section-tabla');
      if (!section) return;
      const oculto = section.classList.contains('hide');
      setTablaVisible(oculto);
    });
  }

  if (radiosTipoMovimiento && radiosTipoMovimiento.length) {
    radiosTipoMovimiento.forEach(function (radio) {
      radio.addEventListener('change', function () {
        renderizarCategoriasSelect(this.value);
      });
    });
  }

  if (selectFiltroPeriodo) {
    selectFiltroPeriodo.addEventListener('change', manejarCambioFiltroPeriodo);
  }

  if (btnAplicarFiltros) {
    btnAplicarFiltros.addEventListener('click', function (event) {
      event.preventDefault();
      aplicarFiltros();
    });
  }

  if (btnLimpiarFiltros) {
    btnLimpiarFiltros.addEventListener('click', function (event) {
      event.preventDefault();
      limpiarFiltros();
    });
  }

  if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', function () {
      if (!movimientoAEliminar) return;
      eliminarMovimiento(movimientoAEliminar.id);
      movimientoAEliminar = null;
      if (modalEliminarInstance) {
        modalEliminarInstance.close();
      }
    });
  }

  // Config (desde menú)
  if (btnOpenConfigModal) {
    btnOpenConfigModal.addEventListener('click', function (event) {
      event.preventDefault();
      abrirModalConfig();
      cerrarSidenav();
    });
  }

  if (btnGuardarConfig) {
    btnGuardarConfig.addEventListener('click', function (event) {
      event.preventDefault();
      guardarConfigDesdeUI();
    });
  }

  // Backup / CSV / imprimir (botones grandes)
  if (btnExportarBackup) {
    btnExportarBackup.addEventListener('click', exportarBackupJSON);
  }

  if (btnImportarBackup && inputImportarBackup) {
    btnImportarBackup.addEventListener('click', function () {
      inputImportarBackup.click();
    });
    inputImportarBackup.addEventListener('change', manejarArchivoBackupSeleccionado);
  }

  if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', exportarCSV);
  }

  if (btnImprimir) {
    btnImprimir.addEventListener('click', function () {
      window.print();
    });
  }

  // Acciones desde el menú lateral (sidenav)
  if (navNuevoMov) {
    navNuevoMov.addEventListener('click', function (e) {
      e.preventDefault();
      abrirModalNuevoMovimiento();
      cerrarSidenav();
    });
  }

  if (navToggleFiltros) {
    navToggleFiltros.addEventListener('click', function (e) {
      e.preventDefault();
      const section = document.getElementById('section-filtros');
      if (!section) return;
      const oculto = section.classList.contains('hide');
      setFiltrosVisible(oculto);
      cerrarSidenav();
    });
  }

  if (navToggleTabla) {
    navToggleTabla.addEventListener('click', function (e) {
      e.preventDefault();
      const section = document.getElementById('section-tabla');
      if (!section) return;
      const oculto = section.classList.contains('hide');
      setTablaVisible(oculto);
      cerrarSidenav();
    });
  }

  if (navExportarBackup) {
    navExportarBackup.addEventListener('click', function (e) {
      e.preventDefault();
      exportarBackupJSON();
      cerrarSidenav();
    });
  }

  if (navImportarBackup && inputImportarBackup) {
    navImportarBackup.addEventListener('click', function (e) {
      e.preventDefault();
      inputImportarBackup.click();
      cerrarSidenav();
    });
  }

  if (navExportarCSV) {
    navExportarCSV.addEventListener('click', function (e) {
      e.preventDefault();
      exportarCSV();
      cerrarSidenav();
    });
  }

  if (navImprimir) {
    navImprimir.addEventListener('click', function (e) {
      e.preventDefault();
      window.print();
      cerrarSidenav();
    });
  }
}

function inicializarMaterialize() {
  if (!window.M) return;

  // Selects
  const selects = document.querySelectorAll('select');
  M.FormSelect.init(selects);

  // Modales
  const modalMovEl = document.getElementById('modal-movimiento');
  if (modalMovEl) {
    modalMovimientoInstance = M.Modal.init(modalMovEl, {
      onCloseEnd: function () {
        limpiarFormularioMovimiento();
      }
    });
  }

  const modalElimEl = document.getElementById('modal-eliminar');
  if (modalElimEl) {
    modalEliminarInstance = M.Modal.init(modalElimEl);
  }

  const modalConfigEl = document.getElementById('modal-config');
  if (modalConfigEl) {
    modalConfigInstance = M.Modal.init(modalConfigEl);
  }

  // Sidenav
  const sidenavEl = document.getElementById('sidenav-main');
  if (sidenavEl) {
    sidenavInstance = M.Sidenav.init(sidenavEl);
  }
}

function cerrarSidenav() {
  if (sidenavInstance && typeof sidenavInstance.close === 'function') {
    sidenavInstance.close();
  }
}

// ====================
//   Storage: datos
// ====================

// (toda la parte de cargar/guardar movimientos y categorías
// es idéntica a la que ya tenías; la dejo igual)

function cargarMovimientosDesdeStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.MOVIMIENTOS);
  if (!raw) return [];

  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.map(function (mov) {
        return {
          id: Number(mov.id),
          fecha: String(mov.fecha),
          tipo: String(mov.tipo),
          categoria: String(mov.categoria),
          monto: Number(mov.monto),
          nota: mov.nota ? String(mov.nota) : ''
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error al leer movimientos de localStorage:', error);
    return [];
  }
}

function guardarMovimientosEnStorage() {
  localStorage.setItem(STORAGE_KEYS.MOVIMIENTOS, JSON.stringify(movimientos));
}

function clonarCategorias(origen) {
  return {
    INGRESO: (origen.INGRESO || []).map(String),
    GASTO: (origen.GASTO || []).map(String)
  };
}

function normalizarCategorias(data) {
  return {
    INGRESO: Array.isArray(data.INGRESO)
      ? data.INGRESO.map(String)
      : DEFAULT_CATEGORIES.INGRESO.slice(),
    GASTO: Array.isArray(data.GASTO)
      ? data.GASTO.map(String)
      : DEFAULT_CATEGORIES.GASTO.slice()
  };
}

function guardarCategoriasEnStorage(data) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(data));
}

function cargarCategoriasDesdeStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIAS);
  if (!raw) {
    const copia = clonarCategorias(DEFAULT_CATEGORIES);
    guardarCategoriasEnStorage(copia);
    return copia;
  }

  try {
    const data = JSON.parse(raw);

    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      Array.isArray(data.INGRESO) &&
      Array.isArray(data.GASTO)
    ) {
      return normalizarCategorias(data);
    }

    if (Array.isArray(data)) {
      const convertidas = {
        INGRESO: DEFAULT_CATEGORIES.INGRESO.slice(),
        GASTO: data.map(function (cat) {
          return String(cat);
        })
      };
      guardarCategoriasEnStorage(convertidas);
      return convertidas;
    }

    const copia = clonarCategorias(DEFAULT_CATEGORIES);
    guardarCategoriasEnStorage(copia);
    return copia;
  } catch (error) {
    console.error('Error al leer categorías de localStorage:', error);
    const copia = clonarCategorias(DEFAULT_CATEGORIES);
    guardarCategoriasEnStorage(copia);
    return copia;
  }
}

// ====================
//   Storage: config
// ====================

function cargarConfigDesdeStorage() {
  const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (!raw) {
    return Object.assign({}, DEFAULT_CONFIG);
  }

  try {
    const data = JSON.parse(raw) || {};
    const cfg = Object.assign({}, DEFAULT_CONFIG, data);

    if (cfg.tema !== 'oscuro' && cfg.tema !== 'claro') {
      cfg.tema = DEFAULT_CONFIG.tema;
    }

    if (!cfg.monedaSimbolo || typeof cfg.monedaSimbolo !== 'string') {
      cfg.monedaSimbolo = DEFAULT_CONFIG.monedaSimbolo;
    }

    cfg.abrirTablaAlInicio = !!cfg.abrirTablaAlInicio;
    cfg.abrirFiltrosAlInicio = !!cfg.abrirFiltrosAlInicio;
    cfg.abrirModalAlInicio = !!cfg.abrirModalAlInicio;

    return cfg;
  } catch (error) {
    console.error('Error al leer configuración de localStorage:', error);
    return Object.assign({}, DEFAULT_CONFIG);
  }
}

function guardarConfigEnStorage(cfg) {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
}

function aplicarConfigTema() {
  const tema = config && config.tema === 'oscuro' ? 'oscuro' : 'claro';
  if (tema === 'oscuro') {
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
}

function abrirModalConfig() {
  if (!config) {
    config = Object.assign({}, DEFAULT_CONFIG);
  }

  if (selectConfigTema) {
    selectConfigTema.value = config.tema === 'oscuro' ? 'oscuro' : 'claro';
    refrescarSelectMaterialize(selectConfigTema);
  }

  if (inputConfigMoneda) {
    inputConfigMoneda.value =
      config.monedaSimbolo || DEFAULT_CONFIG.monedaSimbolo;
  }

  if (chkConfigAbrirTabla) {
    chkConfigAbrirTabla.checked = !!config.abrirTablaAlInicio;
  }
  if (chkConfigAbrirFiltros) {
    chkConfigAbrirFiltros.checked = !!config.abrirFiltrosAlInicio;
  }
  if (chkConfigAbrirModal) {
    chkConfigAbrirModal.checked = !!config.abrirModalAlInicio;
  }

  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }

  if (modalConfigInstance) {
    modalConfigInstance.open();
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
  const abrirFiltros = chkConfigAbrirFiltros ? chkConfigAbrirFiltros.checked : false;
  const abrirModal = chkConfigAbrirModal ? chkConfigAbrirModal.checked : false;

  config = {
    tema: nuevoTema,
    monedaSimbolo: nuevoSimbolo,
    abrirTablaAlInicio: abrirTabla,
    abrirFiltrosAlInicio: abrirFiltros,
    abrirModalAlInicio: abrirModal
  };

  guardarConfigEnStorage(config);
  aplicarConfigTema();
  aplicarConfigMoneda();
  renderizarMovimientos();

  setFiltrosVisible(config.abrirFiltrosAlInicio);
  setTablaVisible(config.abrirTablaAlInicio);

  if (modalConfigInstance) {
    modalConfigInstance.close();
  }

  mostrarMensaje('Configuración guardada.');
}

// ====================
//   Helpers / modelo
// ====================

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

function mostrarMensaje(mensaje) {
  if (window.M && M.toast) {
    M.toast({ html: mensaje });
  } else {
    alert(mensaje);
  }
}

function obtenerTipoSeleccionadoActual() {
  if (!radiosTipoMovimiento) return null;
  for (let i = 0; i < radiosTipoMovimiento.length; i++) {
    if (radiosTipoMovimiento[i].checked) {
      return radiosTipoMovimiento[i].value;
    }
  }
  return null;
}

function mantenerLabelFechaActiva() {
  const labelFecha = document.querySelector('label[for="fecha"]');
  if (labelFecha) {
    labelFecha.classList.add('active');
  }
}

function formatearFechaInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function obtenerRangoMesActual() {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = hoy.getMonth();

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);

  return {
    desde: formatearFechaInput(primerDia),
    hasta: formatearFechaInput(ultimoDia)
  };
}

function obtenerRangoAnioActual() {
  const hoy = new Date();
  const year = hoy.getFullYear();

  const primerDia = new Date(year, 0, 1);
  const ultimoDia = new Date(year, 11, 31);

  return {
    desde: formatearFechaInput(primerDia),
    hasta: formatearFechaInput(ultimoDia)
  };
}

function obtenerRangoUltimosDias(dias) {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(hoy.getDate() - (dias - 1));

  return {
    desde: formatearFechaInput(desde),
    hasta: formatearFechaInput(hoy)
  };
}

function obtenerRangoSemanaActual() {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  return {
    desde: formatearFechaInput(lunes),
    hasta: formatearFechaInput(domingo)
  };
}

// ====================
//       Filtros
// ====================

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

  if (selectFiltroPeriodo) {
    selectFiltroPeriodo.value = 'mes-actual';
  }
  if (inputFiltroFechaDesde) {
    inputFiltroFechaDesde.value = filtros.fechaDesde;
  }
  if (inputFiltroFechaHasta) {
    inputFiltroFechaHasta.value = filtros.fechaHasta;
  }
  if (selectFiltroTipo) {
    selectFiltroTipo.value = 'TODOS';
  }
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

  if (periodo === 'mes-actual') {
    rango = obtenerRangoMesActual();
  } else if (periodo === 'semana-actual') {
    rango = obtenerRangoSemanaActual();
  } else if (periodo === 'anio-actual') {
    rango = obtenerRangoAnioActual();
  } else if (periodo === 'ultimos-30') {
    rango = obtenerRangoUltimosDias(30);
  } else if (periodo === 'todo') {
    rango = null;
  }

  filtros.periodo = periodo;

  if (rango) {
    filtros.fechaDesde = rango.desde;
    filtros.fechaHasta = rango.hasta;

    if (inputFiltroFechaDesde) {
      inputFiltroFechaDesde.value = filtros.fechaDesde;
    }
    if (inputFiltroFechaHasta) {
      inputFiltroFechaHasta.value = filtros.fechaHasta;
    }
  } else {
    filtros.fechaDesde = null;
    filtros.fechaHasta = null;

    if (inputFiltroFechaDesde) {
      inputFiltroFechaDesde.value = '';
    }
    if (inputFiltroFechaHasta) {
      inputFiltroFechaHasta.value = '';
    }
  }
}

function obtenerFiltrosDesdeUI() {
  const periodo = selectFiltroPeriodo
    ? selectFiltroPeriodo.value || 'mes-actual'
    : 'mes-actual';

  const fechaDesde = inputFiltroFechaDesde && inputFiltroFechaDesde.value
    ? inputFiltroFechaDesde.value
    : null;

  const fechaHasta = inputFiltroFechaHasta && inputFiltroFechaHasta.value
    ? inputFiltroFechaHasta.value
    : null;

  const tipo = selectFiltroTipo
    ? selectFiltroTipo.value || 'TODOS'
    : 'TODOS';

  const categoria = selectFiltroCategoria
    ? selectFiltroCategoria.value || 'TODAS'
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
    if (f.categoria && f.categoria !== 'TODAS' && mov.categoria !== f.categoria) {
      return false;
    }
    if (typeof f.montoMin === 'number' && mov.monto < f.montoMin) return false;
    if (typeof f.montoMax === 'number' && mov.monto > f.montoMax) return false;

    return true;
  });
}

// Visibilidad de secciones

function setFiltrosVisible(visible) {
  const section = document.getElementById('section-filtros');
  if (!section) return;

  if (visible) {
    section.classList.remove('hide');
  } else {
    section.classList.add('hide');
  }

  // Si el botón central existe, actualizamos su texto (en caso de que lo vuelvas a usar)
  if (btnToggleFiltros) {
    btnToggleFiltros.innerHTML = visible
      ? '<i class="material-icons left">filter_list</i> Ocultar filtros'
      : '<i class="material-icons left">filter_list</i> Mostrar filtros';
  }
}

function setTablaVisible(visible) {
  const section = document.getElementById('section-tabla');
  if (!section) return;

  if (visible) {
    section.classList.remove('hide');
  } else {
    section.classList.add('hide');
  }

  // Igual que arriba: solo si el botón existe
  if (btnToggleTabla) {
    btnToggleTabla.innerHTML = visible
      ? '<i class="material-icons left">list</i> Ocultar movimientos'
      : '<i class="material-icons left">list</i> Mostrar movimientos';
  }
}

// ====================
//       Render
// ====================

function refrescarSelectMaterialize(selectEl) {
  if (!window.M || !M.FormSelect || !selectEl) return;

  const instancia = M.FormSelect.getInstance(selectEl);
  if (instancia && instancia.destroy) {
    instancia.destroy();
  }
  M.FormSelect.init(selectEl);
}

function renderizarCategoriasSelect(tipoSeleccionado) {
  if (!selectCategoriaMovimiento) return;

  const tipo = tipoSeleccionado || obtenerTipoSeleccionadoActual();

  selectCategoriaMovimiento.innerHTML =
    '<option value="" disabled selected>Elige una categoría</option>';

  if (!tipo || !categorias[tipo]) {
    refrescarSelectMaterialize(selectCategoriaMovimiento);
    return;
  }

  categorias[tipo].forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    selectCategoriaMovimiento.appendChild(option);
  });

  refrescarSelectMaterialize(selectCategoriaMovimiento);
}

function obtenerTodasLasCategoriasOrdenadas() {
  const set = new Set();

  if (categorias.INGRESO) {
    categorias.INGRESO.forEach(function (cat) {
      set.add(cat);
    });
  }

  if (categorias.GASTO) {
    categorias.GASTO.forEach(function (cat) {
      set.add(cat);
    });
  }

  const lista = Array.from(set);
  lista.sort(function (a, b) {
    return a.localeCompare(b);
  });
  return lista;
}

function renderizarOpcionesFiltroCategoria() {
  if (!selectFiltroCategoria) return;

  const todas = obtenerTodasLasCategoriasOrdenadas();

  selectFiltroCategoria.innerHTML =
    '<option value="TODAS" selected>Todas</option>';

  todas.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    selectFiltroCategoria.appendChild(option);
  });

  selectFiltroCategoria.value = filtros.categoria || 'TODAS';

  refrescarSelectMaterialize(selectFiltroCategoria);
}

function renderizarMovimientos() {
  if (!tablaBody) return;

  tablaBody.innerHTML = '';

  const lista = obtenerMovimientosFiltrados();

  if (!lista.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
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
    tdTipo.classList.add(mov.tipo === 'INGRESO' ? 'green-text' : 'red-text');
    tr.appendChild(tdTipo);

    const tdCategoria = document.createElement('td');
    tdCategoria.textContent = mov.categoria;
    tr.appendChild(tdCategoria);

    const tdMonto = document.createElement('td');
    tdMonto.textContent = simbolo + ' ' + mov.monto.toFixed(2);
    tdMonto.classList.add('right-align');
    tr.appendChild(tdMonto);

    const tdNota = document.createElement('td');
    tdNota.textContent = mov.nota || '';
    tr.appendChild(tdNota);

    const tdAcciones = document.createElement('td');
    tdAcciones.classList.add('no-print', 'actions-cell');

    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className =
      'btn-small blue lighten-1 waves-effect waves-light btn-editar';
    btnEditar.dataset.id = String(mov.id);
    btnEditar.innerHTML = '<i class="material-icons">edit</i>';
    tdAcciones.appendChild(btnEditar);

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className =
      'btn-small red lighten-1 waves-effect waves-light btn-eliminar';
    btnEliminar.dataset.id = String(mov.id);
    btnEliminar.innerHTML = '<i class="material-icons">delete</i>';
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
}

// ====================
//  Formulario / modal
// ====================

function limpiarFormularioMovimiento() {
  movimientoEnEdicion = null;

  if (formMovimiento) {
    formMovimiento.reset();
  }

  if (btnGuardarMovimiento) {
    btnGuardarMovimiento.innerHTML =
      'Agregar movimiento <i class="material-icons right">add</i>';
  }

  if (modalMovimientoTitulo) {
    modalMovimientoTitulo.textContent = 'Nuevo movimiento';
  }

  mantenerLabelFechaActiva();
  renderizarCategoriasSelect(null);

  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }
}

function abrirModalNuevoMovimiento() {
  limpiarFormularioMovimiento();
  if (modalMovimientoInstance) {
    modalMovimientoInstance.open();
  }
}

function manejarSubmitMovimiento(event) {
  event.preventDefault();

  const fecha = inputFecha ? inputFecha.value : '';
  const tipoSeleccionado = obtenerTipoSeleccionadoActual();
  const categoria = selectCategoriaMovimiento ? selectCategoriaMovimiento.value : '';
  const montoValor = inputMonto ? inputMonto.value : '';
  const monto = parseFloat(montoValor);
  const nota = inputNota ? inputNota.value.trim() : '';

  if (!fecha) {
    mostrarMensaje('La fecha es obligatoria.');
    return;
  }

  if (!tipoSeleccionado) {
    mostrarMensaje('Selecciona si es ingreso o gasto.');
    return;
  }

  if (!categoria) {
    mostrarMensaje('Selecciona una categoría.');
    return;
  }

  if (!montoValor || Number.isNaN(monto) || monto <= 0) {
    mostrarMensaje('El monto debe ser un número mayor a 0.');
    return;
  }

  if (movimientoEnEdicion) {
    movimientoEnEdicion.fecha = fecha;
    movimientoEnEdicion.tipo = tipoSeleccionado;
    movimientoEnEdicion.categoria = categoria;
    movimientoEnEdicion.monto = monto;
    movimientoEnEdicion.nota = nota;

    mostrarMensaje('Movimiento actualizado.');
  } else {
    const nuevoMovimiento = {
      id: nextId++,
      fecha: fecha,
      tipo: tipoSeleccionado,
      categoria: categoria,
      monto: monto,
      nota: nota
    };

    movimientos.push(nuevoMovimiento);
    mostrarMensaje('Movimiento agregado.');
  }

  guardarMovimientosEnStorage();
  renderizarMovimientos();
  actualizarResumen();

  if (modalMovimientoInstance) {
    modalMovimientoInstance.close();
  }
}

function iniciarEdicionMovimiento(id) {
  const mov = movimientos.find(function (m) {
    return m.id === id;
  });

  if (!mov) return;

  movimientoEnEdicion = mov;

  if (modalMovimientoTitulo) {
    modalMovimientoTitulo.textContent = 'Editar movimiento';
  }

  if (inputFecha) {
    inputFecha.value = mov.fecha;
  }

  if (radiosTipoMovimiento && radiosTipoMovimiento.length) {
    radiosTipoMovimiento.forEach(function (radio) {
      radio.checked = radio.value === mov.tipo;
    });
  }

  renderizarCategoriasSelect(mov.tipo);

  if (selectCategoriaMovimiento) {
    selectCategoriaMovimiento.value = mov.categoria;
    refrescarSelectMaterialize(selectCategoriaMovimiento);
  }

  if (inputMonto) {
    inputMonto.value = mov.monto.toString();
  }

  if (inputNota) {
    inputNota.value = mov.nota || '';
  }

  if (btnGuardarMovimiento) {
    btnGuardarMovimiento.innerHTML =
      'Guardar cambios <i class="material-icons right">save</i>';
  }

  if (window.M && M.updateTextFields) {
    M.updateTextFields();
  }

  if (modalMovimientoInstance) {
    modalMovimientoInstance.open();
  }
}

// ====================
//        Eliminar
// ====================

function abrirModalEliminar(id) {
  const mov = movimientos.find(function (m) {
    return m.id === id;
  });
  if (!mov) return;

  movimientoAEliminar = mov;

  const elFecha = document.getElementById('modal-eliminar-fecha');
  const elTipo = document.getElementById('modal-eliminar-tipo');
  const elCat = document.getElementById('modal-eliminar-categoria');
  const elMonto = document.getElementById('modal-eliminar-monto');
  const elNota = document.getElementById('modal-eliminar-nota');

  if (elFecha) elFecha.textContent = mov.fecha;
  if (elTipo) elTipo.textContent = mov.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto';
  if (elCat) elCat.textContent = mov.categoria;
  if (elMonto) elMonto.textContent = mov.monto.toFixed(2);
  if (elNota) elNota.textContent = mov.nota || '';
  if (modalEliminarMonedaEl) {
    modalEliminarMonedaEl.textContent = obtenerSimboloMoneda();
  }

  if (modalEliminarInstance) {
    modalEliminarInstance.open();
  }
}

function eliminarMovimiento(id) {
  const index = movimientos.findIndex(function (mov) {
    return mov.id === id;
  });

  if (index === -1) return;

  movimientos.splice(index, 1);
  guardarMovimientosEnStorage();
  renderizarMovimientos();
  actualizarResumen();
  mostrarMensaje('Movimiento eliminado.');

  if (movimientoEnEdicion && movimientoEnEdicion.id === id) {
    limpiarFormularioMovimiento();
  }
}

// ====================
//   Backup / CSV
// ====================

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

function obtenerFechaHoyYYYYMMDD() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, '0');
  const d = String(hoy.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

// Exportar backup JSON (incluye config)
function exportarBackupJSON() {
  const backup = {
    version: 1,
    fecha_exportacion: new Date().toISOString(),
    movimientos: movimientos,
    categorias: categorias,
    config: config
  };

  const contenido = JSON.stringify(backup, null, 2);
  const nombre =
    'backup-finanzas-' + obtenerFechaHoyYYYYMMDD() + '.json';

  descargarArchivo(nombre, contenido, 'application/json;charset=utf-8;');
  mostrarMensaje('Backup exportado.');
}

// Importar backup JSON

function manejarArchivoBackupSeleccionado(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const texto = ev.target.result;
      const data = JSON.parse(texto);
      importarBackupDesdeObjeto(data);
    } catch (error) {
      console.error('Error al leer backup:', error);
      mostrarMensaje('El archivo no es un backup válido.');
    } finally {
      if (inputImportarBackup) {
        inputImportarBackup.value = '';
      }
    }
  };

  reader.readAsText(file);
}

function importarBackupDesdeObjeto(data) {
  if (!data || typeof data !== 'object') {
    mostrarMensaje('Formato de backup no válido.');
    return;
  }

  const nuevosMovimientosRaw = Array.isArray(data.movimientos)
    ? data.movimientos
    : null;

  if (!nuevosMovimientosRaw) {
    mostrarMensaje('El backup no contiene movimientos válidos.');
    return;
  }

  const nuevosMovimientos = nuevosMovimientosRaw.map(function (mov) {
    return {
      id: Number(mov.id),
      fecha: String(mov.fecha),
      tipo: String(mov.tipo),
      categoria: String(mov.categoria),
      monto: Number(mov.monto),
      nota: mov.nota ? String(mov.nota) : ''
    };
  });

  let nuevasCategorias;
  const categoriasRaw = data.categorias;

  if (
    categoriasRaw &&
    typeof categoriasRaw === 'object' &&
    !Array.isArray(categoriasRaw)
  ) {
    nuevasCategorias = normalizarCategorias(categoriasRaw);
  } else if (Array.isArray(categoriasRaw)) {
    nuevasCategorias = {
      INGRESO: DEFAULT_CATEGORIES.INGRESO.slice(),
      GASTO: categoriasRaw.map(String)
    };
  } else {
    nuevasCategorias = clonarCategorias(DEFAULT_CATEGORIES);
  }

  let nuevaConfig = config;
  if (data.config && typeof data.config === 'object') {
    nuevaConfig = Object.assign({}, DEFAULT_CONFIG, data.config);
  }

  movimientos = nuevosMovimientos;
  categorias = nuevasCategorias;
  config = nuevaConfig || config || Object.assign({}, DEFAULT_CONFIG);

  guardarMovimientosEnStorage();
  guardarCategoriasEnStorage(categorias);
  guardarConfigEnStorage(config);

  calcularSiguienteId();
  inicializarEstadoFiltros();
  aplicarConfigTema();
  aplicarConfigMoneda();
  renderizarOpcionesFiltroCategoria();
  renderizarMovimientos();
  actualizarResumen();

  mostrarMensaje('Backup importado correctamente.');
}

// CSV (usa movimientos filtrados)

function exportarCSV() {
  const lista = obtenerMovimientosFiltrados();

  const encabezado = 'fecha,tipo,categoria,monto,nota';
  const lineas = [encabezado];

  lista.forEach(function (mov) {
    const fecha = mov.fecha;
    const tipo = mov.tipo;
    const categoria = (mov.categoria || '').replace(/"/g, '""');
    const nota = (mov.nota || '').replace(/"/g, '""');
    const monto = mov.monto.toFixed(2);

    const linea =
      fecha +
      ',' +
      tipo +
      ',' +
      '"' + categoria + '",' +
      monto +
      ',' +
      '"' + nota + '"';

    lineas.push(linea);
  });

  const csv = lineas.join('\n');
  const nombre =
    'movimientos-finanzas-' + obtenerFechaHoyYYYYMMDD() + '.csv';

  descargarArchivo(nombre, csv, 'text/csv;charset=utf-8;');
  mostrarMensaje('CSV exportado.');
}
