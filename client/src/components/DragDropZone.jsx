import React, { useRef, useState } from 'react';

export default function DragDropZone({ onFileDrop }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onFileDrop(files[0]);
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) onFileDrop(files[0]);
    e.target.value = '';
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      id="drag-drop-zone"
      aria-label="Drag and drop file upload zone"
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <span className="dropzone-icon">{isDragging ? '📂' : '📁'}</span>
      <div className="dropzone-title">
        {isDragging ? 'Release to drop your file' : 'Drag & drop your file here'}
      </div>
      <div className="dropzone-sub">or click to browse from your computer</div>
      <div className="dropzone-types">
        {['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.zip', '.xlsx'].map((t) => (
          <span key={t} className="type-chip">{t}</span>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="dropzone-input"
        id="file-input"
        onChange={handleInputChange}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.zip,.csv,.xlsx,.pptx,.mp3,.mp4"
      />
    </div>
  );
}
