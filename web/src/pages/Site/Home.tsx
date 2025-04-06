import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainLayout from '../../layouts/MainLayout';

// SVG icons for features
const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-indigo-600">
    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V7.875L14.25 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" clipRule="evenodd" />
    <path d="M15 5.25a.75.75 0 0 1 .75-.75H21a.75.75 0 0 1 0 1.5h-5.25a.75.75 0 0 1-.75-.75Z" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-indigo-600">
    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
  </svg>
);

const VerifiedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-indigo-600">
    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53-1.471-1.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.137-.089l4-5.59Z" clipRule="evenodd" />
  </svg>
);

// PDF icon and document illustration
const PDFIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
    <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V7.875L14.25 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5Z" clipRule="evenodd" />
    <path d="M15 5.25a.75.75 0 0 1 .75-.75H21a.75.75 0 0 1 0 1.5h-5.25a.75.75 0 0 1-.75-.75Z" />
  </svg>
);

export default function Home() {
  return (
    <MainLayout>
      <div>
        {/* Hero Section */}
        <section className="py-12 md:py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
                PakJuris - Pakistani Legal Knowledge
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Get instant, accurate answers to your legal questions about Pakistani law, with direct references to source documents.
              </p>
              <Link 
                to="/chat" 
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all hover:shadow-xl"
              >
                Start Chatting
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 bg-gray-50 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              Features
            </motion.h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <DocumentIcon />
                <h3 className="text-xl font-semibold mt-4 mb-2">Instant Legal Answers</h3>
                <p className="text-gray-600">
                  Get immediate responses to questions about Pakistani law, codes, and regulations.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <ChatIcon />
                <h3 className="text-xl font-semibold mt-4 mb-2">Natural Conversations</h3>
                <p className="text-gray-600">
                  Ask follow-up questions and have natural conversations about legal topics.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <VerifiedIcon />
                <h3 className="text-xl font-semibold mt-4 mb-2">Verified Sources</h3>
                <p className="text-gray-600">
                  Every answer cites its sources with direct links to official Pakistani legal documents.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PDF Preview Section */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              See Source Documents
            </motion.h2>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="md:flex">
                <div className="md:w-1/2 p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <PDFIcon />
                    <span className="font-semibold text-gray-700">Legal Document</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">View Legal Sources</h3>
                  <p className="text-gray-600 mb-4">
                    See the exact legal documents related to your queries, with the relevant sections highlighted for easy reference.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <span>Verify information directly from official sources</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <span>Highlighted sections for quick reference</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      <span>Download PDFs for your records</span>
                    </li>
                  </ul>
                </div>
                
                <div className="md:w-1/2 bg-gray-100 p-4 flex items-center justify-center">
                  <div className="relative w-full max-w-sm shadow-xl">
                    {/* Simulate PDF document with highlight */}
                    <div className="bg-white rounded border border-gray-300 overflow-hidden">
                      <div className="p-2 bg-gray-200 border-b border-gray-300 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <PDFIcon />
                          <span className="text-xs font-medium">constitution.pdf</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      <div className="p-4 text-sm">
                        <p>Article 1: [1] Pakistan shall be a Federal Republic to be known as the Islamic Republic of Pakistan, hereinafter referred to as Pakistan.</p>
                        <p className="my-2 p-1 bg-yellow-100 rounded">[2] The territories of Pakistan shall comprise -</p>
                        <p>(a) the Provinces of Balochistan, the Khyber Pakhtunkhwa, Punjab and Sindh;</p>
                        <p>(b) the Islamabad Capital Territory, hereinafter referred to as the Federal Capital;</p>
                        <p className="mt-2">[3] Majlis-e-Shoora (Parliament) may by law admit into the Federation new States or areas on such terms and conditions as it thinks fit.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 bg-gradient-to-br from-indigo-50 to-blue-50 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center mb-12"
            >
              How It Works
            </motion.h2>
            
            <div className="grid md:grid-cols-3 gap-6 lg:gap-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Ask a Question</h3>
                <p className="text-gray-600">
                  Type your legal question about Pakistani law in natural language
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Get Answers</h3>
                <p className="text-gray-600">
                  Receive accurate responses based on Pakistani legal documents
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">View Sources</h3>
                <p className="text-gray-600">
                  See the exact legal documents and sections used to answer your question
                </p>
              </motion.div>
            </div>
            
            <div className="text-center mt-12">
              <Link 
                to="/chat" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-all hover:shadow-xl inline-block"
              >
                Start Chatting
              </Link>
              <Link
                to="/about"
                className="bg-transparent text-blue-600 hover:text-blue-800 font-semibold py-3 px-8 rounded-full text-lg transition-colors ml-4 inline-block"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
} 