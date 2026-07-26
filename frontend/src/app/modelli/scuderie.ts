// indentità visiva della scuderie

// usata sia dalla lista piloti sia dalla scheda del pilota.

export interface StileScuderia {
  colore: string;   // colore di squadra, per badge e sfondi
  logo: string;     // nome del file in assets/scuderie/<logo>.webp
}

// Record: oggetto le cui property keys sono string e property values sono StileScuderia
export const SCUDERIE: Record<string, StileScuderia> = {
  'McLaren':         { colore: '#FF8000', logo: 'mclaren' },
  'Ferrari':         { colore: '#DC0000', logo: 'ferrari' },
  'Mercedes':        { colore: '#00A19C', logo: 'mercedes' },
  'Red Bull Racing': { colore: '#3671C6', logo: 'redbull' },
  'Aston Martin':    { colore: '#229971', logo: 'astonmartin' },
  'Alpine':          { colore: '#0093CC', logo: 'alpine' },
  'Williams':        { colore: '#1868DB', logo: 'williams' },
  'Racing Bulls':    { colore: '#6692FF', logo: 'racingbulls' },
  'Haas':            { colore: '#8B8B8B', logo: 'haas' },
  'Audi':            { colore: '#4A4A4A', logo: 'audi' },
  'Cadillac':        { colore: '#8C7A3F', logo: 'cadillac' }
};

const NEUTRO: StileScuderia = { colore: '#555566', logo: '' };

export function stileScuderia(nome: string | null | undefined): StileScuderia {
  return SCUDERIE[nome || ''] || NEUTRO;
}

export function coloreScuderia(nome: string | null | undefined): string {
  return stileScuderia(nome).colore;
}

/** Percorso del logo, oppure stringa vuota se la scuderia non e' mappata. */
export function logoScuderia(nome: string | null | undefined): string {
  const logo = stileScuderia(nome).logo;
  return logo ? `assets/scuderie/${logo}.webp` : '';
}
