import React, { useEffect, useState } from 'react';
import { Article } from '../types';
import ArticleCard from '../components/ArticleCard';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// Mock data for when DB is empty
const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: '우리 학교 급식이 달라졌어요!',
    summary: '이번 학기부터 시작된 유기농 급식 프로젝트, 학생들의 반응이 뜨겁습니다. 맛도 좋고 건강도 챙기는 새로운 식단표를 공개합니다.',
    content: '<p>본문 내용...</p>',
    category: '학교 이야기',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    authorId: 'admin',
    authorName: '김철수',
    createdAt: Date.now(),
    views: 120,
    tags: ['급식', '건강']
  },
  {
    id: '2',
    title: '동네 도서관, 어린이 전용 공간 개관',
    summary: '조용히 책만 읽는 도서관은 가라! 누워서 보고, 이야기하며 보는 어린이들을 위한 꿈의 도서관이 우리 동네에 문을 열었습니다.',
    content: '<p>본문 내용...</p>',
    category: '우리동네 소식',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    authorId: 'admin',
    authorName: '이영희',
    createdAt: Date.now() - 10000000,
    views: 85,
    tags: ['도서관', '독서']
  },
  {
    id: '3',
    title: '주말 축구 교실 모집 안내',
    summary: '매주 토요일 아침, 친구들과 함께 땀 흘리며 축구를 배워보세요. 초보자도 환영합니다.',
    content: '<p>본문 내용...</p>',
    category: '문화/행사',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    authorId: 'admin',
    authorName: '박지성',
    createdAt: Date.now() - 20000000,
    views: 45,
    tags: ['스포츠', '축구']
  },
  {
    id: '4',
    title: '과학관 견학 보고서: 로봇을 만나다',
    summary: '지난주 다녀온 국립과학관 견학 후기. 춤추는 로봇부터 인공지능 체험까지, 미래의 과학자를 꿈꾸는 친구들의 이야기.',
    content: '<p>본문 내용...</p>',
    category: '과학/탐구',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    authorId: 'admin',
    authorName: '최과학',
    createdAt: Date.now() - 30000000,
    views: 200,
    tags: ['과학', '로봇']
  },
];

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedArticles: Article[] = [];
        querySnapshot.forEach((doc) => {
          fetchedArticles.push({ id: doc.id, ...doc.data() } as Article);
        });

        if (fetchedArticles.length === 0) {
          console.log("No articles found in DB, using mock data.");
          setArticles(MOCK_ARTICLES);
        } else {
          setArticles(fetchedArticles);
        }
      } catch (error) {
        console.error("Error fetching articles, check Firestore permissions:", error);
        setArticles(MOCK_ARTICLES);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const featuredArticle = articles[0];
  const standardArticles = articles.slice(1);

  return (
    <div className="space-y-12 animate-fade-in pb-12">
      {/* Hero Section */}
      {featuredArticle && (
        <section className="h-[500px] md:h-[600px] w-full">
          <ArticleCard article={featuredArticle} featured />
        </section>
      )}

      {/* Latest News Grid */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b-2 border-gray-100 pb-2">
          <h2 className="text-2xl font-bold text-gray-900 font-serif border-b-4 border-primary inline-block pb-2 -mb-3">
            최신 뉴스
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {standardArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
        {standardArticles.length === 0 && !featuredArticle && (
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