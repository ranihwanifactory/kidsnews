import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid, PenTool, User, X, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';

const MobileNav: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cats: Category[] = [];
      snapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(cats);
    });

    return () => unsubscribe();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
            <span className="text-[10px] font-medium">홈</span>
          </Link>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isMenuOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Grid size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
            <span className="text-[10px] font-medium">메뉴</span>
          </button>

          {(currentUser?.role === 'admin' || currentUser?.role === 'reporter') && (
            <Link 
              to="/write" 
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/write') ? 'text-secondary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <PenTool size={24} strokeWidth={isActive('/write') ? 2.5 : 2} />
              <span className="text-[10px] font-medium">글쓰기</span>
            </Link>
          )}

          <Link 
            to={currentUser ? "/admin" : "/login"} // Redirect to admin or login based on auth
            onClick={(e) => {
               if(currentUser && currentUser.role !== 'admin') {
                 // If logged in but not admin, just stay/go home or handle profile logic ideally
                 // For now, let's treat the User tab as Profile/Login
                 e.preventDefault();
                 // Toggle a simple profile alert or navigate to a profile page if existed
                 if(window.confirm("로그아웃 하시겠습니까?")) {
                    handleLogout();
                 }
               }
            }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/login') || isActive('/admin') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {currentUser ? (
               <img src={currentUser.photoURL || ""} alt="Me" className="w-6 h-6 rounded-full border border-gray-300" />
            ) : (
               <User size={24} strokeWidth={isActive('/login') ? 2.5 : 2} />
            )}
            <span className="text-[10px] font-medium">{currentUser ? '내 정보' : '로그인'}</span>
          </Link>
        </div>
      </div>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          
          {/* Menu Sheet */}
          <div className="relative mt-auto bg-white rounded-t-2xl shadow-xl h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold font-serif text-gray-900">카테고리 & 메뉴</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">뉴스 카테고리</p>
              {categories.map((cat) => (
                <Link 
                  key={cat.id} 
                  to={`/category/${cat.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
                >
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              ))}

              <div className="my-6 border-t border-gray-100" />

              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">계정</p>
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl mb-4">
                     <img src={currentUser.photoURL || ""} className="w-10 h-10 rounded-full" alt="Profile" />
                     <div>
                       <p className="font-bold text-gray-900">{currentUser.displayName}</p>
                       <p className="text-xs text-gray-500">{currentUser.email}</p>
                     </div>
                  </div>
                  
                  {currentUser.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700">
                      <span className="font-medium">관리자 대시보드</span>
                    </Link>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">로그아웃</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center justify-center w-full p-4 bg-primary text-white font-bold rounded-xl shadow-md active:scale-[0.98] transition-transform"
                >
                  로그인 / 회원가입
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;