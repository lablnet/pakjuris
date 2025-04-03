// routes/query.js
const express = require('express');
const geminiService = require('../services/gemini');
const pineconeService = require('../services/pinecone');
const { findDocumentDetails } = require('../services/mongo'); // Only need specific function
const prompts = require('../utils/promptTemplates');

const router = express.Router();

const TOP_K_RESULTS = 3; // Number of results to retrieve per search query
const FINAL_CONTEXT_CHUNKS = 3; // Number of unique chunks to send for summarization

router.post('/', async(req, res, next) => { // Added next for error forwarding
    try {
        // 1. Validate Input
        if (!req.body || !req.body.question || typeof req.body.question !== 'string' || req.body.question.trim().length === 0) {
            return res.status(400).json({ message: "Bad Request: 'question' field (non-empty string) is required." });
        }
        const originalQuestion = req.body.question.trim();
        console.log("Processing question:", originalQuestion);

        // 2. Classify Intent
        console.log("   Classifying intent...");
        const intent = await geminiService.classifyIntent(originalQuestion);
        console.log(`   Intent classified as: ${intent}`);

        // 3. Handle Non-Legal Intents
        switch (intent) {
            case 'GREETING':
                return res.json({ summary: prompts.GREETING_RESPONSE, intent: intent });
            case 'CLARIFICATION_NEEDED':
                return res.json({ summary: prompts.CLARIFICATION_RESPONSE, intent: intent });
            case 'IRRELEVANT':
                return res.json({ summary: prompts.IRRELEVANT_RESPONSE, intent: intent });
            case 'LEGAL_QUERY':
                // Proceed to RAG steps
                break;
            default:
                console.warn(`   Unhandled intent: ${intent}. Proceeding as LEGAL_QUERY.`);
                return res.json({ summary: prompts.IRRELEVANT_RESPONSE, intent: intent });
        }

        // --- RAG Pipeline for LEGAL_QUERY ---

        // 4. Generate Search Queries
        console.log("   Generating search queries...");
        const searchQueries = await geminiService.generateSearchQueries(originalQuestion);

        // 5. Embed and Query Pinecone for each Search Term
        let allMatches = [];
        for (const query of searchQueries) {
            console.log(`   Processing search query: "${query}"`);
            const queryVector = await geminiService.getEmbedding(query);
            const matches = await pineconeService.queryPinecone(queryVector, TOP_K_RESULTS);
            allMatches.push(...matches); // Collect all matches
        }
        console.log(`   Total matches found across all queries: ${allMatches.length}`);


        // 6. De-duplicate, Rank, and Select Top Chunks
        const uniqueMatchesMap = new Map();
        allMatches.forEach(match => {
            // Ensure metadata and text exist before creating key
            const meta = match.metadata || {};
            const textSample = meta.text.substring(0, 50) || 'notext';
            const key = `${meta.title || 'untitled'}-${meta.year || 'noyear'}-${meta.pageNumber || 'nopage'}-${textSample}`; // Example key

            // If duplicate found, keep the one with the higher score
            if (!uniqueMatchesMap.has(key) || (uniqueMatchesMap.has(key) && match.score > uniqueMatchesMap.get(key).score)) {
                uniqueMatchesMap.set(key, match);
            }
        });

        const uniqueRankedMatches = Array.from(uniqueMatchesMap.values())
            .sort((a, b) => b.score - a.score); // Sort by score descending

        const topContextChunks = uniqueRankedMatches.slice(0, FINAL_CONTEXT_CHUNKS);
        console.log(`   Selected ${topContextChunks.length} unique top-scoring chunks for context.`);


        // 7. Generate Summary if Context Found
        let summary;
        let responseData = {
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
                summary = await geminiService.generateSummary(originalQuestion, contextForPrompt);
            } else {
                console.warn("   ⚠️ Top chunks found, but metadata/text missing. Cannot generate summary.");
                summary = prompts.NO_MATCH_RESPONSE + " (Context data was incomplete).";
            }


            // Prepare response using the *best* single match for display purposes
            const bestOverallMatch = topContextChunks[0]; // The highest scoring unique chunk
            const bestMetadata = bestOverallMatch.metadata || {}; // Use empty object as fallback

            console.log(`   Retrieving PDF URL for best match: ${bestMetadata?.title} (${bestMetadata?.year})...`);
            // Only attempt DB lookup if title and year are present
            let docDetails = null;
            if (bestMetadata.title && bestMetadat.year) {
                docDetails = await findDocumentDetails(bestMetadata.title, bestMetadata.year);
            }


            responseData = {
                intent: intent,
                title: bestMetadata.title || 'N/A',
                year: bestMetadata.year || 'N/A',
                pageNumber: bestMetadata.pageNumber || 'N/A',
                summary: summary.trim(),
                originalText: bestMetadata.text || null, // Text from the best chunk
                pdfUrl: docDetails.pdfUrl || bestMetadata.url || null, // Get URL from DB or Pinecone metadata
                matchScore: bestOverallMatch.score // Score of the best chunk
            };
        } else {
            console.log("   No relevant context found after filtering. Sending no-match response.");
            // Ensure the response reflects the NO_MATCH intent/summary
            responseData.summary = prompts.NO_MATCH_RESPONSE;
        }


        // 8. Send Response
        console.log("✅ Query processed successfully. Sending response.");
        return res.json(responseData);

    } catch (err) {
        // Forward error to the global error handler in errorHandler.js
        next(err);
    }
});

module.exports = router;