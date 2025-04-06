/**
 * MongoDB service for document operations
 */
import mongoose from 'mongoose';

// Define document interface
export interface DocumentDetails {
  title: string;
  year: string;
  url: string;
  numPages?: number;
  categories?: string[];
}

// Define document schema
const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: String, required: true },
  url: { type: String, required: true },
  numPages: { type: Number },
  categories: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create model (if it doesn't exist)
const DocumentModel = mongoose.models.Document || 
  mongoose.model<DocumentDetails & mongoose.Document>('Document', documentSchema);

/**
 * Finds document details in MongoDB
 * @param title - Document title
 * @param year - Document year
 * @returns Document details including PDF URL
 */
export const findDocumentDetails = async (title: string, year: string): Promise<DocumentDetails | null> => {
  try {
    console.log(`Finding document details for: ${title} (${year})`);
    
    // Ensure connection is established
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB connection not established. Attempting to connect...");
      await mongoose.connect(process.env.MONGODB_URI || '');
    }
    
    // Query document
    const document = await DocumentModel.findOne({ 
      title: { $regex: new RegExp(title, 'i') }, // Case insensitive search
      year 
    }).lean() as (DocumentDetails & { _id: string }) | null;

    if (!document) {
      console.warn(`Document not found: ${title} (${year})`);
      return null;
    }

    return {
      title: document.title,
      year: document.year,
      url: document.url,
      numPages: document.numPages,
      categories: document.categories
    };
  } catch (error) {
    console.error("❌ Error finding document:", error);
    throw error;
  }
};
