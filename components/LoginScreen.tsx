import React, { useState, useMemo } from 'react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  subscriptionInfo: {
      daysRemaining: number;
      isExpired: boolean;
      showRenewalNotice: boolean;
  };
  onOpenSubscriptionModal: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, subscriptionInfo, onOpenSubscriptionModal }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || subscriptionInfo.isExpired) return;
    
    const currentMonth = new Date().getMonth() + 1;
    let validPasswords: string[] = [];

    // The logic below creates passwords based on the current month.
    // Example for T10 (October, month 10 - even): T101, T103, T105, T107, T109, T1011
    // Example for T11 (November, month 11 - odd): T112, T114, T116, T118, T1112
    // This is a simple time-based logic.
    if (currentMonth % 2 === 0) { // Even month
      const oddSuffixes = ['1', '3', '5', '7', '9', '11'];
      // A more complex password could be created by adding random numbers, e.g., T10 + (33 or 35)
      // For now, we stick to the simpler logic.
      const dynamicSuffixes = Array.from({length: 2}, () => Math.floor(Math.random() * 6) * 2 + 1).map(String); // e.g. [3, 5]
      validPasswords = [...oddSuffixes, ...dynamicSuffixes].map(suffix => `T${currentMonth}${suffix}`);

    } else { // Odd month
      const evenSuffixes = ['2', '4', '6', '8', '10', '12'];
      const dynamicSuffixes = Array.from({length: 2}, () => Math.floor(Math.random() * 6) * 2 + 2).map(String); // e.g. [4, 8]
      validPasswords = [...evenSuffixes, ...dynamicSuffixes].map(suffix => `T${currentMonth}${suffix}`);
    }

    // This logic covers the case where the user asked for "T1033 or T1035"
    const randomTwoDigits = Array.from({length: 4}, () => Math.floor(Math.random() * 90) + 10).map(String);
    randomTwoDigits.forEach(rd => {
        validPasswords.push(`T${currentMonth}${rd}`);
    });
    

    if (validPasswords.includes(password.trim())) {
      setError('');
      setLoginAttempts(0);
      onLoginSuccess();
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      setPassword('');

      if (newAttempts >= 3) {
        const zaloLink = 'https://id.zalo.me/account?continue=http%3A%2F%2Fzalo.me%2F84988771339';
        setError(
          <>
            Bạn đã nhập sai mật khẩu quá 3 lần. 
            <br />
            Vui lòng liên hệ tác giả qua{' '}
            <a href={zaloLink} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-red-300">
              Zalo
            </a>.
          </>
        );
        setIsLocked(true);
      } else {
        setError('Mật khẩu không đúng. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#100303] text-gray-200">
      <div className="w-full max-w-sm p-8 space-y-6 bg-[#530303]/30 rounded-2xl shadow-2xl border border-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300">
            FashionStudio AI
          </h1>
          {/* --- Consolidated Status Block --- */}
          <div className="mt-4">
            {subscriptionInfo.isExpired ? (
                <div className="p-3 bg-red-900/50 border border-red-600 rounded-lg space-y-2 text-center">
                    <p className="font-bold text-red-300 text-lg">Ứng dụng đã bị khóa</p>
                    <div className="text-red-300 text-sm">
                        <p>
                            Gói của bạn đã hết hạn. Vui lòng liên hệ hotline <b className="text-white">0988771339</b> hoặc chuyển khoản để gia hạn tự động:
                        </p>
                        <div className="text-left bg-black/20 p-2 rounded-md mt-2 inline-block">
                             <p>STK: <b className="text-white">0988771339</b></p>
                             <p>Ngân hàng: <b className="text-white">MBbank</b></p>
                             <p>Chủ TK: <b className="text-white">Nguyễn Viết Thoan</b></p>
                        </div>
                        <div className="text-left mt-2 space-y-1">
                            <p className="font-semibold">- Gói 1 năm: <b className="text-white">1.000.000đ</b></p>
                            <p className="font-semibold">- Gói 2 năm: <b className="text-white">1.800.000đ</b> (Tiết kiệm 200.000đ)</p>
                        </div>
                    </div>
                    <button
                        onClick={onOpenSubscriptionModal}
                        className="!mt-4 w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                        Gia Hạn Bằng Mật Khẩu
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="text-center text-sm text-cyan-300 p-2 bg-cyan-900/30 rounded-lg">
                        <p>Số ngày sử dụng còn lại: <span className="font-bold text-lg">{subscriptionInfo.daysRemaining} ngày</span></p>
                    </div>
                    {subscriptionInfo.showRenewalNotice && (
                        <div className="p-3 bg-amber-900/50 border border-amber-500 rounded-lg text-center">
                            <p className="font-bold text-amber-200">Gói của bạn sắp hết hạn!</p>
                            <div className="text-amber-200 mt-2 text-sm space-y-1">
                                <p>Để tiếp tục sử dụng, vui lòng gia hạn bằng cách chuyển khoản tới:</p>
                                <p>STK: <b className="text-white">0988771339</b> (MBbank - Nguyễn Viết Thoan)</p>
                                <div className="!mt-2 font-semibold">
                                    <p>- Gói 1 năm: <b className="text-white">1.000.000đ</b></p>
                                    <p>- Gói 2 năm: <b className="text-white">1.800.000đ</b> (Tiết kiệm 200.000đ)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#100303] border-2 border-[#a12c2c] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition disabled:opacity-50"
              placeholder="Vui lòng nhập mật khẩu"
              autoFocus
              disabled={isLocked || subscriptionInfo.isExpired}
            />
          </div>
          
          {error && <div className="text-center text-red-400 text-sm !mt-4">{error}</div>}
          
          <div className="!mt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLocked || subscriptionInfo.isExpired}
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};