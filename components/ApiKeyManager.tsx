import React, { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ isOpen, onClose, onKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [pasteMessage, setPasteMessage] = useState<{ type: 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('userApiKey');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
        setApiKey('');
    }
    setPasteMessage(null);
  }, [isOpen]);
  
  const closeAndReset = () => {
    onClose();
    setTimeout(() => {
        setShowSuccess(false);
        setPasteMessage(null);
    }, 300); 
  };

  const handleSave = () => {
    if (apiKey.trim()) {
        localStorage.setItem('userApiKey', apiKey.trim());
    } else {
        localStorage.removeItem('userApiKey');
    }
    onKeyChange(); // Notify parent component
    setShowSuccess(true); // Show success message
  };

  const handleRemove = () => {
    localStorage.removeItem('userApiKey');
    setApiKey('');
    onKeyChange(); // Notify parent component
    closeAndReset();
  }
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSave();
    }
  };

  const handlePaste = async () => {
    setPasteMessage(null);
    if (!navigator.clipboard?.readText) {
        setPasteMessage({ type: 'error', text: 'Tính năng dán không được trình duyệt của bạn hỗ trợ.' });
        return;
    }
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setApiKey(text);
        } else {
            setPasteMessage({ type: 'info', text: 'Clipboard trống.' });
        }
    } catch (err) {
        console.error('Không thể đọc nội dung clipboard: ', err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
            setPasteMessage({ type: 'error', text: 'Quyền truy cập clipboard đã bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.' });
        } else {
            setPasteMessage({ type: 'error', text: 'Không thể dán. Hãy thử dán thủ công (Ctrl+V).' });
        }
    }
  };

  if (!isOpen) {
      return null;
  }

  return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[101] p-4" 
            onClick={closeAndReset}
            aria-modal="true"
            role="dialog"
        >
          <div 
            className="relative bg-[#2a0000] p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-teal-500/30 w-full max-w-md transform transition-all" 
            onClick={e => e.stopPropagation()}
          >
            <button 
                onClick={closeAndReset} 
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                aria-label="Đóng"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {!showSuccess ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-white">Quản lý API Key</h2>
                <p className="text-gray-300 mb-4 text-sm space-y-2">
                    <span>Nếu gặp lỗi hạn ngạch, hãy lấy API Key từ một Google Cloud Project <strong>khác</strong>.</span>
                    <span className="block font-bold text-amber-300">QUAN TRỌNG: Trong Project mới đó, bạn phải BẬT (Enable) "Generative Language API" thì key mới hoạt động.
                        <a 
                            href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan-400 underline hover:text-cyan-300 ml-1"
                        >
                            (Bật tại đây)
                        </a>
                    </span>
                </p>
                <div className="relative w-full">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập API Key của bạn"
                      className="w-full p-3 pr-16 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors duration-200 placeholder-gray-400"
                      autoFocus
                    />
                    <button
                        onClick={handlePaste}
                        className="absolute inset-y-0 right-0 flex items-center px-4 font-semibold text-red-200 bg-transparent border-l-2 border-[#a12c2c] hover:bg-red-900/50 rounded-r-lg transition-colors"
                        aria-label="Dán API Key từ clipboard"
                    >
                        Dán
                    </button>
                </div>
                {pasteMessage && (
                    <p className={`text-sm mt-2 text-center ${pasteMessage.type === 'error' ? 'text-red-400' : 'text-amber-300'}`}>
                        {pasteMessage.text}
                    </p>
                )}
                <div className="flex justify-between items-center mt-6">
                  <button 
                    onClick={handleRemove} 
                    className="text-gray-400 hover:text-white transition-colors text-sm font-semibold disabled:opacity-50"
                    disabled={!apiKey}
                  >
                      Xóa & Dùng Key Mặc định
                  </button>
                  <div className="flex items-center gap-4">
                      <a
                          href="https://aistudio.google.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-red-300 py-2 px-4 rounded-lg transition-colors text-sm border-2 border-red-500 hover:bg-red-500 hover:text-white"
                      >
                          Lấy API
                      </a>
                      <button 
                          onClick={handleSave} 
                          className="bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                          Lưu Key
                      </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-green-300">Đã lạp thành công</h2>
                <p className="text-gray-200 mt-2 text-lg">Chúc Mừng Bạn!</p>
                <button 
                  onClick={closeAndReset} 
                  className="mt-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-2 px-8 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
  );
};