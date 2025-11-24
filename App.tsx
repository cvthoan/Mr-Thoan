
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader, type ImageUploaderHandles } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { editProductImage, generateStyledImage, generate360Video, generateTextContent, isProductWhite, analyzeImageType, analyzeProductCategory, cleanImageWithMask, cleanImageAutomatically, generateSpeech, removeWatermark } from './services/geminiService';
import { fileToBase64, dataURLtoFile, downloadWithLink } from './utils/fileUtils';
import { Assistant } from './components/Assistant';
import { ApiKeyManager } from './components/ApiKeyManager';
import { ShopInfoModal } from './components/ShopInfoModal';
import { QuotaHelpModal } from './components/QuotaHelpModal';
import { Feedback } from './components/Feedback';
import { HelpModal } from './components/HelpModal';
import { CollectionNameModal } from './components/CollectionNameModal';
import { SeasonalChecklist } from './components/SeasonalChecklist';
import { ImageViewer } from './components/ImageViewer';
import { LoginScreen } from './components/LoginScreen';
import { MaskEditor } from './components/MaskEditor';
import { ThemeSwitcher, type Theme } from './components/ThemeSwitcher';
import { getTranslator, type Language } from './translations';
import JSZip from 'jszip';

const UNIFIED_GHOST_MANNEQUIN_PROMPT = `Từ ảnh đầu vào, hãy tách riêng sản phẩm quần áo. Tạo lại sản phẩm dưới dạng ảnh "ghost mannequin" (ma-nơ-canh vô hình) 3D cho một catalog thương mại điện tử cao cấp. Trang phục phải trông như đang được mặc bởi một người vô hình, thể hiện được phom dáng tự nhiên, độ phồng và chiều sâu với các nếp gấp và đổ bóng chân thực.
YÊU CẦU CỰC KỲ QUAN TRỌNG:
1. BẢO TOÀN CHI TIẾT: Phải giữ lại tuyệt đối 100% tất cả các chi tiết nguyên bản của sản phẩm từ ảnh gốc, bao gồm cúc áo, khóa kéo, nơ, logo, và mọi họa tiết. Không được phép thêm, bớt, hay thay đổi bất kỳ chi tiết nào.
2. HOÀN TOÀN VÔ HÌNH: Kết quả tuyệt đối KHÔNG ĐƯỢỢC hiển thị bất kỳ phần nào của ma-nơ-canh, hình nộm, hay cơ thể người. Đặc biệt, tuyệt đối không được để lộ dù chỉ một chút DA NGƯƠI nào, vì ma-nơ-canh phải hoàn toàn vô hình.
Phải nhìn thấy được phần bên trong của cổ áo. Đặt sản phẩm trên nền trắng hoàn toàn liền mạch. Chất lượng ảnh siêu thực tế 8K, ánh sáng studio chuyên nghiệp.
Yêu cầu xuất ra 4 ảnh riêng biệt, mỗi ảnh thể hiện một góc nhìn rõ ràng:
Ảnh 1: mặt trước
Ảnh 2: mặt sau
Ảnh 3: mặt bên trái
Ảnh 4: mặt bên phải
Negative prompt: (mannequin, dummy, ghost mannequin, transparent body, torso, neck, arms, legs, hanger, stand, skin, human, person, obstruction, extra objects).
CHỈ XUÄT RA ẢNH. Không được viết bất kỳ văn bản, mô tả hay lời chào nào.`;

const ADVANCED_GHOST_MANNEQUIN_PROMPT = `Tạo bản trình bày sản phẩm thời trang isometric 4D siêu thực tế của [món đồ thời trang], được hiển thị như thể đang được mặc bởi một cơ thể vô hình — trang phục phải ôm dáng tự nhiên (có vai, ngực, eo, hông, lưng) với nếp vải chân thực và độ sâu không gian rõ ràng. Tuyệt đối không có ma-nơ-canh, không hình nộm, không cơ thể thật, không ghost mannequin, không khung trong suốt, không giá treo, không da người.
Yêu cầu xuất ra 4 ảnh riêng biệt, mỗi ảnh thể hiện một góc nhìn rõ ràng:
- Ảnh 1: mặt trước
- Ảnh 2: mặt sau
- Ảnh 3: mặt bên trái
- Ảnh 4: mặt bên phải
Nền trắng liền mạch, siêu chi tiết 8K, phong cách catalog thời trang chuyên nghiệp.
Negative prompt: (no mannequin, no dummy, no ghost mannequin, no transparent body, no torso, no neck, no arms, no legs, no hanger, no stand, no skin, no obstruction, no extra objects).
CHỈ XUẤT RA ẢNH. Không được viết bất kỳ văn bản, mô tả hay lời chào nào.`;

const themes: Theme[] = [
    { 
        id: 'sdvn', name: 'SDVN', 
        gradient: 'linear-gradient(to right, #4a00e0, #8e2de2)',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-400',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200',
        headerTextColor: 'text-amber-300'
    },
    { 
        id: 'vietnam', name: 'Việt Nam', 
        gradient: '#ef4444',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-300',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white',
        headerTextColor: 'text-amber-300'
    },
    { 
        id: 'black-night', name: 'Black Night', 
        gradient: '#100303',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-400',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200',
        headerTextColor: 'text-amber-300'
    },
    { 
        id: 'clear-sky', name: 'Clear Sky', 
        gradient: 'linear-gradient(to right, #005c97, #363795)',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-400',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-200',
        headerTextColor: 'text-amber-300'
    },
    { 
        id: 'skyline', name: 'Skyline', 
        gradient: 'linear-gradient(to right, #1488cc, #2b32b2)',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-400',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-blue-200',
        headerTextColor: 'text-amber-300'
    },
    { 
        id: 'emerald-water', name: 'Emerald Water', 
        gradient: 'linear-gradient(to right, #348f50, #56b4d3)',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-300',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-teal-100 to-green-100',
        headerTextColor: 'text-teal-200'
    },
    { 
        id: 'life', name: 'Life', 
        gradient: 'linear-gradient(to right, #43a047, #cddc39)',
        textColor: 'text-gray-800',
        secondaryTextColor: 'text-gray-600',
        titleColor: 'text-green-900 font-bold',
        headerTextColor: 'text-green-800'
    },
    { 
        id: 'violet', name: 'Violet', 
        gradient: 'linear-gradient(to right, #7b1fa2, #ab47bc)',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-300',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200',
        headerTextColor: 'text-purple-200'
    },
    { 
        id: 'hidden-jaguar', name: 'Hidden Jaguar', 
        gradient: 'linear-gradient(to right, #00c9ff, #92fe9d)',
        textColor: 'text-gray-800',
        secondaryTextColor: 'text-gray-700',
        titleColor: 'text-cyan-900 font-bold',
        headerTextColor: 'text-cyan-800'
    },
    { 
        id: 'wide-matrix', name: 'Wide Matrix', 
        gradient: 'linear-gradient(to right, #e738f9, #5465ff)',
        textColor: 'text-gray-200',
        secondaryTextColor: 'text-gray-300',
        titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-blue-300',
        headerTextColor: 'text-pink-200'
    },
];

interface ShopInfo {
    name: string;
    hotline: string;
    zalo: string;
}

interface ResultState {
    urls: string[] | null;
    wasCreative: boolean;
}

