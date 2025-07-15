import { Tool } from '@langchain/core/tools';
import { llm } from '../services/openai';

export class Summarizer extends Tool {
  name = 'summarize_chunks';
  description = `Summarizes retrieved documents into an answer.
  
  🔥 Input must be the raw JSON string returned by the retrieve_documents tool.
  It must be an array of documents with 'metadata.text', 'url', and 'pageNumber' fields.`;


  async _call(input: string): Promise<string> {
    console.log("input summary agent", input);
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      console.error("❌ Invalid JSON input to summarize_chunks");
      throw new Error("Invalid JSON passed to summarizer tool");
    }

    const chunksText = parsed.map((c) => c.metadata?.text || '').join('\n\n');
    const result = await llm.invoke(`Summarize the following legal text:\n\n${chunksText}`);
  
    return JSON.stringify({
      summary: typeof result === 'string' ? result : result.content.toString(),
      sources: parsed.map((c: any) => ({
        url: c.metadata?.url,
        page: c.metadata?.pageNumber,
        title: c.metadata?.title,
        text: c.metadata?.text,
      })),
    });
  }
}