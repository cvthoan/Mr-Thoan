import React, { useState, useEffect } from 'react';

interface FeedbackProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ isOpen, onClose }) => {
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

    // Reset internal state when modal is opened
    useEffect(() => {
        if (isOpen) {
            setIsSubmitted(false);
            setRating(0);
            setComment('');
            setHoverRating(0);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        const to = 'Baominh20100602@gmail.com';
        const subject = 'Đánh giá mới từ Ứng dụng AI Pro Mr Thoan';
        const body = `
Một khách hàng đã để lại phản hồi mới:

Xếp hạng: ${rating} / 5 sao
Bình luận:
${comment || '(Không có bình luận)'}
        `;

        // Create the mailto link, ensuring components are properly encoded
        const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
        
        // Open the user's default email client
        window.location.href = mailtoLink;

        setIsSubmitted(true);
        setTimeout(() => {
            onClose(); // Close the modal after success message
        }, 6000); // Increased timeout to allow user to read instructions
    };
    
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[101] p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative bg-[#2a0000] p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl border-2 border-teal-500/30 w-full max-w-lg transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                {isSubmitted ? (
                    <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-2xl font-bold text-green-300">Sắp xong rồi! Một bước nữa thôi...</h3>
                        <p className="text-gray-200 mt-3 text-lg">
                            Ứng dụng email của bạn sẽ được mở ngay bây giờ.
                        </p>
                        <div className="text-amber-300 font-semibold mt-4 text-xl border-2 border-amber-400/50 bg-amber-900/30 p-4 rounded-lg shadow-inner">
                            <p>Vui lòng nhấn nút "Gửi" (Send) trong cửa sổ email để hoàn tất.</p>
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">
                            (Nếu không có gì xảy ra, hãy kiểm tra xem bạn đã thiết lập ứng dụng email mặc định trên thiết bị chưa).
                        </p>
                    </div>
                ) : (
                    <>
                        <button 
                            onClick={onClose} 
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
                            aria-label="Đóng"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200">
                            Đánh giá của bạn quan trọng với chúng tôi!
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label className="block text-lg font-semibold mb-3 text-center">Xếp hạng của bạn</label>
                                <div className="flex justify-center items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-10 w-10 cursor-pointer transition-colors duration-200 ${
                                                (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'
                                            }`}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-label={`Rate ${star} star`}
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label htmlFor="feedback-comment" className="block text-lg font-semibold mb-2">Bình luận của bạn (Tùy chọn)</label>
                                <textarea
                                    id="feedback-comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Hãy cho chúng tôi biết suy nghĩ của bạn..."
                                    className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-colors duration-200 placeholder-gray-400 h-28"
                                />
                            </div>
                            <div className="text-center">
                                 <button
                                    type="submit"
                                    disabled={rating === 0}
                                    className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold text-lg py-3 px-10 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    Gửi đánh giá
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};