import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

export async function listarMisRegistros() {
  return await sql`
    SELECT id, codigo_seguimiento, nombre_ciudadano, dni,
           tipo_tramite, sede, estado, fecha_registro
    FROM citas_reniec
    WHERE id_usuario = ${usuario.id}
    ORDER BY fecha_registro DESC;
  `;
}