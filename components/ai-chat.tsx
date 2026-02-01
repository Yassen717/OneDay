"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Plus, Trash2, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getToken } from "@/lib/auth";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  if (pathname === "/login") return null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load conversations when chat opens
  useEffect(() => {
    if (!isOpen) return;
    fetchConversations();
  }, [isOpen]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }
    fetchMessages(currentConversation);
  }, [currentConversation]);

  const fetchConversations = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch("/api/chat", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        // Auto-select first conversation if none selected
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
      const token = getToken();
      if (!token) return;

      const res = await fetch(`/api/chat?conversationId=${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = getToken();
      const res = await fetch(`/api/chat?conversationId=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
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
      const token = getToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
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
        
        // Update conversation ID for new chats
        if (!currentConversation && data.conversationId) {
          setCurrentConversation(data.conversationId);
          fetchConversations(); // Refresh conversation list
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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50"
        aria-label="Toggle chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[600px] w-[800px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
          {/* Sidebar */}
          {showSidebar && (
            <div className="flex w-64 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Chats</h3>
                <Button
                  onClick={handleNewChat}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Conversations List */}
              <ScrollArea className="flex-1 p-2">
                {conversations.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4 text-center text-sm text-gray-500">
                    No conversations yet. Start chatting!
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setCurrentConversation(conv.id)}
                        className={`group relative w-full cursor-pointer rounded-lg p-3 text-left transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          currentConversation === conv.id
                            ? "bg-white shadow-sm dark:bg-gray-800"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {conv.title}
                            </p>
                            {conv.messages && conv.messages.length > 0 && (
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {conv.messages[0].content}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowSidebar(!showSidebar)}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Toggle sidebar"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">One Day AI</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isLoading ? "Thinking..." : "Ready to help"}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20">
                    <Sparkles className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                    Start a conversation
                  </h3>
                  <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">
                    Ask me anything about your notes, ideas, or get creative suggestions!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex max-w-[85%] items-start gap-2">
                        {msg.role === "ai" && (
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm ${
                            msg.role === "user"
                              ? "rounded-tr-sm bg-gradient-to-br from-purple-600 to-blue-600 text-white"
                              : "rounded-tl-sm border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
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
                      <div className="flex items-start gap-2">
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask, search, or create anything..."
                  className="flex-1 rounded-xl border-gray-300 focus-visible:ring-purple-500 dark:border-gray-700"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
