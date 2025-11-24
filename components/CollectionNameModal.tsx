
import React, { useState, useEffect } from 'react';

interface CollectionNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    currentName: string;
}

export const CollectionNameModal: React.FC<CollectionNameModalProps> = ({ isOpen, onClose, onSave, currentName }) => {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        setName(currentName);
    }, [currentName, isOpen]);
    
    const handleSave = () => {
        onSave(name.trim());
    };
    
    const handleClearAndSave = () => {
        setName('');
        onSave('');
    };
    
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSave();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-[#2a0000] p-4 sm:p-6 rounded-2xl shadow-xl border-2 border-teal-500/30 w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200">
                    Thiết lập Tên Bộ Sưu Tập
                </h2>
                <p className="text-gray-300 mb-6">Tên này sẽ được dùng làm tiền tố cho tất cả các tệp tải về, giúp bạn dễ dàng sắp xếp.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="collectionName" className="block text-lg font-semibold mb-2">Tên bộ sưu tập</label>
                        <input
                            id="collectionName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ví dụ: Váy Mùa Hè 2024"
                            className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                     <button onClick={handleClearAndSave} className="font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50" disabled={!name}>
                        Xóa tên
                    </button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="font-semibold bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button 
                            onClick={handleSave}
                            className="font-bold bg-gradient-to-r from-red-600 to-red-800 text-white py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};