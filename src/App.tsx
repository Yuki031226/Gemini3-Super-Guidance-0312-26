import React, { useState, useRef, useEffect } from 'react';
import { Settings, Upload, FileText, Download, Sparkles, MessageSquare, BarChart, AlertTriangle, Globe, GitBranch, CheckCircle, ChevronRight, Loader2, Send, Square, Terminal, Activity, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromPdf } from './lib/pdf';
import { generateGuidance, chatWithDocumentStream } from './lib/gemini';
import { cn } from './lib/utils';
import Mermaid from './components/Mermaid';

const i18n = {
  English: {
    title: "🏥 AI MedDev Review Guidance & Checklist System",
    sidebar_title: "⚙️ Settings",
    upload_label: "📄 Upload Published Guidance (PDF)",
    generate_btn: "✨ Generate Guidance & Checklist",
    stop_btn: "🛑 Stop Generation",
    model_select: "🧠 Select LLM Model",
    painter_select: "🎨 Select Painter Style",
    prompt_edit: "📝 Edit System Prompt",
    edit_markdown: "✍️ Edit Generated Markdown",
    download_md: "⬇️ Download Markdown",
    download_txt: "⬇️ Download TXT",
    wow1: "🌟 WOW 1: Visual Flowchart (Mermaid)",
    wow2: "🌟 WOW 2: Global Standards Cross-Referencer",
    wow3: "🌟 WOW 3: Risk Predictor (Top 3 Failures)",
    wow4: "🌟 WOW 4: AI Smart Chat Assistant (Streaming)",
    wow5: "🌟 WOW 5: AI Auto-Mermaid Flowchart Generator",
    wow5_desc: "Automatically analyzes the regulatory hierarchy and draws a visual review mindmap/flowchart using Mermaid.js. Reviewers can see the system component architecture and corresponding testing requirements at a glance.",
    wow6: "🌟 WOW 6: AI Automated Review Summary Dashboard",
    wow7: "🌟 WOW 7: Live LLM Telemetry Terminal",
    generating: "Extracting text and analyzing via AI...",
    upload_warning: "Please upload a PDF first!",
    paste_warning: "Please paste some text first!",
    chat_placeholder: "Ask a question about the document...",
    send: "Send",
    stop: "Stop",
    estimated_days: "Est. Review Days",
    complexity: "Complexity Level",
    key_focus: "Key Focus Area",
    input_upload: "Upload PDF",
    input_paste: "Paste Text",
    paste_label: "📝 Paste Guidance Text Here",
    applied_settings: "📌 Applied Settings & Prompt",
    used_prompt: "Prompt Used"
  },
  "繁體中文": {
    title: "🏥 AI 醫療器材審查指引與清單生成系統",
    sidebar_title: "⚙️ 系統設定",
    upload_label: "📄 上傳已發布之指引文件 (PDF)",
    generate_btn: "✨ 生成審查指引與清單",
    stop_btn: "🛑 停止生成",
    model_select: "🧠 選擇 LLM 模型",
    painter_select: "🎨 選擇畫家藝術風格",
    prompt_edit: "📝 編輯系統提示詞 (Prompt)",
    edit_markdown: "✍️ 編輯生成的 Markdown 結果",
    download_md: "⬇️ 下載 Markdown 檔案",
    download_txt: "⬇️ 下載 TXT 檔案",
    wow1: "🌟 WOW 1: 視覺化審查流程圖 (Mermaid)",
    wow2: "🌟 WOW 2: 國際法規智能對照",
    wow3: "🌟 WOW 3: 模擬退件風險評估 (Top 3 致命缺陷)",
    wow4: "🌟 WOW 4: AI 智能問答助手 (Streaming Chat)",
    wow5: "🌟 WOW 5: AI 自動化審查流程圖 (Auto-Mermaid Flowchart Generator)",
    wow5_desc: "系統在生成審查清單的同時，會自動剖析法規層級，並以 Mermaid.js 語法自動繪製出「視覺化審查心智圖/流程圖」。審查員可以一目了然地看到產品的系統組件架構（如：錨定元件、橋接元件）與對應的測試要求。",
    wow6: "🌟 WOW 6: AI 自動化審查摘要儀表板 (Summary Dashboard)",
    wow7: "🌟 WOW 7: LLM 即時遙測終端機 (Live Telemetry)",
    generating: "正在萃取文字並透過 AI 分析中...",
    upload_warning: "請先上傳 PDF 文件！",
    paste_warning: "請先貼上一些文字！",
    chat_placeholder: "詢問關於此文件的問題...",
    send: "發送",
    stop: "停止",
    estimated_days: "預估審查天數",
    complexity: "複雜度等級",
    key_focus: "關鍵審查領域",
    input_upload: "上傳 PDF",
    input_paste: "貼上文字",
    paste_label: "📝 在此貼上指引文字",
    applied_settings: "📌 套用的設定與提示詞",
    used_prompt: "使用的提示詞 (Prompt)"
  }
};

