import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

export async function obtenerRegistro(id) {
  const filas = await sql`
    SELECT * FROM citas_reniec
    WHERE id = ${id} AND id_usuario = ${usuario.id};
  `;
  return filas[0] || null;
}

export async function actualizarRegistro(id, datos) {
  await sql`
    UPDATE citas_reniec
    SET nombre_ciudadano = ${datos.nombre},
        dni              = ${datos.dni},
        tipo_tramite     = ${datos.tipo_tramite},
        sede             = ${datos.sede}
    WHERE id = ${id} AND id_usuario = ${usuario.id}
      AND estado = 'registrado';
  `;
}