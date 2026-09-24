import { sql } from '../neon-config.js';

export async function guardarRegistro(datos) {
  const codigo = 'COD-' + Date.now().toString().slice(-8);

  await sql`
    INSERT INTO citas_reniec
      (codigo_seguimiento, nombre_ciudadano, dni, tipo_tramite, sede)
    VALUES
      (${codigo}, ${datos.nombre}, ${datos.dni},
       ${datos.tipo_tramite}, ${datos.sede})
  `;

  return codigo;
}