const painters = [
  "Normal (無風格)", "Leonardo da Vinci (達文西)", "Vincent van Gogh (梵谷)", "Pablo Picasso (畢卡索)", 
  "Claude Monet (莫內)", "Salvador Dali (達利)", "Rembrandt (林布蘭)", "Michelangelo (米開朗基羅)", 
  "Frida Kahlo (卡蘿)", "Andy Warhol (安迪沃荷)", "Georgia O'Keeffe (歐姬芙)", "Gustav Klimt (克林姆)", 
  "Edvard Munch (孟克)", "Pierre-Auguste Renoir (雷諾瓦)", "Paul Cezanne (塞尚)", 
  "Jackson Pollock (波拉克)", "Henri Matisse (馬諦斯)", "Edgar Degas (竇加)", 
  "Edward Hopper (霍普)", "Johannes Vermeer (維梅爾)", "Wassily Kandinsky (康丁斯基)"
];

const DEFAULT_PROMPT = `你是一個專業的 FDA/TFDA 醫療器材審查員。請根據使用者上傳的法規指引內容，萃取重點並生成一份包含「第一部分：臨床前審查指引」與「第二部分：查驗登記審查清單 (表格形式)」的 Markdown 文件。
輸出語言：繁體中文。
結構請參考以下範例：
1. 產品規格要求 (包含適應症、工程圖、材質證明等)
2. 生物相容性評估 (包含豁免機制、ISO 10993等)
3. 滅菌確效 (包含無菌標準、ISO驗證等)
4. 機械性質評估 (包含剛性、疲勞、破壞等)
5. 特定風險與額外評估 (包含MRI相容性等)
最後附上具有[審查項目、審查重點、審查結果、備註] 四個欄位的 Markdown 審查清單表格。`;

