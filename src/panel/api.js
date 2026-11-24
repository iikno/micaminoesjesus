export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? String(status));
    this.status = status;
    this.code = body?.error;
    this.issues = body?.issues ?? [];
  }
}

// Every call carries the CSRF header; the session is an httpOnly cookie the browser sends by itself.
export async function api(method, path, body) {
  let r;
  try {
    r = await fetch(path, {
      method, credentials: 'same-origin',
      headers: { 'X-Requested-With': 'mcj', Accept: 'application/json', ...(body !== undefined && { 'Content-Type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, { error: 'network' });
  }
  const data = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401 && !path.startsWith('/api/auth/')) window.dispatchEvent(new Event('mcj:unauth'));
    throw new ApiError(r.status, data);
  }
  return data;
}
// Multipart upload (one image). The browser sets the Content-Type with its boundary.
export async function upload(path, file) {
  const fd = new FormData();
  fd.append('file', file);
  let r;
  try {
    r = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'mcj', Accept: 'application/json' }, body: fd });
  } catch {
    throw new ApiError(0, { error: 'network' });
  }
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401) window.dispatchEvent(new Event('mcj:unauth'));
    throw new ApiError(r.status, data);
  }
  return data;
}
export const get = (p) => api('GET', p);
export const post = (p, b = {}) => api('POST', p, b);
export const put = (p, b) => api('PUT', p, b);
export const patch = (p, b) => api('PATCH', p, b);
export const del = (p) => api('DELETE', p);

const MSG = {
  network: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
  invalid_credentials: 'Correo o contraseña incorrectos, o la cuenta está bloqueada o deshabilitada.',
  unauthenticated: 'Tu sesión terminó. Inicia sesión de nuevo.',
  forbidden: 'No tienes permiso para esta acción.',
  not_found: 'No se encontró el elemento.',
  duplicate: 'Ya existe un registro con ese valor único (por ejemplo, la clave o la referencia).',
  reference_conflict: 'El valor elegido apunta a algo que no existe o que está en uso.',
  already_published: 'Ya fue publicado: no se puede eliminar.',
  not_published: 'Aún no está publicado, así que no hay nada que corregir en vivo.',
  no_pending_review: 'Este elemento ya no está pendiente de revisión.',
  cannot_decide_own_or_forbidden: 'No puedes decidir sobre tu propio envío.',
  user_exists: 'Ese correo ya tiene una cuenta activa.',
  cannot_change_self: 'No puedes cambiar tu propio rol o estado.',
  user_not_active_yet: 'La persona aún no acepta su invitación.',
  invalid_token: 'El enlace no es válido o ya venció. Pide uno nuevo.',
  version_conflict: 'Alguien más guardó cambios en esto mientras lo editabas. Lo que escribiste sigue en pantalla.',
  empty_patch: 'No hay cambios que guardar.',
  unsupported_image_type: 'Solo se aceptan imágenes JPG, PNG o WebP.',
  invalid_image: 'La imagen está dañada o es demasiado grande en píxeles.',
  FST_REQ_FILE_TOO_LARGE: 'La imagen pesa demasiado (máximo 8 MB).',
  no_file: 'Elige una imagen.',
  media_in_use: 'La imagen está en uso (portada o foto): quítala de ahí antes de eliminarla.',
  translate_disabled: 'La traducción automática no está activada: falta configurar la llave en el servidor.',
  translate_limit: 'Se alcanzó el tope mensual de traducción automática.',
  provider_error: 'El servicio de traducción falló. Inténtalo de nuevo.',
  timeout: 'No terminó a tiempo.',
  provider_rate_limited: 'El servicio de traducción está saturado. Espera un momento.',
  provider_bad_output: 'El servicio devolvió una respuesta inválida. Inténtalo de nuevo.',
  manual_exists: 'Ya hay una versión en inglés escrita a mano.',
  source_changed: 'El texto en español cambió mientras traducías. Vuelve a intentarlo.',
  no_pending_change: 'Ya no hay un cambio programado.',
  not_translatable: 'Este contenido no tiene versión en inglés.',
  invalid_state: 'Esa acción no aplica al estado actual de la inscripción.',
  wrong_password: 'La contraseña actual no es correcta.',
  push_disabled: 'Los avisos aún no están activados en el servidor.',
  csrf: 'Solicitud rechazada por seguridad. Recarga la página.',
  internal: 'Error del servidor. Inténtalo de nuevo en un momento.',
  'Item is under review; wait for a decision': 'Está en revisión: espera la decisión antes de editarlo.',
  'A comment is required to reject': 'El comentario es obligatorio para rechazar.',
};
export const errText = (e) => {
  if (e?.status === 429) return 'Demasiados intentos. Espera un minuto.';
  if (e?.status === 413) return MSG.FST_REQ_FILE_TOO_LARGE;
  if (e?.code === 'validation') return 'Revisa los campos marcados.';
  return MSG[e?.code] ?? (e?.code?.startsWith?.('Cannot') ? 'Esa acción no aplica al estado actual.' : 'Ocurrió un error inesperado.');
};

// Server (zod) messages are English; show a short Spanish version, keep unknown ones as is.
export function issueText(m = '') {
  if (/ends_on is before/.test(m)) return 'La fecha final es anterior a la inicial.';
  if (/retreat_id or title/.test(m)) return 'Elige un retiro o escribe un título.';
  if (/too small|at least|nonempty|required/i.test(m)) return 'Es obligatorio o es demasiado corto.';
  if (/too big|at most/i.test(m)) return 'Es demasiado largo.';
  if (/invalid|expected/i.test(m)) return 'El formato no es válido.';
  return m;
}
export const fieldErrors = (e) => Object.fromEntries((e?.issues ?? []).map((i) => [i.path || '_', issueText(i.message)]));
