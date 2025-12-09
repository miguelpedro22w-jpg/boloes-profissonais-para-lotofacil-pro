
import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, RotateCcw, FileSpreadsheet, BarChart3, Medal, ListFilter, ArrowLeft } from 'lucide-react';
import { DrawResult } from '../types';
import { Ball } from '../components/Ball';
import { analyzeMazusoft, exportToXLSX, calculateHistoryStats } from '../utils/lotteryUtils';

interface MazusoftProps {
  results: DrawResult[];
  onBack: () => void;
}

export const Mazusoft: React.FC<MazusoftProps> = ({ results, onBack }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [compareConcurso, setCompareConcurso] = useState<string>(""); 
  const [historyStats, setHistoryStats] = useState<number[] | null>(null);

  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num).sort((a,b)=>a-b));
    } else {
      // Changed limit to 25 as requested
      if (selectedNumbers.length < 25) {
        setSelectedNumbers([...selectedNumbers, num].sort((a,b)=>a-b));
      }
    }
  };

  const targetDraw = useMemo(() => {
     if (!compareConcurso && results.length > 0) return results[0]; 
     const found = results.find(r => r.concurso.toString() === compareConcurso);
     return found || null;
  }, [compareConcurso, results]);

  const previousDraw = useMemo(() => {
     if (!targetDraw) return null;
     return results.find(r => r.concurso === targetDraw.concurso - 1);
  }, [targetDraw, results]);

  const stats = useMemo(() => {
    if (!targetDraw || selectedNumbers.length === 0) return null;
    return analyzeMazusoft(selectedNumbers, targetDraw, previousDraw || undefined);
  }, [selectedNumbers, targetDraw, previousDraw]);

  const handleCheckHistory = () => {
      if (selectedNumbers.length === 0 || results.length === 0) {
          alert("Selecione dezenas e certifique-se de ter resultados carregados.");
          return;
      }
      const historyCounts = calculateHistoryStats(selectedNumbers, results);
      setHistoryStats(historyCounts);
  };

  const handleExportAnalysis = () => {
    if (!stats || !targetDraw) return;
    
    const exportData = [{
      Concurso_Base: targetDraw.concurso,
      Data: targetDraw.data,
      Dezenas_Selecionadas: selectedNumbers.join(', '),
      Acertos: stats.hits,
      Repetidas: stats.repeats,
      Linha_1: stats.rowCounts[0],
      Linha_2: stats.rowCounts[1],
      Linha_3: stats.rowCounts[2],
      Linha_4: stats.rowCounts[3],
      Linha_5: stats.rowCounts[4],
      Col_1: stats.colCounts[0],
      Col_2: stats.colCounts[1],
      Col_3: stats.colCounts[2],
      Col_4: stats.colCounts[3],
      Col_5: stats.colCounts[4]
    }];

    exportToXLSX(exportData, `Analise_Mazusoft_${targetDraw.concurso}`);
  };

  // Helper to generate the text summary
  const getSummaryText = () => {
      if (!historyStats || selectedNumbers.length === 0) return null;
      
      // Determine max possible hits (capped at 15 for Lotofacil)
      const maxPossible = Math.min(selectedNumbers.length, 15);
      const summaryParts = [];
      
      // Iterate from max down to 1
      for (let i = maxPossible; i >= 1; i--) {
          if (historyStats[i] > 0) {
              summaryParts.push(`${i} acertos ${historyStats[i]} vezes`);
          }
      }
      
      if (summaryParts.length === 0) return "Nenhum acerto registrado no histórico.";
      
      return `Estas dezenas tiveram: ${summaryParts.join(', ')}.`;
  };

  // Determine which scores to show in cards (relevant ones)
  const scoresToShow = useMemo(() => {
      if (!historyStats || selectedNumbers.length === 0) return [];
      const maxPossible = Math.min(selectedNumbers.length, 15);
      const scores = [];
      // Show top 5 relevant scores or down to 1
      for(let i = maxPossible; i >= Math.max(1, maxPossible - 6); i--) {
          scores.push(i);
      }
      return scores;
  }, [historyStats, selectedNumbers.length]);

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Início
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
            <Search className="w-6 h-6" />
            Simulador Pro
        </h1>
        {stats && (
          <button 
            onClick={handleExportAnalysis}
            className="text-green-700 hover:text-green-800 flex items-center gap-1 font-bold text-sm bg-green-100 hover:bg-green-200 px-3 py-2 rounded-lg shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-700">Selecione até 25 Dezenas</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedNumbers.length > 15 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedNumbers.length} / 25
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
             
             <div className="flex gap-2 flex-col sm:flex-row">
                <button 
                    onClick={() => { setSelectedNumbers([]); setHistoryStats(null); }} 
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    Limpar
                </button>
                <button 
                    onClick={handleCheckHistory}
                    disabled={results.length === 0 || selectedNumbers.length === 0}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                    <BarChart3 className="w-5 h-5" />
                    Conferir Histórico
                </button>
             </div>
          </div>

          {/* Right Column: Analysis */}
          <div className="space-y-6">
              
              {/* Comparator Control */}
              <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Conferir com Concurso Específico:</label>
                  <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder={results[0]?.concurso.toString() || "Num"}
                        value={compareConcurso}
                        onChange={(e) => setCompareConcurso(e.target.value)}
                        className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 outline-none font-bold text-lg"
                      />
                      <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center font-bold text-sm sm:text-base">
                          {targetDraw ? `Data: ${targetDraw.data}` : 'Não encontrado'}
                      </div>
                  </div>
              </div>

              {/* History Stats Result */}
              {historyStats && (
                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl border-2 border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                          <Medal className="w-5 h-5" />
                          Performance no Histórico
                      </h3>

                      {/* Text Summary */}
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg mb-4">
                           <div className="flex items-start gap-2">
                                <ListFilter className="w-5 h-5 text-indigo-600 mt-1 shrink-0" />
                                <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                                   {getSummaryText()}
                                </p>
                           </div>
                      </div>

                      {/* Score Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {scoresToShow.map(score => (
                              <div key={score} className={`${historyStats[score] > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'} border p-3 rounded-lg text-center`}>
                                  <div className={`text-2xl font-black ${historyStats[score] > 0 ? 'text-green-700' : 'text-gray-300'}`}>
                                      {historyStats[score]}
                                  </div>
                                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                      {score} Acertos
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Single Contest Stats */}
              {stats && !historyStats && (
                  <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl animate-in fade-in border border-white/20">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Resultado no Concurso {targetDraw?.concurso}
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-green-50 p-4 rounded-xl text-center border border-green-100">
                              <span className="block text-3xl font-black text-green-600">{stats.hits}</span>
                              <span className="text-xs font-bold text-green-800 uppercase">Acertos</span>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                              <span className="block text-3xl font-black text-blue-600">{stats.repeats}</span>
                              <span className="text-xs font-bold text-blue-800 uppercase">Repetidas</span>
                          </div>
                      </div>
                      
                      {/* Grid Visualization */}
                      <div>
                          <p className="text-xs font-bold text-gray-400 mb-2 uppercase text-center">Distribuição no Cartão</p>
                          <div className="grid grid-cols-5 gap-1 max-w-[200px] mx-auto">
                              {stats.grid.flat().map((num, i) => (
                                  <div key={i} className={`h-2 rounded-sm ${num > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
