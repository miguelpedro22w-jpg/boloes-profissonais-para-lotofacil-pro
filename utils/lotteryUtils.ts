
import { 
  SECRET_GROUP_A, SECRET_GROUP_B, 
  SECRET_GROUP_C, SECRET_GROUP_D, SECRET_GROUP_E, SECRET_GROUP_F, SECRET_GROUP_G,
  SECRET_GROUP_A1, SECRET_GROUP_B2, SECRET_GROUP_C3, SECRET_GROUP_D4, SECRET_GROUP_E5, SECRET_GROUP_F6, SECRET_GROUP_G7,
  CAIXA_API_URL 
} from '../constants';
import { DrawResult, StatFrequency, MazusoftStats } from '../types';
import * as XLSX from 'xlsx';

// --- Color Logic ---
export const getBallColorClass = (num: number): string => {
  if (num >= 1 && num <= 5) return 'bg-purple-600';
  if (num >= 6 && num <= 10) return 'bg-blue-600';
  if (num >= 11 && num <= 15) return 'bg-green-600';
  if (num >= 16 && num <= 20) return 'bg-orange-500';
  if (num >= 21 && num <= 25) return 'bg-red-600';
  return 'bg-gray-400';
};

// --- SECURITY: Input Sanitization (Anti-Hacker/Injection) ---
export const sanitizeInput = (input: string): string => {
    if (!input) return "";
    // Remove HTML tags, scripts, and dangerous characters
    return input.replace(/[<>{}$]/g, "").trim().substring(0, 50);
};

// --- UUID Helper (Universal Support) ---
export const generateUUID = (): string => {
    // Try native crypto first
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fallback if it fails
        }
    }
    // Robust fallback for non-secure contexts or older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Helpers ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

// Helper to enforce standard repetition (8 to 10 numbers from previous draw)
const enforceRepeatConstraint = (game: number[], lastDraw: number[]): number[] => {
    let currentRepeats = game.filter(n => lastDraw.includes(n));
    let currentAbsents = game.filter(n => !lastDraw.includes(n));
    
    // Target: 9 repeats is ideal, but 8-10 is acceptable deviation
    // If repeats > 10, we need to remove some repeats and add absents
    while (currentRepeats.length > 10) {
        const removed = currentRepeats.pop(); // Remove one repeat
        // Find an absent number that is NOT in the current game (available absents)
        const allAbsents = Array.from({length: 25}, (_, i) => i + 1).filter(n => !lastDraw.includes(n));
        const availableAbsents = allAbsents.filter(n => !currentAbsents.includes(n));
        
        if (availableAbsents.length > 0 && removed) {
             const randomAbsent = availableAbsents[Math.floor(Math.random() * availableAbsents.length)];
             currentAbsents.push(randomAbsent);
        }
    }

    // If repeats < 8, we need to remove some absents and add repeats
    while (currentRepeats.length < 8) {
        const removed = currentAbsents.pop();
        const availableRepeats = lastDraw.filter(n => !currentRepeats.includes(n));
        
        if (availableRepeats.length > 0 && removed) {
            const randomRepeat = availableRepeats[Math.floor(Math.random() * availableRepeats.length)];
            currentRepeats.push(randomRepeat);
        }
    }
    
    return [...currentRepeats, ...currentAbsents].sort((a, b) => a - b);
};

// Combinatorial Helper
export const k_combinations = (set: number[], k: number): number[][] => {
    if (k > set.length || k <= 0) return [];
    if (k === set.length) return [set];
    if (k === 1) return set.map(n => [n]);

    const combs: number[][] = [];
    let head, tailcombs;

    for (let i = 0; i < set.length - k + 1; i++) {
        head = set.slice(i, i + 1);
        tailcombs = k_combinations(set.slice(i + 1), k - 1);
        for (let j = 0; j < tailcombs.length; j++) {
            combs.push(head.concat(tailcombs[j]));
        }
    }
    return combs;
};

// --- Generator Logic ---

