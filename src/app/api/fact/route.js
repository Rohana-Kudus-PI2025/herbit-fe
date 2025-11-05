// app/api/fact/route.js
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET() {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Kamu adalah asisten yang memberikan fakta menarik tentang daur ulang dan lingkungan dalam bahasa Indonesia. Berikan fakta singkat dan sumbernya."
        },
        {
          role: "user",
          content: "Berikan satu fakta menarik tentang daur ulang atau lingkungan."
        }
      ],
      model: "llama-3.3-70b-versatile", // ✅ Model yang masih aktif
      temperature: 0.8,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || "Mendaur ulang aluminium menghemat hingga 95% energi.";
    
    return NextResponse.json({
      fact: text,
      source: {
        title: "Groq AI - Fakta Lingkungan"
      }
    });
  } catch (error) {
    console.error('Error fetching fact:', error);
    return NextResponse.json(
      {
        fact: "Mendaur ulang aluminium menghemat hingga 95% energi.",
        source: {
          title: "US EPA – Recycling Basics"
        }
      },
      { status: 200 }
    );
  }
}