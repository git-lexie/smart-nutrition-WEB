"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    firstName: '', 
    middleName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); 

    if (!formData.firstName.trim()) {
      return setError('First name is required.');
    }

    if (!formData.lastName.trim()) {
      return setError('Last name is required.');
    }

    if (!validateEmail(formData.email)) {
      return setError('Please enter a valid email address.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (formData.password.length < 6) {
       return setError('Password must be at least 6 characters long.');
    }

    setIsLoading(true);

    try {
      const endpoint = '/api/auth/signup';
      console.log("Attempting to connect to:", endpoint); 
      
      await axios.post(endpoint, {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      router.push('/login');
    } catch (err: any) { 
      console.error("Signup Error Details:", err); 
      
      if (!err.response) {
        setError('Cannot connect to server. Ensure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Signup failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">Create Account</h1>
        
        {error && <div className="mb-4 text-red-500 bg-red-100 p-3 rounded-lg text-center text-sm font-bold border border-red-200">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* First Name & Last Name */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3 top-3.5 text-slate-400" size={20}/>
              <input 
                required 
                type="text" 
                placeholder="First Name" 
                className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition-all" 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
              />
            </div>
            <div className="relative flex-1">
              <User className="absolute left-3 top-3.5 text-slate-400" size={20}/>
              <input 
                required 
                type="text" 
                placeholder="Last Name" 
                className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition-all" 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
              />
            </div>
          </div>

          {/* Middle Name (optional) */}
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-slate-400" size={20}/>
            <input 
              type="text" 
              placeholder="Middle Name (optional)" 
              className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition-all" 
              value={formData.middleName} 
              onChange={e => setFormData({...formData, middleName: e.target.value})} 
            />
          </div>
          
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={20}/>
            <input 
              required 
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-10 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition-all" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          
          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={20}/>
            <input 
              required 
              type={showPass ? "text" : "password"} 
              placeholder="Password" 
              className="w-full pl-10 pr-10 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition-all" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button 
              type="button" 
              onClick={() => setShowPass(!showPass)} 
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>
          
          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={20}/>
            <input 
              required 
              type={showConfirmPass ? "text" : "password"} 
              placeholder="Confirm Password" 
              className="w-full pl-10 pr-10 p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white transition-all" 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPass(!showConfirmPass)} 
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showConfirmPass ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-md flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account? <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">Log in here</Link>
        </div>
      </div>
    </div>
  );
}