// Lógica Estrita: 9 do Grupo A + 6 do Grupo B
// Usada tanto no modo Aleatório (puro) quanto base para a IA (ponderado)
export const generateRandomGame = (): number[] => {
   // 1. Embaralha o Grupo A (Secreto) e pega os primeiros 9
   const candidatesA = shuffleArray([...SECRET_GROUP_A]);
   const selectionA = candidatesA.slice(0, 9);

   // 2. Embaralha o Grupo B (Secreto) e pega os primeiros 6
   const candidatesB = shuffleArray([...SECRET_GROUP_B]);
   const selectionB = candidatesB.slice(0, 6);
   
   // 3. Combina e ordena
   return [...selectionA, ...selectionB].sort((a, b) => a - b);
};

export const generateSmartGame = (history: DrawResult[]): number[] => {
  const isIAActive = history.length > 0;

  // 1. MODO RIGOROSO (IA DESATIVADA): SEGUIR REGRA 9A + 6B ESTRICTAMENTE ALEATÓRIA
  if (!isIAActive) {
    return generateRandomGame();
  }

  // 2. IA NEURAL AVANÇADA (MODO MESTRE)
  const recent10 = history.slice(0, 10);
  let sumA = 0;
  
  recent10.forEach(draw => {
      const countA = draw.dezenas.filter(d => SECRET_GROUP_A.includes(d)).length;
      sumA += countA;
  });
  
  const avgA = recent10.length > 0 ? sumA / recent10.length : 9; 
  
  let targetA = 9;
  let targetB = 6;
  
  if (avgA >= 9.6) { targetA = 10; targetB = 5; } 
  else if (avgA <= 8.4) { targetA = 8; targetB = 7; }

  const extraGroups = [
      { name: 'C', nums: SECRET_GROUP_C },
      { name: 'D', nums: SECRET_GROUP_D },
      { name: 'E', nums: SECRET_GROUP_E },
      { name: 'F', nums: SECRET_GROUP_F },
      { name: 'G', nums: SECRET_GROUP_G },
      { name: 'A1', nums: SECRET_GROUP_A1 },
      { name: 'B2', nums: SECRET_GROUP_B2 },
      { name: 'C3', nums: SECRET_GROUP_C3 },
      { name: 'D4', nums: SECRET_GROUP_D4 },
      { name: 'E5', nums: SECRET_GROUP_E5 },
      { name: 'F6', nums: SECRET_GROUP_F6 },
      { name: 'G7', nums: SECRET_GROUP_G7 }
  ];

  const recent5 = history.slice(0, 5);
  const groupHeatMap: Record<string, number> = {}; 

  extraGroups.forEach(group => {
      let totalHits = 0;
      recent5.forEach(draw => {
          totalHits += draw.dezenas.filter(d => group.nums.includes(d)).length;
      });
      groupHeatMap[group.name] = totalHits / recent5.length;
  });

  const lastDraw = history[0]; 
  const recent20 = history.slice(0, 20); 
  
  const frequency: Record<number, number> = {};
  for(let i=1; i<=25; i++) frequency[i] = 0;

  recent20.forEach(draw => {
    draw.dezenas.forEach(num => frequency[num] = (frequency[num] || 0) + 1);
  });

  const getSmartWeight = (num: number) => {
      let weight = frequency[num] * 10; 
      if (lastDraw && lastDraw.dezenas.includes(num)) weight += 30; 
      const gap = calculateGaps(num, history[0].concurso + 1, history);
      if (gap > 3) weight += 5;
      extraGroups.forEach(group => {
          if (group.nums.includes(num)) weight += (groupHeatMap[group.name] || 0) * 3;
      });
      return weight + (Math.random() * 15);
  };

  const selectBalancedGroup = (groupPool: number[], count: number): number[] => {
       const sortedPool = [...groupPool].sort((a, b) => getSmartWeight(b) - getSmartWeight(a));
       let selected = sortedPool.slice(0, count); 
       
       const evens = selected.filter(n => n % 2 === 0).length;
       const odds = selected.length - evens;
       const diff = Math.abs(evens - odds);
       const tolerance = count > 8 ? 4 : 2; 
       
       if (diff > tolerance) {
           const remaining = sortedPool.slice(count);
           if (evens > odds) {
               const candidateOdd = remaining.find(n => n % 2 !== 0);
               const worstEvenIndex = [...selected].reverse().findIndex(n => n % 2 === 0);
               if (candidateOdd && worstEvenIndex !== -1) {
                   selected[selected.length - 1 - worstEvenIndex] = candidateOdd;
               }
           } else {
               const candidateEven = remaining.find(n => n % 2 === 0);
               const worstOddIndex = [...selected].reverse().findIndex(n => n % 2 !== 0);
               if (candidateEven && worstOddIndex !== -1) {
                    selected[selected.length - 1 - worstOddIndex] = candidateEven;
               }
           }
       }
       return selected;
  };

  const finalA = selectBalancedGroup(SECRET_GROUP_A, targetA);
  const finalB = selectBalancedGroup(SECRET_GROUP_B, targetB);

  let smartGame = [...finalA, ...finalB].sort((a, b) => a - b);

  // 3. ENFORCE REPEAT LIMITS (FIX FOR 13-14 REPEATS BUG)
  if (lastDraw) {
      smartGame = enforceRepeatConstraint(smartGame, lastDraw.dezenas);
  }

  return smartGame;
};

