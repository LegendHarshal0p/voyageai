import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatPanel } from "@/components/chat/ChatPanel";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 overflow-hidden rounded-lg border border-border shadow-xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <p className="text-sm font-medium text-primary-foreground">VoyageAI Assistant</p>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
          <ChatPanel
            heightClassName="h-72"
            placeholder="Ask me about destinations, packing, budgeting, or anything travel-related."
          />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Open AI assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
