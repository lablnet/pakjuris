import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';

export class QueryGenerator extends Tool {
  name = 'generate_search_terms';
  description = 'Generate search terms from clarified legal question';

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({ temperature: 0 });
    const result = await llm.invoke(`Generate 5 search terms for: ${input}`);

    // ✅ Extract text from AI response
    if (typeof result === 'string') return result;
    if ('content' in result) return result.content.toString();

    throw new Error('Unexpected LLM response format');
  }
}
