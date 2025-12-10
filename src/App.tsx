import React, { useState, useRef } from 'react';
import { Upload, FileVideo, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight, X } from 'lucide-react';
import Lottie from 'lottie-react';
import { AnimatedBackground } from './components/Visuals';
import VideoPlayer from './components/VideoPlayer';
import IncidentTable from './components/IncidentTable';
import { analyzeVideoWithGemini } from './services/geminiService';
import { AppState, Severity } from '../types';
import { loadingAnimation } from './assets/loadingAnimation';


export interface FilterState {
  [Severity.LOW]: boolean;
  [Severity.MEDIUM]: boolean;
  [Severity.HIGH]: boolean;
}

export interface Incident {
  id: string;
  timestamp: string;
  seconds: number;
  severity: Severity;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  incidents: Incident[];
}





const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Video Player State
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Seek trigger object
  const [seekToRequest, setSeekToRequest] = useState<{ time: number; timestamp: number } | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    [Severity.LOW]: true,
    [Severity.MEDIUM]: true,
    [Severity.HIGH]: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const maxSize = 75 * 1024 * 1024; 
    
    if (!file.type.startsWith('video/')) {
      setErrorMsg("Please upload a valid video file (MP4, MOV, WebM).");
      return;
    }
    if (file.size > maxSize) {
      setErrorMsg("File size exceeds 75MB limit.");
      return;
    }

    setFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setAppState(AppState.ANALYZING);
    try {
      const result = await analyzeVideoWithGemini(file);
      setAnalysisResult(result);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "An unexpected error occurred during analysis.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setFile(null);
    setVideoUrl('');
    setAnalysisResult(null);
    setErrorMsg('');
    setSeekToRequest(null);
  };

  // --------------------------------------------------------------------------
  // Views
  // --------------------------------------------------------------------------

  const renderUploadView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-in fade-in duration-700 relative">
      
      <div className="text-center mb-12 relative z-10">
         <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-md mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">Next-Gen Surveillance</span>
         </div>
         <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tighter drop-shadow-sm leading-[0.9]">
           Sentinel<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500">AI</span>
         </h1>
         <p className="text-slate-500 text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed">
           Intelligent video analysis. Detect anomalies and threats with 
           <span className="text-slate-800 font-semibold"> frame-by-frame precision</span>.
         </p>
      </div>

      <div 
        className={`
          relative w-full max-w-xl p-10 rounded-[3rem] border transition-all duration-500 ease-out
          ${file 
            ? 'border-blue-500/30 bg-slate-900/5 shadow-[0_20px_60px_-10px_rgba(59,130,246,0.15)]' 
            : 'border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 hover:border-slate-900/20 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]'
          }
          backdrop-blur-2xl flex flex-col items-center justify-center group cursor-pointer
        `}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="video/*" 
          onChange={handleFileChange} 
        />
        
        {file ? (
          <div className="text-center w-full relative z-10">
             <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl shadow-blue-500/20 mb-6 transform group-hover:scale-105 transition-transform">
                <FileVideo size={32} />
             </div>
             <div>
               <p className="text-xl font-bold text-slate-800 mb-1">{file.name}</p>
               <p className="text-sm text-slate-400 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
             </div>
             
             <div className="flex gap-4 mt-8 justify-center">
               <button 
                  onClick={(e) => { e.stopPropagation(); startAnalysis(); }}
                  className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
               >
                 Analyze Footage <ArrowRight size={16} />
               </button>
               <button
                 onClick={(e) => { e.stopPropagation(); handleReset(); }}
                 className="px-6 py-4 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm transition-all"
               >
                 Cancel
               </button>
             </div>
          </div>
        ) : (
          <div className="text-center relative z-10 py-2">
            <div className="w-20 h-20 bg-white shadow-md border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:transition-all duration-300">
               <Upload size={32} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload Video</h3>
            <p className="text-slate-400 mb-8 max-w-[280px] mx-auto text-sm leading-relaxed">
              Drag and drop MP4, MOV, or WebM files here to begin analysis.
            </p>
            <span className="px-6 py-3 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm group-hover:shadow-md transition-all">
              Browse Files
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-8 flex items-center gap-3 text-red-600 bg-red-50 px-6 py-4 rounded-2xl border border-red-100 animate-in slide-in-from-bottom-4 shadow-sm">
          <AlertCircle size={20} className="text-red-500" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}
    </div>
  );

  const renderAnalyzingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center relative overflow-hidden">
      <div className="relative w-full max-w-md p-12 rounded-[3rem] border border-slate-900/10 bg-slate-900/5 backdrop-blur-2xl shadow-2xl flex flex-col items-center">
        
        <div className="w-48 h-48 mb-4">
          <Lottie animationData={loadingAnimation} loop={true} />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing</h2>
        <p className="text-slate-500 mb-6 text-sm">Analyzing frame by frame behavioral patterns...</p>
        
        <div className="flex gap-2">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-0"></span>
           <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-150"></span>
           <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce delay-300"></span>
        </div>
      </div>
    </div>
  );

  const renderResultsView = () => (
    <div className="h-screen flex flex-col overflow-hidden animate-in fade-in duration-700">
      {/* Navbar */}
      <header className="h-20 px-8 flex items-center justify-between glass-panel border-b-0 m-6 mb-0 rounded-2xl shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Analysis Report</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Complete</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleReset} 
          className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all text-sm font-bold text-slate-600"
        >
          <X size={16} className="group-hover:rotate-90 transition-transform" />
          Exit
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 pt-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left: Video Player & Summary */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full min-h-0">
            {/* Video Container */}
            <div className="relative flex-shrink-0 aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-slate-900">
              <VideoPlayer 
                videoUrl={videoUrl}
                incidents={analysisResult?.incidents || []}
                currentTime={currentVideoTime}
                onTimeUpdate={setCurrentVideoTime}
                onDurationChange={setVideoDuration}
                seekTo={seekToRequest}
              />
            </div>
            
            {/* Summary Card */}
            <div className="flex-1 rounded-3xl p-8 glass-panel overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Summary</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {analysisResult?.summary}
              </p>
            </div>
          </div>

          {/* Right: Results Table */}
          <div className="lg:col-span-7 h-full min-h-0">
            <IncidentTable 
              incidents={analysisResult?.incidents || []}
              currentTime={currentVideoTime}
              onIncidentClick={(seconds) => setSeekToRequest({ time: seconds, timestamp: Date.now() })}
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>
        </div>
      </main>
    </div>
  );

  const renderErrorView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      <div className="glass-panel p-10 rounded-[2.5rem] max-w-lg text-center relative z-10 border-red-100 shadow-xl">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
           <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analysis Failed</h2>
        <p className="text-slate-500 mb-8 text-sm">{errorMsg}</p>
        
        <div className="flex gap-4 justify-center">
           <button 
             onClick={handleReset}
             className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:scale-105 transition-transform"
           >
             Try Again
           </button>
           <button 
             onClick={() => setAppState(AppState.UPLOAD)}
             className="px-8 py-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors"
           >
             Go Back
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-white font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden text-slate-900">
      <AnimatedBackground />
      
      {appState === AppState.UPLOAD && renderUploadView()}
      {appState === AppState.ANALYZING && renderAnalyzingView()}
      {appState === AppState.RESULTS && renderResultsView()}
      {appState === AppState.ERROR && renderErrorView()}
    </div>
  );
};

