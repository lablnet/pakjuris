import React, { useState } from 'react';
import axios from 'axios';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function App() {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<any>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [highlightedText, setHighlightedText] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    await axios.post('http://localhost:5000/vectorize', formData);
    setPdfFile(URL.createObjectURL(file));
  };

  const askQuestion = async () => {
    const res = await axios.post('http://localhost:5000/query', { question });
    setAnswer(res.data);
    setHighlightedText(res.data.originalText);
  };

  return (
    <div className="p-4">
      <h1>Legal Chatbot</h1>

      <input type="file" accept="application/pdf" onChange={handleFileUpload} />

      <div className="mt-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question"
          className="border p-2 w-full"
        />
        <button onClick={askQuestion} className="mt-2 p-2 bg-blue-500 text-white">Ask</button>
      </div>

      {answer && (
        <div className="mt-4">
          <h2>Summary</h2>
          <p>{answer.summary}</p>
        </div>
      )}

      {pdfFile && (
        <div className="mt-4">
          <Document file={pdfFile} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
          <div className="mt-4">
            <h2>Highlighted Text</h2>
            <p style={{ backgroundColor: 'yellow' }}>{highlightedText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
