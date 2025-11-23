import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArticleCategory } from '../types';
import { generateArticleSummary, polishArticle } from '../services/geminiService';
import { Sparkles, PenLine, Image as ImageIcon, Save } from 'lucide-react';

const WriteArticle: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(ArticleCategory.LOCAL_NEWS);
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [imageUrl, setImageUrl] = useState('https://picsum.photos/800/600');
  
  const [isAiWorking, setIsAiWorking] = useState(false);

  // Check permission
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'reporter')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
          <PenLine size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">권한이 없습니다</h2>
        <p className="text-gray-600">기사 작성은 기자단만 가능해요. 관리자에게 문의해주세요.</p>
        <button onClick={() => navigate('/')} className="mt-6 text-primary underline">홈으로 돌아가기</button>
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
    try {
      await addDoc(collection(db, "articles"), {
        title,
        category,
        content, // In a real app, sanitize this or use a rich text editor output
        summary,
        imageUrl,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || '기자',
        createdAt: Date.now(),
        views: 0,
        tags: []
      });
      alert("기사가 성공적으로 등록되었습니다!");
      navigate('/');
    } catch (error) {
      console.error("Error adding article: ", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-serif">기사 작성하기</h1>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {currentUser.displayName} 기자
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary p-2 border"
              >
                {Object.values(ArticleCategory).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표 이미지 URL</label>
             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-full min-h-[150px] bg-gray-50">
               {imageUrl ? (
                 <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded mb-2" />
               ) : (
                 <ImageIcon className="text-gray-400 mb-2" size={32} />
               )}
               <input 
                 type="text" 
                 value={imageUrl}
                 onChange={(e) => setImageUrl(e.target.value)}
                 className="w-full text-xs border p-1 rounded"
                 placeholder="이미지 주소 (https://...)"
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
              disabled={isAiWorking}
              className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
            >
              <Sparkles size={12} />
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
               disabled={isAiWorking}
               className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition"
            >
              <Sparkles size={12} />
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
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"
          >
            <Save size={18} />
            기사 발행하기
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteArticle;