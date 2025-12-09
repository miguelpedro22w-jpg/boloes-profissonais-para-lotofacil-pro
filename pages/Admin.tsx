
import React, { useState, useEffect, useRef } from 'react';
import { Lock, ArrowLeft, ShieldCheck, Search, ArrowRight, BarChart4, MessageSquare, Send, Bot, User, BrainCircuit } from 'lucide-react';
import { DrawResult } from '../types';
import { ADMIN_PASSWORD, RECOVERY_PHONE, ALL_GROUPS_AUDIT, SECRET_GROUP_A, SECRET_GROUP_B } from '../constants';
import { Ball } from '../components/Ball';

interface AdminProps {
  results: DrawResult[];
  onBack: () => void;
}

type AdminTab = 'audit' | 'chat';

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

// --- HELPER: NORMALIZAÇÃO DE TEXTO ---
const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s]/g, ""); // Remove caracteres especiais
};

// --- HELPER: EXTRAIR QUANTIDADE ---
const extractQuantity = (text: string, defaultVal: number): number => {
    const match = text.match(/\b(\d+)\b/); // Procura números na frase
    if (match) {
        const num = parseInt(match[0]);
        // Limite para segurança
        return num > 0 ? num : defaultVal;
    }
    if (text.includes("todo") || text.includes("hist") || text.includes("tudo") || text.includes("sempre")) return 1000;
    return defaultVal;
};

