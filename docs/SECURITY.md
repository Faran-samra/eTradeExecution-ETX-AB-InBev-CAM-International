# Seguridad y privacidad

Este documento resume los controles de seguridad implementados y las recomendaciones críticas para producción.

---

## ✅ Lo que ya está implementado

### Row Level Security (RLS) por tabla
Todas las tablas tienen RLS habilitado. Las políticas garantizan que:
- Cada GVM solo lee sus PDVs y los del pool de su país
- Cada supervisor solo lee/escribe en datos de su país
- Solo admins ven todo
- Nadie puede modificar perfiles de otros usuarios desde el cliente

### Service role solo en Edge Functions
La `SUPABASE_SERVICE_ROLE_KEY` (que bypassea RLS) **nunca** sale del servidor:
- Solo las Edge Functions la usan
- El frontend siempre usa la `anon` key (que respeta RLS)

### Validación de permisos en Edge Functions
Las funciones `create-user` y `delete-user` validan en código que:
- Solo admin crea/elimina admins y supervisores
- Supervisor solo crea/elimina GVMs de su mismo país
- Nadie puede eliminar su propia cuenta

### API key de Anthropic protegida
La `ANTHROPIC_API_KEY` vive solo en variables de entorno del proyecto Supabase. El frontend hace POST a `/functions/v1/analyze-shelf` (autenticado con JWT) y la Edge Function actúa como proxy.

### Headers de seguridad en Netlify
`netlify.toml` configura:
- `X-Frame-Options: DENY` (anti-clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` restrictiva (solo permite scripts/conexiones a Supabase y Anthropic)
- `Permissions-Policy` para cámara y geolocalización

### Constraints de integridad
- `role_country_check` en `profiles`: admin requiere `country IS NULL`, supervisor/gvm requieren `country` no nulo
- Unique en `username` y `email`
- Foreign keys con `ON DELETE CASCADE` donde corresponde

### Validación de archivos en Storage
El bucket `survey-photos` tiene límite de 5 MB por archivo y solo acepta JPEG/PNG/WebP.

---

## ⚠️ Recomendaciones críticas antes de ir a producción

### 1. Cambiar TODAS las contraseñas demo
Las cuentas creadas por `bootstrap-seed` usan `admin/admin` y `1234`. **Cambiarlas inmediatamente** antes de exponer el sitio:

```bash
# Desde el dashboard de Supabase → Authentication → Users
# O por código:
await supabase.auth.admin.updateUserById(userId, { password: 'nueva_segura_xxx' });
```

Sugerencia: forzar cambio de contraseña en primer login (no implementado en MVP).

### 2. Implementar política de contraseñas
La validación actual solo exige que la contraseña no esté vacía. Recomendado en producción:
- Mínimo 12 caracteres
- Mayúsculas + minúsculas + dígito + símbolo
- No estar en lista de contraseñas comunes ([HaveIBeenPwned API](https://haveibeenpwned.com/API/v3))
- Rotación cada 90 días

Esto se configura en Supabase Auth o se valida en `create-user`.

### 3. Habilitar MFA (Multi-Factor Authentication)
Supabase Auth soporta TOTP. Para producción enterprise:
- Habilitar MFA obligatorio para roles `admin` y `supervisor`
- Opcional pero recomendado para GVMs

```js
const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
```

### 4. Rate limiting en Edge Functions
Sin protección, alguien podría agotar tu cuota de Anthropic con miles de requests a `analyze-shelf`. Implementar:
- Bucket de tokens por usuario (ej. 30 análisis IA / hora)
- Tabla `rate_limits` o usar Upstash Redis

Ejemplo simple:
```ts
// En la Edge Function analyze-shelf, antes de llamar a Claude:
const { count } = await admin.from('analyze_calls')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', caller.id)
  .gte('created_at', new Date(Date.now() - 3600_000).toISOString());

if (count >= 30) {
  return new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429 });
}

