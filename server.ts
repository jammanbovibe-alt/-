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

// Extremely robust model choice & fallback retry mechanism (gemini-2.0-flash, gemini-1.5-flash)
async function generateContentWithFallback(config: {
  contents: any;
  config?: any;
}) {
  const models = ["gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError: any = null;

  for (const model of models) {
    let delay = 1000;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[API Call] Attempting generateContent with model: ${model} (Attempt ${attempt + 1}/2)`);
        return await ai.models.generateContent({
          model,
          ...config
        });
      } catch (error: any) {
        lastError = error;
        const errStr = String(error) + " " + (error.message ? String(error.message) : "") + " " + JSON.stringify(error);
        const isTemporary = errStr.includes('503') || 
                            errStr.includes('429') || 
                            errStr.includes('demand') || 
                            errStr.includes('UNAVAILABLE') || 
                            errStr.includes('resource exhausted') ||
                            error.status === 503 || 
                            error.status === 429;

        if (isTemporary) {
          console.warn(`[API Warning] Model ${model} returned temporary error: ${error.message || '503 Service Unavailable'}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }
  }
  throw lastError;
}

const JAMBOT_SYSTEM_INSTRUCTION = `
# Role & Persona
- 당신은 초등학교 3~6학년 학생들의 메타인지를 깨우는 친절하고 위트 있는 AI 튜터 'Jam봇(잼봇)'입니다.
- 친근한 초등학생 눈높이 톤앤매너를 유지하세요. 해요체를 사용하고, 칭찬을 아끼지 않으며, 이모지(🚀, ✨, 🤔, 💡 등)를 적극적으로 활용하세요.

# Input Data Context
- 프론트엔드의 Tiptap 에디터로부터 정형화된 문서 데이터(JSON)가 전달됩니다.
- 당신은 heading, paragraph, image 등의 블록 구조를 이해하고, 학생이 강조한 부분(heading)과 작성한 본문 내용을 기반으로 학습 상태를 정확히 파악해야 합니다.

# Core Logic (소크라테스 문답법 & 일상 전이 3단계)
대화의 흐름은 학생과의 Chat History(이전 대화록)를 기반으로 아래 3단계를 엄격히 준수합니다.

- 1단계 [개념 확인 (UNDERSTANDING_CHECK)]:
  * 학생의 Tiptap 노트에서 오개념이 있거나 설명이 부족한 부분을 찾습니다.
  * 정답을 절대 직접 말하지 말고, 학생이 스스로 깨달을 수 있는 유도 질문을 단 '하나'만 던지세요.
- 2단계 [심화 질문 (DEEPENING)]:
  * 대화 기록을 보니 학생이 개념을 잘 이해한 것 같다면, 개념을 한 단계 더 깊게 생각해보는 질문을 던집니다. (최대 2회까지만 토크 유지)
- 3단계 [일상 전이 (REAL_WORLD_TRANSFER)]:
  * 학생이 개념을 완전히 이해했다고 판단되면, "우리가 오늘 배운 [개념]을 우리 동네/우리 학교/일상생활에서 일어나는 [특정 문제 상황]에 어떻게 적용할 수 있을까?"라는 질문을 던져 대화를 마무리 단계로 이끕니다.

# Guardrails (절대 규칙)
1. 한 번의 답변에 질문은 무조건 '하나'만 하세요. 질문이 많으면 초등학생은 쉽게 지칩니다.
2. 학생이 모른다고 하거나 오답을 말해도 정답을 스포일러하지 마세요. 힌트를 주거나, "그렇게 생각한 이유는 뭐야?"라고 되물으세요.
3. 출력은 반드시 약속된 JSON Schema 형태만 반환해야 합니다. 다른 부가적인 텍스트는 절대 출력하지 마세요.
`;

