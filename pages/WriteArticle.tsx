import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Category } from '../types';
import { generateArticleSummary, polishArticle } from '../services/geminiService';
import { Sparkles, PenLine, Image as ImageIcon, Save, AlertCircle, Loader2, ArrowLeft, Youtube } from 'lucide-react';

const WriteArticle: React.FC = () => {
  const { currentUser } = useAuth();
  const history = useHistory();
  const { id } = useParams<{ id: string }>(); // If id exists, it's edit mode
  
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/800/600');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, "categories"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        const fetchedCats: Category[] = [];
        snapshot.forEach(doc => fetchedCats.push({ id: doc.id, ...doc.data() } as Category));
        setCategories(fetchedCats);
        if (fetchedCats.length > 0 && !selectedCategoryId) {
           setSelectedCategoryId(fetchedCats[0].id);
        }
      } catch (e) {
        console.error("Error fetching categories", e);
      }
    };
    fetchCategories();
  }, []);

  // Fetch article data if in edit mode
  useEffect(() => {
    const fetchArticleForEdit = async () => {
      if (!id) return;
      setIsLoadingData(true);
      try {
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Permission check: Admin or Author
          if (currentUser?.role !== 'admin' && currentUser?.uid !== data.authorId) {
            alert("수정 권한이 없습니다.");
            history.push('/');
            return;
          }

          setTitle(data.title);
          // Prefer categoryId if exists, else match by name or default
          if (data.categoryId) {
            setSelectedCategoryId(data.categoryId);
          }
          setContent(data.content);
          setSummary(data.summary);
          setImageUrl(data.imageUrl);
          setYoutubeUrl(data.youtubeUrl || '');
        } else {
          alert("존재하지 않는 기사입니다.");
          history.push('/');
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        alert("기사 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (currentUser) {
      fetchArticleForEdit();
    }
  }, [id, currentUser, history]);

  // Initial Permission Check
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'reporter')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
          <PenLine size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">권한이 없습니다</h2>
        <p className="text-gray-600">기사 작성은 기자단만 가능해요. 관리자에게 문의해주세요.</p>
        <button onClick={() => history.push('/')} className="mt-6 text-primary underline">홈으로 돌아가기</button>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleAiSummary = async () => {
    if (!content) {
      alert("먼저 본문을 작성해주세요.");
      return;
    }
    setIsAiWorking(true);
    const aiSummary = await generateArticleSummary(content);
    setSummary(aiSummary);
    setIsAiWorking(false);
  };

  const handleAiPolish = async () => {
    if (!content) return;
    setIsAiWorking(true);
    const polished = await polishArticle(content);
    setContent(polished);
    setIsAiWorking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedCategoryId) {
       alert("카테고리를 선택해주세요. 카테고리가 없다면 관리자에게 요청하세요.");
       return;
    }

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const categoryName = selectedCategory ? selectedCategory.name : "일반";

    setIsSubmitting(true);
    try {
      if (id) {
        // Update existing article
        const docRef = doc(db, "articles", id);
        await updateDoc(docRef, {
          title,
          categoryId: selectedCategoryId,
          categoryName: categoryName,
          category: categoryName, // Backward compat
          content,
          summary,
          imageUrl,
          youtubeUrl,
          updatedAt: Date.now()
        });
        alert("기사가 수정되었습니다!");
      } else {
        // Create new article
        await addDoc(collection(db, "articles"), {
          title,
          categoryId: selectedCategoryId,
          categoryName: categoryName,
          category: categoryName, // Backward compat
          content,
          summary,
          imageUrl,
          youtubeUrl,
          authorId: currentUser.uid,
          authorName: currentUser.displayName || '기자',
          createdAt: Date.now(),
          views: 0,
          tags: []
        });
        alert("기사가 성공적으로 등록되었습니다!");
      }
      
      history.push(id ? `/article/${id}` : '/');
      
    } catch (error: any) {
      console.error("Error saving article: ", error);
      alert("오류가 발생했습니다: " + (error.message || "알 수 없는 오류"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
           <button onClick={() => history.goBack()} className="text-gray-500 hover:text-gray-700">
             <ArrowLeft />
           </button>
           <h1 className="text-3xl font-bold text-gray-900 font-serif">
             {id ? "기사 수정하기" : "기사 작성하기"}
           </h1>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {currentUser.displayName} 기자
        </span>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              어린이 친구들이 읽는 신문입니다. 고운 말을 사용하고 정확한 정보를 전달해주세요.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border text-lg font-bold"
                placeholder="기사 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              {categories.length > 0 ? (
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2 border"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ) : (
                <div className="text-red-500 text-sm border p-2 rounded bg-red-50">
                  등록된 카테고리가 없습니다. 관리자 대시보드에서 먼저 카테고리를 추가해주세요.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표 이미지 URL</label>
             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-full min-h-[150px] bg-gray-50 overflow-hidden relative">
               {imageUrl ? (
                 <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded absolute inset-0" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=No+Image')} />
               ) : (
                 <ImageIcon className="text-gray-400 mb-2" size={32} />
               )}
               <input 
                 type="text" 
                 value={imageUrl}
                 onChange={(e) => setImageUrl(e.target.value)}
                 className="w-full text-xs border p-1 rounded z-10 mt-auto bg-white/90"
                 placeholder="이미지 주소 (https://...)"
               />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유튜브 영상 링크 (선택)</label>
             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-full min-h-[150px] bg-gray-50 overflow-hidden relative">
                <Youtube className="text-red-500 mb-2" size={32} />
                <p className="text-xs text-gray-500 mb-2 text-center">기사 본문에 영상을 추가할 수 있어요.</p>
               <input 
                 type="text" 
                 value={youtubeUrl}
                 onChange={(e) => setYoutubeUrl(e.target.value)}
                 className="w-full text-xs border p-1 rounded mt-auto"
                 placeholder="https://youtube.com/watch?v=..."
               />
             </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">본문 내용 (HTML 지원)</label>
            <button 
              type="button" 
              onClick={handleAiPolish}
              disabled={isAiWorking || !content}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${isAiWorking ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            >
              {isAiWorking ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isAiWorking ? "AI 생각중..." : "AI 문장 다듬기"}
            </button>
          </div>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary p-4 border"
            placeholder="기사 내용을 작성하세요. HTML 태그를 사용할 수 있습니다."
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">요약 (목록에 표시될 짧은 내용)</label>
            <button 
               type="button"
               onClick={handleAiSummary}
               disabled={isAiWorking || !content}
               className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${isAiWorking ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              {isAiWorking ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isAiWorking ? "AI 요약중..." : "AI 자동 요약"}
            </button>
          </div>
          <textarea
            required
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary p-3 border"
            placeholder="기사의 핵심 내용을 1-2문장으로 요약해주세요."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => history.goBack()}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {id ? "수정 중..." : "발행 중..."}
              </>
            ) : (
              <>
                <Save size={18} />
                {id ? "기사 수정하기" : "기사 발행하기"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteArticle;