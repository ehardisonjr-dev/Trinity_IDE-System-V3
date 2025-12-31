
import { GoogleGenAI } from "@google/genai";
import { SystemConfig } from "../types";

export class TrinityService {
  private getAI() {
    // Always use process.env.API_KEY directly as per guidelines
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async conduct(
    prompt: string, 
    context: string, 
    mode: 'precision' | 'speed', 
    onLog: (log: any) => void,
    config: SystemConfig
  ) {
    const ai = this.getAI();
    const isPrecision = mode === 'precision';
    // Use gemini-flash-lite-latest for high-speed tasks as per guidelines
    const model = isPrecision ? config.conductorModel : 'gemini-flash-lite-latest';
    
    onLog({
      id: Math.random().toString(),
      timestamp: Date.now(),
      agent: 'Conductor',
      message: `Initiating ${isPrecision ? 'High-Reasoning' : 'High-Speed'} orchestration via ${model}...`,
      type: 'info'
    });

    const genConfig: any = {
      temperature: 0.7,
      systemInstruction: `You are the "Conductor" of the Trinity Agent System.
      Current Workspace Context: ${context}
      
      Your goal is to fulfill user requests by orchestrating your sub-agents:
      1. Research Team: Used for technical grounding.
      2. Coder: Synthesizes implementations.
      3. Validator: Verifies logic.

      When proposing a code change, you MUST respond with a JSON block in this exact format:
      \`\`\`json
      {
        "action": "propose_code",
        "fileName": "example.ts",
        "content": "the actual code",
        "description": "why this change was made"
      }
      \`\`\`
      Keep conversational text professional and concise.`
    };

    // Apply thinking budget for Gemini 3 and 2.5 series models with correct limits as per guidelines
    if (isPrecision && (model.includes('pro') || model.includes('gemini-3') || model.includes('gemini-2.5'))) {
      const budget = model.includes('pro') ? 32768 : 24576;
      genConfig.thinkingConfig = { thinkingBudget: budget };
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: genConfig
      });

      return response.text;
    } catch (error: any) {
      onLog({
        id: Math.random().toString(),
        timestamp: Date.now(),
        agent: 'Conductor',
        message: `API Exception: ${error.message}`,
        type: 'error'
      });
      throw error;
    }
  }

  async research(query: string, config: SystemConfig, onLog: (log: any) => void) {
    const ai = this.getAI();
    onLog({
      id: Math.random().toString(),
      timestamp: Date.now(),
      agent: 'Research Lead',
      message: `Triggering technical search grounding for: ${query}`,
      type: 'info'
    });

    try {
      const response = await ai.models.generateContent({
        model: config.researchModel,
        contents: [{ role: 'user', parts: [{ text: `Perform deep technical research for: ${query}. Focus on implementation details, API patterns, and potential edge cases.` }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      onLog({
        id: Math.random().toString(),
        timestamp: Date.now(),
        agent: 'Specialized Researcher',
        message: `Grounding complete. Key findings identified.`,
        type: 'success'
      });

      // Extract grounding sources as required by guidelines for Google Search grounding
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(Boolean) || [];

      return { text: response.text, sources };
    } catch (error) {
      return { text: "Research swarm was unable to reach the web. Proceeding with internal knowledge base.", sources: [] };
    }
  }

  async validateCode(code: string, requirements: string, config: SystemConfig, onLog: (log: any) => void) {
    const ai = this.getAI();
    onLog({
      id: Math.random().toString(),
      timestamp: Date.now(),
      agent: 'Validator',
      message: `Performing logical validation on generated artifacts...`,
      type: 'info'
    });

    try {
      const response = await ai.models.generateContent({
        model: config.validatorModel,
        contents: [{ role: 'user', parts: [{ text: `Review this code for correctness and adherence to: ${requirements}\n\nCode:\n${code}` }] }],
        config: { temperature: 0.1 }
      });

      return response.text;
    } catch (error) {
      return "Validation node timed out. Manual review highly recommended.";
    }
  }
}

export const trinity = new TrinityService();
