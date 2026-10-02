// ============================================================
// PANEL — Administrador / Empleado (RENIEC Perú)
// Caso 12: ESPINOZA REQUIS, Jair Rodrigo
// ============================================================

import { sql } from '../config/neon-config.js';
import { exigirSesion } from '../auth/auth.js';

// 1) Verificar sesión y rol
const usuario = exigirSesion();

if (usuario.rol === 'cliente') {
  window.location.href = 'registro.html';
  throw new Error('Cliente no autorizado en el panel');
}

// ============================================================
// CONSULTAR — Todas las citas (sin filtro por usuario)
// ============================================================
export async function listarTodos() {
  return await sql`
    SELECT
      c.id,
      c.codigo_seguimiento,
      c.nombre_ciudadano,
      c.dni,
      c.tipo_tramite,
      c.sede,
      c.estado,
      c.fecha_registro,
      c.id_usuario,
      u.nombre AS creado_por
    FROM citas_reniec c
    LEFT JOIN usuarios u ON u.id = c.id_usuario
    ORDER BY c.fecha_registro DESC;
  `;
}

// ============================================================
// CREAR — Registrar una cita presencial (desde el mostrador)
// id_usuario queda NULL porque no hay cliente logueado
// ============================================================
export async function crearRegistro(datos) {
  const codigo = 'COD-' + Date.now().toString().slice(-8);

  const filas = await sql`
    INSERT INTO citas_reniec
      (codigo_seguimiento, nombre_ciudadano, dni,
       tipo_tramite, sede, estado)
    VALUES
      (${codigo}, ${datos.nombre}, ${datos.dni},
       ${datos.tipo_tramite}, ${datos.sede}, 'registrado')
    RETURNING codigo_seguimiento;
  `;

  return filas[0].codigo_seguimiento;
}

// ============================================================
// ACTUALIZAR — Cualquier cita, incluyendo el estado
// ============================================================
export async function actualizarComoPanel(id, datos) {
  await sql`
    UPDATE citas_reniec
    SET nombre_ciudadano = ${datos.nombre},
        dni              = ${datos.dni},
        tipo_tramite     = ${datos.tipo_tramite},
        sede             = ${datos.sede},
        estado           = ${datos.estado}
    WHERE id = ${id};
  `;
}

// ============================================================
// ELIMINAR — Cualquier cita
// ============================================================
export async function eliminarRegistro(id) {
  await sql`DELETE FROM citas_reniec WHERE id = ${id};`;
}

// ============================================================
// LÓGICA DE LA INTERFAZ (solo si estamos en panel.html)
// ============================================================
if (document.getElementById('cuerpo')) {
  iniciarPanel();
}

async function iniciarPanel() {
  const cuerpo    = document.getElementById('cuerpo');
  const formNuevo = document.getElementById('form-nuevo');
  const formEdit  = document.getElementById('form-edit');
  const msg       = document.getElementById('msg');

  // --- Refrescar tabla ---
  async function refrescar() {
    try {
      const filas = await listarTodos();
      cuerpo.innerHTML = filas.map(f => `
        <tr>
          <td>${f.id}</td>
          <td>${f.codigo_seguimiento}</td>
          <td>${f.nombre_ciudadano ?? ''}</td>
          <td>${f.dni ?? ''}</td>
          <td>${f.tipo_tramite ?? ''}</td>
          <td>${f.sede ?? ''}</td>
          <td class="estado-${f.estado}">${f.estado}</td>
          <td>${f.creado_por ?? '(presencial)'}</td>
          <td>
            <button data-edit="${f.id}">Editar</button>
            <button data-del="${f.id}">Eliminar</button>
          </td>
        </tr>`).join('');
    } catch (err) {
      mostrarMensaje('Error al cargar: ' + err.message, 'error');
    }
  }

  // --- Mensajes ---
  function mostrarMensaje(texto, tipo = 'ok') {
    if (!msg) return;
    msg.textContent = texto;
    msg.className = 'mensaje mostrar ' + tipo;
  }

  // --- Crear ---
  formNuevo?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;

    // Validación en cliente
    if (!f.nombre.value.trim() ||
        !/^\d{8}$/.test(f.dni.value.trim()) ||
        !f.tipo_tramite.value ||
        !f.sede.value) {
      mostrarMensaje('Revisa los campos. El DNI debe tener 8 dígitos.', 'error');
      return;
    }

    try {
      const codigo = await crearRegistro({
        nombre:       f.nombre.value.trim(),
        dni:          f.dni.value.trim(),
        tipo_tramite: f.tipo_tramite.value,
        sede:         f.sede.value
      });
      mostrarMensaje('Cita registrada. Código: ' + codigo, 'ok');
      f.reset();
      refrescar();
    } catch (err) {
      mostrarMensaje('Error al registrar: ' + err.message, 'error');
    }
  });

  // --- Botones Editar / Eliminar (delegación de eventos) ---
  cuerpo.addEventListener('click', async (e) => {
    const idEdit = e.target.dataset.edit;
    const idDel  = e.target.dataset.del;

    // ELIMINAR
    if (idDel) {
      const confirmar = confirm(
        '¿Eliminar esta cita? Esta acción no se puede deshacer.'
      );
      if (!confirmar) return;

      try {
        await eliminarRegistro(idDel);
        mostrarMensaje('Cita eliminada correctamente.', 'ok');
        refrescar();
      } catch (err) {
        mostrarMensaje('Error al eliminar: ' + err.message, 'error');
      }
      return;
    }

    // EDITAR — abre un modal con los datos actuales
    if (idEdit) {
      const filas = await listarTodos();
      const reg   = filas.find(x => String(x.id) === idEdit);
      if (!reg) return;

      document.getElementById('edit-id').value            = reg.id;
      document.getElementById('edit-nombre').value        = reg.nombre_ciudadano ?? '';
      document.getElementById('edit-dni').value           = reg.dni ?? '';
      document.getElementById('edit-tipo_tramite').value  = reg.tipo_tramite ?? '';
      document.getElementById('edit-sede').value          = reg.sede ?? '';
      document.getElementById('edit-estado').value        = reg.estado ?? 'registrado';

      document.getElementById('modal-edit').hidden = false;
    }
  });

  // --- Guardar edición ---
  formEdit?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;

    try {
      await actualizarComoPanel(id, {
        nombre:       document.getElementById('edit-nombre').value.trim(),
        dni:          document.getElementById('edit-dni').value.trim(),
        tipo_tramite: document.getElementById('edit-tipo_tramite').value,
        sede:         document.getElementById('edit-sede').value,
        estado:       document.getElementById('edit-estado').value
      });
      document.getElementById('modal-edit').hidden = true;
      mostrarMensaje('Cita actualizada correctamente.', 'ok');
      refrescar();
    } catch (err) {
      mostrarMensaje('Error al actualizar: ' + err.message, 'error');
    }
  });

  // --- Cancelar edición ---
  document.getElementById('btn-cancelar-edit')?.addEventListener('click', () => {
    document.getElementById('modal-edit').hidden = true;
  });

  // --- Cerrar sesión ---
  document.getElementById('btn-salir')?.addEventListener('click', () => {
    sessionStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });

  // --- Carga inicial ---
  refrescar();
}