await admin.from('analyze_calls').insert({ user_id: caller.id });
```

### 5. Logs y auditoría
Crear una tabla `audit_log` para acciones críticas:
- Creación/eliminación de usuarios
- Asignación de PDVs
- Logins fallidos
- Cambios de rol

```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz default now()
);
```

Hacer INSERTs desde las Edge Functions cuando se ejecute una acción privilegiada.

### 6. Restringir CORS en Edge Functions
Actualmente las Edge Functions tienen `Access-Control-Allow-Origin: *`. En producción:

```ts
const ALLOWED_ORIGINS = ['https://app.abinbev.com', 'https://staging.abinbev.com'];
const origin = req.headers.get('origin');
const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';
```

### 7. Sanitizar inputs
Aunque PostgreSQL es resistente a SQL injection vía PostgREST, hay que sanitizar:
- HTML en notas libres (usar DOMPurify si se renderiza con `dangerouslySetInnerHTML`)
- Filenames antes de subir a Storage (evitar `../` y caracteres especiales)
- URLs en links

### 8. Backups verificados
Supabase hace backups automáticos pero hay que **probar la restauración** periódicamente:
1. Crear un proyecto de staging
2. Restaurar el backup más reciente
3. Verificar que la data está completa

### 9. Variables de entorno seguras
- Nunca commitear `.env.local`
- Usar [Doppler](https://www.doppler.com/), [1Password CLI](https://developer.1password.com/docs/cli) o el secret manager de Netlify
- Rotar la `service_role` key si se sospecha exposición

---

## Privacidad y cumplimiento

### Datos personales recolectados
- **De empleados (GVMs, supervisores, admins)**: nombre, email, teléfono opcional, foto de avatar, ubicación GPS durante check-in
- **De PDVs (terceros)**: nombre comercial, dirección, GPS, datos de operación (precios, inventario)
- **De fotos**: pueden incluir incidentalmente personas (clientes en el local, empleados del PDV)

### Recomendaciones GDPR / Habeas Data
Aunque AB InBev opere en Centroamérica donde GDPR no aplica directamente, varios países tienen leyes equivalentes (Ley 81 Panamá, Ley 8968 Costa Rica, etc.):

1. **Aviso de privacidad**: agregar al login una nota visible del tratamiento de datos
2. **Consentimiento explícito**: checkbox de "Acepto los términos" al crear usuario
3. **Derecho al olvido**: implementar endpoint para que un usuario solicite eliminación de su data (la Edge Function `delete-user` ya cubre lo básico)
4. **Portabilidad de datos**: implementar exportación de toda la data de un usuario en JSON
5. **Cifrado en reposo**: PostgreSQL de Supabase ya lo hace; verificar también el bucket Storage

### Retención
Recomendación: 24 meses para levantamientos, 12 meses para fotos, 36 meses para auditoría. Implementar job de limpieza en cron de Supabase:

```sql
-- Borrar surveys de más de 24 meses
delete from surveys where created_at < now() - interval '24 months';

-- Marcar fotos huérfanas para borrado posterior del Storage
```

---

## Manejo de incidentes

### Si se compromete la `service_role` key
1. Rotar inmediatamente desde Supabase Dashboard → Settings → API → Regenerate
2. Actualizar la variable en Edge Functions (re-deploy)
3. Revisar logs en busca de actividad sospechosa
4. Notificar al equipo de seguridad corporativa

### Si se compromete una cuenta de admin
1. Eliminar la cuenta desde Auth → Users
2. Revisar `audit_log` (si está implementado) para entender el alcance
3. Forzar logout de todas las sesiones activas: `supabase.auth.admin.signOut(userId)`
4. Cambiar contraseñas de todos los admins/supervisores como precaución

### Si las fotos contienen información sensible
- El bucket es público pero las URLs son únicas y largas (security through obscurity es débil)
- Para mayor seguridad: cambiar bucket a privado y servir las fotos vía signed URLs con expiración

```js
const { data } = await supabase.storage
  .from('survey-photos')
  .createSignedUrl(path, 3600); // 1 hora
```

---

## Checklist pre-producción

- [ ] Todas las contraseñas demo cambiadas
- [ ] Política de contraseñas fuerte implementada
- [ ] MFA habilitado para admins y supervisores
- [ ] Rate limiting en `analyze-shelf`
- [ ] CORS restringido al dominio de producción
- [ ] Aviso de privacidad visible en login
- [ ] Backups probados al menos una vez
- [ ] Logs de auditoría implementados
- [ ] Variables de entorno en gestor de secretos (no en `.env`)
- [ ] Penetration test ligero (OWASP Top 10)
- [ ] Plan de respuesta a incidentes documentado