const stringToHslColor = (str: string, saturation: number, lightness: number): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// A new, self-contained component for the subscription modal
const SubscriptionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onExtend: (start: string, end: string) => void;
    onLogout: () => void;
}> = ({ isOpen, onClose, onExtend, onLogout }) => {
    const [password, setPassword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    // State for Key Generator Modal
    const [showKeyGenerator, setShowKeyGenerator] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    
    // State for Admin Authentication in Key Generator
    const [adminAuthInput, setAdminAuthInput] = useState('');
    const [isKeyRevealed, setIsKeyRevealed] = useState(false);
    const [adminAuthError, setAdminAuthError] = useState('');

    // State for Purchase Flow
    const [viewMode, setViewMode] = useState<'default' | 'packages' | 'qr'>('default');
    const [selectedPackage, setSelectedPackage] = useState<{ name: string, price: string, amount: number, note: string } | null>(null);

    // State for Failure Limit
    const [failureCount, setFailureCount] = useState(0);

    const packages = [
        { id: 1, name: '3 Năm', price: '1.000.000 VND', amount: 1000000, note: '3 Nam App AI Pro' },
        { id: 2, name: '2 Năm', price: '800.000 VND', amount: 800000, note: '2 Nam App AI Pro' },
        { id: 3, name: '1 Năm', price: '500.000 VND', amount: 500000, note: '1 Nam App AI Pro' },
        { id: 4, name: '1 Tháng', price: '200.000 VND', amount: 200000, note: '1 Thang App AI Pro' },
    ];

    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setStartDate('');
            setEndDate('');
            setError('');
            setSuccess(false);
            setShowKeyGenerator(false);
            setGeneratedKey('');
            setAdminAuthInput('');
            setIsKeyRevealed(false);
            setAdminAuthError('');
            setViewMode('default');
            setSelectedPackage(null);
            setFailureCount(0); // Reset failure count on open
        }
    }, [isOpen]);

    const getReversedDay = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        return day.split('').reverse().join('');
    }

    const getMasterPassword = () => {
        const basePassword = atob('VGhvYW4xOTc5Kg=='); // 'Thoan*'
        const reversedDay = getReversedDay();
        return basePassword + reversedDay;
    };

    const handleGetCode = () => {
        if (!endDate) {
            setError('Vui lòng chọn Ngày kết thúc trước khi lấy mã.');
            return;
        }
        setError('');

        // Create a secure key with embedded date check
        const salt = "THOAN_VIP_";
        const reversedDay = getReversedDay(); // Get current reversed day (e.g. 24 -> 42)
        
        // Payload structure: SALT + ExpiryDate + Separator + CreationReversedDay
        const rawString = `${salt}${endDate}_${reversedDay}`;
        const encodedString = btoa(rawString);
        const finalKey = `AI-PRO-${encodedString}`;
        
        setGeneratedKey(finalKey);
        
        // Reset auth state for the generator
        setAdminAuthInput('');
        setIsKeyRevealed(false);
        setAdminAuthError('');
        setShowKeyGenerator(true);
    };
    
    const handleVerifyAdmin = () => {
        const masterPassword = getMasterPassword();
        if (adminAuthInput === masterPassword) {
            setIsKeyRevealed(true);
            setAdminAuthError('');
        } else {
            setAdminAuthError('Mật khẩu không đúng.');
        }
    };

    const handleAdminAuthKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleVerifyAdmin();
        }
    };
    
    const handleCopyKey = () => {
        navigator.clipboard.writeText(generatedKey).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handlePastePassword = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setPassword(text);
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const handleTransferKey = () => {
        setPassword(generatedKey);
        setShowKeyGenerator(false);
    };

    const handleConfirm = () => {
        const masterPassword = getMasterPassword();
        const currentReversedDay = getReversedDay();
        
        let isKeyValid = false;
        let derivedEndDate = '';

        // 1. Check for License Key Format (AI-PRO-...)
        if (password.startsWith('AI-PRO-')) {
            try {
                const encodedPart = password.replace('AI-PRO-', '');
                const decodedString = atob(encodedPart);
                const salt = "THOAN_VIP_";
                
                if (decodedString.startsWith(salt)) {
                    // Extract parts: SALT + Date + _ + ReversedDay
                    const parts = decodedString.replace(salt, '').split('_');
                    const datePart = parts[0];
                    const creationReversedDay = parts[1];
                    
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    
                    // Validate: Key must be created TODAY (matching reversed day)
                    if (dateRegex.test(datePart) && creationReversedDay === currentReversedDay) {
                        isKeyValid = true;
                        derivedEndDate = datePart;
                    }
                }
            } catch (e) {
                console.error("Invalid key format");
            }
        } 
        // 2. Check for Master Password (backup)
        else if (password === masterPassword) {
             if (!endDate) {
                setError('Vui lòng chọn ngày kết thúc.');
                return;
            }
            isKeyValid = true;
            derivedEndDate = endDate;
        }

        if (!isKeyValid) {
            const newFailureCount = failureCount + 1;
            setFailureCount(newFailureCount);
            
            if (newFailureCount > 2) {
                alert('Bạn đã nhập sai quá số lần quy định. Ứng dụng sẽ thoát.');
                onLogout();
                onClose();
            } else {
                setError(`Mã không hợp lệ hoặc đã hết hạn trong ngày. Bạn còn ${3 - newFailureCount} lần thử.`);
            }
            return;
        }

        if (!derivedEndDate) {
             setError('Lỗi xác thực ngày.');
             return;
        }
        
        const finalStartDate = startDate || new Date().toISOString().split('T')[0];
        const startDateObj = new Date(finalStartDate);
        const endDateObj = new Date(derivedEndDate);

        if (endDateObj <= startDateObj) {
             if (!password.startsWith('AI-PRO-')) {
                 setError('Ngày kết thúc phải sau ngày bắt đầu.');
                 return;
             }
        }

        onExtend(finalStartDate, derivedEndDate);
        setSuccess(true);
        setError('');
        setShowKeyGenerator(false);
        setFailureCount(0); // Reset on success
        
        setTimeout(() => {
            onClose();
        }, 4000); 
    };

    const handleSelectPackage = (pkg: any) => {
        setSelectedPackage(pkg);
        setViewMode('qr');
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[101] p-4" onClick={onClose}>
            <div className="bg-[#2a0000] p-6 rounded-2xl shadow-xl border-2 border-teal-500/30 w-full max-w-md transform transition-all relative min-h-[400px] flex flex-col" onClick={e => e.stopPropagation()}>
                
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-20" aria-label="Đóng">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Key Generator Modal Overlay */}
                {showKeyGenerator && (
                    <div className="absolute inset-0 bg-[#1a0505] z-20 rounded-2xl flex flex-col items-center justify-center p-6 animate-fade-in-up">
                        {!isKeyRevealed ? (
                            <>
                                <h3 className="text-xl font-bold text-red-400 mb-4">Xác thực Quản trị viên</h3>
                                <p className="text-gray-400 text-sm mb-4 text-center">
                                    Vui lòng nhập mật khẩu nhà cung cấp để hiển thị mã.
                                </p>
                                <input
                                    type="password"
                                    value={adminAuthInput}
                                    onChange={(e) => setAdminAuthInput(e.target.value)}
                                    onKeyPress={handleAdminAuthKeyPress}
                                    placeholder="Nhập mật khẩu..."
                                    className="w-full p-2 bg-black/40 border border-red-700 rounded-lg text-white mb-2 focus:ring-2 focus:ring-red-500 outline-none"
                                    autoFocus
                                />
                                {adminAuthError && <p className="text-red-500 text-sm mb-2">{adminAuthError}</p>}
                                <div className="flex gap-3 mt-2">
                                    <button 
                                        onClick={() => setShowKeyGenerator(false)}
                                        className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        onClick={handleVerifyAdmin}
                                        className="px-6 py-2 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
                                    >
                                        Xác nhận
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-amber-300 mb-4">Mã Kích Hoạt Của Bạn</h3>
                                <p className="text-gray-400 text-sm mb-2 text-center">
                                    Sao chép mã này và gửi cho khách hàng. <br/>
                                    <strong className="text-red-400">Lưu ý: Mã này chỉ có hiệu lực trong ngày hôm nay.</strong>
                                </p>
                                <div className="w-full bg-black/40 border border-amber-700/50 rounded-lg p-3 break-all font-mono text-sm text-green-400 mb-4 text-center">
                                    {generatedKey}
                                </div>
                                <div className="flex gap-3">
                                     <button 
                                        onClick={() => setShowKeyGenerator(false)}
                                        className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                                    >
                                        Quay lại
                                    </button>
                                    <button 
                                        onClick={handleCopyKey}
                                        className={`px-6 py-2 rounded-lg font-bold transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
                                    >
                                        {isCopied ? 'Đã sao chép!' : 'Sao chép mã'}
                                    </button>
                                </div>
                                <button
                                    onClick={handleTransferKey}
                                    className="mt-3 w-full border border-red-500 text-red-400 hover:bg-red-900/30 font-bold py-2 rounded-lg transition-colors uppercase text-sm"
                                >
                                    Chuyển mã
                                </button>
                            </>
                        )}
                    </div>
                )}

                {success ? (
                    <div className="text-center py-4 flex-1 flex flex-col justify-center">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold text-green-300">Gia hạn thành công!</h2>
                        <p className="text-gray-200 mt-2 text-lg">Hạn sử dụng mới đến ngày: {new Date(endDate || new Date()).toLocaleDateString('vi-VN')}.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'default' && (
                            <div className="flex-1 flex flex-col">
                                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-amber-200">Gia Hạn Sử Dụng</h2>
                                <div className="text-sm text-amber-200 bg-amber-900/40 p-3 rounded-lg border border-amber-500/50 mb-4 text-center">
                                    <p className="font-bold">
                                        Lời nhắn từ nhà cung cấp
                                    </p>
                                    <p className="mt-2 italic">
                                        "Tôi không được phép trực tiếp gia hạn. Bạn vui lòng sử dụng form này và cung cấp đúng mật khẩu, tôi sẽ gia hạn cho bạn."
                                    </p>
                                </div>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <label htmlFor="extension-start-date" className="block text-sm font-medium text-gray-300 mb-1">Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            id="extension-start-date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="extension-end-date" className="block text-sm font-medium text-gray-300 mb-1">Ngày kết thúc</label>
                                        <input
                                            type="date"
                                            id="extension-end-date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <label htmlFor="extension-password"  className="block text-sm font-medium text-gray-300">Mật khẩu nhà cung cấp</label>
                                            <button
                                                type="button"
                                                onClick={handleGetCode}
                                                className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-500 text-xs font-bold py-1 px-3 rounded transition-colors"
                                                title="Tạo mã kích hoạt cho khách hàng"
                                            >
                                                Lấy mã
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                id="extension-password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full p-2 pr-14 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                                placeholder="Nhập mật khẩu hoặc Mã kích hoạt..."
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePastePassword}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors"
                                                title="Dán từ clipboard"
                                            >
                                                Dán
                                            </button>
                                        </div>
                                    </div>
                                    {error && <p className="text-red-400 text-center text-sm font-bold">{error}</p>}
                                </div>
                                <div className="flex justify-between items-end gap-4 pt-4 mt-auto">
                                    <button 
                                        onClick={() => setViewMode('packages')}
                                        className="font-bold text-blue-400 hover:text-blue-300 border border-blue-500 px-3 py-2 rounded hover:bg-blue-900/30 transition-colors text-sm"
                                    >
                                        Chuyển Khoản Mua app
                                    </button>
                                    <div className="flex gap-3">
                                        <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Hủy</button>
                                        <button
                                            onClick={handleConfirm}
                                            className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                                        >
                                            Xác nhận
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewMode === 'packages' && (
                            <div className="flex-1 flex flex-col">
                                <h2 className="text-2xl font-bold mb-6 text-center text-blue-300">Chọn Gói Mua App</h2>
                                <div className="space-y-3 flex-1 overflow-y-auto">
                                    {packages.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => handleSelectPackage(pkg)}
                                            className="w-full p-4 rounded-xl border border-blue-500/50 bg-blue-900/20 hover:bg-blue-800/40 flex justify-between items-center transition-all group"
                                        >
                                            <span className="text-lg font-bold text-white group-hover:text-blue-200">{pkg.name}</span>
                                            <span className="text-xl font-bold text-amber-400">{pkg.price}</span>
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setViewMode('default')}
                                    className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    Quay lại
                                </button>
                            </div>
                        )}

                        {viewMode === 'qr' && selectedPackage && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <h3 className="text-xl font-bold text-white mb-2">Quét Mã Để Thanh Toán</h3>
                                <div className="bg-white p-2 rounded-lg mb-4">
                                    <img 
                                        src={`https://img.vietqr.io/image/ABBANK-0988771339-compact.png?amount=${selectedPackage.amount}&addInfo=${encodeURIComponent(selectedPackage.note)}`}
                                        alt="QR Code" 
                                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                                    />
                                </div>
                                <div className="text-gray-300 space-y-1 mb-4">
                                    <p>Số tiền: <strong className="text-amber-400 text-xl">{selectedPackage.price}</strong></p>
                                    <p>Nội dung: <span className="text-white font-mono bg-gray-800 px-2 py-1 rounded">{selectedPackage.note}</span></p>
                                    <p className="text-sm text-gray-400 mt-2">Chủ TK: NGUYEN VIET THOAN - ABBANK</p>
                                </div>
                                <button 
                                    onClick={() => setViewMode('packages')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                                >
                                    Chọn gói khác
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Helper function to convert base64 string to a Uint8Array
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper function to convert raw PCM data to a WAV Blob
const pcmToWavBlob = (pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob => {
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    const pcmAsUint8 = new Uint8Array(pcmData);
    for (let i = 0; i < pcmData.length; i++) {
        view.setUint8(44 + i, pcmAsUint8[i]);
    }
    
    return new Blob([view], { type: 'audio/wav' });
};


export const App: React.FC = () => {
  // App State Persistance
  const [appState, setAppState] = useState(() => {
    // Calculate a default expiration date based on the old logic for consistency.
    const defaultPurchaseDate = '2023-07-20';
    const defaultSubscriptionYears = 1;
    const defaultExpDate = new Date(defaultPurchaseDate);
    defaultExpDate.setFullYear(defaultExpDate.getFullYear() + defaultSubscriptionYears);

    const defaultState = {
        isAuthenticated: false,
        shopInfo: null,
        activeTab: 'style',
        activeTheme: 'black-night',
        resultsByTab: {},
        collectionName: '',
        expirationDate: defaultExpDate.toISOString().split('T')[0],
        language: 'vi',
    };

    try {
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Migration logic for old state structure (purchaseDate + subscriptionYears)
            if (parsedState.purchaseDate && typeof parsedState.subscriptionYears === 'number' && !parsedState.expirationDate) {
                const pDate = new Date(parsedState.purchaseDate);
                if (!isNaN(pDate.getTime())) {
                    // Round the years to handle the float calculation bug during migration
                    const years = Math.round(parsedState.subscriptionYears);
                    pDate.setFullYear(pDate.getFullYear() + years);
                    parsedState.expirationDate = pDate.toISOString().split('T')[0];
                }
                // Clean up old properties
                delete parsedState.purchaseDate;
                delete parsedState.subscriptionYears;
            }

            return {
                ...defaultState,
                ...parsedState,
                isAuthenticated: false, // Always force re-authentication.
                resultsByTab: {}, // CRITICAL: Never load results from storage to prevent bloat.
            };
        }
    } catch (e) {
        console.error("Could not load saved state:", e);
    }
    // Return default state if nothing is saved or on error
    return defaultState;
  });
  
  useEffect(() => {
    try {
        // Create a copy of the state to save, but exclude the large 'resultsByTab' object.
        const { resultsByTab, ...stateToPersist } = appState;
        localStorage.setItem('appState', JSON.stringify(stateToPersist));
    } catch (e) {
        // Provide a more specific error message if the quota is exceeded.
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
            console.error(
                "Could not save state: LocalStorage quota exceeded. " +
                "This can happen if you have a lot of data from other apps on this domain. " +
                "Please try clearing your browser's site data for this page."
            );
        } else {
            console.error("Could not save state:", e);
        }
    }
  }, [appState]);

  // General wrapper to update state
  const updateState = (key: keyof typeof appState, value: any) => {
    setAppState((prevState: typeof appState) => ({ ...prevState, [key]: value }));
  };

  // Aliases for easier access
  const isAuthenticated = appState.isAuthenticated;
  const shopInfo: ShopInfo | null = appState.shopInfo;
  const activeTab = appState.activeTab;
  const activeTheme = appState.activeTheme;
  const resultsByTab = appState.resultsByTab;
  const collectionName = appState.collectionName;
  const expirationDate = appState.expirationDate;
  const language = appState.language;
  const t = useMemo(() => getTranslator(language as Language), [language]);

  // Get prompt data from translator
  const creativeConceptPrompts = useMemo(() => t('creativeConceptPrompts'), [t]);
  const videoCreativeConceptPrompts = useMemo(() => t('videoCreativeConceptPrompts'), [t]);
  const childWalkPromptsData = useMemo(() => t('childWalkPromptsData'), [t]);
  const adultWalkPromptsData = useMemo(() => t('adultWalkPromptsData'), [t]);
  const seasonalPromptsBaseData = useMemo(() => t('seasonalPromptsBaseData'), [t]);
  const advertisingBackdropPromptsBase = useMemo(() => t('advertisingBackdropPrompts'), [t]);
  const creativePromptsData = useMemo(() => t('creativePromptsData'), [t]);

  const modelSeasonalPrompts = useMemo(() => {
      return seasonalPromptsBaseData.map((season: any) => ({
          ...season,
          items: season.items.map((item: any) => ({
              ...item,
              prompt: t('modelSeasonalPrompt', item.title, item.description)
          }))
      }));
  }, [seasonalPromptsBaseData, t]);

  const advertisingBackdropPrompts = useMemo(() => {
      return advertisingBackdropPromptsBase.map((season: any) => ({
          ...season,
          items: season.items.map((item: any) => ({
              ...item,
              prompt: t('modelSeasonalPrompt', item.title, item.description)
          }))
      }));
  }, [advertisingBackdropPromptsBase, t]);

  const creativeSeasonalPrompts = useMemo(() => {
        return seasonalPromptsBaseData.map((season: any) => ({
          ...season,
          items: season.items.map((item: any) => ({
              ...item,
              prompt: t('productSeasonalPrompt', item.title, item.description)
          }))
      }));
  }, [seasonalPromptsBaseData, t]);

  const aspectRatioTooltips = {
    "3:4": "Dọc (Phù hợp cho Story, Reels, quảng cáo di động)",
    "1:1": "Vuông (Phù hợp cho bài đăng Instagram, Facebook)",
    "4:3": "Ngang (Cổ điển, gần vuông)",
    "9:16": "Dọc (Chuẩn Story, Reels, TikTok)",
    "16:9": "Ngang (Chuẩn video YouTube, ảnh bìa Facebook)"
  };

  // App Visibility State
  const [isClosed, setIsClosed] = useState(false);
  const handleCloseApp = () => setIsClosed(true);

  // Shop Info State
  const [isShopInfoModalOpen, setIsShopInfoModalOpen] = useState(false);
  const [nextActionAfterShopInfo, setNextActionAfterShopInfo] = useState<(() => void) | null>(null);
  const [isShopInfoInitialSetup, setIsShopInfoInitialSetup] = useState(false);


  // Common State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuotaHelpModalOpen, setIsQuotaHelpModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Image Viewer (Lightbox) State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState<boolean>(false);
  const [imageViewerCurrentIndex, setImageViewerCurrentIndex] = useState<number>(0);

  // Generated Image Selection State
  const [selectedSourceImageIndex, setSelectedSourceImageIndex] = useState<number>(0);
  const [selectedModelSourceImageIndex, setSelectedModelSourceImageIndex] = useState<number>(0);

  // Refs
  const imageUploaderRef = useRef<ImageUploaderHandles>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const resizingVideoRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number; } | null>(null);
  const adCopyResultContainerRef = useRef<HTMLDivElement>(null);
  const resizingAdCopyRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number; } | null>(null);

  // Video State
  const [generatingVideoType, setGeneratingVideoType] = useState<'vertical' | 'horizontal' | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoMode, setVideoMode] = useState<'360' | 'creative' | 'walk'>('360');
  const [video360CustomPrompt, setVideo360CustomPrompt] = useState<string>('');
  const [videoCreativeProductName, setVideoCreativeProductName] = useState<string>('');
  const [videoCreativeBasePrompt, setVideoCreativeBasePrompt] = useState<string>('');
  const [videoCreativeCustomization, setVideoCreativeCustomization] = useState<string>('');
  const [videoOrientation, setVideoOrientation] = useState<'horizontal' | 'vertical' | null>(null);
  const [walkType, setWalkType] = useState<'child' | 'adult' | null>(null);
  const [walkBasePrompt, setWalkBasePrompt] = useState<string>('');
  const [walkCustomization, setWalkCustomization] = useState<string>('');
  const [isWalkSelectorCollapsed, setIsWalkSelectorCollapsed] = useState<boolean>(false);
  const [isVideoboxOpen, setIsVideoboxOpen] = useState<boolean>(false);
  const [videoPlayerSize, setVideoPlayerSize] = useState<{width: string, height: string} | null>(null);
  const [isVideoCreativeSelectorCollapsed, setIsVideoCreativeSelectorCollapsed] = useState<boolean>(false);
  const [videoPollCount, setVideoPollCount] = useState<number>(0);

  // Tab-specific State
  const [styleMode, setStyleMode] = useState<'ghost' | 'model' | 'creative' | 'adcopy'>('ghost'); // For Style tab mode
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null); // For Style tab custom face
  const [heldProductFiles, setHeldProductFiles] = useState<File[]>([]); // For Style tab held product
  const [materialSampleFiles, setMaterialSampleFiles] = useState<File[]>([]); // For Style tab material sample
  const [showFaceUploader, setShowFaceUploader] = useState<boolean>(false);
  const [showHeldProductUploader, setShowHeldProductUploader] = useState<boolean>(false);
  const [showMaterialUploader, setShowMaterialUploader] = useState<boolean>(false);
  const [modelCustomPrompt, setModelCustomPrompt] = useState<string>(''); // For Style tab model customizations
  const [isRewritingPrompt, setIsRewritingPrompt] = useState<boolean>(false);
  const [generateDifferentFace, setGenerateDifferentFace] = useState<boolean>(false);
  // FIX: Initialized `modelAge` state to `null` to resolve the "used before its declaration" error.
  const [modelAge, setModelAge] = useState<'adult' | 'child' | null>(null);
  const [modelGender, setModelGender] = useState<'male' | 'female' | null>(null);
  const [ghostMannequinAddon, setGhostMannequinAddon] = useState<string>(''); // For Style tab image-to-image addon
  const [useAdvancedGhostPrompt, setUseAdvancedGhostPrompt] = useState<boolean>(false); // For Style tab ghost mode
  const [ghostMannequinAge, setGhostMannequinAge] = useState<'adult' | 'child' | null>(null); // For Style tab ghost mode
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("3:4"); // For Style tab
  const [customPrompt, setCustomPrompt] = useState<string>(''); // For Creative tab
  const [selectedEffect, setSelectedEffect] = useState<string>('auto'); // For Creative tab
  const [extractSelection, setExtractSelection] = useState<'set' | 'shirt' | 'pants'>('set'); // For Extract tab
  const [isCleaningImage, setIsCleaningImage] = useState<number | null>(null); // For Ghost Mannequin cleanup
  const [originalCleanedUrls, setOriginalCleanedUrls] = useState<{ [key: number]: string }>({}); // For Ghost Mannequin cleanup undo
  const [showBackdropSelection, setShowBackdropSelection] = useState<boolean>(false);
  const [activeBackdropTab, setActiveBackdropTab] = useState<'seasonal' | 'advertising'>('seasonal');
  const [isModelBackdropSelectorCollapsed, setIsModelBackdropSelectorCollapsed] = useState<boolean>(false);
  
  // New State for "Auto Model from Accessory"
  const [isAutoGenerateModelFromAccessory, setIsAutoGenerateModelFromAccessory] = useState<boolean>(false);

  // Style Tab -> Creative Mode State
  const [styleCreativeProductName, setStyleCreativeProductName] = useState<string>('');
  const [styleCreativeBasePrompt, setStyleCreativeBasePrompt] = useState<string>('');
  const [styleCreativePrompt, setStyleCreativePrompt] = useState<string>('');
  const [isStyleCreativeSelectorCollapsed, setIsStyleCreativeSelectorCollapsed] = useState<boolean>(false);
    
  // Ad Copy State (for inline tab)
  const [adCopyUserInput, setAdCopyUserInput] = useState('');
  const [adCopyError, setAdCopyError] = useState<string | null>(null);
  const [generatedAdCopy, setGeneratedAdCopy] = useState<string | null>(null);
  const [generatedAdCopySources, setGeneratedAdCopySources] = useState<{uri: string, title: string}[] | null>(null);
  const [adCopyForEditing, setAdCopyForEditing] = useState('');
  const [copyButtonText, setCopyButtonText] = useState(t('adCopyCopy'));
  const [isSpeakingAdCopy, setIsSpeakingAdCopy] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [adCopyResultSize, setAdCopyResultSize] = useState<{width: string, height: string} | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isGeneratingAdImage, setIsGeneratingAdImage] = useState<boolean>(false);
  const [generatedAdImageUrl, setGeneratedAdImageUrl] = useState<string | null>(null);
  const [adImageError, setAdImageError] = useState<string | null>(null);
  const [isAdImageModalOpen, setIsAdImageModalOpen] = useState<boolean>(false);
  const [adCopySeasons, setAdCopySeasons] = useState<{summer: boolean, autumn: boolean, winter: boolean}>({
        summer: false,
        autumn: false,
        winter: false
  });
  // New state for displaying a specific loading message instead of the generic one
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);


  // Feedback State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // Collection Name State
  const [isCollectionNameModalOpen, setIsCollectionNameModalOpen] = useState(false);

  // Custom Help Audio State
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  
  // State for masking modal
  const [isMaskingModalOpen, setIsMaskingModalOpen] = useState(false);
  const [imageToMask, setImageToMask] = useState<{ url: string; index: number } | null>(null);

  // Memoize the single image file for other tabs
  const imageFile = useMemo(() => imageFiles[0] || null, [imageFiles]);
  
  // Creative Tab constants
  const effects = useMemo(() => [
    { id: 'auto', title: 'HIỆU ỨNG TỰ ĐỘNG', description: 'AI sẽ phân tích sản phẩm của bạn và tự động tạo ra một phông nền và ánh sáng phù hợp.' },
    { id: 'real', title: 'ỨNG DỤNG THỰC TẾ', description: 'AI sẽ đặt sản phẩm của bạn vào một bối cảnh đời thực, có thể bao gồm tay người hoặc các yếu tố con người.' },
    { id: 'none', title: 'KHÔNG HIU ỨNG', description: 'Sản phẩm của bạn sẽ được đặt trên một nền trắng liền mạch, sạch sẽ cho mục đích thương mại điện tử.' },
    { id: 'custom', title: 'HIỆU ỨNG TÙY CHỈNH', description: 'Tự viết prompt chi tiết để kiểm soát hoàn toàn bối cảnh sản phẩm.' },
  ], []);

  const effectPrompts: { [key: string]: string } = {
    auto: 'analyze the product and automatically generate a professional, complementary backdrop with suitable lighting',
    real: 'place the product in a realistic, real-world context, potentially including human hands or elements to demonstrate its use',
    none: 'place the product on a clean, seamless white background for a classic e-commerce look',
  };

  // Tab definitions
  const tabs = useMemo(() => [
    { id: 'style', title: t('styleTab') },
    { id: 'extract', title: t('extractTab') },
    { id: 'fold', title: t('foldTab') },
    { id: 'video', title: t('videoTab') },
    { id: 'creative', title: t('creativeTab') },
  ], [t]);

  const tabInfo = useMemo(() => ({
    style: { 
      title: t('styleTabTitle'), 
      description: t('styleTabDescription') 
    },
    extract: { 
      title: t('extractTabTitle'), 
      description: t('extractTabDescription')
    },
    fold: { 
      title: t('foldTabTitle'), 
      description: t('foldTabDescription')
    },
    video: { 
      title: t('videoTabTitle'), 
      description: t('videoTabDescription')
    },
    creative: { 
      title: t('creativeTabTitle'), 
      description: t('creativeTabDescription')
    },
  }), [t]);
  
  const subscriptionInfo = useMemo(() => {
    if (!expirationDate) {
      return { daysRemaining: 0, isExpired: true, showRenewalNotice: false };
    }
    try {
      // Create dates in UTC to avoid local timezone issues.
      const now = new Date();
      // 'today' is the very start of the current day in UTC.
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      
      const dateParts = expirationDate.split('-').map(Number);
      if (dateParts.length !== 3 || dateParts.some(isNaN)) {
        throw new Error("Invalid expiration date format");
      }
      
      // 'expDate' is the very start of the expiration day in UTC.
      const expDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

      if (isNaN(expDate.getTime())) throw new Error("Invalid expiration date value");

      // The subscription is valid for the entirety of the expiration date.
      // So, the actual moment of expiration is at the very END of that day.
      // We calculate the difference between the start of the next day and the start of today.
      const endOfExpirationDay = new Date(expDate.getTime() + (24 * 60 * 60 * 1000));

      const timeDiff = endOfExpirationDay.getTime() - today.getTime();
      
      // If the difference is zero or negative, it has expired.
      if (timeDiff <= 0) {
        return { daysRemaining: 0, isExpired: true, showRenewalNotice: false };
      }

      // Calculate the number of full days remaining.
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      return {
        daysRemaining: daysRemaining,
        isExpired: false,
        showRenewalNotice: daysRemaining <= 30,
      };
    } catch (e) {
      console.error("Error calculating subscription info:", e);
      // Provide a safe fallback.
      return { daysRemaining: 365, isExpired: false, showRenewalNotice: false };
    }
  }, [expirationDate]);

  // Derived state for the current tab's generated images
  const currentSubTabId = useMemo(() => {
    switch(activeTab) {
        case 'style': return styleMode;
        case 'extract': return extractSelection;
        case 'creative': return selectedEffect;
        case 'video': return videoMode;
        default: return 'default';
    }
  }, [activeTab, styleMode, extractSelection, selectedEffect, videoMode]);

  const ghostMannequinResults = useMemo(() => resultsByTab['style']?.['ghost']?.urls || null, [resultsByTab]);
  const modelResults = useMemo(() => resultsByTab['style']?.['model']?.urls || null, [resultsByTab]);

  const currentTabResults = useMemo(() => 
      resultsByTab[activeTab]?.[currentSubTabId] || { urls: null, wasCreative: false }, 
      [resultsByTab, activeTab, currentSubTabId]
  );
  
  // Determine which images to display. Prioritize current tab's results, but fall back to ghost mannequin results.
  const generatedImageUrls = useMemo(() => {
      if (activeTab === 'style' && styleMode === 'model') {
        return modelResults;
      }
      const currentUrls = currentTabResults.urls;
      if (currentUrls && currentUrls.length > 0) {
          return currentUrls;
      }
      return ghostMannequinResults;
  }, [currentTabResults.urls, ghostMannequinResults, modelResults, activeTab, styleMode]);
  
  const wasCreativeGeneration = currentTabResults.wasCreative;

  const gradientStyle = useMemo(() => {
    if (!shopInfo?.name) return {};
    const fromColor = stringToHslColor(shopInfo.name, 90, 65);
    const toColor = stringToHslColor(shopInfo.name.split('').reverse().join(''), 100, 75);
    return {
      backgroundImage: `linear-gradient(to right, ${fromColor}, ${toColor})`,
    };
  }, [shopInfo]);

  const currentTheme = useMemo(() => {
    return themes.find(t => t.id === activeTheme) || themes.find(t => t.id === 'black-night')!;
  }, [activeTheme]);

  const isGenerateButtonDisabled = useMemo(() => {
    if (isLoading || generatingVideoType || isGeneratingAudio || isGeneratingAdImage) return true;

    if (activeTab === 'style' && styleMode === 'creative') {
        // In creative mode, only the base prompt is required. Image is optional.
        if (!styleCreativePrompt.trim()) {
            return true;
        }
    } else if (activeTab === 'style' && styleMode === 'adcopy') {
        if (!imageFile || !adCopyUserInput.trim()) return true;
    } else if (activeTab === 'style' && styleMode === 'model' && isAutoGenerateModelFromAccessory) {
        // Special case: Auto model from accessory ONLY requires held product files
        if (heldProductFiles.length === 0) return true;
    } else {
        // For all other modes, an image is required.
        if (imageFiles.length === 0) return true;
    }
    
    // Tab-specific requirements for modes that need an image
    if (activeTab === 'style' && styleMode === 'model') {
        if (!modelAge || !modelGender) return true;
    }
    
    if (activeTab === 'creative' && selectedEffect === 'custom') {
        if (!customPrompt.trim()) return true;
    }

    if (activeTab === 'video') {
        if (!videoOrientation) return true;
        if (videoMode === 'creative' && !videoCreativeCustomization.trim()) {
            return true;
        }
        if (videoMode === 'walk' && (!walkCustomization.trim())) {
            return true;
        }
    }

    return false; // If all checks pass, the button is enabled.
}, [isLoading, generatingVideoType, isGeneratingAudio, isGeneratingAdImage, imageFiles, imageFile, adCopyUserInput, activeTab, styleMode, modelAge, modelGender, selectedEffect, customPrompt, videoMode, videoCreativeBasePrompt, styleCreativePrompt, videoOrientation, walkCustomization, videoCreativeCustomization, isAutoGenerateModelFromAccessory, heldProductFiles]);

  // Load custom audio from localStorage on initial render
  useEffect(() => {
    const savedAudio = localStorage.getItem('customHelpAudioData');
    setCustomAudioUrl(savedAudio);
  }, []);

  // Scroll handler for header visibility
  useEffect(() => {
    const handleScroll = () => {
      // Only show the header when the user is at the very top of the page.
      setIsHeaderVisible(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

    // Effect for closing video lightbox with Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVideoboxOpen) {
                setIsVideoboxOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVideoboxOpen]);
    
      // Effect for loading TTS voices
    useEffect(() => {
        const loadVoices = () => {
            setVoices(window.speechSynthesis.getVoices());
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices(); // Initial load
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Effect to cleanup TTS on mode change
    useEffect(() => {
        if (styleMode !== 'adcopy') {
            window.speechSynthesis.cancel();
            setIsSpeakingAdCopy(false);
            setGeneratedAudioUrl(null);
        }
    }, [styleMode]);

    // Effect to auto-populate creative video prompt
    useEffect(() => {
        if (activeTab === 'video' && videoMode === 'creative' && videoCreativeBasePrompt) {
            const productName = videoCreativeProductName.trim() || "[TÊN SẢN PHẨM]";
            // Use a global regex to replace all instances, just in case
            const populatedPrompt = videoCreativeBasePrompt.replace(/\[TÊN SẢN PHẨM\]/g, productName);
            setVideoCreativeCustomization(populatedPrompt);
        }
    }, [videoCreativeProductName, videoCreativeBasePrompt, activeTab, videoMode]);

    // Effect to auto-populate creative style prompt
    useEffect(() => {
        if (activeTab === 'style' && styleMode === 'creative' && styleCreativeBasePrompt) {
            const productName = styleCreativeProductName.trim() || "[TÊN SẢN PHẨM]";
            const populatedPrompt = styleCreativeBasePrompt.replace(/\[TÊN SẢN PHẨM\]/g, productName);
            setStyleCreativePrompt(populatedPrompt);
        }
    }, [styleCreativeProductName, styleCreativeBasePrompt, activeTab, styleMode]);
    
    // Effect to update copy button text on language change
    useEffect(() => {
        setCopyButtonText(t('adCopyCopy'));
    }, [t]);

    const requestAppFullscreen = () => {
        try {
            const docEl = document.documentElement as any;

            // Check if already in fullscreen to avoid errors from redundant requests.
            const isInFullScreen = document.fullscreenElement || 
                                   (document as any).webkitFullscreenElement || 
                                   (document as any).mozFullScreenElement || 
                                   (document as any).msFullscreenElement;

            if (isInFullScreen) {
                return;
            }

            const requestMethod = docEl.requestFullscreen || 
                                  docEl.webkitRequestFullscreen || 
                                  docEl.mozRequestFullScreen || 
                                  docEl.msRequestFullscreen;

            if (requestMethod) {
                const promise = requestMethod.call(docEl);
                if (promise) {
                    promise.catch((err: Error) => {
                        console.warn(`Could not enter fullscreen mode: ${err.message}`);
                    });
                }
            } else {
                console.warn("Fullscreen API is not supported by this browser.");
            }
        } catch (e) {
            console.error("An unexpected error occurred while trying to enter fullscreen:", e);
        }
    };
  
  const handleLoginSuccess = () => {
    updateState('isAuthenticated', true);
    requestAppFullscreen();
  };
  
  const handleLogout = () => {
      localStorage.removeItem('appState'); // Clear persisted state
      
      // Calculate a default expiration date based on the old logic for consistency.
      const defaultPurchaseDate = '2023-07-20';
      const defaultSubscriptionYears = 1;
      const defaultExpDate = new Date(defaultPurchaseDate);
      defaultExpDate.setFullYear(defaultExpDate.getFullYear() + defaultSubscriptionYears);

      // Reset to default initial state
      setAppState({
          isAuthenticated: false,
          shopInfo: null,
          activeTab: 'style',
          activeTheme: 'black-night',
          resultsByTab: {},
          collectionName: '',
          expirationDate: defaultExpDate.toISOString().split('T')[0],
          language: 'vi',
      });
  };

  const handleSaveShopInfo = (info: ShopInfo) => {
    updateState('shopInfo', info);
    setIsShopInfoInitialSetup(false);
  };

  const handleClearShopInfo = () => {
    updateState('shopInfo', null);
  };

  const handleShopInfoModalClose = () => {
    setIsShopInfoModalOpen(false);
    if (nextActionAfterShopInfo) {
        nextActionAfterShopInfo();
        setNextActionAfterShopInfo(null);
    }
  };

  const handleSaveCollectionName = (name: string) => {
    updateState('collectionName', name);
    setIsCollectionNameModalOpen(false); // Close modal on save
  };

  const handleUpdateSubscription = (startDate: string, endDate: string) => {
    try {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
            console.error("Invalid end date provided for subscription update");
            return;
        }

        // This sets a new subscription period, replacing the old one.
        setAppState(prevState => ({
            ...prevState,
            expirationDate: endDate,
        }));

    } catch (e) {
        console.error("Failed to update subscription dates", e);
    }
  };

  const handleAudioUpdate = () => {
    const savedAudio = localStorage.getItem('customHelpAudioData');
    setCustomAudioUrl(savedAudio);
  };

  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
      if (direction === 'in') {
          setZoomLevel(prev => Math.min(prev + 0.05, 1.5));
      } else if (direction === 'out') {
          setZoomLevel(prev => Math.max(prev - 0.05, 0.8));
      } else {
          setZoomLevel(1.0);
      }
  };

  const handleThemeChange = (themeId: string) => {
    updateState('activeTheme', themeId);
  };
  
  const handleLanguageChange = (langCode: string) => {
    updateState('language', langCode);
  };

  const setCurrentResults = (results: ResultState | null) => {
    const newResultsByTab = {
        ...resultsByTab,
        [activeTab]: {
            ...(resultsByTab[activeTab] || {}),
            [currentSubTabId]: results === null ? { urls: null, wasCreative: false } : results
        }
    };
    updateState('resultsByTab', newResultsByTab);
  };

  const handleApiKeyChange = () => {
    setError(null);
    setVideoError(null);
    setAdCopyError(null);
    setAudioError(null);
    setAdImageError(null);
  };
  
  const handleFilesChange = (files: File[], clearCurrentResults: boolean = true) => {
    requestAppFullscreen();
    setImageFiles(files);
    if (clearCurrentResults) {
      setCurrentResults(null);
    }
    setOriginalCleanedUrls({});
    setError(null);
    setGeneratedVideoUrl(null);
    setVideoError(null);
    setIsVideoboxOpen(false);
    setVideoPlayerSize(null);
  };

  const handleSetActiveTab = async (tabId: string) => {
    requestAppFullscreen();
    // Reset states relevant to the specific controls of any given tab
    setFaceImageFile(null);
    setHeldProductFiles([]);
    setMaterialSampleFiles([]);
    setShowFaceUploader(false);
    setShowHeldProductUploader(false);
    setShowMaterialUploader(false);
    setModelAge(null);
    setModelGender(null);
    setGenerateDifferentFace(false);
    setGhostMannequinAge(null);
    setVideoOrientation(null);
    setOriginalCleanedUrls({});
    setIsAutoGenerateModelFromAccessory(false);
    
    // Clear the active image files. This is crucial for the new workflow.
    // When the uploader on the new tab renders, if `imageFiles` is empty,
    // it will automatically show the `sourceImagePool` (the generated images grid) if available.
    handleFilesChange([], false);

    updateState('activeTab', tabId);
  };
  
  const handleFaceFileChange = (files: File[]) => {
    requestAppFullscreen();
    setFaceImageFile(files[0] || null);
    setCurrentResults(null);
    setError(null);
  }

  const handleHeldProductFilesChange = (files: File[]) => {
    requestAppFullscreen();
    setHeldProductFiles(files);
    setCurrentResults(null);
    setError(null);
  }
  
  const handleMaterialFileChange = (files: File[]) => {
    requestAppFullscreen();
    setMaterialSampleFiles(files);
    setCurrentResults(null);
    setError(null);
  }

  const handleStyleModeChange = async (mode: 'ghost' | 'model' | 'creative' | 'adcopy') => {
    if (mode === 'adcopy') {
        const predefinedShopInfo: ShopInfo = {
            name: 'Shop Conlso1 - 16A Lý Thái Tổ',
            hotline: '0988771339',
            zalo: '0961771339',
        };
        updateState('shopInfo', predefinedShopInfo);

        const switchToAdCopyAction = () => {
            setAdCopyUserInput('');
            setAdCopyError(null);
            setGeneratedAdCopy(null);
            setGeneratedAdCopySources(null);
            setAdCopyForEditing('');
            setGeneratedAudioUrl(null);
            setAudioError(null);
            setGeneratedAdImageUrl(null);
            setAdImageError(null);
            setAdCopySeasons({ summer: false, autumn: false, winter: false });
            handleFilesChange([], false);
            setStyleMode('adcopy');
        };
        
        switchToAdCopyAction();
        return;
    }
    
    // Reset states for other modes
    setShowFaceUploader(false);
    setShowHeldProductUploader(false);
    setShowMaterialUploader(false);
    setMaterialSampleFiles([]);
    setModelAge(null);
    setModelGender(null);
    setGenerateDifferentFace(false);
    setGhostMannequinAge(null);
    setIsAutoGenerateModelFromAccessory(false); // Reset auto model state
    
    if (mode === 'ghost') {
        setFaceImageFile(null);
        setHeldProductFiles([]);
    }

    // When switching modes, always clear the current image file to allow the
    // source selection grid to appear in the new mode's uploader.
    if (styleMode !== mode) {
        handleFilesChange([], false);
    }
    
    setStyleMode(mode);
  };

    const handleSourceImageSelect = async (index: number, source: 'ghost' | 'model') => {
        const sourcePool = source === 'model' ? modelResults : ghostMannequinResults;
        const indexSetter = source === 'model' ? setSelectedModelSourceImageIndex : setSelectedSourceImageIndex;

        if (!sourcePool || sourcePool.length <= index) return;
        
        requestAppFullscreen(); // Immediately request fullscreen on user click, before async operations.

        indexSetter(index); 

        const sourceUrl = sourcePool[index];
        const file = await dataURLtoFile(sourceUrl, `source_from_${source}_${index}.png`);
        
        // This is the key action. It sets the active file and causes the uploader
        // to switch from the source pool view to the preview view.
        handleFilesChange([file], false); 
    };

    const handleWalkPromptSelect = (prompt: string) => {
        const fullPrompt = prompt;
        setWalkCustomization(fullPrompt);
        setIsWalkSelectorCollapsed(true);
    };

    const handleModelBackdropSelect = (prompt: string) => {
        setModelCustomPrompt(prompt);
        setIsModelBackdropSelectorCollapsed(true);
    };
    
    const handleStyleCreativeSelect = (prompt: string) => {
        setStyleCreativeBasePrompt(prompt);
        setIsStyleCreativeSelectorCollapsed(true);
    };

    const handleVideoCreativeSelect = (prompt: string) => {
        setVideoCreativeBasePrompt(prompt);
        setIsVideoCreativeSelectorCollapsed(true);
    };

  const resetStateForGeneration = () => {
    setIsLoading(true);
    setError(null);
    setCurrentResults(null);
    setOriginalCleanedUrls({});
    setGeneratedVideoUrl(null);
    setVideoError(null);
    setIsVideoboxOpen(false);
    setVideoPlayerSize(null);
    setAdCopyError(null);
    setGeneratedAdCopy(null);
    setGeneratedAdCopySources(null);
    setGeneratedAudioUrl(null);
    setAudioError(null);
    setGeneratedAdImageUrl(null);
    setAdImageError(null);
    setVideoPollCount(0);
    setLoadingMessage(undefined);
  }
  
  const handleGenerateAdCopyForView = async () => {
    if (!imageFile) {
        setAdCopyError("Vui lòng chọn hoặc tải lên một ảnh sản phẩm.");
        return;
    }
    if (!shopInfo) {
        setAdCopyError("Thông tin shop chưa được thiết lập. Vui lòng vào 'Thiết lập thông tin Shop' ở thanh công cụ.");
        return;
    }
    if (!adCopyUserInput.trim()) {
        setAdCopyError("Vui lòng nhập giá và phong cách quảng cáo.");
        return;
    }

    setIsLoading(true);
    setAdCopyError(null);
    setGeneratedAdCopy(null);
    setGeneratedAdCopySources(null);
    setGeneratedAudioUrl(null);
    setAudioError(null);
    setGeneratedAdImageUrl(null);
    setAdImageError(null);

    try {
        const base64 = await fileToBase64(imageFile);
        const imagePart = { base64ImageData: base64, mimeType: imageFile.type };

        const productCategory = await analyzeProductCategory(imagePart.base64ImageData, imagePart.mimeType);

        const currentYear = new Date().getFullYear();
        let prompt = '';

        const seasonLabels = [];
        if (adCopySeasons.summer) seasonLabels.push("Hàng Hè (Mùa Hè)");
        if (adCopySeasons.autumn) seasonLabels.push("Hàng Thu (Mùa Thu)");
        if (adCopySeasons.winter) seasonLabels.push("Hàng Đông (Mùa Đông)");
        const seasonContext = seasonLabels.length > 0 
            ? `\n- Mùa vụ sản phẩm: ${seasonLabels.join(', ')}. Hãy tập trung viết nội dung phù hợp với thời tiết và nhu cầu của các mùa này.` 
            : '';

        if (productCategory === 'clothing') {
            prompt = `Bạn là một chuyên gia marketing và viết quảng cáo bậc thầy cho các sản phẩm thời trang.
Phân tích kỹ lưỡng ảnh sản phẩm được cung cấp.
Dựa vào ảnh và thông tin dưới đây, hãy viết một bài quảng cáo Facebook hấp dẫn, chuẩn SEO, có khả năng viral cao.

**YÊU CẦU BẮT BUỘC VỀ NĂM:** Năm hiện tại là ${currentYear}. Luôn sử dụng năm ${currentYear} trong tất cả nội dung, tiêu đề, và hashtag có liên quan đến thời gian hoặc xu hướng (ví dụ: "Trend Hè ${currentYear}", "#thoitrang${currentYear}"). TUYỆT ĐỐI KHÔNG SỬ DỤNG NĂM CŨ.

**Thông tin bắt buộc:**
- Giá và Phong cách: "${adCopyUserInput}"${seasonContext}
- Tên Shop: ${shopInfo.name}
- Hotline: ${shopInfo.hotline}
- Zalo: ${shopInfo.zalo}

**Yêu cầu cấu trúc bài viết:**
1.  **Tiêu đề:** Ngắn gọn, giật tít, chứa emoji phù hợp.
2.  **Nội dung:**
    - Mở đầu bằng một câu thu hút, mô tả lợi ích chính của sản phẩm (ví dụ: "hack dáng", "sang chảnh", "năng động").
    - Mô tả chi tiết hơn về sản phẩm (chất liệu, thiết kế, điểm nổi bật) dựa vào những gì bạn thấy trong ảnh.
    - Nêu bật lý do tại sao khách hàng nên mua sản phẩm này.
    - Kêu gọi hành động (Call To Action) mạnh mẽ (ví dụ: "Nhanh tay inbox cho shop...", "Số lượng có hạn...").
3.  **Thông tin liên hệ:** Bao gồm Tên Shop, Hotline, Zalo.
4.  **Hashtag:** Tạo ra 5-7 hashtag có liên quan, bắt trend.

**Lưu ý quan trọng:**
- Giọng văn phải phù hợp với phong cách được yêu cầu.
- Sử dụng emoji một cách thông minh để bài viết thêm sinh động.
- Giữ cho bài viết có độ dài vừa phải, dễ đọc trên di động.
- Chỉ xuất ra nội dung bài viết, không thêm bất kỳ lời chào hay giải thích nào khác.`;
        } else {
             prompt = `Bạn là một chuyên gia marketing và viết quảng cáo bậc thầy cho mọi loại sản phẩm.
NHIỆM VỤ: Phân tích ảnh sản phẩm được cung cấp và sử dụng Google Search để tra cứu thông tin về sản phẩm đó (tên, công dụng, đặc điểm nổi bật).
Dựa vào kết quả phân tích và tra cứu, kết hợp với thông tin dưới đây, hãy viết một bài quảng cáo Facebook hấp dẫn, chuẩn SEO, có khả năng viral cao.

**YÊU CẦU BẮT BUỘC VỀ NĂM:** Năm hiện tại là ${currentYear}. Luôn sử dụng năm ${currentYear} trong tất cả nội dung, tiêu đề, và hashtag có liên quan đến thời gian hoặc xu hướng (ví dụ: "Sản phẩm hot ${currentYear}"). TUYỆT ĐỐI KHÔNG SỬ DỤNG NĂM CŨ.

**Thông tin bắt buộc:**
- Giá và Phong cách: "${adCopyUserInput}"${seasonContext}
- Tên Shop: ${shopInfo.name}
- Hotline: ${shopInfo.hotline}
- Zalo: ${shopInfo.zalo}

**Yêu cầu cấu trúc bài viết:**
1.  **Tiêu đề:** Ngắn gọn, giật tít, chứa emoji phù hợp, nêu bật công dụng chính.
2.  **Nội dung:**
    - Mở đầu bằng một câu thu hút, giải quyết vấn đề của khách hàng.
    - Mô tả chi tiết hơn về sản phẩm, nêu bật các tính năng và lợi ích độc đáo mà bạn tra cứu được.
    - Nêu bật lý do tại sao khách hàng nên mua sản phẩm này so với các sản phẩm khác.
    - Kêu gọi hành động (Call To Action) mạnh mẽ (ví dụ: "Đặt hàng ngay hôm nay...", "Số lượng có hạn...").
3.  **Thông tin liên hệ:** Bao gồm Tên Shop, Hotline, Zalo.
4.  **Hashtag:** Tạo ra 5-7 hashtag có liên quan, tập trung vào công dụng và tên sản phẩm.

**Lưu ý quan trọng:**
- Giọng văn phải phù hợp với phong cách được yêu cầu.
- Sử dụng emoji một cách thông minh để bài viết thêm sinh động.
- Giữ cho bài viết có độ dài vừa phải, dễ đọc trên di động.
- Chỉ xuất ra nội dung bài viết, không thêm bất kỳ lời chào hay giải thích nào khác.`;
        }


        const { text: adCopy, sources } = await generateTextContent(prompt, imagePart, productCategory !== 'clothing');
        setGeneratedAdCopy(adCopy);
        setAdCopyForEditing(adCopy);
        if (sources) {
            setGeneratedAdCopySources(sources);
        }

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
        setAdCopyError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
    const handleSpeakAdCopy = () => {
        if (!adCopyForEditing || !('speechSynthesis' in window)) return;

        if (isSpeakingAdCopy) {
            window.speechSynthesis.cancel();
            setIsSpeakingAdCopy(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(adCopyForEditing);
        const vietnameseVoice = voices.find(v => v.lang === 'vi-VN' && v.name.includes('Google')) || voices.find(v => v.lang === 'vi-VN');
        
        if (vietnameseVoice) {
            utterance.voice = vietnameseVoice;
        }

        utterance.onstart = () => setIsSpeakingAdCopy(true);
        utterance.onend = () => setIsSpeakingAdCopy(false);
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            // The 'interrupted' error is expected when the user manually stops the speech.
            // We only log other, unexpected errors to the console.
            if (e.error !== 'interrupted') {
                console.error("Speech synthesis error:", e.error);
            }
            setIsSpeakingAdCopy(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    // FIX: Added handleCopy function to copy the generated ad text to the clipboard.
    const handleCopy = () => {
        if (adCopyForEditing) {
            navigator.clipboard.writeText(adCopyForEditing).then(() => {
                setCopyButtonText(t('adCopyCopied'));
                setTimeout(() => setCopyButtonText(t('adCopyCopy')), 2000);
            });
        }
    };
    
    const handleGenerateAudio = async () => {
        if (!adCopyForEditing) {
            setAudioError("Không có nội dung để tạo giọng đọc.");
            return;
        }
        if (!shopInfo) {
            setAudioError("Vui lòng thiết lập thông tin shop trước khi tạo giọng đọc.");
            return;
        }

        setIsGeneratingAudio(true);
        setAudioError(null);
        setGeneratedAudioUrl(null);
        try {
            const contactInfo = `Thông tin liên hệ để đọc ở cuối kịch bản: Tên Shop là ${shopInfo.name}, Hotline ${shopInfo.hotline}, và Zalo ${shopInfo.zalo}.`;

            const rewritePrompt = `Bạn là một chuyên gia kịch bản quảng cáo âm thanh. Dựa trên bài viết sau, hãy viết lại thành một kịch bản thoại ngắn (khoảng 20-40 giây) thật hấp dẫn, lôi cuốn để thu âm. Giọng văn phải tự nhiên và thôi thúc người nghe mua hàng.

**YÊU CẦU BẮT BUỘC:**
1.  **Nội dung chính:** Chuyển thể nội dung quảng cáo chính thành lời thoại. Bỏ qua tất cả các hashtag và icon.
2.  **Thêm thông tin liên hệ:** Ở cuối kịch bản, bạn PHẢI đọc to, rõ ràng và đầy đủ thông tin liên hệ được cung cấp dưới đây. Hãy đọc một cách tự nhiên, ví dụ: "Để đặt hàng, hãy liên hệ ngay shop [Tên Shop] qua hotline [Số điện thoại] hoặc Zalo [Số Zalo]".
3.  **Định dạng:** Chỉ xuất ra kịch bản thoại sạch, không thêm bất kỳ lời dẫn hay giải thích ("Kịch bản thoại:") nào khác.

**Nội dung gốc:**
"${adCopyForEditing}"

**${contactInfo}**`;
            const { text: rewrittenScript } = await generateTextContent(rewritePrompt);
            
            const audioBase64 = await generateSpeech(rewrittenScript);
            
            const pcmData = decodeBase64(audioBase64);
            // The TTS model returns 16-bit PCM at 24kHz, 1 channel.
            const wavBlob = pcmToWavBlob(pcmData, 24000, 1, 16);
            const audioUrl = URL.createObjectURL(wavBlob);
            setGeneratedAudioUrl(audioUrl);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo âm thanh.';
            setAudioError(errorMessage);
        } finally {
            setIsGeneratingAudio(false);
        }
    };

    const handleGenerateImageFromAd = async () => {
        if (!adCopyForEditing) {
            setAdImageError("Không có nội dung để tạo ảnh.");
            return;
        }
        setIsGeneratingAdImage(true);
        setAdImageError(null);
        setGeneratedAdImageUrl(null);
        try {
            const imagePromptGenPrompt = `Dựa vào bài viết quảng cáo sau, hãy tạo ra một câu prompt ngắn gọn (khoảng 15-25 từ) bằng tiếng Anh để AI tạo ra một hình ảnh quảng cáo thật đẹp, bắt mắt, và phù hợp với nội dung. Câu prompt phải mô tả sản phẩm, bối cảnh, và phong cách. Chỉ xuất ra câu prompt tiếng Anh, không gì khác. Nội dung gốc:\n\n"${adCopyForEditing}"`;
            const { text: imagePrompt } = await generateTextContent(imagePromptGenPrompt);

            const imageUrls = await generateStyledImage(imagePrompt, 1, "1:1");
            if (imageUrls.length > 0) {
                setGeneratedAdImageUrl(imageUrls[0]);
                setIsAdImageModalOpen(true);
            } else {
                throw new Error("AI không tạo ra ảnh. Vui lòng thử lại.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi tạo ảnh.';
            setAdImageError(errorMessage);
        } finally {
            setIsGeneratingAdImage(false);
        }
    };


    const handleDownloadImage = (index: number) => {
        const urls = generatedImageUrls;
        if (urls && urls[index]) {
            const url = urls[index];
            const fileName = `${collectionName || 'ket-qua'}_${activeTab}_${currentSubTabId}_${index + 1}.png`;
            downloadWithLink(url, fileName);
        }
    };

    const handleDownloadAll = async () => {
        if (!generatedImageUrls || generatedImageUrls.length === 0) {
            setError("Không có ảnh để tải.");
            return;
        }

        try {
            const zip = new JSZip();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            // Folder name inside zip
            const folderName = collectionName ? collectionName.replace(/\s+/g, '_') : `FashionStudio_${timestamp}`;
            const folder = zip.folder(folderName);

            // Convert all URLs to blobs and add to zip
            const promises = generatedImageUrls.map(async (url, index) => {
                // Fetch handles data URLs perfectly
                const response = await fetch(url);
                const blob = await response.blob();
                const fileName = `${collectionName || 'anh'}_${index + 1}.png`;
                folder?.file(fileName, blob);
            });

            await Promise.all(promises);

            // Generate the zip file
            const content = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(content);
            const zipFilename = `${folderName}.zip`;

            // Download the zip
            downloadWithLink(zipUrl, zipFilename);

        } catch (err) {
             console.error("Failed to zip and download:", err);
             setError("Đã xảy ra lỗi khi nén file. Vui lòng thử lại.");
        }
    };
    
    const handleUseImageForTab = async (index: number, targetTab: string, targetSubTab?: string) => {
        // Determine the correct source of URLs before switching tabs
        const urls = (activeTab === 'style' && styleMode === 'model' && modelResults) ? modelResults : generatedImageUrls;
        if (!urls || !urls[index]) return;

        const sourceUrl = urls[index];
        const file = await dataURLtoFile(sourceUrl, `source_image_from_results.png`);
        
        // Update image state and switch tab
        setImageFiles([file]);
        setError(null);
        setGeneratedVideoUrl(null);
        setVideoError(null);
        setIsVideoboxOpen(false);

        if (targetTab === 'video') {
            if (targetSubTab === 'walk') {
                setVideoMode('walk');
            } else {
                // Default to a sensible mode if not walk
                setVideoMode('360'); 
            }
        }
        
        updateState('activeTab', targetTab);
        setIsImageViewerOpen(false); // Close viewer if open
    };
    
    const handleImageViewerNavigate = (direction: 'prev' | 'next') => {
        if (!generatedImageUrls) return;
        const total = generatedImageUrls.length;
        if (direction === 'next') {
            setImageViewerCurrentIndex(prev => (prev + 1) % total);
        } else {
            setImageViewerCurrentIndex(prev => (prev - 1 + total) % total);
        }
    };
    
    const handleRewritePrompt = async () => {
        if (isRewritingPrompt) return;

        if (!imageFile) {
            setError("Vui lòng tải lên ảnh sản phẩm trước khi viết lại prompt.");
            return;
        }
        if (!modelCustomPrompt.trim()) {
            setError("Vui lòng nhập prompt gốc trước khi viết lại.");
            return;
        }

        setIsRewritingPrompt(true);
        setError(null);

        try {
            const base64 = await fileToBase64(imageFile);
            const imagePart = { base64ImageData: base64, mimeType: imageFile.type };

            const rewriteInstruction = `Bạn là một chuyên gia viết prompt cho AI tạo ảnh, đặc biệt là thời trang.
NHIỆM VỤ:
1. PHÂN TÍCH KỸ LƯỠNG ẢNH SẢN PHẨM được cung cấp. Xác định các đặc điểm chính của sản phẩm (loại trang phục, màu sắc, kiểu dáng, chất liệu, họa tiết).
2. ĐỌC PROMPT GỐC của người dùng để hiểu bối cảnh họ mong muốn.
3. VIẾT LẠI PROMPT GỐC thành một prompt mới chi tiết, sống động, và nghệ thuật hơn.

YÊU CẦU BẮT BUỘC:
- Prompt mới phải mô tả một người mẫu đang mặc CHÍNH XÁC sản phẩm từ ảnh đã được phân tích. Phải nhấn mạnh việc giữ nguyên 100% chi tiết của sản phẩm gốc.
- Kết hợp mô tả sản phẩm một cách tự nhiên vào bối cảnh mà người dùng đã gợi ý.
- Chỉ xuất ra prompt đã được viết lại, không thêm bất kỳ lời chào hay giải thích nào khác.

Prompt gốc của người dùng: "${modelCustomPrompt}"`;
            
            const { text: rewrittenPrompt } = await generateTextContent(rewriteInstruction, imagePart, false);
            
            setModelCustomPrompt(rewrittenPrompt);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi viết lại prompt.';
            setError(errorMessage); 
        } finally {
            setIsRewritingPrompt(false);
        }
    };

    const handleRemoveWatermark = async () => {
        if (!imageFile) {
            setError(t('creativeBgUploadTip'));
            return;
        }
        resetStateForGeneration();
        setIsLoading(true);
        setLoadingMessage(t('removingWatermark'));

        try {
             const base64 = await fileToBase64(imageFile);
             const imagePart = { base64ImageData: base64, mimeType: imageFile.type };
             const resultUrls = await removeWatermark(imagePart);
             setCurrentResults({ urls: resultUrls, wasCreative: false });
        } catch (err) {
             const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
             setError(errorMessage);
        } finally {
             setIsLoading(false);
             setLoadingMessage(undefined);
        }
    };

  const handleGenerateClick = async () => {
    if (isLoading) return;

    if (activeTab === 'style' && styleMode === 'adcopy') {
      await handleGenerateAdCopyForView();
      return;
    }
    
    resetStateForGeneration();
    const wasCreative = activeTab === 'creative' || (activeTab === 'style' && styleMode === 'creative');

    try {
        if (activeTab === 'style') {
             if (styleMode !== 'creative' && !isAutoGenerateModelFromAccessory && imageFiles.length === 0) {
                setError('Vui lòng tải lên ảnh để tạo hiệu ứng.');
                setIsLoading(false);
                return;
            }

            if (styleMode === 'ghost') {
                const generateGhostImages = async () => {
                    const views = [
                        'Ảnh 1: mặt trước',
                        'Ảnh 2: mặt sau',
                        'Ảnh 3: mặt bên trái',
                        'Ảnh 4: mặt bên phải'
                    ];

                    const productBase64s = await Promise.all(imageFiles.map(file => fileToBase64(file)));
                    const allImageParts = imageFiles.map((file, index) => ({
                        base64ImageData: productBase64s[index],
                        mimeType: file.type
                    }));
                    
                    const isWhiteProduct = await isProductWhite(allImageParts[0].base64ImageData, allImageParts[0].mimeType);
                    
                    let unifiedPrompt = UNIFIED_GHOST_MANNEQUIN_PROMPT;
                    let advancedPrompt = ADVANCED_GHOST_MANNEQUIN_PROMPT;

                    if (isWhiteProduct) {
                        const backgroundInstruction = 'Đặt sản phẩm trên nền studio chuyên nghiệp với gradient xám nhạt tinh tế (từ #f5f5f5 đến #e0e0e0) để làm nổi bật sản phẩm trắng.';
                        const advancedBackgroundInstruction = 'Nền studio chuyên nghiệp với gradient xám nhạt tinh tế (từ #f5f5f5 đến #e0e0e0),';
                        
                        unifiedPrompt = unifiedPrompt.replace(
                            'Đặt sản phẩm trên nền trắng hoàn toàn liền mạch.',
                            backgroundInstruction
                        );
                        advancedPrompt = advancedPrompt.replace(
                            'Nền trắng liền mạch,',
                            advancedBackgroundInstruction
                        );
                    }

                    let texturePromptAddon = '';
                    
                    if (materialSampleFiles.length > 0) {
                        const materialBase64s = await Promise.all(materialSampleFiles.map(file => fileToBase64(file)));
                        materialSampleFiles.forEach((file, index) => {
                            allImageParts.push({ base64ImageData: materialBase64s[index], mimeType: file.type });
                        });
                        texturePromptAddon = `QUY TRÌNH XỬ LÝ CHẤT LIỆU BẮT BUỘC: Trước khi tạo ảnh sản phẩm, bạn PHẢI thực hiện và hoàn thành các bước sau theo đúng thứ tự:
BƯỚC 1: PHÂN TÍCH MẪU. Tập trung hoàn toàn vào các ảnh mẫu chất liệu được cung cấp (các ảnh theo sau ảnh sản phẩm chính). Phân tích sâu từng chi tiết: các đường nét của sợi vải, màu sắc chính xác và các biến thể màu, hoa văn (nếu có), và kết cấu bề mặt (độ sần, độ bóng, độ dày, cách vải bắt sáng).
BƯỚC 2: XÁC NHẬN PHÂN TÍCH. Trong nội bộ, hãy tự xác nhận rằng bạn đã hiểu đầy đủ và chính xác tất cả các đặc điểm của chất liệu từ BƯỚC 1. Đây là bước kiểm tra chất lượng nội bộ của bạn.
BƯỚC 3: TÁI TẠO VÀ ÁP DỤNG. Chỉ sau khi hoàn thành BƯỚC 2, hãy bắt đầu tạo ảnh sản phẩm. Sử dụng toàn bộ thông tin đã phân tích để tái tạo lại bề mặt chất liệu trên sản phẩm một cách TRUNG THỰC TUYỆT ĐỐI. Kết quả cuối cùng phải thể hiện chất liệu y hệt như mẫu đã cung cấp. Không được phép sáng tạo hay thay đổi chất liệu.`;
                    }

                    let analysisPreamble = '';
                    if (imageFiles.length > 1) {
                        analysisPreamble = 'QUAN TRỌNG: Bạn được cung cấp nhiều ảnh, bao gồm mặt trước và mặt sau của CÙNG MỘT sản phẩm. Bạn PHẢI phân tích và kết hợp các chi tiết từ TẤT CẢ các ảnh được cung cấp để tạo ra một bộ 4 ảnh "ma-nơ-canh vô hình" 3D thống nhất và chính xác. Ảnh mặt trước phải dựa trên ảnh mặt trước, ảnh mặt sau phải dựa trên ảnh mặt sau, và các ảnh nhìn từ hai bên phải nhất quán với cả hai.\n\n';
                    }

                    let formFactorAddon = '';
                    if (ghostMannequinAge === 'child') {
                        formFactorAddon = 'Phom dáng của trang phục phải tương ứng với tỷ lệ cơ thể của trẻ em.';
                    } else if (ghostMannequinAge === 'adult') {
                        formFactorAddon = 'Phom dáng của trang phục phải tương ứng với tỷ lệ cơ thể của người lớn.';
                    }

                    const viewPromises = views.map(async (view) => {
                        let fullPrompt = '';
                        if (useAdvancedGhostPrompt) {
                            fullPrompt = analysisPreamble + advancedPrompt
                                .replace(
                                    'Yêu cầu xuất ra 4 ảnh riêng biệt, mỗi ảnh thể hiện một góc nhìn rõ ràng:\n- Ảnh 1: mặt trước\n- Ảnh 2: mặt sau\n- Ảnh 3: mặt bên trái\n- Ảnh 4: mặt bên phải',
                                    `Yêu cầu xuất ra một ảnh duy nhất thể hiện một góc nhìn rõ ràng: ${view}`
                                )
                                + ` ${texturePromptAddon}`
                                + ` ${formFactorAddon}`
                                + ` ${ghostMannequinAddon}`.trim();
                        } else {
                            fullPrompt = analysisPreamble + unifiedPrompt
                                .replace(
                                    'Yêu cầu xuất ra 4 ảnh riêng biệt, mỗi ảnh thể hiện một góc nhìn rõ ràng:\nẢnh 1: mặt trước\nẢnh 2: mặt sau\nẢnh 3: mặt bên trái\nẢnh 4: mặt bên phải',
                                    `Yêu cầu xuất ra một ảnh duy nhất thể hiện một góc nhìn rõ ràng: ${view}`
                                )
                                + ` ${texturePromptAddon}`
                                + ` ${formFactorAddon}`
                                + ` ${ghostMannequinAddon}`.trim();
                        }
                        
                        const resultUrls = await editProductImage([allImageParts[0]], fullPrompt);
                        return resultUrls[0] || null;
                    });

                    const allUrls = (await Promise.all(viewPromises)).filter((url): url is string => url !== null);
                    setCurrentResults({ urls: allUrls, wasCreative });
                    setSelectedSourceImageIndex(0); // Reset source image selector
                };

                await generateGhostImages();

            } else if (styleMode === 'model') {
                if (!modelAge || !modelGender) {
                    setError('Vui lòng chọn loại người mẫu và giới tính.');
                    setIsLoading(false);
                    return;
                }
                
                let modelDescription = '';
                if (modelAge === 'adult' && modelGender === 'male') modelDescription = 'a photorealistic adult male';
                if (modelAge === 'adult' && modelGender === 'female') modelDescription = 'a photorealistic adult female';
                if (modelAge === 'child' && modelGender === 'male') modelDescription = 'a photorealistic young boy';
                if (modelAge === 'child' && modelGender === 'female') modelDescription = 'a photorealistic young girl';

                if (isAutoGenerateModelFromAccessory) {
                    // NEW: Logic for generating model based on accessory ONLY
                    if (heldProductFiles.length === 0) {
                        setError('Vui lòng tải lên ảnh phụ kiện.');
                        setIsLoading(false);
                        return;
                    }

                    const accessoryBase64 = await fileToBase64(heldProductFiles[0]);
                    const accessoryPart = {
                        base64ImageData: accessoryBase64,
                        mimeType: heldProductFiles[0].type,
                    };
                    
                    const imageParts = [accessoryPart];
                    
                    // NEW: Handle Face Swap inside Auto Model mode
                    let faceSwapPrompt = '';
                    if (showFaceUploader && faceImageFile) {
                        const faceBase64 = await fileToBase64(faceImageFile);
                        const facePart = {
                            base64ImageData: faceBase64,
                            mimeType: faceImageFile.type,
                        };
                        imageParts.push(facePart);
                        faceSwapPrompt = ` CRITICALLY IMPORTANT: Use the face from the second provided image (the portrait) and seamlessly integrate it onto the generated model. Ensure the face integration is flawless, matching skin tone and lighting. The model MUST have this specific face.`;
                    }

                    const prompt = `You are an expert fashion photographer and stylist.
**INPUT:** The user has provided an image of an accessory or a specific product (e.g., a tennis racket, a handbag, a hat, a musical instrument, etc.)${showFaceUploader && faceImageFile ? ' AND a portrait image of the desired model face.' : '.'}
**TASK:** Generate 4 photorealistic fashion images of a ${modelDescription} interacting with this product.
**CRITICAL INSTRUCTIONS:**
1. **Analyze the Product:** Determine the type of product and its typical context (e.g., Tennis Racket -> Sports/Tennis Court; Luxury Handbag -> High-end Street/Event; Guitar -> Music Studio/Stage).
2. **Style the Model:** The model MUST wear an outfit that is perfectly appropriate for the identified product and context. (e.g., Sportswear for sports items, Elegant dress/suit for luxury items).
3. **Contextual Background:** Create a background that matches the theme.
4. **Interaction:** The model must be holding or using the product naturally and realistically. The product from the input image should be clearly integrated.
5. **Quality:** 8K resolution, highly detailed, professional lighting.
${faceSwapPrompt}
${modelCustomPrompt ? `Additional User Instructions: ${modelCustomPrompt}` : ''}`;

                    const resultUrls = await editProductImage(imageParts, prompt);
                    setCurrentResults({ urls: resultUrls, wasCreative: true });

                } else if (generateDifferentFace) {
                    if (imageFiles.length === 0) {
                        setError('Vui lòng tải lên hoặc chọn một ảnh sản phẩm.');
                        setIsLoading(false);
                        return;
                    }
                    const productPart = {
                        base64ImageData: await fileToBase64(imageFiles[0]),
                        mimeType: imageFiles[0].type,
                    };
                    const imageParts = [productPart];
                    
                    const poseDescriptions = [
                        '1. A full-body shot from the front, with the model looking confidently towards the camera, showcasing the entire outfit.',
                        '2. A three-quarter shot, with the model slightly turned to the side to highlight the profile and silhouette of the clothing.',
                        '3. A close-up shot from the waist up, focusing on the details of the fabric, buttons, or design elements of the upper part of the garment.',
                        '4. A dynamic action shot, with the model captured in a natural walking motion to demonstrate the movement, drape, and flow of the fabric.'
                    ].join('\n');
        
                    const settingDescription = modelCustomPrompt.trim() || 'a clean, minimalist studio or a complementary, subtly blurred outdoor location';
        
                    const masterPrompt = `Create exactly 4 high-end advertising campaign images in a 3:4 aspect ratio. A single, consistent model, who is ${modelDescription}, must be featured across all 4 images, wearing the clothing item from the provided image.

**FACE GENERATION (CRITICAL):**
- Generate a completely new, unique face for the model.
- The face must be beautiful, captivating, with Western features, and an alluring, charming expression.
- The model should have a stylish hairstyle that complements the outfit.
- **Crucially, this exact same model and face MUST be maintained consistently across all 4 output images.**
- Do NOT use any face from the provided image.

**POSES:**
Each of the 4 images must feature one of the following distinct poses:
${poseDescriptions}

**SETTING & STYLE:**
- The setting should be: ${settingDescription}.
- Use natural, soft, directional lighting to emphasize textures and details.
- The final images must be ultra-sharp, 8K quality, and look like real photographs from a fashion magazine.
- Do not include any text or logos.`;
                    
                    const resultUrls = await editProductImage(imageParts, masterPrompt);
                    setCurrentResults({ urls: resultUrls, wasCreative });
                } else {
                    const basePrompt = `Create a high-end advertising campaign image. A photorealistic model must be wearing the clothing item from the first provided image. The setting should be a clean, minimalist studio or a complementary, subtly blurred outdoor location. Use natural, soft, directional lighting to emphasize textures and details, creating a professional and appealing look. The final image must be ultra-sharp, 8K quality, and look like a real photograph from a fashion magazine. Do not include any text or logos.`;
                    const poses = [
                        'Generate a full-body shot from the front, with the model looking confidently towards the camera, showcasing the entire outfit.',
                        'Generate a three-quarter shot, with the model slightly turned to the side to highlight the profile and silhouette of the clothing.',
                        'Generate a close-up shot from the waist up, focusing on the details of the fabric, buttons, or design elements of the upper part of the garment.',
                        'Generate a dynamic action shot, with the model captured in a natural walking motion to demonstrate the movement, drape, and flow of the fabric.'
                    ];
                    
                    const allPromises = imageFiles.map(async (file) => {
                        const productPart = {
                            base64ImageData: await fileToBase64(file),
                            mimeType: file.type,
                        };
            
                        const imageParts = [productPart];
                        let promptAddons = '';
                        
                        if (faceImageFile) {
                            const facePart = {
                                base64ImageData: await fileToBase64(faceImageFile),
                                mimeType: faceImageFile.type,
                            };
                            imageParts.push(facePart);
                            promptAddons += ` Critically important: Use the face from the second provided image and seamlessly integrate it onto the model. Ensure the face integration is flawless, matching skin tone and lighting.`;
                        }

                        if (heldProductFiles.length > 0) {
                            const heldProductBase64s = await Promise.all(heldProductFiles.map(file => fileToBase64(file)));
                            heldProductFiles.forEach((file, index) => {
                                imageParts.push({
                                    base64ImageData: heldProductBase64s[index],
                                    mimeType: file.type,
                                });
                            });
                            const objectPlural = heldProductFiles.length > 1 ? 'objects' : 'object';
                            promptAddons += ` The model must be holding or interacting naturally with the additional ${objectPlural} provided in the subsequent images. Integrate these ${objectPlural} realistically into the scene.`;
                        }

                        const posePromises = poses.map(async (pose) => {
                            const fullPrompt = `${basePrompt}${promptAddons} The model must be ${modelDescription}. ${modelCustomPrompt} Pose instruction: ${pose} The final image must have a 3:4 aspect ratio.`.trim();
                            const resultUrls = await editProductImage(imageParts, fullPrompt);
                            return resultUrls[0] || null;
                        });
                        
                        return Promise.all(posePromises);
                    });

                    const resultsPerFile = await Promise.all(allPromises);
                    const allUrls = resultsPerFile.flat().filter((url): url is string => url !== null);
                    setCurrentResults({ urls: allUrls, wasCreative });
                }
            } else if (styleMode === 'creative') {
                let promptCore = styleCreativePrompt.replace('[TÊN SẢN PHẨM]', styleCreativeProductName || 'sản phẩm');
                
                if (imageFile) {
                    const prompt = `Generate 4 distinct and creative variations, in 8K hyper-realistic quality, based on the following idea: ${promptCore}`;
                    const productPart = { base64ImageData: await fileToBase64(imageFile), mimeType: imageFile.type };
                    const imageParts = [productPart];

                    if (faceImageFile) {
                        const faceBase64 = await fileToBase64(faceImageFile);
                        imageParts.push({ base64ImageData: faceBase64, mimeType: faceImageFile.type });
                    }

                    if (materialSampleFiles.length > 0) {
                        const materialBase64s = await Promise.all(materialSampleFiles.map(file => fileToBase64(file)));
                        materialSampleFiles.forEach((file, index) => {
                            imageParts.push({ base64ImageData: materialBase64s[index], mimeType: file.type });
                        });
                    }

                    const resultUrls = await editProductImage(imageParts, prompt);
                    setCurrentResults({ urls: resultUrls, wasCreative });
                } else {
                    if (faceImageFile) {
                        const faceBase64 = await fileToBase64(faceImageFile);
                        const facePart = { base64ImageData: faceBase64, mimeType: faceImageFile.type };
                        const prompt = `Generate 4 distinct and creative variations, in 8K hyper-realistic quality, based on the following idea: ${promptCore}. CRITICALLY IMPORTANT: The main subject of the image must have the face from the provided image. Integrate it seamlessly.`;
                        const resultUrls = await editProductImage([facePart], prompt);
                        setCurrentResults({ urls: resultUrls, wasCreative });
                    } else {
                        const resultUrls = await generateStyledImage(promptCore, 4, aspectRatio);
                        setCurrentResults({ urls: resultUrls, wasCreative });
                    }
                }
            }
        } else if (activeTab === 'extract') {
            const imagePart = {
                base64ImageData: await fileToBase64(imageFile),
                mimeType: imageFile.type,
            };

            let prompt = '';
            if (extractSelection === 'set') {
                prompt = `**Primary Task:** Extract the clothing product from the model or mannequin in the input image.
**Image Analysis:** The input image shows a clothing outfit on a model or mannequin.
**MANDATORY REQUIREMENTS:**
1.  **Complete Removal:** You MUST COMPLETELY remove the model/mannequin and the background. No part of the human body, skin, or mannequin parts should remain.
2.  **"Ghost Mannequin" Effect:** Preserve the clothing product and recreate it in a professional "ghost mannequin" style. The product must look as if worn by an invisible person, maintaining its natural 3D shape.
3.  **Detail Preservation:** Retain 100% of the original product details (buttons, patterns, etc.).
4.  **Background:** Place the extracted product on a pure, seamless white background.
**OUTPUT REQUIREMENTS:**
- You must generate exactly two images:
  - Image 1: Front view of the product.
  - Image 2: Intelligently generate the back view of the product based on analysis of the front.
- ONLY OUTPUT IMAGES. Do not add any text.`;
            } else if (extractSelection === 'shirt') {
                prompt = `**Primary Task:** Isolate ONLY the top garment (shirt, jacket, etc.) from the model or mannequin in the input image.
**Image Analysis:** The input image shows clothing on a model or mannequin.
**MANDATORY REQUIREMENTS:**
1.  **Complete Removal:** You MUST COMPLETELY remove the model/mannequin, the background, and any other clothing (like pants). No part of the human body, skin, or mannequin parts should remain.
2.  **"Ghost Mannequin" Effect:** Preserve the top garment and recreate it in a professional "ghost mannequin" style. The product must look as if worn by an invisible person, maintaining its natural 3D shape.
3.  **Detail Preservation:** Retain 100% of the original product details.
4.  **Background:** Place the extracted top on a pure, seamless white background.
**OUTPUT REQUIREMENTS:**
- You must generate exactly two images:
  - Image 1: Front view of the top garment.
  - Image 2: Intelligently generate the back view of the top garment based on analysis of the front.
- ONLY OUTPUT IMAGES. Do not add any text.`;
            } else { // 'pants'
                prompt = `**Primary Task:** Isolate ONLY the bottom garment (pants, skirt, etc.) from the model or mannequin in the input image.
**Image Analysis:** The input image shows clothing on a model or mannequin.
**MANDATORY REQUIREMENTS:**
1.  **Complete Removal:** You MUST COMPLETELY remove the model/mannequin, the background, and any other clothing (like a shirt). No part of the human body, skin, or mannequin parts should remain.
2.  **"Ghost Mannequin" Effect:** Preserve the bottom garment and recreate it in a professional "ghost mannequin" style. The product must look as if worn by an invisible person, maintaining its natural 3D shape.
3.  **Detail Preservation:** Retain 100% of the original product details.
4.  **Background:** Place the extracted bottom garment on a pure, seamless white background.
**OUTPUT REQUIREMENTS:**
- You must generate exactly two images:
  - Image 1: Front view of the bottom garment.
  - Image 2: Intelligently generate the back view of the bottom garment based on analysis of the front.
- ONLY OUTPUT IMAGES. Do not add any text.`;
            }

            const resultUrls = await editProductImage([imagePart], prompt);
            setCurrentResults({ urls: resultUrls, wasCreative });

        } else if (activeTab === 'fold') {
            const imagePart = {
                base64ImageData: await fileToBase64(imageFile),
                mimeType: imageFile.type,
            };
            
            const imageType = await analyzeImageType(imagePart.base64ImageData, imagePart.mimeType);

            let itemDescription = 'the clothing item';
            if (imageType === 'pants') {
                itemDescription = 'the pants/trousers';
            } else if (imageType === 'top') {
                itemDescription = 'the shirt/top';
            }

            const prompt = `From the input image of a single, flat, unworn piece of clothing, create two separate output images.
            The clothing item is identified as: ${itemDescription}.
            1.  **Image 1 (Top-Down Fold):** Show ${itemDescription} neatly and professionally folded, shot from a top-down perspective (flat lay).
            2.  **Image 2 (Perspective Fold):** Show ${itemDescription} in the same folded state, but presented in a stack with other similar (but not identical) folded clothes, shot from a 3/4 perspective view.
            Both images must be on a clean, seamless white background with professional, soft studio lighting. The output MUST be exactly two images. Do not add any text.`;

            const resultUrls = await editProductImage([imagePart], prompt);
            setCurrentResults({ urls: resultUrls, wasCreative });
        } else if (activeTab === 'video') {
            const base64ImageBytes = await fileToBase64(imageFile);
            const mimeType = imageFile.type;
            setGeneratingVideoType(videoOrientation);
            let finalPrompt = '';

            if (videoMode === '360') {
                finalPrompt = video360CustomPrompt.trim() || `Cinematic 360-degree orbital shot of the product on a clean, seamless white background.`;
            } else if (videoMode === 'creative') {
                finalPrompt = videoCreativeCustomization.trim();
            } else if (videoMode === 'walk') {
                finalPrompt = walkCustomization.trim();
            }

            const url = await generate360Video(base64ImageBytes, mimeType, finalPrompt, videoOrientation!, (count) => setVideoPollCount(count));
            setGeneratedVideoUrl(url);
            setIsVideoboxOpen(true);
        } else if (activeTab === 'creative') {
            let promptCore = '';
            if (selectedEffect === 'custom') {
                promptCore = customPrompt;
            } else {
                promptCore = effectPrompts[selectedEffect];
            }

            if (!promptCore) {
                setError('Không thể tạo prompt cho hiệu ứng đã chọn.');
                setIsLoading(false);
                return;
            }
            const finalPrompt = `Generate 4 distinct and creative variations for a product backdrop based on the following idea: ${promptCore}`;
            const imagePart = { base64ImageData: await fileToBase64(imageFile), mimeType: imageFile.type };
            const resultUrls = await editProductImage([imagePart], finalPrompt);
            setCurrentResults({ urls: resultUrls, wasCreative });
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
        if (activeTab === 'video') {
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('LIFETIME_QUOTA_EXCEEDED')) {
                setVideoError(errorMessage);
            } else {
                setVideoError(errorMessage);
            }
        } else {
            setError(errorMessage);
        }
    } finally {
        setIsLoading(false);
        setGeneratingVideoType(null);
    }
  };
    
    const handleConfirmCleanup = async (maskBase64: string) => {
        if (!imageToMask) return;
        const { index } = imageToMask;

        const imageUrl = currentTabResults.urls?.[index];
        if (!imageUrl) {
            console.error("Could not find image URL to clean up.");
            setIsMaskingModalOpen(false);
            setImageToMask(null);
            return;
        }

        setIsMaskingModalOpen(false);
        setIsCleaningImage(index);

        try {
            const originalFile = await dataURLtoFile(imageUrl, `cleanup_source.png`);
            const originalBase64 = await fileToBase64(originalFile);
            const originalImagePart = { base64ImageData: originalBase64, mimeType: originalFile.type };

            const maskImagePart = { base64ImageData: maskBase64, mimeType: 'image/png' };

            const resultUrls = await cleanImageWithMask(originalImagePart, maskImagePart);

            if (resultUrls.length > 0) {
                // Success: Update the image, the undo state remains valid
                const newUrls = [...(currentTabResults.urls || [])];
                newUrls[index] = resultUrls[0];
                setCurrentResults({ urls: newUrls, wasCreative: currentTabResults.wasCreative });
            } else {
                setError("AI không thể làm sạch ảnh. Vui lòng thử lại.");
                // Failure: Remove the undo state as the operation failed
                setOriginalCleanedUrls(prev => {
                    const newState = { ...prev };
                    delete newState[index];
                    return newState;
                });
            }
        } catch (err) {
            // Failure on exception: Remove the undo state and show error
            setOriginalCleanedUrls(prev => {
                const newState = { ...prev };
                delete newState[index];
                return newState;
            });
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
            setError(errorMessage);
        } finally {
            setIsCleaningImage(null);
            setImageToMask(null);
        }
    };
    
    const handleAutoCleanup = async (imageUrl: string, index: number) => {
        // Store the original URL for undo functionality.
        if (!originalCleanedUrls[index]) {
            setOriginalCleanedUrls(prev => ({ ...prev, [index]: imageUrl }));
        }

        setIsCleaningImage(index);

        try {
            const originalFile = await dataURLtoFile(imageUrl, `autoclean_source.png`);
            const originalBase64 = await fileToBase64(originalFile);
            const originalImagePart = { base64ImageData: originalBase64, mimeType: originalFile.type };

            const resultUrls = await cleanImageAutomatically(originalImagePart);

            if (resultUrls.length > 0) {
                const newUrls = [...(currentTabResults.urls || [])];
                newUrls[index] = resultUrls[0];
                setCurrentResults({ urls: newUrls, wasCreative: currentTabResults.wasCreative });
            } else {
                setError("AI không thể tự động làm sạch ảnh. Vui lòng thử lại hoặc dùng bút.");
                // Failure: Remove the undo state as the operation failed
                setOriginalCleanedUrls(prev => {
                    const newState = { ...prev };
                    delete newState[index];
                    return newState;
                });
            }
        } catch (err) {
            // Failure on exception: Remove the undo state and show error
            setOriginalCleanedUrls(prev => {
                const newState = { ...prev };
                delete newState[index];
                return newState;
            });
            const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.';
            setError(errorMessage);
        } finally {
            setIsCleaningImage(null);
        }
    };

    const cleanUpImage = (imageUrl: string, index: number) => {
        // Store the original URL for undo functionality.
        // This is done once when the user initiates the "clean" action.
        if (!originalCleanedUrls[index]) {
            setOriginalCleanedUrls(prev => ({ ...prev, [index]: imageUrl }));
        }
        setImageToMask({ url: imageUrl, index });
        setIsMaskingModalOpen(true);
    };

    const handleRestoreImage = (index: number) => {
        const originalUrl = originalCleanedUrls[index];
        if (!originalUrl || !currentTabResults.urls) return;

        const newUrls = [...currentTabResults.urls];
        newUrls[index] = originalUrl;
        setCurrentResults({ urls: newUrls, wasCreative: currentTabResults.wasCreative });

        // Remove from the undo state
        setOriginalCleanedUrls(prev => {
            const newState = { ...prev };
            delete newState[index];
            return newState;
        });
    };

    const handleDeleteImage = (indexToDelete: number) => {
        const currentUrls = currentTabResults.urls;
        if (!currentUrls) return;

        const newUrls = currentUrls.filter((_, index) => index !== indexToDelete);
        
        // Because filtering changes array indices, the safest way to prevent mismatches
        // in the 'undo' state is to clear it when an image is deleted.
        setOriginalCleanedUrls({}); 
        
        setCurrentResults({ urls: newUrls, wasCreative: currentTabResults.wasCreative });
    };

    const renderQuotaError = () => (
        <div className="p-4 sm:p-6 bg-red-900/40 border-2 border-red-500 rounded-lg text-left text-red-200 w-full max-w-lg mx-auto">
            <h4 className="text-xl font-bold text-center mb-3 text-red-200">{t('quotaErrorTitle')}</h4>
            <p className="text-base mb-4">{t('quotaErrorDesc')}</p>
            <div className="space-y-3 text-sm border-t border-red-700/50 pt-3">
                <p><strong className="font-bold text-amber-300">{t('quotaStep1')}</strong></p>
                <p>
                    <strong className="font-bold text-amber-300">{t('quotaStep2')}</strong>
                    <a 
                        href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 inline-block font-bold text-cyan-300 underline hover:text-cyan-200"
                    >
                        {t('quotaStep2Link')}
                    </a>
                </p>
                <p><strong className="font-bold text-amber-300">{t('quotaStep3')}</strong></p>
            </div>
        </div>
    );
    
    const renderResultsGrid = (urls: string[] | null, onDelete?: (index: number) => void) => {
        const isQuotaError = error && (error.includes('Hạn ngạch') || error.includes('RESOURCE_EXHAUSTED'));

        if (isLoading) {
            return <Loader t={t} message={loadingMessage} />;
        }
        if (isQuotaError) {
            return renderQuotaError();
        }
        if (error) {
            return <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg text-center text-red-200">{error}</div>;
        }
        if (!urls || urls.length === 0) {
            return <p className={currentTheme.secondaryTextColor}>{t('resultsHere')}</p>;
        }
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {urls.map((url, index) => (
                    <div key={index} className="relative group aspect-[3/4]">
                        <img src={url} alt={`Generated result ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 text-center">
                            <button onClick={() => { setImageViewerCurrentIndex(index); setIsImageViewerOpen(true); }} className="w-full bg-cyan-600/80 hover:bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all">
                                {t('view')}
                            </button>
                            <button onClick={() => handleDownloadImage(index)} className="w-full bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all">
                                {t('download')}
                            </button>
                            {(wasCreativeGeneration || ['style', 'extract', 'fold'].includes(activeTab)) && (
                                <button onClick={() => handleUseImageForTab(index, 'video')} className="w-full bg-green-600/80 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all">
                                    {t('createVideo')}
                                </button>
                            )}
                            {activeTab === 'style' && styleMode === 'model' && (
                                <button onClick={() => handleUseImageForTab(index, 'video', 'walk')} className="w-full bg-purple-600/80 hover:bg-purple-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all">
                                    {t('createWalkVideo')}
                                </button>
                            )}
                            {activeTab === 'style' && styleMode === 'ghost' && (
                                isCleaningImage === index ? (
                                    <div className="py-1.5"><Loader t={t} message={t('cleaning')} /></div>
                                ) : originalCleanedUrls[index] ? (
                                    <button onClick={() => handleRestoreImage(index)} className="w-full bg-orange-600/80 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all" title={t('restoreTooltip')}>{t('restore')}</button>
                                ) : (
                                    <div className="w-full space-y-1.5">
                                        <button onClick={() => handleAutoCleanup(url, index)} className="w-full bg-green-600/80 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded-md text-xs transition-all" title={t('autoCleanTooltip')}>{t('autoClean')}</button>
                                        <button onClick={() => cleanUpImage(url, index)} className="w-full bg-yellow-600/80 hover:bg-yellow-600 text-white font-bold py-1.5 px-3 rounded-md text-xs transition-all" title={t('manualCleanTooltip')}>{t('manualClean')}</button>
                                    </div>
                                )
                            )}
                             {onDelete && (
                                <button onClick={() => onDelete(index)} className="w-full bg-red-700/80 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all mt-auto">
                                    {t('deleteThisImage')}
                                </button>
                            )}
                        </div>
                         {activeTab === 'extract' && (
                             <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">{index === 0 ? t('frontView') : t('backView')}</div>
                         )}
                         {activeTab === 'fold' && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">{index === 0 ? t('topDownView') : t('perspectiveView')}</div>
                         )}
                    </div>
                ))}
            </div>
        );
    };

    // --- Ad Copy Resize Logic ---
    const handleAdCopyResizeMove = useCallback((e: MouseEvent) => {
        if (!resizingAdCopyRef.current) return;
        const { startX, startY, startWidth, startHeight } = resizingAdCopyRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setAdCopyResultSize({
            width: `${Math.max(400, startWidth + dx)}px`,
            height: `${Math.max(300, startHeight + dy)}px`,
        });
    }, []);

    const handleAdCopyResizeEnd = useCallback(() => {
        window.removeEventListener('mousemove', handleAdCopyResizeMove);
        window.removeEventListener('mouseup', handleAdCopyResizeEnd);
        resizingAdCopyRef.current = null;
    }, [handleAdCopyResizeMove]);

    const handleAdCopyResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!adCopyResultContainerRef.current) return;
        resizingAdCopyRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startWidth: adCopyResultContainerRef.current.offsetWidth,
            startHeight: adCopyResultContainerRef.current.offsetHeight,
        };
        window.addEventListener('mousemove', handleAdCopyResizeMove);
        window.addEventListener('mouseup', handleAdCopyResizeEnd);
    }, [handleAdCopyResizeMove, handleAdCopyResizeEnd]);
    
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleAdCopyResizeMove);
            window.removeEventListener('mouseup', handleAdCopyResizeEnd);
        };
    }, [handleAdCopyResizeMove, handleAdCopyResizeEnd]);
    // --- End Ad Copy Resize Logic ---

    if (!isAuthenticated) {
      return (
        <>
          <LoginScreen 
            onLoginSuccess={handleLoginSuccess} 
            subscriptionInfo={subscriptionInfo}
            onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
          />
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            onExtend={handleUpdateSubscription}
            onLogout={handleLogout}
          />
        </>
      );
    }

    if (isClosed) {
        return null;
    }

    if (isMinimized) {
        return (
            <div className="fixed bottom-4 right-4 z-[999]">
                <button
                    onClick={() => setIsMinimized(false)}
                    className="w-16 h-16 bg-red-800 rounded-full shadow-lg hover:bg-red-700 text-white flex items-center justify-center transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
                    aria-label={t('minimizeApp')}
                    title={t('minimizeApp')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
                    </svg>
                </button>
            </div>
        );
    }
    
    // Logic to determine which source pool to show in the uploader
    const isWalkModeSource = activeTab === 'video' && videoMode === 'walk' && modelResults && modelResults.length > 0;
    
    // Check if results exist for ghost and model
    const hasGhostResults = ghostMannequinResults && ghostMannequinResults.length > 0;
    const hasModelResults = modelResults && modelResults.length > 0;

    // Determine fallback logic: Use Ghost if available, otherwise fallback to Model (e.g., from Auto Model generation)
    let commonSourcePool: { urls: string[], selectedIndex: number } | null = null;
    let commonSourceType: 'ghost' | 'model' = 'ghost';

    if (hasGhostResults) {
        commonSourcePool = { urls: ghostMannequinResults!, selectedIndex: selectedSourceImageIndex };
        commonSourceType = 'ghost';
    } else if (hasModelResults) {
        commonSourcePool = { urls: modelResults!, selectedIndex: selectedModelSourceImageIndex };
        commonSourceType = 'model';
    }

    // For Walk Video, explicitly prefer model results if available (as it needs model images)
    const uploaderSourcePool = isWalkModeSource
        ? { urls: modelResults!, selectedIndex: selectedModelSourceImageIndex }
        : commonSourcePool;
    
    // For Walk Video, force 'model' type. Otherwise use the determined common type (ghost or model fallback)
    const uploaderSourceType = isWalkModeSource ? 'model' : commonSourceType;

  
  return (
    <div className={`min-h-screen ${currentTheme.textColor}`} style={{ background: currentTheme.gradient, transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}>
      <div className="">
        <Header 
          shopInfo={shopInfo} 
          onOpenShopInfoModal={() => setIsShopInfoModalOpen(true)}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          gradientStyle={gradientStyle}
          onMinimize={() => setIsMinimized(true)}
          onCloseApp={handleCloseApp}
          onZoom={handleZoom}
          zoomLevel={zoomLevel}
          isVisible={isHeaderVisible}
          onLogout={handleLogout}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
          t={t}
        />
        <main className="p-2 sm:p-6 pb-24">
          
          {/* Title and Description Section */}
          <div className="text-center mb-6">
              <h2 className={`text-2xl sm:text-3xl font-bold ${currentTheme.titleColor}`}>
                  {tabInfo[activeTab].title}
              </h2>
              <p className={`text-base sm:text-lg ${currentTheme.secondaryTextColor} mt-2 max-w-2xl mx-auto`}>
                  {tabInfo[activeTab].description}
              </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 flex justify-center px-2">
            <div className="flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6 gap-y-2 bg-[#530303]/40 p-4 rounded-xl border border-gray-800">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSetActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${activeTab === tab.id ? 'bg-red-600 text-white shadow-md tab-active-glow' : 'text-gray-300 hover:text-white'}`}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'style' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {/* Left Column: Controls */}
                      <div className="space-y-6 bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800">
                          {/* Mode Selector */}
                          <div className="flex justify-center">
                              <div className="flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-6 gap-y-2 bg-[#530303]/40 p-4 rounded-xl border border-gray-700">
                                  <button onClick={() => handleStyleModeChange('ghost')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${styleMode === 'ghost' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:text-white'}`}>{t('ghostMannequinMode')}</button>
                                  <button onClick={() => handleStyleModeChange('model')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${styleMode === 'model' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:text-white'}`}>{t('modelMode')}</button>
                                  <button onClick={() => handleStyleModeChange('creative')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${styleMode === 'creative' ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:text-white'}`}>{t('creativeMode')}</button>
                                  <button onClick={() => handleStyleModeChange('adcopy')} className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${styleMode === 'adcopy' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}>{t('adCopyMode')}</button>
                              </div>
                          </div>

                          {styleMode === 'ghost' && (
                              <>
                                  <div>
                                      <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('ghostUploadTitle')}</h3>
                                      <ImageUploader 
                                          onFilesChange={handleFilesChange}
                                          imageFiles={imageFiles}
                                          multiple 
                                          maxFiles={2}
                                          t={t}
                                      />
                                      <p className={`text-xs ${currentTheme.secondaryTextColor} mt-2`}>{t('ghostUploadTip')}</p>
                                  </div>
                                  <div>
                                      <h3 className={`text-lg font-semibold mb-3 ${currentTheme.headerTextColor}`}>{t('ghostOptionsTitle')}</h3>
                                      <div className="space-y-4">
                                          <div className="flex items-center gap-4">
                                              <label className="font-semibold">{t('ghostFormFactor')}</label>
                                              <div className="flex gap-2">
                                                  <button onClick={() => setGhostMannequinAge('adult')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${ghostMannequinAge === 'adult' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('ghostAdult')}</button>
                                                  <button onClick={() => setGhostMannequinAge('child')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${ghostMannequinAge === 'child' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('ghostChild')}</button>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <input type="checkbox" id="useAdvancedGhostPrompt" checked={useAdvancedGhostPrompt} onChange={(e) => setUseAdvancedGhostPrompt(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"/>
                                              <label htmlFor="useAdvancedGhostPrompt" className="font-semibold text-sm">{t('ghostAdvancedPrompt')}</label>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              <input type="checkbox" id="showMaterialUploader" checked={showMaterialUploader} onChange={(e) => setShowMaterialUploader(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"/>
                                              <label htmlFor="showMaterialUploader" className="font-semibold text-sm">{t('ghostUseMaterial')}</label>
                                          </div>
                                          {showMaterialUploader && (
                                              <div className="pl-6">
                                                  <ImageUploader 
                                                      onFilesChange={handleMaterialFileChange}
                                                      imageFiles={materialSampleFiles}
                                                      multiple 
                                                      maxFiles={2}
                                                      aspectRatioClass='aspect-square'
                                                      t={t}
                                                  />
                                              </div>
                                          )}
                                          <div>
                                              <label htmlFor="ghostMannequinAddon" className="font-semibold text-sm">{t('ghostCustomizations')}</label>
                                              <input
                                                  id="ghostMannequinAddon"
                                                  type="text"
                                                  value={ghostMannequinAddon}
                                                  onChange={(e) => setGhostMannequinAddon(e.target.value)}
                                                  placeholder={t('ghostCustomizationsPlaceholder')}
                                                  className="w-full p-2 mt-1 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                              />
                                          </div>
                                      </div>
                                  </div>
                              </>
                          )}
                          
                          {styleMode === 'model' && (
                              <>
                                  {!isAutoGenerateModelFromAccessory && (
                                      <div>
                                          <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('modelSourceTitle')}</h3>
                                          <ImageUploader 
                                              onFilesChange={handleFilesChange}
                                              imageFiles={imageFiles}
                                              sourceImagePool={commonSourcePool}
                                              onSourceImageSelect={(index) => handleSourceImageSelect(index, commonSourceType)}
                                              t={t}
                                          />
                                          {(!imageFile && !commonSourcePool) &&
                                              <p className={`text-xs ${currentTheme.secondaryTextColor} mt-2`}>{t('modelSourceTip')}</p>
                                          }
                                      </div>
                                  )}

                                  <div>
                                      <h3 className={`text-lg font-semibold mb-3 ${currentTheme.headerTextColor}`}>{t('modelOptionsTitle')}</h3>
                                      <div className="space-y-4">
                                          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                              <div>
                                                  <label className="font-semibold text-sm">{t('modelType')}</label>
                                                  <div className="flex gap-2 mt-1">
                                                      <button onClick={() => setModelAge('adult')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${modelAge === 'adult' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('ghostAdult')}</button>
                                                      <button onClick={() => setModelAge('child')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${modelAge === 'child' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('ghostChild')}</button>
                                                  </div>
                                              </div>
                                              <div>
                                                  <label className="font-semibold text-sm">{t('modelGender')}</label>
                                                  <div className="flex gap-2 mt-1">
                                                      <button onClick={() => setModelGender('male')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${modelGender === 'male' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('modelMale')}</button>
                                                      <button onClick={() => setModelGender('female')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${modelGender === 'female' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('modelFemale')}</button>
                                                  </div>
                                              </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                              <input
                                                  type="checkbox"
                                                  id="showFaceUploader"
                                                  checked={showFaceUploader}
                                                  onChange={(e) => {
                                                      setShowFaceUploader(e.target.checked);
                                                      if (e.target.checked) setGenerateDifferentFace(false);
                                                  }}
                                                  disabled={generateDifferentFace}
                                                  className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600 disabled:opacity-50"
                                              />
                                              <label htmlFor="showFaceUploader" className={`font-semibold text-sm transition-colors ${generateDifferentFace ? 'text-gray-500' : ''}`}>{t('modelUseFace')}</label>
                                          </div>
                                          {showFaceUploader && (
                                              <div className="pl-6">
                                                  <ImageUploader 
                                                      onFilesChange={handleFaceFileChange}
                                                      imageFiles={faceImageFile ? [faceImageFile] : []}
                                                      aspectRatioClass='aspect-square'
                                                      t={t}
                                                  />
                                              </div>
                                          )}

                                          <div className="flex items-center gap-2">
                                              <input
                                                  type="checkbox"
                                                  id="generateDifferentFace"
                                                  checked={generateDifferentFace}
                                                  onChange={(e) => {
                                                      setGenerateDifferentFace(e.target.checked);
                                                      if (e.target.checked) setShowFaceUploader(false);
                                                      if (e.target.checked) setIsAutoGenerateModelFromAccessory(false);
                                                  }}
                                                  disabled={showFaceUploader || isAutoGenerateModelFromAccessory}
                                                  className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600 disabled:opacity-50"
                                              />
                                              <label htmlFor="generateDifferentFace" className={`font-semibold text-sm transition-colors ${showFaceUploader || isAutoGenerateModelFromAccessory ? 'text-gray-500' : ''}`}>{t('modelNewFace')}</label>
                                          </div>
                                          
                                          <div className="flex flex-wrap items-center gap-2">
                                              <div className="flex items-center gap-2">
                                                  <input type="checkbox" id="showHeldProductUploader" checked={showHeldProductUploader} onChange={(e) => setShowHeldProductUploader(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"/>
                                                  <label htmlFor="showHeldProductUploader" className="font-semibold text-sm">{t('modelHoldProduct')}</label>
                                              </div>
                                              
                                              {/* NEW: Button to toggle auto model generation from accessory */}
                                              {showHeldProductUploader && (
                                                  <button 
                                                    onClick={() => setIsAutoGenerateModelFromAccessory(!isAutoGenerateModelFromAccessory)}
                                                    className={`ml-2 px-3 py-1 rounded text-xs font-bold border transition-colors ${
                                                        isAutoGenerateModelFromAccessory 
                                                        ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.7)]' 
                                                        : 'bg-transparent border-red-500 text-red-400 hover:bg-red-900/30'
                                                    }`}
                                                  >
                                                      {t('modelAutoFromProduct')}
                                                  </button>
                                              )}
                                          </div>
                                          
                                          {showHeldProductUploader && (
                                              <div className="pl-6 space-y-2">
                                                  <p className="text-xs text-cyan-300 italic">
                                                      {isAutoGenerateModelFromAccessory 
                                                        ? t('modelAutoFromProductTip')
                                                        : "Tải ảnh phụ kiện để người mẫu cầm thêm (ví dụ: túi xách, điện thoại...)"}
                                                  </p>
                                                  <ImageUploader 
                                                      onFilesChange={handleHeldProductFilesChange}
                                                      imageFiles={heldProductFiles}
                                                      multiple
                                                      maxFiles={2}
                                                      aspectRatioClass='aspect-square'
                                                      t={t}
                                                  />
                                              </div>
                                          )}

                                          <div className="flex items-center gap-2">
                                              <input type="checkbox" id="showBackdropSelection" checked={showBackdropSelection} onChange={(e) => setShowBackdropSelection(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"/>
                                              <label htmlFor="showBackdropSelection" className="font-semibold text-sm">{t('modelUseBackdrop')}</label>
                                          </div>
                                          
                                          {showBackdropSelection && (
                                              <div className="pl-6 space-y-3">
                                                  <button onClick={() => setIsModelBackdropSelectorCollapsed(!isModelBackdropSelectorCollapsed)} className="w-full text-left font-bold text-amber-400 flex justify-between items-center">
                                                      <span>{isModelBackdropSelectorCollapsed ? t('modelShowBackdropList') : t('modelHideBackdropList')}</span>
                                                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isModelBackdropSelectorCollapsed ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                  </button>
                                                  {!isModelBackdropSelectorCollapsed && (
                                                      <>
                                                          <div className="flex gap-2 border-b-2 border-gray-700 pb-2 mb-2">
                                                              <button onClick={() => setActiveBackdropTab('seasonal')} className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-300 border-2 ${activeBackdropTab === 'seasonal' ? 'text-cyan-300 sub-tab-active-glow' : 'text-gray-400 bg-gray-800/50 border-gray-700 hover:border-cyan-600 hover:text-cyan-300'}`}>{t('modelSeasonalEvents')}</button>
                                                              <button onClick={() => setActiveBackdropTab('advertising')} className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all duration-300 border-2 ${activeBackdropTab === 'advertising' ? 'text-cyan-300 sub-tab-active-glow' : 'text-gray-400 bg-gray-800/50 border-gray-700 hover:border-cyan-600 hover:text-cyan-300'}`}>{t('modelStudioAds')}</button>
                                                          </div>
                                                          <SeasonalChecklist 
                                                              promptsData={activeBackdropTab === 'seasonal' ? modelSeasonalPrompts : advertisingBackdropPrompts}
                                                              onPromptSelect={handleModelBackdropSelect}
                                                              selectedPrompt={modelCustomPrompt}
                                                              t={t}
                                                          />
                                                      </>
                                                  )}
                                              </div>
                                          )}

                                          <div>
                                              <div className="flex justify-between items-center mb-1">
                                                <label htmlFor="modelCustomPrompt" className="font-semibold text-sm">{t('modelCustomizations')}</label>
                                                <button
                                                    onClick={handleRewritePrompt}
                                                    disabled={isRewritingPrompt || isAutoGenerateModelFromAccessory} // Disable rewrite if auto model is on (no main image)
                                                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1 px-3 text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isRewritingPrompt ? t('modelRewriting') : t('modelRewritePrompt')}
                                                </button>
                                              </div>
                                              <textarea
                                                  id="modelCustomPrompt"
                                                  value={modelCustomPrompt}
                                                  onChange={(e) => setModelCustomPrompt(e.target.value)}
                                                  placeholder={t('modelCustomizationsPlaceholder')}
                                                  className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 h-20"
                                              />
                                          </div>
                                      </div>
                                  </div>
                              </>
                          )}

                          {styleMode === 'creative' && (
                              <>
                                  <div>
                                      <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('creativeUploadTitle')}</h3>
                                      <ImageUploader 
                                          onFilesChange={handleFilesChange}
                                          imageFiles={imageFiles}
                                          sourceImagePool={commonSourcePool}
                                          onSourceImageSelect={(index) => handleSourceImageSelect(index, commonSourceType)}
                                          t={t}
                                      />
                                      <p className={`text-xs ${currentTheme.secondaryTextColor} mt-2`}>{t('creativeUploadTip')}</p>
                                  </div>

                                  <div>
                                      <h3 className={`text-lg font-semibold mb-3 ${currentTheme.headerTextColor}`}>{t('creativeOptionsTitle')}</h3>
                                      <div className="space-y-4">
                                          <div>
                                              <label htmlFor="styleCreativeProductName" className="font-semibold text-sm">{t('creativeProductName')}</label>
                                              <input
                                                  id="styleCreativeProductName"
                                                  type="text"
                                                  value={styleCreativeProductName}
                                                  onChange={(e) => setStyleCreativeProductName(e.target.value)}
                                                  placeholder={t('creativeProductNamePlaceholder')}
                                                  className="w-full p-2 mt-1 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                              />
                                          </div>
                                          <div>
                                              <div className="flex justify-between items-center mb-2">
                                                  <button onClick={() => setIsStyleCreativeSelectorCollapsed(!isStyleCreativeSelectorCollapsed)} className="text-left font-bold text-amber-400 flex items-center gap-2">
                                                      <span>{isStyleCreativeSelectorCollapsed ? t('creativeShowIdeas') : t('creativeHideIdeas')}</span>
                                                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isStyleCreativeSelectorCollapsed ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                                  </button>
                                                  <button onClick={() => handleStyleCreativeSelect(creativeConceptPrompts[Math.floor(Math.random() * creativeConceptPrompts.length)])} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 text-xs rounded-full z-20">{t('creativeGetIdea')}</button>
                                              </div>
                                              {!isStyleCreativeSelectorCollapsed && (
                                                  <SeasonalChecklist 
                                                      promptsData={creativePromptsData}
                                                      onPromptSelect={handleStyleCreativeSelect}
                                                      selectedPrompt={styleCreativeBasePrompt}
                                                      t={t}
                                                  />
                                              )}
                                          </div>
                                          <div>
                                              <label htmlFor="styleCreativePrompt" className="font-semibold text-sm">{t('creativePrompt')}</label>
                                              <textarea
                                                  id="styleCreativePrompt"
                                                  value={styleCreativePrompt}
                                                  onChange={(e) => setStyleCreativePrompt(e.target.value)}
                                                  placeholder={t('creativePromptPlaceholder')}
                                                  className="w-full p-2 mt-1 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 h-24"
                                              />
                                          </div>
                                      </div>
                                  </div>
                              </>
                          )}
                          
                          {styleMode === 'adcopy' && (
                              <div className="space-y-6">
                                  <div>
                                      <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('adCopyUploadTitle')}</h3>
                                      <ImageUploader 
                                          onFilesChange={handleFilesChange}
                                          imageFiles={imageFiles}
                                          sourceImagePool={commonSourcePool}
                                          onSourceImageSelect={(index) => handleSourceImageSelect(index, commonSourceType)}
                                          t={t}
                                      />
                                      
                                      {/* Checkbox for Seasons */}
                                        <div className="mt-4 p-4 bg-[#530303]/40 border border-red-900/50 rounded-lg">
                                            <h4 className="text-sm font-bold text-amber-300 mb-3 uppercase tracking-wide">Chọn mùa vụ</h4>
                                            <div className="flex flex-col space-y-3">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${adCopySeasons.summer ? 'bg-red-600 border-red-600' : 'border-gray-500 group-hover:border-red-400'}`}>
                                                        {adCopySeasons.summer && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={adCopySeasons.summer} onChange={(e) => setAdCopySeasons(p => ({...p, summer: e.target.checked}))} />
                                                    <span className={`font-bold text-lg ${adCopySeasons.summer ? 'text-red-400' : 'text-gray-400 group-hover:text-gray-200'}`}>{t('seasonSummer')}</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${adCopySeasons.autumn ? 'bg-red-600 border-red-600' : 'border-gray-500 group-hover:border-red-400'}`}>
                                                        {adCopySeasons.autumn && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={adCopySeasons.autumn} onChange={(e) => setAdCopySeasons(p => ({...p, autumn: e.target.checked}))} />
                                                    <span className={`font-bold text-lg ${adCopySeasons.autumn ? 'text-red-400' : 'text-gray-400 group-hover:text-gray-200'}`}>{t('seasonAutumn')}</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${adCopySeasons.winter ? 'bg-red-600 border-red-600' : 'border-gray-500 group-hover:border-red-400'}`}>
                                                        {adCopySeasons.winter && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                    </div>
                                                    <input type="checkbox" className="hidden" checked={adCopySeasons.winter} onChange={(e) => setAdCopySeasons(p => ({...p, winter: e.target.checked}))} />
                                                    <span className={`font-bold text-lg ${adCopySeasons.winter ? 'text-red-400' : 'text-gray-400 group-hover:text-gray-200'}`}>{t('seasonWinter')}</span>
                                                </label>
                                            </div>
                                        </div>
                                  </div>
                                  <div>
                                      <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('adCopyInfoTitle')}</h3>
                                      <input
                                          type="text"
                                          value={adCopyUserInput}
                                          onChange={(e) => setAdCopyUserInput(e.target.value)}
                                          placeholder={t('adCopyInfoPlaceholder')}
                                          className="w-full p-3 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                      />
                                  </div>
                                  {(!shopInfo || !shopInfo.name || !shopInfo.hotline || !shopInfo.zalo) && (
                                      <p className={`text-sm ${currentTheme.secondaryTextColor}`}>{t('adCopyShopInfoTip')}</p>
                                  )}
                              </div>
                          )}
                          
                          {styleMode !== 'adcopy' && (
                              <div>
                                  <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('aspectRatio')}</h3>
                                  <div className="flex flex-wrap gap-2">
                                      {(["3:4", "1:1", "4:3", "9:16", "16:9"] as const).map(ratio => (
                                          <button 
                                            key={ratio} 
                                            onClick={() => setAspectRatio(ratio)} 
                                            className={`px-4 py-1.5 text-sm rounded-full ${aspectRatio === ratio ? 'bg-teal-500 font-bold' : 'bg-gray-700'}`}
                                            title={aspectRatioTooltips[ratio]}
                                          >
                                            {ratio}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}

                          <div className="mt-6">
                              <button
                                  onClick={handleGenerateClick}
                                  disabled={isGenerateButtonDisabled}
                                  className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              >
                                  {isLoading ? t('generating') : (styleMode === 'adcopy' ? t('adCopyMode') : t('generateImages'))}
                              </button>
                          </div>
                      </div>
                      {/* Right Column: Results */}
                      <div className="space-y-4">
                        {styleMode === 'adcopy' ? (
                              <div 
                                  className={`relative group bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800 transition-all duration-300 min-h-[50vh] sm:min-h-[600px] flex flex-col`}
                                  style={adCopyResultSize ? { width: adCopyResultSize.width, height: adCopyResultSize.height } : {}}
                                  ref={adCopyResultContainerRef}
                              >
                                  <h3 className={`text-xl font-bold mb-4 ${currentTheme.headerTextColor} flex-shrink-0`}>{t('adCopyResultTitle')}</h3>
                                  <div className="flex-grow flex flex-col">
                                  {(() => {
                                      const isQuotaError = adCopyError && (adCopyError.includes('Hạn ngạch') || adCopyError.includes('RESOURCE_EXHAUSTED'));
                                      if (isLoading) {
                                          return <div className="flex-grow flex items-center justify-center"><Loader t={t} message={t('adCopyLoading')} /></div>;
                                      }
                                      if (isQuotaError) {
                                          return <div className="flex-grow flex items-center justify-center">{renderQuotaError()}</div>;
                                      }
                                      if (adCopyError) {
                                          return <div className="flex-grow flex items-center justify-center p-4 bg-red-900/30 border border-red-500 rounded-lg text-center text-red-200">{adCopyError}</div>;
                                      }
                                      if (generatedAdCopy) {
                                          return (
                                              <div className="flex-grow flex flex-col">
                                                  <textarea
                                                      value={adCopyForEditing}
                                                      onChange={(e) => setAdCopyForEditing(e.target.value)}
                                                      className="w-full flex-grow p-3 bg-[#100303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 text-gray-200 text-sm leading-relaxed"
                                                  />
                                                  {generatedAdCopySources && generatedAdCopySources.length > 0 && (
                                                      <div className="mt-4 flex-shrink-0">
                                                          <h4 className="font-semibold text-sm text-amber-300">{t('adCopyResultSources')}</h4>
                                                          <ul className="list-disc list-inside text-xs text-gray-400 max-h-24 overflow-y-auto space-y-1 p-2 bg-black/20 rounded-md">
                                                              {generatedAdCopySources.map((source, index) => (
                                                                  <li key={index} className="truncate">
                                                                      <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-cyan-400 transition-colors" title={source.uri}>
                                                                          {source.title || new URL(source.uri).hostname}
                                                                      </a>
                                                                  </li>
                                                              ))}
                                                          </ul>
                                                      </div>
                                                  )}
                                                  {/* New Actions Row */}
                                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
                                                        <button
                                                            onClick={handleGenerateAudio}
                                                            disabled={isGeneratingAudio || isGeneratingAdImage}
                                                            className="font-semibold bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                                                        >
                                                            {isGeneratingAudio ? t('audioGenerating') : t('audioGenerate')}
                                                        </button>
                                                        <button
                                                            onClick={handleGenerateImageFromAd}
                                                            disabled={isGeneratingAudio || isGeneratingAdImage}
                                                            className="font-semibold bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                                                        >
                                                            {isGeneratingAdImage ? t('imageFromTextGenerating') : t('imageFromTextGenerate')}
                                                        </button>
                                                    </div>

                                                    {/* Audio Player and Download */}
                                                    {audioError && <p className="text-red-400 text-center mt-2 text-sm">{audioError}</p>}
                                                    {generatedAudioUrl && (
                                                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4 p-3 bg-black/20 rounded-lg">
                                                            <audio controls src={generatedAudioUrl} className="w-full sm:w-auto">
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                            <a
                                                                href={generatedAudioUrl}
                                                                download="quang-cao-san-pham.mp3"
                                                                className="font-semibold bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm flex-shrink-0"
                                                            >
                                                                {t('audioDownload')}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {adImageError && <p className="text-red-400 text-center mt-2 text-sm">{adImageError}</p>}
                                                  
                                                  <div className="flex items-center gap-4 mt-4 flex-shrink-0">
                                                      <button onClick={handleCopy} className="font-semibold bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg transition-colors text-sm">
                                                          {copyButtonText}
                                                      </button>
                                                      <button 
                                                          onClick={handleSpeakAdCopy} 
                                                          className={`font-semibold text-white py-2 px-4 rounded-lg transition-colors text-sm ${isSpeakingAdCopy ? 'bg-yellow-600 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'}`}
                                                      >
                                                          {isSpeakingAdCopy ? t('adCopyStop') : t('adCopySpeak')}
                                                      </button>
                                                  </div>
                                              </div>
                                          );
                                      }
                                      return (
                                          <div className="flex-grow flex items-center justify-center text-center p-4 bg-black/20 rounded-lg border-2 border-dashed border-gray-700">
                                              <p className="text-gray-400">{t('adCopyResultPlaceholder')}</p>
                                          </div>
                                      );
                                  })()}
                                  </div>
                                  <div className="resize-handle" onMouseDown={handleAdCopyResizeStart}></div>
                              </div>
                        ) : (
                          <div>
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-xl font-bold">{t('results')}</h3>
                                  {generatedImageUrls && generatedImageUrls.length > 0 && (
                                      <button
                                          onClick={handleDownloadAll}
                                          className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all"
                                      >
                                          {t('downloadAll')}
                                      </button>
                                  )}
                              </div>
                              <div className="bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800 min-h-[50vh] sm:min-h-[600px] flex items-center justify-center">
                                {renderResultsGrid(generatedImageUrls, (activeTab === 'style' && styleMode === 'ghost') ? handleDeleteImage : undefined)}
                              </div>
                          </div>
                        )}
                      </div>
                  </div>
            )}
            {activeTab === 'extract' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {/* Left Column: Controls */}
                      <div className="space-y-6 bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800">
                          <div>
                              <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('extractUploadTitle')}</h3>
                              <div className="w-1/2 mx-auto">
                                  <ImageUploader 
                                      onFilesChange={handleFilesChange}
                                      imageFiles={imageFiles} 
                                      largePreview 
                                      t={t}
                                  />
                              </div>
                          </div>
                          <div>
                              <h3 className={`text-lg font-semibold mb-3 ${currentTheme.headerTextColor}`}>{t('extractOptionsTitle')}</h3>
                              <div className="flex flex-wrap justify-center gap-2">
                                  <button onClick={() => setExtractSelection('set')} className={`px-4 py-2 text-sm rounded-full ${extractSelection === 'set' ? 'bg-teal-500 font-bold' : 'bg-gray-700'}`}>{t('extractWholeSet')}</button>
                                  <button onClick={() => setExtractSelection('shirt')} className={`px-4 py-2 text-sm rounded-full ${extractSelection === 'shirt' ? 'bg-teal-500 font-bold' : 'bg-gray-700'}`}>{t('extractShirtOnly')}</button>
                                  <button onClick={() => setExtractSelection('pants')} className={`px-4 py-2 text-sm rounded-full ${extractSelection === 'pants' ? 'bg-teal-500 font-bold' : 'bg-gray-700'}`}>{t('extractPantsOnly')}</button>
                              </div>
                          </div>
                          <div className="mt-6">
                              <button onClick={handleGenerateClick} disabled={isGenerateButtonDisabled} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                  {isLoading ? t('extracting') : t('extractButton')}
                              </button>
                          </div>
                      </div>
                      {/* Right Column: Results */}
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="text-xl font-bold">{t('results')}</h3>
                              {generatedImageUrls && generatedImageUrls.length > 0 && (
                                  <button
                                      onClick={handleDownloadAll}
                                      className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all"
                                  >
                                      {t('downloadAll')}
                                  </button>
                              )}
                          </div>
                          <div className="bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800 min-h-[50vh] sm:min-h-[600px] flex items-center justify-center">
                              {renderResultsGrid(generatedImageUrls)}
                          </div>
                      </div>
                  </div>
            )}

            {activeTab === 'fold' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {/* Left Column: Controls */}
                      <div className="space-y-6 bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800">
                          <div>
                              <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('foldUploadTitle')}</h3>
                              <div className="w-1/2 mx-auto">
                                  <ImageUploader 
                                      onFilesChange={handleFilesChange}
                                      imageFiles={imageFiles}
                                      sourceImagePool={commonSourcePool}
                                      onSourceImageSelect={(index) => handleSourceImageSelect(index, commonSourceType)}
                                      largePreview 
                                      t={t}
                                  />
                              </div>
                              {(!imageFile && !commonSourcePool) &&
                                  <p className={`text-xs ${currentTheme.secondaryTextColor} mt-2`}>{t('foldUploadTip')}</p>
                              }
                          </div>
                          <div className="mt-6">
                              <button onClick={handleGenerateClick} disabled={isGenerateButtonDisabled} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                  {isLoading ? t('folding') : t('foldButton')}
                              </button>
                          </div>
                      </div>
                      {/* Right Column: Results */}
                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                              <h3 className="text-xl font-bold">{t('results')}</h3>
                              {generatedImageUrls && generatedImageUrls.length > 0 && (
                                  <button
                                      onClick={handleDownloadAll}
                                      className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all"
                                  >
                                      {t('downloadAll')}
                                  </button>
                              )}
                          </div>
                          <div className="bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800 min-h-[50vh] sm:min-h-[600px] flex items-center justify-center">
                            {renderResultsGrid(generatedImageUrls)}
                          </div>
                      </div>
                  </div>
            )}

            {activeTab === 'video' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {/* Left Column: Controls */}
                      <div className="space-y-6 bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800">
                          <div className="flex justify-center">
                              <div className="flex flex-wrap justify-center gap-2 bg-gray-900/50 p-1.5 rounded-full border border-gray-700">
                                  <button onClick={() => { setVideoMode('360'); setIsVideoCreativeSelectorCollapsed(false); }} className={`px-3 py-2 text-xs font-bold rounded-full transition-colors ${videoMode === '360' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'}`}>{t('video360')}</button>
                                  <button onClick={() => { setVideoMode('creative'); setIsVideoCreativeSelectorCollapsed(false); }} className={`px-3 py-2 text-xs font-bold rounded-full transition-colors ${videoMode === 'creative' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'}`}>{t('videoCreative')}</button>
                                  <button onClick={() => { setVideoMode('walk'); setIsVideoCreativeSelectorCollapsed(false); }} className={`px-3 py-2 text-xs font-bold rounded-full transition-colors ${videoMode === 'walk' ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'}`}>{t('videoWalk')}</button>
                                  <a href="https://grok.com/imagine" target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-xs font-bold rounded-full transition-colors hover:bg-gray-700 text-gray-300 hover:text-white flex items-center gap-1">
                                      Tạo Video bằng Grok
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                  </a>
                              </div>
                          </div>

                          <div>
                              <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('videoSourceTitle')}</h3>
                              <div className="w-1/2 mx-auto">
                                  <ImageUploader 
                                      onFilesChange={handleFilesChange}
                                      imageFiles={imageFiles}
                                      sourceImagePool={uploaderSourcePool}
                                      onSourceImageSelect={(index) => handleSourceImageSelect(index, uploaderSourceType)}
                                      largePreview
                                      t={t}
                                  />
                              </div>
                              <p className={`text-xs ${currentTheme.secondaryTextColor} mt-2`}>
                                  {videoMode === 'walk' ? t('videoWalkSourceTip') : t('videoGenericSourceTip')}
                              </p>
                          </div>

                          {videoMode === '360' && (
                              <div>
                                  <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('video360Options')}</h3>
                                  <input
                                      type="text"
                                      value={video360CustomPrompt}
                                      onChange={(e) => setVideo360CustomPrompt(e.target.value)}
                                      placeholder={t('video360Placeholder')}
                                      className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                  />
                              </div>
                          )}

                          {videoMode === 'creative' && (
                              <div className="space-y-4">
                                  <h3 className={`text-lg font-semibold ${currentTheme.headerTextColor}`}>{t('videoCreativeOptions')}</h3>
                                  <div>
                                      <label htmlFor="videoCreativeProductName" className="font-semibold text-sm">{t('videoCreativeProductName')}</label>
                                      <input
                                          id="videoCreativeProductName"
                                          type="text"
                                          value={videoCreativeProductName}
                                          onChange={(e) => setVideoCreativeProductName(e.target.value)}
                                          placeholder={t('videoCreativeProductNamePlaceholder')}
                                          className="w-full p-2 mt-1 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400"
                                      />
                                  </div>
                                  <div>
                                      <div className="flex justify-between items-center mb-2">
                                          <button onClick={() => setIsVideoCreativeSelectorCollapsed(!isVideoCreativeSelectorCollapsed)} className="text-left font-semibold text-cyan-300 flex items-center gap-2">
                                              <span>{isVideoCreativeSelectorCollapsed ? t('videoShowIdeas') : t('videoHideIdeas')}</span>
                                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isVideoCreativeSelectorCollapsed ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                          </button>
                                          <button onClick={() => handleVideoCreativeSelect(videoCreativeConceptPrompts[Math.floor(Math.random() * videoCreativeConceptPrompts.length)])} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 text-xs rounded-full z-20">{t('videoGetIdea')}</button>
                                      </div>
                                      {!isVideoCreativeSelectorCollapsed && (
                                          <SeasonalChecklist 
                                              promptsData={[{ season: t('creativeGetIdea'), items: videoCreativeConceptPrompts.map((p:string) => ({ title: p.split(',')[0] || 'Concept', description: p.substring(0, 100) + '...', prompt: p})) }]}
                                              onPromptSelect={handleVideoCreativeSelect}
                                              selectedPrompt={videoCreativeBasePrompt}
                                              t={t}
                                          />
                                      )}
                                  </div>
                                  <div>
                                      <div className="flex justify-between items-center mb-1">
                                          <label htmlFor="videoCreativeCustomization" className="font-semibold text-sm">{t('videoCreativePrompt')}</label>
                                           <a
                                              href="https://chatgpt.com/g/g-68de44a5fd308191a64aa964d6eb0057-tro-ly-chuyen-ve-thoi-trang"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-sm font-semibold text-cyan-400 border border-cyan-500 rounded-md px-3 py-1 hover:bg-cyan-900/50 transition-colors"
                                          >
                                              {t('videoPromptHelper')}
                                          </a>
                                      </div>
                                      <textarea
                                          id="videoCreativeCustomization"
                                          value={videoCreativeCustomization}
                                          onChange={(e) => setVideoCreativeCustomization(e.target.value)}
                                          placeholder={t('videoCreativePromptPlaceholder')}
                                          className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 h-20"
                                      />
                                  </div>
                              </div>
                          )}
                          
                          {videoMode === 'walk' && (
                              <div className="space-y-4">
                                  <h3 className={`text-lg font-semibold ${currentTheme.headerTextColor}`}>{t('videoWalkOptions')}</h3>
                                  <div className="flex flex-wrap justify-center gap-2">
                                      <button onClick={() => setWalkType('child')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${walkType === 'child' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('videoWalkTypeChild')}</button>
                                      <button onClick={() => setWalkType('adult')} className={`px-4 py-2 text-base font-bold rounded-full transition-all text-amber-400 ${walkType === 'adult' ? 'bg-teal-500 button-active-glow' : 'bg-gray-700'}`}>{t('videoWalkTypeAdult')}</button>
                                  </div>
                                  {walkType && (
                                      <>
                                          <button onClick={() => setIsWalkSelectorCollapsed(!isWalkSelectorCollapsed)} className="w-full text-left font-semibold text-cyan-300 flex justify-between items-center">
                                              <span>{isWalkSelectorCollapsed ? t('videoWalkShowList') : t('videoWalkHideList')}</span>
                                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isWalkSelectorCollapsed ? 'rotate-0' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                          </button>
                                          {!isWalkSelectorCollapsed && (
                                              <SeasonalChecklist 
                                                  promptsData={walkType === 'child' ? childWalkPromptsData : adultWalkPromptsData}
                                                  onPromptSelect={handleWalkPromptSelect}
                                                  selectedPrompt={walkCustomization}
                                                  t={t}
                                              />
                                          )}
                                          <div>
                                                <div className="flex justify-between items-center mb-1">
                                                  <label htmlFor="walkCustomization" className="font-semibold text-sm">{t('videoWalkPrompt')}</label>
                                                  <a
                                                      href="https://chatgpt.com/g/g-68de44a5fd308191a64aa964d6eb0057-tro-ly-chuyen-ve-thoi-trang"
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-sm font-semibold text-cyan-400 border border-cyan-500 rounded-md px-3 py-1 hover:bg-cyan-900/50 transition-colors"
                                                  >
                                                      {t('videoPromptHelper')}
                                                  </a>
                                              </div>
                                              <textarea
                                                  id="walkCustomization"
                                                  value={walkCustomization}
                                                  onChange={(e) => setWalkCustomization(e.target.value)}
                                                  placeholder={t('videoWalkPromptPlaceholder')}
                                                  className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 h-20"
                                              />
                                          </div>
                                      </>
                                  )}
                              </div>
                          )}

                          <div>
                              <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('videoFormat')}</h3>
                              <div className="flex flex-wrap justify-center gap-2">
                                  <button onClick={() => setVideoOrientation('vertical')} className={`px-4 py-2 text-sm rounded-full ${videoOrientation === 'vertical' ? 'bg-teal-500 font-bold' : 'bg-gray-700'}`}>{t('videoVertical')}</button>
                                  <button onClick={() => setVideoOrientation('horizontal')} className={`px-4 py-2 text-sm rounded-full ${videoOrientation === 'horizontal' ? 'bg-teal-500 font-bold' : 'bg-gray-700'}`}>{t('videoHorizontal')}</button>
                              </div>
                          </div>
                          <div className="mt-6">
                              <button onClick={handleGenerateClick} disabled={isGenerateButtonDisabled} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                  {generatingVideoType ? `${t('videoCreating')} (${videoPollCount})...` : t('videoCreateButton')}
                              </button>
                          </div>
                      </div>
                      {/* Right Column: Results */}
                      <div className="bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800 min-h-[50vh] sm:min-h-[600px] flex items-center justify-center">
                          {generatingVideoType ? (
                              <div className="text-center">
                                  <Loader t={t} />
                                  <p className={`mt-4 ${currentTheme.secondaryTextColor} text-sm max-w-sm mx-auto`}>
                                      {videoPollCount > 0 ? `AI đang xử lý video (lần ${videoPollCount}). Quá trình này có thể mất vài phút. Vui lòng không đóng tab.` : 'Đang gửi yêu cầu tạo video...'}
                                  </p>
                              </div>
                          ) : videoError ? (
                               <div className="p-4 sm:p-6 bg-red-900/40 border-2 border-red-500 rounded-lg text-left text-red-200 w-full max-w-lg mx-auto">
                                  <h4 className="text-xl font-bold text-center mb-3 text-red-200">
                                      {videoError === "LIFETIME_QUOTA_EXCEEDED" ? t('videoLifetimeQuotaTitle') : t('quotaErrorTitle')}
                                  </h4>
                                  <p className="text-base mb-4">
                                      {videoError === "LIFETIME_QUOTA_EXCEEDED" ? t('videoLifetimeQuotaDesc') : videoError}
                                  </p>
                                  {videoError === "LIFETIME_QUOTA_EXCEEDED" && (
                                      <div className="space-y-3 text-sm border-t border-red-700/50 pt-3">
                                          <p className="font-bold text-amber-300">{t('videoLifetimeQuotaOptions')}</p>
                                          <p>
                                              <strong className="font-semibold text-amber-300">1. {t('videoLifetimeQuotaOption1')}</strong>
                                              <a
                                                  href="https://flow.veo3.net"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="ml-2 inline-block font-bold text-cyan-300 underline hover:text-cyan-200"
                                              >
                                                  {t('videoLifetimeQuotaOption1Link')}
                                              </a>
                                          </p>
                                           <p>
                                              <strong className="font-semibold text-amber-300">2. {t('videoLifetimeQuotaOption2')}</strong>
                                          </p>
                                      </div>
                                  )}
                              </div>
                          ) : generatedVideoUrl ? (
                              <div ref={videoContainerRef} className="relative w-full h-full flex flex-col items-center justify-center text-center">
                                  <h3 className="text-xl font-bold mb-4">{t('videoDone')}</h3>
                                  <div className="relative w-full max-w-md" style={videoPlayerSize ? {width: videoPlayerSize.width, height: videoPlayerSize.height} : {}}>
                                      <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg" />
                                  </div>
                                  <a href={generatedVideoUrl} download={`${collectionName || 'video'}.mp4`} className="mt-4 bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md text-base transition-all">
                                      {t('videoDownload')}
                                  </a>
                              </div>
                          ) : (
                              <p className={currentTheme.secondaryTextColor}>{t('resultsHere')}</p>
                          )}
                      </div>
                  </div>
            )}
             {activeTab === 'creative' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      {/* Left Column: Controls */}
                      <div className="space-y-6 bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800">
                           <div>
                              <h3 className={`text-lg font-semibold mb-2 ${currentTheme.headerTextColor}`}>{t('creativeBgUploadTitle')}</h3>
                              <div className="w-1/2 mx-auto">
                                  <ImageUploader 
                                      onFilesChange={handleFilesChange}
                                      imageFiles={imageFiles}
                                      sourceImagePool={commonSourcePool}
                                      onSourceImageSelect={(index) => handleSourceImageSelect(index, commonSourceType)}
                                      largePreview 
                                      t={t}
                                  />
                              </div>
                               {(!imageFile && !commonSourcePool) &&
                                  <p className={`text-xs ${currentTheme.secondaryTextColor} mt-2`}>{t('creativeBgUploadTip')}</p>
                              }
                              {imageFile && (
                                  <button
                                      onClick={handleRemoveWatermark}
                                      disabled={isLoading || !imageFile}
                                      className="mt-3 w-full py-2 px-4 bg-yellow-500 text-black hover:bg-yellow-400 font-bold rounded-lg transition-all uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                  >
                                      {t('removeWatermark')}
                                  </button>
                              )}
                          </div>
                           <div>
                               <h3 className={`text-lg font-semibold mb-3 ${currentTheme.headerTextColor}`}>{t('creativeBgOptionsTitle')}</h3>
                              <div className="grid grid-cols-2 gap-2">
                                  {effects.map(effect => (
                                      <button key={effect.id} onClick={() => setSelectedEffect(effect.id)} className={`p-3 text-left rounded-lg transition-all ${selectedEffect === effect.id ? 'bg-teal-600 ring-2 ring-teal-400' : 'bg-gray-800 hover:bg-gray-700'}`}>
                                          <p className="font-bold text-sm text-white">{effect.title}</p>
                                          <p className="text-xs text-gray-300 mt-1">{effect.description}</p>
                                      </button>
                                  ))}
                              </div>
                              {selectedEffect === 'custom' && (
                                  <div className="mt-4">
                                      <textarea
                                          value={customPrompt}
                                          onChange={e => setCustomPrompt(e.target.value)}
                                          placeholder="Ví dụ: đặt sản phẩm trên một tảng đá rêu phong trong khu rừng huyền ảo..."
                                          className="w-full p-2 bg-[#530303] border-2 border-[#a12c2c] rounded-lg focus:ring-2 focus:ring-red-400 h-24"
                                      />
                                  </div>
                              )}
                          </div>
                          <div className="mt-6">
                              <button onClick={handleGenerateClick} disabled={isGenerateButtonDisabled} className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                  {isLoading ? t('creativeBgCreating') : t('creativeBgCreateButton')}
                              </button>
                          </div>
                      </div>
                      {/* Right Column: Results */}
                      <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <h3 className="text-xl font-bold">{t('results')}</h3>
                              {generatedImageUrls && generatedImageUrls.length > 0 && (
                                  <button
                                      onClick={handleDownloadAll}
                                      className="bg-blue-600/80 hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-md text-sm transition-all"
                                  >
                                      {t('downloadAll')}
                                  </button>
                              )}
                          </div>
                          <div className="bg-[#530303]/30 p-4 sm:p-6 rounded-lg border border-gray-800 min-h-[50vh] sm:min-h-[600px] flex items-center justify-center">
                              {renderResultsGrid(generatedImageUrls)}
                          </div>
                      </div>
                  </div>
            )}
          </div>
        </main>

         {/* Modals and floating components */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-row items-center gap-2 sm:gap-4">
          <Assistant />
          <button
              onClick={() => setIsHelpModalOpen(true)}
              className="w-14 h-14 bg-amber-600 rounded-full shadow-lg hover:bg-amber-700 text-white flex items-center justify-center transform hover:-translate-y-1 transition-all duration-300 ease-in-out"
              aria-label="Mở trợ giúp"
              title="Mở hướng dẫn sử dụng"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
          </button>
          <ThemeSwitcher themes={themes} activeThemeId={activeTheme} onThemeChange={handleThemeChange} />
        </div>
        
        <ShopInfoModal 
          isOpen={isShopInfoModalOpen} 
          onSave={handleSaveShopInfo} 
          onClose={handleShopInfoModalClose}
          currentInfo={shopInfo}
          isInitialSetup={isShopInfoInitialSetup}
          onClear={handleClearShopInfo}
        />
        <ApiKeyManager 
          isOpen={isApiKeyModalOpen} 
          onClose={() => setIsApiKeyModalOpen(false)}
          onKeyChange={handleApiKeyChange}
        />
        <QuotaHelpModal
            isOpen={isQuotaHelpModalOpen}
            onClose={() => setIsQuotaHelpModalOpen(false)}
        />
        <Feedback
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
        />
        <HelpModal
            isOpen={isHelpModalOpen}
            onClose={() => setIsHelpModalOpen(false)}
            customAudioUrl={customAudioUrl}
            onOpenQuotaHelp={() => { setIsHelpModalOpen(false); setIsQuotaHelpModalOpen(true); }}
            onAudioChange={handleAudioUpdate}
            onOpenFeedbackModal={() => { setIsHelpModalOpen(false); setIsFeedbackModalOpen(true); }}
            onOpenCollectionNameModal={() => { setIsHelpModalOpen(false); setIsCollectionNameModalOpen(true); }}
            onOpenSubscriptionModal={() => { setIsHelpModalOpen(false); setIsSubscriptionModalOpen(true); }}
        />
        <CollectionNameModal
            isOpen={isCollectionNameModalOpen}
            onClose={() => setIsCollectionNameModalOpen(false)}
            onSave={handleSaveCollectionName}
            currentName={collectionName}
        />
        <ImageViewer 
            isOpen={isImageViewerOpen}
            onClose={() => setIsImageViewerOpen(false)}
            images={generatedImageUrls || []}
            currentIndex={imageViewerCurrentIndex}
            onNavigate={handleImageViewerNavigate}
            onDownload={handleDownloadImage}
            onGenerateVideo={(index) => handleUseImageForTab(index, 'video')}
            onGenerateWalkVideo={activeTab === 'style' && styleMode === 'model' ? (index) => handleUseImageForTab(index, 'video', 'walk') : undefined}
        />
        <MaskEditor
            isOpen={isMaskingModalOpen}
            onClose={() => { setIsMaskingModalOpen(false); setImageToMask(null); }}
            imageUrl={imageToMask?.url || null}
            onConfirm={handleConfirmCleanup}
        />
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onExtend={handleUpdateSubscription}
          onLogout={handleLogout}
        />
         {isAdImageModalOpen && generatedAdImageUrl && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[201] p-4" onClick={() => setIsAdImageModalOpen(false)}>
                <div className="bg-[#2a0000] p-4 rounded-2xl shadow-xl border-2 border-green-500/30 max-w-xl w-full flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold text-green-300 text-center">{t('imageFromTextResultTitle')}</h3>
                    <img src={generatedAdImageUrl} alt={t('imageFromTextResultAlt')} className="rounded-lg w-full object-contain max-h-[60vh]" />
                    <div className="flex justify-center gap-4">
                        <a
                            href={generatedAdImageUrl}
                            download="anh-quang-cao.png"
                            className="font-semibold bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
                        >
                            {t('download')}
                        </a>
                        <button onClick={() => setIsAdImageModalOpen(false)} className="font-semibold bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors">
                            {t('close')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
