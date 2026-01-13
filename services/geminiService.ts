
import { GoogleGenAI, Type } from "@google/genai";
import { Subject, AssignmentCategory } from "../types";

// Always use process.env.API_KEY directly as per SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  /**
   * Extracts text from an image using Gemini Flash.
   */
  async extractTextFromImage(imageBuffer: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBuffer } },
          { text: "Act as an expert OCR engine. Extract all text from this homework submission image exactly as written, including math formulas or multi-line text. Provide only the extracted text." }
        ]
      }
    });
    return response.text || "No text could be extracted.";
  },

  /**
   * Simulates parsing a chat message to extract homework details
   */
  async extractHomeworkFromMessage(message: string) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract homework details from this school chat message: "${message}". 
      Identify Subject (Math, Science, English, History, Chinese), Deadline, Task Content, and Category (Major Grade, Quiz, Homework, or Daily Practice).`,
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
          Also, provide a full text transcription of what was written.
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
                  id: { type: Type.STRING, description: "A unique slug for this task" },
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
    return JSON.parse(response.text || '{}');
  }
};
