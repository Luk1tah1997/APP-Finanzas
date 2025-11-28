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
//#endregion MÓDULO: Backup + Export

