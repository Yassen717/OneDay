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

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "asc" },
      take: 200
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

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

    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { userId: user.userId, role: "user", content: message }
      }),
      prisma.chatMessage.create({
        data: { userId: user.userId, role: "ai", content: aiMessage }
      })
    ]);

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
