# Publishing Guide — Frontend Libraries

Cómo publicar las librerías en **GitHub Packages** (npm registry privado de GitHub).

## 🤔 ¿Por qué GitHub Packages?

✅ **Ventajas:**
- Almacenamiento gratuito en GitHub
- Ligado a tu cuenta GitHub (sin cuenta npm separada)
- Publicación automática desde GitHub Actions
- Versiones privadas o públicas
- Sin cuota de descarga
- Integración perfecta con monorepo Nx

❌ **Alternativas rechazadas:**
- npm público: Requiere cuenta npm, más burocracia
- npm privado: Pago + gestión de tokens
- Artifact Registry (Google): Más complejo para equipos pequeños

## 📦 Estructura de paquetes

Cada librería se publica como un paquete npm bajo el scope `@adrianmartincano`:

```
@adrianmartincano/ng-theme
@adrianmartincano/ng-models
@adrianmartincano/ng-ui
@adrianmartincano/ng-forms
... etc
```

### Ubicación en el monorepo

```
libs/
├── shared/
│   ├── theme/
│   │   ├── package.json          ← Define el nombre @adrianmartincano/ng-theme
│   │   ├── src/
│   │   └── dist/                 ← Generado por build
│   ├── models/
│   ├── ui/
│   └── ...
```

## 🔑 Requisitos previos

### 1. Token de GitHub

Necesitas un **GitHub Personal Access Token (PAT)** con permisos:
- `write:packages` (publicar paquetes)
- `read:packages` (descargar paquetes)

**Crear el token:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Nombre: `npm-publish`
4. Scopes: marcar `write:packages`, `read:packages`
5. Copiar el token (no se puede volver a ver)

### 2. Archivo `.npmrc` en la raíz del proyecto

```ini
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

### 3. Variable de entorno `NPM_TOKEN`

En tu computadora local:

**Windows (PowerShell):**
```powershell
$env:NPM_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Windows (CMD):**
```cmd
set NPM_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Linux/Mac:**
```bash
export NPM_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 🚀 Publicar manualmente

### Paso 1: Asegurar que tienes el token

```bash
# Verificar que el token está disponible
echo $env:NPM_TOKEN  # Windows PowerShell
echo $NPM_TOKEN      # Linux/Mac
```

### Paso 2: Build de la librería

```bash
# Compilar todas las librerías
npm run build

# O una librería específica
nx build shared-theme
```

Los archivos compilados van a: `dist/libs/shared/theme/`

### Paso 3: Publicar en npm

```bash
# Publicar una librería
cd dist/libs/shared/theme
npm publish --access public

# O desde la raíz (requiere script)
npm run publish:theme
```

### Paso 4: Verificar publicación

```bash
# Ver la librería publicada
npm view @adrianmartincano/ng-theme

# Ver todas tus librerías
npm search @adrianmartincano --registry https://npm.pkg.github.com
```

## 🤖 Publicar automáticamente (GitHub Actions)

Para que se publique automáticamente en cada release, crea `.github/workflows/publish.yml`:

```yaml
name: Publish to GitHub Packages

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@adrianmartincano'
      
      - run: npm install
      - run: npm run build
      
      - name: Publish to GitHub Packages
        run: |
          for lib in libs/shared/*/; do
            if [ -f "$lib/package.json" ]; then
              npm publish "dist/$lib" --access public
            fi
          done
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📝 Versioning

Cada librería tiene su propia versión en `libs/shared/NOMBRE/package.json`:

```json
{
  "name": "@adrianmartincano/ng-theme",
  "version": "1.0.0",
  "description": "Design system...",
  "main": "index.js",
  "types": "index.d.ts",
  "exports": {
    ".": "./index.js",
    "./styles": "./styles.css"
  }
}
```

### Cambiar versión antes de publicar

```bash
# En libs/shared/theme/package.json
{
  "version": "1.0.1"
}

# Luego build y publish
npm run build
cd dist/libs/shared/theme
npm publish --access public
```

## ⚙️ Configuración en proyecto consumidor

Los usuarios que usan tus librerías necesitan:

### 1. Crear `.npmrc` en su proyecto

```ini
@adrianmartincano:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

### 2. Tener el token en `~/.npmrc` global

```ini
//npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

O usar GitHub Actions (que tiene el token automático).

### 3. Instalar la librería

```bash
npm install @adrianmartincano/ng-theme @adrianmartincano/ng-ui
```

## 🔒 Seguridad

⚠️ **IMPORTANTE:**

- ❌ Nunca commites el token en git
- ✅ Usa `${NPM_TOKEN}` en `.npmrc` (interpolación de variables)
- ✅ Guarda el token en `~/.npmrc` o como variable de entorno
- ✅ En GitHub Actions, usa `secrets.GITHUB_TOKEN` (automático)
- ✅ Regenera el token si lo expones accidentalmente

## 🐛 Troubleshooting

### "401 Unauthorized"
```
Causa: Token inválido o expirado
Solución:
1. Verificar que NPM_TOKEN está configurado
2. Crear un nuevo token en GitHub
3. Actualizar ~/.npmrc
```

### "404 Not Found"
```
Causa: Paquete no existe o scope incorrecto
Solución:
1. Verificar que @adrianmartincano está en package.json
2. Verificar que .npmrc apunta a npm.pkg.github.com
```

### "Package already exists"
```
Causa: Intentas publicar la misma versión dos veces
Solución:
1. Incrementar versión en package.json
2. Hacer npm run build
3. npm publish de nuevo
```

## 📚 Referencias

- [GitHub Packages docs](https://docs.github.com/en/packages)
- [npm CLI publish](https://docs.npmjs.com/cli/publish)
- [Nx Publishing Guide](https://nx.dev/recipes/ci/publish-to-npm)

---

**Resumen rápido:**

```bash
# Setup (una sola vez)
echo 'export NPM_TOKEN="ghp_xxx"' >> ~/.bashrc

# Publicar
npm run build
cd dist/libs/shared/theme
npm publish --access public
```
