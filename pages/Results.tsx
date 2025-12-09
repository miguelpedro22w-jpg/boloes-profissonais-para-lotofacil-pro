
import React, { useRef, useState } from 'react';
import { Download, Upload, ExternalLink, FileSpreadsheet, Info, Tv, Globe, Search, ArrowLeft, ArrowRight, RefreshCw, ClipboardPaste, Plus, Edit3, Save, CloudUpload, FileCheck } from 'lucide-react';
import { DrawResult } from '../types';
import { parseAnyFile, exportToXLSX, extractDataFromText, fetchCaixaResult } from '../utils/lotteryUtils';
import { CAIXA_URL, YOUTUBE_LIVE_URL } from '../constants';
import { Ball } from '../components/Ball';

interface ResultsProps {
  results: DrawResult[];
  setResults: React.Dispatch<React.SetStateAction<DrawResult[]>>;
  onBack: () => void;
}

export const Results: React.FC<ResultsProps> = ({ results, setResults, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendFileRef = useRef<HTMLInputElement>(null);
  const readerCaixaRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [searchConcurso, setSearchConcurso] = useState("");
  const [loadingApi, setLoadingApi] = useState(false);

  // Manual Entry States
  const [manualConcursoInput, setManualConcursoInput] = useState("");
  const [manualDezenas, setManualDezenas] = useState<number[]>([]);

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const parsed = await parseAnyFile(e.target.files[0]);
        if (parsed.length > 0) {
            mergeResults(parsed);
            alert(`${parsed.length} resultados importados e salvos com sucesso!`);
            e.target.value = '';
        } else {
            alert("Nenhum resultado válido detectado. Verifique se o arquivo é da Lotofácil.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao ler arquivo.");
      }
    }
  };

  const handlePasteProcess = () => {
      if (!pasteText.trim()) return;
      const extracted = extractDataFromText(pasteText);
      if (extracted.length > 0) {
          mergeResults(extracted);
          setPasteText("");
          alert(`${extracted.length} resultado(s) encontrado(s) e adicionado(s)!`);
      } else {
          alert("Não foi possível identificar 15 dezenas no texto colado.");
      }
  };

  const mergeResults = (newResults: DrawResult[]) => {
      setResults(prevResults => {
          const existingIds = new Set(prevResults.map(r => r.concurso));
          const filtered = newResults.filter(r => !existingIds.has(r.concurso));
          return [...filtered, ...prevResults].sort((a,b) => b.concurso - a.concurso);
      });
  };

  const handleFetchApi = async (concurso?: number) => {
      setLoadingApi(true);
      const res = await fetchCaixaResult(concurso);
      setLoadingApi(false);
      
      if (res) {
          mergeResults([res]);
      } else {
          alert("Erro ao buscar na API da Caixa. Verifique sua conexão ou tente novamente mais tarde.");
      }
  };

  const handleSearch = () => {
      const num = parseInt(searchConcurso);
      if (isNaN(num)) return;
      
      const exists = results.find(r => r.concurso === num);
      if (exists) {
          alert(`Concurso ${num} já está na lista!`);
      } else {
          handleFetchApi(num);
      }
  };

  const handleExport = () => {
    exportToXLSX(results, "Resultados_Lotofacil_Completo");
  };

  const toggleManualNumber = (num: number) => {
    if (manualDezenas.includes(num)) {
      setManualDezenas(manualDezenas.filter(n => n !== num).sort((a,b)=>a-b));
    } else {
      if (manualDezenas.length < 15) {
        setManualDezenas([...manualDezenas, num].sort((a,b)=>a-b));
      }
    }
  };

  const handleSaveManualResult = () => {
      const conc = parseInt(manualConcursoInput);
      
      if (isNaN(conc) || conc <= 0) {
          alert("Digite um número de concurso válido.");
          return;
      }
      if (manualDezenas.length !== 15) {
          alert("Selecione exatamente 15 dezenas.");
          return;
      }

      const newResult: DrawResult = {
          concurso: conc,
          data: new Date().toLocaleDateString('pt-BR'),
          dezenas: manualDezenas
      };

      setResults(prev => {
          // Remove existing if any (overwrite)
          const filtered = prev.filter(r => r.concurso !== conc);
          return [newResult, ...filtered].sort((a,b) => b.concurso - a.concurso);
      });

      setManualConcursoInput("");
      setManualDezenas([]);
      alert("Resultado salvo manualmente com sucesso!");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Início
      </button>

      <div className="bg-white/95 backdrop-blur-md border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-lg">
         <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
         <div>
            <p className="text-sm text-blue-800 font-bold">Recuperação de Dados</p>
            <p className="text-xs text-blue-600">
               Seus arquivos e buscas ficam salvos automaticamente na memória deste navegador. 
            </p>
         </div>
      </div>

      {/* --- Module 1: Official Links --- */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-6 mb-6 border border-white/20">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Globe className="w-6 h-6 text-blue-600" />
            Links Oficiais e Downloads
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
             <a 
                href={CAIXA_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition group"
             >
                <div className="bg-blue-600 text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900">Site da Caixa (Download)</h3>
                    <p className="text-xs text-blue-700">Baixe o arquivo oficial aqui</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-blue-400" />
             </a>

             <a 
                href={YOUTUBE_LIVE_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 transition group"
             >
                <div className="bg-red-600 text-white p-3 rounded-full group-hover:scale-110 transition-transform">
                    <Tv className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-red-900">Sorteio ao Vivo</h3>
                    <p className="text-xs text-red-700">RedeTV! / YouTube</p>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-red-400" />
             </a>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Já baixou o arquivo?
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="text-sm text-green-800">
                     <p className="font-bold">Leitor Oficial</p>
                     <p className="text-xs">Selecione o arquivo baixado do site da Caixa (HTML ou Excel) para salvar os dados no app.</p>
                 </div>
                 <input 
                    type="file" 
                    ref={readerCaixaRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple={false}
                    accept=".xlsx,.xls,.html,.htm,.zip"
                />
                 <button 
                    onClick={() => readerCaixaRef.current?.click()}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm whitespace-nowrap"
                 >
                     Ler Arquivo Baixado
                 </button>
            </div>
        </div>
      </div>

      {/* --- Module 2: Navigation & API Search --- */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-6 mb-6 border border-white/20">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              Buscar Concurso (API)
          </h2>
          
          <div className="flex flex-col md:flex-row gap-3 items-center bg-gray-50 p-4 rounded-xl">
              <div className="flex w-full md:w-auto gap-2">
                 <button 
                    onClick={() => {
                        const current = parseInt(searchConcurso) || (results[0]?.concurso || 0);
                        if(current > 1) {
                            setSearchConcurso((current - 1).toString());
                            handleFetchApi(current - 1);
                        }
                    }}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-100" title="Anterior"
                 >
                     <ArrowLeft className="w-5 h-5 text-gray-600" />
                 </button>
                 
                 <div className="relative flex-1">
                    <input 
                        type="number" 
                        placeholder="Nº Concurso"
                        value={searchConcurso}
                        onChange={(e) => setSearchConcurso(e.target.value)}
                        className="w-full pl-3 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 outline-none font-bold text-center"
                    />
                    <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                 </div>
                 
                 <button 
                    onClick={handleSearch}
                    className="px-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700"
                 >
                    Buscar
                 </button>

                 <button 
                    onClick={() => {
                        const current = parseInt(searchConcurso) || (results[0]?.concurso || 0);
                        setSearchConcurso((current + 1).toString());
                        handleFetchApi(current + 1);
                    }}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-100" title="Próximo"
                 >
                     <ArrowRight className="w-5 h-5 text-gray-600" />
                 </button>
              </div>

              <div className="w-full md:w-auto md:ml-auto">
                   <button 
                        onClick={() => handleFetchApi()}
                        disabled={loadingApi}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm transition-all"
                   >
                        {loadingApi ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Buscar Mais Recente
                   </button>
              </div>
          </div>
      </div>

      {/* --- Module 3: Manual Entry --- */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-6 mb-6 border border-white/20">
           <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
               <Edit3 className="w-5 h-5 text-indigo-600" />
               Cadastro Manual de Resultado
           </h3>
           <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nº Concurso</label>
                    <input 
                        type="number" 
                        value={manualConcursoInput}
                        onChange={(e) => setManualConcursoInput(e.target.value)}
                        placeholder="Ex: 1234"
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 font-bold text-lg mb-4 focus:border-indigo-500 outline-none"
                    />
                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 md:mb-0">
                        <p className="text-xs text-indigo-800 font-bold mb-1">Selecionados: {manualDezenas.length} / 15</p>
                        <button 
                            onClick={handleSaveManualResult}
                            className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Resultado
                        </button>
                    </div>
                </div>
                <div className="w-full md:w-2/3">
                     <p className="text-xs font-bold text-gray-400 mb-2 uppercase text-center">Toque para selecionar as 15 dezenas</p>
                     <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
                         {Array.from({length: 25}, (_, i) => i + 1).map(num => (
                             <Ball 
                                key={num} 
                                number={num} 
                                size="md" 
                                selected={manualDezenas.includes(num)}
                                onClick={() => toggleManualNumber(num)}
                             />
                         ))}
                     </div>
                </div>
           </div>
      </div>

      {/* --- Module 4: Inputs --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20 flex flex-col">
               <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                   <ClipboardPaste className="w-5 h-5 text-orange-500" />
                   Colar Resultado (Texto)
               </h3>
               <textarea 
                   value={pasteText}
                   onChange={(e) => setPasteText(e.target.value)}
                   placeholder="Cole aqui o texto do PDF, WhatsApp ou Site..."
                   className="w-full flex-1 min-h-[120px] p-3 border border-gray-200 rounded-lg mb-3 text-xs bg-gray-50 focus:bg-white transition-colors"
               />
               <button 
                   onClick={handlePasteProcess}
                   disabled={!pasteText.trim()}
                   className="w-full py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50"
               >
                   Processar Texto
               </button>
           </div>

           <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl border border-white/20 flex flex-col justify-between">
               <div>
                   <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                       <Upload className="w-5 h-5 text-blue-600" />
                       Upload Universal
                   </h3>
                   <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                       Suporta: .XLSX, .XLS, .TXT, .CSV, .HTML, .JSON, .PDF (texto).
                       <br/>O sistema detecta e converte automaticamente.
                   </p>
               </div>
               
               <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple={false}
                    accept=".xlsx,.xls,.csv,.txt,.html,.htm,.json,.pdf"
                />
               <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md flex items-center justify-center gap-2"
               >
                   <Plus className="w-5 h-5" />
                   Carregar Arquivo
               </button>
           </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-6 mb-6 border border-teal-100 bg-teal-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
               <div>
                    <h3 className="font-bold text-teal-800 mb-1 flex items-center gap-2">
                        <CloudUpload className="w-5 h-5 text-teal-600" />
                        Enviar Arquivo
                    </h3>
                    <p className="text-xs text-teal-600">
                        Função adicional para envio de bases externas ou backups (Suporta todos os formatos).
                    </p>
               </div>
               <input 
                    type="file" 
                    ref={sendFileRef}
                    onChange={handleFileUpload} 
                    className="hidden"
                    multiple={false}
                    accept=".xlsx,.xls,.csv,.txt,.html,.htm,.json,.pdf"
               />
               <button 
                   onClick={() => sendFileRef.current?.click()}
                   className="w-full sm:w-auto px-6 py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
               >
                   <CloudUpload className="w-5 h-5" />
                   Selecionar Arquivo
               </button>
          </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/20">
         <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
             <h3 className="font-bold text-gray-700">Histórico ({results.length})</h3>
             
             {results.length > 0 && (
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handleExport} className="flex-1 sm:flex-none text-white flex items-center justify-center gap-2 text-sm font-bold bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg shadow-md transition-all">
                        <FileSpreadsheet className="w-4 h-4" /> 
                        CONVERSOR PRO
                    </button>
                 </div>
             )}
         </div>
         
         <div className="bg-yellow-50 p-2 text-center border-b border-yellow-100">
             <p className="text-xs font-bold text-yellow-800">
                Seus resultados estão seguros. Use a IA para gerar jogos com maior probabilidade.
             </p>
         </div>

         <div className="max-h-[500px] overflow-y-auto bg-gray-50/50">
             {results.length === 0 ? (
                 <div className="p-10 text-center text-gray-400">
                     <p className="font-bold">Nenhum resultado</p>
                     <p className="text-sm">Use a API, Cole o Texto, Digite Manualmente ou Carregue um Arquivo.</p>
                 </div>
             ) : (
                 <table className="w-full text-sm">
                     <thead className="bg-gray-100 sticky top-3 z-10 shadow-sm">
                         <tr>
                             <th className="p-3 text-left">Conc.</th>
                             <th className="p-3 text-left hidden sm:table-cell">Data</th>
                             <th className="p-3 text-center">Dezenas</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 bg-white">
                         {results.map(r => (
                             <tr key={r.concurso} className="hover:bg-blue-50 transition-colors">
                                 <td className="p-3 font-bold text-gray-700">#{r.concurso}</td>
                                 <td className="p-3 text-gray-500 hidden sm:table-cell">{r.data}</td>
                                 <td className="p-3">
                                     <div className="flex gap-1 justify-center flex-wrap max-w-xs mx-auto">
                                         {r.dezenas.map(d => (
                                             <Ball key={d} number={d} size="sm" isResult />
                                         ))}
                                     </div>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             )}
         </div>
      </div>
    </div>
  );
};
