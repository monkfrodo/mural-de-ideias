"use client";

import { useState, useEffect, useCallback } from "react";

type Idea = {
  id: string;
  name: string;
  message: string;
  color: string;
  rotation: number;
  isNew?: boolean;
};

const COLORS = ["yellow", "pink", "blue", "green", "purple", "orange"];

const COLOR_MAP: Record<string, { bg: string; shadow: string }> = {
  yellow: { bg: "bg-yellow", shadow: "shadow-yellow-dark/20" },
  pink: { bg: "bg-pink", shadow: "shadow-pink-dark/20" },
  blue: { bg: "bg-blue", shadow: "shadow-blue-dark/20" },
  green: { bg: "bg-green", shadow: "shadow-green-dark/20" },
  purple: { bg: "bg-purple", shadow: "shadow-purple-dark/20" },
  orange: { bg: "bg-orange", shadow: "shadow-orange-dark/20" },
};

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getRandomRotation() {
  return Math.floor(Math.random() * 9) - 4;
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      if (!res.ok) throw new Error("Falha ao carregar ideias");
      const data = await res.json();
      setIdeas(data);
      setError("");
    } catch {
      setError("Sem conexão com o Notion. Modo offline ativo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const color = getRandomColor();
    const rotation = getRandomRotation();

    setSending(true);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          color,
          rotation,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      const newIdea = await res.json();
      setIdeas((prev) => [{ ...newIdea, isNew: true }, ...prev]);
      setMessage("");
      setError("");
    } catch {
      // Fallback: add locally
      setIdeas((prev) => [
        {
          id: String(Date.now()),
          name: name.trim(),
          message: message.trim(),
          color,
          rotation,
          isNew: true,
        },
        ...prev,
      ]);
      setMessage("");
      setError("Salvo localmente (Notion indisponível)");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Header */}
      <header className="bg-[#3e2723] border-b-4 border-[#8d6e63] px-4 py-5 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#ffcc80] tracking-tight text-center">
            Mural de Ideias
          </h1>
          <p className="text-[#bcaaa4] text-sm text-center mt-1">
            Cole sua ideia no quadro!
          </p>
        </div>
      </header>

      {/* Form */}
      <div className="bg-[#4e342e] border-b-2 border-[#6d4c41] px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-[#6d4c41] text-[#fff8e1] placeholder-[#bcaaa4] text-sm border border-[#8d6e63] focus:outline-none focus:ring-2 focus:ring-[#ffcc80]/50 sm:w-44"
          />
          <input
            type="text"
            placeholder="Sua ideia..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-[#6d4c41] text-[#fff8e1] placeholder-[#bcaaa4] text-sm border border-[#8d6e63] focus:outline-none focus:ring-2 focus:ring-[#ffcc80]/50 flex-1"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2.5 bg-[#ffcc80] text-[#3e2723] rounded-lg text-sm font-bold hover:bg-[#ffd54f] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {sending ? "Colando..." : "Colar no mural"}
          </button>
        </form>

        {error && (
          <p className="text-[#ffab91] text-xs text-center mt-2">{error}</p>
        )}
      </div>

      {/* Cork Board */}
      <div className="cork-board flex-1 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-[#bcaaa4] text-lg">
              Carregando ideias...
            </div>
          ) : ideas.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-[#bcaaa4]/60 text-lg">
              Nenhuma ideia ainda. Seja o primeiro a colar!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {ideas.map((idea) => {
                const colorStyle = COLOR_MAP[idea.color] ?? COLOR_MAP.yellow;
                return (
                  <div
                    key={idea.id}
                    className={`sticker ${idea.isNew ? "sticker-new" : ""} ${colorStyle.bg} p-5 pt-6 pb-4 rounded-sm shadow-lg min-h-[140px] flex flex-col justify-between`}
                    style={{ transform: `rotate(${idea.rotation}deg)` }}
                  >
                    <div className="pin" />
                    <p className="text-foreground/85 text-sm leading-relaxed whitespace-pre-wrap break-words flex-1">
                      {idea.message}
                    </p>
                    <p className="text-foreground/45 text-xs font-semibold text-right mt-3 italic">
                      — {idea.name}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
