"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Plus, Trash2, Menu, Sparkles, ChevronDown, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotes } from "@/contexts/notes-context";

interface Message {
  id?: string;
  role: "user" | "ai";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages?: Message[];
}

export function AIChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { refreshNotes } = useNotes();

  if (pathname === "/login") return null;

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchConversations();
  }, [isOpen]);

  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }
    fetchMessages(currentConversation);
  }, [currentConversation]);

  const fetchConversations = async () => {
    try {
      // Cookie is sent automatically by the browser
      const res = await fetch("/api/chat");

      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!currentConversation && data.conversations.length > 0) {
          setCurrentConversation(data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Cookie is sent automatically by the browser
      const res = await fetch(`/api/chat?conversationId=${conversationId}`);

      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleNewChat = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Cookie is sent automatically by the browser
      const res = await fetch(`/api/chat?conversationId=${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setConversations(conversations.filter(c => c.id !== id));
        if (currentConversation === id) {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    const optimisticMessage: Message = { role: "user", content: userMessage };
    setMessages(prev => [...prev, optimisticMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Cookie is sent automatically by the browser
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          message: userMessage,
          conversationId: currentConversation 
        })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: "ai", content: `Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", content: data.message }]);
        if (data.notesChanged) {
          refreshNotes();
        }
        if (!currentConversation && data.conversationId) {
          setCurrentConversation(data.conversationId);
          fetchConversations();
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Failed to connect to AI" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30"
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[550px] w-[720px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          
          {/* Sidebar */}
          {showSidebar && (
            <div className="flex w-56 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              {/* Sidebar Header */}
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">History</span>
                <Button
                  onClick={handleNewChat}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <div className="flex h-32 items-center justify-center p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                    No conversations yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`group relative cursor-pointer rounded-lg px-3 py-2.5 transition-all ${
                          currentConversation === conv.id
                            ? "bg-white shadow-sm dark:bg-slate-700"
                            : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                            {conv.title}
                          </p>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
              <Button
                onClick={() => setShowSidebar(!showSidebar)}
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">One Day AI</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isLoading ? "Thinking..." : "Ask me anything"}
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="relative flex-1 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-800/30"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
                    <Sparkles className="h-8 w-8 text-violet-500 dark:text-violet-400" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-slate-800 dark:text-white">
                    How can I help you?
                  </h3>
                  <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    Create, list, read, update, or delete your notes with natural language.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex max-w-[80%] items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        {msg.role === "ai" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            msg.role === "user"
                              ? "rounded-br-md bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                              : "rounded-bl-md bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-end gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm dark:bg-slate-700">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex h-8 items-center gap-1 rounded-full bg-white px-3 text-xs font-medium text-slate-600 shadow-lg transition-all hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  aria-label="Scroll to bottom"
                >
                  <ChevronDown className="h-4 w-4" />
                  New messages
                </button>
              )}
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-500"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