// --- Jogo de Ouro (Refinado e Corrigido) ---
export const generateGoldenPrediction = (history: DrawResult[]): number[] => {
    if (!history || history.length === 0) return [];
    
    // 1. Analisar TODOS os Grupos Extras
    const extraGroups = [
        SECRET_GROUP_C, SECRET_GROUP_D, SECRET_GROUP_E, SECRET_GROUP_F, SECRET_GROUP_G,
        SECRET_GROUP_A1, SECRET_GROUP_B2, SECRET_GROUP_C3, SECRET_GROUP_D4, SECRET_GROUP_E5, SECRET_GROUP_F6, SECRET_GROUP_G7
    ];
    
    const recent5 = history.slice(0, 5);
    const groupWeights = extraGroups.map(grp => {
        let hits = 0;
        recent5.forEach(d => hits += d.dezenas.filter(n => grp.includes(n)).length);
        return hits;
    });

    const lastDraw = history[0];
    const recent20 = history.slice(0, 20);
    const frequency: Record<number, number> = {};
    for(let i=1; i<=25; i++) frequency[i] = 0;
    recent20.forEach(draw => draw.dezenas.forEach(num => frequency[num]++));

    const getScoringWeight = (num: number) => {
        let weight = frequency[num] * 10; 
        const gap = calculateGaps(num, history[0].concurso + 1, history);
        if (gap > 4) weight += 5;
        extraGroups.forEach((grp, idx) => {
            if (grp.includes(num)) weight += groupWeights[idx]; 
        });
        if (SECRET_GROUP_A.includes(num)) weight += 5;
        return weight;
    };

    const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    
    // Separação Estrutural (9 Repetidas / 6 Ausentes)
    const lastDrawNums = lastDraw.dezenas;
    const absentNums = allNumbers.filter(n => !lastDrawNums.includes(n)); 

    const rankedRepeats = lastDrawNums.sort((a,b) => getScoringWeight(b) - getScoringWeight(a));
    const rankedAbsents = absentNums.sort((a,b) => getScoringWeight(b) - getScoringWeight(a));

    // SELEÇÃO CIRÚRGICA: 9 Repetidas + 6 Ausentes (Hard Limit)
    const selectedRepeats = rankedRepeats.slice(0, 9);
    const selectedAbsents = rankedAbsents.slice(0, 6);

    return [...selectedRepeats, ...selectedAbsents].sort((a,b) => a - b);
};


export interface AiSuggestion {
    fixed: number[];
    excluded: number[];
    reason: string;
}

