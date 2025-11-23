import React, { useEffect, useState } from 'react';
import { Article, Category } from '../types';
import ArticleCard from '../components/ArticleCard';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams } from 'react-router-dom';

const Home: React.FC = () => {
  const { category } = useParams<{ category: string }>(); // This represents the category ID
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>('');

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setArticles([]);
      setCurrentCategoryName('');

      try {
        let q;
        let categoryName = '';

        if (category) {
          // If a category ID is present, fetch the category name first
          try {
            const catDoc = await getDoc(doc(db, "categories", category));
            if (catDoc.exists()) {
              categoryName = (catDoc.data() as Category).name;
            } else {
              // Fallback if category doc doesn't exist but URL has param
              categoryName = "카테고리"; 
            }
          } catch (e) {
            console.error("Error fetching category info:", e);
          }
          setCurrentCategoryName(categoryName);

          // Filter articles by categoryId
          // Note: Composite index might be needed for 'categoryId' + 'createdAt'.
          // For simplicity/robustness without index, we can just query by category and sort in memory if needed,
          // or try specific index query.
          // Let's try simple where clause.
          q = query(
            collection(db, "articles"), 
            where("categoryId", "==", category)
            // orderBy("createdAt", "desc") // Uncomment if composite index is created
          );
        } else {
          // Default home view
          q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(20));
        }

        const querySnapshot = await getDocs(q);
        let fetchedArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          fetchedArticles.push({ id: doc.id, ...doc.data() } as Article);
        });

        // Client-side sort if filtered by category (to avoid needing composite index immediately)
        if (category) {
          fetchedArticles.sort((a, b) => b.createdAt - a.createdAt);
        }

        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [category]);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  // If we are in a category view, just show grid
  // If home, show hero + grid
  const isHome = !category;
  const featuredArticle = isHome ? articles[0] : null;
  const standardArticles = isHome ? articles.slice(1) : articles;

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Category Title Header */}
      {category && (
         <div className="text-center py-8">
           <span className="text-primary text-sm font-bold uppercase tracking-wider">Category</span>
           <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mt-2">{currentCategoryName}</h1>
         </div>
      )}

      {/* Hero Section (Only on Home) */}
      {isHome && featuredArticle && (
        <section className="h-[500px] md:h-[600px] w-full">
          <ArticleCard article={featuredArticle} featured />
        </section>
      )}

      {/* Latest News Grid */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b-2 border-gray-100 pb-2">
          <h2 className="text-2xl font-bold text-gray-900 font-serif border-b-4 border-primary inline-block pb-2 -mb-3">
            {category ? `${currentCategoryName} 소식` : '최신 뉴스'}
          </h2>
        </div>
        
        {articles.length > 0 || (isHome && featuredArticle) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {standardArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
            ))}
            </div>
        ) : (
             <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">등록된 기사가 없습니다.</p>
             </div>
        )}
      </section>
      
      {/* Newsletter / Call to Action */}
      <section className="bg-accent/10 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">어린이 기자가 되어보세요!</h3>
          <p className="text-gray-700">우리 동네의 재미있는 소식을 직접 취재하고 기사로 써볼 수 있어요. 관리자에게 문의하세요.</p>
        </div>
        <a href={`mailto:acehwan69@gmail.com`} className="bg-accent text-white font-bold py-3 px-6 rounded-full hover:bg-teal-600 transition shadow-lg transform hover:-translate-y-1">
          기자단 신청하기
        </a>
      </section>
    </div>
  );
};

export default Home;