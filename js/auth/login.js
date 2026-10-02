import { iniciarSesion } from './auth.js';

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo     = e.target.correo.value.trim();
  const contrasena = e.target.contrasena.value;

  const usuario = await iniciarSesion(correo, contrasena);
  if (!usuario) {
    alert('Correo o contraseña incorrectos');
    return;
  }

  if (usuario.rol === 'cliente') {
    window.location.href = 'agendamiento.html';
  } else {
    window.location.href = 'panel.html';
  }
});