# Sistema de Cambio de Contraseña

## 📋 Descripción
Sistema completo para que los usuarios (afiliados, comercios y administradores) puedan cambiar su contraseña una vez que hayan iniciado sesión.

## 🎯 Características

### ✅ Seguridad
- **Validación de contraseña actual**: Verifica que el usuario conozca su contraseña actual antes de permitir el cambio
- **Validación de longitud**: La nueva contraseña debe tener al menos 6 caracteres
- **Prevención de duplicados**: No permite usar la misma contraseña actual como nueva contraseña
- **Hash seguro**: Todas las contraseñas se almacenan usando bcrypt con hash seguro
- **Autenticación por JWT**: Solo usuarios autenticados pueden cambiar su contraseña

### 🎨 Interfaz de Usuario
- **Modal responsive**: Diseño moderno que se adapta a cualquier pantalla
- **Visibilidad de contraseñas**: Botones para mostrar/ocultar contraseñas (👁️/🙈)
- **Validaciones en tiempo real**: Feedback instantáneo de errores
- **Mensajes claros**: Indicaciones específicas de éxito o error
- **Consejos de seguridad**: Tips para crear contraseñas seguras

### 🔐 Validaciones Implementadas

#### Del lado del cliente:
1. Todos los campos son requeridos
2. Nueva contraseña debe tener mínimo 6 caracteres
3. Nueva contraseña debe coincidir con la confirmación
4. Nueva contraseña debe ser diferente a la actual

#### Del lado del servidor:
1. Usuario debe estar autenticado (verificación de JWT)
2. Contraseña actual debe ser correcta
3. Nueva contraseña debe cumplir requisitos mínimos
4. Nueva contraseña debe ser diferente a la actual

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:

1. **`src/app/api/cambiar-contrasena/route.ts`**
   - API endpoint que maneja el cambio de contraseña
   - Verifica autenticación, valida datos y actualiza la contraseña

2. **`src/components/CambiarContrasenaModal.tsx`**
   - Componente modal reutilizable para cambiar contraseña
   - Incluye formulario completo con validaciones y UI moderna

### Archivos Modificados:

3. **`src/app/afiliado/page.tsx`**
   - Agregado botón "Cambiar Contraseña" en el header
   - Integrado el modal de cambio de contraseña

4. **`src/app/comercio/page.tsx`**
   - Agregado botón "Cambiar Contraseña" en el header
   - Integrado el modal de cambio de contraseña

5. **`src/app/admin/afiliado/page.tsx`**
   - Agregado botón "Cambiar Contraseña" en el header
   - Integrado el modal de cambio de contraseña

6. **`src/app/admin/comercio/page.tsx`**
   - Agregado botón "Cambiar Contraseña" en el header
   - Integrado el modal de cambio de contraseña

## 🚀 Cómo Usar

### Para Afiliados:
1. Iniciar sesión en `/login`
2. En el panel principal, hacer clic en el botón "Cambiar Contraseña" (icono de llave)
3. Completar el formulario:
   - Contraseña Actual
   - Nueva Contraseña
   - Confirmar Nueva Contraseña
4. Hacer clic en "Cambiar Contraseña"
5. Recibirá confirmación de éxito y el modal se cerrará automáticamente

### Para Comercios:
1. Iniciar sesión en `/login`
2. En el panel de ventas, hacer clic en el botón "Cambiar Contraseña"
3. Seguir los mismos pasos que los afiliados

### Para Administradores:
1. Iniciar sesión en `/admin/login`
2. En cualquier página de gestión (Afiliados o Comercios), hacer clic en "Cambiar Contraseña"
3. Seguir los mismos pasos que los afiliados

## 🔧 Detalles Técnicos

### API Endpoint: `/api/cambiar-contrasena`
**Método:** POST

**Request Body:**
```json
{
  "currentPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

**Respuestas:**

**Éxito (200):**
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

**Errores:**
- **401 No autenticado**: Usuario no tiene sesión válida
- **401 Contraseña incorrecta**: La contraseña actual no es correcta
- **400 Validación fallida**: Datos no válidos
- **404 Usuario no encontrado**: Usuario no existe en la base de datos
- **500 Error del servidor**: Error interno

### Componente Modal

**Props:**
```typescript
interface CambiarContrasenaModalProps {
  isOpen: boolean;      // Controla visibilidad del modal
  onClose: () => void;  // Callback al cerrar el modal
}
```

**Estados:**
- `currentPassword`: Contraseña actual
- `newPassword`: Nueva contraseña
- `confirmPassword`: Confirmación de nueva contraseña
- `showCurrentPassword`: Visibilidad de contraseña actual
- `showNewPassword`: Visibilidad de nueva contraseña
- `showConfirmPassword`: Visibilidad de confirmación
- `error`: Mensaje de error
- `success`: Estado de éxito
- `loading`: Estado de carga

## 📝 Consejos de Seguridad Mostrados

El modal muestra los siguientes consejos automáticamente:
- Use al menos 6 caracteres
- Combine letras, números y símbolos
- No use contraseñas obvias
- Cambie su contraseña regularmente

## 🎨 Diseño Visual

### Colores:
- **Botón principal**: Gris (bg-gray-600/700)
- **Icono**: Llave (🔑)
- **Estado éxito**: Verde
- **Estado error**: Rojo
- **Fondo modal**: Blanco con sombra
- **Overlay**: Negro semi-transparente

### Responsive:
- **Desktop**: Texto completo "Cambiar Contraseña"
- **Mobile**: Solo icono (oculta texto en pantallas pequeñas)

## 🔄 Flujo de Trabajo

```
Usuario hace clic en "Cambiar Contraseña"
    ↓
