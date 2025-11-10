-- =========================================
-- MIGRACIÓN: desde tu script pegado a la estructura actual
-- Aplica en una BD que tenga:
--   - afiliados con columna idusuario y FK fk_user_afiliado
--   - users SIN idafiliado
--   - users (posible) con columna idcomercio (opcional; se elimina si existe)
-- Resultado final:
--   - users.idafiliado (UNIQUE, FK -> afiliados.idafiliado)
--   - afiliados SIN idusuario
--   - users SIN idcomercio
--   - comercios sigue usando comercios.idusuario -> users.id
-- =========================================

BEGIN;

-- 0) Backup de seguridad (recomendado)
CREATE TABLE IF NOT EXISTS users_backup_migracion AS SELECT * FROM users WHERE 1=0;
INSERT INTO users_backup_migracion SELECT * FROM users;

-- 1) Asegurar que la FK antigua existe antes de dropearla
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='afiliados' AND constraint_name='fk_user_afiliado'
  ) THEN
    ALTER TABLE afiliados DROP CONSTRAINT fk_user_afiliado;
  END IF;
END $$;

-- 2) Agregar columna idafiliado en users (si no existe)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='idafiliado'
  ) THEN
    ALTER TABLE users ADD COLUMN idafiliado INT NULL;
  END IF;
END $$;

-- 3) Poblar users.idafiliado en base a afiliados.idusuario -> users.id
--    (Solo si la columna existe en afiliados)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='afiliados' AND column_name='idusuario'
  ) THEN
    UPDATE users u
    SET idafiliado = a.idafiliado
    FROM afiliados a
    WHERE a.idusuario = u.id
      AND (u.idafiliado IS NULL OR u.idafiliado <> a.idafiliado);
  END IF;
END $$;

-- 4) Quitar columna idusuario de afiliados (si existe)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='afiliados' AND column_name='idusuario'
  ) THEN
    ALTER TABLE afiliados DROP COLUMN idusuario;
  END IF;
END $$;

-- 5) Crear FK users.idafiliado -> afiliados.idafiliado y UNIQUE
DO $$ BEGIN
  -- UNIQUE (idafiliado)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='users_idafiliado_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_idafiliado_key UNIQUE (idafiliado);
  END IF;
  -- FK (idafiliado)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='users' AND constraint_name='fk_afiliado_user'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_afiliado_user
      FOREIGN KEY (idafiliado) REFERENCES afiliados(idafiliado)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

-- 6) Eliminar redundancia idcomercio en users (si existe)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='idcomercio'
  ) THEN
    ALTER TABLE users DROP COLUMN idcomercio;
  END IF;
END $$;

COMMIT;

-- Verificaciones
-- SELECT column_name FROM information_schema.columns WHERE table_name='afiliados';
-- SELECT column_name FROM information_schema.columns WHERE table_name='users';
-- \d users
-- \d afiliados
