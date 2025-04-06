/**
 * Predefined prompt templates for AI responses
 */

export const GREETING_RESPONSE = 
  "Hello! I'm your AI legal assistant for Pakistani law. How can I help you today?";

export const CLARIFICATION_RESPONSE = 
  "I'm sorry, I didn't quite understand your question. Could you please rephrase it or provide more details about what you're looking for in Pakistani law?";

export const IRRELEVANT_RESPONSE = 
  "I'm specialized in answering questions about Pakistani law. This question appears to be outside my area of expertise. Please ask me about Pakistani legal matters, regulations, or procedures.";

export const NO_MATCH_RESPONSE = 
  "I couldn't find any relevant information about this in my knowledge base of Pakistani law. Could you try rephrasing your question, or ask about a different legal topic?";

export const SERVER_ERROR_RESPONSE =
  "I'm sorry, but I encountered a technical issue while processing your question. Please try again later or contact support if the problem persists.";

/**
 * Score threshold for filtering vector search results
 */
export const PINECONE_SCORE_THRESHOLD = 0.7;

const INTENT_CLASSIFICATION_PROMPT = (question: string) => `
Analyze the user's question about Pakistani Law and classify its intent into ONE of the following categories:
- GREETING: User is just saying hello, thanks, goodbye, etc. (e.g., "Hi", "Thank you")
- LEGAL_QUERY: User asks a specific question about Pakistani law, legal concepts, acts, sections, procedures, or requests information about a specific legal entity mentioned. (e.g., "What is bail?", "Explain section 10 of Companies Act 2017", "Tell me about prohibited company names")
- CLARIFICATION_NEEDED: User's question is too vague, ambiguous, lacks a specific subject, or mentions a concept without asking a question about it. (e.g., "What about the law?", "Section 5?", "Companies Act 2017." <- statement, not a question)
- IRRELEVANT: User's question is off-topic, unrelated to Pakistani law, or nonsensical.

User Question: "${question}"

Classification:`; // Expecting one word: GREETING, LEGAL_QUERY, CLARIFICATION_NEEDED, or IRRELEVANT

const SEARCH_QUERY_GENERATION_PROMPT = (question: string) => `
Based on the following user question about Pakistani law, generate 3 to 5 concise and relevant search query phrases suitable for a vector database search. Focus on key legal terms, concepts, act names, or section numbers mentioned. Output ONLY the search queries, separated by newlines.

User Question: "${question}"

Search Queries:`; // Expecting newline-separated queries

const SUMMARY_GENERATION_PROMPT = (question: string, contextChunks: any[]) => `
You are an AI assistant specializing in summarizing Pakistani legal text for a layperson.
Analyze the user's question and the provided relevant legal excerpts.
Provide a clear, simple, and neutral summary based *only* on the information in the excerpts.
Directly address the user's query using the context. If the context does not fully answer the question, state that clearly.
Avoid legal jargon, opinions, or negative language. Focus on explaining the core meaning of the text from the excerpts.
Combine information from multiple excerpts if they cover the same topic smoothly.
Cite the source (Document Title, Year, Page Number) for the information used in the summary where appropriate, perhaps at the end.

User Question: "${question}"

Relevant Legal Excerpts:
${contextChunks.map((chunk: any, index: number) => `
Excerpt ${index + 1} (Source: ${chunk.title} (${chunk.year}), Page: ${chunk.pageNumber}):
"${chunk.text}"
`).join('\n---\n')}

Summary:`;

export {
  INTENT_CLASSIFICATION_PROMPT,
  SEARCH_QUERY_GENERATION_PROMPT,
  SUMMARY_GENERATION_PROMPT
};
