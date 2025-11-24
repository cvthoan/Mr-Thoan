

import React, { useRef, useState, useEffect } from 'react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    customAudioUrl: string | null;
    onOpenQuotaHelp: () => void;
    onAudioChange: () => void;
    onOpenFeedbackModal: () => void;
    onOpenCollectionNameModal: () => void;
    onOpenSubscriptionModal: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400 border-b-2 border-teal-500/30 pb-2">
            {title}
        </h3>
        <div className="space-y-2 text-gray-300 pl-2">
            {children}
        </div>
    </div>
);

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, customAudioUrl, onOpenQuotaHelp, onAudioChange, onOpenFeedbackModal, onOpenCollectionNameModal, onOpenSubscriptionModal }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const originalContentRef = useRef(new Map<HTMLElement, string>());
    const isSpeakingRef = useRef(false);
    const activeLineRef = useRef<HTMLElement | null>(null);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [zoomLevel, setZoomLevel] = useState(1.0);
    
    const [customAudioName, setCustomAudioName] = useState<string | null>(null);
    const [audioMessage, setAudioMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    
    // Universal cleanup function
    const cleanupSpeech = () => {
        window.speechSynthesis.cancel();
        originalContentRef.current.forEach((originalHTML, element) => {
            element.innerHTML = originalHTML;
        });
        originalContentRef.current.clear();
        if (activeLineRef.current) {
            activeLineRef.current.classList.remove('tts-line-active');
            activeLineRef.current = null;
        }
        isSpeakingRef.current = false;
        setIsSpeaking(false);
    };

    const handleZoom = (direction: 'in' | 'out' | 'reset') => {
        if (direction === 'in') {
            setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
        } else if (direction === 'out') {
            setZoomLevel(prev => Math.max(prev - 0.1, 0.8));
        } else {
            setZoomLevel(1.0);
        }
    };

    // Main cleanup effect
    useEffect(() => {
        return () => {
            cleanupSpeech();
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Voice loading effect
    useEffect(() => {
        const populateVoiceList = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };

        populateVoiceList();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    // Custom audio and modal state management
     useEffect(() => {
        if (customAudioUrl && isOpen) {
            audioRef.current = new Audio(customAudioUrl);
            audioRef.current.onended = () => setIsPlaying(false);
            audioRef.current.onerror = () => {
                console.error("Error playing custom audio.");
                setIsPlaying(false);
            };
        } else {
            audioRef.current = null;
        }

        if (!isOpen) {
            cleanupSpeech();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsPlaying(false);
            setZoomLevel(1.0); // Reset zoom on close
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [customAudioUrl, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setAudioMessage(null);
            const savedAudioInfo = localStorage.getItem('customHelpAudioInfo');
            if (savedAudioInfo) {
                const info = JSON.parse(savedAudioInfo);
                setCustomAudioName(info.name);
            } else {
                setCustomAudioName(null);
            }
        }
    }, [isOpen]);

    const handleToggleSpeech = () => {
        if (!window.speechSynthesis) {
            alert('Trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.');
            return;
        }

        if (isSpeakingRef.current) {
            cleanupSpeech();
            return;
        }

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }

        const contentEl = contentRef.current;
        if (!contentEl) return;
        
        // Select potential block-level elements that should be read sequentially.
        const allPotentialElements = Array.from(contentEl.querySelectorAll('h3, p, li, strong')) as HTMLElement[];
        const elementsToSpeak: HTMLElement[] = [];

        for (const el of allPotentialElements) {
            // If this element is already inside another element that we've decided to speak, skip it to avoid duplication.
            // This works because querySelectorAll returns elements in document order (parent before child).
            if (elementsToSpeak.some(parent => parent !== el && parent.contains(el))) {
                continue;
            }

            // If the element has meaningful text content, add it to the list.
            if (el.innerText.trim().length > 0) {
                elementsToSpeak.push(el);
            }
        }


        if (elementsToSpeak.length === 0) return;

        let currentIndex = 0;
        isSpeakingRef.current = true;
        setIsSpeaking(true);

        const speakNext = () => {
            if (currentIndex >= elementsToSpeak.length || !isSpeakingRef.current) {
                cleanupSpeech();
                return;
            }

            const element = elementsToSpeak[currentIndex];
            
            if (activeLineRef.current) {
                activeLineRef.current.classList.remove('tts-line-active');
            }
            element.classList.add('tts-line-active');
            activeLineRef.current = element;

            const originalText = element.innerText;
            originalContentRef.current.set(element, element.innerHTML);
            const originalWords = originalText.trim().split(/\s+/);
            element.innerHTML = originalWords.map(word => `<span>${word}</span>`).join(' ');
            const wordSpans = Array.from(element.querySelectorAll('span'));
            
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            
            // --- NEW MAPPING LOGIC ---
            const boundaryMap: { startIndex: number; spanIndex: number }[] = [];
            const spokenTextParts: string[] = [];
            let spokenTextCursor = 0;

            originalWords.forEach((word, index) => {
                let spokenWord = word;
                // Use regex with word boundaries (\b) to avoid replacing parts of words and to be case-insensitive (i)
                if (/\bQC\b/i.test(word)) {
                    spokenWord = word.replace(/\bQC\b/i, 'Quảng cáo');
                } else if (/\bAI\b/i.test(word)) {
                    spokenWord = word.replace(/\bAI\b/i, 'ây ai');
                }
                
                boundaryMap.push({ startIndex: spokenTextCursor, spanIndex: index });
                spokenTextParts.push(spokenWord);
                spokenTextCursor += spokenWord.length + 1; // +1 for the space
            });

            const textToSpeak = spokenTextParts.join(' ');
            // --- END NEW MAPPING LOGIC ---

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            
            let voicesToUse = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
            if (voicesToUse.length > 0) {
                 const vietnameseVoice = 
                    voicesToUse.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) ||
                    voicesToUse.find(v => v.lang === 'vi-VN');
                if (vietnameseVoice) {
                    utterance.voice = vietnameseVoice;
                }
            }
            
            utterance.lang = 'vi-VN';
            utterance.rate = 1.0;
            
            let lastHighlightedSpanIndex = -1;
            
            utterance.onboundary = (event) => {
                 if (event.name !== 'word' || !isSpeakingRef.current) return;

                 let currentSpanIndex = -1;
                 // Find the last boundary start index that is less than or equal to the current character index
                 for (let i = boundaryMap.length - 1; i >= 0; i--) {
                     if (event.charIndex >= boundaryMap[i].startIndex) {
                         currentSpanIndex = boundaryMap[i].spanIndex;
                         break;
                     }
                 }

                 if (currentSpanIndex !== -1 && currentSpanIndex !== lastHighlightedSpanIndex) {
                     if (lastHighlightedSpanIndex !== -1 && wordSpans[lastHighlightedSpanIndex]) {
                         wordSpans[lastHighlightedSpanIndex].classList.remove('tts-word-active');
                     }
                     if (wordSpans[currentSpanIndex]) {
                         wordSpans[currentSpanIndex].classList.add('tts-word-active');
                     }
                     lastHighlightedSpanIndex = currentSpanIndex;
                 }
            };

            utterance.onend = () => {
                const originalHTML = originalContentRef.current.get(element);
                if (originalHTML !== undefined) {
                    element.innerHTML = originalHTML;
                    originalContentRef.current.delete(element);
                }
                
                if (!isSpeakingRef.current) {
                    cleanupSpeech();
                    return;
                }
                
                currentIndex++;
                setTimeout(speakNext, 150);
            };

            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                // The 'interrupted' error is not critical. It's fired when
                // window.speechSynthesis.cancel() is called, which is a
                // user-controlled action (e.g., stopping the speech).
                // We can safely ignore it and not pollute the console.
                if (e.error === 'interrupted') {
                    return;
                }
                console.error("Speech synthesis error:", e.error, e);
                cleanupSpeech();
            };

            window.speechSynthesis.speak(utterance);
        };

        speakNext();
    };

    const handleToggleCustomAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        } else {
            if (isSpeakingRef.current) {
                cleanupSpeech();
            }
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            setIsPlaying(true);
        }
    };

    const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAudioMessage(null);
        const file = event.target.files?.[0];

        if (event.target) {
            event.target.value = '';
        }
        
        if (!file) return;

        const allowedTypes = ['audio/mpeg', 'audio/wav'];
        if (!allowedTypes.includes(file.type)) {
            setAudioMessage({ type: 'error', text: 'Lỗi: Vui lòng chỉ tải lên file MP3 hoặc WAV.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
             setAudioMessage({ type: 'error', text: 'Lỗi: File quá lớn. Vui lòng chọn file dưới 5MB.' });
            return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                if (e.target && typeof e.target.result === 'string') {
                    const dataUrl = e.target.result;
                    localStorage.setItem('customHelpAudioData', dataUrl); 
                    localStorage.setItem('customHelpAudioInfo', JSON.stringify({ name: file.name }));
                    setCustomAudioName(file.name);
                    setAudioMessage({ type: 'success', text: `Đã lưu file: ${file.name}` });
                } else {
                    throw new Error("Could not read file result as string.");
                }
            } catch (error) {
                 console.error("Error processing audio file:", error);
                 let errorMessage = 'Đã xảy ra lỗi khi xử lý file.';
                 if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
                    errorMessage = 'Lỗi: Dung lượng lưu trữ của trình duyệt đã đầy. File âm thanh quá lớn để lưu. Vui lòng thử lại với file nhỏ hơn (dưới 3-4MB).';
                 }
                 setAudioMessage({ type: 'error', text: errorMessage });
                 localStorage.removeItem('customHelpAudioData');
                 localStorage.removeItem('customHelpAudioInfo');
                 setCustomAudioName(null);
            } finally {
                onAudioChange();
            }
        };

        reader.onerror = () => {
             console.error("FileReader error");
             setAudioMessage({ type: 'error', text: 'Đã xảy ra lỗi khi đọc file.' });
             localStorage.removeItem('customHelpAudioData');
             localStorage.removeItem('customHelpAudioInfo');
             setCustomAudioName(null);
             onAudioChange();
        };

        reader.readAsDataURL(file);
    };
    
    const handleDeleteAudio = () => {
        localStorage.removeItem('customHelpAudioData');
        localStorage.removeItem('customHelpAudioInfo');
        setCustomAudioName(null);
        setAudioMessage({ type: 'success', text: 'Đã xóa file âm thanh.' });
        onAudioChange();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-[#100303] flex flex-col z-[101] p-4 sm:p-8"
            onClick={onClose}
        >
            <div 
                className="relative bg-[#2a0000] w-full h-full p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl border-2 border-teal-500/30 transform text-gray-200 flex flex-col"
                onClick={e => e.stopPropagation()}
                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
            >
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <div className="hidden sm:flex items-center gap-1 bg-black/50 border border-gray-700 rounded-full px-2 py-0.5">
                        <button onClick={() => handleZoom('out')} disabled={zoomLevel <= 0.8} className="text-gray-300 hover:text-white disabled:opacity-50 p-1" title="Thu nhỏ">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
                        </button>
                        <span onClick={() => handleZoom('reset')} className="text-xs font-semibold text-gray-200 cursor-pointer tabular-nums w-10 text-center" title="Reset Zoom">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => handleZoom('in')} disabled={zoomLevel >= 1.5} className="text-gray-300 hover:text-white disabled:opacity-50 p-1" title="Phóng to">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        </button>
                    </div>
                    {customAudioUrl && (
                        <button 
                            onClick={handleToggleCustomAudio}
                            className="text-gray-400 hover:text-white transition-colors"
                            title={isPlaying ? 'Dừng giọng mẫu' : 'Nghe giọng mẫu'}
                        >
                            {isPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
                                </svg>
                            )}
                        </button>
                    )}
                    <button 
                        onClick={handleToggleSpeech}
                        className="text-gray-400 hover:text-white transition-colors"
                        title={isSpeaking ? 'Dừng đọc' : 'Nghe hướng dẫn (giọng AI)'}
                    >
                        {isSpeaking ? (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Đóng"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-orange-200 flex-shrink-0">
                    Hướng Dẫn Sử Dụng Chi Tiết
                </h2>
                
                <div ref={contentRef} className="space-y-4 text-base overflow-y-auto pr-4 flex-grow">
                    <HelpSection title="⭐ Quy Trình Làm Việc Hiệu Quả Nhất">
                        <div className="space-y-4">
                            <div className="p-3 bg-teal-900/50 rounded-lg border border-teal-500/50">
                                <strong className="text-lg">Bước 1: Tạo "Ảnh Gốc" Chất Lượng Cao với "Ma-nơ-canh Vô hình"</strong>
                                <p className="mt-1">
                                    Đây là bước <strong className="text-amber-300">QUAN TRỌNG NHẤT</strong>. Hãy luôn bắt đầu với tab <strong className="text-amber-300">"TẠO DÁNG & QC"</strong> &gt; chế độ <strong className="text-amber-300">"Ma-nơ-canh Vô hình"</strong>. Chức năng này sẽ biến ảnh sản phẩm bạn tự chụp (dù sơ sài) thành một bộ 4 ảnh chuyên nghiệp trên nền trắng.
                                </p>
                                <p className="mt-2">
                                    Hãy xem bộ ảnh này là <strong className="text-white">"nguyên liệu gốc"</strong> hoàn hảo. Từ đây, bạn có thể cho người mẫu mặc, tạo video, thay phông nền... mà không cần chụp lại.
                                </p>
                                <p className="mt-2 text-sm text-gray-300 italic pl-4 border-l-2 border-gray-600">
                                    <strong>Ví dụ:</strong> Bạn có 1 ảnh chụp vội chiếc váy trên sàn. Hãy vào 'Ma-nơ-canh Vô hình', tải ảnh đó lên. AI sẽ tự động tách váy, làm sạch và tạo ra 4 ảnh (trước, sau, trái, phải) chuyên nghiệp, sẵn sàng cho các bước tiếp theo.
                                </p>
                            </div>
                            <div className="p-3 bg-teal-900/50 rounded-lg border border-teal-500/50">
                                <strong className="text-lg">Bước 2: Dùng "Ảnh Gốc" để Sáng Tạo</strong>
                                <p className="mt-1">
                                    Sau khi có bộ ảnh ma-nơ-canh, hãy chuyển sang các tab khác (ví dụ: chế độ <strong className="text-amber-300">"Người Mẫu"</strong> hoặc tab <strong className="text-amber-300">"VIDEO"</strong>). Trong phần tải ảnh của các tab này, bạn sẽ thấy một mục mới xuất hiện: <strong className="text-white">"Hoặc chọn từ kết quả đã tạo"</strong>.
                                </p>
                                <p className="mt-2">
                                    Hãy bấm vào ảnh ma-nơ-canh bạn vừa tạo để chọn nó làm ảnh đầu vào cho các tác vụ sáng tạo mới.
                                </p>
                                <p className="mt-2 text-sm text-gray-300 italic pl-4 border-l-2 border-gray-600">
                                    <strong>Ví dụ:</strong> Sau khi có 4 ảnh váy ma-nơ-canh, bạn qua tab 'TẠO DÁNG & QC' &gt; chế độ 'Người Mẫu'. Ở mục '1. Nguồn ảnh sản phẩm', bạn sẽ thấy 4 ảnh váy đó. Bấm vào ảnh mặt trước để bắt đầu cho người mẫu mặc.
                                </p>
                            </div>
                            <div className="p-3 bg-teal-900/50 rounded-lg border border-teal-500/50">
                                <strong className="text-lg">Bước 3: Hoàn Thiện Với Nội Dung Quảng Cáo</strong>
                                <p className="mt-1">
                                    Khi đã có những bức ảnh người mẫu mặc sản phẩm ưng ý, hãy quay lại tab <strong className="text-amber-300">"TẠO DÁNG & QC"</strong> và chọn chế độ <strong className="text-amber-300">"Viết QC"</strong>.
                                </p>
                                <p className="mt-2">
                                    Mục 'Chọn hoặc tải ảnh' sẽ tự động hiển thị các ảnh người mẫu bạn vừa tạo. Chọn tấm đẹp nhất, điền thông tin khuyến mãi và phong cách bạn muốn, AI sẽ lo phần còn lại.
                                </p>
                                <p className="mt-2 text-sm text-gray-300 italic pl-4 border-l-2 border-gray-600">
                                    <strong>Ví dụ:</strong> Bạn đã có 4 ảnh người mẫu mặc chiếc váy rất đẹp. Chuyển sang 'Viết QC'. Chọn 1 trong 4 ảnh đó, nhập vào ô thông tin: <em className="text-white">"Giá 250K, phong cách sang chảnh, review chân thật"</em>. Bấm nút và bạn sẽ có ngay một bài đăng Facebook hoàn chỉnh.
                                </p>
                            </div>
                        </div>
                    </HelpSection>
                    
                    <HelpSection title="🔧 Chi Tiết Các Chức Năng Chính">
                        <ul className="space-y-4">
                            <li>
                                <strong>- TẠO DÁNG & QC:</strong> Đây là trung tâm chính của ứng dụng, bao gồm 4 chế độ:
                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                    <li><strong className="text-amber-300">Ma-nơ-canh Vô hình:</strong> Tạo ảnh sản phẩm như đang mặc trên người vô hình, thấy được cả cổ áo bên trong. Chuẩn ảnh catalog chuyên nghiệp.
                                        <p className="mt-1 text-xs text-gray-400 italic">Mẹo: Nếu sản phẩm có mặt trước và mặt sau, hãy tải lên cả 2 ảnh cùng lúc để AI tái tạo 4 góc nhìn chính xác hơn.</p>
                                    </li>
                                    <li><strong className="text-amber-300">Người Mẫu:</strong> Cho người mẫu AI mặc sản phẩm của bạn. Bạn có thể chọn người mẫu lớn/trẻ em, nam/nữ, chọn bối cảnh, và thậm chí ghép mặt của người mẫu riêng vào.
                                        <p className="mt-1 text-xs text-gray-400 italic">Mẹo: Để ghép mặt đẹp nhất, hãy dùng ảnh chân dung chụp chính diện, rõ nét, không bị che khuất.</p>
                                    </li>
                                    <li><strong className="text-amber-300">Ảnh Sáng tạo:</strong> Biến sản phẩm của bạn thành một tác phẩm nghệ thuật để gây ấn tượng.
                                        <p className="mt-1 text-xs text-gray-400 italic">Ví dụ: Biến chiếc giày thành một hòn đảo tí hon, hoặc tạo poster phim bom tấn với áo khoác làm nhân vật chính.</p>
                                    </li>
                                    <li><strong className="text-amber-300">Viết QC:</strong> AI tự động phân tích ảnh sản phẩm và viết bài quảng cáo Facebook/Zalo hoàn chỉnh, bao gồm tiêu đề, nội dung, và hashtag.
                                        <p className="mt-1 text-xs text-gray-400 italic">Mẹo: Hãy ghi rõ các thông tin quan trọng như 'size S M L', 'chất liệu cotton' vào ô nhập thông tin để bài viết đầy đủ hơn.</p>
                                    </li>
                                </ul>
                            </li>
                            <li><strong>- TÁCH SẢN PHẨM:</strong> Tải lên ảnh chụp thực tế (feedback của khách, ảnh chụp trên người,...), AI sẽ tự động tách riêng sản phẩm ra nền trắng và tạo thêm mặt sau. Rất hữu ích để biến ảnh feedback thành ảnh sản phẩm chuyên nghiệp.</li>
                            <li><strong>- GẤP ĐỒ:</strong> Tự động tạo ảnh sản phẩm được gấp gọn gàng. Hoàn hảo để đăng kèm trong bộ ảnh sản phẩm, cho khách thấy sản phẩm khi được đóng gói.</li>
                            <li><strong>- VIDEO:</strong>
                                 <ul className="list-disc pl-5 mt-2 space-y-2">
                                     <li><strong className="text-amber-300">Video 360°:</strong> Tạo video sản phẩm xoay tròn 360 độ. Nên dùng ảnh sản phẩm đã được tách nền để có video đẹp nhất.</li>
                                     <li><strong className="text-amber-300">Video Sáng tạo:</strong> Biến ảnh tĩnh thành video ngắn theo kịch bản.
                                        <p className="mt-1 text-xs text-gray-400 italic">Ví dụ: Chọn ý tưởng "Video cinematic quay chậm, máy quay bay vòng quanh sản phẩm đang trôi nổi giữa một vườn hoa anh đào."</p>
                                     </li>
                                     <li><strong className="text-amber-300">Dáng đi Người mẫu:</strong> Tạo video người mẫu mặc sản phẩm và trình diễn các dáng đi chuyên nghiệp. Cần dùng ảnh đã tạo từ chế độ "Người Mẫu" để có kết quả tốt nhất.</li>
                                 </ul>
                            </li>
                            <li><strong>- SÁNG TẠO PHÔNG NỀN:</strong> Thay thế phông nền cho ảnh sản phẩm của bạn.
                                <p className="mt-1 text-xs text-gray-400 italic">Lưu ý: Chức năng này yêu cầu ảnh sản phẩm đã được tách nền sẵn để đạt hiệu quả cao nhất.</p>
                            </li>
                        </ul>
                    </HelpSection>

                    <HelpSection title="💡 Lưu Ý Quan Trọng & Mẹo Vặt">
                        <ul className="list-disc pl-5 space-y-3">
                            <li>
                                <strong className="text-amber-300">Chức năng "Làm Sạch":</strong> Trong kết quả của chế độ 'Ma-nơ-canh Vô hình', nếu thấy còn sót lại chi tiết thừa (cổ áo ma-nơ-canh), hãy di chuột vào ảnh và dùng nút <strong className="text-white">'Làm sạch Tự động'</strong> hoặc <strong className="text-white">'Làm sạch Bằng bút'</strong> để xóa chúng một cách dễ dàng.
                            </li>
                            <li>
                                <strong className="text-amber-300">Lỗi Hạn Ngạch API (Quota):</strong> Nếu gặp lỗi 'Hạn ngạch', đừng lo lắng. Đây là lỗi phổ biến. Bấm vào nút <strong className="text-white">'Giải Đáp Lỗi Hạn Ngạch'</strong> bên dưới để xem hướng dẫn chi tiết cách khắc phục.
                            </li>
                            <li>
                                <strong className="text-amber-300">Thiết lập Tên Bộ Sưu Tập (BST):</strong> Sử dụng nút 'Thiết lập Tên BST' để đặt tên cho các sản phẩm của bạn.
                                <p className="mt-1 text-xs text-gray-400 italic">Ví dụ: Đặt tên là 'Vay-He-2024'. Khi tải ảnh về, tên file sẽ tự động có dạng 'Vay-He-2024_01.png', giúp bạn quản lý file dễ dàng hơn rất nhiều.</p>
                            </li>
                            <li>
                                <strong className="text-amber-300">Chất lượng ảnh đầu vào:</strong> Ảnh tải lên càng rõ nét, AI hoạt động càng chính xác. Tuy nhiên, ứng dụng vẫn xử lý tốt với các ảnh chụp bằng điện thoại thông thường.
                            </li>
                        </ul>
                    </HelpSection>

                    <HelpSection title="⚙️ Các Tùy Chọn Khác">
                        <ul className="list-disc pl-5 space-y-3">
                            <li><strong className="text-amber-300">LẠP API KEY:</strong> Dùng để nhập API Key của bạn. Nếu gặp lỗi 'Hạn ngạch', bạn cần tạo key mới trong một Project Google Cloud mới và dán vào đây.</li>
                            <li><strong className="text-amber-300">Thiết lập thông tin Shop:</strong> Nhập Tên Shop, Hotline, Zalo của bạn. Thông tin này sẽ được tự động chèn vào cuối mỗi bài viết quảng cáo do AI tạo ra.</li>
                            <li><strong className="text-amber-300">Gia Hạn Sử Dụng:</strong> Dùng để nhập mật khẩu gia hạn khi được nhà cung cấp cấp riêng. Nếu bạn gia hạn bằng chuyển khoản, hệ thống sẽ tự động cập nhật.</li>
                            <li><strong className="text-amber-300">Đánh giá:</strong> Gửi phản hồi, góp ý hoặc báo lỗi về cho tác giả để giúp ứng dụng ngày càng tốt hơn.</li>
                            <li><strong className="text-amber-300">Tham gia nhóm Zalo:</strong> Tham gia cộng đồng người dùng để chia sẻ kinh nghiệm, hỏi đáp và nhận các thông báo mới nhất.</li>
                            <li><strong className="text-amber-300">Liên hệ tác giả:</strong> Liên hệ trực tiếp với Mr. Thoan qua Zalo (0988771339) để được hỗ trợ nhanh nhất.</li>
                        </ul>
                    </HelpSection>
                </div>

                <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-700 space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button onClick={onOpenQuotaHelp} className="font-semibold text-amber-300 bg-amber-900/50 border border-amber-600 px-4 py-2 rounded-lg hover:bg-amber-800/50 transition-colors">Giải Đáp Lỗi Hạn Ngạch</button>
                        <button onClick={onOpenFeedbackModal} className="font-semibold text-cyan-300 bg-cyan-900/50 border border-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-800/50 transition-colors">Gửi Đánh giá / Góp ý</button>
                        <button onClick={onOpenCollectionNameModal} className="font-semibold text-purple-300 bg-purple-900/50 border border-purple-600 px-4 py-2 rounded-lg hover:bg-purple-800/50 transition-colors">Thiết lập Tên BST</button>
                        <button onClick={onOpenSubscriptionModal} className="font-semibold text-green-300 bg-green-900/50 border border-green-600 px-4 py-2 rounded-lg hover:bg-green-800/50 transition-colors">Gia Hạn Sử Dụng</button>
                    </div>
                    <div className="text-center pt-3">
                         <label htmlFor="audio-upload-input" className="cursor-pointer font-semibold text-blue-400 bg-blue-900/50 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-800/50 transition-colors">
                            Tải Lên Giọng Mẫu (MP3)
                        </label>
                        <input id="audio-upload-input" type="file" accept="audio/mpeg,audio/wav" className="hidden" onChange={handleAudioUpload} />
                        {customAudioName && (
                             <div className="mt-2 text-center text-sm flex items-center justify-center gap-2">
                                <span className="text-gray-300">File hiện tại: <strong className="text-white">{customAudioName}</strong></span>
                                <button onClick={handleDeleteAudio} title="Xóa file âm thanh" className="text-red-400 hover:text-red-300">&times;</button>
                            </div>
                        )}
                        {audioMessage && <p className={`text-center text-sm mt-2 ${audioMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{audioMessage.text}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
