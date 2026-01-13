import { GoogleGenAI, Type } from "@google/genai";
import { Subject } from "../types";

// Always use process.env.API_KEY directly as per SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Simulates parsing a chat message to extract homework details
   */
  async extractHomeworkFromMessage(message: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract homework details from this school chat message: "${message}". 
      Identify Subject (Math, Science, English, etc.), Deadline, and Task Content.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            deadline: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["subject", "content"]
        }
      }
    });
    // Access .text property directly, do not call as a method
    return JSON.parse(response.text || '{}');
  },

  /**
   * Grades a homework submission image. Uses gemini-3-pro-preview for complex STEM grading and handwriting analysis.
   */
  async gradeSubmission(imageBuffer: string, prompt: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: `Grade this homework submission based on this original assignment: "${prompt}". 
          Analyze the handwriting, identify correct and incorrect answers. 
          Provide a score, specific strengths, weaknesses, and a knowledge point mastery breakdown (0-100%).` }
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
    // Access .text property directly, do not call as a method
    return JSON.parse(response.text || '{}');
  },

  /**
   * Generates a personalized learning plan based on weaknesses. Uses gemini-3-pro-preview for advanced pedagogical reasoning.
   */
  async generatePlan(weaknesses: string[]) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Based on these academic weaknesses: ${weaknesses.join(', ')}, generate a 3-step personalized learning plan. Include a mix of reading, exercises, and video recommendations.`,
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
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    // Access .text property directly, do not call as a method
    return JSON.parse(response.text || '{}');
  }
};