
import { GoogleGenAI, Type } from "@google/genai";
import { AIProvider, AppSettings } from "../types";
import { settingsService } from "./settingsService";

const getAiClient = () => {
  const settings = settingsService.getSettings();
  const apiKey = settings.geminiApiKey || process.env.API_KEY;
  return new GoogleGenAI({ apiKey });
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

  async gradeSubmission(imageBuffer: string, prompt: string, lang: 'en' | 'zh' = 'zh') {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Grade this homework based on: "${prompt}". Provide score, strengths, weaknesses, feedback, and knowledge mastery levels. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` }
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

  async generatePlan(weaknesses: string[], lang: 'en' | 'zh' = 'zh') {
    const settings = settingsService.getSettings();
    const prompt = `你是一位世界顶级的教育心理学家和资深特级教师（S-Tier Educator）。
    
    已知学生在最近的作业中表现出以下知识漏洞：${weaknesses.join(', ')}。
    
    请执行以下深度分析并制定个性化学习路径：
    
    1. **深度学情剖析 (deepAnalysis)**：
       - 要求：字数不少于 600 字。
       - 内容：深入挖掘这些知识点之间的内在联系。分析学生之所以产生这些漏洞的潜在原因（如基础概念混淆、逻辑断层等）。阐述如果不及时修补这些漏洞，对未来更高级别学习的长远负面影响。给出针对性的教育心理学层面的建议，鼓励学生并提供学习方法论（如费曼技巧、错题本策略等）。
       
    2. **核心目标设定 (focusArea)**：
       - 用一句话精准概括本次学习路径的核心突破点。
       
    3. **自适应学习任务 (tasks)**：
       - 创建 3-5 个高质量、阶梯式的任务。
       - 阶段划分为：基础加固、进阶练习、巅峰挑战。
       - 每个任务必须包含详细的 description（指导学生如何去学习，具体到思考维度）。

    请使用 ${lang === 'zh' ? '中文' : '英文'} 回答。必须返回 JSON 格式，且 tasks 数组不能为空。`;

    if (settings.aiProvider === AIProvider.DEEPSEEK) {
      const system = "你是一位极具洞察力的教育专家。你生成的分析内容应当深刻、专业、且篇幅宏大（Verbosity Level: High）。确保 deepAnalysis 字段内容丰富且逻辑严密。";
      return await callDeepSeek(prompt, system, true);
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
                },
                required: ["title", "type", "description"]
              }
            }
          },
          required: ["focusArea", "tasks", "deepAnalysis"]
        }
      }
    });
    const parsed = JSON.parse(response.text || '{}');
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      parsed.tasks = [];
    }
    return parsed;
  }
};
