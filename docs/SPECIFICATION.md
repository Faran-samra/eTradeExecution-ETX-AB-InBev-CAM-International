# Especificación funcional · Trade Survey Platform

## Resumen ejecutivo

Plataforma multi-país para AB InBev CAM International que digitaliza el levantamiento de información en puntos de venta (PDVs). Cada Gerente de Ventas y Marketing (GVM) visita PDVs físicos, realiza un check-in con GPS, y completa hasta seis tipos de levantamientos por punto: precios, inventario, neveras, góndolas, material POP y competencia. La información se sincroniza en tiempo real con un dashboard regional donde supervisores y administradores monitorean cobertura, alertas de quiebre (OOS) y desempeño por país.

---

## Mercados y alcance

| País | Código | Distribuidor |
|---|---|---|
| Venezuela 🇻🇪 | VE | Distribuidora AB InBev Caracas |
| Panamá 🇵🇦 | PA | Distribuidora CAM Panamá |
| Costa Rica 🇨🇷 | CR | Distribuidora CAM Costa Rica |
| Guatemala 🇬🇹 | GT | Distribuidora CAM Guatemala |
| Honduras 🇭🇳 | HN | Distribuidora CAM Honduras |
| El Salvador 🇸🇻 | SV | Distribuidora CAM El Salvador |

**Plan piloto inicial:** 50 PDVs reales en Caracas (Las Mercedes, Los Palos Grandes, La Castellana, El Hatillo, Bello Monte, etc.), con expansión progresiva al resto de mercados.

---

## Roles del sistema

### 1. Administrador (global)
- Sin país asignado (visión completa)
- Crea/edita/elimina cualquier usuario (admin, supervisor, GVM) de cualquier país
- Ve todos los PDVs y todos los levantamientos del CAM
- Importa catálogos masivos (CSV/Excel) para cualquier país
- Accede a todos los reportes consolidados

### 2. Supervisor (por país)
- País asignado fijo (`country` no-nulo)
- Ve solamente: usuarios y PDVs de **su mismo país**
- Crea/edita/elimina **solo GVMs de su mismo país** (no puede crear admins ni supervisores)
- Importa catálogos solo para su país
- Asigna PDVs a GVMs de su país o los deja en el pool
- Recibe alertas críticas (OOS, desviaciones de precio, equipos fuera de servicio) de su país

### 3. GVM — Gerente de Ventas y Marketing (por país)
- País asignado fijo
- Ve **solamente**: PDVs de su país que (a) están asignados a él, o (b) están en el pool sin asignar
- Puede **auto-asignarse** PDVs del pool de su país
- Realiza check-in (GPS validado dentro de 50m del PDV)
- Completa los 6 tipos de levantamiento por PDV
- No accede al dashboard del supervisor
- No crea ni modifica usuarios

---

## Flujo principal del GVM

### Login
1. Pantalla con campos **Usuario/Email** y **Contraseña**
2. Validación contra Supabase Auth
3. Carga del perfil extendido (rol, país, etc.)

### Itinerario de la jornada
- Header con avance (X de Y PDVs visitados, % cobertura)
- Lista ordenada de PDVs asignados al GVM
- Botón "Pool · N" si hay PDVs disponibles para auto-asignación
- Tap en un PDV → pantalla de detalle

### Detalle del PDV
- Encabezado con nombre, ID, categoría, canal, distribuidor, dirección
- Botón grande "**Realizar Check-in**" (deshabilita los 6 levantamientos hasta completarse)
- Después del check-in: 6 cards con los tipos de levantamiento

### Check-in
- Solicita ubicación GPS (`navigator.geolocation`)
- Calcula distancia al PDV registrado con fórmula de Haversine
- Tolerancia: 50m. Si excede → alerta visible al supervisor pero permite continuar
- Foto obligatoria de fachada del local (cámara en vivo)
- Registro en tabla `checkins` con lat/lng/distancia/foto

### Levantamientos
Cada levantamiento se compone de:
- Datos específicos del tipo (ver abajo)
- **Foto obligatoria** capturada en vivo (`getUserMedia`)
  - La foto lleva marca de agua "🔴 EN VIVO · timestamp" dibujada en canvas
  - Si `getUserMedia` no está disponible, fallback a `<input capture>` (sin marca live)
- Botón "Confirmar y sincronizar" (deshabilitado hasta foto + datos obligatorios)

#### 1. Precios
- Captura de foto del anaquel → análisis IA automático con Claude Sonnet 4
- IA devuelve: marcas detectadas, empaques, precios estimados, confidence
- Tabla editable con SKUs detectados (la IA pre-llena, el GVM corrige)
- Semáforo automático vs PSV (precio sugerido al vendedor):
  - Verde: desviación ≤ 5%
  - Amarillo: 5-15%
  - Rojo (alerta): > 15%
- Botón "+ Manual" para agregar SKUs adicionales
- Foto general de evidencia obligatoria (separada de la foto IA)

#### 2. Inventario
- Stepper por SKU (incremento/decremento)
- Si el conteo es cero → alerta de OOS (Out-of-Stock) automática al supervisor
- Notas libres
- Foto obligatoria

#### 3. Neveras (Coolers)
- Identificación del equipo (escaneo QR simulado: NEV-XXX-NNNNN)
- Estado general: Excelente | Bueno | Regular | Malo | Fuera de servicio
- Share of Cooler: slider 0-100% AB InBev vs Competencia
- Cumplimiento de planograma (Sí/No)
- Branding AB InBev visible (Sí/No)
- Foto del frente abierto

#### 4. Góndolas
- Foto del lineal
- Notas
- (Posible extensión: IA para share of shelf en góndolas)

