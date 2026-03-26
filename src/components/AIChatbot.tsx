import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Loader2, Bot, MessageCircle, GripVertical } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const quickQuestions = [
  "Which exams should I apply for?",
  "What deadlines are coming up?",
  "Suggest backup exams",
  "Give me a study strategy",
];

async function streamChat({ messages, onDelta, onDone, onError }: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages }),
    });
    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      if (resp.status === 429) { onError("Rate limited — please wait."); return; }
      if (resp.status === 402) { onError("AI credits exhausted."); return; }
      onError(errData.error || "AI service unavailable"); return;
    }
    if (!resp.body) { onError("No response stream"); return; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;
    while (!done) {
      const { done: d, value } = await reader.read();
      if (d) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
        const j = line.slice(6).trim();
        if (j === "[DONE]") { done = true; break; }
        try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); }
        catch { buf = line + "\n" + buf; break; }
      }
    }
    if (buf.trim()) {
      for (let raw of buf.split("\n")) {
        if (!raw || !raw.trim()) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || !raw.startsWith("data: ")) continue;
        const j = raw.slice(6).trim();
        if (j === "[DONE]") continue;
        try { const p = JSON.parse(j); const c = p.choices?.[0]?.delta?.content; if (c) onDelta(c); } catch {}
      }
    }
    onDone();
  } catch (e) { onError(e instanceof Error ? e.message : "Connection failed"); }
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "👋 **Hey!** I'm your ExamIntel AI assistant.\n\nI can help with:\n- 📅 **Exam deadlines** & schedules\n- 🎯 **Recommendations** for your profile\n- 📚 **Study strategies**\n- 🔍 **Exam comparisons**\n\nAsk me anything!" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [isDragging]);

  // Touch drag support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY, posX: position.x, posY: position.y };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      setPosition({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy });
    };
    const onTouchEnd = () => setIsDragging(false);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => { window.removeEventListener("touchmove", onTouchMove); window.removeEventListener("touchend", onTouchEnd); };
  }, [isDragging]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const all = [...messages, userMsg];
    setMessages(all);
    setInput("");
    setIsLoading(true);
    let soFar = "";
    await streamChat({
      messages: all.filter(m => m.content),
      onDelta: (chunk) => {
        soFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > all.length)
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: soFar } : m);
          return [...all, { role: "assistant", content: soFar }];
        });
      },
      onDone: () => setIsLoading(false),
      onError: (err) => { setMessages(p => [...p, { role: "assistant", content: `⚠️ ${err}` }]); setIsLoading(false); },
    });
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg, hsl(230, 80%, 56%), hsl(258, 65%, 58%))", boxShadow: open ? undefined : "0 4px 24px hsl(230 80% 56% / 0.4)" }}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-50 w-[calc(100vw-2.5rem)] sm:w-[420px] max-h-[75vh] sm:max-h-[580px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{
              bottom: `calc(5.5rem - ${position.y}px)`,
              right: `calc(1.25rem - ${position.x}px)`,
              cursor: isDragging ? "grabbing" : "auto",
            }}
          >
            {/* Draggable Header */}
            <div
              className="px-5 py-4 flex items-center gap-3 select-none"
              style={{ background: "linear-gradient(135deg, hsl(230, 80%, 56%), hsl(258, 65%, 58%))", cursor: "grab" }}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-base tracking-tight">ExamIntel AI</p>
                <p className="text-white/70 text-xs">Drag to move • Ask anything</p>
              </div>
              <div className="flex items-center gap-1">
                <GripVertical className="w-4 h-4 text-white/40" />
                <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-white/15 transition-colors">
                  <X className="w-4 h-4 text-white/80" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0 bg-background">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, hsl(230, 80%, 56%), hsl(258, 65%, 58%))" }}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground text-sm rounded-br-md"
                      : "bg-card border border-border text-foreground text-sm rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="chat-markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    ) : (
                      <span className="leading-relaxed">{msg.content}</span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, hsl(230, 80%, 56%), hsl(258, 65%, 58%))" }}>
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 2 && (
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                {quickQuestions.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-border bg-background">
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                <input
                  value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about exams..."
                  disabled={isLoading}
                  className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:opacity-50 transition-all"
                />
                <button type="submit" disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, hsl(230, 80%, 56%), hsl(258, 65%, 58%))" }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
