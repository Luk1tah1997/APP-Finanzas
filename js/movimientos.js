// movimientos.js - CRUD de movimientos
'use strict';

//#region MÓDULO: Movimientos, CRUD
//////////////////////////////////////////////////////////////////////
// MÓDULO: Movimientos, CRUD
//////////////////////////////////////////////////////////////////////

function renderizarMovimientos() {
  if (!tablaBody) return;
  const lista = obtenerMovimientosFiltrados ? obtenerMovimientosFiltrados() : [];

  // Limpiar
  while (tablaBody.firstChild) tablaBody.removeChild(tablaBody.firstChild);

  (lista || []).forEach(function (mov) {
    const tr = document.createElement('tr');

    const tdFecha = document.createElement('td');
    tdFecha.textContent = mov.fecha || '';
    tr.appendChild(tdFecha);

    const tdTipo = document.createElement('td');
    tdTipo.textContent = mov.tipo || '';
    tr.appendChild(tdTipo);

    const tdCategoria = document.createElement('td');
    tdCategoria.textContent = mov.categoria || '';
    tr.appendChild(tdCategoria);

    const tdForma = document.createElement('td');
    tdForma.textContent = mov.formaPago || '';
    tr.appendChild(tdForma);

    const tdMonto = document.createElement('td');
    tdMonto.className = 'left-align';
    tdMonto.textContent = (typeof mov.monto === 'number' ? mov.monto : 0).toFixed(2);
    tr.appendChild(tdMonto);

    const tdNota = document.createElement('td');
    tdNota.textContent = mov.nota || '';
    tr.appendChild(tdNota);

    const tdAcciones = document.createElement('td');
    tdAcciones.className = 'center-align no-print actions-cell';
    const btnEditar = document.createElement('a');
    btnEditar.href = '#!';
    btnEditar.className = 'btn-small waves-effect teal btn-editar';
    btnEditar.dataset.id = String(mov.id);
    btnEditar.innerHTML = '<i class="material-icons">edit</i>';
    const btnEliminar = document.createElement('a');
    btnEliminar.href = '#!';
    btnEliminar.className = 'btn-small waves-effect red btn-eliminar';
    btnEliminar.dataset.id = String(mov.id);
    btnEliminar.innerHTML = '<i class="material-icons">delete</i>';
    tdAcciones.appendChild(btnEditar);
    tdAcciones.appendChild(btnEliminar);
    tr.appendChild(tdAcciones);

    tablaBody.appendChild(tr);
  });
}

function actualizarResumen() {
  const lista = obtenerMovimientosFiltrados ? obtenerMovimientosFiltrados() : [];
  let totalIng = 0;
  let totalGas = 0;
  (lista || []).forEach(function (mov) {
    if (mov.tipo === 'INGRESO') totalIng += mov.monto || 0;
    else if (mov.tipo === 'GASTO') totalGas += mov.monto || 0;
  });
  const balance = totalIng - totalGas;

  if (totalIngresosEl) totalIngresosEl.textContent = totalIng.toFixed(2);
  if (totalGastosEl) totalGastosEl.textContent = totalGas.toFixed(2);
  if (totalBalanceEl) totalBalanceEl.textContent = balance.toFixed(2);

  if (typeof renderizarDashboard === 'function') {
    renderizarDashboard();
  }
}

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

//#endregion MÓDULO: Movimientos, CRUD

