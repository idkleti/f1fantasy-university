// pilota dentro un fantateam
export interface PilotaTeam {
  numero_pilota: number;
  nome: string;
  cognome: string;
  scuderia_corrente: string | null;
  costo_fantasy: number;
  costo_pagato: number;
  data_acquisto: string;
  punti_stagione: number;
}

// fantateam (GET /users/:id/fantateams)
export interface Fantateam {
  id_team: number;
  nome_team: string;
  budget_residuo: number;
  punti_totali: number;
  data_creazione: string;
  piloti: PilotaTeam[];
}

// payload per creare/modificare un team
export interface NuovoFantateam {
  nome_team: string;
  piloti: number[];   // numeri pilota
}
