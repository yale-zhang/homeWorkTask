
import { GoogleGenAI, Type } from "@google/genai";

// Read API key from Vite env. NOTE: embedding a privileged API key in the frontend
// is insecure. Prefer moving Gemini calls to a backend proxy or serverless function.
const __RUNTIME__ = (globalThis as any).__RUNTIME__ || {};
const API_KEY = ((__RUNTIME__.VITE_API_KEY as string) || ((import.meta as any).VITE_API_KEY as string) || '');
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const geminiService = {
  /**
   * Extracts text from an image using Gemini Flash.
   */
  async extractTextFromImage(imageBuffer: string, lang: 'en' | 'zh' = 'zh') {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Act as an expert OCR engine. Extract all text from this homework submission image exactly as written. Provide only the extracted text. Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.` }
        ]
      }
    });
    return response.text || "No text could be extracted.";
  },

  /**
   * Extracts homework details from an image (e.g., photo of a textbook page or notice).
   */
  async extractHomeworkFromImage(imageBuffer: string, lang: 'en' | 'zh' = 'zh') {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Extract homework details from this image. Identify Subject (Math, Science, English, History, Chinese), Deadline (in YYYY-MM-DD format if possible), Task Content, and Category (Major Grade, Quiz, Homework, or Daily Practice). Translate the content into ${lang === 'zh' ? 'Chinese' : 'English'}.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            category: { type: Type.STRING, description: "One of: Major Grade, Quiz, Homework, Daily Practice" },
            deadline: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["subject", "content", "category"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  /**
   * Simulates parsing a chat message to extract homework details
   */
  async extractHomeworkFromMessage(message: string, lang: 'en' | 'zh' = 'zh') {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract homework details from this school chat message: "${message}". 
      Identify Subject (Math, Science, English, History, Chinese), Deadline, Task Content, and Category (Major Grade, Quiz, Homework, or Daily Practice). 
      Translate the content into ${lang === 'zh' ? 'Chinese' : 'English'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            category: { type: Type.STRING, description: "One of: Major Grade, Quiz, Homework, Daily Practice" },
            deadline: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["subject", "content", "category"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  /**
   * Grades a homework submission image.
   */
  async gradeSubmission(imageBuffer: string, prompt: string, lang: 'en' | 'zh' = 'zh') {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Grade this homework submission based on this original assignment: "${prompt}". 
          Analyze the handwriting, identify correct and incorrect answers. 
          Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.
          Provide a score, specific strengths, weaknesses, the transcribed text, and a knowledge point mastery breakdown (0-100%).` }
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
            extractedText: { type: Type.STRING, description: "Full transcription of the student's work" },
            knowledgePoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING },
                  mastery: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{}');
  },

  /**
   * Generates a personalized learning plan based on weaknesses.
   */
  async generatePlan(weaknesses: string[], lang: 'en' | 'zh' = 'zh') {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Based on these academic weaknesses: ${weaknesses.join(', ')}, generate a 3-step personalized learning plan. 
      Respond in ${lang === 'zh' ? 'Chinese' : 'English'}.
      Include a mix of reading, exercises, and video recommendations. 
      For each task, provide additional metadata like 'duration' for videos, 'questionsCount' and 'difficulty' for exercises, and 'readingTime' for reading tasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusArea: { type: Type.STRING },
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
                      questionsCount: { type: Type.NUMBER },
                      difficulty: { type: Type.STRING },
                      readingTime: { type: Type.STRING },
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
  }
};
