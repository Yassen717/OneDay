import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateUserFromRequest } from "@/lib/auth";

type NoteAction = {
  action: "list" | "read" | "update" | "delete" | "create" | "none";
  noteId?: string;
  query?: string;
  text?: string;
  limit?: number;
  title?: string;
  description?: string;
  selection?: number;
};

const ACTION_SYSTEM_PROMPT = `You are a routing assistant for a notes app.
Return ONLY valid JSON. No markdown, no code blocks.

Detect whether the user wants to list, read, update, delete, or create notes.

Output schema (exact keys):
{
  "action": "list" | "read" | "update" | "delete" | "create" | "none",
  "noteId": string | null,
  "query": string | null,
  "text": string | null,
  "limit": number | null,
  "title": string | null,
  "description": string | null,
  "selection": number | null
}

Rules:
- If the user wants to create a note, use action "create" and set title and description if provided (description can be the note content if only one field is given).
- If the user clearly wants to list notes, use action "list" and set limit if asked.
- If the user refers to a specific note by ID, set noteId.
- If the user refers by content (e.g., "the note about taxes"), set query.
- For update, set text to the new note content.
- If the user is answering a previous list ("the second one", "#2"), set selection to a 1-based index and keep the action consistent with the previous request. If possible, also set query based on the earlier list/context.
- If not a notes action, set action "none".
- Keep strings concise.
`;

function safeParseAction(jsonText: string): NoteAction {
  try {
    // Try to extract JSON from possible markdown code blocks
    let cleanJson = jsonText.trim();
    if (cleanJson.startsWith("```") ) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const data = JSON.parse(cleanJson) as {
      action?: string;
      noteId?: string | null;
      query?: string | null;
      text?: string | null;
      limit?: number | null;
      title?: string | null;
      description?: string | null;
      selection?: number | null;
    };
    const action = data.action;
    if (action === "list" || action === "read" || action === "update" || action === "delete" || action === "create") {
      return {
        action,
        noteId: data.noteId ?? undefined,
        query: data.query ?? undefined,
        text: data.text ?? undefined,
        limit: data.limit ?? undefined,
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        selection: typeof data.selection === "number" ? data.selection : undefined
      };
    }
    return { action: "none" };
  } catch (e) {
    console.error("[AI Chat] Failed to parse action JSON:", jsonText, e);
    return { action: "none" };
  }
}

async function detectNoteAction(
  message: string,
  contextMessages: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<NoteAction> {
  try {
    console.log("[AI Chat] Detecting action for message:", message);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0,
        messages: [
          { role: "system", content: ACTION_SYSTEM_PROMPT },
          ...contextMessages,
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    console.log("[AI Chat] Action detection raw response:", JSON.stringify(data));
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.log("[AI Chat] No content in action response");
      return { action: "none" };
    }
    const parsed = safeParseAction(content);
    console.log("[AI Chat] Parsed action:", JSON.stringify(parsed));
    return parsed;
  } catch (err) {
    console.error("[AI Chat] Error detecting action:", err);
    return { action: "none" };
  }
}

function extractNumberedItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^\d+\.\s+(.*)$/);
      return match ? match[1].trim() : null;
    })
    .filter((item): item is string => Boolean(item));
}

function getLatestAssistantList(history: Array<{ role: string; content: string }>): string[] {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === "ai") {
      const items = extractNumberedItems(history[i].content || "");
      if (items.length > 0) return items;
    }
  }
  return [];
}

