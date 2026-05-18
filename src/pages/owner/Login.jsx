import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Store, Eye, EyeOff } from 'lucide-react';
import { useOwner } from '../../context/OwnerContext';
import toast from 'react-hot-toast';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const { login } = useOwner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Welcome!');
      navigate('/owner', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6B35] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
            <Store className="text-white" size={30} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Restaurant Owner</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to manage your restaurant</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email" autoFocus
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35] transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Password"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FF6B35] pr-12 transition-colors"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#FF6B35] active:bg-[#e55a2b] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-200 disabled:opacity-60 transition-colors">
            <LogIn size={18} />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Use credentials from your Super Admin
        </p>
      </div>
    </div>
  );
};

export default OwnerLogin;
