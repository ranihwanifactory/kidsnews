import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc, query, orderBy, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Article, ADMIN_EMAIL, Category } from '../types';
import { Trash2, ShieldAlert, Users, Newspaper, UserCheck, UserX, Edit, List, Plus } from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'reporter' | 'reader';
  createdAt?: number;
}

const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'users' | 'categories'>('articles');

  useEffect(() => {
    if (currentUser && currentUser.email !== ADMIN_EMAIL) {
       navigate('/');
       return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Articles
        const articlesQ = query(collection(db, "articles"), orderBy("createdAt", "desc"));
        const articlesSnap = await getDocs(articlesQ);
        const fetchedArticles: Article[] = [];
        articlesSnap.forEach((doc) => {
          fetchedArticles.push({ id: doc.id, ...doc.data() } as Article);
        });
        setArticles(fetchedArticles);

        // Fetch Users
        const usersQ = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const usersSnap = await getDocs(usersQ);
        const fetchedUsers: UserData[] = [];
        usersSnap.forEach((doc) => {
          fetchedUsers.push({ ...doc.data() } as UserData);
        });
        setUsers(fetchedUsers);

        // Fetch Categories
        const catsQ = query(collection(db, "categories"), orderBy("createdAt", "asc"));
        const catsSnap = await getDocs(catsQ);
        const fetchedCats: Category[] = [];
        catsSnap.forEach((doc) => {
           fetchedCats.push({ id: doc.id, ...doc.data() } as Category);
        });
        setCategories(fetchedCats);

      } catch (error) {
        console.error("Error fetching data for admin:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, navigate]);

  const handleDeleteArticle = async (articleId: string) => {
    if (window.confirm("정말로 이 기사를 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(db, "articles", articleId));
        setArticles(articles.filter(a => a.id !== articleId));
      } catch (error: any) {
        console.error("Error deleting:", error);
        alert("삭제 실패: " + error.message);
      }
    }
  };

  const handleEditArticle = (articleId: string) => {
    navigate(`/edit/${articleId}`);
  };

  const handleToggleReporter = async (user: UserData) => {
    if (user.email === ADMIN_EMAIL) {
      alert("관리자 권한은 변경할 수 없습니다.");
      return;
    }

    const newRole = user.role === 'reporter' ? 'reader' : 'reporter';
    const actionText = newRole === 'reporter' ? "기자 권한을 부여하시겠습니까?" : "기자 권한을 해제하시겠습니까?";

    if (window.confirm(`${user.displayName}님에게 ${actionText}`)) {
      try {
        await updateDoc(doc(db, "users", user.uid), { role: newRole });
        setUsers(users.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
      } catch (error: any) {
        alert("권한 변경 실패: " + error.message);
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newCategoryName.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategoryName,
        createdAt: Date.now()
      });
      setCategories([...categories, { id: docRef.id, name: newCategoryName, createdAt: Date.now() }]);
      setNewCategoryName('');
      alert("카테고리가 추가되었습니다.");
    } catch (error: any) {
      alert("카테고리 추가 실패: " + error.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if(window.confirm("이 카테고리를 삭제하시겠습니까? 해당 카테고리에 속한 기사는 분류되지 않음 상태가 될 수 있습니다.")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        setCategories(categories.filter(c => c.id !== id));
      } catch (error: any) {
        alert("카테고리 삭제 실패: " + error.message);
      }
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border-l-4 border-red-500">
        <div className="flex items-center gap-4">
           <div className="bg-red-100 p-3 rounded-full text-red-600">
             <ShieldAlert size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
             <p className="text-gray-600">현재 접속자: {currentUser.email}</p>
           </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'articles' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Newspaper size={18} /> 기사 관리
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'users' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={18} /> 회원 관리
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === 'categories' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <List size={18} /> 카테고리 관리
        </button>
      </div>

      {activeTab === 'articles' && (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-fade-in">
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
                        {article.categoryName || article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEditArticle(article.id)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                          <Edit size={16} /> 수정
                        </button>
                        <button onClick={() => handleDeleteArticle(article.id)} className="text-red-600 hover:text-red-900 flex items-center gap-1">
                          <Trash2 size={16} /> 삭제
                        </button>
                      </div>
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
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold">회원 목록 ({users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회원 정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">현재 권한</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">권한 관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full" src={user.photoURL || "https://picsum.photos/40/40"} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.email === ADMIN_EMAIL ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
                          관리자 (Admin)
                        </span>
                      ) : user.role === 'reporter' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          기자 (Reporter)
                        </span>
                      ) : (
                         <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          일반 회원 (Reader)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.email !== ADMIN_EMAIL && (
                        <button 
                          onClick={() => handleToggleReporter(user)}
                          className={`flex items-center justify-end gap-1 w-full ${user.role === 'reporter' ? 'text-red-500 hover:text-red-700' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          {user.role === 'reporter' ? (
                            <>
                               <UserX size={16} /> 권한 해제
                            </>
                          ) : (
                            <>
                               <UserCheck size={16} /> 기자 임명
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-1 bg-white rounded-xl shadow p-6">
             <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
               <Plus size={20} className="text-primary"/> 새 카테고리 추가
             </h3>
             <form onSubmit={handleAddCategory} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 이름</label>
                 <input 
                   type="text" 
                   value={newCategoryName}
                   onChange={(e) => setNewCategoryName(e.target.value)}
                   className="w-full border-gray-300 rounded-lg p-3 shadow-sm focus:ring-primary focus:border-primary border"
                   placeholder="예: 학교 급식 소식"
                   required
                 />
               </div>
               <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
                 추가하기
               </button>
             </form>
           </div>
           
           <div className="lg:col-span-2 bg-white rounded-xl shadow overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold">카테고리 목록</h3>
             </div>
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                         {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                          title="삭제"
                        >
                          <Trash2 size={18}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        등록된 카테고리가 없습니다. 왼쪽에서 추가해주세요.
                      </td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;