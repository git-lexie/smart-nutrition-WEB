"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Eye, EyeOff, Lock, Mail, Sun, Moon, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useTheme } from "next-themes";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = Request OTP, 2 = Verify OTP & Reset
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });

  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = () => {
    setIsModalOpen(true);
    setModalStep(1);
    setRecoveryEmail(formData.email || ''); 
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMessage({ text: '', isError: false });
  };

  const closeResetModal = () => {
    setIsModalOpen(false);
  };

  const triggerToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  // API Call: Sends 6-digit OTP token via backend route
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      return setStatusMessage({ text: "Please enter your email address.", isError: true });
    }

    setModalLoading(true);
    setStatusMessage({ text: '', isError: false });
    try {
      await axios.post('/api/auth/forgot-password', { email: recoveryEmail });
      setStatusMessage({ text: "A 6-digit verification code has been sent to your email.", isError: false });
      setModalStep(2); 
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to send reset code.";
      setStatusMessage({ text: errorMsg, isError: true });
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword || !confirmPassword) {
      return setStatusMessage({ text: "Please fill in all inputs.", isError: true });
    }
    if (newPassword !== confirmPassword) {
      return setStatusMessage({ text: "Passwords do not match!", isError: true });
    }

    setModalLoading(true);
    setStatusMessage({ text: '', isError: false });
    try {
      await axios.post('/api/auth/reset-password', {
        email: recoveryEmail,
        otpCode,
        newPassword
      });
      
      closeResetModal();
      triggerToast("Password updated successfully! You can now log in.");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Invalid or expired code.";
      setStatusMessage({ text: errorMsg, isError: true });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative transition-colors duration-300">
      
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-40"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 z-10">
        <div className="bg-emerald-600 p-6 text-center text-white">
          <h1 className="text-3xl font-bold tracking-tight">SmartNutri</h1>
          <p className="text-emerald-100 text-sm mt-1">Login to your AI Coach</p>
        </div>
        <div className="p-8">
          {error && <div className="mb-4 text-red-500 text-center text-sm bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2 rounded-xl font-medium">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
              <input type="email" placeholder="Email" required className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900 dark:text-white transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-500" size={20} />
              <input type={showPassword ? "text" : "password"} placeholder="Password" required className="w-full pl-10 pr-10 p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 dark:bg-slate-900 dark:text-white transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-semibold text-emerald-500 dark:text-emerald-400 hover:underline outline-none"
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.99] transition-all shadow-md shadow-emerald-600/10">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm dark:text-slate-400">
            No account? <Link href="/signup" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Sign up</Link>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between">
              <h3 className="text-md font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <KeyRound size={18} className="text-emerald-500" /> Security Reset
              </h3>
              <button 
                type="button"
                onClick={closeResetModal}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>

            {statusMessage.text && (
              <div className={`p-3 rounded-xl text-xs text-center border font-medium ${
                statusMessage.isError 
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400' 
                  : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                {statusMessage.text}
              </div>
            )}

            {modalStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Enter your recovery email</label>
                  <div className="relative flex items-center">
                    <Mail size={16} className="absolute left-3 text-slate-400 dark:text-slate-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="name@example.com" 
                      value={recoveryEmail}
                      onChange={e => setRecoveryEmail(e.target.value)}
                      className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" 
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                >
                  {modalLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">6-Digit Verification Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    required
                    placeholder="123456" 
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white tracking-widest text-center font-bold text-md outline-none focus:ring-2 focus:ring-emerald-500/20" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900 rounded-xl text-slate-800 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" 
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 shadow-md shadow-emerald-600/10 mt-2"
                >
                  {modalLoading ? "Saving Changes..." : "Confirm & Save Password"}
                </button>

                <div className="flex flex-col items-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Didn't receive the verification code?</span>
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={handleRequestOtp}
                    className="text-xs font-bold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1 disabled:opacity-50 outline-none"
                  >
                    <RefreshCw size={11} className={modalLoading ? 'animate-spin' : ''} /> Resend OTP Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xl font-semibold text-sm border border-slate-800 dark:border-slate-100">
            <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-600" />
            {toast.message}
          </div>
        </div>
      )}

    </div>
  );
}