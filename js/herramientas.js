// herramientas.js - Centro de herramientas
'use strict';

//#region MÓDULO: Herramientas
//////////////////////////////////////////////////////////////////////
// MÓDULO: Herramientas
//////////////////////////////////////////////////////////////////////

//#region Herramienta: Presupuesto diario
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

//#endregion Herramienta: Presupuesto diario
//#region Herramienta: Gastos grupales
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

//#endregion Herramienta: Gastos grupales
//#region Herramienta: Conversor de divisas
// ====================
//  Conversor de divisas
// ====================

function obtenerTasasDivisas() {
  const defUSD = DEFAULT_CONFIG.tasasDivisas.USD;
  const defEUR = DEFAULT_CONFIG.tasasDivisas.EUR;
  const tasaUSD = (config && config.tasasDivisas && typeof config.tasasDivisas.USD === 'number' && config.tasasDivisas.USD > 0)
    ? config.tasasDivisas.USD
    : defUSD;
  const tasaEUR = (config && config.tasasDivisas && typeof config.tasasDivisas.EUR === 'number' && config.tasasDivisas.EUR > 0)
    ? config.tasasDivisas.EUR
    : defEUR;
  return { USD: tasaUSD, EUR: tasaEUR };
}

function obtenerTasaConversion(origen, destino) {
  if (origen === destino) return 1;
  const tasas = obtenerTasasDivisas();
  const USDenARS = tasas.USD; // 1 USD = USDenARS ARS
  const EURenARS = tasas.EUR; // 1 EUR = EURenARS ARS
  if (origen === 'ARS' && destino === 'USD') return 1 / USDenARS;
  if (origen === 'ARS' && destino === 'EUR') return 1 / EURenARS;
  if (origen === 'USD' && destino === 'ARS') return USDenARS;
  if (origen === 'EUR' && destino === 'ARS') return EURenARS;
  if (origen === 'USD' && destino === 'EUR') return USDenARS / EURenARS;
  if (origen === 'EUR' && destino === 'USD') return EURenARS / USDenARS;
  return null;
}

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
  const tasa = obtenerTasaConversion(origen, destino);
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

//#endregion Herramienta: Conversor de divisas
//#region Herramienta: Interés compuesto
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

//#endregion Herramienta: Interés compuesto
//#region Herramienta: Objetivo de ahorro
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

//#endregion Herramienta: Objetivo de ahorro
//#endregion MÓDULO: Herramientas

