import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useHistory } from 'react-router-dom';
import { User, LogOut, PenTool, Shield, Newspaper } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';

const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const history = useHistory();

  // Fetch categories dynamically
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

  const handleLogout = async () => {
    await logout();
    history.push('/');
  };

  const handleLoginClick = () => {
    history.push('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 border-b-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20">
          <div className="flex items-center w-full justify-center md:justify-start">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <Newspaper className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <div className="flex flex-col items-center md:items-start">
                <span className="font-serif font-bold text-lg md:text-xl text-gray-900 tracking-tight">
                  우리동네 <span className="text-primary">어린이신문</span>
                </span>
                <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest hidden md:block">Kids Local News</span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">홈</Link>
            
            {/* Dynamic Categories */}
            {categories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/category/${cat.id}`} 
                className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
              >
                {cat.name}
              </Link>
            ))}
            
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
                  <div className="absolute right-0 w-48 mt-2 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
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
                onClick={handleLoginClick} 
                className="ml-4 flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
              >
                <User size={16} />
                로그인 / 가입
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;