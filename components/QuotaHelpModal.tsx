
import React from 'react';

interface QuotaHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuotaHelpModal: React.FC<QuotaHelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-[#100303] flex flex-col z-[102] p-4 sm:p-8"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="relative bg-[#2a0000] p-6 sm:p-8 rounded-2xl shadow-xl border-2 border-yellow-500/30 w-full h-full flex flex-col text-gray-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between pb-4 border-b border-gray-700">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                        Giải Đáp Về Hạn Ngạch API
                    </h2>
                     <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Đóng"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-grow space-y-6 text-base overflow-y-auto pr-2 pt-6">
                    <p><strong className="text-yellow-300 text-lg">Hạn ngạch được tính trên mỗi Project, không phải mỗi Key:</strong> Đây là nguyên nhân phổ biến nhất. Google Cloud tính hạn ngạch sử dụng API (số lượng yêu cầu bạn có thể gửi trong một phút/ngày) cho toàn bộ <strong>Project</strong>, chứ không phải cho từng API Key riêng lẻ.</p>
                    
                    <div className="pl-4 border-l-4 border-gray-600 space-y-2">
                        <p><strong className="text-red-400">Vấn đề:</strong> Nếu bạn tạo một API Key mới nhưng vẫn trong cùng một Project đã hết hạn ngạch, thì Key mới đó cũng sẽ bị chặn.</p>
                        <p><strong className="text-green-400">Giải pháp:</strong> Bạn cần tạo API Key từ một <strong>Google Cloud Project khác</strong> mà Project đó vẫn còn hạn ngạch hoặc đã được liên kết với một tài khoản thanh toán (billing account) để có hạn ngạch cao hơn.</p>
                    </div>

                    <p><strong className="text-yellow-300 text-lg">Key mới chưa được kích hoạt đầy đủ:</strong> Đôi khi sau khi tạo một API key mới hoặc bật API cho một project, có thể mất vài phút để hệ thống của Google cập nhật hoàn toàn.</p>
                    
                    <p><strong className="text-yellow-300 text-lg">Sao chép Key chưa chính xác:</strong> Vui lòng kiểm tra lại thật kỹ xem bạn đã sao chép toàn bộ chuỗi API Key và không có ký tự thừa (như khoảng trắng ở đầu hoặc cuối) khi dán vào ứng dụng hay chưa.</p>
                    
                    <p><strong className="text-yellow-300 text-lg">API chưa được bật cho Project mới:</strong> Trong Google Cloud Console của Project chứa key mới, bạn cần đảm bảo rằng "Generative Language API" hoặc "Vertex AI API" đã được bật (Enabled). Nếu API này chưa được bật, key sẽ không hợp lệ.</p>

                    <div className="mt-4 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-r-lg">
                        <p className="font-bold text-red-300 text-xl">Tóm lại, bước cần làm nhất là:</p>
                        <p className="mt-2">Hãy đảm bảo rằng API Key mới của bạn được tạo từ một <strong>Google Cloud Project hoàn toàn khác</strong> với Project của key cũ đã hết hạn ngạch. Đây gần như chắc chắn là nguyên nhân của vấn đề.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex justify-end mt-6 pt-4 border-t border-gray-700">
                    <button 
                        onClick={onClose}
                        className="font-bold bg-gradient-to-r from-red-600 to-red-800 text-white py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all text-lg"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};
