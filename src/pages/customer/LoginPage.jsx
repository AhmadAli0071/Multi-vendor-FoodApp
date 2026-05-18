import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { restaurant, login } = useCustomer();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const primaryColor = restaurant?.primary_color || '#D81B60';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome!');
      navigate(`/r/${slug}`);
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="px-5 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg mb-4" style={{ backgroundColor: primaryColor }}>
          {restaurant?.logo && (restaurant.logo.startsWith('data:image') || restaurant.logo.startsWith('http')) ? (
            <img src={restaurant.logo} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <span className="text-3xl">{restaurant?.logo || '🍔'}</span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-gray-800">Welcome Back</h1>
        <p className="text-sm text-gray-400 mt-1">Login to {restaurant?.name || 'order food'}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email" className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:bg-white focus:border-pink-300 transition-all" required />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password" className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:bg-white focus:border-pink-300 transition-all" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          style={{ backgroundColor: primaryColor }}>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <LogIn size={18} />
          )}
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Don't have an account?{' '}
        <Link to={`/r/${slug}/signup`} className="font-bold" style={{ color: primaryColor }}>Sign Up</Link>
      </p>
    </div>
  );
};

export default LoginPage;
