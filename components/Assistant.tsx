
import React, { useState, useRef, useEffect } from 'react';
import { getChatSession } from '../services/geminiService';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const Assistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Xin chào! Tôi là Trợ lý AI. Bấm nút micro để bắt đầu trò chuyện bằng giọng nói nhé!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeechSupported, setIsSpeechSupported] = useState(false);
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>('');

    useEffect(() => {
        const populateVoiceList = () => {
            const newVoices = window.speechSynthesis.getVoices();
            setVoices(newVoices);
        };

        populateVoiceList();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }
        
        if (window.isSecureContext === false) {
            setIsSpeechSupported(false);
            setMessages(prev => {
                if (prev.some(msg => msg.text.includes('HTTPS'))) return prev;
                return [...prev, { role: 'model', text: 'Lưu ý: Trò chuyện bằng giọng nói yêu cầu kết nối an toàn (HTTPS). Tính năng micro hiện đã bị vô hiệu hóa.' }];
            });
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSpeechSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'vi-VN';
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                transcriptRef.current = event.results[0][0].transcript;
                setInput(transcriptRef.current); // Show user what is being transcribed
            };

            recognition.onend = () => {
                setIsListening(false);
                if (transcriptRef.current) {
                    submitMessage(transcriptRef.current);
                    transcriptRef.current = '';
                } else if (isConversationActive) {
                    // If recognition ends without a result (e.g. timeout), restart listening
                    startListening();
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);

                if (event.error === 'no-speech') {
                    // When no speech is detected, we stop the conversation mode to avoid an infinite loop
                    // where the `onend` handler would otherwise try to restart listening.
                    // The user can tap the mic again if they wish to speak.
                    setIsListening(false);
                    setIsConversationActive(false);
                    return;
                }

                // For all other more critical errors, stop the conversation and inform the user.
                setIsConversationActive(false);
                
                let errorText: string;

                switch (event.error) {
                    case 'not-allowed':
                    case 'service-not-allowed':
                        errorText = 'Không thể truy cập micro. Vui lòng kiểm tra lại quyền truy cập trong cài đặt trình duyệt (biểu tượng ổ khóa) và đảm bảo trang web được tải qua HTTPS. Sau đó, hãy bấm nút micro để thử lại.';
                        break;
                    case 'audio-capture':
                        errorText = 'Không tìm thấy micro hoặc micro đang gặp sự cố. Vui lòng kiểm tra lại thiết bị của bạn.';
                        break;
                    case 'network':
                        errorText = 'Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn và thử lại.';
                        break;
                    default:
                        errorText = `Đã xảy ra lỗi với micro (${event.error}). Vui lòng thử lại bằng cách bấm nút micro.`;
                        break;
                }

                // Avoid adding duplicate error messages
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.role === 'model' && lastMessage.text === errorText) {
                        return prev;
                    }
                    return [...prev, { role: 'model', text: errorText }];
                });
                speak(errorText);

                // Finally, ensure listening state is reset.
                setIsListening(false);
            };
            
            recognitionRef.current = recognition;
        } else {
            setIsSpeechSupported(false);
            setMessages(prev => {
                if (prev.some(msg => msg.text.includes('Trình duyệt này không hỗ trợ'))) return prev;
                return [...prev, { role: 'model', text: 'Rất tiếc, trình duyệt này không hỗ trợ tính năng trò chuyện bằng giọng nói.' }];
            });
        }

        return () => {
            window.speechSynthesis.cancel();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        }
    }, []);

    const speak = (text: string) => {
        if (isMuted || !text || !window.speechSynthesis) return;

        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);

        const vietnameseVoice = 
            voices.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) ||
            voices.find(v => v.lang === 'vi-VN');
            
        if (vietnameseVoice) {
            utterance.voice = vietnameseVoice;
        }
        
        utterance.lang = 'vi-VN';
        utterance.rate = 1.0;
        
        utterance.onend = () => {
            if (isConversationActive) {
                startListening();
            }
        };
        
        // Add an error handler to prevent console errors for user-initiated interruptions.
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            if (event.error !== 'interrupted') {
                console.error('Assistant speech synthesis error:', event.error);
            }
        };

        window.speechSynthesis.speak(utterance);
    };
    
    const startListening = async () => {
        if (!recognitionRef.current || isListening) return;
    
        // Proactively check for 'denied' permission state to avoid errors.
        if (navigator.permissions) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                if (permissionStatus.state === 'denied') {
                    const errorText = 'Không thể truy cập micro. Vui lòng kiểm tra lại quyền truy cập trong cài đặt trình duyệt (biểu tượng ổ khóa) và đảm bảo trang web được tải qua HTTPS. Sau đó, hãy bấm nút micro để thử lại.';
                    
                    setIsConversationActive(false);
                    
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage?.role === 'model' && lastMessage.text === errorText) {
                            return prev;
                        }
                        return [...prev, { role: 'model', text: errorText }];
                    });
                    speak(errorText);
                    return; // Stop execution to prevent the error.
                }
            } catch (err) {
                console.warn("Could not query microphone permission, proceeding with default behavior:", err);
            }
        }
    
        setInput('');
        setIsListening(true);
        recognitionRef.current.start();
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, messages, isLoading]);
    
    const handleCloseChat = () => {
        window.speechSynthesis.cancel();
        stopListening();
        setIsConversationActive(false);
        setIsOpen(false);
    }

    const submitMessage = async (messageText: string) => {
        if (!messageText.trim()) return;

        const userMessage: Message = { role: 'user', text: messageText.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const chat = getChatSession();
            const stream = await chat.sendMessageStream({ message: userMessage.text });

            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
            if (modelResponse.trim()) {
                speak(modelResponse);
            } else if (isConversationActive) {
                // AI gave no verbal response, so start listening for the user again.
                startListening();
            }

        } catch (error) {
            console.error('Assistant Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra.';
            const errorText = `Rất tiếc, đã có lỗi xảy ra: ${errorMessage}`;
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model' && lastMessage.text === '') {
                     lastMessage.text = errorText;
                } else {
                    newMessages.push({ role: 'model', text: errorText });
                }
                return newMessages;
            });
            speak(errorText);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || isConversationActive) return;
        submitMessage(input);
    }

    const toggleConversationMode = () => {
        const newConversationState = !isConversationActive;
        setIsConversationActive(newConversationState);

        if (newConversationState) {
            startListening();
        } else {
            stopListening();
            window.speechSynthesis.cancel();
        }
    };
    
    const handleToggleMute = () => {
        if (!isMuted) {
            window.speechSynthesis.cancel();
        }
        setIsMuted(!isMuted);
    }

    return (
        <>
            <div className={`fixed bottom-24 right-4 sm:right-6 z-40 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="w-[calc(100vw-2rem)] max-w-md h-[70vh] max-h-[600px] bg-[#2a0000]/80 backdrop-blur-xl rounded-2xl border-2 border-teal-500/30 shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between p-4 border-b-2 border-teal-500/30">
                        <div className="flex items-center gap-3">
                             <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200">Trợ lý AI</h3>
                             <button onClick={handleToggleMute} className="text-gray-400 hover:text-white transition-colors" title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
                                {isMuted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" /><path d="M16.5 10a5.985 5.985 0 01-1.757 4.243 1 1 0 01-1.414-1.414A3.986 3.986 0 0015 10c0-1.105-.448-2.105-1.172-2.828a1 1 0 011.414-1.414A5.985 5.985 0 0116.5 10z" /></svg>
                                )}
                             </button>
                        </div>
                        <button onClick={handleCloseChat} className="text-gray-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-red-800/70 text-white rounded-br-none' : 'bg-gray-700/50 text-gray-200 rounded-bl-none'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages[messages.length - 1].role === 'user' && (
                           <div className="flex justify-start">
                                <div className="max-w-[80%] p-3 rounded-2xl bg-gray-700/50 text-gray-200 rounded-bl-none">
                                    <div className="flex items-center space-x-2">
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex-shrink-0 p-4 border-t-2 border-teal-500/30">
                        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? "Đang lắng nghe..." : (isConversationActive ? "Đang chờ..." : "Nhập câu hỏi hoặc bấm micro")}
                                className="flex-1 p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors duration-200 placeholder-gray-400"
                                disabled={isLoading || isConversationActive}
                            />
                            {isSpeechSupported && (
                                <button type="button" onClick={toggleConversationMode} disabled={isLoading} className={`p-3 rounded-lg text-white transition-colors ${isConversationActive ? 'bg-cyan-600 animate-pulse' : 'bg-teal-600 hover:bg-teal-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </button>
                            )}
                            <button type="submit" disabled={isLoading || !input.trim() || isConversationActive} className="p-3 bg-gradient-to-r from-red-600 to-red-800 rounded-lg text-white hover:from-red-700 hover:to-red-900 disabled:opacity-50 disabled:cursor-not-allowed">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-red-800 rounded-full shadow-lg hover:bg-red-700 text-white flex items-center justify-center transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
                aria-label="Mở trợ lý AI"
            >
                {isOpen ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>
        </>
    );
};
