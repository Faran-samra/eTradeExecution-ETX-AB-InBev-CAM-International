-- =====================================================================
-- SEED: Datos iniciales de demo
-- IMPORTANTE: Las contraseñas de auth.users se crean via Edge Function bootstrap-seed
-- o manualmente desde el Dashboard de Supabase Authentication.
--
-- Este seed asume que YA EXISTEN los auth.users con estos UUIDs.
-- En desarrollo, ejecuta primero la Edge Function `bootstrap-seed` o crea
-- los usuarios desde el dashboard y reemplaza los UUIDs abajo.
-- =====================================================================

-- Ejemplo de cómo poblar la tabla profiles después de crear los auth users.
-- Reemplazar los UUIDs con los reales generados por Supabase Auth.

-- ⚠️ NO ejecutar este bloque tal cual. Es una plantilla de referencia.
-- Usar la Edge Function `bootstrap-seed` o el script `scripts/seed.js`.

/*
-- Plantilla:
insert into profiles (id, username, email, name, role, country, initials, color, planned) values
  ('00000000-0000-0000-0000-000000000001', 'admin',   'admin@abinbev.local',         'Administrador',   'admin',      null, 'AD', '#26303A', 0),
  ('00000000-0000-0000-0000-000000000002', 'sup.ve',  'supervisor.ve@abinbev.local', 'María González',   'supervisor', 'VE', 'MG', '#2C4256', 0),
  ('00000000-0000-0000-0000-000000000003', 'eduardo', 'eduardo.mendez@abinbev.local','Eduardo Méndez',   'gvm',        'VE', 'EM', '#C68A12', 8);
*/

-- =====================================================================
-- PDVs DE DEMO (50 clientes del Plan Piloto Caracas + 12 demo de otros países)
-- =====================================================================
insert into pdvs (id, name, cat, channel, dist, addr, lat, lng, status, "order", country, assigned_to) values
('PDV-CCS-001', '2Doce Market', 'Bodegón', 'Off-trade', 'Distribuidora AB InBev Caracas', 'Las Mercedes, Caracas', 10.4737, -66.8623, 'pending', 1, 'VE', null),
('PDV-CCS-002', 'Nola Gourmet', 'Bodegón / Gourmet', 'Off-trade', 'Distribuidora AB InBev Caracas', 'Los Palos Grandes, Caracas', 10.5042, -66.8531, 'pending', 2, 'VE', null),
('PDV-CCS-003', 'Celicor La Urbina', 'Licorería', 'Off-trade', 'Distribuidora AB InBev Caracas', 'La Urbina, Caracas', 10.4838, -66.8118, 'pending', 3, 'VE', null),
('PDV-CCS-004', 'Celicor Boutique', 'Licorería especializada', 'Off-trade', 'Distribuidora AB InBev Caracas', 'Las Mercedes, Caracas', 10.4778, -66.8589, 'pending', 4, 'VE', null),
('PDV-CCS-005', 'Osomanía', 'Bodegón / Tienda', 'Off-trade', 'Distribuidora AB InBev Caracas', 'La Castellana, Caracas', 10.5040, -66.8523, 'pending', 5, 'VE', null),
('PDV-CCS-006', 'Automercado Santa Rosa de Lima', 'Supermercado', 'Off-trade', 'Distribuidora AB InBev Caracas', 'Santa Rosa de Lima, Caracas', 10.4598, -66.8462, 'pending', 6, 'VE', null),
('PDV-CCS-007', 'Automercado Alegría', 'Supermercado', 'Off-trade', 'Distribuidora AB InBev Caracas', 'Los Palos Grandes, Caracas', 10.5018, -66.8534, 'pending', 7, 'VE', null),
('PDV-CCS-008', 'Buy Now', 'Bodegón / Market', 'Off-trade', 'Distribuidora AB InBev Caracas', 'Las Mercedes, Caracas', 10.4729, -66.8612, 'pending', 8, 'VE', null);

-- (los 42 PDVs restantes de Caracas y los 12 demo de otros países pueden agregarse aquí
--  o cargarse via la UI del admin desde un archivo Excel)

-- =====================================================================
-- NOTAS DE PRODUCCIÓN
-- =====================================================================
-- Para poblar usuarios reales en producción:
-- 1) Crear cuentas desde el dashboard de Supabase Auth → Users → Add user
-- 2) Tomar el UUID generado y hacer INSERT en profiles con los campos extra
-- 3) O usar la Edge Function `bootstrap-seed` que automatiza ambos pasos
