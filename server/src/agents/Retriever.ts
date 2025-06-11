import { Tool } from '@langchain/core/tools';
import { getEmbedding } from '../services/openai';
import { queryPinecone } from '../services/pinecone';

export class Retriever extends Tool {
  name = 'retrieve_documents';
  description = 'Retrieves top documents from Pinecone';

  async _call(input: string): Promise<string> {
    const terms = input.split('\n');
    let results: any[] = [];
    for (const term of terms) {
      const embedding = await getEmbedding(term);
      const chunks = await queryPinecone(embedding, 5);
      results.push(...chunks);
    }
    return JSON.stringify(results);
  }
}
