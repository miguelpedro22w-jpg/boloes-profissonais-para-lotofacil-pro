
import React from 'react';
import { Tab } from '../types';
import { Trophy, Dna, Download, Play, Save, CheckCircle2, Lock, Disc, Calculator } from 'lucide-react';

interface HomeProps {
  setTab: (tab: Tab) => void;
  isIAActive: boolean;
  savedCount: number;
}

export const Home: React.FC<HomeProps> = ({ setTab, isIAActive, savedCount }) => {
  return (
    <div className="max-w-lg mx-auto pb-24 text-white relative">
       {/* Admin Access Button */}
       <button 
         onClick={() => setTab(Tab.ADMIN)}
         className="absolute top-2 right-2 p-2 text-white/30 hover:text-white/80 transition-colors"
         title="Área Administrativa"
       >
         <Lock className="w-4 h-4" />
       </button>

       <div className="text-center mb-8 pt-6">
           <h1 className="text-4xl font-black mb-2 drop-shadow-md tracking-tight">BOLÕES PROFISSIONAIS</h1>
           <p className="text-white/80 font-medium text-lg">Estratégias de Alto Nível</p>
       </div>

       <div className="grid gap-4">
           {/* Generator Card */}
           <button 
              onClick={() => setTab(Tab.GENERATOR)}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl font-bold text-white">Gerador {isIAActive ? 'Profissional' : 'Aleatório'}</h2>
                  {isIAActive ? <Trophy className="text-yellow-400 w-8 h-8 drop-shadow" /> : <Play className="text-white/70 w-8 h-8" />}
              </div>
              <p className="text-white/70 text-sm relative z-10">
                  {isIAActive 
                    ? "Tecnologia ativada! Estratégias exclusivas de grandes apostadores." 
                    : "Modo Padrão. Carregue resultados para liberar a tecnologia profissional."}
              </p>
           </button>

           {/* Globe Sim Card */}
           <button 
              onClick={() => setTab(Tab.GLOBO)}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl font-bold text-white">Globo Virtual 3D</h2>
                  <Disc className="text-cyan-400 w-8 h-8 drop-shadow animate-spin-slow" />
              </div>
              <p className="text-white/70 text-sm relative z-10">
                  Simulador de sorteio com cronômetro e exclusão de dezenas.
              </p>
           </button>

           {/* Mazusoft Analysis Card */}
           <button 
              onClick={() => setTab(Tab.MAZUSOFT)}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl font-bold text-white">Simulador Pro</h2>
                  <Dna className="text-blue-400 w-8 h-8 drop-shadow" />
              </div>
              <p className="text-white/70 text-sm relative z-10">
                  Análise profunda de matrizes, saltos e repetições de concursos anteriores.
              </p>
           </button>
           
           {/* Combinations Card (New) */}
           <button 
              onClick={() => setTab(Tab.COMBINATIONS)}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl font-bold text-white">Combinador Matemático</h2>
                  <Calculator className="text-pink-400 w-8 h-8 drop-shadow" />
              </div>
              <p className="text-white/70 text-sm relative z-10">
                  Gere todas as combinações possíveis a partir de um grupo de dezenas selecionadas.
              </p>
           </button>

           {/* Saved Games */}
           <button 
              onClick={() => setTab(Tab.SAVED)}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl font-bold text-white">Jogos Salvos</h2>
                  <div className="flex items-center gap-2">
                      <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">{savedCount}</span>
                      <Save className="text-green-400 w-8 h-8 drop-shadow" />
                  </div>
              </div>
              <p className="text-white/70 text-sm relative z-10">
                  Confira, gerencie e exporte seus jogos favoritos.
              </p>
           </button>

           {/* Results */}
           <button 
              onClick={() => setTab(Tab.RESULTS)}
              className="bg-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 hover:bg-white/20 transition-all text-left group relative overflow-hidden"
           >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                  <h2 className="text-xl font-bold text-white">Resultados</h2>
                  <Download className="text-orange-400 w-8 h-8 drop-shadow" />
              </div>
              <p className="text-white/70 text-sm relative z-10">
                  Baixe e carregue resultados oficiais da Caixa para alimentar a tecnologia do app.
              </p>
           </button>
       </div>
       
       <div className="mt-8 text-center space-y-2">
            <div className="inline-flex items-center gap-1 bg-white/20 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
                 <CheckCircle2 className="w-3 h-3 text-green-400" /> Backup Automático Ativo
            </div>
            <p className="text-xs text-white/50">Versão 2.1 - Professional Edition</p>
       </div>
    </div>
  );
};