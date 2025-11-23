import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, PenTool, Shield, Newspaper } from 'lucide-react';

const Navbar: React.FC = () => {
  const { currentUser, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <Newspaper className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl text-gray-900 tracking-tight">
                  우리동네 <span className="text-primary">어린이신문</span>
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Kids Local News</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">홈</Link>
            <Link to="/category/local" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">우리동네 소식</Link>
            <Link to="/category/school" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">학교 이야기</Link>
            
            {currentUser ? (
              <div className="flex items-center gap-3 ml-4">
                {/* Role based actions */}
                {(currentUser.role === 'admin' || currentUser.role === 'reporter') && (
                  <Link to="/write" className="flex items-center gap-1 bg-secondary text-white px-3 py-2 rounded-full text-sm font-bold hover:bg-amber-600 transition">
                    <PenTool size={16} />
                    기사 쓰기
                  </Link>
                )}
                
                {currentUser.role === 'admin' && (
                   <Link to="/admin" className="flex items-center gap-1 bg-gray-800 text-white px-3 py-2 rounded-full text-sm font-bold hover:bg-gray-700 transition">
                   <Shield size={16} />
                   관리자
                 </Link>
                )}

                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-700 focus:outline-none">
                    <img 
                      src={currentUser.photoURL || "https://picsum.photos/40/40"} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full border border-gray-300"
                    />
                    <span className="text-sm font-semibold">{currentUser.displayName}</span>
                  </button>
                  <div className="absolute right-0 w-48 mt-2 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={login} 
                className="ml-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
              >
                <User size={16} />
                로그인 / 가입
              </button>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">홈</Link>
            <Link to="/category/local" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">우리동네 소식</Link>
            <Link to="/category/school" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50">학교 이야기</Link>
            
            {currentUser ? (
              <>
                 {(currentUser.role === 'admin' || currentUser.role === 'reporter') && (
                  <Link to="/write" className="block px-3 py-2 rounded-md text-base font-medium text-secondary hover:bg-amber-50">기사 쓰기</Link>
                 )}
                 {currentUser.role === 'admin' && (
                  <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 hover:bg-gray-100">관리자 메뉴</Link>
                 )}
                <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">로그아웃</button>
              </>
            ) : (
              <button onClick={login} className="w-full text-left block px-3 py-2 rounded-md text-base font-bold text-primary hover:bg-indigo-50">로그인</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;