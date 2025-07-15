import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';

export class QueryGenerator extends Tool {
  name = 'generate_search_terms';
  description = `
    Generate search terms from legal question
    The search terms should be in the format of a search query
    Generate 5 different search terms, these search terms should be concise and to the point
    The search terms should be generated for vector search
  `;

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({ temperature: 0 });
    const result = await llm.invoke(`Generate 5 search terms for: ${input}`);
    console.log("QueryGenerator result", result);
    // ✅ Extract text from AI response
    if (typeof result === 'string') return result;
    if ('content' in result) return result.content.toString();

    throw new Error('Unexpected LLM response format');
  }
}