export default App;







// import React, { useState, useRef } from 'react';
// import { Upload, FileVideo, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
// import { AnimatedBackground, FloatingShape } from './components/Visuals';
// import VideoPlayer from './components/VideoPlayer';
// import IncidentTable from './components/IncidentTable';
// import { analyzeVideoWithGemini } from './services/geminiService';
// import { AppState, Severity } from '../types';

// export interface Incident {
//   id: string;
//   timestamp: string;
//   seconds: number;
//   severity: Severity;
//   description: string;
// }


// export interface AnalysisResult {
//   summary: string;
//   incidents: Incident[];
// }

// export interface FilterState {
//   [Severity.LOW]: boolean;
//   [Severity.MEDIUM]: boolean;
//   [Severity.HIGH]: boolean;
// }


// const App: React.FC = () => {
//   const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
//   const [file, setFile] = useState<File | null>(null);
//   const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
//   const [errorMsg, setErrorMsg] = useState<string>('');
  
//   // Video Player State
//   const [videoUrl, setVideoUrl] = useState<string>('');
//   const [currentVideoTime, setCurrentVideoTime] = useState(0);
//   const [videoDuration, setVideoDuration] = useState(0);
//   const [seekToRequest, setSeekToRequest] = useState<number | null>(null);

//   // Filter State
//   const [filters, setFilters] = useState<FilterState>({
//     [Severity.LOW]: true,
//     [Severity.MEDIUM]: true,
//     [Severity.HIGH]: true,
//   });

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const selectedFile = e.target.files[0];
//       validateAndSetFile(selectedFile);
//     }
//   };

