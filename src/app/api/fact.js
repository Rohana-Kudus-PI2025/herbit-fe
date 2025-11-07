// pages/api/fact.js
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
      model: "mixtral-8x7b-32768",
      temperature: 0.8,
      max_tokens: 200,
    });

    const text = completion.choices[0]?.message?.content || "Mendaur ulang aluminium menghemat hingga 95% energi.";
    
    return res.status(200).json({
      fact: text,
      source: {
        title: "Groq AI - Fakta Lingkungan"
      }
    });
  } catch (error) {
    console.error('Error fetching fact:', error);
    return res.status(200).json({
      fact: "Mendaur ulang aluminium menghemat hingga 95% energi.",
      source: {
        title: "US EPA – Recycling Basics"
      }
    });
  }
}