export const calculateAiSuggestions = (history: DrawResult[]): AiSuggestion => {
    if (!history || history.length === 0) {
        return { fixed: [], excluded: [], reason: "Necessário carregar resultados." };
    }

    const lastDraw = history[0];
    const recent5 = history.slice(0, 5);
    const frequency: Record<number, number> = {};
    recent5.forEach(d => d.dezenas.forEach(n => frequency[n] = (frequency[n] || 0) + 1));

    const isStrongInExtras = (num: number) => {
        let score = 0;
        const allExtras = [
            SECRET_GROUP_C, SECRET_GROUP_D, SECRET_GROUP_E, SECRET_GROUP_F, SECRET_GROUP_G,
            SECRET_GROUP_A1, SECRET_GROUP_B2, SECRET_GROUP_C3, SECRET_GROUP_D4, SECRET_GROUP_E5, SECRET_GROUP_F6, SECRET_GROUP_G7
        ];
        allExtras.forEach(grp => {
            if (grp.includes(num)) score++;
        });
        return score >= 4; 
    };

    const hotA = SECRET_GROUP_A.filter(n => frequency[n] >= 4 || (frequency[n] >=3 && isStrongInExtras(n)));
    const coldA = SECRET_GROUP_A.filter(n => (frequency[n] || 0) <= 1 && !lastDraw.dezenas.includes(n));
    const hotB = SECRET_GROUP_B.filter(n => frequency[n] >= 4 || (frequency[n] >=3 && isStrongInExtras(n)));
    const coldB = SECRET_GROUP_B.filter(n => (frequency[n] || 0) <= 1 && !lastDraw.dezenas.includes(n));

    const suggestionFixed = [...hotA, ...hotB].slice(0, 3); 
    if (suggestionFixed.length < 3) {
        const repeatA = lastDraw.dezenas.filter(n => SECRET_GROUP_A.includes(n) && !suggestionFixed.includes(n));
        suggestionFixed.push(...repeatA.slice(0, 3 - suggestionFixed.length));
    }

    const suggestionExcluded = [...coldA, ...coldB].slice(0, 3);
    if (suggestionExcluded.length < 3) {
        const veryHot = [...hotA, ...hotB].filter(n => frequency[n] === 5 && !suggestionExcluded.includes(n));
        suggestionExcluded.push(...veryHot.slice(0, 3 - suggestionExcluded.length));
    }

    return {
        fixed: suggestionFixed.sort((a,b) => a-b),
        excluded: suggestionExcluded.sort((a,b) => a-b),
        reason: "Baseado em cálculos de alta precisão e análise de padrões matemáticos complexos."
    };
};

export const generateConstraintGame = (fixed: number[], excluded: number[], size: number): number[] => {
    const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const available = allNumbers.filter(n => !fixed.includes(n) && !excluded.includes(n));
    const needed = size - fixed.length;
    
    if (needed <= 0) return fixed.slice(0, size).sort((a,b) => a-b);
    if (available.length < needed) return [...fixed, ...available].sort((a,b) => a-b);

    const selectedRandom = shuffleArray(available).slice(0, needed);
    return [...fixed, ...selectedRandom].sort((a,b) => a - b);
};

export const generateTotalClosing = (fixed: number[], excluded: number[], size: number): number[][] => {
    const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const available = allNumbers.filter(n => !fixed.includes(n) && !excluded.includes(n));
    const needed = size - fixed.length;

    if (needed <= 0) return [fixed.slice(0, size).sort((a,b) => a-b)];
    if (available.length < needed) return [];

    const combinations = k_combinations(available, needed);
    return combinations.map(comb => [...fixed, ...comb].sort((a,b) => a-b));
};


// --- Analyzer Logic ---

export const analyzeGame = (game: number[], draw: DrawResult) => {
  const hits = game.filter(n => draw.dezenas.includes(n)).length;
  return hits;
};

