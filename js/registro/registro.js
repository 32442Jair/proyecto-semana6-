import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

const usuario = exigirSesion();

export async function guardarRegistro(datos) {
  const codigo = 'COD-' + Date.now().toString().slice(-8);

  await sql`
    INSERT INTO citas_reniec
      (id_usuario, codigo_seguimiento, nombre_ciudadano,
       dni, tipo_tramite, sede)
    VALUES
      (${usuario.id}, ${codigo}, ${datos.nombre},
       ${datos.dni}, ${datos.tipo_tramite}, ${datos.sede})
  `;
  return codigo;
}