import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  userId: string;
  messageId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  status: 'liked' | 'disliked';
  reason?: string;
  created_at: Date;
}

const FeedbackSchema: Schema = new Schema({
  userId: { 
    type: String, 
    required: true,
    index: true 
  },
  messageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message', 
    required: true,
    index: true 
  },
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['liked', 'disliked'], 
    required: true 
  },
  reason: { 
    type: String 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

// Add compound index for preventing duplicate feedback
FeedbackSchema.index({ userId: 1, messageId: 1 }, { unique: true });

const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
