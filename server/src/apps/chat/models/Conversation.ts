import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  _id: string;
  userId?: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  archived?: boolean;
  shareId?: string;
}

const ConversationSchema: Schema = new Schema({
  userId: { type: String },
  name: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  archived: { type: Boolean, default: false },
  shareId: { type: String }
});

// Update the timestamp before saving
ConversationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
