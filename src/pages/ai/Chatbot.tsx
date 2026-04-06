import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      text: "Hello! I'm your AI Tutor. What subject would you like to learn about today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("API Key check:", apiKey ? "present" : "missing", apiKey?.substring(0, 10));

      if (!apiKey) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "model", text: "Error: VITE_GEMINI_API_KEY not found in environment. Please add it to .env file." },
        ]);
        setLoading(false);
        return;
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const contents = messages.map((msg) => ({ role: msg.role, parts: [{ text: msg.text }] }));
      contents.push({ role: "user", parts: [{ text: userMessage.text }] });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: "You are a helpful, encouraging, and knowledgeable AI tutor. Explain concepts clearly, use analogies when helpful, and ask guiding questions to check understanding. Keep responses concise and engaging.",
        }
      });

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: response.text || "I'm sorry, I couldn't generate a response.",
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "model", text: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-73px)] max-w-4xl mx-auto w-full p-4 sm:p-8">
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 flex flex-col flex-1 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center gap-4 bg-amber-50">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">AI Tutor Chat</h1>
            <p className="text-sm text-neutral-600">Ask me anything about math, science, history, or more!</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
                }`}
              >
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="markdown-body prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2 text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-neutral-200">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input
              type="text"
              placeholder="Type your question here..."
              className="flex-1 px-6 py-4 bg-neutral-100 border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}