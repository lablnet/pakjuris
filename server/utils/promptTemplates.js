// utils/promptTemplates.js

// IMPORTANT: Use a model that supports JSON output reliably if possible for structured output like intent classification.
// Otherwise, rely on careful string parsing.

const INTENT_CLASSIFICATION_PROMPT = (question) => `
Analyze the user's question about Pakistani Law and classify its intent into ONE of the following categories:
- GREETING: User is just saying hello, thanks, goodbye, etc. (e.g., "Hi", "Thank you")
- LEGAL_QUERY: User asks a specific question about Pakistani law, legal concepts, acts, sections, procedures, or requests information about a specific legal entity mentioned. (e.g., "What is bail?", "Explain section 10 of Companies Act 2017", "Tell me about prohibited company names")
- CLARIFICATION_NEEDED: User's question is too vague, ambiguous, lacks a specific subject, or mentions a concept without asking a question about it. (e.g., "What about the law?", "Section 5?", "Companies Act 2017." <- statement, not a question)
- IRRELEVANT: User's question is off-topic, unrelated to Pakistani law, or nonsensical.

User Question: "${question}"

Classification:`; // Expecting one word: GREETING, LEGAL_QUERY, CLARIFICATION_NEEDED, or IRRELEVANT

const SEARCH_QUERY_GENERATION_PROMPT = (question) => `
Based on the following user question about Pakistani law, generate 3 to 5 concise and relevant search query phrases suitable for a vector database search. Focus on key legal terms, concepts, act names, or section numbers mentioned. Output ONLY the search queries, separated by newlines.

User Question: "${question}"

Search Queries:`; // Expecting newline-separated queries

const SUMMARY_GENERATION_PROMPT = (question, contextChunks) => `
You are an AI assistant specializing in summarizing Pakistani legal text for a layperson.
Analyze the user's question and the provided relevant legal excerpts.
Provide a clear, simple, and neutral summary based *only* on the information in the excerpts.
Directly address the user's query using the context. If the context does not fully answer the question, state that clearly.
Avoid legal jargon, opinions, or negative language. Focus on explaining the core meaning of the text from the excerpts.
Combine information from multiple excerpts if they cover the same topic smoothly.
Cite the source (Document Title, Year, Page Number) for the information used in the summary where appropriate, perhaps at the end.

User Question: "${question}"

Relevant Legal Excerpts:
${contextChunks.map((chunk, index) => `
Excerpt ${index + 1} (Source: ${chunk.title} (${chunk.year}), Page: ${chunk.pageNumber}):
"${chunk.text}"
`).join('\n---\n')}

Summary:`;

const GREETING_RESPONSE = "Hello! I am the Pakistani Law Bot, powered by AI. How can I help you with specific questions about Pakistani laws or legal procedures today?";

const CLARIFICATION_RESPONSE = "Your question seems a bit broad or requires more specifics. Could you please provide more details? For example, mention a specific Act, section number, or the context of your query.";

const IRRELEVANT_RESPONSE = "I apologize, but I can only assist with questions related to Pakistani laws and legal matters. Could you please ask a relevant question?";

const NO_MATCH_RESPONSE = "I couldn't find specific documents related to your question in my current knowledge base. You might want to try rephrasing your query with more specific legal terms.";

module.exports = {
    INTENT_CLASSIFICATION_PROMPT,
    SEARCH_QUERY_GENERATION_PROMPT,
    SUMMARY_GENERATION_PROMPT,
    GREETING_RESPONSE,
    CLARIFICATION_RESPONSE,
    IRRELEVANT_RESPONSE,
    NO_MATCH_RESPONSE,
};