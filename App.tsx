
import React, { useState, useEffect } from 'react';
import { Tab, DrawResult, SavedGame } from './types';
import { Home } from './pages/Home';
import { Generator } from './pages/Generator';
import { Mazusoft } from './pages/Mazusoft';
import { Combinations } from './pages/Combinations';
import { Results } from './pages/Results';
import { SavedGames } from './pages/SavedGames';
import { Admin } from './pages/Admin';
import { GlobeSim } from './pages/GlobeSim';
import { FileLoader } from './pages/FileLoader';
import { Home as HomeIcon, Zap, Activity, FolderHeart, Settings, FileSearch } from 'lucide-react';
import { generateUUID, sanitizeInput } from './utils/lotteryUtils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  // FIX: Lazy Initialization to prevent LocalStorage overwrite/sync issues
  const [results, setResults] = useState<DrawResult[]>(() => {
      try {
          const saved = localStorage.getItem('bp_results');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          console.error("Error loading results", e);
          return [];
      }
  });

  const [savedGames, setSavedGames] = useState<SavedGame[]>(() => {
      try {
          const saved = localStorage.getItem('bp_saved_games');
          if (!saved) return [];
          const parsed = JSON.parse(saved);
          
          if (!Array.isArray(parsed)) return [];

          // PHASE 1: Basic Sanitation & Type Enforcement
          let cleanGames = parsed.map((g: any) => ({
              ...g,
              // Force ID to be a string. If invalid, generate a new robust UUID.
              id: (g.id !== undefined && g.id !== null) ? String(g.id) : generateUUID()
          }));

          // PHASE 2: Deduplication Check (Fix for 'Ghost Games')
          const seenIds = new Set();
          const uniqueGames: SavedGame[] = [];
          
          for (const g of cleanGames) {
              if (!seenIds.has(g.id)) {
                  seenIds.add(g.id);
                  uniqueGames.push(g);
              } else {
                  // Duplicate ID found - Regenerate
                  const newId = generateUUID();
                  if (!seenIds.has(newId)) {
                      seenIds.add(newId);
                      uniqueGames.push({ ...g, id: newId });
                  }
              }
          }

          return uniqueGames;
      } catch (e) {
          console.error("Error loading games", e);
          return [];
      }
  });

  // Persist Data Effects (Save whenever state changes)
  useEffect(() => {
    try {
        localStorage.setItem('bp_saved_games', JSON.stringify(savedGames));
    } catch (e) {
        console.error("LocalStorage Save Failed (Quota or Error)", e);
    }
  }, [savedGames]);

  useEffect(() => {
    localStorage.setItem('bp_results', JSON.stringify(results));
  }, [results]);

  const handleSaveGame = (gameOrGames: SavedGame | SavedGame[]) => {
    const newGames = Array.isArray(gameOrGames) ? gameOrGames : [gameOrGames];
    
    setSavedGames(prev => {
        // Start counter based on current total games
        let counter = prev.length + 1;
        
        const validatedNewGames = newGames.map(g => {
            let finalName = g.name;
            
            // SECURITY & AUTOMATIC NAMING LOGIC:
            // Sanitize Name input to prevent XSS
            finalName = sanitizeInput(finalName || "");

            // If name is missing after sanitization, assign "Jogo X"
            if (!finalName || !finalName.trim()) {
                finalName = `Jogo ${counter}`;
                counter++;
            }

            // CALCULAR PARES E ÍMPARES (Requirement: Data Enrichment)
            const evens = g.numbers.filter(n => n % 2 === 0).length;
            const odds = g.numbers.length - evens;
            
            return {
                ...g,
                // Ensure ID is valid string
                id: g.id ? String(g.id) : generateUUID(),
                // Apply the final sanitized name
                name: finalName,
                // Store stats
                even: evens,
                odd: odds
            };
        });
        return [...validatedNewGames, ...prev];
    });
  };

  const handleDeleteGame = (ids: string | string[]) => {
    // Normalize input to array of strings
    const targetIds = (Array.isArray(ids) ? ids : [ids]).map(String);
    
    setSavedGames(prevGames => {
        // Direct filtering: Keep game ONLY if its ID is NOT in the target list
        return prevGames.filter(game => !targetIds.includes(String(game.id)));
    });
  };

  // --- EMERGENCY RESET FUNCTION ("TN" CODE ALTERNATIVE) ---
  const handleResetGames = () => {
      setSavedGames([]); // Clear state immediately
      localStorage.removeItem('bp_saved_games'); // Hard clear storage key
      alert("Banco de jogos reiniciado com sucesso! Seus resultados (histórico) foram mantidos.");
  };

  // IA is now ALWAYS ACTIVE as requested by user
  const isIAActive = true;
  const goHome = () => setActiveTab(Tab.HOME);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 font-sans text-gray-900">
      
      {/* Content Area */}
      <main className="pb-24 pt-4 px-2 sm:px-4">
        {activeTab === Tab.HOME && (
            <Home setTab={setActiveTab} isIAActive={isIAActive} savedCount={savedGames.length} />
        )}
        {activeTab === Tab.GENERATOR && (
            <Generator results={results} onSave={handleSaveGame} onBack={goHome} />
        )}
        {activeTab === Tab.MAZUSOFT && (
            <Mazusoft results={results} onBack={goHome} />
        )}
        {activeTab === Tab.COMBINATIONS && (
            <Combinations onBack={goHome} results={results} />
        )}
        {activeTab === Tab.RESULTS && (
            <Results results={results} setResults={setResults} onBack={goHome} />
        )}
        {activeTab === Tab.SAVED && (
            <SavedGames games={savedGames} results={results} onDelete={handleDeleteGame} onBack={goHome} onReset={handleResetGames} />
        )}
        {activeTab === Tab.ADMIN && (
            <Admin results={results} onBack={goHome} />
        )}
        {activeTab === Tab.GLOBO && (
            <GlobeSim onBack={goHome} onSave={handleSaveGame} />
        )}
        {activeTab === Tab.LOADER && (
            <FileLoader onBack={goHome} setResults={setResults} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-white/20 shadow-2xl z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
           <button 
              onClick={() => setActiveTab(Tab.HOME)} 
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === Tab.HOME ? 'text-purple-600' : 'text-gray-400 hover:text-purple-400'}`}
           >
              <HomeIcon className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">INÍCIO</span>
           </button>
           
           <button 
              onClick={() => setActiveTab(Tab.GENERATOR)} 
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === Tab.GENERATOR ? 'text-purple-600' : 'text-gray-400 hover:text-purple-400'}`}
           >
              <Zap className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">GERAR</span>
           </button>

           <div className="relative -top-6">
              <button 
                  onClick={() => setActiveTab(Tab.LOADER)}
                  className="w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-green-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/50 border-4 border-gray-100 transform transition-transform active:scale-95"
                  title="Ler Arquivo"
              >
                  <FileSearch className="w-7 h-7" />
              </button>
           </div>

           <button 
              onClick={() => setActiveTab(Tab.SAVED)} 
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === Tab.SAVED ? 'text-purple-600' : 'text-gray-400 hover:text-purple-400'}`}
           >
              <FolderHeart className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">JOGOS</span>
           </button>

           <button 
              onClick={() => setActiveTab(Tab.RESULTS)} 
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === Tab.RESULTS ? 'text-purple-600' : 'text-gray-400 hover:text-purple-400'}`}
           >
              <Settings className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">DADOS</span>
           </button>
        </div>
      </nav>
      
      {/* Safe area spacer for bottom nav */}
      <div className="h-16 w-full"></div>
    </div>
  );
};

export default App;
