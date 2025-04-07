import { Request, Response, NextFunction } from 'express';
import Conversation from '../models/Conversation';
import * as geminiService from '../../../services/gemini';
import ApiError from '../../../utils/ApiError';
import Message from '../models/Message';

/**
 * Get all conversations for a user
 */
export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversations = await Conversation.find({ userId, archived: { $ne: true } })
      .sort({ updated_at: -1 })
      .select('_id userId name created_at updated_at archived shareId');
    
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
    // get messages from the conversation
    const messages = await Message.find({ conversationId: id });
    if (!conversation) {
      throw new ApiError('Conversation not found');
    }
    // add messages to the conversation
    const data = {
      ...conversation.toObject(),
      messages: messages
    }
    res.json(data);
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

/**
 * Archive or unarchive a conversation
 */
export const archiveConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { archived } = req.body;
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    if (typeof archived !== 'boolean') {
      throw new ApiError('Archived status must be a boolean');
    }
    
    const conversation = await Conversation.findOne({ _id: id, userId });
    
    if (!conversation) {
      throw new ApiError('Conversation not found');
    }
    
    conversation.archived = archived;
    await conversation.save();
    
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all archived conversations for a user
 */
export const getArchivedConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversations = await Conversation.find({ userId, archived: true })
      .sort({ updated_at: -1 })
      .select('_id userId name created_at updated_at archived');
    
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching archived conversations:', error);
    next(error);
  }
};

/**
 * Generate a share link for a conversation
 */
export const shareConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user ? (req.user as any)._id || (req.user as any).id : null;
    
    const conversation = await Conversation.findOne({ _id: id, userId });
    
    if (!conversation) {
      throw new ApiError('Conversation not found');
    }
    
    // Generate a unique shareId if one doesn't exist
    if (!conversation.shareId) {
      conversation.shareId = require('crypto').randomBytes(16).toString('hex');
      await conversation.save();
    }
    
    res.json({
      shareId: conversation.shareId,
      shareUrl: `${req.protocol}://${req.get('host')}/shared/conversation/${conversation.shareId}`
    });
  } catch (error) {
    next(error);
  }
};