//   const validateAndSetFile = (file: File) => {
//     // 75MB limit as requested, though browsers struggle with >50MB base64
//     const maxSize = 75 * 1024 * 1024; 
    
//     if (!file.type.startsWith('video/')) {
//       setErrorMsg("Please upload a valid video file (MP4, MOV, WebM).");
//       return;
//     }
//     if (file.size > maxSize) {
//       setErrorMsg("File size exceeds 75MB limit.");
//       return;
//     }

//     setFile(file);
//     setVideoUrl(URL.createObjectURL(file));
//     setErrorMsg('');
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       validateAndSetFile(e.dataTransfer.files[0]);
//     }
//   };

//   const startAnalysis = async () => {
//     if (!file) return;

//     setAppState(AppState.ANALYZING);
//     try {
//       const result = await analyzeVideoWithGemini(file);
//       setAnalysisResult(result);
//       setAppState(AppState.RESULTS);
//     } catch (err: any) {
//       setAppState(AppState.ERROR);
//       setErrorMsg(err.message || "An unexpected error occurred during analysis.");
//     }
//   };

//   const handleReset = () => {
//     setAppState(AppState.UPLOAD);
//     setFile(null);
//     setVideoUrl('');
//     setAnalysisResult(null);
//     setErrorMsg('');
//   };

//   // Views
//   const renderUploadView = () => (
//     <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in duration-700">
//       <div className="text-center mb-8">
//          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-purple-500/30">
//             <ShieldAlert size={40} className="text-white" />
//          </div>
//          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-300 mb-2">
//            Sentinel AI
//          </h1>
//          <p className="text-gray-400 text-lg max-w-lg mx-auto">
//            Advanced surveillance analysis for detecting violent incidents using Computer Vision & Gemini Flash.
//          </p>
//       </div>

//       <div 
//         className={`
//           relative w-full max-w-xl p-10 rounded-3xl border-2 border-dashed transition-all duration-300
//           ${file 
//             ? 'border-cyan-500/50 bg-cyan-500/10' 
//             : 'border-white/20 bg-white/5 hover:border-cyan-400/50 hover:bg-white/10'
//           }
//           backdrop-blur-xl flex flex-col items-center justify-center group cursor-pointer
//         `}
//         onDragOver={handleDragOver}
//         onDrop={handleDrop}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         <input 
//           type="file" 
//           ref={fileInputRef} 
//           className="hidden" 
//           accept="video/*" 
//           onChange={handleFileChange} 
//         />
        
//         <FloatingShape type="cube" className="absolute -top-6 -right-6 animate-bounce delay-700" />
        
//         {file ? (
//           <div className="text-center space-y-4">
//              <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto text-cyan-400">
//                 <FileVideo size={40} />
//              </div>
//              <div>
//                <p className="text-xl font-medium text-white">{file.name}</p>
//                <p className="text-sm text-cyan-300 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
//              </div>
//              <button 
//                 onClick={(e) => { e.stopPropagation(); startAnalysis(); }}
//                 className="mt-4 px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-white shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition-all w-full"
//              >
//                Start Analysis
//              </button>
//              <button
//                onClick={(e) => { e.stopPropagation(); handleReset(); }}
//                className="text-sm text-gray-400 hover:text-white"
//              >
//                Remove file
//              </button>
//           </div>
//         ) : (
//           <div className="text-center space-y-4">
//             <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
//                <Upload size={32} className="text-gray-300 group-hover:text-cyan-300" />
//             </div>
//             <div>
//               <p className="text-xl font-medium text-white">Drag & Drop Video</p>
//               <p className="text-gray-400 mt-2">or click to browse files</p>
//             </div>
//             <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-4">
//               <span className="bg-white/5 px-2 py-1 rounded">MP4</span>
//               <span className="bg-white/5 px-2 py-1 rounded">MOV</span>
//               <span className="bg-white/5 px-2 py-1 rounded">AVI</span>
//               <span className="bg-white/5 px-2 py-1 rounded">Max 75MB</span>
//             </div>
//           </div>
//         )}
//       </div>

