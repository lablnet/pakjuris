import { Request, Response, NextFunction } from 'express';
import Conversation from '../models/Conversation';
import * as geminiService from '../../../services/gemini';
import ApiError from '../../../utils/ApiError';

/**
 * Get all conversations for a user
 */
export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversations = await Conversation.find({ userId })
      .sort({ updated_at: -1 })
      .select('_id userId name created_at updated_at');
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    next(error);
  }
};

/**
 * Get a specific conversation by ID
 */
export const getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversation = await Conversation.findOne({ _id: id, userId });
    
    if (!conversation) {
      throw new ApiError('Conversation not found');
    }
    
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    const { message } = req.body;
    
    if (!message) {
      throw new ApiError('Message is required');
    }
    
    // Generate a name for the conversation using Gemini
    const conversationName = await geminiService.generateConversationName(message);
    
    const conversation = new Conversation({
      userId,
      name: conversationName,
      messages: [{
        role: 'user',
        content: message,
        timestamp: new Date()
      }]
    });
    
    await conversation.save();
    
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a conversation
 */
export const updateConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversation = await Conversation.findOne({ _id: id, userId });
    
    if (!conversation) {
      throw new ApiError('Conversation not found');
    }
    
    if (name) {
      conversation.name = name;
    }
    
    await conversation.save();
    
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    
    if (!conversation) {
      throw new ApiError('Conversation not found');
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
