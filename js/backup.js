// backup.js - Backup, exportaciones e impresión
'use strict';

//#region MÓDULO: Backup + Export
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
      setHerramientasVisible(
        typeof config.abrirHerramientasAlInicio === 'boolean'
          ? config.abrirHerramientasAlInicio
          : false
      );
      if (config.abrirHerramientasAlInicio) {
        const preferida = (config && config.herramientaPreferida) ? config.herramientaPreferida : 'presupuesto';
        seleccionarHerramienta(preferida);
      }

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

// ====================
//   Plantilla Excel
// ====================

function exportarPlantillaExcel() {
  if (typeof XLSX === 'undefined') {
    mostrarMensaje('La librería SheetJS no está disponible.');
    return;
  }

  // Fecha actual en formato DD/MM/YYYY
  const hoy = new Date();
  const dd = String(hoy.getDate()).padStart(2, '0');
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const yyyy = hoy.getFullYear();
  const fechaHoy = dd + '/' + mm + '/' + yyyy;

  // Fecha de ayer
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const ddAyer = String(ayer.getDate()).padStart(2, '0');
  const mmAyer = String(ayer.getMonth() + 1).padStart(2, '0');
  const yyyyAyer = ayer.getFullYear();
  const fechaAyer = ddAyer + '/' + mmAyer + '/' + yyyyAyer;

  // Encabezados
  const headers = [
    'Fecha',
    'Tipo',
    'Categoria',
    'Monto',
    'Forma de pago',
    'Nota'
  ];

  // Primera fila: headers
  const data = [headers];

  // Fila de ejemplo con fecha actual
  data.push([
    fechaHoy,
    'INGRESO',
    'Salario',
    100000,
    'Transferencia',
    'Ejemplo de ingreso'
  ]);
  data.push([
    fechaAyer,
    'GASTO',
    'Comida',
    5000,
    'Débito',
    'Ejemplo de gasto'
  ]);

  // Crear worksheet y workbook
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Aplicar formato de texto a la columna de fecha (columna A) para todas las filas
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = 0; R <= range.e.r; ++R) {
    const cellAddress = XLSX.utils.encode_cell({ r: R, c: 0 });
    if (!ws[cellAddress]) continue;
    
    // Forzar tipo texto (string) para que Excel no convierta las fechas
    if (ws[cellAddress].v) {
      ws[cellAddress].t = 's'; // tipo string
      ws[cellAddress].z = '@'; // formato de texto
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

  // Nombre de archivo con fecha actual
  const nombreArchivo = 'plantilla-mis-finanzas-' + dd + '-' + mm + '-' + yyyy + '.xlsx';
  
  // Descargar archivo
  XLSX.writeFile(wb, nombreArchivo);
  mostrarMensaje('Plantilla Excel descargada.');
}

function importarMovimientosDesdeExcel(archivo) {
  if (!archivo) return;

  if (typeof XLSX === 'undefined') {
    mostrarMensaje('La librería SheetJS no está disponible.');
    return;
  }

  const lector = new FileReader();

  lector.onload = function (e) {
    try {
      const datos = new Uint8Array(e.target.result);
      const workbook = XLSX.read(datos, { type: 'array' });

      const nombreHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[nombreHoja];

      // Leer como array de objetos
      const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' });

      if (!Array.isArray(filas) || filas.length === 0) {
        mostrarMensaje('El archivo Excel no contiene datos válidos.');
        return;
      }

      // Recorrer filas y convertir a movimientos
      const nuevosMovimientos = [];

      filas.forEach(function (fila, index) {
        // Ignorar filas completamente vacías
        if (
          !fila['Fecha'] &&
          !fila['Tipo'] &&
          !fila['Categoria'] &&
          !fila['Monto'] &&
          !fila['Forma de pago'] &&
          !fila['Nota']
        ) {
          return;
        }

        const tipo = (fila['Tipo'] || '').toString().trim().toUpperCase();
        if (tipo !== 'INGRESO' && tipo !== 'GASTO') {
          console.warn(
            'Fila ' + (index + 2) + ' tiene Tipo inválido:',
            fila['Tipo']
          );
          return;
        }

        // Parsear fecha
        const fechaStr = (fila['Fecha'] || '').toString().trim();
        const fechaISO = normalizarFechaExcelAISO(fechaStr);
        if (!fechaISO) {
          console.warn(
            'Fila ' + (index + 2) + ' tiene fecha inválida:',
            fila['Fecha']
          );
          return;
        }

        // Parsear monto
        let montoNum = Number(
          (fila['Monto'] || '')
            .toString()
            .replace(/\./g, '')
            .replace(',', '.')
        );
        if (!isFinite(montoNum) || montoNum === 0) {
          console.warn(
            'Fila ' + (index + 2) + ' tiene monto inválido:',
            fila['Monto']
          );
          return;
        }

        const categoria =
          (fila['Categoria'] || '').toString().trim() || 'Sin categoría';
        const formaPago = (fila['Forma de pago'] || '').toString().trim();
        const nota = (fila['Nota'] || '').toString().trim();

        // Generar id nuevo
        const nuevoId = nextId;
        nextId++;

        const mov = {
          id: nuevoId,
          fecha: fechaISO,
          tipo: tipo,
          categoria: categoria,
          monto: montoNum,
          nota: nota,
          formaPago: formaPago
        };

        nuevosMovimientos.push(mov);
      });

      if (!nuevosMovimientos.length) {
        mostrarMensaje('No se encontraron filas válidas en el Excel.');
        return;
      }

      // Agregar al array global de movimientos y guardar
      movimientos = movimientos.concat(nuevosMovimientos);
      guardarMovimientosEnStorage();

      // Refrescar UI
      renderizarMovimientos();
      actualizarResumen();
      renderizarDashboard();
      renderizarCalendario();
      refrescarTimelineDesdeFiltros();

      mostrarMensaje(
        'Se importaron ' + nuevosMovimientos.length + ' movimientos desde Excel.'
      );
    } catch (err) {
      console.error('Error importando Excel:', err);
      mostrarMensaje('Error leyendo el archivo Excel.');
    }
  };

  lector.onerror = function () {
    mostrarMensaje('No se pudo leer el archivo Excel.');
  };

  lector.readAsArrayBuffer(archivo);
}

// Normaliza fecha de Excel a formato ISO (YYYY-MM-DD)
function normalizarFechaExcelAISO(fechaStr) {
  if (!fechaStr) return null;

  const str = fechaStr.toString().trim();

  // Caso 1: YYYY-MM-DD
  const patron1 = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const match1 = str.match(patron1);
  if (match1) {
    const y = match1[1];
    const m = match1[2].padStart(2, '0');
    const d = match1[3].padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  // Caso 2: DD/MM/YYYY
  const patron2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match2 = str.match(patron2);
  if (match2) {
    const d = match2[1].padStart(2, '0');
    const m = match2[2].padStart(2, '0');
    const y = match2[3];
    return y + '-' + m + '-' + d;
  }

  // Caso 3: Número de serie de Excel (días desde 1900-01-01)
  const numeroSerial = parseFloat(str);
  if (!isNaN(numeroSerial) && numeroSerial > 0) {
    // Excel cuenta días desde 1900-01-01, pero tiene bug del año bisiesto 1900
    const fecha = new Date((numeroSerial - 25569) * 86400 * 1000);
    if (!isNaN(fecha.getTime())) {
      const y = fecha.getUTCFullYear();
      const m = String(fecha.getUTCMonth() + 1).padStart(2, '0');
      const d = String(fecha.getUTCDate()).padStart(2, '0');
      return y + '-' + m + '-' + d;
    }
  }

  return null;
}

// ====================
//   Reporte de impresión
// ====================

function imprimirReporteMovimientos(opciones) {
  // opciones = { modo, periodoCodigo, fechaDesde, fechaHasta, periodoTexto }
  
  let lista = [];
  let rangoFinal = null;
  let periodoTitulo = '';

  if (opciones.modo === 'filtros-actuales') {
    // Usar filtros actuales
    lista = obtenerMovimientosFiltrados();
    rangoFinal = {
      desde: filtros.fechaDesde,
      hasta: filtros.fechaHasta
    };
    
    if (filtros.fechaDesde && filtros.fechaHasta) {
      periodoTitulo = 'Período: ' + formatearFechaLegible(filtros.fechaDesde) + 
                      ' al ' + formatearFechaLegible(filtros.fechaHasta);
    } else {
      periodoTitulo = 'Período: ' + (opciones.periodoTexto || 'Todos los movimientos');
    }
  } else if (opciones.modo === 'periodo-rapido') {
    // Período rápido
    const periodoCodigo = opciones.periodoCodigo || 'mes-actual';
    rangoFinal = obtenerRangoPorCodigo(periodoCodigo);
    
    // Filtrar movimientos por rango
    if (rangoFinal) {
      lista = movimientos.filter(function (mov) {
        return mov.fecha >= rangoFinal.desde && mov.fecha <= rangoFinal.hasta;
      });
      periodoTitulo = 'Período: ' + formatearFechaLegible(rangoFinal.desde) + 
                      ' al ' + formatearFechaLegible(rangoFinal.hasta);
    } else {
      // Todo el histórico
      lista = movimientos.slice();
      periodoTitulo = 'Período: Todo el histórico';
    }
  } else if (opciones.modo === 'rango-personalizado') {
    // Rango personalizado
    rangoFinal = {
      desde: opciones.fechaDesde,
      hasta: opciones.fechaHasta
    };
    
    lista = movimientos.filter(function (mov) {
      return mov.fecha >= rangoFinal.desde && mov.fecha <= rangoFinal.hasta;
    });
    
    periodoTitulo = 'Período: ' + formatearFechaLegible(rangoFinal.desde) + 
                    ' al ' + formatearFechaLegible(rangoFinal.hasta);
  }

  // Ordenar lista por fecha (y tipo)
  lista.sort(function (a, b) {
    if (a.fecha < b.fecha) return -1;
    if (a.fecha > b.fecha) return 1;
    if (a.tipo === 'INGRESO' && b.tipo === 'GASTO') return -1;
    if (a.tipo === 'GASTO' && b.tipo === 'INGRESO') return 1;
    return 0;
  });

  // Calcular estadísticas
  const stats = calcularEstadisticasSobreLista(lista, rangoFinal);
  const simbolo = obtenerSimboloMoneda();
  const balance = stats.totalIngresos - stats.totalGastos;

  // Generar HTML del reporte
  const html = generarHTMLReporte({
    periodoTitulo: periodoTitulo,
    stats: stats,
    balance: balance,
    simbolo: simbolo,
    lista: lista
  });

  // Abrir ventana y mostrar reporte
  const win = window.open('', '_blank');
  if (!win) {
    mostrarMensaje('No se pudo abrir la ventana de impresión. Verifica los permisos del navegador.');
    return;
  }

  win.document.write(html);
  win.document.close();
  
  // Esperar a que se cargue y luego imprimir
  win.onload = function () {
    win.focus();
    win.print();
  };
}

function formatearFechaLegible(fechaISO) {
  if (!fechaISO) return '';
  const partes = fechaISO.split('-');
  if (partes.length !== 3) return fechaISO;
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function generarHTMLReporte(datos) {
  const { periodoTitulo, stats, balance, simbolo, lista } = datos;
  
  let filasHTML = '';
  lista.forEach(function (mov) {
    const fechaLegible = formatearFechaLegible(mov.fecha);
    const tipoClass = mov.tipo === 'INGRESO' ? 'tipo-ingreso' : 'tipo-gasto';
    const montoFormateado = simbolo + ' ' + Math.round(mov.monto).toLocaleString('es-AR');
    
    filasHTML += '<tr>' +
      '<td>' + fechaLegible + '</td>' +
      '<td class="' + tipoClass + '">' + mov.tipo + '</td>' +
      '<td>' + (mov.categoria || '') + '</td>' +
      '<td>' + (mov.formaPago || '') + '</td>' +
      '<td class="monto">' + montoFormateado + '</td>' +
      '<td>' + (mov.nota || '') + '</td>' +
      '</tr>';
  });

  const balanceClass = balance >= 0 ? 'balance-positivo' : 'balance-negativo';

  const html = '<!DOCTYPE html>' +
    '<html lang="es">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<title>Reporte de Movimientos - Mis Finanzas</title>' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif; margin: 20px; color: #333; }' +
    'h1 { color: #26a69a; font-size: 24px; margin-bottom: 5px; }' +
    'h2 { color: #555; font-size: 16px; font-weight: normal; margin-top: 0; margin-bottom: 20px; }' +
    '.resumen { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }' +
    '.resumen-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }' +
    '.resumen-item { }' +
    '.resumen-label { font-size: 12px; color: #666; margin-bottom: 3px; }' +
    '.resumen-valor { font-size: 18px; font-weight: bold; }' +
    '.resumen-ingresos { color: #26a69a; }' +
    '.resumen-gastos { color: #ef5350; }' +
    '.balance-positivo { color: #26a69a; }' +
    '.balance-negativo { color: #ef5350; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 20px; }' +
    'th { background: #26a69a; color: white; padding: 10px; text-align: left; font-weight: 600; }' +
    'td { padding: 8px; border-bottom: 1px solid #e0e0e0; }' +
    'tr:hover { background: #f9f9f9; }' +
    '.tipo-ingreso { color: #26a69a; font-weight: 500; }' +
    '.tipo-gasto { color: #ef5350; font-weight: 500; }' +
    '.monto { font-weight: 600; text-align: right; }' +
    '@media print {' +
    '  body { margin: 10px; }' +
    '  .no-print { display: none; }' +
    '}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h1>Mis Finanzas – Reporte de movimientos</h1>' +
    '<h2>' + periodoTitulo + '</h2>' +
    '<div class="resumen">' +
    '<div class="resumen-grid">' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Total Ingresos</div>' +
    '<div class="resumen-valor resumen-ingresos">' + simbolo + ' ' + Math.round(stats.totalIngresos).toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Total Gastos</div>' +
    '<div class="resumen-valor resumen-gastos">' + simbolo + ' ' + Math.round(stats.totalGastos).toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Balance</div>' +
    '<div class="resumen-valor ' + balanceClass + '">' + simbolo + ' ' + Math.round(balance).toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Total Movimientos</div>' +
    '<div class="resumen-valor">' + stats.cantMovTotal + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Movimientos Ingresos</div>' +
    '<div class="resumen-valor">' + stats.cantMovIngresos + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Movimientos Gastos</div>' +
    '<div class="resumen-valor">' + stats.cantMovGastos + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Días con Gasto</div>' +
    '<div class="resumen-valor">' + stats.diasConGasto + '</div>' +
    '</div>' +
    '<div class="resumen-item">' +
    '<div class="resumen-label">Gasto Promedio Diario</div>' +
    '<div class="resumen-valor">' + simbolo + ' ' + Math.round(stats.gastoPromedioDiario).toLocaleString('es-AR') + '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<table>' +
    '<thead>' +
    '<tr>' +
    '<th>Fecha</th>' +
    '<th>Tipo</th>' +
    '<th>Categoría</th>' +
    '<th>Forma de pago</th>' +
    '<th>Monto</th>' +
    '<th>Nota</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    filasHTML +
    '</tbody>' +
    '</table>' +
    '</body>' +
    '</html>';

  return html;
}

//#endregion MÓDULO: Backup + Export

