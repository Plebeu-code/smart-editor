'use client';

import { useCallback, useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface UploadZoneProps {
  onUpload: (file: File) => void;
}

export default function UploadZone({ onUpload }: UploadZoneProps) {
  const { tr } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => { setSelectedFile(file); onUpload(file); },
    [onUpload]
  );

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={`
        relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer
        transition-all duration-300 group
        ${isDragging
          ? 'border-accent bg-accent-glow shadow-gold-lg scale-[1.01]'
          : 'border-border hover:border-accent/50 hover:bg-accent-glow/50'
        }
      `}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onInputChange} />

      {selectedFile ? (
        <div className="animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-bold text-accent">{selectedFile.name}</p>
          <p className="text-text-muted text-sm mt-1">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      ) : (
        <>
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
            bg-accent/10 border border-accent/20 transition-all duration-300
            group-hover:bg-accent/20 group-hover:scale-110
            ${isDragging ? 'bg-accent/25 scale-110' : ''}
          `}>
            <svg
              className={`w-8 h-8 transition-colors ${isDragging ? 'text-accent' : 'text-text-secondary group-hover:text-accent'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="font-bold text-text-primary text-lg">
            {isDragging ? tr.upload.dragging : tr.upload.idle}
          </p>
          <p className="text-text-muted text-sm mt-1">{tr.upload.formats}</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary text-sm hover:border-accent hover:text-accent transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {tr.upload.browse}
          </div>
        </>
      )}
    </div>
  );
}
