// ============================================================
// Saba Store — AI Provider Abstraction Layer
// Supports: Mock (default), OpenAI, Gemini
// ============================================================

import type { AiToolType } from "./mock-responses";
import { getMockResponse } from "./mock-responses";
import { buildSystemPrompt } from "./prompts";

// ============================================================
// PROVIDER INTERFACE
// ============================================================
export interface AiProviderResult {
  text: string;
  provider: string;
  model: string;
}

interface AiProvider {
  name: string;
  generateContent(
    toolType: AiToolType,
    userInput: Record<string, string>
  ): Promise<AiProviderResult>;
}

// ============================================================
// MOCK PROVIDER (always available, no API key needed)
// ============================================================
class MockAiProvider implements AiProvider {
  name = "mock";

  async generateContent(
    toolType: AiToolType,
    userInput: Record<string, string>
  ): Promise<AiProviderResult> {
    // Simulate a brief delay for realism
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));
    
    const text = getMockResponse(toolType, userInput);
    return {
      text,
      provider: "mock",
      model: "mock-v1",
    };
  }
}

// ============================================================
// OPENAI PROVIDER (ready for future activation)
// ============================================================
class OpenAiProvider implements AiProvider {
  name = "openai";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "gpt-4o-mini";
  }

  async generateContent(
    toolType: AiToolType,
    userInput: Record<string, string>
  ): Promise<AiProviderResult> {
    const systemPrompt = buildSystemPrompt(toolType);
    const userPrompt = Object.entries(userInput)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("OpenAI returned empty response");
    }

    return {
      text,
      provider: "openai",
      model: this.model,
    };
  }
}

// ============================================================
// GEMINI PROVIDER (ready for future activation)
// ============================================================
class GeminiAiProvider implements AiProvider {
  name = "gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "gemini-1.5-flash";
  }

  async generateContent(
    toolType: AiToolType,
    userInput: Record<string, string>
  ): Promise<AiProviderResult> {
    const systemPrompt = buildSystemPrompt(toolType);
    const userPrompt = Object.entries(userInput)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    return {
      text,
      provider: "gemini",
      model: this.model,
    };
  }
}

// ============================================================
// OPENROUTER PROVIDER
// ============================================================
class OpenRouterAiProvider implements AiProvider {
  name = "openrouter";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "google/gemini-2.5-flash"; // Default cheap model for OpenRouter
  }

  async generateContent(
    toolType: AiToolType,
    userInput: Record<string, string>
  ): Promise<AiProviderResult> {
    const systemPrompt = buildSystemPrompt(toolType);
    const userPrompt = Object.entries(userInput)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Saba Store",
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("OpenRouter returned empty response");
    }

    return {
      text,
      provider: "openrouter",
      model: this.model,
    };
  }
}

// ============================================================
// PROVIDER FACTORY
// ============================================================
export function getAiProvider(): AiProvider {
  const providerName = process.env.AI_PROVIDER?.toLowerCase() || "mock";
  const aiModel = process.env.AI_MODEL;

  // Try OpenAI
  if (providerName === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      return new OpenAiProvider(apiKey, aiModel);
    }
    console.warn("[AI] OpenAI selected but no OPENAI_API_KEY found. Falling back to Mock provider.");
  }

  // Try OpenRouter
  if (providerName === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      return new OpenRouterAiProvider(apiKey, aiModel);
    }
    console.warn("[AI] OpenRouter selected but no OPENROUTER_API_KEY found. Falling back to Mock provider.");
  }

  // Try Gemini
  if (providerName === "gemini") {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      return new GeminiAiProvider(apiKey, aiModel);
    }
    console.warn("[AI] Gemini selected but no GOOGLE_GENERATIVE_AI_API_KEY found. Falling back to Mock provider.");
  }

  // Default: Mock
  return new MockAiProvider();
}

// ============================================================
// CHECK IF USING MOCK MODE
// ============================================================
export function isUsingMockProvider(): boolean {
  const provider = getAiProvider();
  return provider.name === "mock";
}
