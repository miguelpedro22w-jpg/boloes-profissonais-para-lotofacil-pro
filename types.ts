
export interface DrawResult {
  concurso: number;
  data: string;
  dezenas: number[];
}

export interface SavedGame {
  id: string;
  numbers: number[];
  date: string;
  hits?: number; // For simulation view
  concursoCheck?: number;
  type?: 'manual' | 'generated'; // New field to distinguish source
  name?: string; // Optional user-defined name
  even?: number; // Quantidade de Pares
  odd?: number; // Quantidade de Ímpares
}

export enum Tab {
  HOME = 'home',
  GENERATOR = 'generator',
  MAZUSOFT = 'mazusoft',
  COMBINATIONS = 'combinations',
  RESULTS = 'results',
  SAVED = 'saved',
  ADMIN = 'admin',
  GLOBO = 'globo',
  LOADER = 'loader'
}

export interface StatFrequency {
  number: number;
  count: number;
}

export interface MazusoftStats {
  hits: number;
  repeats: number; // Repeated from previous contest
  gaps: Record<number, number>; // "Salto" for each number
  grid: number[][]; // 5x5 representation
  rowCounts: number[];
  colCounts: number[];
}
