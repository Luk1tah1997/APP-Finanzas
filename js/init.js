// init.js - Cacheo de DOM, eventos y bootstrap de la app
'use strict';

//#region MÓDULO: Init + Eventos
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
  if (typeof renderizarDashboard === 'function') {
    renderizarDashboard();
  }
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

  // Render inicial del calendario para asegurar contenido al abrir la vista
  if (typeof renderizarCalendario === 'function') {
    renderizarCalendario();
  }

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
  inputConfigTasaUSD = document.getElementById('config-tasa-usd');
  inputConfigTasaEUR = document.getElementById('config-tasa-eur');

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
      if (typeof renderizarCalendario === 'function') {
        renderizarCalendario();
      }
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
      // FIX navegacion herramientas: orden consistente al hacer clic en sidenav
      e.preventDefault();
      setHerramientasVisible(true);
      const preferidaClick = (config && config.herramientaPreferida) ? config.herramientaPreferida : 'presupuesto';
      seleccionarHerramienta(preferidaClick);
      const section = sectionHerramientas || document.getElementById('section-herramientas');
      if (section && section.scrollIntoView) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      cerrarSidenav();
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
    const selects = document.querySelectorAll('select');
    if (selects && selects.length) initMaterializeSelect(selects);
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

//#endregion MÓDULO: Init + Eventos