//       {errorMsg && (
//         <div className="mt-6 flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 animate-in slide-in-from-bottom-2">
//           <AlertCircle size={18} />
//           {errorMsg}
//         </div>
//       )}
//     </div>
//   );

//   const renderAnalyzingView = () => (
//     <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
//       <div className="relative w-32 h-32 mb-8">
//         <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
//         <div className="absolute inset-2 border-4 border-purple-500/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
//         <div className="absolute inset-0 flex items-center justify-center">
//           <Loader2 size={48} className="text-white animate-spin" />
//         </div>
//       </div>
      
//       <h2 className="text-3xl font-bold text-white mb-2 animate-pulse">Analyzing Video Content</h2>
//       <p className="text-cyan-200/70 max-w-md">
//         Gemini is scanning frame-by-frame for violent patterns, aggression, and threat levels.
//       </p>
      
//       <div className="mt-8 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
//         <div className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
//       </div>
//     </div>
//   );

//   const renderResultsView = () => (
//     <div className="h-screen flex flex-col p-4 md:p-6 overflow-hidden animate-in fade-in duration-500">
//       {/* Navbar */}
//       <div className="flex justify-between items-center mb-6">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg">
//             <ShieldAlert size={24} className="text-white" />
//           </div>
//           <div>
//             <h1 className="text-xl font-bold text-white leading-tight">Sentinel AI Report</h1>
//             <p className="text-xs text-gray-400">{file?.name}</p>
//           </div>
//         </div>
//         <button 
//           onClick={handleReset} 
//           className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-md"
//         >
//           New Analysis
//         </button>
//       </div>

//       {/* Content Grid */}
//       <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
//         {/* Left: Video Player */}
//         <div className="lg:col-span-5 flex flex-col gap-4 min-h-[300px]">
//           <div className="flex-1 relative rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/20">
//             <VideoPlayer 
//               videoUrl={videoUrl}
//               incidents={analysisResult?.incidents || []}
//               currentTime={currentVideoTime}
//               onTimeUpdate={setCurrentVideoTime}
//               onDurationChange={setVideoDuration}
//               seekTo={seekToRequest}
//             />
//           </div>
          
//           {/* Summary Card */}
//           <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-xl">
//             <h3 className="text-sm font-semibold text-cyan-400 mb-1 flex items-center gap-2">
//               <CheckCircle2 size={14} /> Executive Summary
//             </h3>
//             <p className="text-sm text-gray-300 leading-relaxed">
//               {analysisResult?.summary}
//             </p>
//           </div>
//         </div>

//         {/* Right: Results Table */}
//         <div className="lg:col-span-7 h-full min-h-[400px]">
//           <IncidentTable 
//             incidents={analysisResult?.incidents || []}
//             currentTime={currentVideoTime}
//             onIncidentClick={(seconds) => setSeekToRequest(seconds)}
//             filters={filters}
//             onFilterChange={setFilters}
//           />
//         </div>
//       </div>
//     </div>
//   );

//   const renderErrorView = () => (
//     <div className="flex flex-col items-center justify-center min-h-screen">
//       <div className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 backdrop-blur-xl max-w-md text-center">
//         <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
//         <h2 className="text-2xl font-bold text-white mb-2">Analysis Failed</h2>
//         <p className="text-red-200 mb-6">{errorMsg}</p>
//         <button 
//           onClick={handleReset}
//           className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
//         >
//           Try Again
//         </button>
//       </div>
//     </div>
//   );

//   return (
//     <div className="relative min-h-screen text-white font-sans selection:bg-cyan-500/30">
//       <AnimatedBackground />
      
//       {appState === AppState.UPLOAD && renderUploadView()}
//       {appState === AppState.ANALYZING && renderAnalyzingView()}
//       {appState === AppState.RESULTS && renderResultsView()}
//       {appState === AppState.ERROR && renderErrorView()}
//     </div>
//   );
// };

// export default App;