
import React, { useState, useMemo } from 'react';
import { Trash2, Share2, CheckSquare, FileSpreadsheet, Check, X, Hand, Zap, Bot, ArrowLeft, ArrowRight, Calendar, Trophy, BarChart3, Search, AlertTriangle, RotateCcw } from 'lucide-react';
import { SavedGame, DrawResult } from '../types';
import { Ball } from '../components/Ball';
import { exportToXLSX, analyzeDrawStats } from '../utils/lotteryUtils';

interface SavedGamesProps {
  games: SavedGame[];
  results: DrawResult[];
  onDelete: (ids: string | string[]) => void;
  onReset?: () => void; // New prop for emergency reset
  onBack: () => void;
}

type SaveView = 'generated' | 'manual';

export const SavedGames: React.FC<SavedGamesProps> = ({ games, results, onDelete, onReset, onBack }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<SaveView>('generated');
  
  // State for the checker navigation
  const [checkIndex, setCheckIndex] = useState(0);
  const [directSearchConcurso, setDirectSearchConcurso] = useState("");

  // Direct filtering - recalculated every render to ensure freshness
  const filteredGames = games.filter(g => {
      if (currentView === 'manual') return g.type === 'manual';
      return g.type !== 'manual';
  });

  const checkDraw = results.length > 0 ? results[checkIndex] : null;
  const previousDraw = results.length > checkIndex + 1 ? results[checkIndex + 1] : null;

  const drawStats = useMemo(() => {
      if (!checkDraw) return null;
      return analyzeDrawStats(checkDraw, previousDraw);
  }, [checkDraw, previousDraw]);

  // Recalculate display games every render to avoid stale cache issues when deleting
  const displayGames = filteredGames.map(g => {
      if (checkDraw) {
          const hits = g.numbers.filter(n => checkDraw.dezenas.includes(n)).length;
          return { ...g, hits, concursoCheck: checkDraw.concurso };
      }
      return g;
  });

  const scoreSummary = useMemo(() => {
      const counts = Array(16).fill(0);
      if (checkDraw) {
          displayGames.forEach(g => {
              if (g.hits !== undefined && g.hits <= 15) {
                  counts[g.hits]++;
              }
          });
      }
      return counts;
  }, [displayGames, checkDraw]);

  const toggleSelection = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleSelectAll = () => {
      if (selectedIds.length === filteredGames.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(filteredGames.map(g => String(g.id)));
      }
  };

  const handleBulkDelete = () => {
      if (confirm(`Tem certeza que deseja excluir ${selectedIds.length} jogos?`)) {
          onDelete(selectedIds);
          setSelectedIds([]);
      }
  };

  const handleSingleDelete = (e: React.MouseEvent | React.TouchEvent, id: string) => {
      e.stopPropagation(); 
      // Force synthetic event prevent default
      if (e.nativeEvent) {
          e.nativeEvent.stopImmediatePropagation();
      }
      
      if (window.confirm("Deseja realmente excluir este jogo?")) {
          const idStr = String(id);
          onDelete(idStr);
          // If it was selected, unselect it locally
          if (selectedIds.includes(idStr)) {
              setSelectedIds(prev => prev.filter(sid => sid !== idStr));
          }
      }
  };

  const handleEmergencyReset = () => {
      if (window.confirm("ATENÇÃO: Isso apagará TODOS os jogos salvos para corrigir erros de memória. O histórico de resultados NÃO será apagado. Deseja continuar?")) {
          if (onReset) onReset();
      }
  };

  const handleBulkShare = async () => {
      const gamesToShare = displayGames.filter(g => selectedIds.includes(String(g.id)));
      if (gamesToShare.length === 0) return;

      const text = gamesToShare.map(g => 
          g.numbers.map(n => String(n).padStart(2, '0')).join(' ')
      ).join('\n\n');

      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'Jogos Lotofácil',
                  text: text
              });
          } catch (error) {
              console.log('Error sharing', error);
          }
      } else {
          navigator.clipboard.writeText(text);
          alert('Jogos copiados para a área de transferência!');
      }
  };

  const handleExport = () => {
    if (filteredGames.length === 0) return;
    const data = displayGames.map(g => ({
        ID: String(g.id).substring(0,8),
        Nome: g.name || '-',
        Data: new Date(g.date).toLocaleDateString(),
        Tipo: g.type === 'manual' ? 'Manual' : 'Gerado/IA',
        Dezenas: g.numbers.join(', '),
        Pares: g.even !== undefined ? g.even : '-',
        Impares: g.odd !== undefined ? g.odd : '-',
        Concurso_Conferido: g.concursoCheck || '-',
        Pontos: g.hits || '-'
    }));
    exportToXLSX(data, `Meus_Jogos_${currentView}`);
  };

  const handlePrevDraw = () => { if (checkIndex < results.length - 1) setCheckIndex(checkIndex + 1); };
  const handleNextDraw = () => { if (checkIndex > 0) setCheckIndex(checkIndex - 1); };

  const handleDirectJump = () => {
      const target = parseInt(directSearchConcurso);
      if (isNaN(target)) return;
      const index = results.findIndex(r => r.concurso === target);
      if (index !== -1) { setCheckIndex(index); setDirectSearchConcurso(""); } 
      else { alert(`Concurso ${target} não encontrado nos resultados carregados.`); }
  };

  const getScoreColor = (hits: number) => {
      if (hits === 15) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      if (hits === 14) return 'bg-gray-200 text-gray-800 border-gray-400';
      if (hits >= 11) return 'bg-green-100 text-green-800 border-green-300';
      return 'bg-white/50 text-gray-500 border-gray-200';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white font-bold transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Início
          </button>
          
          {/* Emergency Reset Button */}
          {onReset && (
              <button 
                onClick={handleEmergencyReset}
                className="flex items-center gap-1 text-[10px] bg-red-900/50 hover:bg-red-800 text-red-100 px-2 py-1 rounded border border-red-500/50 transition-colors"
                title="Use se os jogos travarem"
              >
                  <RotateCcw className="w-3 h-3" /> Reiniciar Banco de Jogos
              </button>
          )}
      </div>

      {/* Top Tabs to separate pages */}
      <div className="flex bg-white/95 backdrop-blur-md rounded-xl p-1 mb-6 shadow-xl border border-white/20">
          <button 
             onClick={() => { setCurrentView('generated'); setSelectedIds([]); }}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${currentView === 'generated' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <Bot className="w-4 h-4" />
              JOGOS DA IA / AUTOMÁTICOS
          </button>
          <button 
             onClick={() => { setCurrentView('manual'); setSelectedIds([]); }}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${currentView === 'manual' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
          >
              <Hand className="w-4 h-4" />
              JOGOS MANUAIS
          </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 drop-shadow-md">
             {currentView === 'manual' ? <Hand className="text-orange-400"/> : <Zap className="text-purple-300"/>}
             {currentView === 'manual' ? 'Meus Jogos Manuais' : 'Jogos da Tecnologia IA'}
         </h1>
         
         <div className="flex flex-wrap gap-2 w-full md:w-auto">
             <button 
                onClick={handleSelectAll}
                className="bg-white/90 text-gray-700 px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-white text-xs sm:text-sm flex-1 md:flex-none justify-center shadow"
             >
                {selectedIds.length === filteredGames.length && filteredGames.length > 0 ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {selectedIds.length === filteredGames.length && filteredGames.length > 0 ? 'Desmarcar' : 'Todos'}
             </button>

             {selectedIds.length > 0 ? (
                 <>
                    <button 
                        onClick={handleBulkShare}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 text-xs sm:text-sm flex-1 md:flex-none justify-center shadow-lg"
                    >
                        <Share2 className="w-4 h-4" />
                        Compartilhar ({selectedIds.length})
                    </button>
                    <button 
                        onClick={handleBulkDelete}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-red-600 text-xs sm:text-sm flex-1 md:flex-none justify-center shadow-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir ({selectedIds.length})
                    </button>
                 </>
             ) : (
                <button 
                    onClick={handleExport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 text-xs sm:text-sm flex-1 md:flex-none justify-center shadow-lg"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                </button>
             )}
         </div>
      </div>

      {/* Checker Panel */}
      {results.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-xl border-b-4 border-indigo-500">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-indigo-800 font-bold self-start xl:self-center">
                        <CheckSquare className="w-6 h-6" />
                        <span className="text-sm uppercase tracking-wide">Conferidor</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-lg border border-indigo-100 w-full sm:w-auto">
                             <input 
                                type="number" placeholder="Ir p/ Concurso" 
                                className="bg-white px-2 py-1.5 rounded text-sm font-bold text-gray-700 outline-none w-full sm:w-32 text-center"
                                value={directSearchConcurso}
                                onChange={(e) => setDirectSearchConcurso(e.target.value)}
                             />
                             <button onClick={handleDirectJump} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700" title="Buscar">
                                 <Search className="w-4 h-4" />
                             </button>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1 shadow-inner w-full sm:w-auto justify-between sm:justify-center">
                            <button onClick={handlePrevDraw} disabled={checkIndex >= results.length - 1} className="p-2 hover:bg-white rounded-md disabled:opacity-30 transition-colors">
                                <ArrowLeft className="w-6 h-6 text-gray-700" />
                            </button>
                            <div className="text-center min-w-[140px]">
                                <div className="text-xl font-black text-gray-800">#{checkDraw?.concurso}</div>
                                <div className="text-xs font-bold text-gray-500">{checkDraw?.data}</div>
                            </div>
                            <button onClick={handleNextDraw} disabled={checkIndex === 0} className="p-2 hover:bg-white rounded-md disabled:opacity-30 transition-colors">
                                <ArrowRight className="w-6 h-6 text-gray-700" />
                            </button>
                        </div>
                    </div>
                </div>
                
                {checkDraw && (
                    <div className="mt-4 pt-4 border-t border-indigo-100">
                        <p className="text-xs text-center text-indigo-400 font-bold mb-3 uppercase tracking-widest">Dezenas Sorteadas Neste Concurso</p>
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {checkDraw.dezenas.map(d => (
                                <Ball key={d} number={d} size="sm" isResult />
                            ))}
                        </div>

                        {drawStats && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-gray-700 space-y-4 shadow-sm">
                                <div className="text-center">
                                    <p className="font-bold text-indigo-900 text-base">Este concurso tiveram</p>
                                    <p className="font-mono text-lg font-black text-indigo-600">
                                        {drawStats.even}/par/{drawStats.odd}impar
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-indigo-900">Dez dezenas Ausente</p>
                                    <p className="text-indigo-600 font-bold tracking-wider">
                                        {drawStats.absent.map(n => String(n).padStart(2,'0')).join(' ')}
                                    </p>
                                </div>
                                {previousDraw && (
                                    <>
                                        <div className="text-center border-t border-indigo-200 pt-3">
                                            <p className="font-bold text-indigo-900 uppercase text-xs mb-1">DEZENAS Que se repetiram do</p>
                                            <p className="text-xs font-bold text-gray-500 mb-1">Concurso {previousDraw.concurso} para Concurso {checkDraw.concurso}</p>
                                            <p className="font-bold text-indigo-900 mb-1">Foram estas {drawStats.repeated.length} dezenas</p>
                                            <p className="text-blue-600 font-bold tracking-wider">
                                                {drawStats.repeated.length > 0 ? drawStats.repeated.map(n => String(n).padStart(2,'0')).join(' ') : "Nenhuma"}
                                            </p>
                                        </div>

                                        <div className="text-center border-t border-indigo-200 pt-3">
                                            <p className="font-bold text-indigo-900 mb-1">As dezenas que não se repetiram no Concurso foram {drawStats.newNumbers.length} dezenas</p>
                                            <p className="text-green-600 font-bold tracking-wider">
                                                {drawStats.newNumbers.length > 0 ? drawStats.newNumbers.map(n => String(n).padStart(2,'0')).join(' ') : "Nenhuma"}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {checkDraw && (
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-5 shadow-xl border border-white/20">
                     <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Resumo de Desempenho (Seus Jogos neste Concurso)
                     </h3>
                     <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                         {[15, 14, 13, 12, 11].map(score => (
                             <div key={score} className={`p-2 rounded-lg border-2 text-center flex flex-col items-center justify-center ${scoreSummary[score] > 0 ? getScoreColor(score) : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                                 <div className="text-xl font-black">{scoreSummary[score]}</div>
                                 <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                                     {score >= 11 && <Trophy className="w-3 h-3" />} {score} Pontos
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                         {[10, 9, 8, 7, 6, 5].map(score => (
                             <div key={score} className={`p-1.5 rounded-lg border text-center ${scoreSummary[score] > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                 <div className="text-sm font-bold">{scoreSummary[score]}</div>
                                 <div className="text-[9px] font-medium uppercase">{score} pts</div>
                             </div>
                         ))}
                     </div>
                </div>
            )}
          </div>
      )}

      <div className="grid gap-4">
          {displayGames.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-white/30 rounded-xl bg-white/10 backdrop-blur-md">
                  {currentView === 'manual' ? (
                       <Hand className="w-12 h-12 text-white/50 mx-auto mb-2" />
                  ) : (
                       <Bot className="w-12 h-12 text-white/50 mx-auto mb-2" />
                  )}
                  <p className="text-white font-bold text-lg">Nenhum jogo {currentView === 'manual' ? 'manual' : 'automático'} salvo.</p>
              </div>
          ) : (
              displayGames.map(game => {
                  const idStr = String(game.id);
                  const isSelected = selectedIds.includes(idStr);
                  const scoreClass = game.hits !== undefined ? getScoreColor(game.hits) : 'bg-gray-100';

                  return (
                    <div 
                        key={idStr} 
                        className={`p-4 rounded-xl shadow-lg border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${isSelected ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400' : 'bg-white/95 border-white/20 hover:scale-[1.01]'}`}
                        onClick={() => toggleSelection(idStr)}
                    >
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${game.type === 'manual' ? 'bg-orange-400' : 'bg-purple-500'}`}></div>

                        <div className="flex justify-between items-start mb-3 pl-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {game.name && <span className="font-bold text-gray-800 mr-2">{game.name}</span>}
                                        <p className="text-xs text-gray-500 font-medium">Data: {new Date(game.date).toLocaleDateString()}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${game.type === 'manual' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {game.type === 'manual' ? 'Manual' : 'Tecnologia IA'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-1">
                                        {game.hits !== undefined && (
                                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border ${scoreClass}`}>
                                                {game.hits >= 11 ? <Trophy className="w-3 h-3" /> : <Calendar className="w-3 h-3"/>}
                                                {game.hits} Pontos
                                            </div>
                                        )}
                                        {/* STATS BADGE (Requirement: Show Even/Odd) */}
                                        {(game.even !== undefined && game.odd !== undefined) && (
                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border bg-gray-100 text-gray-600 border-gray-200">
                                                {game.even} Par / {game.odd} Ímpar
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => handleSingleDelete(e, idStr)}
                                className="text-white bg-red-500 hover:bg-red-700 p-3 rounded-xl shadow-md transition-colors z-50 relative active:scale-95 border border-red-600"
                                title="Excluir este jogo"
                                style={{ minWidth: '48px', minHeight: '48px' }}
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pointer-events-none pl-3 justify-center sm:justify-start">
                            {game.numbers.map(n => (
                                <Ball key={n} number={n} size="sm" />
                            ))}
                        </div>
                    </div>
                  );
              })
          )}
      </div>
    </div>
  );
};
