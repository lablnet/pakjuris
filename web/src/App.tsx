import React, { useState } from 'react';
import axios from 'axios';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function App() {
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ question: string, answer: any }[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [highlightText, setHighlightText] = useState('');
  const [highlightPage, setHighlightPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);

  const handleAsk = async () => {
    const res = await axios.post('http://localhost:5000/query', { question });

    setChatHistory((prev: { question: string, answer: any }[]) => [...prev, { question, answer: res.data }]);
    setPdfUrl(res.data.pdfUrl);
    setHighlightText(res.data.originalText);
    setHighlightPage(res.data.pageNumber);
    setQuestion('');
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">🇵🇰 Pakistani Law Chatbot</h1>

      <div className="flex-grow overflow-auto mb-4 p-4 bg-white shadow rounded-lg">
        {chatHistory.map((item: any, idx: number) => (
          <div key={idx} className="mb-6">
            <p className="font-semibold">🗨️ {item.question}</p>
            <p className="mt-2 bg-gray-50 p-2 rounded shadow-sm">🤖 {item.answer.summary}</p>
            <small className="text-gray-500">📖 {item.answer.title} ({item.answer.year}), Page {item.answer.pageNumber}</small>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border border-gray-300 rounded w-full p-2 shadow"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about Pakistani laws..."
        />
        <button className="bg-blue-600 text-white px-4 rounded shadow" onClick={handleAsk}>
          Ask
        </button>
      </div>

      {pdfUrl && (
        <div className="mt-4 flex flex-col items-center">
          <h2 className="font-bold mb-2">Document Preview (Page {highlightPage})</h2>
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          >
            <Page pageNumber={highlightPage} />
          </Document>

          <div className="mt-4 w-full bg-yellow-100 p-4 rounded shadow overflow-auto max-h-64">
            <h3 className="font-semibold">Highlighted Text:</h3>
            <p>{highlightText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
