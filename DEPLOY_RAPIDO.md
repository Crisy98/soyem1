# 🚀 Despliegue Rápido - 3 Pasos

## 1. Subir a GitHub

```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## 2. Crear Base de Datos en Neon

1. Ve a **https://neon.tech** → Regístrate
2. "Create a project" → Nombre: `soyem-db`
3. Copia el **Connection String**
4. Exporta tu DB local:
   ```powershell
   cd scripts
   .\exportar_db.ps1
   ```
5. Importa a Neon:
   ```powershell
   .\importar_db.ps1 -ConnectionString "TU_CONNECTION_STRING_DE_NEON" -BackupFile "backup_FECHA.sql"
   ```

## 3. Desplegar en Vercel

1. Ve a **https://vercel.com** → Login con GitHub
2. "New Project" → Importa tu repo
3. Agrega **Environment Variables**:
   - `DATABASE_URL` = Connection string de Neon
   - `JWT_SECRET` = String aleatorio (32+ caracteres)
   - `NODE_ENV` = `production`
4. Click **Deploy**
5. ¡Listo! 🎉

---

## 📚 Guía Completa

Ver **DESPLIEGUE.md** para instrucciones detalladas, troubleshooting y opciones avanzadas.

---

## 🔑 Variables de Entorno Necesarias

```env
DATABASE_URL=postgresql://usuario:password@host:5432/database
JWT_SECRET=tu_secreto_super_seguro_de_minimo_32_caracteres
NODE_ENV=production
```

---

## ⚡ Generar JWT_SECRET

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🆘 Problemas Comunes

- **Error de DATABASE_URL**: Verifica que la variable esté configurada en Vercel
- **Error de conexión**: Asegúrate de incluir `?sslmode=require` en Neon
- **500 Internal Error**: Revisa los logs en Vercel → Deployments → Functions

---

## 📖 Recursos

- [Neon Docs](https://neon.tech/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