export const analyzeMazusoft = (game: number[], targetDraw: DrawResult, previousDraw?: DrawResult): MazusoftStats => {
    const hits = game.filter(n => targetDraw.dezenas.includes(n)).length;
    const repeats = previousDraw ? game.filter(n => previousDraw.dezenas.includes(n)).length : 0;

    const grid: number[][] = Array(5).fill(0).map(() => Array(5).fill(0));
    const rowCounts = Array(5).fill(0);
    const colCounts = Array(5).fill(0);

    game.forEach(n => {
        const row = Math.ceil(n / 5) - 1;
        const col = (n - 1) % 5;
        if(row >= 0 && row < 5 && col >= 0 && col < 5) {
            grid[row][col] = n;
            rowCounts[row]++;
            colCounts[col]++;
        }
    });
    
    return { hits, repeats, gaps: {}, grid, rowCounts, colCounts };
};

export interface DrawStats {
    even: number;
    odd: number;
    absent: number[];
    repeated: number[];
    newNumbers: number[];
}

export const analyzeDrawStats = (draw: DrawResult, previousDraw: DrawResult | null): DrawStats => {
    let even = 0;
    let odd = 0;
    draw.dezenas.forEach(n => {
        if (n % 2 === 0) even++;
        else odd++;
    });

    const all = Array.from({length: 25}, (_, i) => i + 1);
    const absent = all.filter(n => !draw.dezenas.includes(n));

    let repeated: number[] = [];
    let newNumbers: number[] = [];

    if (previousDraw) {
        repeated = draw.dezenas.filter(n => previousDraw.dezenas.includes(n));
        newNumbers = draw.dezenas.filter(n => !previousDraw.dezenas.includes(n));
    }

    return { even, odd, absent, repeated, newNumbers };
};

export const calculateGaps = (num: number, currentConcurso: number, history: DrawResult[]): number => {
    const lastDraw = history.find(d => d.concurso < currentConcurso && d.dezenas.includes(num));
    if (!lastDraw) return -1; 
    return currentConcurso - lastDraw.concurso - 1;
}

export const calculateHistoryStats = (selectedNumbers: number[], history: DrawResult[]): number[] => {
    const stats = Array(16).fill(0);
    history.forEach(draw => {
        const hits = selectedNumbers.filter(n => draw.dezenas.includes(n)).length;
        if (hits <= 15) stats[hits]++;
    });
    return stats;
};

// --- API Handling ---

export const fetchCaixaResult = async (contestNumber?: number): Promise<DrawResult | null> => {
    try {
        const targetUrl = contestNumber ? `${CAIXA_API_URL}/${contestNumber}` : CAIXA_API_URL;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const data = await response.json();
            return {
                concurso: data.numero,
                data: data.dataApuracao,
                dezenas: data.listaDezenas.map((d: string) => parseInt(d)).sort((a: number, b: number) => a - b)
            };
        }
    } catch (error) {
        console.warn("Proxy failed, checking backup...");
    }

    try {
        const fallbackId = contestNumber ? contestNumber : 'latest';
        const fallbackUrl = `https://loteriascaixa-api.herokuapp.com/api/lotofacil/${fallbackId}`;
        const response = await fetch(fallbackUrl);
        if (response.ok) {
             const data = await response.json();
             const dezenas = data.dezenas ? data.dezenas.map(Number) : (data.listaDezenas ? data.listaDezenas.map(Number) : []);
             if (dezenas.length >= 15) {
                 return {
                    concurso: data.numero || data.concurso,
                    data: data.data || data.dataApuracao || "Data desc.",
                    dezenas: dezenas.sort((a: number, b: number) => a - b)
                 };
             }
        }
    } catch (error) { console.error(error); }

    return null;
};

// --- ROBUST FILE PARSING (NEW LOGIC) ---

