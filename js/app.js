// app.js
// SPA finanzas personales - V2.1 con dashboard y gráficos

'use strict';

// ====================
//   Constantes / estado
// ====================

// Claves de localStorage
const STORAGE_KEYS = {
  MOVIMIENTOS: 'finanzas_movimientos',
  CATEGORIAS: 'finanzas_categorias',
  CONFIG: 'finanzas_config',
  CATEGORIA_ICONOS: 'finanzas_categoria_iconos'
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
  mostrarIconosCategorias: true
};

// Instancias de gráficos (Chart.js)
let chartIngresosGastos = null;
let chartGastosPorCategoria = null;
let chartBalanceTiempo = null;

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
  montoMin: null,
  montoMax: null
};

// Movimiento en edición / eliminación
let movimientoEnEdicion = null;
let movimientoEnEliminacion = null;

// ID incremental
let nextId = 1;

// ====================
//   Referencias DOM
// ====================

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

let chkConfigMostrarIconos;

// Resumen símbolos
let resumenSimboloIngresosEl;
let resumenSimboloGastosEl;
let resumenSimboloBalanceEl;

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

// Sidenav DOM
let navToggleFiltros;
let navToggleTabla;
let navDashboard;
let navExportarBackup;
let navImportarBackup;
let navExportarCSV;
let navImprimir;
let btnSidenavToggle;

// Instancias de Materialize
let modalMovimientoInstance;
let modalEliminarInstance;
let modalConfigInstance;
let sidenavInstance;

// referencias dom categorías
let sectionCategorias;
let listaCategoriasIngresoEl;
let listaCategoriasGastoEl;
let formCategoria;
let selectCategoriaTipo;
let inputCategoriaNombre;
let navCategorias;

// ====================
//   Utilidades varias
// ====================

function mostrarMensaje(mensaje) {
  if (window.M && M.toast) {
    M.toast({ html: mensaje });
  } else {
    alert(mensaje);
  }
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
        nota: mov.nota || ''
      };
    });
  } catch (e) {
    console.error('Error cargando movimientos desde localStorage:', e);
    return [];
  }
}

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

function cargarCategoriaIconosDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIA_ICONOS);
    if (!raw) {
      // si no hay nada, arrancamos con defaults
      return clonarDefaultIconosCategorias();
    }
    const obj = JSON.parse(raw);
    const ingreso = obj.INGRESO && typeof obj.INGRESO === 'object' ? obj.INGRESO : {};
    const gasto = obj.GASTO && typeof obj.GASTO === 'object' ? obj.GASTO : {};
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

function clonarDefaultIconosCategorias() {
  return {
    INGRESO: { ...DEFAULT_ICONOS_CATEGORIAS.INGRESO },
    GASTO: { ...DEFAULT_ICONOS_CATEGORIAS.GASTO }
  };
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

function asegurarIconosParaCategoriasExistentes() {
  ['INGRESO', 'GASTO'].forEach(function (tipo) {
    if (!categoriaIconos[tipo]) {
      categoriaIconos[tipo] = {};
    }
    (categorias[tipo] || []).forEach(function (cat) {
      if (!categoriaIconos[tipo][cat]) {
        const iconDefault = DEFAULT_ICONOS_CATEGORIAS[tipo][cat];
        categoriaIconos[tipo][cat] = iconDefault || (tipo === 'INGRESO' ? 'trending_up' : 'trending_down');
      }
    });
  });
  guardarCategoriaIconosEnStorage(categoriaIconos);
}

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
          : DEFAULT_CONFIG.mostrarIconosCategorias
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
//   Config / tema
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
}

