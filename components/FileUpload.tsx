import React, { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const FileUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onAnalyze, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col space-y-6">
        <div 
            className={`p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
        >
            <input
                ref={inputRef}
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpeg,.jpg,.png"
                onChange={handleChange}
            />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer">
                <FileUploadIcon/>
                <p className="mt-4 text-gray-700">
                    <span onClick={onButtonClick} className="font-semibold text-blue-600 hover:text-blue-700">클릭하여 업로드</span> 하거나 드래그 앤 드롭
                </p>
                <p className="text-sm text-gray-500 mt-2">PDF, PNG, JPG</p>
                {selectedFile && <p className="mt-4 text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">선택됨: {selectedFile.name}</p>}
            </label>
        </div>
        
        <button
            onClick={onAnalyze}
            disabled={isLoading || !selectedFile}
            className="w-full text-lg font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 px-6 py-4"
        >
            {isLoading ? '분석 중...' : '문서 분석'}
        </button>
    </div>
  );
};