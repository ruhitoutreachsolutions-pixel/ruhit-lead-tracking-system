import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginView: React.FC = () => {
  const { login, isCloudConnected } = useAuth();

  const [identifier, setIdentifier] = useState('ruhit111');
  const [password, setPassword] = useState('Babor@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillMasterCredentials = () => {
    setIdentifier('ruhit111');
    setPassword('Babor@123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#07090E] flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-[#00C2FF] selection:text-black">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00C2FF]/10 to-[#00E5A0]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Login Box */}
      <div className="w-full max-w-md bg-[#0D121F] border border-[#1E3A5F] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#00C2FF]/20 to-[#00E5A0]/20 border border-[#00C2FF]/40 text-[#00C2FF] mb-2 shadow-lg">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Ruhit Lead Tracking
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Outreach Solutions & Production CRM Portal
          </p>
        </div>

        {/* Cloud Status Indicator */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#111827] border border-[#1E3A5F]/60 rounded-xl text-xs">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-[#00E5A0] animate-pulse' : 'bg-[#00C2FF]'}`} />
            <span className="text-[#94A3B8]">
              {isCloudConnected ? 'Cloud Sync Active (Supabase)' : 'Local Offline Engine Ready'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#00C2FF] bg-[#1E3A5F]/40 px-2 py-0.5 rounded border border-[#00C2FF]/20">
            v2.4 Pro
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl flex items-start space-x-2.5 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="block text-[#94A3B8] font-semibold">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ruhit111"
                required
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:border-[#00C2FF] transition-all font-medium text-xs placeholder-[#475569]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[#94A3B8] font-semibold">
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748B]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#111827] text-white border border-[#1E3A5F] rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-[#00C2FF] transition-all font-mono text-xs placeholder-[#475569]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#94A3B8]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-[#00C2FF] to-[#00E5A0] hover:opacity-95 text-black font-bold rounded-xl transition-all shadow-lg shadow-[#00C2FF]/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Master Account Quick Access */}
        <div className="pt-2 border-t border-[#1E3A5F]/60">
          <div className="p-3 bg-[#111827]/70 border border-[#1E3A5F]/50 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00E5A0]" />
                Owner / Master Account
              </span>
              <button
                type="button"
                onClick={fillMasterCredentials}
                className="text-[10px] text-[#00C2FF] hover:underline font-bold"
              >
                Autofill
              </button>
            </div>
            <p className="text-[11px] text-[#64748B] font-mono">
              Username: <span className="text-white font-semibold">ruhit111</span> &bull; Pass: <span className="text-white font-semibold">Babor@123</span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-[#475569]">
        &copy; {new Date().getFullYear()} Ruhit Outreach Solutions (ROS). High-Performance Cloud CRM.
      </div>
    </div>
  );
};
