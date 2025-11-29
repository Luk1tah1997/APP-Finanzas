// categorias.js - Gestión de categorías
'use strict';

//#region MÓDULO: Categorías
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
    initMaterializeSelect(selectCategoriaMovimiento);
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
    initMaterializeSelect(selectFiltroCategoria);
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

//#endregion MÓDULO: Categorías

