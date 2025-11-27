# Script para mejorar las herramientas con modales, historial y gastos grupales avanzados

Write-Host "Aplicando mejoras a las Herramientas..."

# 1. Modificar HTML para gastos grupales con personas
$lines = [System.IO.File]::ReadAllLines("index.html", [System.Text.Encoding]::UTF8)

# Encontrar la línea del título de Herramientas y agregar botón de historial
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '<h5 class="section-title">Herramientas rápidas</h5>') {
        # Reemplazar con div que incluye botón
        $lines[$i] = '      <div class="row" style="margin-bottom: 1rem;">'
        $newLines = @(
            '        <div class="col s12">'
            '          <h5 class="section-title" style="display: inline-block; margin: 0;">Herramientas rápidas</h5>'
            '          <button id="btn-ver-historial-herramientas" class="btn-flat waves-effect no-print right" type="button" style="margin-top: -8px;">'
            '            <i class="material-icons left">history</i>Historial'
            '          </button>'
            '        </div>'
            '      </div>'
        )
        $lines = $lines[0..$i] + $newLines + $lines[($i+1)..($lines.Count-1)]
        break
    }
}

# Encontrar y modificar el formulario de Gastos grupales para incluir personas
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '<form id="form-herramienta-grupal">') {
        # Buscar el cierre del form
        $endIdx = -1
        for ($j = $i; $j -lt $lines.Count; $j++) {
            if ($lines[$j] -match '</form>') {
                $endIdx = $j
                break
            }
        }
        
        if ($endIdx -gt 0) {
            # Nuevo formulario mejorado
            $newForm = @(
                '          <form id="form-herramienta-grupal">'
                '            <div class="row">'
                '              <div class="col s12 m6">'
                '                <div class="input-field">'
                '                  <input id="hg-monto-total" type="number" step="0.01" />'
                '                  <label for="hg-monto-total">Monto total del gasto</label>'
                '                </div>'
                '              </div>'
                '              <div class="col s12 m6">'
                '                <div class="input-field">'
                '                  <input id="hg-cantidad-personas" type="number" min="1" />'
                '                  <label for="hg-cantidad-personas">Cantidad de personas</label>'
                '                </div>'
                '              </div>'
                '            </div>'
                ''
                '            <div id="hg-personas-container" style="display: none;">'
                '              <h6 class="grey-text">Detalle de personas</h6>'
                '              <div id="hg-personas-lista">'
                '                <!-- Generado dinámicamente -->'
                '              </div>'
                '            </div>'
                ''
                '            <div class="row no-print">'
                '              <div class="col s12 m6">'
                '                <button class="btn waves-effect waves-light btn-full-width" type="submit" id="hg-btn-calcular">Calcular</button>'
                '              </div>'
                '              <div class="col s12 m6">'
                '                <button class="btn grey lighten-1 black-text waves-effect btn-full-width" type="button" id="hg-btn-limpiar">Limpiar</button>'
                '              </div>'
                '            </div>'
                ''
                '            <div id="hg-resultado" class="grey-text text-darken-2"></div>'
                '          </form>'
            )
            
            $lines = $lines[0..($i-1)] + $newForm + $lines[($endIdx+1)..($lines.Count-1)]
        }
        break
    }
}

# Guardar HTML
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines("$PWD\index.html", $lines, $utf8NoBom)

Write-Host "HTML actualizado: $($lines.Count) líneas"
Write-Host "Ahora actualizando JavaScript..."
