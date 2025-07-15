import { Request, Response, NextFunction } from 'express'
import Conversation, { IConversation } from '../models/Conversation'
import Message from '../models/Message'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { tools } from '../../../agentRegistry'
import { llm } from '../../../services/openai'
import { systemPrompt } from '../../../utils/promptTemplates'
import * as geminiService from '../../../services/gemini'

// LangGraph RAG Route
let compiled: any
;(async () => {
  try {
    compiled = await createReactAgent({
      llm,
      tools,
      messageModifier: systemPrompt
    })
    console.log('✅ LangGraph agent compiled')
  } catch (error) {
    console.error('❌ Failed to compile LangGraph agent:', error)
  }
})()

/**
 * Process a chat query using RAG pipeline
 */
export const processQuery = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check if user is authenticated
  const user = req.user
  console.log('USER', user)
  if (user) {
    console.log(
      `Processing query for authenticated user: ${
        (user as any).email || (user as any).uid
      }`
    )
  } else {
    console.log('Processing query for unauthenticated user')
  }

  // Get clientId and conversationId from request if available
  const clientId = req.body.clientId
  const conversationId = req.body.conversationId

  // 1. Validate Input
  if (
    !req.body ||
    !req.body.question ||
    typeof req.body.question !== 'string' ||
    req.body.question.trim().length === 0
  ) {
    res.status(400).json({
      message: "Bad Request: 'question' field (non-empty string) is required."
    })
    return
  }
  const originalQuestion = req.body.question.trim()
  console.log('Processing question:', originalQuestion)

  // Create or get conversation
  let conversation: IConversation
  const userId = user ? (user as any)._id || (user as any).id : null

  if (conversationId) {
    // Find existing conversation
    const existingConversation = await Conversation.findById(conversationId)
    if (!existingConversation) {
      console.log(
        `Conversation with ID ${conversationId} not found, creating new conversation`
      )
      // Generate conversation name
      const conversationName = await geminiService.generateConversationName(
        originalQuestion
      )
      // Create new conversation
      conversation = new Conversation({
        userId,
        name: conversationName
      })
      await conversation.save()
    } else {
      conversation = existingConversation
    }
  } else {
    // Generate conversation name for new conversation
    console.log('Creating new conversation')
    const conversationName = await geminiService.generateConversationName(
      originalQuestion
    )
    // Create new conversation
    conversation = new Conversation({
      userId,
      name: conversationName
    })
    await conversation.save()
  }

  // Save user message
  const userMessage = new Message({
    conversationId: conversation._id,
    role: 'user',
    content: originalQuestion
  })
  await userMessage.save()

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
  const input = [{ role: 'user', content: originalQuestion }]
  let finalAnswerSent = false
  let finalResponse = ''
  try {
    const stream = await compiled.stream(
      { messages: input },
      { streamMode: 'updates' }
    )

    // Fix: Ensure stream is iterable
    if (typeof stream[Symbol.asyncIterator] !== 'function') {
      throw new Error('Stream is not iterable — possible LLM misconfig.')
    }

    for await (const update of stream) {
      const [[step, output]] = Object.entries(update) as [string, any][]
      console.log('step, output', step, output)
      send('step', { step, output })

      // Stop after the first final answer
      if (
        step === 'agent' &&
        output.messages?.[0]?.content &&
        !output.tool_calls?.length
      ) {
        finalAnswerSent = true
        finalResponse = output.messages[0].content
        const assistantMessage = new Message({
          conversationId: conversation._id,
          role: 'assistant',
          content: finalResponse,
          metadata: { intent: 'AI' }
        })
        await assistantMessage.save()
        break
      }
    }

    // Send final response explicitly
    if (finalAnswerSent) {
      res.write(`data: ${JSON.stringify({ final: finalResponse })}\n\n`)
    } else {
      const fallback = await compiled.invoke({ messages: input })
      const assistantMessage = new Message({
        conversationId: conversation._id,
        role: 'assistant',
        content: fallback.messages[0].content,
        metadata: { intent: 'AI' }
      })
      await assistantMessage.save()
      res.write(`data: ${JSON.stringify({ final: fallback })}\n\n`)
    }
  } catch (e: any) {
    console.error('RAG error:', e)
    send('error', { message: e.message || 'Unexpected error' })
  } finally {
    res.end()
  }
}
