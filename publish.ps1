# ==============================================================================
# publish.ps1 — Automática de versionado y publicación en GitHub Packages
# ==============================================================================
#
# Este script automatiza todo el proceso de publicación de librerías Angular
# a GitHub Packages (npm registry). Maneja dos modos:
#
# 1. MODO LOCAL (default):
#    - Incrementa versión en publish.json
#    - Ejecuta: npm run build
#    - Publica: npm publish de cada librería
#    - Desde tu ordenador (requiere NPM_TOKEN configurado)
#
# 2. MODO CI (-CI flag):
#    - Incrementa versión
#    - Crea commit + tag (v1.0.0, v1.0.1, etc.)
#    - Hace push del tag a GitHub
#    - GitHub Actions se dispara automáticamente y publica
#
# ==============================================================================
# EJEMPLOS DE USO:
# ==============================================================================
#
#   .\publish.ps1
#   → Versión patch (1.0.0 -> 1.0.1), publica todas las librerías
#
#   .\publish.ps1 minor
#   → Versión minor (1.0.0 -> 1.1.0), publica todas las librerías
#
#   .\publish.ps1 patch -CI
#   → Modo CI: crea tag v1.0.1 y GitHub Actions publica automáticamente
#
#   .\publish.ps1 patch ui
#   → Solo publica la librería 'ui' (modo local)
#
#   .\publish.ps1 patch theme,auth,ui
#   → Publica solo esas 3 librerías (modo local)
#
# ==============================================================================

param(
    [ValidateSet("patch","minor","major")]
    [string]$BumpType = "patch",
    [string]$Only = "",
    [switch]$CI
)

Set-Location $PSScriptRoot

$allLibs    = @("models","auth","ui","forms","upload","products","newsletter","ecommerce","cms","cms-editor","reservations","cookies","legal")
$cssLibs    = @("theme")
$allTargets = $allLibs + $cssLibs

if ($Only -and -not $CI) {
    $targetLibs = $Only -split "," | ForEach-Object { $_.Trim() }
    $invalid = $targetLibs | Where-Object { $_ -notin $allTargets }
    if ($invalid) {
        Write-Error "Libreria(s) no reconocidas: $($invalid -join ', '). Disponibles: $($allTargets -join ', ')"
        exit 1
    }
} else {
    $targetLibs = $allTargets
}

# Leer version actual
$versionSource = $null
foreach ($lib in $targetLibs) {
    $p = "libs/shared/$lib/publish.json"
    if (Test-Path $p) { $versionSource = $p; break }
}

if (-not $versionSource) {
    Write-Error "No se encontro ningún package.json en libs/shared/*/"
    exit 1
}

$pkg = Get-Content $versionSource -Raw | ConvertFrom-Json
$currentVersion = $pkg.version

if (-not ($currentVersion -match '^\d+\.\d+\.\d+$')) {
    Write-Error "Version '$currentVersion' no tiene formato semver (X.Y.Z)."
    exit 1
}

# Calcular nueva version
$parts = $currentVersion.Split(".")
[int]$major = $parts[0]
[int]$minor = $parts[1]
[int]$patch = $parts[2]

switch ($BumpType) {
    "major" { $major++; $minor = 0; $patch = 0 }
    "minor" { $minor++; $patch = 0 }
    "patch" { $patch++ }
}

$newVersion = "$major.$minor.$patch"

# Confirmacion
Write-Host ""
if ($CI) {
    Write-Host "  Modo     : CI - GitHub Actions publicara tras el push del tag" -ForegroundColor Magenta
    Write-Host "  Librerias: todas" -ForegroundColor Cyan
} else {
    Write-Host "  Modo     : local - build + publish en esta maquina" -ForegroundColor Cyan
    $angularList = ($targetLibs | Where-Object { $_ -in $allLibs }) -join ', '
    $cssList     = ($targetLibs | Where-Object { $_ -in $cssLibs  }) -join ', '
    if ($angularList) { Write-Host "  Angular  : $angularList" -ForegroundColor Cyan }
    if ($cssList)     { Write-Host "  CSS      : $cssList"     -ForegroundColor Cyan }
}
Write-Host "  Version  : $currentVersion  ->  $newVersion  ($BumpType)" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continuar? (s/N)"
if ($confirm -notmatch '^[sS]$') { Write-Host "Cancelado."; exit 0 }

