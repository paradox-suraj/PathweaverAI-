"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export function LessonChatTab({ 
  topicId, 
  getCurrentTimestamp 
}: { 
  topicId: string;
  getCurrentTimestamp?: () => number | null;
}) {
  const { messages, status, sendMessage } = useChat({
    messages: [
      {
        id: "welcome",
        role: "assistant" as any,
        parts: [{ type: "text", text: "Hi! I'm your PathWeaver AI Assistant. I'm ready to help you with this lesson. What would you like to know?" }]
      }
    ]
  });

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const videoTimestamp = getCurrentTimestamp ? getCurrentTimestamp() : null;
    sendMessage({ text: input }, { body: { topicId, videoTimestamp } });
    setInput("");
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto hide-scrollbar p-sp-4 flex flex-col gap-4">
        {messages.map((m: any) => (
          <div 
            key={m.id} 
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 font-body-sm ${
                m.role === 'user' 
                  ? 'bg-primary-gradient text-white shadow-glow-primary rounded-tr-none' 
                  : 'bg-surface-2 border border-white/10 text-text-primary rounded-tl-none'
              }`}
            >
              {m.parts ? m.parts.map((part: any, i: number) => (
                part.type === 'text' ? <span key={i}>{part.text}</span> : null
              )) : (
                <span>{m.content}</span>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-surface-2 border border-white/10 rounded-2xl rounded-tl-none p-3">
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat Input */}
      <div className="p-3 border-t border-white/10 bg-surface-1 shrink-0 mt-auto">
        <form 
          onSubmit={handleSubmit}
          className="relative flex items-center bg-black/20 border border-white/10 rounded-lg focus-within:border-primary focus-within:shadow-glow-primary transition-all"
        >
          <input 
            value={input}
            onChange={handleInputChange}
            className="w-full bg-transparent border-none text-text-primary font-body-sm p-3 focus:ring-0 placeholder:text-text-muted" 
            placeholder="Ask a question about the lesson..." 
            type="text" 
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-1.5 bg-primary/20 text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
