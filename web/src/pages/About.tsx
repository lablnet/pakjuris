import React from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../layouts/MainLayout';

const About = () => {
  return (
    <MainLayout>
      <div className="flex-grow overflow-y-auto h-full py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
              <h1 className="text-3xl font-bold mb-4">About Pakistani Law Chatbot</h1>
              <p className="text-lg opacity-90">
                Leveraging AI to make Pakistani laws accessible to everyone
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-blue-700 mb-4">How It Works</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                    >
                      <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center">
                        <span className="mr-2 text-xl">📚</span> Step 1: Data Collection
                      </h3>
                      <p className="text-gray-700">
                        We retrieve legal documents directly from the Pakistan Code site, obtaining PDFs of laws, 
                        regulations, and legal codes that form the foundation of Pakistani legislation.
                      </p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                    >
                      <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center">
                        <span className="mr-2 text-xl">🧠</span> Step 2: Vectorization
                      </h3>
                      <p className="text-gray-700">
                        We process the text and convert it into numerical vectors using OpenAI's text-embedding-3-large model. 
                        This transformation allows us to capture the semantic meaning of legal text in a format that 
                        AI systems can effectively process and understand.
                      </p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                    >
                      <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center">
                        <span className="mr-2 text-xl">🔍</span> Step 3: Vector Storage
                      </h3>
                      <p className="text-gray-700">
                        These vectors are stored in a vector database, allowing for efficient retrieval based on 
                        semantic similarity. When you ask a question, we search for the most relevant legal information 
                        by comparing your query with our stored vectors.
                      </p>
                    </motion.div>
                  </div>

                  <div>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-blue-50 p-8 rounded-xl border border-blue-100 h-full flex flex-col justify-center"
                    >
                      <div className="text-center mb-6">
                        <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
                          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="1.5" />
                            <path d="M12 6V18" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M9 9L15 15" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M15 9L9 15" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="12" cy="12" r="4" fill="#93C5FD" fillOpacity="0.5" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-blue-800">Retrieval Augmented Generation</h3>
                      </div>
                      <p className="text-blue-700">
                        Our system uses a technique called Retrieval Augmented Generation (RAG). 
                        When you ask a question, we:
                      </p>
                      <ul className="list-disc list-inside mt-3 space-y-2 text-blue-700">
                        <li>Analyze your question</li>
                        <li>Find the most relevant legal documents</li>
                        <li>Provide the AI with this context</li>
                        <li>Generate an accurate, contextual response</li>
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold text-blue-700 mb-6">Our Technology Stack</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="#2563EB" strokeWidth="1.5" />
                        <path d="M12 22V12" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M20 7L12 12L4 7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">OpenAI Embeddings</h3>
                    <p className="text-gray-700">
                      We use OpenAI's text-embedding-3-large model to convert legal text into
                      high-dimensional vectors that capture semantic meaning.
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" stroke="#2563EB" strokeWidth="1.5" />
                        <path d="M12 8V16" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M9 10.5L12 8L15 10.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">Gemini Flush 2.0</h3>
                    <p className="text-gray-700">
                      For conversation and natural language understanding, we leverage Gemini Flush 2.0,
                      which helps interpret user queries and generate clear, accurate responses.
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gray-50 p-6 rounded-xl border border-gray-100 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L15 2L15 22L9 22L9 2Z" stroke="#2563EB" strokeWidth="1.5" />
                        <path d="M2 9L22 9L22 15L2 15L2 9Z" stroke="#2563EB" strokeWidth="1.5" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-2">LangChain</h3>
                    <p className="text-gray-700">
                      LangChain serves as the orchestration layer, connecting different components and
                      enabling the seamless flow from query to document retrieval to response generation.
                    </p>
                  </motion.div>
                </div>
              </section>

              <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-amber-50 p-8 rounded-xl border border-amber-100 mb-12"
              >
                <h2 className="text-2xl font-bold text-amber-700 mb-4 flex items-center">
                  <span className="mr-2">⚠️</span> Important Disclaimer
                </h2>
                <div className="text-amber-800">
                  <p className="mb-4">
                    While we strive for accuracy, please be aware of the following limitations:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      The AI may occasionally provide incorrect or incomplete information about Pakistani laws.
                    </li>
                    <li>
                      The system may sometimes comment on legal matters unnecessarily or beyond the scope of your question.
                    </li>
                    <li>
                      Summaries may not capture all nuances or details of the original legal texts.
                    </li>
                    <li className="font-medium">
                      <strong>Always verify information</strong> by checking the references and original legal documents provided alongside responses.
                    </li>
                  </ul>
                  <p className="mt-4 italic text-sm">
                    This tool is designed to assist with understanding Pakistani law but should not be considered legal advice. 
                    For important legal matters, please consult with a qualified legal professional.
                  </p>
                </div>
              </motion.section>

              <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 p-8 rounded-xl border border-blue-100"
              >
                <h2 className="text-2xl font-bold text-blue-700 mb-4">Try It Yourself</h2>
                <p className="text-blue-600 mb-6">
                  Ask a question about Pakistani law and our AI will find relevant legal information
                  and provide a clear, understandable answer with proper citations.
                </p>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="/" 
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Start Chatting
                  </a>
                  <a 
                    href="https://github.com/lablnet/cryonix" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white text-blue-600 border border-blue-200 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View on GitHub
                  </a>
                </div>
              </motion.section>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default About; 