# Actualizar package.json de cada libreria
Write-Host ""
Write-Host "Actualizando versiones..." -ForegroundColor Cyan
foreach ($lib in $targetLibs) {
    $p = "libs/shared/$lib/publish.json"
    if (-not (Test-Path $p)) { Write-Warning "  Omitiendo $lib - no existe $p"; continue }
    $content = Get-Content $p -Raw | ConvertFrom-Json
    $content.version = $newVersion
    $json = $content | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText((Resolve-Path $p).Path, $json, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK $p -> $newVersion"
}

# MODO CI
if ($CI) {
    Write-Host ""
    Write-Host "Creando commit y tag v$newVersion..." -ForegroundColor Magenta

    git add libs/shared/ publish.ps1 .github/workflows/publish.yml
    git commit -m "chore: bump version to $newVersion"
    if ($LASTEXITCODE -ne 0) { Write-Error "git commit fallo."; exit 1 }

    git tag "v$newVersion"
    if ($LASTEXITCODE -ne 0) { Write-Error "git tag fallo."; exit 1 }

    git push
    git push --tags
    if ($LASTEXITCODE -ne 0) { Write-Error "git push fallo."; exit 1 }

    Write-Host ""
    Write-Host "OK Tag v$newVersion pusheado. GitHub Actions publicara las librerias en unos minutos." -ForegroundColor Green
    exit 0
}

# MODO LOCAL — build con ng-packagr para Angular; publish directo para CSS
$failed = @()

# ── Angular libs ────────────────────────────────────────────────────────────
$angularTargets = @($targetLibs | Where-Object { $_ -in $allLibs })

if ($angularTargets.Count -gt 0) {
    Write-Host ""
    Write-Host "Building librerias Angular con ng-packagr..." -ForegroundColor Cyan

    New-Item -ItemType Directory -Force "node_modules/@org"              | Out-Null
    New-Item -ItemType Directory -Force "node_modules/@adrianmartincano" | Out-Null

    foreach ($lib in $angularTargets) {
        $libPath = "libs/shared/$lib"
        if (-not (Test-Path $libPath)) { Write-Warning "  Omitiendo $lib - no existe $libPath"; continue }

        Write-Host ""
        Write-Host "  === Building @adrianmartincano/ng-$lib ===" -ForegroundColor Cyan

        Copy-Item "$libPath/publish.json" "$libPath/package.json"

        $tsconfigJson = @"
{
  "compilerOptions": {
    "sourceMap": true, "declaration": true, "declarationMap": false,
    "inlineSources": true, "moduleResolution": "node",
    "emitDecoratorMetadata": true, "experimentalDecorators": true,
    "importHelpers": true, "target": "ES2022", "module": "ES2022",
    "lib": ["ES2022", "dom"], "skipLibCheck": true, "skipDefaultLibCheck": true,
    "baseUrl": "."
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  },
  "exclude": ["src/test-setup.ts", "**/*.spec.ts", "**/*.test.ts"],
  "include": ["src/**/*.ts"]
}
"@
        [System.IO.File]::WriteAllText(
            (Join-Path (Resolve-Path $libPath).Path "tsconfig.lib.prod.json"),
            $tsconfigJson,
            [System.Text.UTF8Encoding]::new($false)
        )

        $ngpkgJson = "{`"lib`":{`"entryFile`":`"src/index.ts`"},`"dest`":`"../../../dist/libs/shared/$lib`"}"
        [System.IO.File]::WriteAllText(
            (Join-Path (Resolve-Path $libPath).Path "ng-package.json"),
            $ngpkgJson,
            [System.Text.UTF8Encoding]::new($false)
        )

        npx ng-packagr -p "$libPath/ng-package.json"
        $buildOk = $LASTEXITCODE -eq 0

        if ($buildOk) {
            # Reescribir imports cross-lib @org/<x> -> @adrianmartincano/ng-<x> en el paquete publicado
            Get-ChildItem "dist/libs/shared/$lib" -Recurse -Include *.mjs,*.d.ts -ErrorAction SilentlyContinue | ForEach-Object {
                (Get-Content -Raw $_.FullName) -replace '@org/', '@adrianmartincano/ng-' | Set-Content -NoNewline $_.FullName
            }
        }

        $distResolved = Resolve-Path "dist/libs/shared/$lib" -ErrorAction SilentlyContinue
        if ($distResolved) {
            $linkOrg = "node_modules/@org/$lib"
            if (Test-Path $linkOrg) { Remove-Item $linkOrg -Recurse -Force }
            New-Item -ItemType Junction -Path $linkOrg -Target $distResolved.Path | Out-Null

            $linkNpm = "node_modules/@adrianmartincano/ng-$lib"
            if (Test-Path $linkNpm) { Remove-Item $linkNpm -Recurse -Force }
            New-Item -ItemType Junction -Path $linkNpm -Target $distResolved.Path | Out-Null
        }

        Remove-Item "$libPath/package.json"            -ErrorAction SilentlyContinue
        Remove-Item "$libPath/ng-package.json"         -ErrorAction SilentlyContinue
        Remove-Item "$libPath/tsconfig.lib.prod.json"  -ErrorAction SilentlyContinue

        if (-not $buildOk) { Write-Warning "  Build FALLO para $lib"; $failed += $lib }
    }

    if ($failed.Count -gt 0) {
        Write-Error "Build fallido en: $($failed -join ', '). No se publica nada."
        exit 1
    }

    Write-Host ""
    Write-Host "Publicando Angular libs en GitHub Packages..." -ForegroundColor Cyan

    foreach ($lib in $angularTargets) {
        $distPath = "dist/libs/shared/$lib"
        if (-not (Test-Path $distPath)) {
            Write-Warning "  Omitiendo $lib - no existe dist en $distPath"
            continue
        }
        Write-Host "  Publicando @adrianmartincano/ng-$lib@$newVersion..."
        Push-Location $distPath
        npm publish
        if ($LASTEXITCODE -ne 0) { $failed += $lib }
        Pop-Location
    }
}

# ── CSS libs (publish directo desde source) ──────────────────────────────────
$cssTargets = @($targetLibs | Where-Object { $_ -in $cssLibs })

if ($cssTargets.Count -gt 0) {
    Write-Host ""
    Write-Host "Publicando CSS libs en GitHub Packages..." -ForegroundColor Cyan

    foreach ($lib in $cssTargets) {
        $libPath = "libs/shared/$lib"
        if (-not (Test-Path $libPath)) { Write-Warning "  Omitiendo $lib - no existe $libPath"; continue }

        Write-Host "  Publicando @adrianmartincano/ng-$lib@$newVersion..."
        Copy-Item "$libPath/publish.json" "$libPath/package.json"
        Push-Location $libPath
        npm publish
        if ($LASTEXITCODE -ne 0) { $failed += $lib }
        Pop-Location
        Remove-Item "$libPath/package.json" -ErrorAction SilentlyContinue
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "OK Publicacion completada. Version $newVersion en GitHub Packages." -ForegroundColor Green
} else {
    Write-Warning "Publicacion parcial. Fallaron: $($failed -join ', ')"
    exit 1
}
