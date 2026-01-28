import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

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
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }

    return NextResponse.json({ message: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
