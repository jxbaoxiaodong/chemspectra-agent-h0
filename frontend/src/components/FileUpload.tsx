"use client";

import { useCallback, useState, type DragEvent } from "react";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_FORMATS = ".spc,.csv,.jdx,.dx,.opus,.spa,.xlsx,.txt,.json,.asc,.prj,.sp,.srs,.dpt";

export default function FileUpload({ onFileChange, disabled }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragOver(true);
  }, [disabled]);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        setFileName(files[0].name);
        onFileChange(files[0]);
      }
    },
    [onFileChange, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        setFileName(files[0].name);
        onFileChange(files[0]);
      }
    },
    [onFileChange]
  );

  const handleClear = useCallback(() => {
    setFileName(null);
    onFileChange(null);
  }, [onFileChange]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">光谱文件</label>
      <div
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragOver
            ? "border-cyan-400 bg-cyan-500/10"
            : disabled
              ? "border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-50"
              : "border-slate-600 bg-slate-800/30 hover:border-cyan-500/50 hover:bg-slate-800/50"
        }`}
      >
        {fileName ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-2 text-cyan-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            {!disabled && (
              <button
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                移除文件
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <svg className="mx-auto h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-slate-400">
              拖拽文件到此处，或
              <label className="mx-1 cursor-pointer text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                浏览选择
                <input
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  onChange={handleFileInput}
                  disabled={disabled}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-slate-600">
              支持 .spc / .csv / .jdx / .dx / .opus / .spa / .xlsx / .txt / .json 等 28+ 格式
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
