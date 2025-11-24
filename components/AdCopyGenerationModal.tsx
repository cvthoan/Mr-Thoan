
import React, { useState, useEffect } from 'react';
import { Loader } from './Loader';

interface AdCopyGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentImageUrl: string | null;
    onGenerate: (userInput: string) => Promise<string>;
    onNavigate: (direction: 'prev' | 'next') => void;
    totalImages: number;
    currentIndex: number;
    t: (key: any) => string;
}

export const AdCopyGenerationModal: React.FC<AdCopyGenerationModalProps> = ({
    isOpen,
    onClose,
    currentImageUrl,
    onGenerate,
    onNavigate,
    totalImages,
    currentIndex,
    t,
}) => {
    // State managed within this component
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedAdCopy, setGeneratedAdCopy] = useState<string | null>(null);
    const [adCopyForEditing, setAdCopyForEditing] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Sao chép');

    // Reset state when the modal is opened for a new image or when the image changes
    useEffect(() => {
        if (isOpen) {
            setUserInput('');
            setIsGenerating(false);
            setError(null);
            setGeneratedAdCopy(null);
            setAdCopyForEditing('');
        }
    }, [isOpen, currentImageUrl]);

    const handleGenerateClick = async () => {
        if (!userInput.trim()) {
            setError('Vui lòng nhập giá và phong cách quảng cáo.');
            return;
        }
        
        setIsGenerating(true);
        setError(null);
        setGeneratedAdCopy(null);

        try {
            const adCopy = await onGenerate(userInput);
            setGeneratedAdCopy(adCopy);
            setAdCopyForEditing(adCopy);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (adCopyForEditing) {
            navigator.clipboard.writeText(adCopyForEditing).then(() => {
                setCopyButtonText('Đã sao chép!');
                setTimeout(() => setCopyButtonText('Sao chép'), 2000);
            });
        }
    };
    
    const handleSaveToFile = () => {
        if (adCopyForEditing) {
            const blob = new Blob([adCopyForEditing], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'bai-quang-cao.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div 
                className="bg-[#2a0000] rounded-2xl shadow-xl border-2 border-teal-500/30 w-full max-w-3xl transform transition-all flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b-2 border-teal-500/10 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">Tạo Bài Viết Quảng Cáo</h2>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
                    {/* Left side: Image and Input */}
                    <div className="flex flex-col gap-4">
                        <p className="text-gray-300">AI sẽ phân tích ảnh sản phẩm này:</p>
                        <div className="relative">
                            {currentImageUrl && (
                                <img src={currentImageUrl} alt="Product Reference" className="rounded-lg w-full object-contain border border-teal-500/20" />
                            )}
                            {totalImages > 1 && (
                                <>
                                    <button 
                                        onClick={() => onNavigate('prev')}
                                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-colors z-10"
                                        aria-label="Ảnh trước"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button 
                                        onClick={() => onNavigate('next')}
                                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-colors z-10"
                                        aria-label="Ảnh kế tiếp"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </>
                            )}
                        </div>
                        {totalImages > 1 && (
                            <p className="text-center font-semibold text-gray-300 bg-black/30 py-1 rounded-full">{`Ảnh ${currentIndex + 1} / ${totalImages}`}</p>
                        )}
                        <div>
                           <label htmlFor="adCopyUserInput" className="block text-lg font-semibold mb-2">Nhập giá và phong cách quảng cáo</label>
                            <input
                                id="adCopyUserInput"
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Ví dụ: 199K, phong cách hài hước"
                                className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                                disabled={isGenerating}
                            />
                        </div>
                         <button 
                            onClick={handleGenerateClick}
                            disabled={isGenerating || !userInput.trim()}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all disabled:opacity-50"
                        >
                            {isGenerating ? 'Đang viết...' : 'Viết bài quảng cáo'}
                        </button>
                    </div>

                    {/* Right side: Result */}
                    <div className="flex flex-col gap-4 h-full">
                        <label className="block text-lg font-semibold">Kết quả (có thể chỉnh sửa)</label>
                        {/* FIX: Passed the required 't' prop to the Loader component. */}
                        {isGenerating && <div className="flex-1 flex items-center justify-center min-h-[20rem]"><Loader message="AI đang viết bài..." t={t} /></div>}
                        {error && (
                            <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-center text-red-200">
                                <p className="font-semibold">Đã xảy ra lỗi</p>
                                <p>{error}</p>
                            </div>
                        )}
                        {generatedAdCopy && (
                             <textarea
                                value={adCopyForEditing}
                                onChange={(e) => setAdCopyForEditing(e.target.value)}
                                className="w-full flex-1 p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 text-gray-200 min-h-[20rem]"
                            />
                        )}
                        {!isGenerating && !generatedAdCopy && !error && (
                            <div className="flex-1 flex items-center justify-center text-center p-4 bg-[#530303]/50 rounded-lg border-2 border-dashed border-gray-600 min-h-[20rem]">
                                <p className="text-gray-400">Nội dung quảng cáo sẽ xuất hiện ở đây sau khi tạo.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-4 p-6 pt-4 border-t-2 border-teal-500/10 flex-shrink-0">
                    <button onClick={handleCopy} disabled={!generatedAdCopy} className="font-semibold bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
                        {copyButtonText}
                    </button>
                    <button onClick={handleSaveToFile} disabled={!generatedAdCopy} className="font-semibold bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-lg transition-colors disabled:opacity-50">
                        Lưu file (.txt)
                    </button>
                    <button onClick={onClose} className="font-bold bg-gradient-to-r from-red-600 to-red-800 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};