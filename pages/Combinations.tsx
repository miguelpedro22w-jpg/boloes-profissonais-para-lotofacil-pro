
import React, { useState } from 'react';
import { ArrowLeft, Radar, RotateCcw, Search, CalendarCheck, History, Info } from 'lucide-react';
import { DrawResult } from '../types';
import { Ball } from '../components/Ball';

interface CombinationsProps {
  onBack: () => void;
  results: DrawResult[];
}

export const Combinations: React.FC<CombinationsProps> = ({ onBack, results }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [matchingDraws, setMatchingDraws] = useState<DrawResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num).sort((a,b)=>a-b));
      // Reset search if modified to avoid confusion
      if (hasSearched) {
          setHasSearched(false);
          setMatchingDraws([]);
      }
    } else {
      if (selectedNumbers.length < 15) {
        setSelectedNumbers([...selectedNumbers, num].sort((a,b)=>a-b));
         if (hasSearched) {
            setHasSearched(false);
            setMatchingDraws([]);
         }
      } else {
        alert("Para rastreamento, o limite recomendado é 15 dezenas (padrão de um jogo).");
      }
    }
  };

  const handleSearch = () => {
    if (selectedNumbers.length < 2) {
        alert("Selecione pelo menos 2 dezenas para rastrear um padrão.");
        return;
    }
    if (results.length === 0) {
        alert("Não há resultados carregados para pesquisar. Vá na aba DADOS e carregue o histórico.");
        return;
    }

    // Filter Logic: Find draws that contain ALL selected numbers
    const found = results.filter(draw => {
        return selectedNumbers.every(num => draw.dezenas.includes(num));
    });

    setMatchingDraws(found);
    setHasSearched(true);
  };

  const handleClear = () => {
      setSelectedNumbers([]);
      setMatchingDraws([]);
      setHasSearched(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 text-white">
        <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Início
        </button>

        <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-600 p-3 rounded-xl shadow-lg">
                <Radar className="w-8 h-8 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black">Rastreador de Padrões</h1>
                <p className="text-white/70 text-sm">Descubra onde seus números saíram juntos</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* INPUT PANEL */}
            <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Selecione o Grupo</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedNumbers.length > 0 ? 'bg-pink-500 text-white' : 'bg-gray-500/50 text-gray-200'}`}>
                            {selectedNumbers.length} Dezenas
                        </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {Array.from({length: 25}, (_, i) => i + 1).map(num => (
                            <Ball 
                                key={num} 
                                number={num} 
                                size="md" 
                                selected={selectedNumbers.includes(num)}
                                onClick={() => handleToggleNumber(num)}
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={handleClear}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" /> Limpar
                        </button>
                        <button 
                            onClick={handleSearch}
                            disabled={selectedNumbers.length < 2 || results.length === 0}
                            className="flex-[2] bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <Search className="w-5 h-5" />
                            Rastrear no Histórico
                        </button>
                    </div>
                </div>
                
                <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-500/30 flex gap-3 items-start">
                    <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-100 leading-relaxed">
                        Selecione um grupo de dezenas (Ex: 01, 03, 05) e o sistema listará <strong>todos os concursos</strong> onde essas dezenas saíram juntas. Ideal para conferir se um jogo ou padrão já foi premiado no passado.
                    </p>
                </div>
            </div>

            {/* OUTPUT PANEL */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <History className="w-5 h-5 text-pink-600" />
                        Concursos Encontrados
                    </h3>
                    
                    {hasSearched && (
                        <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-bold">
                            Total: {matchingDraws.length}
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 custom-scrollbar">
                    {!hasSearched ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <Search className="w-16 h-16 mb-4" />
                            <p className="text-sm font-bold">Aguardando busca</p>
                            <p className="text-xs">Selecione as dezenas e clique em Rastrear.</p>
                        </div>
                    ) : matchingDraws.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <div className="bg-gray-200 p-4 rounded-full mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-700">Nenhum concurso encontrado</p>
                            <p className="text-xs mt-1 max-w-[200px] text-center">Essa combinação específica de {selectedNumbers.length} dezenas nunca saiu junta no histórico carregado.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matchingDraws.map((draw) => (
                                <div key={draw.concurso} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:border-pink-300 transition-colors">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-pink-700">Concurso #{draw.concurso}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                                            <CalendarCheck className="w-3 h-3" />
                                            {draw.data}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                                        {draw.dezenas.map(n => (
                                            <Ball 
                                                key={n} 
                                                number={n} 
                                                size="sm" 
                                                // Highlight selected numbers to make it easy to see the pattern
                                                selected={selectedNumbers.includes(n)}
                                                // Visual trick: If it's not selected, make it greyish (using onClick logic without click)
                                                onClick={selectedNumbers.includes(n) ? undefined : () => {}}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