Modal se abre
    ↓
Usuario completa formulario
    ↓
Validaciones del cliente
    ↓
Request a API /api/cambiar-contrasena
    ↓
Validación de JWT (autenticación)
    ↓
Verificación de contraseña actual
    ↓
Validaciones del servidor
    ↓
Hash de nueva contraseña
    ↓
Actualización en base de datos
    ↓
Respuesta de éxito
    ↓
Mensaje de confirmación
    ↓
Modal se cierra automáticamente (2s)
```

## 🛡️ Seguridad Implementada

1. **Autenticación obligatoria**: Solo usuarios logueados pueden cambiar su contraseña
2. **Verificación de identidad**: Debe conocer su contraseña actual
3. **Hashing seguro**: bcrypt con salt de 10 rondas
4. **Protección CSRF**: Cookies HttpOnly y Secure
5. **Validaciones dobles**: Cliente y servidor
6. **Sin exposición de datos**: Contraseñas nunca se muestran en logs
7. **Timeout automático**: JWT expira en 8 horas

## ✅ Testing Recomendado

1. **Caso de éxito**: Cambiar contraseña con datos válidos
2. **Contraseña actual incorrecta**: Verificar que rechaza
3. **Contraseña muy corta**: Verificar validación de longitud
4. **Contraseñas no coinciden**: Verificar validación de confirmación
5. **Misma contraseña**: Verificar que rechaza contraseña duplicada
6. **Sin autenticación**: Verificar que requiere login
7. **Responsive**: Probar en diferentes tamaños de pantalla
8. **Visibilidad**: Probar botones de mostrar/ocultar contraseña

## 📚 Dependencias

- **bcrypt**: Para hashing de contraseñas
- **jose**: Para verificación de JWT
- **Next.js**: Framework base
- **React**: Para componentes UI
- **TypeScript**: Para tipado estático

## 🎯 Ubicación de Botones

### Afiliados (`/afiliado`):
- **Posición**: Header, junto al botón "Hacer Compra"
- **Color**: Gris
- **Icono**: Llave

### Comercios (`/comercio`):
- **Posición**: Header, encima de la sección de ventas
- **Color**: Gris
- **Icono**: Llave

### Admin - Afiliados (`/admin/afiliado`):
- **Posición**: Header, junto al botón "Agregar Afiliado"
- **Color**: Gris
- **Icono**: Llave
- **Responsive**: Solo icono en pantallas pequeñas

### Admin - Comercios (`/admin/comercio`):
- **Posición**: Header, junto al botón "Agregar Comercio"
- **Color**: Gris
- **Icono**: Llave
- **Responsive**: Solo icono en pantallas pequeñas

## 🚨 Mensajes de Error

| Error | Mensaje |
|-------|---------|
| Campos vacíos | "Todos los campos son requeridos" |
| Contraseña corta | "La nueva contraseña debe tener al menos 6 caracteres" |
| No coinciden | "Las contraseñas nuevas no coinciden" |
| Misma contraseña | "La nueva contraseña debe ser diferente a la actual" |
| Contraseña incorrecta | "La contraseña actual es incorrecta" |
| No autenticado | "No autenticado" |
| Error servidor | "Error al cambiar la contraseña" |
| Error conexión | "Error de conexión. Intente nuevamente." |

## ✨ Mejoras Futuras (Opcionales)

1. **Requisitos de contraseña más estrictos**: Mayúsculas, números, símbolos obligatorios
2. **Medidor de fortaleza**: Indicador visual de qué tan segura es la contraseña
3. **Historial de contraseñas**: No permitir reutilizar últimas N contraseñas
4. **Expiración forzada**: Obligar cambio de contraseña cada X días
5. **Verificación por email**: Enviar email de confirmación al cambiar contraseña
6. **2FA**: Autenticación de dos factores
7. **Recuperación de contraseña**: Sistema de "Olvidé mi contraseña"
8. **Logs de cambios**: Registro de cuándo y desde dónde se cambió la contraseña

---

**Fecha de implementación:** Noviembre 2025
**Versión:** 1.0
**Estado:** ✅ Completado y funcionando
