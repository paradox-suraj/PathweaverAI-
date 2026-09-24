"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Loader2, Play, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

type LessonCodeTabProps = {
  topicId: string;
  initialCode: string;
  instructions: string;
  language: string;
  solutionCode?: string | null;
};

export function LessonCodeTab({ topicId, initialCode, instructions, language, solutionCode }: LessonCodeTabProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const handleRunCode = () => {
    setIsRunning(true);
    setOutput("");
    
    // Simple client-side execution for JS/TS
    if (language === 'javascript' || language === 'typescript') {
      try {
        const logs: string[] = [];
        const originalLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" "));
          originalLog(...args);
        };

        // eslint-disable-next-line no-new-func
        const fn = new Function(code);
        fn();
        
        console.log = originalLog;
        setOutput(logs.join("\n") || "Code executed successfully with no output.");
      } catch (err: any) {
        setOutput(`Error: ${err.message}`);
      }
    } else {
      setOutput(`Execution for ${language} is not supported in the browser yet.\nYou can still use this editor for practice!`);
    }
    
    setIsRunning(false);
  };

  return (
    <div className="flex-1 flex flex-col p-sp-4 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="font-headline-md text-text-primary">Code Challenge</h3>
        <div className="flex gap-2">
          {solutionCode && (
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 rounded-lg border border-white/10 font-label-sm text-text-secondary transition-colors"
            >
              {showSolution ? "Hide Solution" : "Show Solution"}
            </button>
          )}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-1.5 bg-primary hover:bg-primary-container text-white rounded-lg font-label-sm shadow-glow-primary transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Code
          </button>
        </div>
      </div>

      <div className="bg-surface-2 p-4 rounded-xl border border-white/5 mb-4 shrink-0 max-h-40 overflow-y-auto">
        <p className="font-body-sm text-text-secondary whitespace-pre-wrap">{instructions}</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[300px]">
        <div className="flex-1 rounded-xl overflow-hidden border border-white/10 relative">
          {showSolution && solutionCode ? (
            <Editor
              height="100%"
              defaultLanguage={language}
              theme="vs-dark"
              value={solutionCode}
              options={{ readOnly: true, minimap: { enabled: false } }}
            />
          ) : (
            <Editor
              height="100%"
              defaultLanguage={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{ minimap: { enabled: false }, padding: { top: 16 } }}
            />
          )}
        </div>
        
        <div className="w-full lg:w-1/3 bg-black/50 border border-white/10 rounded-xl p-4 flex flex-col">
          <div className="font-label-mono text-text-muted mb-2">Console Output</div>
          <pre className="flex-1 overflow-y-auto font-mono text-sm text-text-primary whitespace-pre-wrap p-2 bg-black rounded border border-white/5">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