// GET: List all conversations or get messages for a specific conversation
export async function GET(request: NextRequest) {
  try {
    const user = await validateUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    if (conversationId) {
      const messages = await prisma.chatMessage.findMany({
        where: { 
          conversationId,
          userId: user.userId 
        },
        orderBy: { createdAt: "asc" }
      });

      return NextResponse.json({ messages });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { userId: user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: Send a message to a conversation
export async function POST(request: NextRequest) {
  try {
    const user = await validateUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    let convId = conversationId;
    if (convId) {
      const conv = await prisma.chatConversation.findFirst({
        where: { id: convId, userId: user.userId }
      });
      if (!conv) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    }

    // Get conversation history for context
    const history = convId ? await prisma.chatMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 10
    }) : [];

    const contextMessages = history.map(msg => ({
      role: (msg.role === "ai" ? "assistant" : msg.role) as "user" | "assistant",
      content: msg.content
    }));

    // Detect if user wants to perform a note action
    const actionContext = contextMessages.slice(-6);
    const action = await detectNoteAction(message, actionContext);
    console.log("[AI Chat] Final action to execute:", action.action);

    let aiMessage: string | undefined;

    if (action.action !== "none") {
      // Handle CREATE action
      if (action.action === "create") {
        let noteText = action.description || action.title || "";
        if (!noteText.trim()) {
          aiMessage = "What should the note say? Please provide a title or description.";
        } else {
          const note = await prisma.note.create({
            data: {
              text: action.description ? `${action.title ? action.title + ': ' : ''}${action.description}` : noteText,
              color: "bg-yellow-200", // or random color if you want
              userId: user.userId
            }
          });
          aiMessage = `I've created a new note: ${note.text}`;
        }
      }
      // Handle LIST action
      if (action.action === "list") {
        const limit = Math.min(Math.max(action.limit ?? 10, 1), 20);
        const notes = await prisma.note.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: "desc" },
          take: limit
        });

        if (notes.length === 0) {
          aiMessage = "You don't have any notes yet.";
        } else {
          const list = notes
            .map((n, i) => `${i + 1}. ${n.text}`)
            .join("\n");
          aiMessage = `Here are your latest notes:\n${list}`;
        }
      }

      // Handle READ action
      if (action.action === "read") {
        if (action.noteId) {
          const note = await prisma.note.findFirst({
            where: { id: action.noteId, userId: user.userId }
          });
          aiMessage = note
            ? `Here's the note:\n${note.text}`
            : "I couldn't find a note with that id.";
        } else if (action.selection) {
          const index = Math.max(1, action.selection) - 1;
          if (action.query) {
            const allNotes = await prisma.note.findMany({
              where: { userId: user.userId },
              orderBy: { createdAt: "desc" }
            });
            const queryLower = action.query.toLowerCase();
            const matches = allNotes.filter(n => n.text.toLowerCase().includes(queryLower));
            const selected = matches[index];
            aiMessage = selected
              ? `Here's the note:\n${selected.text}`
              : "I couldn't find that note. Which one did you mean?";
          } else {
            const items = getLatestAssistantList(history);
            const snippetRaw = items[index];
            if (!snippetRaw) {
              aiMessage = "Which note do you mean? Describe what it's about.";
            } else {
              const snippet = snippetRaw.replace(/\.\.\.$/, "").trim().toLowerCase();
              const allNotes = await prisma.note.findMany({
                where: { userId: user.userId },
                orderBy: { createdAt: "desc" }
              });
              const selected = allNotes.find(n => n.text.toLowerCase().includes(snippet));
              aiMessage = selected
                ? `Here's the note:\n${selected.text}`
                : "I couldn't find that note. Describe what it's about.";
            }
          }
        } else if (action.query) {
          // SQLite doesn't support case-insensitive contains, so filter in JS
          const allNotes = await prisma.note.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" }
          });
          const queryLower = action.query.toLowerCase();
          const matches = allNotes.filter(n => n.text.toLowerCase().includes(queryLower)).slice(0, 3);
          
          if (matches.length === 0) {
            aiMessage = "I couldn't find any notes matching that description.";
          } else if (matches.length === 1) {
            aiMessage = `Here's the note:\n${matches[0].text}`;
          } else {
            const list = matches
              .map((n, i) => `${i + 1}. ${n.text.slice(0, 120)}${n.text.length > 120 ? "..." : ""}`)
              .join("\n");
            aiMessage = `I found multiple matches. Which one do you mean?\n${list}`;
          }
        } else {
          aiMessage = "Which note do you want me to read? Describe what it's about.";
        }
      }

      // Handle UPDATE action
      if (action.action === "update") {
        if (!action.text || action.text.trim().length === 0) {
          aiMessage = "What should the updated note say?";
        } else if (action.noteId) {
          const note = await prisma.note.findFirst({
            where: { id: action.noteId, userId: user.userId }
          });
          if (!note) {
            aiMessage = "I couldn't find a note with that id.";
          } else {
            await prisma.note.update({
              where: { id: note.id },
              data: { text: action.text.trim() }
            });
            aiMessage = "Done! I've updated the note. Refresh the page to see the changes.";
          }
        } else if (action.selection) {
          const index = Math.max(1, action.selection) - 1;
          if (action.query) {
            const allNotes = await prisma.note.findMany({
              where: { userId: user.userId },
              orderBy: { createdAt: "desc" }
            });
            const queryLower = action.query.toLowerCase();
            const matches = allNotes.filter(n => n.text.toLowerCase().includes(queryLower));
            const selected = matches[index];
            if (!selected) {
              aiMessage = "I couldn't find that note. Which one should I update?";
            } else {
              await prisma.note.update({
                where: { id: selected.id },
                data: { text: action.text.trim() }
              });
              aiMessage = "Done! I've updated the note. Refresh the page to see the changes.";
            }
          } else {
            const items = getLatestAssistantList(history);
            const snippetRaw = items[index];
            if (!snippetRaw) {
              aiMessage = "Which note should I update? Describe what it's about.";
            } else {
              const snippet = snippetRaw.replace(/\.\.\.$/, "").trim().toLowerCase();
              const allNotes = await prisma.note.findMany({
                where: { userId: user.userId },
                orderBy: { createdAt: "desc" }
              });
              const selected = allNotes.find(n => n.text.toLowerCase().includes(snippet));
              if (!selected) {
                aiMessage = "I couldn't find that note. Describe what it's about.";
              } else {
                await prisma.note.update({
                  where: { id: selected.id },
                  data: { text: action.text.trim() }
                });
                aiMessage = "Done! I've updated the note. Refresh the page to see the changes.";
              }
            }
          }
        } else if (action.query) {
          const allNotes = await prisma.note.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" }
          });
          const queryLower = action.query.toLowerCase();
          const matches = allNotes.filter(n => n.text.toLowerCase().includes(queryLower)).slice(0, 3);
          
          if (matches.length === 0) {
            aiMessage = "I couldn't find any notes matching that description.";
          } else if (matches.length === 1) {
            await prisma.note.update({
              where: { id: matches[0].id },
              data: { text: action.text.trim() }
            });
            aiMessage = "Done! I've updated the note. Refresh the page to see the changes.";
          } else {
            const list = matches
              .map((n, i) => `${i + 1}. ${n.text.slice(0, 120)}${n.text.length > 120 ? "..." : ""}`)
              .join("\n");
            aiMessage = `I found multiple matches. Which one should I update?\n${list}`;
          }
        } else {
          aiMessage = "Which note should I update? Describe what it's about.";
        }
      }

      // Handle DELETE action
      if (action.action === "delete") {
        if (action.noteId) {
          const note = await prisma.note.findFirst({
            where: { id: action.noteId, userId: user.userId }
          });
          if (!note) {
            aiMessage = "I couldn't find a note with that id.";
          } else {
            await prisma.note.delete({ where: { id: note.id } });
            aiMessage = "Done! I've deleted the note. Refresh the page to see the changes.";
          }
        } else if (action.selection) {
          const index = Math.max(1, action.selection) - 1;
          if (action.query) {
            const allNotes = await prisma.note.findMany({
              where: { userId: user.userId },
              orderBy: { createdAt: "desc" }
            });
            const queryLower = action.query.toLowerCase();
            const matches = allNotes.filter(n => n.text.toLowerCase().includes(queryLower));
            const selected = matches[index];
            if (!selected) {
              aiMessage = "I couldn't find that note. Which one should I delete?";
            } else {
              await prisma.note.delete({ where: { id: selected.id } });
              aiMessage = "Done! I've deleted the note. Refresh the page to see the changes.";
            }
          } else {
            const items = getLatestAssistantList(history);
            const snippetRaw = items[index];
            if (!snippetRaw) {
              aiMessage = "Which note should I delete? Describe what it's about.";
            } else {
              const snippet = snippetRaw.replace(/\.\.\.$/, "").trim().toLowerCase();
              const allNotes = await prisma.note.findMany({
                where: { userId: user.userId },
                orderBy: { createdAt: "desc" }
              });
              const selected = allNotes.find(n => n.text.toLowerCase().includes(snippet));
              if (!selected) {
                aiMessage = "I couldn't find that note. Describe what it's about.";
              } else {
                await prisma.note.delete({ where: { id: selected.id } });
                aiMessage = "Done! I've deleted the note. Refresh the page to see the changes.";
              }
            }
          }
        } else if (action.query) {
          const allNotes = await prisma.note.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" }
          });
          const queryLower = action.query.toLowerCase();
          const matches = allNotes.filter(n => n.text.toLowerCase().includes(queryLower)).slice(0, 3);
          
          if (matches.length === 0) {
            aiMessage = "I couldn't find any notes matching that description.";
          } else if (matches.length === 1) {
            await prisma.note.delete({ where: { id: matches[0].id } });
            aiMessage = "Done! I've deleted the note. Refresh the page to see the changes.";
          } else {
            const list = matches
              .map((n, i) => `${i + 1}. ${n.text.slice(0, 120)}${n.text.length > 120 ? "..." : ""}`)
              .join("\n");
            aiMessage = `I found multiple matches. Which one should I delete?\n${list}`;
          }
        } else {
          aiMessage = "Which note should I delete? Describe what it's about.";
        }
      }
    }

    // If no note action was detected or handled, fall back to regular chat
    if (!aiMessage) {
      // Check if user was asking about notes but action detection failed
      const lowerMessage = message.toLowerCase();
      const isNotesRequest = /\b(list|show|read|get|see|view|delete|remove|edit|update|change)\b.*\b(note|notes)\b|\bnotes?\b.*\b(list|show|read|get|see|view|delete|remove|edit|update|change)\b/i.test(message);
      
      if (isNotesRequest) {
        // User asked about notes but action detection failed - fetch and show real notes
        const notes = await prisma.note.findMany({
          where: { userId: user.userId },
          orderBy: { createdAt: "desc" },
          take: 10
        });
        
        if (notes.length === 0) {
          aiMessage = "You don't have any notes yet. Create some notes and I can help you manage them!";
        } else {
          const list = notes
            .map((n, i) => `${i + 1}. ${n.text}`)
            .join("\n");
          aiMessage = `Here are your notes:\n${list}\n\nYou can ask me to read, update, or delete any of these by describing what the note is about.`;
        }
      } else {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "You are One Day AI, a helpful assistant for the One Day app - a note-taking app. IMPORTANT: You cannot see the user's notes directly in this conversation. If the user asks to list, read, update, or delete notes, tell them to try again with a clear request like 'list my notes' or 'show my notes'. Do NOT make up or invent fake notes. Be friendly, concise, and helpful with general questions."
              },
              ...contextMessages,
              { role: "user", content: message }
            ]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Groq API error:", response.status, data);
          return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
        }

        aiMessage = data.choices?.[0]?.message?.content;
        if (!aiMessage) {
          return NextResponse.json({ error: "No AI response" }, { status: 500 });
        }
      }
    }

    // Generate a title for new conversations based on first message
    const title = !convId && message.length > 0 
      ? message.slice(0, 50) + (message.length > 50 ? "..." : "")
      : undefined;

    const result = await prisma.$transaction(async (tx) => {
      if (!convId) {
        const newConv = await tx.chatConversation.create({
          data: { 
            userId: user.userId,
            title: title || "New Chat"
          }
        });
        convId = newConv.id;
      } else {
        await tx.chatConversation.update({
          where: { id: convId },
          data: { updatedAt: new Date() }
        });
      }

      await tx.chatMessage.create({
        data: { 
          userId: user.userId, 
          conversationId: convId,
          role: "user", 
          content: message 
        }
      });
      
      await tx.chatMessage.create({
        data: { 
          userId: user.userId, 
          conversationId: convId,
          role: "ai", 
          content: aiMessage 
        }
      });

      return { conversationId: convId };
    });

    // Signal notesChanged if the action was create, update, or delete
    const notesChanged = ["create", "update", "delete"].includes(action.action);
    return NextResponse.json({ 
      message: aiMessage,
      conversationId: result.conversationId,
      ...(notesChanged ? { notesChanged: true } : {})
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// DELETE: Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const user = await validateUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId: user.userId }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await prisma.chatConversation.delete({
      where: { id: conversationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chat error:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