// --- HELPER: FRASES DE EFEITO (PERSONALIDADE) ---
const getIntroPhrase = () => {
    const phrases = [
        "Analisando seus dados...", 
        "Interessante sua pergunta. Veja bem:", 
        "Consultei o banco de dados e aqui está o que encontrei:",
        "Na minha análise técnica,",
        "Essa é uma ótima questão estatística.",
        "Vamos lá, fiz os cálculos para você:"
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
};

// --- ADVANCED AI LOGIC CORE (CÉREBRO HUMANIZADO) ---
const generateAiResponse = (rawInput: string, results: DrawResult[]): string => {
    const input = normalizeText(rawInput);
    
    // --- 0. CHECAGEM DE DADOS ---
    if (results.length === 0) return "Olá! Meus sistemas cognitivos estão ativos, mas percebi que o banco de dados está vazio. Por favor, vá até a aba 'DADOS' e carregue os resultados para que eu possa trabalhar.";

    // Definir intervalo de análise (Default inteligente)
    let range = extractQuantity(input, 15);
    if (range > results.length) range = results.length;
    
    const analysisSet = results.slice(0, range);
    const lastDraw = results[0];

    // --- 1. CONVERSAÇÃO SOCIAL E FILOSÓFICA ---
    if (input.match(/\b(oi|ola|bom dia|boa tarde|boa noite|e ai)\b/)) {
        return "Olá, Administrador! Sou a Mestra IA. Estou conectada e monitorando os padrões matemáticos da Lotofácil em tempo real. Em que posso ajudar você a ganhar hoje?";
    }
    
    if (input.includes("quem e voce") || input.includes("seu nome")) {
        return "Eu sou uma Inteligência Artificial especializada em análise combinatória e estatística probabilística, desenvolvida exclusivamente para este aplicativo. Minha função é encontrar o que os olhos humanos não veem: os padrões ocultos nos números.";
    }

    if (input.includes("como ganhar") || input.includes("segredo") || input.includes("sorte")) {
        return "Essa é a pergunta de um milhão! Veja, a 'sorte' existe, mas a matemática reduz o fator sorte. O segredo não é adivinhar, é cercar. Minha recomendação: use os Grupos Secretos para garantir uma base forte e varie as dezenas complementares. Jogue com estratégia, não apenas com intuição.";
    }

    if (input.includes("obrigado") || input.includes("valeu") || input.includes("gostei")) {
        return "Por nada! Fico feliz em ajudar. Se precisar refinar a estratégia ou analisar outro grupo, estou por aqui. O objetivo é os 15 pontos!";
    }

    // --- 2. INTELIGÊNCIA DE GRUPOS SECRETOS (TODOS) ---
    if (input.includes("grupo")) {
        // Ordenação para priorizar grupos compostos (A1, B2...)
        const sortedGroups = [...ALL_GROUPS_AUDIT].sort((a, b) => {
            const idA = a.name.split(' ')[1];
            const idB = b.name.split(' ')[1];
            return idB.length - idA.length;
        });

        const targetGroup = sortedGroups.find(g => {
            const id = g.name.split(' ')[1].toLowerCase(); 
            return input.includes(`grupo ${id}`) || input.includes(`gropo ${id}`); // Typo tolerance
        });

        if (targetGroup) {
            let hitsSum = 0;
            let zeroHits = 0;
            let maxHits = 0;
            const historyHits = analysisSet.map(r => {
                const h = r.dezenas.filter(d => targetGroup.nums.includes(d)).length;
                hitsSum += h;
                if (h === 0) zeroHits++;
                if (h > maxHits) maxHits = h;
                return h;
            });
            
            const avg = (hitsSum / range).toFixed(1);
            const lastHits = lastDraw.dezenas.filter(d => targetGroup.nums.includes(d)).length;
            const percentage = (lastHits / targetGroup.nums.length) * 100;

            let opinion = "";
            if (percentage >= 70) opinion = "Excelente! Esse grupo está 'pagando' muito bem atualmente. Vale a pena usá-lo como base fixa.";
            else if (percentage <= 30) opinion = "Cuidado. Esse grupo está em um momento de baixa (frio). Talvez seja melhor usá-lo para exclusão ou esperar ele reagir.";
            else opinion = "Está estável. Nem muito quente, nem muito frio. Seguro para jogos equilibrados.";

            return `${getIntroPhrase()}\n\n` +
                   `Fiz um raio-X do **${targetGroup.name}** considerando os últimos ${range} concursos:\n` +
                   `🔹 **Composição:** Dezenas ${targetGroup.nums.join(', ')}.\n\n` +
                   `📊 **Performance Média:** ${avg} acertos por jogo.\n` +
                   `🎯 **No Último Sorteio:** Ele acertou ${lastHits} dezenas.\n` +
                   `🔥 **Potencial Máximo:** Chegou a bater ${maxHits} acertos nesse período.\n\n` +
                   `💡 **Minha Conclusão:** ${opinion}`;
        }
    }

    // --- 3. ANÁLISE DE TENDÊNCIAS (PARES, ÍMPARES, SOMA) - NOVO ---
    if (input.includes("par") || input.includes("impar") || input.includes("equilibrio")) {
        let parSum = 0;
        analysisSet.forEach(r => {
            const pares = r.dezenas.filter(d => d % 2 === 0).length;
            parSum += pares;
        });
        const avgPar = Math.round(parSum / range);
        const avgImpar = 15 - avgPar;

        return `${getIntroPhrase()} O equilíbrio entre Pares e Ímpares é fundamental na Lotofácil.\n\n` +
               `Nos últimos ${range} concursos, a tendência dominante foi:\n` +
               `⚖️ **${avgPar} Pares** e **${avgImpar} Ímpares** em média.\n\n` +
               `A maioria absoluta dos resultados sai com 7P/8I ou 8P/7I. Fugir disso (como 12 pares) é estatisticamente muito arriscado e raro. Mantenha seus jogos nesse padrão!`;
    }

    if (input.includes("soma") || input.includes("somatoria")) {
        let totalSum = 0;
        analysisSet.forEach(r => totalSum += r.dezenas.reduce((a,b)=>a+b, 0));
        const avgSum = Math.round(totalSum / range);

        return `Matematicamente falando, a **Soma das Dezenas** é um filtro poderoso.\n\n` +
               `A média da soma nos últimos ${range} jogos está em **${avgSum}**.\n` +
               `Resultados normais costumam ficar entre 180 e 220. Se o seu jogo somar menos de 160 ou mais de 240, as chances de sair são mínimas. Ajuste suas dezenas para ficar perto de ${avgSum}.`;
    }

    // --- 4. SUGESTÃO DINÂMICA (FIXAR / EXCLUIR) ---
    if (input.includes("fixar") || input.includes("excluir") || input.includes("dica") || input.includes("palpite") || input.includes("melhor") || input.includes("sugest")) {
        
        // Mapa de Calor
        const freqMap: Record<number, number> = {};
        for(let i=1; i<=25; i++) freqMap[i] = 0;
        analysisSet.forEach(r => r.dezenas.forEach(d => freqMap[d]++));

        // Mapa de Atraso
        const gapMap: Record<number, number> = {};
        for(let i=1; i<=25; i++) {
            let gap = 0;
            for(let j=0; j<results.length; j++) {
                if(results[j].dezenas.includes(i)) { gap = j; break; }
            }
            gapMap[i] = gap;
        }

        const scores = Array.from({length: 25}, (_, i) => i + 1).map(num => {
            let score = freqMap[num] * 10; 
            if (gapMap[num] > 5) score += 20; // Atraso crítico pesa muito
            if (lastDraw.dezenas.includes(num)) score += 5; // Tendência de repetição
            return { num, score, freq: freqMap[num], gap: gapMap[num] };
        });

        scores.sort((a,b) => b.score - a.score);

        const toFix = scores.slice(0, 4); // Top 4
        const toExclude = scores.reverse().slice(0, 4); // Bottom 4

        return `Com certeza. Analisei a frequência e o atraso (Lei das Médias) dos últimos ${range} jogos. Aqui está minha estratégia de ouro:\n\n` +
               `✅ **Para FIXAR:** As dezenas **${toFix.map(o => o.num).join(', ')}** estão muito fortes. Ou saem muito, ou estão tão atrasadas que devem sair a qualquer momento.\n\n` +
               `❌ **Para EXCLUIR:** As dezenas **${toExclude.map(o => o.num).join(', ')}** estão estatisticamente fracas. Evite gastar apostas nelas agora.\n\n` +
               `*Dica:* Use essas fixas combinadas com o Grupo A para maximizar suas chances.`;
    }

    // --- 5. ANÁLISE DE REPETIÇÃO ---
    if (input.includes("repet") || input.includes("sequencia")) {
        const seqLimit = 2; // Comparar com anterior
        const prevDraw = results[1];
        
        if (!prevDraw) return "Preciso de pelo menos 2 resultados para analisar repetição.";
        
        const repeats = lastDraw.dezenas.filter(d => prevDraw.dezenas.includes(d));
        
        return `Sobre as repetições: Do concurso anterior (#${prevDraw.concurso}) para o atual (#${lastDraw.concurso}), **${repeats.length} dezenas** se repetiram.\n\n` +
               `São elas: ${repeats.join(', ')}.\n\n` +
               `O padrão normal da Lotofácil é repetir entre 8 e 10 dezenas. Se repetiram ${repeats.length}, estamos ${repeats.length > 10 ? "acima" : (repeats.length < 8 ? "abaixo" : "dentro")} da média.`;
    }

    // --- 6. DEZENA ESPECÍFICA ---
    const numberMatch = input.match(/\b([1-9]|1[0-9]|2[0-5])\b/);
    if (numberMatch && (input.includes("nume") || input.includes("deze") || input.includes("bola") || input.includes("como esta") || input.length < 20)) {
        const num = parseInt(numberMatch[0]);
        let hits = 0;
        let currentGap = 0;
        
        // Calc freq
        for(let i=0; i<range; i++) {
            if (results[i].dezenas.includes(num)) hits++;
        }
        
        // Calc gap
        for(let j=0; j<results.length; j++) {
            if(results[j].dezenas.includes(num)) { currentGap = j; break; }
        }
        
        const percentage = ((hits / range) * 100).toFixed(0);
        
        let status = "";
        if (currentGap > 4) status = "CRÍTICA (Muito Atrasada)";
        else if (parseInt(percentage) > 60) status = "QUENTE (Sai muito)";
        else if (parseInt(percentage) < 30) status = "FRIA (Evite)";
        else status = "NEUTRA (Padrão)";

        return `Analisei a dezena **${num < 10 ? '0'+num : num}** especificamente para você:\n\n` +
               `📊 **Status:** ${status}\n` +
               `📉 **Atraso Atual:** Não sai há ${currentGap} concursos.\n` +
               `📈 **Frequência:** Saiu em ${hits} dos últimos ${range} sorteios (${percentage}%).\n\n` +
               `*Veredito:* ${currentGap > 3 ? "Ela está devendo. É uma boa candidata para voltar agora!" : "Ela tem comportamento regular."}`;
    }

    // --- FALLBACK INTELIGENTE ---
    const r = results[0];
    return `${getIntroPhrase()} Embora eu seja capaz de processar bilhões de cálculos, não entendi exatamente o que você quis dizer com essa frase específica.\n\n` +
           `Tente me perguntar coisas como:\n` +
           `👉 "Como está a dezena 25?"\n` +
           `👉 "Analise o Grupo B2 nos ultimos 20 jogos"\n` +
           `👉 "Quais dezenas fixar hoje?"\n` +
           `👉 "Qual a media de pares e impares?"\n\n` +
           `Estou aqui para ser seu braço direito estatístico!`;
};


export const Admin: React.FC<AdminProps> = ({ results, onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>('audit');
  
  // Audit State
  const [checkIndex, setCheckIndex] = useState(0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { id: '1', sender: 'ai', text: 'Olá, Administrador. Sou a Mestra IA. Minha capacidade cognitiva foi expandida e humanizada. Posso conversar sobre estratégias, analisar qualquer grupo ou dezena e calcular tendências de paridade e soma. Como posso ajudar você hoje?', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        setErrorMsg("");
    } else {
        setErrorMsg("Acesso Negado: Senha Incorreta.");
    }
  };

  const handleForgotPassword = () => {
      // Simple security question mechanism
      const input = window.prompt("Segurança: Digite o número de telefone do proprietário para confirmar identidade:");
      
      if (input === RECOVERY_PHONE) {
          alert(`Identidade confirmada.\n\nSua senha de administrador é: ${ADMIN_PASSWORD}`);
      } else if (input !== null) {
          alert("Número não reconhecido. Acesso negado.");
      }
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim()) return;

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'user',
          text: inputText,
          timestamp: new Date()
      };

      setChatMessages(prev => [...prev, userMsg]);
      const currentInput = inputText;
      setInputText("");

      // Simulate AI thinking delay (variable for realism)
      const thinkingTime = 1000 + Math.random() * 1500;

      setTimeout(() => {
          const responseText = generateAiResponse(currentInput, results);
          const aiMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              sender: 'ai',
              text: responseText,
              timestamp: new Date()
          };
          setChatMessages(prev => [...prev, aiMsg]);
      }, thinkingTime);
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const checkDraw = results.length > 0 ? results[checkIndex] : null;

  const handlePrev = () => { if (checkIndex < results.length - 1) setCheckIndex(checkIndex + 1); };
  const handleNext = () => { if (checkIndex > 0) setCheckIndex(checkIndex - 1); };

  if (!isAuthenticated) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-white">
              <button onClick={onBack} className="absolute top-4 left-4 flex items-center gap-2 font-bold opacity-80 hover:opacity-100">
                  <ArrowLeft className="w-5 h-5" /> Voltar
              </button>
              
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md text-center">
                  <div className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Área Restrita</h2>
                  <p className="text-white/70 mb-6 text-sm">Acesso exclusivo para administradores do sistema.</p>
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                      <input 
                        type="password" 
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Senha de Acesso"
                        className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:bg-white/30 font-bold text-center tracking-widest"
                      />
                      {errorMsg && <p className="text-red-300 font-bold text-xs bg-red-900/30 p-2 rounded">{errorMsg}</p>}
                      <button 
                        type="submit"
                        className="w-full bg-white text-indigo-900 py-3 rounded-xl font-black hover:bg-indigo-50 transition-colors shadow-lg"
                      >
                          ENTRAR
                      </button>
                  </form>
                  
                  <button 
                      onClick={handleForgotPassword}
                      className="mt-6 text-xs text-white/40 hover:text-white underline transition-colors"
                  >
                      Esqueci a senha
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 text-white">
        <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center gap-2 font-bold opacity-80 hover:opacity-100">
                <ArrowLeft className="w-5 h-5" /> Voltar
            </button>
            <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-200">Admin Logado</span>
            </div>
        </div>

        {/* ADMIN TABS */}
        <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 mb-6 border border-white/20">
            <button 
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}
            >
                <BarChart4 className="w-5 h-5" /> Auditoria
            </button>
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}
            >
                <BrainCircuit className="w-5 h-5" /> Consultor IA
            </button>
        </div>

        {/* === TAB 1: AUDIT (EXISTING) === */}
        {activeTab === 'audit' && (
            <>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black mb-2">Painel de Auditoria</h1>
                    <p className="text-white/70">Análise de desempenho dos Grupos Secretos.</p>
                </div>

                {results.length > 0 ? (
                    <>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20 flex items-center justify-between gap-4">
                            <button onClick={handlePrev} disabled={checkIndex >= results.length - 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            
                            <div className="text-center">
                                <div className="text-2xl font-black">Concurso #{checkDraw?.concurso}</div>
                                <div className="text-sm opacity-70">{checkDraw?.data}</div>
                            </div>

                            <button onClick={handleNext} disabled={checkIndex === 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30">
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {checkDraw && (
                            <div className="mb-8">
                                <p className="text-center text-xs font-bold opacity-60 mb-3 uppercase tracking-widest">Dezenas Sorteadas</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {checkDraw.dezenas.map(d => <Ball key={d} number={d} size="sm" isResult />)}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4">
                            {ALL_GROUPS_AUDIT.map((group, idx) => {
                                const hits = checkDraw ? checkDraw.dezenas.filter(n => group.nums.includes(n)).length : 0;
                                const total = group.nums.length;
                                const percentage = Math.round((hits / total) * 100);
                                
                                let barColor = "bg-gray-500";
                                if (percentage >= 70) barColor = "bg-green-500";
                                else if (percentage >= 50) barColor = "bg-yellow-500";
                                else if (percentage >= 30) barColor = "bg-orange-500";

                                return (
                                    <div key={idx} className="bg-white/95 text-gray-800 rounded-xl p-6 shadow-xl border-l-8 border-indigo-600">
                                        <div className="flex justify-between items-end mb-4">
                                            <h3 className="font-bold text-xl">{group.name}</h3>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-indigo-900">{hits} <span className="text-sm text-gray-500 font-bold align-top">acertos</span></div>
                                                <div className="text-xs font-bold text-gray-500">de {total} dezenas</div>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-2">
                                            <div className={`h-full ${barColor} transition-all duration-500 shadow-inner`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <div className="text-right text-xs font-bold opacity-60 mb-4">{percentage}% de aproveitamento</div>
                                        
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {group.nums.map(n => {
                                                const isHit = checkDraw?.dezenas.includes(n);
                                                return (
                                                    <div key={n} className={`transform transition-all ${isHit ? 'scale-110 drop-shadow-lg' : 'opacity-20 grayscale scale-90'}`}>
                                                        <Ball number={n} size="lg" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center border border-white/20">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">Sem dados para auditar</h3>
                        <p className="opacity-70">Carregue resultados na aba DADOS para utilizar a auditoria.</p>
                    </div>
                )}
            </>
        )}

        {/* === TAB 2: AI CHAT (NEW) === */}
        {activeTab === 'chat' && (
            <div className="h-[600px] flex flex-col bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                <div className="bg-purple-900/50 p-4 border-b border-white/10 flex items-center gap-3">
                    <div className="bg-white p-2 rounded-full">
                        <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Mestra IA (Privado)</h3>
                        <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online • Conectada aos Resultados
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                    {chatMessages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 border-2 border-white/20">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}
                            
                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm font-medium leading-relaxed shadow-lg ${
                                msg.sender === 'user' 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 rounded-tl-none'
                            }`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                <span className={`text-[10px] block mt-2 opacity-60 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {msg.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 border-2 border-white/20">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Converse naturalmente com a IA..."
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-purple-400 transition-all font-medium"
                    />
                    <button 
                        type="submit" 
                        disabled={!inputText.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
            </div>
        )}
    </div>
  );
};