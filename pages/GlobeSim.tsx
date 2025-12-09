
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Save, Timer, Zap, Settings, XCircle, Settings2, Hand, Volume2, VolumeX } from 'lucide-react';
import { SavedGame } from '../types';
import { getBallColorClass, generateUUID } from '../utils/lotteryUtils';

interface GlobeSimProps {
  onBack: () => void;
  onSave: (game: SavedGame) => void;
}

// Helper to convert seconds to MM:SS
const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Helper to convert MM:SS string to seconds
const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
};

export const GlobeSim: React.FC<GlobeSimProps> = ({ onBack, onSave }) => {
  // Config State
  const [excludedNumbers, setExcludedNumbers] = useState<number[]>([]);
  
  // Timer Modes: Interval, Timeline (Sequence), Manual
  const [timerMode, setTimerMode] = useState<'interval' | 'timeline' | 'manual'>('timeline');
  const [intervalTime, setIntervalTime] = useState<number>(2.0); 
  
  // Speed Control (Automated now)
  const [spinSpeed, setSpinSpeed] = useState<number>(10); 

  // Audio State
  const [isMuted, setIsMuted] = useState(false);

  // Custom Timeline State
  const [customTimings, setCustomTimings] = useState<string[]>([
      "00:08", "00:20", "00:29", "00:37", "00:46", 
      "00:55", "01:03", "01:13", "01:22", "01:32", 
      "01:43", "01:52", "02:01", "02:10", "02:20"
  ]);

  // Simulation State
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentBall, setCurrentBall] = useState<number | null>(null);
  const [saveName, setSaveName] = useState("");
  
  // Timer Execution State
  const [elapsedTime, setElapsedTime] = useState<number>(0); 
  const [countdown, setCountdown] = useState<number>(0); 
  const timerRef = useRef<number | null>(null);

  // --- REFS FOR ACCURATE TIMING (Fixes delay issue) ---
  // We use timestamps (Date.now()) instead of accumulation to prevent drift
  const sessionStartTimestamp = useRef<number>(0);
  const lastActionTimestamp = useRef<number>(0);

  // FIX: Lock to prevent double drawing (16 balls bug)
  const drawingLockRef = useRef(false);

  // --- System Clock State (Requested by User) ---
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Unlock drawing when numbers change
  useEffect(() => {
      drawingLockRef.current = false;
  }, [drawnNumbers.length]);

  // --- AUDIO NARRATOR LOGIC (UPDATED: FASTER SPEECH) ---
  const speak = (text: string, priority = false, options: { rate?: number, pitch?: number } = {}) => {
      if (isMuted || !window.speechSynthesis) return;
      
      if (priority) {
          window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      // Default Rate/Pitch or Custom - Increased base speed
      utterance.rate = options.rate || 1.4; 
      utterance.pitch = options.pitch || 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const brVoice = voices.find(v => v.lang.includes('pt-BR'));
      if (brVoice) utterance.voice = brVoice;

      window.speechSynthesis.speak(utterance);
  };

  // Pre-load voices
  useEffect(() => {
      if (window.speechSynthesis) {
          window.speechSynthesis.getVoices();
      }
  }, []);

  // --- AUDIO EFFECTS FOR BALLS ---
  useEffect(() => {
      if (drawnNumbers.length === 0) return;

      const lastNum = drawnNumbers[drawnNumbers.length - 1];
      const count = drawnNumbers.length;
      
      let commentary = "";

      // Scripted Moments
      if (count === 2) {
          commentary = "E aí, tá marcando? O globo segue girando.";
      } else if (count === 4) {
          commentary = "Calma, você ainda tem chance. Acertando de 11 a 15 números você ganha prêmio.";
      } else if (count === 5) {
          commentary = "Faltam 10 bolas.";
      } else if (count === 7) {
          commentary = "O globo girando, você chamando a sorte, chegando.";
      } else if (count === 8) {
          commentary = "Lotofácil, sorteios de segunda a sábado.";
      } else if (count === 9) {
          commentary = "Este prêmio pode sair para você, boa sorte.";
      } else if (count === 15) {
          // Usando count 15 (última bola) para fazer sentido "Agora o 15 e último"
          commentary = "Agora o décimo quinto e último número da Lotofácil, vem sorte.";
      }

      // Função auxiliar para disparar o áudio com DOIS NARRADORES (Velocidade Aumentada)
      const triggerAudio = () => {
          if (commentary) {
              // 1. APRESENTADOR (Voz muito rápida/aguda)
              speak(commentary, true, { rate: 1.5, pitch: 1.1 });
              
              // 2. LOCUTOR (Voz firme, um pouco mais rápida que antes)
              speak(`Bola ${lastNum}.`, false, { rate: 1.2, pitch: 0.9 });
          } else {
              // Somente LOCUTOR
              speak(`Bola ${lastNum}.`, true, { rate: 1.2, pitch: 0.9 });
          }

          // RESUMO FINAL (Após a 15ª bola ser anunciada)
          if (count === 15) {
              const summaryIntro = "Dezenas sorteadas da Lotofácil foram: ";
              speak(summaryIntro, false, { rate: 1.3, pitch: 1.0 });
              
              // Narrar números em ordem de sorteio
              const numbersText = drawnNumbers.map(n => n < 10 ? `zero ${n}` : `${n}`).join(", ");
              speak(numbersText, false, { rate: 1.15, pitch: 1.0 });
          }
      };

      if (count === 1) {
          // Delay de 10s após a bola cair aos 8s = 18s Total do cronômetro
          setTimeout(() => {
              triggerAudio();
          }, 10000);
      } else {
          // Para as outras bolas, fala imediatamente
          triggerAudio();
      }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawnNumbers]);


  const availableNumbers = Array.from({ length: 25 }, (_, i) => i + 1)
    .filter(n => !excludedNumbers.includes(n) && !drawnNumbers.includes(n));

  const toggleExcluded = (num: number) => {
    if (drawnNumbers.length > 0 && isSpinning) return; 
    if (excludedNumbers.includes(num)) {
      setExcludedNumbers(prev => prev.filter(n => n !== num));
    } else {
      if (excludedNumbers.length < 24) { 
         setExcludedNumbers(prev => [...prev, num]);
      }
    }
  };

  const handleTimingChange = (index: number, newValue: string) => {
      const updated = [...customTimings];
      updated[index] = newValue;
      setCustomTimings(updated);
  };

  const drawOneBall = () => {
    // FIX: Check lock and limits to prevent 16th ball
    if (drawingLockRef.current) return;
    if (availableNumbers.length === 0 || drawnNumbers.length >= 15) {
      stopAuto();
      setIsSpinning(false);
      return;
    }

    drawingLockRef.current = true; // Lock

    // LÓGICA DE SORTEIO REALISTA (CRYPTO RANDOM)
    const mixedBowl = [...availableNumbers];
    
    // Algoritmo de Mistura (Fisher-Yates) com Crypto
    for (let i = mixedBowl.length - 1; i > 0; i--) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const j = randomBuffer[0] % (i + 1);
        [mixedBowl[i], mixedBowl[j]] = [mixedBowl[j], mixedBowl[i]];
    }

    const selected = mixedBowl[0];

    setCurrentBall(selected);
    
    // FIX: Safe state update to strictly prevent list growth beyond 15
    setDrawnNumbers(prev => {
        if (prev.length >= 15) return prev;
        return [...prev, selected];
    });
    
    if (isAuto && timerMode === 'interval') {
        lastActionTimestamp.current = Date.now();
        setCountdown(intervalTime);
    }
  };

  // --- MASTER TIMER EFFECT ---
  useEffect(() => {
    if (isAuto && isSpinning && drawnNumbers.length < 15) {
       const now = Date.now();
       if (!timerRef.current) {
           sessionStartTimestamp.current = now - (elapsedTime * 1000);
           const remainingTime = countdown > 0 ? countdown : intervalTime;
           lastActionTimestamp.current = now - ((intervalTime - remainingTime) * 1000);
       }

       timerRef.current = window.setInterval(() => {
          const currentNow = Date.now();
          const exactElapsed = (currentNow - sessionStartTimestamp.current) / 1000;
          setElapsedTime(exactElapsed);

          // AUTOMATIC SPEED LOGIC
          let targetSpeed = 10; 
          if (timerMode === 'timeline') {
              const isInSlowWindow = customTimings.some((timeStr, idx) => {
                  if (idx > drawnNumbers.length + 1) return false;
                  const targetSec = parseTime(timeStr);
                  const startSlow = targetSec - 1;
                  const endSlow = startSlow + 5;
                  return exactElapsed >= startSlow && exactElapsed < endSlow;
              });
              if (isInSlowWindow) targetSpeed = 1;
          } 
          setSpinSpeed(targetSpeed);

          // Handle Draw Logic
          if (timerMode === 'interval') {
              const timeSinceLastAction = (currentNow - lastActionTimestamp.current) / 1000;
              const remaining = Math.max(0, intervalTime - timeSinceLastAction);
              setCountdown(remaining);
              if (remaining <= 0) drawOneBall();
          } else if (timerMode === 'timeline') {
              const nextBallIndex = drawnNumbers.length; 
              if (nextBallIndex < 15) {
                  const targetTimeStr = customTimings[nextBallIndex];
                  const targetSeconds = parseTime(targetTimeStr);
                  if (exactElapsed >= targetSeconds) drawOneBall();
              }
          }
       }, 50); 
    } else {
       if (timerRef.current) {
           clearInterval(timerRef.current);
           timerRef.current = null;
       }
    }
    return () => { 
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuto, isSpinning, drawnNumbers, intervalTime, timerMode, customTimings]);

  const startAuto = () => {
    if (drawnNumbers.length >= 15) return;
    
    // NARRATIVA DE INÍCIO (Velocidade Aumentada)
    if (drawnNumbers.length === 0) {
        // Voz do Apresentador (Rápida e Aguda)
        speak("Vai começar, boa sorte! Bolas posicionadas. Valendo! Globo carregado, embaralhando 25 bolas de 01 a 25. Começando o sorteio da Lotofácil.", true, { rate: 1.5, pitch: 1.1 });
    }

    setIsSpinning(true);
    setIsAuto(true);
    setSpinSpeed(10); 
  };

  const stopAuto = () => {
    setIsAuto(false);
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
    // Cancel audio if stopped abruptly
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const resetAll = () => {
    stopAuto();
    setIsSpinning(false);
    setDrawnNumbers([]);
    setCurrentBall(null);
    setCountdown(0);
    setElapsedTime(0);
    setSaveName("");
    setCurrentBall(null);
    setSpinSpeed(10);
    sessionStartTimestamp.current = 0;
    lastActionTimestamp.current = 0;
    drawingLockRef.current = false;
  };

  const handleSaveResult = () => {
      if (drawnNumbers.length < 15) {
          alert("Aguarde o sorteio de 15 dezenas para salvar.");
          return;
      }
      
      const newGame: SavedGame = {
          id: generateUUID(),
          numbers: [...drawnNumbers].sort((a,b) => a - b),
          date: new Date().toISOString(),
          type: 'generated', 
          name: saveName
      };

      onSave(newGame);
      stopAuto(); 
      setIsSpinning(false);
      
      alert("Jogo salvo com sucesso na aba JOGOS DA IA / AUTOMÁTICOS!");
      setSaveName("");
  };

  const getBallStyle = (num: number) => {
     let baseColor = '#9ca3af'; 
     if (num >= 1 && num <= 5) baseColor = '#9333ea'; 
     if (num >= 6 && num <= 10) baseColor = '#2563eb'; 
     if (num >= 11 && num <= 15) baseColor = '#16a34a'; 
     if (num >= 16 && num <= 20) baseColor = '#f97316'; 
     if (num >= 21 && num <= 25) baseColor = '#dc2626'; 

     return {
         background: `radial-gradient(circle at 32% 32%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 10%, ${baseColor} 45%, #000 95%)`,
         boxShadow: `
            inset -4px -4px 10px rgba(0,0,0,0.6), 
            inset 2px 2px 5px rgba(255,255,255,0.5), 
            2px 2px 5px rgba(0,0,0,0.5)
         `,
         border: '1px solid rgba(0,0,0,0.1)',
         textShadow: '0px 1px 1px rgba(0,0,0,0.4)' 
     };
  };

  const paddleDuration = Math.max(0.1, 2.5 - (spinSpeed * 0.22)) + 's';
  const ballDurationBase = Math.max(0.2, (10.5 - spinSpeed) / 4);
  const isIdle = !isSpinning && drawnNumbers.length === 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#003399] to-[#002266] overflow-y-auto flex flex-col items-center font-sans text-white z-50 custom-scrollbar">
      
      {/* Background Noise & Studio Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-black/60 pointer-events-none z-0"></div>

      {/* Header - Caixa Style */}
      <div className="w-full p-4 flex justify-between items-center z-20 shrink-0 border-b border-white/10 bg-[#003399]/90 backdrop-blur-md shadow-md">
          <button onClick={onBack} className="flex items-center gap-2 text-white hover:text-orange-400 transition-colors font-bold uppercase tracking-widest text-xs">
              <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          
          <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#f97316]"></div>
              <h1 className="text-xl font-black tracking-tighter text-white italic drop-shadow-md">
                  LOTOFÁCIL <span className="text-orange-500">AO VIVO</span>
              </h1>
          </div>

          <div className="w-10">
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-white/70 hover:text-white transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-green-400" />}
              </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl flex flex-col items-center p-4 gap-8 z-10 relative pb-40">
          
          {/* Result Tube (Tray Style) */}
          <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-2 relative overflow-hidden min-h-[90px] flex items-center">
               <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
               
               {drawnNumbers.length === 0 && (
                   <p className="w-full text-center text-white/50 font-bold text-sm tracking-widest uppercase">Aguardando Sorteio...</p>
               )}

               <div className="flex gap-3 px-6 w-full overflow-x-auto custom-scrollbar pb-2 items-center justify-center">
                   {drawnNumbers.map((num, idx) => (
                       <div key={`${num}-${idx}`} className="shrink-0 animate-fade-in-right relative group">
                           <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-lg relative z-10" style={getBallStyle(num)}>
                               {num}
                           </div>
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/40 blur-sm rounded-full"></div>
                       </div>
                   ))}
               </div>
               
               <div className="absolute top-2 right-4 bg-orange-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                   {drawnNumbers.length}/15
               </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 w-full items-center lg:items-start">
              
              {/* LEFT: THE MACHINE (CAIXA STYLE GLOBE) */}
              <div className="flex flex-col items-center w-full lg:w-1/2">
                  <div className="relative w-[340px] h-[480px] sm:w-[400px] sm:h-[540px] flex flex-col items-center justify-end">
                       
                       {/* THE ACRYLIC SPHERE */}
                       <div className="absolute top-[80px] w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full z-20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[6px] border-gray-300 bg-blue-500/5 backdrop-blur-[1px]">
                           
                           {/* Reflections & Glass Effects */}
                           <div className="absolute inset-0 rounded-full border-[2px] border-white/30 pointer-events-none z-50"></div>
                           <div className="absolute top-[5%] left-[15%] w-[40%] h-[25%] bg-gradient-to-b from-white/60 to-transparent rounded-full -rotate-45 blur-[3px] z-50 pointer-events-none"></div>
                           <div className="absolute bottom-[10%] right-[15%] w-[15%] h-[10%] bg-white/30 rounded-full blur-[5px] z-50 pointer-events-none"></div>
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,50,0.2)_100%)] z-0 pointer-events-none"></div>

                           {/* VISUAL CAÇAPA (EXIT TUBE) - NEW */}
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-20 bg-gradient-to-t from-white/30 to-transparent border-x border-white/20 z-10 rounded-t-lg pointer-events-none blur-[1px]"></div>
                           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-black/20 rounded-full blur-md z-10"></div>

                           {/* MECHANISM */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full h-full pointer-events-none">
                                
                                {/* 3-BLADE PROPELLER (Metallic/Silver) */}
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[96%] h-[96%] z-20 ${isSpinning ? 'animate-spin-counter' : 'rotate-12'}`}
                                     style={{ animationDuration: paddleDuration }}>
                                     
                                     {/* Center Hub (Chrome) */}
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.4)] border-2 border-gray-400 z-30 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-gray-600 rounded-full shadow-inner border border-gray-500"></div>
                                     </div>
                                     
                                     {/* Blade 1 (Silver) */}
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 rounded-t-full shadow-[0_0_5px_rgba(0,0,0,0.3)] border-x border-t border-white/50 origin-bottom"></div>

                                     {/* Blade 2 */}
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 rounded-t-full shadow-[0_0_5px_rgba(0,0,0,0.3)] border-x border-t border-white/50 origin-bottom" style={{ transform: 'translateX(-50%) rotate(120deg)' }}></div>

                                     {/* Blade 3 */}
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 rounded-t-full shadow-[0_0_5px_rgba(0,0,0,0.3)] border-x border-t border-white/50 origin-bottom" style={{ transform: 'translateX(-50%) rotate(240deg)' }}></div>
                                </div>
                           </div>

                           {/* BALLS */}
                           <div className="absolute inset-0 z-10">
                               {availableNumbers.map((n, i) => {
                                   const renderThisBall = i % 2 === 0 || spinSpeed < 5; 
                                   if (!renderThisBall && isSpinning) return null;

                                   const isSlowMode = spinSpeed <= 1;

                                   const col = i % 5; 
                                   const row = Math.floor(i / 5);
                                   
                                   // IDLE POSITION (Stack)
                                   const stackX = 35 + (col * 7) + (Math.random() * 5); 
                                   const stackY = 82 - (row * 5); 

                                   // SLOW/DRAW POSITION (Cluster at bottom)
                                   const clusterX = 42 + (Math.random() * 16); // Centered 42-58%
                                   const clusterY = 85 + (Math.random() * 10); // Bottom 85-95%

                                   // SPINNING POSITION (Chaotic)
                                   const angle = 45 + (i % 10) * 9 + (Math.random() * 10); 
                                   const tumbleX = 50 + (Math.cos(angle * Math.PI / 180) * 35); 
                                   const tumbleY = 60 + (Math.sin(angle * Math.PI / 180) * 35); 
                                   
                                   const animType = i % 4; 
                                   const delay = Math.random() * -2; 
                                   // Variable Duration for WAVE effect to create chaos
                                   const waveDuration = 1.2 + Math.random(); 

                                   // Determine Final Position Logic
                                   let finalLeft, finalTop, finalAnim;

                                   if (isIdle) {
                                       finalLeft = `${stackX}%`;
                                       finalTop = `${stackY}%`;
                                       finalAnim = 'transition-all duration-1000';
                                   } else if (isSlowMode) {
                                       // GRAVITY EFFECT: Group at bottom with WAVE motion
                                       finalLeft = `${clusterX}%`;
                                       finalTop = `${clusterY}%`;
                                       finalAnim = 'animate-wave'; // Updated to wave
                                   } else {
                                       // HIGH SPEED
                                       finalLeft = isSpinning ? 'calc(50% - 16px)' : `${tumbleX}%`;
                                       finalTop = isSpinning ? 'calc(90% - 16px)' : `${tumbleY}%`;
                                       finalAnim = isSpinning ? `animate-tumble-${animType}` : '';
                                   }

                                   return (
                                       <div 
                                         key={n}
                                         className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${finalAnim}`}
                                         style={{ 
                                             ...getBallStyle(n),
                                             left: finalLeft,
                                             top: finalTop, 
                                             opacity: isIdle ? 0.95 : 1,
                                             scale: isIdle ? 0.9 : 1,
                                             zIndex: isIdle ? 35 : (isSlowMode ? 40 : 10),
                                             animationDuration: isSlowMode ? `${waveDuration}s` : `${isIdle ? 1 : ballDurationBase}s`,
                                             animationDelay: `${delay}s`
                                         }}
                                       >
                                           {n}
                                       </div>
                                   )
                               })}
                           </div>
                       </div>

                       {/* THE BASE (CAIXA BLUE/ORANGE) */}
                       <div className="w-[240px] h-[140px] bg-gradient-to-b from-[#0044cc] to-[#002266] rounded-t-[10px] rounded-b-[30px] relative z-10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border-t-[8px] border-gray-300 flex flex-col items-center justify-start pt-6">
                           
                           {/* Orange Stripe */}
                           <div className="absolute top-4 left-0 w-full h-8 bg-orange-500 shadow-md flex items-center justify-center overflow-hidden">
                                <div className="w-full h-1 bg-white/20 absolute top-0"></div>
                                <div className="text-white font-black italic tracking-widest text-sm drop-shadow-sm">Loterias CAIXA</div>
                           </div>

                           {/* Exit Chute (Acrylic) */}
                           <div className="absolute top-[-30px] w-12 h-20 bg-white/20 border-x border-white/40 backdrop-blur-sm z-0 rounded-b-lg"></div>

                           <div className="mt-10 w-32 h-2 bg-black/30 rounded-full mb-2"></div>
                           
                           {/* Floor Reflection */}
                           <div className="absolute bottom-[-20px] w-[90%] h-[20px] bg-black/40 blur-xl rounded-[100%] z-[-1]"></div>
                       </div>

                       {/* SELECTED BALL DISPLAY (Floating) */}
                       {currentBall && (
                           <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 z-50 animate-drop-out drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                               <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white border-[6px] border-white relative shadow-xl" style={getBallStyle(currentBall)}>
                                   {currentBall}
                                   <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/60 pointer-events-none"></div>
                               </div>
                           </div>
                       )}

                  </div>
              </div>

              {/* RIGHT: DASHBOARD */}
              <div className="w-full lg:w-1/2 space-y-6">
                  
                  {/* CONTROL PANEL */}
                  <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                          <Settings2 className="w-24 h-24 text-white -rotate-12" />
                      </div>

                      {/* Timer Display - MODIFIED LOCATION */}
                      <div className="flex flex-col sm:flex-row justify-between items-end mb-6 border-b border-white/10 pb-4 gap-4">
                          <div className="flex items-center gap-4 sm:gap-6">
                              <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 font-bold">CRONÔMETRO</p>
                                  <div className="font-mono text-3xl text-orange-400 font-black flex items-center gap-2 drop-shadow-md">
                                      <Timer className="w-6 h-6" /> {formatTime(elapsedTime)}
                                  </div>
                              </div>
                              
                              <div className="h-8 w-px bg-white/20 hidden sm:block"></div>

                              <div>
                                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 font-bold">DATA E HORA</p>
                                  <div className="font-mono text-2xl text-white font-bold leading-none flex items-center h-9 drop-shadow-md gap-2">
                                      <span className="text-sm text-gray-400 font-bold">
                                        {systemTime.toLocaleDateString('pt-BR')}
                                      </span>
                                      {systemTime.toLocaleTimeString('pt-BR')}
                                  </div>
                              </div>
                          </div>

                          <div className="text-right w-full sm:w-auto">
                              <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-1 font-bold">STATUS</p>
                              <div className={`font-black text-xl tracking-wider ${isAuto ? 'text-green-400 animate-pulse' : 'text-gray-400'}`}>
                                  {isAuto ? (timerMode === 'interval' ? `PRÓXIMA: ${countdown.toFixed(1)}s` : (timerMode === 'manual' ? 'AGUARDANDO' : 'SORTEANDO...')) : 'PARADO'}
                              </div>
                          </div>
                      </div>

                      {/* Main Actions */}
                      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                          <button 
                            onClick={isAuto ? stopAuto : startAuto}
                            disabled={drawnNumbers.length >= 15}
                            className={`py-6 rounded-lg font-black text-lg shadow-lg flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border-b-4 uppercase tracking-widest
                                ${isAuto 
                                    ? 'bg-yellow-500 text-yellow-900 border-yellow-700 hover:bg-yellow-400' 
                                    : 'bg-green-600 text-white border-green-800 hover:bg-green-500 disabled:bg-gray-600 disabled:border-gray-700 disabled:opacity-50'
                                }`}
                          >
                              {isAuto ? <Pause className="fill-current w-6 h-6 mx-auto" /> : <Play className="fill-current w-6 h-6 mx-auto" />}
                              {isAuto ? 'PAUSAR' : 'INICIAR'}
                          </button>

                          <button onClick={resetAll} className="bg-blue-800 text-white border-b-4 border-blue-950 hover:bg-blue-700 rounded-lg flex flex-col items-center justify-center gap-1 active:scale-95 shadow-md">
                              <RotateCcw className="w-6 h-6" />
                              <span className="text-xs font-bold tracking-widest">REINICIAR</span>
                          </button>
                      </div>

                      {/* Manual Trigger Button */}
                      {isAuto && timerMode === 'manual' && (
                          <button 
                             onClick={drawOneBall}
                             disabled={drawnNumbers.length >= 15}
                             className="w-full mb-6 py-4 bg-orange-500 hover:bg-orange-600 border-b-4 border-orange-700 text-white font-black text-xl rounded-lg shadow-lg flex items-center justify-center gap-3 animate-pulse active:scale-95"
                          >
                              <Hand className="w-8 h-8" /> SORTEAR AGORA
                          </button>
                      )}

                      {/* Speed Display (Automated) */}
                      <div className="bg-black/20 rounded-lg p-4 relative z-10 border border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">ROTAÇÃO MOTOR</span>
                                <span className={`text-xs font-bold ${spinSpeed > 5 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {spinSpeed > 5 ? 'MODO TURBO (MISTURA)' : 'MODO LENTO (SORTEIO)'}
                                </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Zap className={`w-5 h-5 ${spinSpeed > 5 ? 'text-green-400 animate-pulse' : 'text-yellow-400'}`}/> 
                             <span className="font-mono font-black text-xl text-white">{spinSpeed}x</span>
                          </div>
                      </div>

                      {/* Save Panel */}
                      {drawnNumbers.length >= 15 && (
                          <div className="mt-4 flex gap-2 animate-in slide-in-from-bottom">
                              <input 
                                 value={saveName}
                                 onChange={(e) => setSaveName(e.target.value)}
                                 placeholder="Nome do Jogo..."
                                 className="flex-1 bg-white/20 border border-white/30 rounded-lg px-3 text-white placeholder-white/70 outline-none font-mono text-sm font-bold"
                              />
                              <button onClick={handleSaveResult} className="bg-green-600 px-6 py-2 rounded-lg text-white font-bold hover:bg-green-700 flex items-center gap-2 uppercase tracking-wider text-sm shadow-lg">
                                  <Save className="w-4 h-4" /> SALVAR
                              </button>
                          </div>
                      )}
                  </div>

                  {/* CONFIGURATION PANELS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Exclusions */}
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                  <XCircle className="w-4 h-4 text-red-400"/> EXCLUÍDOS
                              </span>
                              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold shadow-sm">{excludedNumbers.length}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                              {Array.from({length: 25}, (_, i) => i + 1).map(num => {
                                   const isExcluded = excludedNumbers.includes(num);
                                   return (
                                       <button 
                                          key={num}
                                          onClick={() => toggleExcluded(num)}
                                          disabled={drawnNumbers.length > 0}
                                          className={`h-8 rounded text-xs font-bold transition-all border ${isExcluded ? 'bg-red-600 border-red-800 text-white shadow-inner scale-95' : 'bg-white/10 border-white/20 text-gray-200 hover:bg-white/30'}`}
                                       >
                                           {num}
                                       </button>
                                   )
                              })}
                          </div>
                      </div>

                      {/* Timeline */}
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg">
                           <div className="flex justify-between items-center mb-3">
                               <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                   <Settings className="w-4 h-4 text-orange-400"/> MODO TEMPO
                               </span>
                               <div className="flex bg-black/30 rounded p-0.5 border border-white/10">
                                   <button onClick={() => setTimerMode('interval')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${timerMode === 'interval' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400'}`}>INT</button>
                                   <button onClick={() => setTimerMode('timeline')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${timerMode === 'timeline' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400'}`}>SEQ</button>
                                   <button onClick={() => setTimerMode('manual')} className={`px-2 py-0.5 text-[10px] font-bold rounded ${timerMode === 'manual' ? 'bg-yellow-500 text-black shadow-sm' : 'text-gray-400'}`}>MAN</button>
                               </div>
                           </div>
                           
                           {timerMode === 'interval' ? (
                              <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/10">
                                  <input 
                                     type="number" 
                                     value={intervalTime} 
                                     onChange={(e) => setIntervalTime(parseFloat(e.target.value))} 
                                     className="w-full bg-transparent text-white font-mono font-bold text-center outline-none" 
                                  />
                                  <span className="text-[10px] text-gray-400 font-bold">SEG</span>
                              </div>
                           ) : timerMode === 'timeline' ? (
                              <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                  {customTimings.map((t, i) => (
                                      <div key={i} className="bg-black/20 px-1 py-1 rounded border border-white/10 text-center">
                                          <span className="text-[8px] text-gray-400 block">#{i+1}</span>
                                          <input 
                                            value={t} 
                                            onChange={(e) => handleTimingChange(i, e.target.value)}
                                            className="w-full bg-transparent text-center text-[10px] text-orange-300 font-mono font-bold outline-none p-0"
                                          />
                                      </div>
                                  ))}
                              </div>
                           ) : (
                               <div className="flex items-center justify-center h-[100px] text-center text-xs text-gray-300 p-2 italic bg-black/10 rounded">
                                   Aguarde o comando manual para liberar cada bola.
                               </div>
                           )}
                      </div>

                  </div>
              </div>
          </div>
      </div>

      <style>{`
        /* Mechanical Mixer Spin - Clockwise */
        @keyframes spin-clockwise {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-clockwise {
            animation: spin-clockwise linear infinite;
        }

        /* Mechanical Mixer Spin - Counter-Clockwise */
        @keyframes spin-counter {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        .animate-spin-counter {
            animation: spin-counter linear infinite;
        }

        /* FULL GLOBE PHYSICS */
        
        @keyframes tumble-0 {
            0% { transform: translate(0, 0) rotate(0deg); }
            10% { transform: translate(40px, -350px) rotate(120deg); } /* Top Right */
            25% { transform: translate(0px, -150px) rotate(180deg); } /* CENTER PASS */
            40% { transform: translate(-80px, -280px) rotate(240deg); } /* Mid Left */
            55% { transform: translate(0px, 0px) rotate(300deg); } /* CENTER HIT */
            70% { transform: translate(60px, -80px) rotate(360deg); } /* Bottom Right */
            100% { transform: translate(0, 0) rotate(720deg); }
        }
        .animate-tumble-0 { animation: tumble-0 linear infinite; }

        @keyframes tumble-1 {
            0% { transform: translate(0, 0) rotate(0deg); }
            15% { transform: translate(-90px, -300px) rotate(-90deg); } /* Top Left */
            30% { transform: translate(0px, -100px) rotate(-180deg); } /* CENTER PASS */
            50% { transform: translate(80px, -250px) rotate(-270deg); } /* Mid Right */
            70% { transform: translate(0px, -50px) rotate(-300deg); } /* CENTER HIT */
            85% { transform: translate(-50px, -150px) rotate(-330deg); } 
            100% { transform: translate(0, 0) rotate(-360deg); }
        }
        .animate-tumble-1 { animation: tumble-1 linear infinite; }

        @keyframes tumble-2 {
            0% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(0px, -380px) rotate(180deg); } /* Top Center */
            35% { transform: translate(80px, -200px) rotate(270deg); }
            50% { transform: translate(-20px, -20px) rotate(360deg); } /* CENTER HIT */
            70% { transform: translate(-90px, -300px) rotate(450deg); }
            100% { transform: translate(0, 0) rotate(720deg); }
        }
        .animate-tumble-2 { animation: tumble-2 linear infinite; }

        @keyframes tumble-3 {
            0% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(-70px, -320px) rotate(-45deg); }
            40% { transform: translate(20px, -20px) rotate(-90deg); } /* CENTER HIT */
            60% { transform: translate(90px, -360px) rotate(-180deg); } 
            80% { transform: translate(-40px, -120px) rotate(-220deg); }
            100% { transform: translate(0, 0) rotate(-360deg); }
        }
        .animate-tumble-3 { animation: tumble-3 linear infinite; }

        /* WAVE EFFECT FOR SLOW MODE (Pegando Onda) */
        @keyframes wave-motion {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-4px, -8px) rotate(-10deg); } /* Up/Left */
            50% { transform: translate(0px, -2px) rotate(0deg); } /* Down a bit */
            75% { transform: translate(4px, -12px) rotate(10deg); } /* Up/Right */
        }
        .animate-wave {
            animation: wave-motion ease-in-out infinite;
        }

        /* EXIT ANIMATION (Drop Out Bottom) */
        @keyframes drop-out {
             0% { transform: translate(-50%, -120px) scale(0.5); opacity: 0; }
             20% { transform: translate(-50%, -80px) scale(0.8); opacity: 1; }
             100% { transform: translate(-50%, 0px) scale(1); opacity: 1; }
        }
        .animate-drop-out {
            animation: drop-out 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes fade-in-right {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
            animation: fade-in-right 0.3s ease-out forwards;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 3px; }
      `}</style>
    </div>
  );
};
