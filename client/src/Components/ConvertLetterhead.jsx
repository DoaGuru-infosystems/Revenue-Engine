import React, { useState, useRef } from 'react';
import API_BASE_URL from "../config/apiBaseUrl";

// Backend URL check karein: router.post('/convert-letterhead', ConvertLetterhead) hona chahiye
const SERVER_URL = `${API_BASE_URL}/auth/api/calculator`;
const ConvertLetterhead = () => {
      const [file, setFile] = useState(null);
      const [isDragging, setIsDragging] = useState(false);
      const [status, setStatus] = useState('idle'); // idle | uploading | done | error
      const [errorMsg, setErrorMsg] = useState('');
      const [progress, setProgress] = useState(0);
      const inputRef = useRef(null);

      const handleFile = (selected) => {
            if (!selected) return;
            const valid =
                  /\.(docx|doc)$/i.test(selected.name) ||
                  selected.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                  selected.type === 'application/msword';

            if (!valid) {
                  setErrorMsg('Only .doc or .docx files are allowed.');
                  setStatus('error');
                  return;
            }

            setFile(selected);
            setStatus('idle');
            setErrorMsg('');
            setProgress(0);
      };

      const handleConvert = async () => {
            if (!file) return;
            setStatus('uploading');
            setProgress(0);
            setErrorMsg('');

            const formData = new FormData();
            formData.append('file', file);

            try {
                  const blob = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();

                        xhr.upload.addEventListener('progress', (e) => {
                              if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 60));
                        });

                        xhr.addEventListener('load', () => {
                              if (xhr.status >= 200 && xhr.status < 300) {
                                    setProgress(100);
                                    resolve(xhr.response);
                              } else {
                                    let msg = 'Server error occurred.';
                                    try {
                                          const text = new TextDecoder().decode(xhr.response);
                                          msg = JSON.parse(text)?.message || msg;
                                    } catch (e) {
                                          console.error('Failed to parse error response:', e);
                                    }
                                    reject(new Error(msg));
                              }
                        });

                        xhr.addEventListener('error', () => reject(new Error('Failed to connect to the server.')));
                        xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')));

                        // API Endpoint updated to match backend
                        xhr.open('POST', `${SERVER_URL}/genratecoatetion`);
                        xhr.responseType = 'blob';
                        xhr.send(formData);
                  });

                  // Fake progress for processing time
                  for (let i = 61; i <= 95; i++) {
                        await new Promise((r) => setTimeout(r, 20));
                        setProgress(i);
                  }

                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = file.name.replace(/\.(docx|doc)$/i, '.pdf');
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);

                  setProgress(100);
                  setStatus('done');
            } catch (err) {
                  setErrorMsg(err.message || 'Something went wrong.');
                  setStatus('error');
                  setProgress(0);
            }
      };

      const reset = () => {
            setFile(null);
            setStatus('idle');
            setErrorMsg('');
            setProgress(0);
      };

      const isUploading = status === 'uploading';

      return (
            <div className="w-full max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

                  <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Header */ }
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                              </svg>
                        </div>
                        <div>
                              <h2 className="text-white font-bold text-xl tracking-tight">Letterhead Converter</h2>
                              <p className="text-gray-400 text-sm mt-1">Add official branding to your Word docs</p>
                        </div>
                  </div>

                  {/* Drop Zone */ }
                  { status !== 'done' && (
                        <div
                              onClick={ () => !isUploading && inputRef.current.click() }
                              onDragOver={ (e) => {
                                    e.preventDefault();
                                    if (!isUploading) setIsDragging(true);
                              } }
                              onDragLeave={ () => setIsDragging(false) }
                              onDrop={ (e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    handleFile(e.dataTransfer.files[0]);
                              } }
                              className={ [
                                    'relative z-10 rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all duration-300 select-none flex flex-col items-center justify-center min-h-[200px] group',
                                    isUploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                                    isDragging ? 'border-orange-400 bg-orange-500/10 scale-[1.02]' : '',
                                    file ? 'border-orange-500/50 bg-orange-500/5' : 'border-gray-700/60 hover:border-orange-500/50 hover:bg-gray-800/50',
                              ].join(' ') }
                        >
                              <input
                                    ref={ inputRef }
                                    type="file"
                                    accept=".doc,.docx"
                                    className="hidden"
                                    onChange={ (e) => handleFile(e.target.files[0]) }
                                    disabled={ isUploading }
                              />

                              { file ? (
                                    <div className="flex flex-col items-center gap-2">
                                          <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mb-2 shadow-inner border border-orange-500/20">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                          </div>
                                          <p className="text-gray-100 font-medium text-base truncate max-w-[220px] px-2">
                                                { file.name }
                                          </p>
                                          <p className="text-gray-500 text-sm">{ (file.size / 1024).toFixed(1) } KB</p>

                                          { !isUploading && (
                                                <button
                                                      onClick={ (e) => { e.stopPropagation(); reset(); } }
                                                      className="mt-4 text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg px-4 py-1.5 transition-all"
                                                >
                                                      Change File
                                                </button>
                                          ) }
                                    </div>
                              ) : (
                                    <div className="flex flex-col items-center gap-3">
                                          <div className="p-4 bg-gray-800 rounded-full mb-2 group-hover:scale-110 transition-transform duration-300 shadow-md">
                                                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                          </div>
                                          <p className="text-gray-300 text-base">
                                                Drag & drop or <span className="text-orange-400 font-medium">browse</span>
                                          </p>
                                          <p className="text-gray-500 text-sm">Supports .doc, .docx (Max 20MB)</p>
                                    </div>
                              ) }
                        </div>
                  ) }

                  {/* Progress Bar */ }
                  { isUploading && (
                        <div className="mt-6 bg-gray-950/50 p-4 rounded-xl border border-gray-800 relative z-10">
                              <div className="flex justify-between text-sm text-gray-300 mb-2">
                                    <span>{ progress < 62 ? 'Uploading...' : 'Applying Letterhead...' }</span>
                                    <span className="font-semibold text-orange-400">{ progress }%</span>
                              </div>
                              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                                    <div
                                          className="h-full bg-gradient-to-r from-orange-500 via-orange-500 to-orange-500 rounded-full transition-all duration-300 ease-out bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite]"
                                          style={ { width: `${progress}%` } }
                                    />
                              </div>
                        </div>
                  ) }

                  {/* Error Message */ }
                  { status === 'error' && (
                        <div className="mt-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3.5 text-sm relative z-10">
                              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="leading-relaxed">{ errorMsg }</span>
                        </div>
                  ) }

                  {/* Success State */ }
                  { status === 'done' && (
                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-8 text-center mt-2 relative z-10">
                              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-yellow-500/30">
                                    <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                              </div>
                              <h3 className="text-white font-bold text-xl mb-2">Success!</h3>
                              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    Your branded PDF has been generated and downloaded successfully.
                              </p>
                              <button
                                    onClick={ reset }
                                    className="w-full text-sm font-semibold text-gray-200 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl px-6 py-3.5 transition-all active:scale-[0.98]"
                              >
                                    Convert Another
                              </button>
                        </div>
                  ) }

                  {/* Action Button */ }
                  { file && status !== 'done' && (
                        <button
                              onClick={ handleConvert }
                              disabled={ isUploading }
                              className={ [
                                    'relative z-10 w-full mt-6 py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200',
                                    isUploading
                                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                          : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/25 active:scale-[0.98]',
                              ].join(' ') }
                        >
                              { isUploading ? 'Processing...' : 'Apply Letterhead & Convert' }
                        </button>
                  ) }
            </div>
      );
};

export default ConvertLetterhead;