export default function App() {
  const [lang, setLang] = useState<"English" | "繁體中文">("繁體中文");
  const [theme, setTheme] = useState<"Light" | "Dark">("Light");
  const [model, setModel] = useState("gemini-3-flash-preview");
  const [painter, setPainter] = useState(painters[0]);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [file, setFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");
  const [appliedSettings, setAppliedSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [result, setResult] = useState<any>(null);
  const [editedMd, setEditedMd] = useState("");
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  // Telemetry & Abort state
  const abortRef = useRef(false);
  const [llmStatus, setLlmStatus] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const t = i18n[lang];

  useEffect(() => {
    if (theme === "Dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [llmStatus]);

  const handleStop = () => {
    abortRef.current = true;
    setLlmStatus(prev => [...prev, "[SYSTEM] Operation aborted by user."]);
  };

  const handleGenerate = async () => {
    if (inputType === 'upload' && !file) {
      setError(t.upload_warning);
      return;
    }
    if (inputType === 'paste' && !pastedText.trim()) {
      setError(t.paste_warning);
      return;
    }
    abortRef.current = false;
    setError("");
    setLoading(true);
    setLlmStatus(["[SYSTEM] Initializing LLM engine..."]);
    
    // Simulate progress steps for WOW effect
    const statuses = [
      inputType === 'upload' ? "[PDF] Extracting text from document..." : "[TEXT] Processing pasted text...",
      "[LLM] Tokenizing document context...",
      `[LLM] Applying persona: ${painter}...`,
      "[LLM] Generating JSON schema...",
      "[LLM] Validating Mermaid syntax...",
      "[LLM] Generating architecture mindmap..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < statuses.length && !abortRef.current) {
        setLlmStatus(prev => [...prev, statuses[i]]);
        i++;
      }
    }, 1500);

    try {
      let text = "";
      if (inputType === 'upload') {
        text = await extractTextFromPdf(file!);
        setLlmStatus(prev => [...prev, `[PDF] Extracted ${text.length} characters. Sending to Gemini API...`]);
      } else {
        text = pastedText;
        setLlmStatus(prev => [...prev, `[TEXT] Processed ${text.length} characters. Sending to Gemini API...`]);
      }
      
      if (abortRef.current) throw new Error("Aborted");
      setExtractedText(text);
      
      const res = await generateGuidance(text, prompt, painter, lang, model);
      if (abortRef.current) throw new Error("Aborted");
      
      setResult(res);
      setEditedMd(res.markdown);
      setAppliedSettings({ prompt, model, painter, lang });
      setLlmStatus(prev => [...prev, "[SYSTEM] Generation complete! Rendering UI..."]);
    } catch (err: any) {
      if (err.message !== "Aborted") {
        setError(err.message || "An error occurred during generation.");
        setLlmStatus(prev => [...prev, `[ERROR] ${err.message}`]);
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !extractedText) return;
    abortRef.current = false;
    const newHistory = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory([...newHistory, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      const stream = await chatWithDocumentStream(extractedText, newHistory, chatInput, lang, model);
      let fullReply = "";
      for await (const chunk of stream) {
        if (abortRef.current) break;
        fullReply += chunk.text;
        setChatHistory([...newHistory, { role: "assistant", content: fullReply }]);
      }
    } catch (err: any) {
      if (err.message !== "Aborted") {
        setChatHistory([...newHistory, { role: "assistant", content: "Error: " + err.message }]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-300", theme === "Dark" ? "bg-zinc-950 text-zinc-50" : "bg-slate-50 text-slate-900")}>
      <div className="flex flex-col md:flex-row h-screen overflow-hidden">
        
        {/* Sidebar */}
        <div className={cn("w-full md:w-80 flex-shrink-0 border-r overflow-y-auto p-6", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t.sidebar_title}
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Language / 語言</label>
              <div className="flex gap-2">
                {(["繁體中文", "English"] as const).map(l => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", lang === l ? "bg-indigo-600 text-white" : (theme === "Dark" ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"))}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Theme / 主題</label>
              <div className="flex gap-2">
                {(["Light", "Dark"] as const).map(th => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", theme === th ? "bg-indigo-600 text-white" : (theme === "Dark" ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"))}
                  >
                    {th}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.model_select}</label>
              <select 
                value={model} 
                onChange={e => setModel(e.target.value)}
                className={cn("w-full p-2 rounded-md border text-sm focus:ring-2 focus:ring-indigo-500 outline-none", theme === "Dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-slate-300")}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.painter_select}</label>
              <select 
                value={painter} 
                onChange={e => setPainter(e.target.value)}
                className={cn("w-full p-2 rounded-md border text-sm focus:ring-2 focus:ring-indigo-500 outline-none", theme === "Dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-slate-300")}
              >
                {painters.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t.prompt_edit}</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={8}
                className={cn("w-full p-3 rounded-md border text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none", theme === "Dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-slate-300")}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                {t.title}
              </h1>
              <p className={cn("text-lg", theme === "Dark" ? "text-zinc-400" : "text-slate-600")}>
                Upload your medical device guidance document and let AI generate a comprehensive review checklist, visual flowcharts, and risk predictions.
              </p>
            </header>

            {/* Input Section */}
            <div className={cn("p-8 rounded-2xl border-2 flex flex-col transition-colors", theme === "Dark" ? "border-zinc-700 bg-zinc-900/50" : "border-slate-300 bg-white")}>
              <div className="flex gap-4 mb-6 justify-center">
                <button 
                  onClick={() => setInputType("upload")}
                  className={cn("px-6 py-2 rounded-full font-medium transition-all", inputType === "upload" ? "bg-indigo-600 text-white shadow-md" : (theme === "Dark" ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-slate-100 text-slate-500 hover:text-slate-700"))}
                >
                  <Upload className="w-4 h-4 inline-block mr-2" />
                  {t.input_upload}
                </button>
                <button 
                  onClick={() => setInputType("paste")}
                  className={cn("px-6 py-2 rounded-full font-medium transition-all", inputType === "paste" ? "bg-indigo-600 text-white shadow-md" : (theme === "Dark" ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-slate-100 text-slate-500 hover:text-slate-700"))}
                >
                  <FileText className="w-4 h-4 inline-block mr-2" />
                  {t.input_paste}
                </button>
              </div>

              {inputType === "upload" ? (
                <div className="flex flex-col items-center justify-center text-center border-2 border-dashed rounded-xl p-8 border-slate-300 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <Upload className="w-12 h-12 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t.upload_label}</h3>
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {file && <p className="mt-4 text-sm text-emerald-600 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {file.name}</p>}
                </div>
              ) : (
                <div className="flex flex-col w-full">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2 justify-center"><FileText className="w-5 h-5 text-indigo-500" /> {t.paste_label}</h3>
                  <textarea 
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    placeholder="Paste your medical device guidance text here..."
                    className={cn("w-full h-48 p-4 rounded-xl border font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none", theme === "Dark" ? "bg-zinc-950 border-zinc-700 text-zinc-300" : "bg-slate-50 border-slate-300")}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                {loading ? t.generating : t.generate_btn}
              </button>
              
              {loading && (
                <button 
                  onClick={handleStop}
                  className="px-6 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-lg shadow-red-200 dark:shadow-none transition-all flex justify-center items-center gap-2"
                >
                  <Square className="w-5 h-5 fill-current" />
                  {t.stop_btn}
                </button>
              )}
            </div>

            {/* WOW 7: Live Telemetry Terminal */}
            <AnimatePresence>
              {(loading || llmStatus.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={cn("p-4 rounded-xl border font-mono text-sm", theme === "Dark" ? "bg-black border-zinc-800 text-emerald-400" : "bg-slate-900 border-slate-800 text-emerald-400")}>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800">
                      <Terminal className="w-4 h-4" />
                      <span className="font-bold">{t.wow7}</span>
                      {loading && <Activity className="w-4 h-4 ml-auto animate-pulse text-indigo-400" />}
                    </div>
                    <div className="h-32 overflow-y-auto space-y-1">
                      {llmStatus.map((status, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span>
                          <span>{status}</span>
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results Section */}
            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 mt-12"
                >
                  
                  {/* Applied Settings */}
                  {appliedSettings && (
                    <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        {t.applied_settings}
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className={cn("p-3 rounded-lg", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                          <p className="text-xs text-slate-500 mb-1">Model</p>
                          <p className="font-medium text-sm">{appliedSettings.model}</p>
                        </div>
                        <div className={cn("p-3 rounded-lg", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                          <p className="text-xs text-slate-500 mb-1">Painter Style</p>
                          <p className="font-medium text-sm">{appliedSettings.painter}</p>
                        </div>
                        <div className={cn("p-3 rounded-lg", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                          <p className="text-xs text-slate-500 mb-1">Language</p>
                          <p className="font-medium text-sm">{appliedSettings.lang}</p>
                        </div>
                      </div>
                      <div className={cn("p-4 rounded-lg", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                        <p className="text-xs text-slate-500 mb-2">{t.used_prompt}</p>
                        <p className="text-sm font-mono whitespace-pre-wrap">{appliedSettings.prompt}</p>
                      </div>
                    </div>
                  )}

                  {/* WOW 6: Summary Dashboard */}
                  <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <BarChart className="w-6 h-6 text-indigo-500" />
                      {t.wow6}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">{t.estimated_days}</p>
                        <p className="text-4xl font-light">{result.summary?.estimatedReviewDays || 45} <span className="text-lg">days</span></p>
                      </div>
                      <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">{t.complexity}</p>
                        <p className="text-4xl font-light text-amber-500">{result.summary?.complexityLevel || 'High'}</p>
                      </div>
                      <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                        <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">{t.key_focus}</p>
                        <p className="text-2xl font-medium text-emerald-600 truncate">{result.summary?.keyFocusArea || 'Biocompatibility'}</p>
                      </div>
                    </div>
                  </div>

                  {/* WOW 1: Mermaid */}
                  <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <GitBranch className="w-6 h-6 text-indigo-500" />
                      {t.wow1}
                    </h2>
                    <div className={cn("p-4 rounded-xl", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                      <Mermaid chart={result.mermaid} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* WOW 2: Cross Ref */}
                    <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Globe className="w-6 h-6 text-blue-500" />
                        {t.wow2}
                      </h2>
                      <p className="leading-relaxed">{result.crossReferences}</p>
                    </div>

                    {/* WOW 3: Risks */}
                    <div className={cn("p-6 rounded-2xl border border-red-200", theme === "Dark" ? "bg-red-950/20 border-red-900/50" : "bg-red-50")}>
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                        {t.wow3}
                      </h2>
                      <p className="leading-relaxed text-red-700 dark:text-red-400">{result.risks}</p>
                    </div>
                  </div>

                  {/* WOW 5: Auto-Mermaid Flowchart */}
                  <div className={cn("p-6 rounded-2xl border", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <Cpu className="w-6 h-6 text-emerald-500" />
                      {t.wow5}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">{t.wow5_desc}</p>
                    <div className={cn("p-4 rounded-xl", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                      <Mermaid chart={result.architectureMermaid} />
                    </div>
                  </div>

                  {/* Markdown Editor & Preview */}
                  <div className="pt-8 border-t dark:border-zinc-800">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-indigo-500" />
                      {t.edit_markdown}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <textarea 
                        value={editedMd}
                        onChange={e => setEditedMd(e.target.value)}
                        className={cn("w-full h-[600px] p-4 rounded-xl border font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none", theme === "Dark" ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-slate-200")}
                      />
                      <div className={cn("w-full h-[600px] p-6 rounded-xl border overflow-y-auto prose prose-sm max-w-none", theme === "Dark" ? "bg-zinc-900 border-zinc-800 prose-invert" : "bg-white border-slate-200")}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{editedMd}</ReactMarkdown>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-6">
                      <button 
                        onClick={() => handleDownload(editedMd, "Guidance.md", "text/markdown")}
                        className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium flex justify-center items-center gap-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
                      >
                        <Download className="w-5 h-5" /> {t.download_md}
                      </button>
                      <button 
                        onClick={() => handleDownload(editedMd, "Guidance.txt", "text/plain")}
                        className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium flex justify-center items-center gap-2 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Download className="w-5 h-5" /> {t.download_txt}
                      </button>
                    </div>
                  </div>

                  {/* WOW 4: Chat Assistant */}
                  <div className={cn("p-6 rounded-2xl border mt-12", theme === "Dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-slate-200")}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <MessageSquare className="w-6 h-6 text-indigo-500" />
                      {t.wow4}
                    </h2>
                    <div className={cn("h-80 overflow-y-auto p-4 rounded-xl mb-4 space-y-4", theme === "Dark" ? "bg-zinc-950" : "bg-slate-50")}>
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400">
                          Ask me anything about the uploaded document!
                        </div>
                      ) : (
                        chatHistory.map((msg, idx) => (
                          <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[80%] p-3 rounded-2xl", msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : (theme === "Dark" ? "bg-zinc-800 text-zinc-200 rounded-bl-none" : "bg-white border shadow-sm rounded-bl-none"))}>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className={cn("p-3 rounded-2xl rounded-bl-none flex items-center gap-2", theme === "Dark" ? "bg-zinc-800" : "bg-white border shadow-sm")}>
                            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleChat()}
                        placeholder={t.chat_placeholder}
                        className={cn("flex-1 p-3 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500", theme === "Dark" ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-white border-slate-300")}
                      />
                      {chatLoading ? (
                        <button 
                          onClick={handleStop}
                          className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2"
                        >
                          <Square className="w-4 h-4 fill-current" /> {t.stop}
                        </button>
                      ) : (
                        <button 
                          onClick={handleChat}
                          disabled={!chatInput.trim()}
                          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" /> {t.send}
                        </button>
                      )}
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
