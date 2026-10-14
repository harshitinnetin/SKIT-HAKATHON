import OpenAI from 'openai';

const openrouter = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
    'X-Title': 'DocMind AI',
  },
});

export const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-4o';
export const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

export default openrouter;
