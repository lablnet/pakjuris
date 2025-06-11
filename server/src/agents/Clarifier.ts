import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';

export class Clarifier extends Tool {
  name = 'clarify_question';
  description = 'Clarifies vague legal questions into specific ones';

  async _call(input: string): Promise<string> {
    const llm = new ChatOpenAI({ temperature: 0 });
    const prompt = `Clarify the following question in detail: ${input}`;

    const result = await llm.invoke(prompt);

    // ✅ Extract text from AI response
    if (typeof result === 'string') return result;
    if ('content' in result) return result.content.toString();

    throw new Error('Unexpected LLM response format');
  }
}
