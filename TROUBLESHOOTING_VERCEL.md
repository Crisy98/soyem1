# 🔍 TROUBLESHOOTING - ERRORES COMUNES EN VERCEL BUILD

## ✅ SI EL BUILD ES EXITOSO

Verás algo como:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size
┌ ○ /                                    ...
├ ○ /admin                               ...
└ ○ /login                               ...

Build completed successfully
```

**Próximos pasos:**
1. Vercel te dará una URL: `https://tu-proyecto.vercel.app`
2. Configura las variables de entorno (si no lo hiciste)
3. Prueba hacer login

---

## ❌ ERRORES COMUNES Y SOLUCIONES

### 1. Error: "DATABASE_URL is not defined"

**Error:**
```
Error: DATABASE_URL no está definida o no es una cadena
```

**Solución:**
Ve a Vercel → Settings → Environment Variables → Agrega:
```
DATABASE_URL=postgresql://user:pass@host:5432/database
JWT_SECRET=tu_secreto_aleatorio
NODE_ENV=production
```

Después: Deployments → Redeploy

---

### 2. Error: "Module not found: Can't resolve 'fs'"

**Error:**
```
Module not found: Can't resolve 'fs'
Module not found: Can't resolve 'path'
```

**Causa:** `src/lib/db.js` usa módulos de Node.js que no están disponibles en el cliente.

**Solución:** Asegúrate de que `db.js` solo se importe en:
- API routes (src/app/api/*)
- Server Components

NO en:
- Client Components ('use client')
- Componentes del navegador

---

### 3. Error: TypeScript/ESLint

**Error:**
```
Type error: ...
ESLint: ...
```

**Solución rápida:**
En `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Solo para desarrollo
  },
  eslint: {
    ignoreDuringBuilds: true, // Solo para desarrollo
  },
};
```

⚠️ **NO recomendado para producción** - mejor corregir los errores

---

### 4. Error: "bcrypt not found" o build fallido por bcrypt

**Error:**
```
Error: Cannot find module 'bcrypt'
```

**Solución:**
El proyecto ya tiene `bcrypt` Y `bcryptjs`. Vercel debería usar automáticamente.
Si falla, verifica que ambos estén en `dependencies` (no devDependencies).

---

### 5. Error: Build timeout (más de 10 minutos)

**Causa:** Build tarda demasiado.

**Solución:**
1. Verifica que no haya imports circulares
2. Reduce el tamaño de dependencias
3. Usa un plan de Vercel con más tiempo de build

---

### 6. Error: "pg" module issues

**Error:**
```
Cannot find module 'pg'
Critical dependency: require function is used in a way...
```

**Solución:**
En `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('pg', 'pg-native');
    }
    return config;
  },
};
```

---

### 7. Error 500 después de deploy exitoso

**Síntomas:**
- Build completó OK ✓
- Al abrir la app: Error 500

**Causas comunes:**
1. Variables de entorno faltantes
2. Base de datos no accesible
3. JWT_SECRET no configurado

**Verificar:**
```
Vercel → Deployments → [último] → Functions → Ver logs
```

**Solución:**
1. Configura TODAS las variables de entorno:
   - DATABASE_URL
   - JWT_SECRET
   - NODE_ENV=production

2. Verifica conexión a BD:
   - ¿Neon permite conexiones desde cualquier IP?
   - ¿El connection string incluye `?sslmode=require`?

3. Redeploy después de agregar variables

---

## 🔧 CONFIGURACIÓN RECOMENDADA PARA VERCEL

### vercel.json (ya lo tienes)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

### Variables de Entorno en Vercel

**OBLIGATORIAS:**
- `DATABASE_URL`: Connection string completo de Neon/Postgres
- `JWT_SECRET`: String aleatorio de 32+ caracteres
- `NODE_ENV`: "production"

**Para todas las environments:**
☑️ Production
☑️ Preview
☑️ Development

---

## 📝 CHECKLIST POST-BUILD

Después de que el build complete:

- [ ] Build exitoso sin errores
- [ ] URL de preview generada
- [ ] Página principal carga (/)
- [ ] Login page carga (/login)
- [ ] Puedes hacer login con admin/admin123
- [ ] Admin panel funciona
- [ ] Crear afiliado funciona
- [ ] Crear comercio funciona
- [ ] Generar PDF funciona
- [ ] No hay errores en console (F12)

---

## 🔍 CÓMO VER LOGS DE ERRORES

### Durante el Build:
Vercel te muestra el output completo en la página de deploy

### Después del Deploy:
1. Ve a Vercel Dashboard
2. Tu Proyecto → Deployments
3. Click en el deployment actual
4. Tab "Functions" o "Logs"
5. Busca errores en rojo

### En la App:
1. Abre la app en el navegador
2. F12 → Console
3. Busca errores en rojo
4. Network tab → Ver requests fallidos

---

## 💡 COMANDOS ÚTILES

### Probar build localmente:
```bash
npm run build
npm start
```

### Ver si hay errores de TypeScript:
```bash
npx tsc --noEmit
```

### Ver si hay errores de ESLint:
```bash
npx next lint
```

---

## 🆘 SI TODO FALLA

### Plan B: Build manual
```bash
# Local
npm run build

# Si funciona local, el problema es configuración de Vercel
# Revisa variables de entorno
```

### Contactar Soporte
- Vercel Discord: https://vercel.com/discord
- Vercel Docs: https://vercel.com/docs

---

## 📊 VERIFICAR BUILD EXITOSO

Al final deberías ver:

```
✓ Compiled successfully
✓ Type checking complete
✓ Linting complete
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Collecting build traces
✓ Finalizing page optimization

Build Completed in Xm Xs
Deployed to production: https://tu-proyecto.vercel.app
```

¡Copia esa URL y prueba tu aplicación!
