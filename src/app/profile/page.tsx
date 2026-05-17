"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Save, LogOut, Volume2, Sun, Moon, KeyRound, RefreshCw } from 'lucide-react'; 
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const router = useRouter();
  
  const [data, setData] = useState<any>({
    name: '',
    email: '',
    age: '',
    height: '',
    weight: '',
    gender: 'Other',
    activityLevel: 'Sedentary (office job)',
    goal: 'Maintenance',
    voiceGender: 'female' 
  });
  
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Change Password States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Verify & Reset
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [modalLoading, setModalLoading] = useState(false);
  
  const [statusMessage, setStatusMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    
    if (!t || !userString) {
      return router.push('/login');
    }
    
    const u = JSON.parse(userString);
    setToken(t);
    
    setData({
      name: u.name || '',
      email: u.email || '',
      age: u.profile?.age || '',
      height: u.profile?.height || '',
      weight: u.profile?.weight || '',
      gender: u.profile?.gender || 'Other',
      activityLevel: u.profile?.activityLevel || 'Sedentary (office job)',
      goal: u.profile?.goal || 'Maintenance',
      voiceGender: u.profile?.voiceGender || 'female' 
    });
  }, [router]);

  const closeResetModal = () => {
    setIsModalOpen(false);
    setStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMessage({ text: '', isError: false });
  };

  const handleUpdate = async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const response = await axios.put('/api/users/profile', data, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (response.data.success) {
        const oldUserData = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { 
          ...oldUserData, 
          profile: { 
            ...oldUserData.profile, 
            ...data,
            isProfileComplete: true 
          } 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        const utterance = new SpeechSynthesisUtterance("Profile settings updated.");
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          data.voiceGender === 'male' 
            ? (v.name.includes('Male') || v.name.includes('David')) 
            : (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);

        alert("Profile updated successfully!");
        router.push('/'); 
      }
    } catch (error: any) {
      console.error("Update failed:", error);
      const msg = error.response?.data?.message || "Failed to save profile.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Request OTP Email Handler
  const handleRequestOtp = async () => {
    setModalLoading(true);
    setStatusMessage({ text: '', isError: false });
    try {
      await axios.post('/api/auth/forgot-password', { email: data.email });
      setStatusMessage({ text: "A 6-digit verification code has been sent to your email.", isError: false });
      setStep(2); 
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to send reset code.";
      setStatusMessage({ text: errorMsg, isError: true });
    } finally {
      setModalLoading(false);
    }
  };

  // Verify OTP and Reset Password Handler
  const handleResetPassword = async () => {
    if (!otpCode || !newPassword || !confirmPassword) {
      return setStatusMessage({ text: "Please fill in all input verification fields.", isError: true });
    }
    
    if (newPassword !== confirmPassword) {
      return setStatusMessage({ text: "Passwords do not match!", isError: true });
    }

    setModalLoading(true);
    setStatusMessage({ text: '', isError: false });
    try {
      await axios.post('/api/auth/reset-password', {
        email: data.email,
        otpCode,
        newPassword
      });
      
      alert("Password updated successfully!");
      closeResetModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Invalid or expired code.";
      setStatusMessage({ text: errorMsg, isError: true });
    } finally {
      setModalLoading(false);
    }
  };

  const goals = ['Weight Loss', 'Maintenance', 'Muscle Gain'];
  const genders = ['Male', 'Female', 'Other'];
  const activityLevels = [
    'Sedentary (office job)',
    'Light Exercise (1-2 days/week)',
    'Moderate Exercise (3-5 days/week)',
    'Heavy Exercise (6-7 days/week)',
    'Athlete (2x per day)'
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-300 relative">
      
      {mounted && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors z-50"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      )}

      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full dark:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold dark:text-white">Account Settings</h1>
          <div className="w-10"></div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Account Info</label>
            <input value={data.name} disabled className="w-full p-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed border-none" />
            <p className="text-xs text-slate-400 ml-1">{data.email}</p>
            
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-2 ml-1"
            >
              <KeyRound size={12} /> Change Password
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-emerald-500 uppercase ml-1 flex items-center gap-1">
               <Volume2 size={12} /> AI Coach Voice
            </label>
            <div className="flex gap-2">
              {['Male', 'Female'].map((v) => (
                 <button
                   key={v}
                   type="button"
                   onClick={() => setData({ ...data, voiceGender: v.toLowerCase() })}
                   className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                     data.voiceGender === v.toLowerCase()
                     ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                     : 'border-slate-200 dark:border-slate-700 dark:text-slate-300'
                   }`}
                 >
                   {v}
                 </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Age</label>
              <input type="number" value={data.age} onChange={e => setData({...data, age: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Height (cm)</label>
              <input type="number" value={data.height} onChange={e => setData({...data, height: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Weight (kg)</label>
              <input type="number" value={data.weight} onChange={e => setData({...data, weight: e.target.value})} className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Gender</label>
            <div className="flex gap-2">
              {genders.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setData({ ...data, gender: g })}
                  className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                    data.gender === g 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : 'border-slate-200 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Activity Level</label>
            <select
              value={data.activityLevel}
              onChange={e => setData({ ...data, activityLevel: e.target.value })}
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {activityLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fitness Goal</label>
            <div className="space-y-2">
              {goals.map((g) => (
                <label key={g} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${data.goal === g ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                  <input 
                    type="radio" 
                    name="goal" 
                    checked={data.goal === g} 
                    onChange={() => setData({ ...data, goal: g })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-3 text-sm dark:text-white font-medium">{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <button 
              onClick={handleUpdate} 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={20}/> {loading ? "Updating..." : "Save Changes"}
            </button>
            
            <button 
              onClick={() => { localStorage.clear(); router.push('/login'); }} 
              className="w-full text-red-500 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">NutriAI Security</h3>
              <button 
                onClick={closeResetModal}
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {statusMessage.text && (
              <div className={`p-3 rounded-xl text-xs text-center border font-medium ${
                statusMessage.isError 
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400' 
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
              }`}>
                {statusMessage.text}
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We will send a 6-digit verification code to <span className="font-semibold text-slate-700 dark:text-slate-200">{data.email}</span>.
                </p>
                <button
                  onClick={handleRequestOtp}
                  disabled={modalLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {modalLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">6-Digit Code</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    placeholder="123456" 
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white tracking-widest text-center font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={modalLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {modalLoading ? "Updating..." : "Confirm & Save Password"}
                </button>

                <div className="flex flex-col items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400">Didn't receive the verification code?</span>
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={handleRequestOtp}
                    className="text-xs font-bold text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={modalLoading ? 'animate-spin' : ''} /> Resend OTP String
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}