import { useEffect, useRef, useState } from "react";
import { chatWithAssistant } from "@/services/groq";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({
  tripContext,
  placeholder,
  heightClassName = "h-80",
}: {
  tripContext?: string;
  placeholder?: string;
  heightClassName?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const context =
        tripContext ??
        "General travel planning assistant for VoyageAI. No specific trip is open right now.";
      const reply = await chatWithAssistant(text, context);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The assistant is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden">
      <div ref={scrollRef} className={cn("space-y-3 overflow-y-auto bg-card p-4", heightClassName)}>
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {placeholder ?? "Ask me anything about your trip."}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-auto bg-accent text-accent-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
