import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Article, Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Share2, MessageCircle, Clock, Send, Loader2, Edit } from 'lucide-react';

// Helper function to extract YouTube ID
const getYoutubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchArticleAndComments = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Fetch Article
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as Article);
        } else {
           setError("기사를 찾을 수 없습니다.");
        }

        // 2. Fetch Comments
        // Note: Using client-side sorting to avoid requiring a composite index in Firestore (articleId + createdAt)
        const q = query(collection(db, "comments"), where("articleId", "==", id));
        const querySnapshot = await getDocs(q);
        const fetchedComments: Comment[] = [];
        querySnapshot.forEach((doc) => {
          fetchedComments.push({ id: doc.id, ...doc.data() } as Comment);
        });
        
        // Sort comments by newest first
        fetchedComments.sort((a, b) => b.createdAt - a.createdAt);
        
        setComments(fetchedComments);

      } catch (err) {
        console.error(err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndComments();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.summary,
        url: window.location.href,
      });
    } else {
      alert("링크가 복사되었습니다!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/edit/${id}`);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim() || !id || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const commentData: Omit<Comment, 'id'> = {
      articleId: id,
      userId: currentUser.uid,
      userName: currentUser.displayName || '익명',
      userPhoto: currentUser.photoURL,
      content: newComment,
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(db, "comments"), commentData);
      setComments([{ id: docRef.id, ...commentData }, ...comments]);
      setNewComment('');
    } catch (err: any) {
      console.error("Error adding comment:", err);
      if (err.code === 'permission-denied') {
        alert("댓글 작성 권한이 없습니다. Firebase Console의 Rules 설정을 확인해주세요.");
      } else {
        alert("댓글 작성에 실패했습니다: " + err.message);
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div></div>;
  if (error || !article) return <div className="p-10 text-center text-red-500">{error || "기사가 없습니다."}</div>;

  // Check update permission: Admin or Original Author (if reporter)
  const canEdit = currentUser && (currentUser.role === 'admin' || (currentUser.role === 'reporter' && currentUser.uid === article.authorId));
  const displayCategory = article.categoryName || article.category || "일반";
  const youtubeId = article.youtubeUrl ? getYoutubeVideoId(article.youtubeUrl) : null;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm overflow-hidden my-8">
      <div className="relative h-64 md:h-96">
        <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/800x600?text=No+Image')} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10 text-white">
          <span className="px-3 py-1 bg-secondary rounded-full text-sm font-bold mb-4 inline-block">{displayCategory}</span>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-2 leading-tight">{article.title}</h1>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold overflow-hidden">
                {article.authorName.charAt(0)}
             </div>
             <div>
               <p className="font-bold text-gray-900">{article.authorName} 기자</p>
               <p className="text-xs text-gray-500 flex items-center gap-1">
                 <Clock size={12} />
                 {new Date(article.createdAt).toLocaleDateString()}
               </p>
             </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button onClick={handleEdit} className="flex items-center gap-2 text-white bg-gray-800 hover:bg-gray-700 transition px-4 py-2 rounded-full">
                <Edit size={18} />
                <span className="text-sm font-medium">수정</span>
              </button>
            )}
            <button onClick={handleShare} className="flex items-center gap-2 text-gray-600 hover:text-primary transition bg-gray-50 px-4 py-2 rounded-full">
              <Share2 size={18} />
              <span className="text-sm font-medium">공유하기</span>
            </button>
          </div>
        </div>

        {/* YouTube Video Player */}
        {youtubeId && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <div className="relative pb-[56.25%] h-0">
              <iframe 
                src={`https://www.youtube.com/embed/${youtubeId}`} 
                title="YouTube video player" 
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="bg-gray-50 p-3 text-center text-xs text-gray-500">
              관련 영상 보기
            </div>
          </div>
        )}

        <div className="prose prose-lg prose-indigo max-w-none mb-12 text-gray-800 leading-relaxed">
           <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="text-primary" />
            댓글 <span className="text-primary">{comments.length}</span>
          </h3>

          {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-3">
                <img src={currentUser.photoURL || "https://picsum.photos/40/40"} className="w-10 h-10 rounded-full" alt="Me"/>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="친구에게 고운 말을 써주세요..."
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24 text-sm"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmittingComment}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingComment ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> 등록 중...
                        </>
                      ) : (
                        <>
                          등록 <Send size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg border border-gray-200 mb-6">
              <p className="text-gray-500 mb-2">댓글을 작성하려면 로그인이 필요해요.</p>
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <img src={comment.userPhoto || "https://picsum.photos/40/40"} className="w-10 h-10 rounded-full border border-gray-200" alt={comment.userName} />
                <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-gray-900">{comment.userName}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-gray-400 py-4 text-sm">아직 작성된 댓글이 없습니다. 첫 번째 댓글을 남겨주세요!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;
