import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: Date;
}

const MessageSchema: Schema = new Schema({
  conversationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'assistant'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  metadata: { 
    type: Schema.Types.Mixed 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
});

// Add indexes for better query performance
MessageSchema.index({ conversationId: 1, created_at: 1 });

const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message; 