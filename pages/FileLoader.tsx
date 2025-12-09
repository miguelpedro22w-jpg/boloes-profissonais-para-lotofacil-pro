
import React, { useRef, useState } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { DrawResult } from '../types';
import { parseAnyFile } from '../utils/lotteryUtils';

interface FileLoaderProps {
  onBack: () => void;
  setResults: React.Dispatch<React.SetStateAction<DrawResult[]>>;
}

export const FileLoader: React.FC<FileLoaderProps> = ({ onBack, setResults }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<DrawResult[]>([]);
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setPreviewData([]);

    try {
        const parsed = await parseAnyFile(file);
        setPreviewData(parsed);
    } catch (error) {
        alert("Erro ao ler o arquivo. Tente o formato HTML ou XLSX.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveToApp = () => {
      if (previewData.length === 0) return;
      
      setResults(prevResults => {
          const existingIds = new Set(prevResults.map(r => r.concurso));
          const filtered = previewData.filter(r => !existingIds.has(r.concurso));
          return [...filtered, ...prevResults].sort((a,b) => b.concurso - a.concurso);
      });
      
      alert(`${previewData.length} resultados processados e salvos com sucesso!`);
      onBack();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 text-white">
        <button onClick={onBack} className="flex items-center gap-2 text-white/90 hover:text-white font-bold mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Início
        </button>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-6">
                 <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
                     <Upload className="w-8 h-8 text-white" />
                 </div>
                 <div>
                     <h1 className="text-2xl font-black">Leitor de Arquivos Caixa</h1>
                     <p className="text-white/60 text-sm">HTML, HTM ou Excel (Qualquer formato)</p>
                 </div>
             </div>

             <div className="bg-black/20 rounded-xl p-8 border border-dashed border-white/30 text-center hover:bg-black/30 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}>
                 
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".html,.htm,.xlsx,.xls"
                 />
                 
                 {isLoading ? (
                     <div className="animate-pulse font-bold text-lg">Lendo arquivo...</div>
                 ) : fileName ? (
                     <div className="flex flex-col items-center gap-2">
                         <FileText className="w-12 h-12 text-green-400 mb-2" />
                         <span className="font-bold text-lg text-green-300">{fileName}</span>
                         <span className="text-xs text-white/50">Clique para trocar</span>
                     </div>
                 ) : (
                     <div className="flex flex-col items-center gap-2 text-white/70 group-hover:text-white">
                         <Upload className="w-12 h-12 mb-2 opacity-50" />
                         <span className="font-bold text-lg">Toque para selecionar o arquivo</span>
                         <span className="text-xs opacity-50">Suporta o arquivo oficial D_LOTFAC.HTM (Zip)</span>
                     </div>
                 )}
             </div>

             {/* PREVIEW AREA */}
             {previewData.length > 0 && (
                 <div className="mt-8 animate-in slide-in-from-bottom">
                     <div className="flex justify-between items-center mb-4">
                         <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-5 h-5 text-green-400" />
                             <span className="font-bold">{previewData.length} Resultados Encontrados</span>
                         </div>
                         <button 
                             onClick={handleSaveToApp}
                             className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
                         >
                             <Save className="w-5 h-5" />
                             Confirmar e Salvar
                         </button>
                     </div>

                     <div className="bg-white/95 rounded-xl overflow-hidden text-gray-900 max-h-[400px] overflow-y-auto shadow-inner">
                         <table className="w-full text-sm">
                             <thead className="bg-gray-100 sticky top-0">
                                 <tr>
                                     <th className="p-3 text-left">Concurso</th>
                                     <th className="p-3 text-left">Data</th>
                                     <th className="p-3 text-left">Dezenas Identificadas</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200">
                                 {previewData.slice(0, 50).map((r, idx) => (
                                     <tr key={idx}>
                                         <td className="p-3 font-bold">#{r.concurso}</td>
                                         <td className="p-3">{r.data}</td>
                                         <td className="p-3 font-mono text-xs text-blue-800">
                                             {r.dezenas.join(' - ')}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         {previewData.length > 50 && (
                             <div className="p-3 text-center bg-gray-50 text-gray-500 text-xs font-bold">
                                 ... e mais {previewData.length - 50} resultados.
                             </div>
                         )}
                     </div>
                 </div>
             )}

             {fileName && previewData.length === 0 && !isLoading && (
                 <div className="mt-6 bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-100">
                     <AlertCircle className="w-6 h-6 shrink-0" />
                     <div>
                         <p className="font-bold">Nenhum resultado identificado.</p>
                         <p className="text-sm opacity-80">Verifique se o arquivo é da Lotofácil. Se for o ZIP oficial, extraia e use o arquivo .HTM.</p>
                     </div>
                 </div>
             )}
        </div>
    </div>
  );
};