function getLocalMockJambotResponse(tiptapText: string, chatHistory: any[]): any {
  const studentMessagesCount = chatHistory.filter((m: any) => m.role === 'student' || m.role === 'user').length;
  
  let phase: "UNDERSTANDING_CHECK" | "DEEPENING" | "REAL_WORLD_TRANSFER" | "COMPLETE" = "UNDERSTANDING_CHECK";
  if (studentMessagesCount >= 3) {
    phase = "COMPLETE";
  } else if (studentMessagesCount === 2) {
    phase = "REAL_WORLD_TRANSFER";
  } else if (studentMessagesCount === 1) {
    phase = "DEEPENING";
  }

  const text = tiptapText.toLowerCase();
  let topic = "오늘 배운 주제";
  if (text.includes("인권")) topic = "인권";
  else if (text.includes("수학")) topic = "수학 개념";
  else if (text.includes("과학") || text.includes("식물")) topic = "과학 탐구";

  const responses = {
    UNDERSTANDING_CHECK: {
      internal_analysis: `[로컬 시뮬레이션] 학생이 '${topic}'에 대해 첫 노트를 정리했습니다. 개념을 요약한 문장에서 핵심 키워드를 포착하여 기초적인 개념 확인 질문을 던집니다.`,
      current_phase: "UNDERSTANDING_CHECK",
      praise_message: `아따! '${topic}'에 대해 핵심을 콕 짚어서 아주 깔끔하게 노트를 적어부렀구마잉! 칭찬의 박수를 보낸다잉! 👏`,
      socratic_question: topic === "인권" 
        ? `노트에 '인권은 사람이 태어나자마자 동일하게 가진 권리'라고 적어주었는데, 그렇다면 이 인권이라는 권리는 국가나 법이 만들어지기 전부터 사람에게 당연히 있었던 걸까, 아니면 나라에서 법으로 정해준 다음에야 생겨난 걸까? 네 생각을 자유롭게 들려줘잉! 🤔`
        : `정리한 내용을 보니 기초 뼈대를 아주 잘 잡았구마잉! 그렇다면 이 개념에서 가장 핵심이 되는 단어가 무엇이라고 생각하는지, 그리고 왜 그렇게 생각하는지 첫 질문을 던질 텐게 차근차근 답변해보소! 🤔`
    },
    DEEPENING: {
      internal_analysis: `[로컬 시뮬레이션] 학생이 기초 개념 유도 질문에 잘 대답했습니다. 개념의 본질과 가치를 탐구하는 2단계 심화 질문으로 유도합니다.`,
      current_phase: "DEEPENING",
      praise_message: `아따, 생각을 깊게 해서 기똥차게 답변을 해부렀구마잉! 네 의견을 들으니 아주 듬직하다잉! ✨`,
      socratic_question: topic === "인권"
        ? `오호, 법이 있기 전부터 당연히 가지고 태어난 권리라고 생각했구나! 그렇다면 만약 '다른 사람의 인권(자유)을 지켜주기 위해 내 편리함을 조금 양보해야 하는 상황'이 생긴다면, 우리는 어떻게 행동하는 것이 조화로울까? 일상적인 예시와 함께 말해줄 수 있니? 💡`
        : `아주 흥미로운 접근이구마잉! 그렇다면 이 원리가 적용되는 과정에서 우리가 놓치기 쉬운 예외 상황이나 더 깊은 원리가 있다면 무엇일지 함께 고민해볼까잉? 💡`
    },
    REAL_WORLD_TRANSFER: {
      internal_analysis: `[로컬 시뮬레이션] 심화 탐구를 마치고 일상생활 적용 3단계(REAL_WORLD_TRANSFER)로 진입합니다.`,
      current_phase: "REAL_WORLD_TRANSFER",
      praise_message: `우와, 배려와 논리가 듬뿍 담긴 멋진 생각이구마잉! 잼봇이 큰 감동을 받아부렀어! 🚀`,
      socratic_question: topic === "인권"
        ? `자, 이제 마지막 질문이단다! 우리가 오늘 배운 '인권'이 일상생활(학교, 놀이터, 가정 등)에서 실제로 침해받거나 존중받지 못하는 상황을 본 적이 있니? 그때 오늘 배운 개념을 적용해 어떻게 해결할 수 있을지 일상 속 방법 하나를 이야기해보자! 🚀`
        : `그렇다면 배운 이 개념을 우리 학교나 동네, 혹은 일상생활 속에서 실제로 발견할 수 있는 사례가 무엇이 있을까? 실생활 문제에 이 지식을 어떻게 써먹을 수 있을지 한 가지만 예를 들어보소! 🚀`
    },
    COMPLETE: {
      internal_analysis: `[로컬 시뮬레이션] 3단계를 모두 마치고 대화를 완료(COMPLETE) 처리합니다.`,
      current_phase: "COMPLETE",
      praise_message: `아따, 대단하다잉! 개념 확인부터 심화 대화, 그리고 일상생활 적용까지 3단계 미션을 완벽히 완수해부렀소! 🎉`,
      socratic_question: `오늘 공부와 대화를 통해 '${topic}'에 대해 확실하게 네 지식으로 만든 것을 진심으로 축하한다잉! 배운 내용을 잊지 말고 일상에서도 인권을 멋지게 실천하는 어린이가 되자꾸나! 복습 완료 버튼을 누르고 오늘의 메타인지 여행을 마무리하소! 🏆`
    }
  };

  return responses[phase];
}

