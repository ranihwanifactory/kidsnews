import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Article, ADMIN_EMAIL } from '../types';
import { Trash2, ShieldAlert } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && currentUser.email !== ADMIN_EMAIL) {
       navigate('/');
       return;
    }

    const fetchArticles = async () => {
      try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          fetchedArticles.push({ id: doc.id, ...doc.data() } as Article);
        });
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching for admin:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [currentUser, navigate]);

  const handleDelete = async (articleId: string) => {
    if (window.confirm("정말로 이 기사를 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "articles", articleId));
        setArticles(articles.filter(a => a.id !== articleId));
      } catch (error) {
        console.error("Error deleting:", error);
        alert("삭제 실패");
      }
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null; // Or redirect handled in useEffect
  }

  if (loading) return <div className="p-10">Loading Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border-l-4 border-red-500">
        <div className="flex items-center gap-4">
           <div className="bg-red-100 p-3 rounded-full text-red-600">
             <ShieldAlert size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
             <p className="text-gray-600">기사 관리 및 기자단 권한 관리 ({ADMIN_EMAIL})</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">전체 기사 목록 ({articles.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{article.authorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDelete(article.id)} className="text-red-600 hover:text-red-900 flex items-center justify-end gap-1 w-full">
                      <Trash2 size={16} /> 삭제
                    </button>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-6 py-4 text-center text-gray-500">등록된 기사가 없습니다.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;