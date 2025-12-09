
import React, { useState, useMemo } from 'react';
import { Sparkles, Save, RefreshCw, Hand, Trophy, Layers, Trash2, Ban, Lock, Settings2, ArrowLeft, Lightbulb, Sigma, Crosshair, UserCog, BrainCircuit, Wand2 } from 'lucide-react';
import { DrawResult, SavedGame } from '../types';
import { generateSmartGame, generateRandomGame, generateConstraintGame, generateTotalClosing, calculateAiSuggestions, AiSuggestion, generateGoldenPrediction, generateUUID } from '../utils/lotteryUtils';
import { Ball } from '../components/Ball';

interface GeneratorProps {
  results: DrawResult[];
  onSave: (game: SavedGame | SavedGame[]) => void;
  onBack: () => void;
}

type GeneratorTab = 'fast' | 'advanced';
type AdvancedMode = 'random' | 'closing_total' | 'simple_custom';

export const Generator: React.FC<GeneratorProps> = ({ results, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('fast');
  // FORCE IA ACTIVE VISUALLY
  const isIAActive = true;
  
  // --- Common State ---
  const [generatedGames, setGeneratedGames] = useState<number[][]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [manualGameName, setManualGameName] = useState("");

  // --- Fast Mode State ---
  const [manualMode, setManualMode] = useState(false);

  // --- Advanced Mode State ---
  const [gameSize, setGameSize] = useState<number>(15);
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [advMode, setAdvMode] = useState<AdvancedMode>('random');

  // --- Calculations for Closing Mode ---
  const closingStats = useMemo(() => {
     if (activeTab !== 'advanced' || advMode !== 'closing_total') return null;
     
     const totalNumbers = 25;
     const availableCount = totalNumbers - fixedNumbers.length - excludedNumbers.length;
     const needed = gameSize - fixedNumbers.length;
     
     if (needed <= 0 || availableCount < needed) return { count: 0, valid: false };

     // Calculate Combinations: C(n, k) = n! / (k! * (n-k)!)
     const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);
     const combinations = (n: number, k: number): number => {
         if (k < 0 || k > n) return 0;
         if (k > 18) return 9999999; // Safety cap calculation
         return Math.round(factorial(n) / (factorial(k) * factorial(n - k)));
     };

     const totalCombinations = combinations(availableCount, needed);
     const isTooLarge = totalCombinations > 5000; // Limit for browser performance
     
     return { count: totalCombinations, valid: true, isTooLarge };

  }, [activeTab, advMode, fixedNumbers.length, excludedNumbers.length, gameSize]);


  // --- Handlers: Fast Mode ---
  
  // MODO 1: Padrão Oculto (Fixo 9A + 6B) - Sem análise, apenas a regra secreta.
  const handleGenerateSecretPattern = () => {
    setManualMode(false);
    let qty = clampQuantity(quantity);

    const newGames: number[][] = [];
    for (let i = 0; i < qty; i++) {
        // Usa generateRandomGame que implementa a lógica 9A+6B estrita
        const game = generateRandomGame(); 
        newGames.push(game);
    }
    setGeneratedGames(newGames);
  };

  // MODO 2: Inteligência Artificial (Analisa Resultados e decide pesos A/B)
  const handleGenerateAI = () => {
    setManualMode(false);
    
    if (results.length === 0) {
        alert("Para usar a Inteligência Artificial, o sistema precisa estudar os resultados passados. Por favor, carregue os resultados na aba DADOS.");
        return;
    }

    let qty = clampQuantity(quantity);
    const newGames: number[][] = [];
    for (let i = 0; i < qty; i++) {
        // Usa generateSmartGame que analisa o histórico para balancear os grupos
        const game = generateSmartGame(results);
        newGames.push(game);
    }
    setGeneratedGames(newGames);
  };

  const handleToggleNumberManual = (num: number) => {
    if (!manualMode) return;
    let currentGame = generatedGames.length > 0 ? [...generatedGames[0]] : [];
    if (currentGame.includes(num)) {
      currentGame = currentGame.filter(n => n !== num).sort((a,b)=>a-b);
    } else {
      if (currentGame.length < 23) { // Increased limit to 23
        currentGame = [...currentGame, num].sort((a,b)=>a-b);
      }
    }
    setGeneratedGames([currentGame]);
  };

  const handleManualClick = () => {
    setActiveTab('fast');
    setManualMode(true);
    setGeneratedGames([[]]);
    setQuantity(1);
    setManualGameName("");
  };

  // --- Handlers: Advanced Mode ---
  const handleToggleConstraint = (num: number) => {
     // Cycle: Neutral -> Fixed (Green) -> Excluded (Red) -> Neutral
     if (fixedNumbers.includes(num)) {
         // Was Fixed -> Become Excluded
         setFixedNumbers(prev => prev.filter(n => n !== num));
         if (excludedNumbers.length < 9) {
             setExcludedNumbers(prev => [...prev, num].sort((a,b)=>a-b));
         } else {
             // If max excluded reached, go to neutral
         }
     } else if (excludedNumbers.includes(num)) {
         // Was Excluded -> Become Neutral
         setExcludedNumbers(prev => prev.filter(n => n !== num));
     } else {
         // Was Neutral -> Become Fixed
         if (fixedNumbers.length < 18) {
             setFixedNumbers(prev => [...prev, num].sort((a,b)=>a-b));
         } else {
             // If max fixed reached, maybe skip to excluded if allowed?
             if (excludedNumbers.length < 9) {
                setExcludedNumbers(prev => [...prev, num].sort((a,b)=>a-b));
             }
         }
     }
  };

  const handleGetAiSuggestion = () => {
      // Need results for this specific AI feature
      if (results.length === 0) {
          alert("Carregue resultados na aba 'Dados' para usar a Inteligência da Mestre.");
          return;
      }
      const suggestion = calculateAiSuggestions(results);
      setAiSuggestion(suggestion);
  };

  const handleApplySuggestion = () => {
      if (aiSuggestion) {
          setFixedNumbers(aiSuggestion.fixed);
          setExcludedNumbers(aiSuggestion.excluded);
          setAiSuggestion(null); // Clear suggestion after applying
          alert("Sugestões aplicadas à matriz! Agora clique em Gerar.");
      }
  };

  const handleGenerateGoldenPrediction = () => {
      if (results.length === 0) {
          alert("Carregue resultados primeiro.");
          return;
      }
      const goldenGame = generateGoldenPrediction(results);
      setGeneratedGames([goldenGame]);
      setGameSize(15);
      setAdvMode('random');
      alert("Palpite Único da Mestre gerado com sucesso! (1 Jogo)");
  };

  const handleGenerateAdvanced = () => {
      
      // Check limits before generating
      const availableCount = 25 - fixedNumbers.length - excludedNumbers.length;
      const needed = gameSize - fixedNumbers.length;
      
      if (needed <= 0) {
          alert(`Você fixou ${fixedNumbers.length} números para um jogo de ${gameSize}. Ajuste o tamanho ou remova fixas.`);
          return;
      }
      if (availableCount < needed) {
          alert("Não há números suficientes disponíveis para completar o jogo. Remova exclusões.");
          return;
      }

      if (advMode === 'closing_total') {
          if (closingStats && closingStats.isTooLarge) {
              alert(`O fechamento total geraria ${closingStats.count} jogos, o que pode travar seu dispositivo. Aumente as exclusões ou use o modo Aleatório.`);
              return;
          }
          const games = generateTotalClosing(fixedNumbers, excludedNumbers, gameSize);
          setGeneratedGames(games);
          alert(`${games.length} combinações matemáticas geradas com sucesso!`);
      } else {
          // Random mode or Simple Custom (Both use pure constraint generation)
          let qty = clampQuantity(quantity);
          const newGames: number[][] = [];
          for (let i = 0; i < qty; i++) {
              newGames.push(generateConstraintGame(fixedNumbers, excludedNumbers, gameSize));
          }
          setGeneratedGames(newGames);
      }
  };

  const clampQuantity = (q: number) => Math.min(100, Math.max(1, q || 1));

  const handleSave = () => {
    let validGames: number[][] = [];
    let minSize = 15;
    
    // Determine validity based on mode
    if (activeTab === 'fast' && manualMode) {
        // Manual mode allows 15 to 23
        validGames = generatedGames.filter(g => g.length >= 15 && g.length <= 23);
        if (validGames.length === 0) {
            alert("Para salvar um jogo manual, selecione entre 15 e 23 dezenas.");
            return;
        }
    } else {
        // Auto modes need exact size
        minSize = activeTab === 'fast' ? 15 : gameSize;
        validGames = generatedGames.filter(g => g.length === minSize);
        if (validGames.length === 0) {
            alert(`Nenhum jogo completo (${minSize} dezenas) para salvar.`);
            return;
        }
    }

    const gameType = (activeTab === 'fast' && manualMode) ? 'manual' : 'generated';

    const gamesToSave: SavedGame[] = validGames.map((numbers, idx) => ({
      // Use Robust UUID Generator
      id: generateUUID(),
      numbers: numbers,
      date: new Date().toISOString(),
      type: gameType,
      // Apply manual name only to manual mode, otherwise generic numbering (handled in SavedGames view if empty)
      name: (gameType === 'manual' && manualGameName.trim()) ? manualGameName : undefined
    }));

    onSave(gamesToSave);
    
    const dest = gameType === 'manual' ? 'aba "Jogos Manuais"' : 'aba "Jogos da IA / Automáticos"';
    alert(`${gamesToSave.length} jogo(s) salvo(s) com sucesso na ${dest}!`);
    setManualGameName(""); // Reset name
  };

  const handleClear = () => {
      setGeneratedGames([]);
      setManualGameName("");
      if (activeTab === 'fast') setManualMode(false);
  };

  const handleClearAdvancedConfig = () => {
      setFixedNumbers([]);
      setExcludedNumbers([]);
      setGeneratedGames([]);
      setAiSuggestion(null);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      
      <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Início
      </button>

      {/* Tabs */}
      <div className="flex bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-1 mb-6 border border-white/20">
          <button 
             onClick={() => { setActiveTab('fast'); setGeneratedGames([]); }}
             className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'fast' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              GERADOR RÁPIDO
          </button>
          <button 
             onClick={() => { setActiveTab('advanced'); setGeneratedGames([]); }}
             className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === 'advanced' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              AVANÇADO / DESDOBRAMENTO
          </button>
      </div>

      {activeTab === 'fast' && (
          <>
            {/* Professional Mode Indicator (Fast) - ALWAYS ACTIVE VISUALLY - CENSORED TEXT */}
            {isIAActive ? (
                <div className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-md text-white p-5 rounded-xl mb-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-3">
                        <Trophy className="w-6 h-6 text-yellow-400 drop-shadow" />
                        <h2 className="text-xl font-bold tracking-wide">TECNOLOGIA ATIVA</h2>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-purple-100 bg-white/10 p-3 rounded-lg border border-white/10">
                    🎯 Jogada de Mestre! Utilizando padrões matemáticos ocultos de alta performance.
                    </p>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-green-800 to-green-600 backdrop-blur-md p-5 rounded-xl mb-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-6 h-6 text-green-300 drop-shadow" />
                        <h2 className="text-xl font-bold tracking-wide text-white">MAIOR PROBABILIDADE ATIVA</h2>
                    </div>
                    <p className="text-green-100 font-bold text-sm bg-white/10 p-3 rounded-lg border border-white/10">
                        Seus jogos estão sendo gerados com a maior probabilidade de acertos.
                    </p>
                </div>
            )}
          </>
      )}

      {/* Advanced Config Panel */}
      {activeTab === 'advanced' && (
          <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl shadow-xl border border-white/20 mb-6">
               <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-gray-800 flex items-center gap-2">
                       <Settings2 className="w-5 h-5 text-blue-600" />
                       Configuração de Matriz
                   </h3>
                   <div className="flex gap-2">
                       {/* AI Feature depends on actual results existing */}
                       {results.length > 0 && (
                           <button 
                                onClick={handleGetAiSuggestion}
                                className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-100 px-3 py-1 rounded-full flex items-center gap-1"
                           >
                               <Lightbulb className="w-3 h-3" /> Sugestão da Mestre
                           </button>
                       )}
                       <button onClick={handleClearAdvancedConfig} className="text-xs font-bold text-red-500 hover:text-red-600 border border-red-200 px-2 py-1 rounded-full">
                           Limpar
                       </button>
                   </div>
               </div>

               {/* Mode Selector */}
               <div className="bg-gray-100 p-1 rounded-lg flex flex-col sm:flex-row gap-1 mb-4">
                   <button 
                      onClick={() => setAdvMode('simple_custom')} 
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${advMode === 'simple_custom' ? 'bg-white shadow text-orange-600 border border-orange-200' : 'text-gray-500'}`}
                   >
                       Gerador Personalizado
                   </button>
                   <button 
                      onClick={() => setAdvMode('random')} 
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${advMode === 'random' ? 'bg-white shadow text-blue-700 border border-blue-200' : 'text-gray-500'}`}
                   >
                       Desdobramento Aleatório
                   </button>
                   <button 
                      onClick={() => setAdvMode('closing_total')} 
                      className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${advMode === 'closing_total' ? 'bg-white shadow text-green-700 border border-green-200' : 'text-gray-500'}`}
                   >
                       Fechamento (Total)
                   </button>
               </div>
               
               {/* Mode Description Banner */}
               <div className="mb-4 text-xs font-medium text-center p-2 rounded bg-gray-50 border border-gray-100 text-gray-600">
                   {advMode === 'simple_custom' && "Modo Manual: Monte seus jogos usando APENAS as dezenas que você selecionar na grade abaixo. Ideal para bolões controlados."}
                   {advMode === 'random' && "Modo Desdobramento: Gera jogos aleatórios respeitando suas fixas e exclusões. Ótimo para cobrir várias possibilidades."}
                   {advMode === 'closing_total' && "Modo Matemático: Gera TODAS as combinações possíveis. Garante o prêmio se as dezenas sorteadas estiverem na sua seleção."}
               </div>

               {/* AI Suggestion Display (Fix/Exclude) */}
               {aiSuggestion && (
                   <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4 animate-in fade-in slide-in-from-top-2">
                       <h4 className="font-bold text-purple-900 text-sm mb-2 flex items-center gap-2">
                           <Sparkles className="w-4 h-4 text-purple-600" />
                           Palpite da Tecnologia:
                       </h4>
                       <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                           <div>
                               <p className="font-bold text-green-700 mb-1">FIXAR (Fortes):</p>
                               <div className="flex gap-1">
                                   {aiSuggestion.fixed.map(n => <span key={n} className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">{n}</span>)}
                               </div>
                           </div>
                           <div>
                               <p className="font-bold text-red-700 mb-1">EXCLUIR (Fracas):</p>
                               <div className="flex gap-1">
                                   {aiSuggestion.excluded.map(n => <span key={n} className="bg-red-100 text-red-800 px-2 py-1 rounded font-bold">{n}</span>)}
                               </div>
                           </div>
                       </div>
                       <button 
                            onClick={handleApplySuggestion}
                            className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-purple-700"
                       >
                           Aplicar Sugestão à Matriz
                       </button>
                   </div>
               )}

               {/* New Feature: Palpite Único da Mestre */}
               {results.length > 0 && advMode !== 'simple_custom' && (
                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                           <div className="bg-yellow-400 p-2 rounded-full text-white">
                               <Crosshair className="w-4 h-4" />
                           </div>
                           <div>
                               <p className="text-xs font-bold text-yellow-800">Palpite Pronto da Mestre</p>
                               <p className="text-[10px] text-yellow-700">Apostar 1 Jogo com base na melhor probabilidade.</p>
                           </div>
                       </div>
                       <button 
                           onClick={handleGenerateGoldenPrediction}
                           className="bg-yellow-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-yellow-700 shadow-sm whitespace-nowrap"
                       >
                           Gerar Jogo da Vitória
                       </button>
                   </div>
               )}

               {/* Legend */}
               <div className="flex gap-4 justify-center mb-6 text-xs font-bold">
                   <div className="flex items-center gap-1">
                       <div className="w-3 h-3 rounded-full bg-green-600"></div> Fixar
                   </div>
                   <div className="flex items-center gap-1">
                       <div className="w-3 h-3 rounded-full bg-red-600"></div> Excluir
                   </div>
                   <div className="flex items-center gap-1">
                       <div className="w-3 h-3 rounded-full bg-gray-300"></div> Disponível
                   </div>
               </div>

               {/* Grid */}
               <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto mb-6">
                   {Array.from({length: 25}, (_, i) => i + 1).map(num => {
                       const isFixed = fixedNumbers.includes(num);
                       const isExcluded = excludedNumbers.includes(num);
                       
                       let bgClass = "bg-gray-200 text-gray-500";
                       if (isFixed) bgClass = "bg-green-600 text-white shadow-lg scale-110";
                       if (isExcluded) bgClass = "bg-red-600 text-white opacity-80 scale-90";

                       return (
                           <button 
                                key={num}
                                onClick={() => handleToggleConstraint(num)}
                                className={`w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all ${bgClass}`}
                           >
                               {num}
                           </button>
                       )
                   })}
               </div>
               
               {/* Stats */}
               <div className="flex justify-between bg-gray-50 p-3 rounded-lg text-xs font-bold mb-4">
                   <span className="text-green-700">Fixas: {fixedNumbers.length}/18</span>
                   <span className="text-red-700">Excluídas: {excludedNumbers.length}/9</span>
                   <span className="text-gray-600">Restantes: {25 - fixedNumbers.length - excludedNumbers.length}</span>
               </div>

               {/* Size Slider */}
               <div className="mb-2">
                   <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                       <span>Dezenas no Jogo:</span>
                       <span className="text-blue-600">{gameSize}</span>
                   </div>
                   <input 
                       type="range" 
                       min="15" 
                       max="23" 
                       value={gameSize} 
                       onChange={(e) => setGameSize(parseInt(e.target.value))}
                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                   />
                   <div className="flex justify-between text-xs text-gray-400 mt-1">
                       <span>15</span>
                       <span>23</span>
                   </div>
               </div>
          </div>
      )}

      {/* Common Quantity Control (Hides if in Closing Mode) */}
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg mb-6 border border-white/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {advMode === 'closing_total' && activeTab === 'advanced' ? (
              <div className="w-full">
                  <div className="flex items-center gap-2 mb-1">
                      <Sigma className="w-5 h-5 text-green-600" />
                      <span className="font-bold text-gray-700 text-sm">Cálculo de Fechamento:</span>
                  </div>
                  {closingStats && (
                      <div className={`p-2 rounded border font-bold text-center text-sm ${closingStats.isTooLarge ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                          {closingStats.count.toLocaleString()} jogos matemáticos
                          {closingStats.isTooLarge && <span className="block text-xs mt-1">Quantidade muito alta! Reduza dezenas ou use modo aleatório.</span>}
                      </div>
                  )}
              </div>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <label className="text-sm font-bold text-gray-700 whitespace-nowrap">Qtd. Jogos:</label>
                <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600">-</button>
                    <input 
                        type="number" 
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center outline-none font-bold text-lg py-1"
                    />
                    <button onClick={() => setQuantity(q => Math.min(100, q + 1))} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600">+</button>
                </div>
            </div>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
             {generatedGames.length > 0 && (
                 <button onClick={handleClear} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-bold flex items-center gap-2 text-sm ml-auto sm:ml-0 transition-colors">
                     <Trash2 className="w-4 h-4" /> Limpar
                 </button>
             )}
          </div>
      </div>

      {/* Manual Name Input (New) */}
      {activeTab === 'fast' && manualMode && generatedGames.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 mb-6 flex flex-col sm:flex-row gap-3 items-center">
              <label className="font-bold text-orange-800 text-sm whitespace-nowrap">Nome do Jogo (Opcional):</label>
              <input 
                type="text" 
                value={manualGameName}
                onChange={(e) => setManualGameName(e.target.value)}
                placeholder="Ex: Jogo da Sorte"
                className="w-full sm:flex-1 border border-orange-300 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
              />
          </div>
      )}

      {/* Main Display Area */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 mb-6 min-h-[200px] border border-white/20">
        {generatedGames.length === 0 ? (
           <div className="text-center text-gray-400 py-10 flex flex-col items-center justify-center h-full">
              {activeTab === 'fast' ? (
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50 text-purple-400" />
              ) : (
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-50 text-blue-400" />
              )}
              <p className="font-medium text-gray-500">
                  {advMode === 'closing_total' && activeTab === 'advanced' 
                     ? 'Clique em Gerar para calcular o fechamento completo.' 
                     : `Toque em Gerar para criar ${quantity} ${quantity > 1 ? 'jogos' : 'jogo'}`
                  }
              </p>
              {activeTab === 'advanced' && (
                  <p className="text-xs mt-2 text-blue-500 font-semibold">
                      {advMode === 'closing_total' && 'Modo Fechamento Matemático'}
                      {advMode === 'random' && 'Desdobramento Inteligente'}
                      {advMode === 'simple_custom' && 'Gerador Personalizado (Manual)'}
                  </p>
              )}
           </div>
        ) : (
            <div className="space-y-4">
                {generatedGames.length === 1 && activeTab === 'fast' && !manualMode ? (
                     <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs font-bold mb-4 uppercase tracking-wider">Jogo Único Gerado</span>
                        <div className="grid grid-cols-5 gap-3 sm:gap-4">
                            {generatedGames[0].map(num => (
                                <Ball key={num} number={num} size="xl" />
                            ))}
                        </div>
                     </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                         {manualMode && activeTab === 'fast' && (
                             <div className="text-center mb-4">
                                 <h3 className="font-bold text-gray-700">Seleção Manual ({generatedGames[0].length}/23)</h3>
                             </div>
                         )}
                         
                         {generatedGames.map((game, idx) => (
                             <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-xs font-bold text-gray-400 w-6">#{idx + 1}</span>
                                    {activeTab === 'advanced' && (
                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                            {game.length} dz
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1 justify-center flex-1">
                                    {manualMode && activeTab === 'fast' ? (
                                        <div className="grid grid-cols-5 gap-2 w-full">
                                            {Array.from({length: 25}, (_, i) => i + 1).map(num => (
                                                <Ball 
                                                    key={num} 
                                                    number={num} 
                                                    size="md" 
                                                    selected={game.includes(num)}
                                                    onClick={() => handleToggleNumberManual(num)}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        game.map(num => (
                                            <Ball key={num} number={num} size="sm" />
                                        ))
                                    )}
                                </div>
                             </div>
                         ))}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         
         {/* FAST MODE - SPLIT BUTTONS */}
         {activeTab === 'fast' ? (
             <>
                 <button 
                    onClick={handleGenerateSecretPattern}
                    className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 border-b-4 bg-indigo-600 hover:bg-indigo-700 border-indigo-800"
                 >
                    <Wand2 className="w-6 h-6 mb-1" />
                    <span className="text-xs tracking-wider">GERAR PADRÃO OCULTO</span>
                 </button>

                 <button 
                    onClick={handleGenerateAI}
                    className="flex flex-col items-center justify-center gap-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 border-b-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-purple-800"
                 >
                    <BrainCircuit className="w-6 h-6 mb-1" />
                    <span className="text-xs tracking-wider">GERAR C/ INTELIGÊNCIA IA</span>
                 </button>
             </>
         ) : (
             /* ADVANCED MODE - SINGLE GENERATE BUTTON */
             <button 
                onClick={handleGenerateAdvanced}
                className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 border-b-4
                    ${advMode === 'closing_total' ? 'bg-teal-600 hover:bg-teal-700 border-teal-800' : (advMode === 'simple_custom' ? 'bg-orange-500 hover:bg-orange-600 border-orange-700' : 'bg-blue-600 hover:bg-blue-700 border-blue-800')}
                `}
             >
                {advMode === 'simple_custom' ? <UserCog className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                {advMode === 'closing_total' ? 'GERAR FECHAMENTO' : (advMode === 'simple_custom' ? 'MONTAR MEUS JOGOS' : 'GERAR DESDOBRAMENTO')}
             </button>
         )}
         
         {activeTab === 'fast' && (
            <button 
                onClick={handleManualClick}
                className="flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-lg border-b-4 border-orange-700 transition-all active:scale-95 sm:col-span-2 md:col-span-1 md:col-start-2 lg:col-span-2 lg:col-start-1"
            >
                <Hand className="w-5 h-5" />
                JOGAR MANUALMENTE
            </button>
         )}

         <button 
            onClick={handleSave}
            disabled={
                generatedGames.length === 0 || 
                (activeTab === 'fast' && !manualMode && generatedGames.some(g => g.length !== 15)) || 
                (activeTab === 'fast' && manualMode && generatedGames.some(g => g.length < 15 || g.length > 23)) ||
                (activeTab === 'advanced' && generatedGames.some(g => g.length !== gameSize))
            }
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 border-b-4 sm:col-span-2 md:col-span-1
                ${generatedGames.length > 0 ? 'bg-green-600 hover:bg-green-700 border-green-800' : 'bg-gray-400 border-gray-500 cursor-not-allowed'}
            `}
         >
            <Save className="w-5 h-5" />
            SALVAR JOGOS
         </button>
      </div>

    </div>
  );
};