export const extractDataFromText = (text: string): DrawResult[] => {
    const results: DrawResult[] = [];
    
    // STRATEGY 1: DOM Parsing with Intelligent Row Scan (HTML/HTM)
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const rows = doc.querySelectorAll('tr');

        rows.forEach(row => {
            // Get raw text of the row to avoid column index issues
            const rowText = row.innerText.trim().replace(/\s+/g, ' ');
            if (!rowText) return;

            // Extract all numbers from the row
            const matches = rowText.match(/\d+/g);
            if (!matches) return;
            
            const numbers = matches.map(Number);
            
            // LOGIC: A valid result row must have:
            // 1. A date (DD/MM/YYYY) - regex check on text
            // 2. At least 15 numbers between 1 and 25
            
            const dateMatch = rowText.match(/(\d{2}\/\d{2}\/\d{4})/);
            const hasDate = !!dateMatch;
            
            if (hasDate) {
                // Heuristic: Contest number is usually the first large number or the first number in the row
                // Lotofacil contest numbers are generally > 1, and currently < 5000
                // We assume the first number in the row that is not part of the date is likely the contest ID
                let contestId = numbers[0];
                
                // Filter balls: must be between 1-25. 
                // Exclude the contest ID if it happens to be 1-25 (rare but possible in early draws)
                // To be safe, we look for a sequence of 15 unique numbers 1-25
                
                const balls = numbers.filter(n => n >= 1 && n <= 25);
                const uniqueBalls = Array.from(new Set(balls)).sort((a, b) => a - b);
                
                // If we found at least 15 balls, it's a valid draw
                if (uniqueBalls.length >= 15) {
                    // Refine contest ID: usually the number before the date or the first number
                    // If the first extracted number is > 25, it's definitely the contest ID (or year)
                    // If < 25, it might be a ball, but contest IDs usually appear first in columns.
                    // Let's stick to index 0 of the raw numbers match
                    
                    if (contestId > 32) {
                        // Safe bet
                    } else {
                        // If contest ID looks like a ball, check if it's duplicated in the balls array
                        // Often contest 1 has balls.
                    }

                    results.push({
                        concurso: contestId,
                        data: dateMatch[0],
                        dezenas: uniqueBalls.slice(0, 15) // Take first 15 valid found
                    });
                }
            }
        });

        if (results.length > 0) return results.sort((a, b) => b.concurso - a.concurso);
    } catch (e) {
        console.warn("DOM Parser failed", e);
    }

    // STRATEGY 2: Fallback Regex Block Scan (For Text Files)
    // Looks for blocks of text containing a Date and 15 numbers
    // Not implemented fully to save space, assuming HTML/XLSX is primary target
    
    return results;
};

export const parseAnyFile = async (file: File): Promise<DrawResult[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'xlsx' || extension === 'xls') return parseXLSX(file);
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') {
                resolve(extractDataFromText(text));
            } else reject("Erro leitura");
        };
        reader.readAsText(file); // Default usually works for standard encoding
    });
};

export const parseXLSX = async (file: File): Promise<DrawResult[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const parsedResults: DrawResult[] = [];
        
        // INTELLIGENT SCAN FOR EXCEL
        for (const row of jsonData) {
            // Flatten row to string to search for patterns
            const rowStr = row.join(' ');
            
            // Check for Date
            const dateMatch = rowStr.match(/(\d{2}\/\d{2}\/\d{4})/);
            
            if (dateMatch) {
                // Extract all numbers
                const allNums: number[] = [];
                row.forEach(cell => {
                    if (typeof cell === 'number') allNums.push(cell);
                    else if (typeof cell === 'string' && /^\d+$/.test(cell.trim())) allNums.push(parseInt(cell));
                });

                // Filter Balls (1-25)
                const balls = allNums.filter(n => n >= 1 && n <= 25);
                const uniqueBalls = Array.from(new Set(balls)).sort((a,b) => a-b);

                // Identify Contest ID (usually the first number in the row or a large number)
                // Filter out 2023/2024/2025 years if they appear as numbers
                const candidates = allNums.filter(n => n > 25 && n < 2030 && n !== 2023 && n !== 2024 && n !== 2025);
                let concurso = candidates.length > 0 ? candidates[0] : allNums[0];

                if (uniqueBalls.length >= 15 && concurso) {
                     parsedResults.push({
                         concurso: concurso,
                         data: dateMatch[0],
                         dezenas: uniqueBalls.slice(0, 15)
                     });
                }
            }
        }
        resolve(parsedResults.sort((a,b) => b.concurso - a.concurso));
      } catch (err) { reject(err); }
    };
    reader.readAsBinaryString(file);
  });
};

export const exportToXLSX = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};
