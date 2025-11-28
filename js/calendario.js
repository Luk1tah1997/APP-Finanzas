// calendario.js - Calendario
'use strict';

//#region MÓDULO: Calendario
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

//#endregion MÓDULO: Calendario

