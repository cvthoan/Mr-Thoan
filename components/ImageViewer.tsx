import React, { useEffect } from 'react';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[];
    currentIndex: number | null;
    onNavigate: (direction: 'next' | 'prev') => void;
    onDownload: (index: number) => void;
    onGenerateVideo?: (index: number) => void;
    onGenerateWalkVideo?: (index: number) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, onClose, images, currentIndex, onNavigate, onDownload, onGenerateVideo, onGenerateWalkVideo }) => {
    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight') {
                onNavigate('next');
            } else if (e.key === 'ArrowLeft') {
                onNavigate('prev');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onNavigate]);

    if (!isOpen || currentIndex === null) {
        return null;
    }

    const currentImage = images[currentIndex];
    const totalImages = images.length;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only close if the backdrop itself is clicked, not content within it
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    const handleDownloadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex !== null) {
            onDownload(currentIndex);
        }
    };
    
    const handleGenerateVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex !== null && onGenerateVideo) {
            onGenerateVideo(currentIndex);
        }
    };
    
    const handleGenerateWalkVideoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex !== null && onGenerateWalkVideo) {
            onGenerateWalkVideo(currentIndex);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-4 sm:p-8" 
            onClick={handleBackdropClick}
            aria-modal="true"
            role="dialog"
        >
            {/* Relative container for image and close button */}
            <div 
                className="relative flex items-center justify-center" 
                // Stop propagation so clicking the image itself doesn't close the viewer
                onClick={e => e.stopPropagation()} 
            >
                <img
                    src={currentImage}
                    alt={`View image ${currentIndex + 1}`}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                
                {/* Close Button: Positioned on the top-right of the image container */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white bg-black/60 hover:bg-black/80 rounded-full p-2 transition-colors z-20"
                    aria-label="Đóng"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {/* Prev Button */}
            {totalImages > 1 && (
                <button
                    onClick={(e) => {e.stopPropagation(); onNavigate('prev')}}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-10"
                    aria-label="Ảnh trước"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
            )}

            {/* Next Button */}
            {totalImages > 1 && (
                 <button
                    onClick={(e) => {e.stopPropagation(); onNavigate('next')}}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-colors z-10"
                    aria-label="Ảnh kế tiếp"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            )}
            
            {/* Controls at the bottom */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4">
                <div className="text-white bg-black/50 rounded-full px-4 py-1 text-sm">
                    {`${currentIndex + 1} / ${totalImages}`}
                </div>

                {onGenerateWalkVideo && (
                     <button 
                        onClick={handleGenerateWalkVideoClick}
                        className="flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-700 rounded-full px-4 py-2 transition-colors text-sm font-semibold"
                        aria-label="Tạo Video Dáng Đi"
                        title="Dùng ảnh này để tạo video dáng đi người mẫu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span>Tạo Video Dáng Đi</span>
                    </button>
                )}

                {onGenerateVideo && (
                     <button 
                        onClick={handleGenerateVideoClick}
                        className="flex items-center gap-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-full px-4 py-2 transition-colors text-sm font-semibold"
                        aria-label="Tạo Video Sáng tạo"
                        title="Dùng ảnh này để tạo video sáng tạo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        <span>Tạo Video Sáng tạo</span>
                    </button>
                )}

                 <button 
                    onClick={handleDownloadClick}
                    className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-2 transition-colors text-sm font-semibold"
                    aria-label="Tải ảnh"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span>Tải về</span>
                </button>
            </div>
        </div>
    );
};