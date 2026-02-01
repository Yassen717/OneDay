import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

function getUserFromToken(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!decoded.userId) return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

// GET: List all conversations or get messages for a specific conversation
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // IMPORTANT: Verify user exists in database
    // This check prevents foreign key constraint errors that commonly occur after:
    // 1. Running migrations that reset the database (deletes all data)
    // 2. JWT token is still valid but references a deleted user
    // Solution: User must log out and log in again to get a new valid userId
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    if (!userExists) {
      return NextResponse.json({ error: "User not found. Please log in again." }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    // If conversationId is provided, get messages for that conversation
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

    // Otherwise, return all conversations
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
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // IMPORTANT: Verify user exists in database
    // This check prevents foreign key constraint errors that commonly occur after:
    // 1. Running migrations that reset the database (deletes all data)
    // 2. JWT token is still valid but references a deleted user
    // Solution: User must log out and log in again to get a new valid userId
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    if (!userExists) {
      return NextResponse.json({ error: "User not found. Please log in again." }, { status: 401 });
    }

    const { message, conversationId } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // Verify conversation belongs to user if provided
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
      role: msg.role === "ai" ? "assistant" : msg.role,
      content: msg.content
    }));

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
            content: "You are One Day AI, a helpful assistant for the One Day app. One Day is a beautiful note-taking app where users capture their ideas and thoughts in one place. Help users with their questions, provide creative suggestions, and assist with organizing their thoughts. Be friendly, concise, and helpful."
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

    const aiMessage = data.choices?.[0]?.message?.content;
    if (!aiMessage) {
      return NextResponse.json({ error: "No AI response" }, { status: 500 });
    }

    // Generate a title for new conversations based on first message
    const title = !convId && message.length > 0 
      ? message.slice(0, 50) + (message.length > 50 ? "..." : "")
      : undefined;

    const result = await prisma.$transaction(async (tx) => {
      // Create conversation if it doesn't exist
      if (!convId) {
        const newConv = await tx.chatConversation.create({
          data: { 
            userId: user.userId,
            title: title || "New Chat"
          }
        });
        convId = newConv.id;
      } else {
        // Update conversation timestamp
        await tx.chatConversation.update({
          where: { id: convId },
          data: { updatedAt: new Date() }
        });
      }

      // Save both messages
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

    return NextResponse.json({ 
      message: aiMessage,
      conversationId: result.conversationId
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// DELETE: Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // IMPORTANT: Verify user exists in database
    // This check prevents foreign key constraint errors that commonly occur after:
    // 1. Running migrations that reset the database (deletes all data)
    // 2. JWT token is still valid but references a deleted user
    // Solution: User must log out and log in again to get a new valid userId
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    if (!userExists) {
      return NextResponse.json({ error: "User not found. Please log in again." }, { status: 401 });
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
