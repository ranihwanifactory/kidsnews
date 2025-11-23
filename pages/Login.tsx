import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Newspaper, Mail, Lock, User, Loader2, Chrome } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error("이름을 입력해주세요.");
        await signupWithEmail(email, password, name);
      }
      history.push('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError("이메일이나 비밀번호가 올바르지 않습니다.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("이미 가입된 이메일입니다.");
      } else if (err.code === 'auth/weak-password') {
        setError("비밀번호는 6자리 이상이어야 합니다.");
      } else {
        setError("로그인/가입 중 오류가 발생했습니다: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      history.push('/');
    } catch (err: any) {
      setError("구글 로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border-t-4 border-primary">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-gray-900">
            {isLogin ? '어서오세요!' : '기자단에 합류하세요!'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin 
              ? '우리동네 어린이 신문에 오신 것을 환영합니다.' 
              : '이름과 이메일로 간편하게 가입하세요.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!isLogin && (
              <div className="relative mb-4">
                <label className="sr-only">이름</label>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="이름 (친구들이 부를 이름)"
                />
              </div>
            )}
            
            <div className="relative mb-4">
              <label className="sr-only">이메일 주소</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="이메일 주소"
              />
            </div>
            
            <div className="relative">
              <label className="sr-only">비밀번호</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="비밀번호 (6자리 이상)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition shadow-md"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? '로그인하기' : '가입하기')}
            </button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        <div>
           <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
          >
            <Chrome size={20} className="text-gray-600"/>
            Google 계정으로 계속하기
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {isLogin ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:text-indigo-500 ml-2"
            >
              {isLogin ? "회원가입" : "로그인"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;