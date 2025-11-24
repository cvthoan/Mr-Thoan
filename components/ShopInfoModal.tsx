import React, { useState, useEffect } from 'react';

interface ShopInfo {
    name: string;
    hotline: string;
    zalo: string;
}

interface ShopInfoModalProps {
    isOpen: boolean;
    onSave: (info: ShopInfo) => void;
    onClose: () => void;
    currentInfo: ShopInfo | null;
    isInitialSetup: boolean;
    onClear: () => void;
}

export const ShopInfoModal: React.FC<ShopInfoModalProps> = ({ isOpen, onSave, onClose, currentInfo, isInitialSetup, onClear }) => {
    const [name, setName] = useState('');
    const [hotline, setHotline] = useState('');
    const [zalo, setZalo] = useState('');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // State for delete confirmation
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (currentInfo) {
            setName(currentInfo.name);
            setHotline(currentInfo.hotline);
            setZalo(currentInfo.zalo);
        } else {
            setName('');
            setHotline('');
            setZalo('');
        }
        
        if (isOpen) {
            setShowSuccess(false);
            // Also reset delete confirmation state when modal opens
            setIsConfirmingDelete(false);
            setDeletePassword('');
            setDeleteError('');
        }
    }, [currentInfo, isOpen]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000); 

            return () => clearTimeout(timer);
        }
    }, [showSuccess, onClose]);

    const handleSaveClick = () => {
        if (!name.trim() || !hotline.trim() || !zalo.trim()) {
            setError('Vui lòng điền đầy đủ tất cả các trường.');
            return;
        }
        setError('');
        onSave({ name: name.trim(), hotline: hotline.trim(), zalo: zalo.trim() });
        setShowSuccess(true);
    };

    const handleClearRequest = () => {
        setDeleteError('');
        setDeletePassword('');
        setIsConfirmingDelete(true);
    };

    const handleCancelDelete = () => {
        setIsConfirmingDelete(false);
        setDeletePassword('');
        setDeleteError('');
    };

    const handleConfirmDelete = () => {
        const currentMonth = new Date().getMonth() + 1;
        let validPasswords: string[] = [];

        if (currentMonth % 2 === 0) { // Even month
            const oddSuffixes = ['1', '3', '5', '7', '9', '11'];
            validPasswords = oddSuffixes.map(suffix => `T${currentMonth}${suffix}`);
        } else { // Odd month
            const evenSuffixes = ['2', '4', '6', '8', '10', '12'];
            validPasswords = evenSuffixes.map(suffix => `T${currentMonth}${suffix}`);
        }

        if (validPasswords.includes(deletePassword.trim())) {
            onClear();
            onClose();
        } else {
            setDeleteError('Mật khẩu không đúng. Vui lòng thử lại.');
            setDeletePassword('');
        }
    };

    const handlePasswordKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleConfirmDelete();
        }
    };


    if (!isOpen) {
        return null;
    }
    
    const backdropClasses = `fixed inset-0 z-[101] flex items-center justify-center transition-colors duration-300 ${isInitialSetup ? 'bg-[#100303]' : 'bg-black/70 backdrop-blur-sm p-4'}`;
    const modalContainerClasses = `relative bg-[#2a0000] rounded-2xl shadow-xl border-2 transform transition-all flex flex-col ${isInitialSetup ? 'p-4 sm:p-8 w-full max-w-md border-amber-500/30' : 'p-4 sm:p-6 w-full max-w-md border-teal-500/30 max-h-[90vh]'}`;


    return (
        <div 
            className={backdropClasses}
            onClick={isInitialSetup ? undefined : onClose}
        >
            <div 
                className={modalContainerClasses}
                onClick={e => e.stopPropagation()}
            >
                 <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
                    aria-label="Đóng"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {showSuccess ? (
                    <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-green-300">Lưu thành công!</h2>
                        <p className="text-gray-200 mt-2 text-lg">Thông tin của bạn đã được cập nhật. Cửa sổ này sẽ tự động đóng.</p>
                    </div>
                ) : isConfirmingDelete ? (
                    <>
                        <div className="flex-shrink-0 text-center">
                            <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                Xác nhận Xóa
                            </h2>
                            <p className="text-gray-300 mb-6">Để xóa vĩnh viễn thông tin shop, vui lòng nhập mật khẩu đăng nhập ứng dụng.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="deleteConfirmPassword" className="block text-lg font-semibold mb-2 text-left">Mật khẩu</label>
                                <input
                                    id="deleteConfirmPassword"
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    onKeyPress={handlePasswordKeyPress}
                                    className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                                    autoFocus
                                />
                            </div>
                            {deleteError && <p className="text-red-400 text-center">{deleteError}</p>}
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={handleCancelDelete} className="font-semibold bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors">
                                Hủy
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                className="font-bold bg-gradient-to-r from-red-700 to-red-900 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                Xác nhận Xóa
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex-shrink-0">
                            <h2 className={`font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200 ${isInitialSetup ? 'text-2xl sm:text-3xl' : 'text-2xl'}`}>
                                {isInitialSetup ? 'Vui lòng thiết lập thông tin Shop' : 'Cập nhật thông tin Shop'}
                            </h2>
                            <p className="text-gray-300 mb-4">Thông tin này sẽ được tự động thêm vào bài viết quảng cáo của bạn.</p>
                        </div>

                        <div className="flex-grow overflow-y-auto my-4 pr-3 -mr-3">
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="shopName" className="block text-lg font-semibold mb-2">Tên Shop</label>
                                    <input
                                        id="shopName"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ví dụ: GenZ Style"
                                        className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label htmlFor="shopHotline" className="block text-lg font-semibold mb-2">Hotline</label>
                                    <input
                                        id="shopHotline"
                                        type="text"
                                        value={hotline}
                                        onChange={(e) => setHotline(e.target.value)}
                                        placeholder="Ví dụ: 0988.xxx.xxx"
                                        className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                                    />
                                </div>
                                 <div>
                                    <label htmlFor="shopZalo" className="block text-lg font-semibold mb-2">Zalo</label>
                                    <input
                                        id="shopZalo"
                                        type="text"
                                        value={zalo}
                                        onChange={(e) => setZalo(e.target.value)}
                                        placeholder="Ví dụ: 0988.xxx.xxx"
                                        className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
                        </div>

                        <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-700">
                             <div className={`flex ${isInitialSetup ? 'justify-center' : 'justify-between items-center'}`}>
                                {!isInitialSetup && (
                                    <button
                                        onClick={handleClearRequest}
                                        disabled={!currentInfo}
                                        className="font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 text-sm"
                                        title="Xóa toàn bộ thông tin shop đã lưu"
                                    >
                                        Xóa thông tin
                                    </button>
                                )}
                                <div className="flex gap-4">
                                    {!isInitialSetup && (
                                        <button onClick={onClose} className="font-semibold bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors">
                                            Hủy
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleSaveClick}
                                        className={`font-bold bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all ${isInitialSetup ? 'py-3 px-8 text-lg' : 'py-2 px-6'}`}
                                    >
                                        {isInitialSetup ? 'Lưu & Tiếp Tục' : 'Lưu thông tin'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};