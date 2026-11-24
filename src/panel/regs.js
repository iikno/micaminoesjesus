// Pure helpers for Inscritos and Bandeja (no React, so they can be tested).

// Plain-language states of a registration. Keys are the server's values.
export const REG_STATUS = {
  confirmado: 'Confirmado', lista_espera: 'En lista de espera', oferta: 'Lugar ofrecido',
  pendiente_verificacion: 'Falta que confirme su correo', cancelado: 'Cancelado', expirado: 'Vencido',
};

// "18 de 25 lugares" plus the bar width (null when there is no limit). Confirmed and offered people hold a spot.
export function capacity(taken, cupo) {
  if (cupo == null) return { text: `${taken} ${taken === 1 ? 'lugar ocupado' : 'lugares ocupados'} · sin límite de lugares`, pct: null, full: false, over: false };
  const full = taken >= cupo;
  return {
    text: `${taken} de ${cupo} lugares${taken > cupo ? ' (se pasó del cupo)' : full ? ' · lleno' : ''}`,
    pct: cupo ? Math.min(100, Math.round((taken / cupo) * 100)) : 100, full, over: taken > cupo,
  };
}

// Digits for wa.me, only when the number is reliable: "+" keeps its country; exactly 10 digits is a Mexican number (52).
// Anything else (old 044/045 prefixes, 00 prefixes, odd lengths, "+" in the middle) returns null: better no button than a wrong chat.
export function waNumber(raw) {
  const s = String(raw ?? '').trim();
  const digits = s.replace(/\D/g, '');
  if (s.startsWith('+')) return /^\+[\d\s().-]+$/.test(s) && digits.length >= 8 && digits.length <= 15 && digits[0] !== '0' ? digits : null;
  if (/[^\d\s().-]/.test(s)) return null;
  return /^[2-9]\d{9}$/.test(digits) ? `52${digits}` : null;
}
export const waLink = (raw) => { const n = waNumber(raw); return n ? `https://wa.me/${n}` : null; };

// Number for tel: (keeps a leading "+"); null when it has too few digits to dial.
export function telLink(raw) {
  const s = String(raw ?? '').trim();
  const digits = s.replace(/\D/g, '');
  return digits.length >= 7 ? `tel:${s.startsWith('+') ? '+' : ''}${digits}` : null;
}

// Every parameter encoded; "@" stays readable in the address.
export function mailtoLink(email, subject, body) {
  const q = [subject && `subject=${encodeURIComponent(subject)}`, body && `body=${encodeURIComponent(body)}`].filter(Boolean).join('&');
  return `mailto:${encodeURIComponent(email ?? '').replace('%40', '@')}${q ? `?${q}` : ''}`;
}
