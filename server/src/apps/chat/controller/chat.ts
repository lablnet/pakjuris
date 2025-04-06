import { Request, Response, NextFunction } from 'express';
import { sendStatusUpdate } from './status';
import * as geminiService from '../../../services/gemini';
import * as openaiService from '../../../services/openai';
import * as pineconeService from '../../../services/pinecone';
import { findDocumentDetails } from '../../../services/mongo';
import * as prompts from '../../../utils/promptTemplates';
import ApiError from '../../../utils/ApiError';
import Conversation, { IConversation } from '../models/Conversation';
import Message from '../models/Message';

// Constants for RAG pipeline
const TOP_K_RESULTS = 3;
const FINAL_CONTEXT_CHUNKS = 3;

// Type for chat history
interface ChatHistoryItem {
  role: string;
  content: string;
}

/**
 * Process a chat query using RAG pipeline
 */
export const processQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Check if user is authenticated
        const user = req.user;
        console.log("USER", user);
        if (user) {
            console.log(`Processing query for authenticated user: ${(user as any).email || (user as any).uid}`);
        } else {
            console.log('Processing query for unauthenticated user');
        }

        // Get clientId and conversationId from request if available
        const clientId = req.body.clientId;
        const conversationId = req.body.conversationId;
        
        console.log(`Processing query for clientId: ${clientId}, conversationId: ${conversationId}`);
        // Function to send status update if clientId is provided
        const updateStatus = (status: any) => {
            if (clientId) {
                sendStatusUpdate(clientId, status);
            }
        }; 

        // 1. Validate Input
        if (!req.body || !req.body.question || typeof req.body.question !== 'string' || req.body.question.trim().length === 0) {
            res.status(400).json({ message: "Bad Request: 'question' field (non-empty string) is required." });
            return;
        }
        const originalQuestion = req.body.question.trim();
        console.log("Processing question:", originalQuestion);
        updateStatus({ step: 'start', message: 'Processing your question...' });

        // Create or get conversation
        let conversation: IConversation;
        const userId = user ? (user as any)._id || (user as any).id : null;
        
        if (conversationId) {
            // Find existing conversation
            const existingConversation = await Conversation.findById(conversationId);
            if (!existingConversation) {
                console.log(`Conversation with ID ${conversationId} not found, creating new conversation`);
                // Generate conversation name
                const conversationName = await geminiService.generateConversationName(originalQuestion);
                // Create new conversation
                conversation = new Conversation({
                    userId,
                    name: conversationName
                });
                await conversation.save();
            } else {
                conversation = existingConversation;
            }
        } else {
            // Generate conversation name for new conversation
            console.log('Creating new conversation');
            const conversationName = await geminiService.generateConversationName(originalQuestion);
            // Create new conversation
            conversation = new Conversation({
                userId,
                name: conversationName
            });
            await conversation.save();
        }
        
        // Save user message
        const userMessage = new Message({
            conversationId: conversation._id,
            role: 'user',
            content: originalQuestion
        });
        await userMessage.save();

        // 2. Classify Intent
        console.log("   Classifying intent...");
        updateStatus({ step: 'intent', message: 'Classifying your question...' });
        const intent = await geminiService.classifyIntent(originalQuestion);
        console.log(`   Intent classified as: ${intent}`);
        updateStatus({ step: 'intent', message: `Intent classified as: ${intent}` });

        // Get conversation messages for context if intent is DISCUSSION
        let conversationHistory: ChatHistoryItem[] = [];
        const messages = await Message.find({ conversationId: conversation._id })
            .sort({ created_at: 1 })
            .limit(10); // Limit to last 10 messages for context
        
        conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        

        // 3. Handle Non-Legal Intents
        let responseText;
        switch (intent) {
            case 'GREETING':
                responseText = prompts.GREETING_RESPONSE;
                updateStatus({ step: 'complete', message: 'Greeting detected', intent: intent });
                break;
            case 'CLARIFICATION_NEEDED':
                responseText = prompts.CLARIFICATION_RESPONSE;
                updateStatus({ step: 'complete', message: 'Clarification needed', intent: intent });
                break;
            case 'IRRELEVANT':
                responseText = prompts.IRRELEVANT_RESPONSE;
                updateStatus({ step: 'complete', message: 'Question irrelevant', intent: intent });
                break;
            case 'DISCUSSION':
                // Handle discussion case using conversation history
                responseText = await geminiService.generateResponse(originalQuestion, conversationHistory);
                updateStatus({ step: 'complete', message: 'Discussion processed', intent: intent });
                break;
            case 'LEGAL_QUERY':
                // Proceed to RAG steps
                break;
            default:
                console.warn(`   Unhandled intent: ${intent}. Proceeding as LEGAL_QUERY.`);
                responseText = prompts.IRRELEVANT_RESPONSE;
                updateStatus({ step: 'complete', message: 'Unhandled intent, proceeding as legal query', intent: intent });
                break;
        }

        // Save early response and return for non-RAG intents
        if (responseText && intent !== 'LEGAL_QUERY') {
            // Save assistant message
            const assistantMessage = new Message({
                conversationId: conversation._id,
                role: 'assistant',
                content: responseText,
                metadata: { intent }
            });
            await assistantMessage.save();
            
            res.json({ 
                conversationId: conversation!._id!.toString(),
                summary: responseText, 
                intent: intent 
            });
            return;
        }

        // --- RAG Pipeline for LEGAL_QUERY ---

        // 4. Generate Search Queries
        console.log("   Generating search queries...");
        updateStatus({ step: 'search', message: 'Generating search queries...' });
        const searchQueries = await geminiService.generateSearchQueries(originalQuestion);
        updateStatus({ step: 'search', message: `Generated ${searchQueries.length} search queries` });

        // 5. Embed and Query Pinecone for each Search Term
        let allMatches: pineconeService.PineconeMatch[] = [];
        updateStatus({ step: 'embedding', message: 'Starting vector search...' });
        for (let i = 0; i < searchQueries.length; i++) {
            const query = searchQueries[i];
            console.log(`   Processing search query: "${query}"`);
            updateStatus({ step: 'embedding', message: `Processing search query ${i+1}/${searchQueries.length}: "${query}"` });
            const queryVector = await openaiService.getEmbedding(query);
            const matches = await pineconeService.queryPinecone(queryVector, TOP_K_RESULTS);
            allMatches.push(...matches); // Collect all matches
        }
        console.log(`   Total matches found across all queries: ${allMatches.length}`);
        updateStatus({ step: 'embedding', message: `Found ${allMatches.length} potential matches` });

        // 5a. --- <<< Metadata Filtering (from previous step) >>> ---
        let filteredMatches = allMatches;
        console.log(JSON.stringify(filteredMatches, null, 2));
        // 5b. --- <<< Filter by Score Threshold >>> ---
        const countBeforeScoreFilter = filteredMatches.length;
        updateStatus({ step: 'filtering', message: `Filtering ${countBeforeScoreFilter} matches by relevance score...` });
        filteredMatches = filteredMatches.filter(match => match.score >= prompts.PINECONE_SCORE_THRESHOLD);
        console.log(`   Filtered matches by score >= ${prompts.PINECONE_SCORE_THRESHOLD}. Kept ${filteredMatches.length} of ${countBeforeScoreFilter}.`);
        updateStatus({ step: 'filtering', message: `Kept ${filteredMatches.length} of ${countBeforeScoreFilter} matches after filtering` });
        // --- <<< END SCORE FILTER >>> ---

        // 6. De-duplicate, Rank, and Select Top Chunks
        updateStatus({ step: 'ranking', message: 'Ranking and selecting top matches...' });
        const uniqueMatchesMap = new Map<string, pineconeService.PineconeMatch>();
        filteredMatches.forEach(match => {
            // Ensure metadata and text exist before creating key
            const meta = match.metadata || {};
            const textSample = meta.text ? meta.text.substring(0, 50) : 'notext';
            const key = `${meta.title || 'untitled'}-${meta.year || 'noyear'}-${meta.pageNumber || 'nopage'}-${textSample}`; // Example key

            // If duplicate found, keep the one with the higher score
            if (!uniqueMatchesMap.has(key) || (uniqueMatchesMap.has(key) && match.score > uniqueMatchesMap.get(key)!.score)) {
                uniqueMatchesMap.set(key, match);
            }
        });

        const uniqueRankedMatches = Array.from(uniqueMatchesMap.values())
            .sort((a, b) => b.score - a.score); // Sort by score descending

        const topContextChunks = uniqueRankedMatches.slice(0, FINAL_CONTEXT_CHUNKS);
        console.log(`   Selected ${topContextChunks.length} unique top-scoring chunks for context.`);
        updateStatus({ step: 'ranking', message: `Selected ${topContextChunks.length} unique top-scoring chunks` });

        // 7. Generate Summary if Context Found
        let summary;
        let responseData: {
            conversationId: string;
            intent: string;
            title: string | null;
            year: string | null;
            pageNumber: string | null;
            summary: string;
            originalText: string | null;
            pdfUrl: string | null;
            matchScore: number | null;
        } = {
            conversationId: conversation!._id!.toString(),
            intent: intent,
            title: null,
            year: null,
            pageNumber: null,
            summary: prompts.NO_MATCH_RESPONSE, // Default if no matches
            originalText: null,
            pdfUrl: null,
            matchScore: null
        };

        if (topContextChunks.length > 0) {
            // Extract metadata and text for the prompt
            const contextForPrompt = topContextChunks
                .filter(match => match.metadata) // Ensure metadata exists
                .map(match => ({
                    title: match.metadata.title,
                    year: match.metadata.year,
                    pageNumber: match.metadata.pageNumber,
                    text: match.metadata.text,
                }));

            // Only generate summary if we actually have text context
            if (contextForPrompt.length > 0 && contextForPrompt.some(c => c.text)) {
                console.log("   Generating final summary...");
                updateStatus({ step: 'summary', message: 'Generating answer based on relevant documents...' });
                summary = await geminiService.generateSummary(originalQuestion, contextForPrompt);
                updateStatus({ step: 'summary', message: 'Answer generated successfully' });
            } else {
                console.warn("   ⚠️ Top chunks found, but metadata/text missing. Cannot generate summary.");
                updateStatus({ step: 'summary', message: 'Error: Context data was incomplete' });
                summary = prompts.NO_MATCH_RESPONSE + " (Context data was incomplete).";
            }

            // Prepare response using the *best* single match for display purposes
            const bestOverallMatch = topContextChunks[0]; // The highest scoring unique chunk
            const bestMetadata = bestOverallMatch.metadata || {}; // Use empty object as fallback

            console.log(`   Retrieving PDF URL for best match: ${bestMetadata.title} (${bestMetadata.year})...`);
            updateStatus({ step: 'finalizing', message: 'Retrieving document details...' });
            // Only attempt DB lookup if title and year are present
            let docDetails = null;
            if (bestMetadata.title && bestMetadata.year) {
                docDetails = await findDocumentDetails(bestMetadata.title, bestMetadata.year);
            }

            responseData = {
                conversationId: conversation!._id!.toString(),
                intent: intent,
                title: bestMetadata.title || 'N/A',
                year: bestMetadata.year || 'N/A',
                pageNumber: bestMetadata.pageNumber || 'N/A',
                summary: summary!.trim(),
                originalText: bestMetadata.text || null, // Text from the best chunk
                pdfUrl: docDetails?.url || bestMetadata.url || null,
                matchScore: bestOverallMatch.score // Score of the best chunk
            };
        } else {
            console.log("   No relevant context found after filtering. Sending no-match response.");
            updateStatus({ step: 'finalizing', message: 'No relevant documents found' });
            // Ensure the response reflects the NO_MATCH intent/summary
            responseData.summary = prompts.NO_MATCH_RESPONSE;
        }

        // Save assistant message
        const assistantMessage = new Message({
            conversationId: conversation._id,
            role: 'assistant',
            content: responseData.summary,
            metadata: {
                intent: responseData.intent,
                title: responseData.title,
                year: responseData.year,
                pageNumber: responseData.pageNumber,
                originalText: responseData.originalText,
                pdfUrl: responseData.pdfUrl,
                matchScore: responseData.matchScore
            }
        });
        await assistantMessage.save();

        // 8. Send Response
        console.log("✅ Query processed successfully. Sending response.");
        updateStatus({ step: 'complete', message: 'Query processed successfully', intent: intent });
        res.json(responseData);
    } catch (error) {
        next(error);
    }
};
