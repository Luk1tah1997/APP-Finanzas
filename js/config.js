// config.js - Configuración de la app
'use strict';

//#region MÓDULO: Config
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

    const tasas = (cfg.tasasDivisas && typeof cfg.tasasDivisas === 'object') ? cfg.tasasDivisas : {};
    const tasaUSD = typeof tasas.USD === 'number' && tasas.USD > 0 ? tasas.USD : DEFAULT_CONFIG.tasasDivisas.USD;
    const tasaEUR = typeof tasas.EUR === 'number' && tasas.EUR > 0 ? tasas.EUR : DEFAULT_CONFIG.tasasDivisas.EUR;

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
          : DEFAULT_CONFIG.mostrarGraficoFormaPago,
      tasasDivisas: { USD: tasaUSD, EUR: tasaEUR }
    };
  } catch (e) {
    console.error('Error cargando config desde localStorage:', e);
    return { ...DEFAULT_CONFIG };
  }
}

// Inicializa selects de Materialize y maneja el blur del modal de configuración
function initMaterializeSelect(selectElems) {
  if (!window.M || !M.FormSelect) return;

  var options = {
    onOpenStart: function () {
      var modalConfigEl = document.getElementById('modal-config');
      if (modalConfigEl) {
        modalConfigEl.classList.add('blur-select-open');
      }
    },
    onCloseEnd: function () {
      var modalConfigEl = document.getElementById('modal-config');
      if (modalConfigEl) {
        modalConfigEl.classList.remove('blur-select-open');
      }
    }
  };

  // Si no me pasan nada, inicializo todos los <select>
  if (!selectElems) {
    selectElems = document.querySelectorAll('select');
  }

  M.FormSelect.init(selectElems, options);
}

// Refresca un <select> de Materialize cuando cambiamos su valor por JS
function refrescarSelectMaterialize(selectElem) {
  if (!window.M || !M.FormSelect || !selectElem) return;

  const instance = M.FormSelect.getInstance(selectElem);
  if (instance) {
    instance.destroy();
  }
  initMaterializeSelect(selectElem);
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

  // Tasas de divisas
  if (inputConfigTasaUSD) {
    inputConfigTasaUSD.value = (config.tasasDivisas && config.tasasDivisas.USD) ? String(config.tasasDivisas.USD) : String(DEFAULT_CONFIG.tasasDivisas.USD);
  }
  if (inputConfigTasaEUR) {
    inputConfigTasaEUR.value = (config.tasasDivisas && config.tasasDivisas.EUR) ? String(config.tasasDivisas.EUR) : String(DEFAULT_CONFIG.tasasDivisas.EUR);
  }
  if (window.M && M.updateTextFields) {
    M.updateTextFields();
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

  // Tasas de cambio (validación)
  let nuevaTasaUSD = inputConfigTasaUSD ? parseFloat(inputConfigTasaUSD.value || '') : NaN;
  let nuevaTasaEUR = inputConfigTasaEUR ? parseFloat(inputConfigTasaEUR.value || '') : NaN;
  if (Number.isNaN(nuevaTasaUSD) || nuevaTasaUSD <= 0 || Number.isNaN(nuevaTasaEUR) || nuevaTasaEUR <= 0) {
    mostrarMensaje('Completá tasas de cambio válidas para USD y EUR (> 0).');
    return;
  }

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
    calendarioVistaPreferida: calendarioVista,
    tasasDivisas: { USD: nuevaTasaUSD, EUR: nuevaTasaEUR }
  };

  guardarConfigEnStorage(config);
  aplicarConfigTema();
  aplicarConfigMoneda();
  renderizarCategoriasManager();
  renderizarCategoriasSelect(null);
  renderizarOpcionesFiltroCategoria();
  renderizarMovimientos();
  actualizarResumen();
  if (typeof renderizarDashboard === 'function') {
    renderizarDashboard();
  }
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

//#endregion MÓDULO: Config