#### 5. Material POP (Point of Purchase)
- Foto de elementos publicitarios instalados
- Notas

#### 6. Competencia
- Mismo flujo que Precios pero filtrado para no-AB InBev

---

## Flujo del Supervisor / Admin

### Dashboard - Resumen
- KPIs consolidados:
  - Cobertura regional (visitados / planificados)
  - GVMs activos
  - Alertas OOS totales
  - Price Compliance promedio
  - Share of Shelf promedio
- Cumplimiento de itinerario por GVM (barra de progreso)
- Mapa de cobertura CAM
- Alertas críticas en tiempo real
- Botones de reportes exportables (PDF/Excel)

### Dashboard - Catálogo de PDVs
- Tabla con todos los PDVs visibles según permisos
- Importar CSV/Excel:
  1. Seleccionar país obligatoriamente (Admin elige cualquiera; Supervisor fijo en su país)
  2. Subir archivo
  3. SheetJS parsea columnas: `id`, `name`/`nombre`, `cat`/`categoría`, `channel`/`canal`, `dist`/`distribuidor`, `addr`/`dirección`, `lat`, `lng`
  4. Inserción/actualización por ID (mantiene asignaciones existentes)
- Filtros: estado (Todos/Asignados/Pool), país, búsqueda libre
- Acciones por fila:
  - **Asignar a GVM**: dropdown con GVMs del mismo país del PDV
  - **Liberar**: devuelve el PDV al pool
  - **Eliminar**: con confirmación

### Dashboard - Gestión de Usuarios
- Tabla con usuarios visibles según permisos
- Botón "Crear usuario" → modal con campos:
  - Nombre completo
  - Usuario (único)
  - Email (único)
  - Contraseña
  - Rol (admin: cualquier rol; supervisor: solo GVM)
  - País (admin: cualquier país; supervisor: fijo en su país)
- Validación de unicidad
- Botón "Editar" y "Eliminar" por fila
- No se puede eliminar la propia cuenta

---

## Análisis IA de Góndolas

### Pipeline
1. GVM toma foto en vivo del anaquel
2. Imagen convertida a base64 en el frontend
3. POST a Edge Function `/analyze-shelf` con `{ image: base64, mimeType }`
4. Edge Function hace POST a `api.anthropic.com/v1/messages` con prompt estructurado
5. Claude responde con JSON: `{ items: [...], facings_abi: N, facings_total: N }`
6. Frontend pre-llena la tabla de SKUs detectados
7. GVM corrige precios y confirma

### Modelo y prompt
- Modelo: `claude-sonnet-4-20250514`
- Marcas reconocidas: Corona, Budweiser, Stella Artois, Modelo, Atlas, Balboa, + competencia
- Información extraída: marca, empaque (lata/botella), precio (si etiqueta legible), confidence 0-100

### Seguridad
- La API key de Anthropic vive solamente en variables de entorno de Supabase
- El frontend nunca toca la API directamente
- Rate limiting recomendado a nivel Edge Function (no incluido en MVP)

---

## Captura de fotos en vivo

### Estrategia híbrida
1. **Primer intento**: `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`
2. Si éxito: modal a pantalla completa con preview, botón circular de captura, captura un frame del video en canvas, dibuja marca de agua "🔴 EN VIVO + timestamp"
3. Si falla (iframe sin permiso, dispositivo sin cámara): fallback a `<input type="file" accept="image/*" capture="environment">` — en móvil abre cámara nativa, en escritorio abre selector de archivos
4. Las fotos en vivo llevan el sello visible; las fotos del fallback no — el supervisor distingue ambos casos

### Subida a Storage
- Bucket: `survey-photos` (público para lectura, autenticado para escritura)
- Ruta: `surveys/{survey_id}/{kind}-{timestamp}.jpg`
- Tamaño objetivo: ≤500 KB (JPEG calidad 0.88)
- Política RLS: solo usuarios autenticados pueden subir; cualquiera puede leer (porque las URLs son únicas y largas)

---

## Asignación de PDVs

### Estados del PDV
- `pending`: sin visitar
- `in_progress`: GVM hizo check-in pero no completó todos los levantamientos
- `done`: levantamientos completados

### Estados de asignación
- `assigned_to = null`: en el pool del país (cualquier GVM del país puede tomarlo)
- `assigned_to = <gvm.id>`: asignado al GVM (solo él lo ve)

### Acciones
- **Supervisor asigna directamente**: PUT `pdvs.assigned_to = gvm.id`
- **Supervisor libera**: PUT `pdvs.assigned_to = null`
- **GVM se auto-asigna del pool**: PUT `pdvs.assigned_to = self.id` (RLS valida que el PDV esté en el pool y sea de su país)

---

## Modo offline (futuro, no incluido en MVP)

El prototipo incluye un toggle visual de online/offline. En producción se recomienda:
- IndexedDB local para colas pendientes
- Sincronización automática al recuperar conexión
- Indicador visible del número de items pendientes
- Background Sync API si el browser lo soporta

---

## Reportes exportables (futuro)

El dashboard menciona 4 reportes pero no los genera todavía:
1. Reporte de Visitas Diarias (PDF / Excel)
2. Reporte de Precios por Mercado (PDF / Excel)
3. Reporte de Share of Shelf (PDF)
4. Reporte Ejecutivo CAM (PDF mensual)

**Implementación recomendada**: Edge Functions con `jsPDF` o `pdfmake` para PDFs, y `xlsx` para Excel. La data viene de queries agregadas sobre las tablas `surveys`, `survey_items`, `checkins`.
