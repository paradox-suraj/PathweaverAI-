"use client";

import { useState } from "react";
import { saveApiKey } from "@/server/actions/settings";
import { Key } from "lucide-react";

export function ApiKeyForm() {
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    
    setStatus("loading");
    setMessage("");

    const result = await saveApiKey(provider, apiKey);

    if (result.success) {
      setStatus("success");
      setMessage("API key saved successfully (encrypted).");
      setApiKey(""); // Clear the input for security
    } else {
      setStatus("error");
      setMessage(result.error || "Failed to save API key.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-text-primary flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            Custom API Key
          </h3>
          <p className="text-sm text-text-muted">Bring your own key to bypass rate limits.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">Provider</label>
          <select 
            value={provider} 
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
          >
            <option value="gemini">Gemini (Google)</option>
            <option value="openai">OpenAI</option>
            <option value="groq">Groq</option>
            <option value="mistral">Mistral</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-text-primary mb-1">API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key..."
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {message && (
          <p className={`text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <button 
          type="submit"
          disabled={status === "loading" || !apiKey}
          className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Saving..." : "Save Key Securely"}
        </button>
      </div>
    </form>
  );
}