function poblarConfigEnUI() {
  if (!config) return;

  // Tema
  if (selectConfigTema) {
    selectConfigTema.value = config.tema === 'oscuro' ? 'oscuro' : 'claro';
    refrescarSelectMaterialize(selectConfigTema);
  }

  // Moneda (select con opciones predefinidas)
  if (inputConfigMoneda) {
    const simboloActual =
      config.monedaSimbolo || DEFAULT_CONFIG.monedaSimbolo;

    // si la opción no existe, usamos el default
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
  if (chkConfigMostrarIconos) {
  chkConfigMostrarIconos.checked =
    typeof config.mostrarIconosCategorias === 'boolean'
      ? config.mostrarIconosCategorias
      : true;
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

  config = {
    tema: nuevoTema,
    monedaSimbolo: nuevoSimbolo,
    abrirTablaAlInicio: abrirTabla,
    abrirFiltrosAlInicio: abrirFiltros,
    abrirDashboardAlInicio: abrirDashboard,
    abrirModalAlInicio: abrirModal,
    mostrarIconosCategorias: mostrarIconos
  };

  guardarConfigEnStorage(config);
  aplicarConfigTema();
  aplicarConfigMoneda();
  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();
  renderizarMovimientos();
  actualizarResumen();

  setFiltrosVisible(config.abrirFiltrosAlInicio);
  setTablaVisible(config.abrirTablaAlInicio);
  setDashboardVisible(config.abrirDashboardAlInicio);

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
  btnEditar.className = 'btn-flat btn-small waves-effect btn-renombrar-categoria';
  btnEditar.innerHTML = '<i class="material-icons">edit</i>';
  acciones.appendChild(btnEditar);

  const btnEliminar = document.createElement('a');
  btnEliminar.href = '#!';
  btnEliminar.className = 'btn-flat btn-small waves-effect btn-eliminar-categoria';
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

// ====================
//    Inicialización
// ====================

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

  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();

  renderizarMovimientos();
  actualizarResumen();

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
  selectCategoriaMovimiento = document.getElementById('categoria');
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

  btnOpenModalMovimiento = document.getElementById('btn-open-modal-movimiento');
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
  btnGuardarConfig = document.getElementById('btn-guardar-config');
  btnOpenConfigModal = document.getElementById('btn-open-config-modal');
  chkConfigMostrarIconos = document.getElementById('config-mostrar-iconos');

  // Items del menú lateral
  navToggleFiltros = document.getElementById('nav-toggle-filtros');
  navToggleTabla = document.getElementById('nav-toggle-tabla');
  navDashboard = document.getElementById('nav-dashboard');
  navExportarBackup = document.getElementById('nav-exportar-backup');
  navImportarBackup = document.getElementById('nav-importar-backup');
  navExportarCSV = document.getElementById('nav-exportar-csv');
  navImprimir = document.getElementById('nav-imprimir');
  btnSidenavToggle = document.getElementById('btn-sidenav-toggle');

  // referencias dom categorías
  sectionCategorias = document.getElementById('section-categorias');
  listaCategoriasIngresoEl = document.getElementById('lista-categorias-ingreso');
  listaCategoriasGastoEl = document.getElementById('lista-categorias-gasto');
  formCategoria = document.getElementById('form-categoria');
  selectCategoriaTipo = document.getElementById('categoria-tipo');
  inputCategoriaNombre = document.getElementById('categoria-nombre');

  navCategorias = document.getElementById('nav-categorias');

}

// ====================
//   Eventos
// ====================

function configurarEventos() {
  if (formMovimiento) {
    formMovimiento.addEventListener('submit', manejarSubmitMovimiento);
  }
  
  if (btnSidenavToggle) {
    btnSidenavToggle.addEventListener(
      'click',
      function (e) {
        if (!sidenavInstance) return;

        e.preventDefault();
        // Evitamos que el handler interno de Materialize vuelva a abrir/cerrar
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
      true // captura, para correr antes que el listener de Materialize
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

  if (formCategoria) {
    formCategoria.addEventListener('submit', manejarSubmitCategoria);
  }

  if (listaCategoriasIngresoEl) {
    listaCategoriasIngresoEl.addEventListener('click', manejarClickListaCategorias);
  }
  if (listaCategoriasGastoEl) {
    listaCategoriasGastoEl.addEventListener('click', manejarClickListaCategorias);
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

  if (btnOpenModalMovimiento) {
    btnOpenModalMovimiento.addEventListener('click', abrirModalNuevoMovimiento);
  }
  if (fabNuevoMov) {
    fabNuevoMov.addEventListener('click', abrirModalNuevoMovimiento);
  }

  if (btnExportarBackup) {
    btnExportarBackup.addEventListener('click', exportarBackupJSON);
  }
  if (btnImportarBackup) {
    btnImportarBackup.addEventListener('click', function () {
      if (inputImportarBackup) {
        inputImportarBackup.value = '';
        inputImportarBackup.click();
      }
    });
  }
  if (inputImportarBackup) {
    inputImportarBackup.addEventListener('change', manejarImportarBackup);
  }

  if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', exportarCSV);
  }
  if (btnImprimir) {
    btnImprimir.addEventListener('click', function () {
      window.print();
    });
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

  // NUEVO: cuando cambia Ingreso/Gasto, recargamos categorías del modal
  if (radiosTipoMovimiento && radiosTipoMovimiento.length) {
    radiosTipoMovimiento.forEach(function (radio) {
      radio.addEventListener('change', function () {
        renderizarCategoriasSelect(null);
      });
    });
  }
}


function inicializarMaterialize() {
  // Inicializamos componentes de Materialize de forma defensiva. Si uno falla,
  // capturamos el error y continuamos para no dejar otros componentes sin iniciar.
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
        // Puede devolver un array o una instancia según el input; normalizamos
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
    if (window.M && M.updateTextFields) {
      M.updateTextFields();
    }
  } catch (err) {
    console.error('Error llamando M.updateTextFields():', err);
  }
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

  const nombre = nombreRaw; // podés normalizar, pero mantenemos simple

  if ((categorias[tipo] || []).includes(nombre)) {
    mostrarMensaje('Esa categoría ya existe en ' + (tipo === 'INGRESO' ? 'Ingresos' : 'Gastos') + '.');
    return;
  }

  categorias[tipo].push(nombre);
  asegurarIconosParaCategoriasExistentes();
  guardarCategoriasEnStorage(categorias);
  guardarCategoriaIconosEnStorage(categoriaIconos);

  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();

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
  const nuevoNombre = window.prompt('Nuevo nombre para la categoría:', nombreActual);
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

  // Icono: movemos el valor
  const iconoActual = categoriaIconos[tipo] && categoriaIconos[tipo][nombreActual];
  if (!categoriaIconos[tipo]) categoriaIconos[tipo] = {};
  if (iconoActual) {
    categoriaIconos[tipo][nombreTrim] = iconoActual;
  } else {
    categoriaIconos[tipo][nombreTrim] = obtenerIconoCategoria(tipo, nombreTrim);
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

  mostrarMensaje('Categoría renombrada.');
}
function eliminarCategoria(tipo, nombre) {
  const enUso = movimientos.filter(function (mov) {
    return mov.categoria === nombre && mov.tipo === tipo;
  });

  if (enUso.length > 0) {
    const confirma = window.confirm(
      'La categoría "' + nombre + '" se usa en ' + enUso.length +
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

  mostrarMensaje('Categoría eliminada.');
}

// ====================
//   Render principal
// ====================

function renderizarCategoriasSelect(valorSeleccionado) {
  if (!selectCategoriaMovimiento) return;

  selectCategoriaMovimiento.innerHTML = '';

  const tipoSeleccionado =
    radiosTipoMovimiento && radiosTipoMovimiento.length
      ? Array.prototype.find.call(radiosTipoMovimiento, function (radio) {
          return radio.checked;
        })?.value || 'INGRESO'
      : 'INGRESO';

  const listaCategorias = categorias[tipoSeleccionado] || [];

  listaCategorias.forEach(function (cat) {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    if (valorSeleccionado && valorSeleccionado === cat) {
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
  ).sort();

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
    tr.appendChild(tdTipo);

    const tdCategoria = document.createElement('td');
    if (config && config.mostrarIconosCategorias) {
      const badge = crearBadgeCategoria(mov.tipo, mov.categoria || '-');
      tdCategoria.appendChild(badge);
    } else {
      tdCategoria.textContent = mov.categoria || '-';
    }
    tr.appendChild(tdCategoria);

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
    btnEditar.className = 'btn-small waves-effect waves-light teal btn-editar';
    btnEditar.dataset.id = mov.id;
    btnEditar.textContent = 'Editar';

    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-small waves-effect waves-light red btn-eliminar';
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

  // Mantener dashboard sincronizado
  renderizarDashboard();
}

// ====================
//  Dashboard / estadísticas
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

// Calcula estadísticas del dashboard
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

// Construye la serie de balance acumulado por fecha
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

  const fechas = Object.keys(netoPorFecha).sort(); // YYYY-MM-DD ordena bien

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

// Renderiza dashboard
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

  // Gráfico de barras: Ingresos vs Gastos
  actualizarChartIngresosGastos(
    stats.totalIngresos,
    stats.totalGastos,
    simbolo
  );

  // Movimientos filtrados del período
  const listaFiltrada = obtenerMovimientosFiltrados();

  // Gráfico de línea: balance en el tiempo
  actualizarChartBalanceTiempo(listaFiltrada, simbolo);

  // Gráfico de torta: distribución de gastos por categoría
  actualizarChartGastosPorCategoria(listaFiltrada);
}

// Gráfico barras Ingresos vs Gastos
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

// Gráfico doughnut de gastos por categoría
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
// Gráfico de línea: balance acumulado en el tiempo
function actualizarChartBalanceTiempo(listaMovimientos, simbolo) {
  const canvas = document.getElementById('chart-line-balance-tiempo');
  if (!canvas || typeof Chart === 'undefined') {
    return;
  }

  const serie = construirSerieBalancePorFecha(listaMovimientos);

  // Si no hay datos, destruimos el gráfico si existía y salimos
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

// ====================
//  Formulario / modal
// ====================

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

  renderizarCategoriasSelect(null);

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
  const nota = inputNota ? inputNota.value.trim() : '';

  if (!fecha) {
    mostrarMensaje('La fecha es obligatoria.');
    return;
  }

  const monto = parseFloat(montoStr);
  if (Number.isNaN(monto) || monto < 0) {
    mostrarMensaje('El monto debe ser un número válido mayor o igual a 0.');
    return;
  }

  if (!categoria) {
    mostrarMensaje('Selecciona una categoría.');
    return;
  }

  if (movimientoEnEdicion) {
    movimientoEnEdicion.fecha = fecha;
    movimientoEnEdicion.tipo = tipo;
    movimientoEnEdicion.categoria = categoria;
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

  renderizarCategoriasSelect(mov.categoria);

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
  if (spanTipo) spanTipo.textContent =
    mov.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto';
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
    if (f.categoria && f.categoria !== 'TODAS' && mov.categoria !== f.categoria)
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

function setCategoriasVisible(visible) {
  if (!sectionCategorias) return;
  if (visible) sectionCategorias.classList.remove('hide');
  else sectionCategorias.classList.add('hide');
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

// ====================
//   Backup / export
// ====================

function exportarBackupJSON() {
  const data = {
    version: 2,
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
          nota: mov.nota || ''
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

      setFiltrosVisible(config.abrirFiltrosAlInicio);
      setTablaVisible(config.abrirTablaAlInicio);
      setDashboardVisible(
        typeof config.abrirDashboardAlInicio === 'boolean'
          ? config.abrirDashboardAlInicio
          : true
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
  lineas.push('fecha,tipo,categoria,monto,nota');

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
      '"' +
      categoria +
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
