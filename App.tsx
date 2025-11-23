import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import WriteArticle from './pages/WriteArticle';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import InstallPWA from './components/InstallPWA';
import MobileNav from './components/MobileNav';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-paper flex flex-col font-sans">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:category" element={<Home />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/write" element={<WriteArticle />} />
              <Route path="/edit/:id" element={<WriteArticle />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <MobileNav />
          <InstallPWA />
          <footer className="bg-gray-800 text-white py-8 mt-12 mb-16 md:mb-0">
            <div className="container mx-auto px-4 text-center">
              <p className="text-lg font-serif font-bold mb-2">우리동네 어린이신문</p>
              <p className="text-sm text-gray-400">© 2024 Kids Local News. All rights reserved.</p>
              <p className="text-xs text-gray-500 mt-4">Admin Contact: acehwan69@gmail.com</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;