// AI Endpoint: /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { tiptapJson, chatHistory } = req.body;

    const formattedTiptap = typeof tiptapJson === 'string' 
      ? tiptapJson 
      : JSON.stringify(tiptapJson, null, 2);

    // Format chat history for Gemini context
    const chatHistoryText = chatHistory && chatHistory.length > 0
      ? chatHistory.map((m: any) => `${m.role === 'student' ? '학생 (Student)' : 'Jam봇 (AI)'}: ${m.content}`).join("\n")
      : "이전 대화 기록 없음 (첫 대화 시작)";

    const promptText = `
학생의 Tiptap 에디터 작성 데이터 (JSON):
${formattedTiptap}

학생과의 이전 대화 기록 (Chat History):
${chatHistoryText}

위 자료와 대화 기록을 면밀히 분석하여, [소크라테스 문답법 & 일상 전이 3단계] 중 현재 단계에 부합하는 피드백과 질문을 다음 스키마에 맞추어 출력하세요.
`;

    const result = await generateContentWithFallback({
      contents: promptText,
      config: {
        systemInstruction: JAMBOT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            internal_analysis: { 
              type: Type.STRING,
              description: "AI가 내부적으로 판단하는 분석 공간. 현재 대화 단계 분석, 학생의 오개념 유무, 다음에 던질 질문의 의도를 논리적으로 서술."
            },
            current_phase: { 
              type: Type.STRING, 
              enum: ["UNDERSTANDING_CHECK", "DEEPENING", "REAL_WORLD_TRANSFER", "COMPLETE"],
              description: "현재 대화가 어떤 단계인지 표시."
            },
            praise_message: { 
              type: Type.STRING,
              description: "학생이 작성한 노트나 직전 답변에 대해 칭찬하고 공감해주는 따뜻한 한 문장의 격려."
            },
            socratic_question: { 
              type: Type.STRING,
              description: "학생에게 실제로 던질 소크라테스식 유도 질문 또는 일상 전이 질문 (단 한 개만 작성)."
            }
          },
          required: ["internal_analysis", "current_phase", "praise_message", "socratic_question"]
        }
      }
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("AI returned empty response");
    }

    const cleanJson = responseText.replace(/^```json\n?|\n?```$/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("AI Chat Error, launching local mock engine fallback:", error);
    try {
      const { tiptapJson, chatHistory } = req.body;
      const formattedTiptap = typeof tiptapJson === 'string' 
        ? tiptapJson 
        : JSON.stringify(tiptapJson, null, 2);
      
      const fallbackResponse = getLocalMockJambotResponse(formattedTiptap, chatHistory || []);
      // Add a simulation warning to internal analysis
      fallbackResponse.internal_analysis = `[💡 Gemini Quota Exceeded Fallback] ${fallbackResponse.internal_analysis}`;
      res.json(fallbackResponse);
    } catch (fallbackErr) {
      res.status(500).json({ error: error.message || "AI Chat failed" });
    }
  }
});

// Serve frontend in production, or mount Vite Dev Server in development
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    
    app.use(vite.middlewares);
    
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(
          url,
          `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>JamClass - AI 피드백 노트</title>
              <link rel="stylesheet" href="/src/index.css">
            </head>
            <body>
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>`
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, "../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    });
  }
  
  app.listen(PORT, () => {
    console.log(`[JamClass Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
