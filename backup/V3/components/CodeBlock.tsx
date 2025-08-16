
import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language: string;
  title: string;
}

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700">
        <h3 className="font-mono text-sm text-gray-300">{title}</h3>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
        >
          {copied ? <CheckIcon/> : <CopyIcon/>}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};
