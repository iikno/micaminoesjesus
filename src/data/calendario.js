// Calendario público: fuente única para Home y /calendario.
// estado: 'lista' | 'confirmada' | 'por-confirmar'. destacado resalta la fila.
export const CALENDARIO = [
  { cuando: 'Desde el 29 nov 2026', titulo: 'Adviento: Emmanuel y Camino a Belén', nota: 'Listas', estado: 'lista' },
  { cuando: 'Dic 2026', titulo: 'El Arca de Noé', nota: 'Dérej Simjá', estado: 'por-confirmar' },
  { cuando: 'Fin de ene 2027', titulo: 'Esclava del Señor y retiro Belén', nota: 'Dérej Mesharét y Jaím', estado: 'por-confirmar' },
  { cuando: 'Feb 2027', titulo: 'Levántate y Sé Hombre, 2ª edición', nota: 'Dérej Guibor, paso 1', estado: 'por-confirmar' },
  { cuando: 'Mar 2027', titulo: 'Fuiste Hecha Mujer, retiro abierto', nota: 'Dérej Kavod', estado: 'por-confirmar' },
  { cuando: '21 a 27 mar 2027', titulo: 'Semana Santa: Barrabás, retiro para la comunidad', nota: 'Dérej Jaím', estado: 'confirmada', destacado: true },
  { cuando: 'Abr a may 2027', titulo: 'Sansón', nota: 'Dérej Guibor, paso 2', estado: 'por-confirmar' },
];

export const ESTADO_LABEL = { lista: '', confirmada: 'Confirmado', 'por-confirmar': 'Fecha por confirmar' };
