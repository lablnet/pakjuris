import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Feedback from '../models/Feedback';
import Message from '../models/Message';
import ApiError from '../../../utils/ApiError';

/**
 * Create new feedback for a message
 */
export const createFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId, status, reason } = req.body;
    const userId = req.user?.id;
    
    // Validate messageId
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return next(new ApiError('Invalid message ID', 400));
    }
    
    // Validate status
    if (!status || !['liked', 'disliked'].includes(status)) {
      return next(new ApiError('Status must be either "liked" or "disliked"', 400));
    }

    // Check if message exists
    const message = await Message.findById(messageId);
    if (!message) {
      return next(new ApiError('Message not found', 404));
    }

    // Create or update feedback
    const feedback = await Feedback.findOneAndUpdate(
      { userId, messageId },
      { 
        userId,
        messageId,
        conversationId: message.conversationId,
        status,
        reason: status === 'disliked' ? reason : undefined,
        created_at: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ 
      success: true, 
      feedback 
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get feedback for a message
 */
export const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    // Validate messageId
    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return next(new ApiError('Invalid message ID', 400));
    }

    // Find feedback for the message by the current user
    const feedback = await Feedback.findOne({ userId, messageId });

    res.status(200).json({
      success: true,
      feedback: feedback || null
    });
  } catch (error) {
    next(error);
  }
};
