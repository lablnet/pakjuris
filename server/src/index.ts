import dotenv from 'dotenv'
dotenv.config()
import { setMaxListeners } from 'events'
setMaxListeners(50)

import express, { Application, Request, Response } from 'express'
import mongoose, { ConnectOptions } from 'mongoose'
import cors from 'cors'
import authRoutes from './apps/user/routes'
import chatRoutes from './apps/chat/routes'

import authMiddleware from './middleware/authMiddleware'
import asyncHandler from './middleware/asyncHandler'
import cookieParser from 'cookie-parser'
import errorHandler from './middleware/errorHandler'

import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { tools } from './agentRegistry'
import { llm } from './services/openai'
import { systemPrompt } from './utils/promptTemplates'

const app: Application = express()
const port = process.env.PORT || 8000

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:5173'],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// Public Routes
app.use('/api', authRoutes)

// Routes below this middleware require authentication
app.use(asyncHandler(authMiddleware))
app.use('/api/chat', chatRoutes)

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

app.post('/api/rag', async (req: any, res: any) => {
  const { question } = req.body
  if (!question) return res.status(400).json({ error: 'Missing question' })

  if (!compiled) {
    return res
      .status(503)
      .json({ error: 'RAG agent is still compiling. Try again shortly.' })
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
  const input = [{ role: 'user', content: question }]
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
        break
      }
    }

    // Send final response explicitly
    if (finalAnswerSent) {
      res.write(`data: ${JSON.stringify({ final: finalResponse })}\n\n`)
    } else {
      const fallback = await compiled.invoke({ messages: input })
      res.write(`data: ${JSON.stringify({ final: fallback })}\n\n`)
    }
  } catch (e: any) {
    console.error('RAG error:', e)
    send('error', { message: e.message || 'Unexpected error' })
  } finally {
    res.end()
  }
})

// Global Error Handler
app.use(errorHandler)

// Database Connection
const mongoUri = process.env.MONGODB_URI
if (!mongoUri) {
  throw new Error('MONGO_URI is not defined in the environment variables')
}

mongoose
  .connect(mongoUri, {
    ssl: true,
    tlsAllowInvalidCertificates: true
  } as ConnectOptions)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err))

// Start Server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
