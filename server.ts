import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// AI Routes
app.post("/api/quiz/analyze", async (req, res) => {
  try {
    const { content, type } = req.body; // content is base64 for pdf/image, text for text
    
    let parts: any[] = [];
    if (type === 'text') {
      parts.push({ text: content });
    } else {
      parts.push({
        inlineData: {
          mimeType: type === 'pdf' ? 'application/pdf' : 'image/jpeg',
          data: content
        }
      });
    }

    parts.push({ text: `
      Analyze this math material and provide the following information in JSON format:
      - expected_grade: number
      - unit: string
      - key_concepts: string[]
      - original_difficulty: string (상/중/하)
      - common_misconceptions: string[]
      - recommended_level: string (상/중/하)
      - possible_question_types: string[]
    `});

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expected_grade: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            key_concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            original_difficulty: { type: Type.STRING },
            common_misconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_level: { type: Type.STRING },
            possible_question_types: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = result.text;
    if (!text) throw new Error("AI returned an empty response");
    
    // Sometimes the model might still wrap in markdown despite responseMimeType
    const cleanJson = text.replace(/^```json\n?|\n?```$/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/quiz/generate", async (req, res) => {
  try {
    const { 
      sourceContent, 
      sourceType,
      studentLevel, 
      questionCount, 
      useMathSymbols, 
      includeRealLife,
      includeExplanations
    } = req.body;

    let parts: any[] = [];
    if (sourceType === 'text') {
      parts.push({ text: sourceContent });
    } else {
      parts.push({
        inlineData: {
          mimeType: sourceType === 'pdf' ? 'application/pdf' : 'image/jpeg',
          data: sourceContent
        }
      });
    }

    parts.push({ text: `
      Generate ${questionCount} math questions based on the provided material.
      
      CRITICAL DIFFICULTY REQUIREMENT:
      - The generated questions MUST be a balanced mixture of "하" (Easy), "중" (Medium), and "상" (Hard) difficulty levels so that we can evaluate the student's level comprehensively.
      - Distribute the difficulty levels as evenly as possible across the ${questionCount} questions. E.g., for a 5-question test, include some Easy (하), some Medium (중), and some Hard (상) questions. Do NOT make them all the same level!
      
      Settings:
      - Use LaTeX for math symbols: ${useMathSymbols}
      - Include real-life problems: ${includeRealLife}
      
      For each question, provide:
      - question: string (using LaTeX if requested)
      - options: string[] (exactly 4 options)
      - answer: number (0-3 index)
      - explanation: string
      - misconception_points: string (what to look for if wrong)
      - difficulty: string (must be one of: "상", "중", "하")
      - depth_of_knowledge: string (사고 수준)
    `});

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.NUMBER },
              explanation: { type: Type.STRING },
              misconception_points: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              depth_of_knowledge: { type: Type.STRING }
            },
            required: ["question", "options", "answer", "explanation"]
          }
        }
      }
    });

    const text = result.text;
    if (!text) throw new Error("AI returned an empty response");
    
    const cleanJson = text.replace(/^```json\n?|\n?```$/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("Generation Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/quiz/evaluate", async (req, res) => {
  try {
    const { questions, studentAnswers, studentName } = req.body;

    const prompt = `
      Evaluate the student's quiz results.
      Questions and correct answers: ${JSON.stringify(questions)}
      Student's answers: ${JSON.stringify(studentAnswers)}
      
      Provide a detailed analysis in JSON:
      - score: number
      - total_questions: number
      - accuracy: number
      - student_level: string (current level based on performance)
      - incorrect_questions: number[] (indices)
      - misconception_types: string[]
      - missing_concepts: string[]
      - recommended_next_level: string
      - strengths: string
      - weaknesses: string
    `;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            total_questions: { type: Type.NUMBER },
            accuracy: { type: Type.NUMBER },
            student_level: { type: Type.STRING },
            incorrect_questions: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            misconception_types: { type: Type.ARRAY, items: { type: Type.STRING } },
            missing_concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommended_next_level: { type: Type.STRING },
            strengths: { type: Type.STRING },
            weaknesses: { type: Type.STRING }
          }
        }
      }
    });

    const text = result.text;
    if (!text) throw new Error("AI returned an empty response");
    
    const cleanJson = text.replace(/^```json\n?|\n?```$/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
