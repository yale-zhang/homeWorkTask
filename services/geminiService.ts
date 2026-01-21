
import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AcademicEvent, HomeworkTask } from "../types";
import { settingsService } from "./settingsService";

/**
 * Always obtain the API key exclusively from the environment variable process.env.API_KEY.
 * The application must not ask the user for it or manage it in settings.
 */
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

async function callDeepSeek(prompt: string, systemInstruction: string, jsonResponse: boolean = false) {
  const settings = settingsService.getSettings();
  const response = await fetch(`${settings.deepseekBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.deepseekApiKey}`
    },
    body: JSON.stringify({
      model: settings.deepseekModel,
      messages: [
        { role: 'system', content: systemInstruction + (jsonResponse ? " Respond ONLY with a valid JSON object." : "") },
        { role: 'user', content: prompt }
      ],
      response_format: jsonResponse ? { type: 'json_object' } : undefined
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'DeepSeek API error');
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return jsonResponse ? JSON.parse(text) : text;
}

export const geminiService = {
  // Use gemini-3-flash-preview for basic OCR tasks.
  async extractTextFromImage(imageBuffer: string, lang: 'en' | 'zh' = 'zh') {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Act as an expert OCR engine. Extract all text from this homework submission image exactly as written. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` }
        ]
      }
    });
    return response.text || "No text could be extracted.";
  },

  // Use gemini-3-flash-preview for simple extraction and metadata generation.
  async extractHomeworkFromImage(imageBuffer: string, lang: 'en' | 'zh' = 'zh') {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Extract homework details. Create a title. Identify Subject, Deadline, Content, and Category. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            category: { type: Type.STRING },
            deadline: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "subject", "content", "category"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async extractHomeworkFromMessage(message: string, lang: 'en' | 'zh' = 'zh') {
    const settings = settingsService.getSettings();
    const prompt = `Extract homework from: "${message}". Create a title. Identify Subject, Deadline, Content, and Category. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.`;

    if (settings.aiProvider === AIProvider.DEEPSEEK) {
      return await callDeepSeek(prompt, "Return a JSON object with title, subject, category, deadline, content.", true);
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            category: { type: Type.STRING },
            deadline: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "subject", "content", "category"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  // Upgrade to gemini-3-pro-preview for complex reasoning task: grading and gap analysis.
  async gradeSubmission(imageBuffer: string, prompt: string, lang: 'en' | 'zh' = 'zh') {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Grade this homework based on context: "${prompt}". 
          
          You must perform three tasks:
          1. OCR: Extract the full raw text from the image as 'extractedText'.
          2. Grading: Calculate 'score' and 'totalScore'.
          3. Analysis: Provide 'strengths', 'weaknesses', 'detailedFeedback', and 'knowledgePoints' (mastery level 0-100).
          
          Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            totalScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailedFeedback: { type: Type.STRING },
            extractedText: { type: Type.STRING },
            knowledgePoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { point: { type: Type.STRING }, mastery: { type: Type.NUMBER } }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  // Upgrade to gemini-3-pro-preview and enable thinking budget for high-quality pedagogical analysis and planning.
  async generatePlan(weaknesses: string[], lang: 'en' | 'zh' = 'zh') {
    const settings = settingsService.getSettings();
    const prompt = `你是一位世界顶级的教育心理学家 and 资深特级教师 (S-Tier Educator).
    
    已知学生在最近的作业中表现出以下知识漏洞：${weaknesses.join(', ')}。
    
    请执行以下深度分析并制定个性化学习路径：
    
    1. **深度学情剖析 (deepAnalysis)**：
       - 要求：字数不少于 600 字。
       - 内容：深入挖掘这些知识点之间的内在联系。分析学生产生漏洞的潜在原因。阐述如果不及时修补对未来的长远负面影响。给出针对性的教育心理学建议，鼓励学生并提供学习方法论。
       
    2. **核心目标设定 (focusArea)**：
       - 用一句话精准概括本次学习路径的核心突破点。
       
    3. **自适应学习任务 (tasks)**：
       - 创建 3-5 个阶梯式任务。划分基础加固、进阶练习、巅峰挑战。每个任务包含详细 description。

    请使用 ${lang === 'zh' ? '中文' : '英文'} 回答。必须返回 JSON 格式。`;

    if (settings.aiProvider === AIProvider.DEEPSEEK) {
      const system = "你是一位极具洞察力的教育专家。确保内容深刻且篇幅宏大。";
      return await callDeepSeek(prompt, system, true);
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusArea: { type: Type.STRING },
            deepAnalysis: { type: Type.STRING },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  metadata: {
                    type: Type.OBJECT,
                    properties: {
                      duration: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                      topic: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  async generateMilestoneAdvice(event: AcademicEvent, previousTasks: HomeworkTask[], lang: 'en' | 'zh' = 'zh') {
    const ai = getAiClient();
    const taskSummary = previousTasks.map(t => `- ${t.title}: Score ${t.result?.score}/${t.result?.totalScore}. Gaps: ${t.result?.weaknesses?.join(', ') || 'None'}`).join('\n');
    
    const prompt = `You are a high-stakes exam coach. Provide a custom prep strategy for the upcoming milestone: "${event.title}" (${event.type}).
    
    Based on the PREVIOUS STAGE performance:
    ${taskSummary || 'No data available from the previous stage.'}
    
    The strategy should follow the flow: Daily Homework -> Weekly Quiz -> Monthly Test -> Midterm/Final.
    Provide actionable steps, focus areas, and psychological encouragement.
    
    Respond in ${lang === 'zh' ? 'Chinese' : 'English'}. Format as a concise, high-impact report.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No strategy generated.";
  }
};
