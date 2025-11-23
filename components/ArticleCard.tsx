import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../types';
import { Calendar, Eye } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, featured = false }) => {
  const date = new Date(article.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const displayCategory = article.categoryName || article.category || "일반";

  if (featured) {
    return (
      <div className="group relative overflow-hidden rounded-2xl shadow-lg h-full min-h-[400px] bg-gray-900">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 w-full">
          <span className="inline-block px-3 py-1 bg-secondary text-white text-xs font-bold rounded-full mb-3">
            {displayCategory}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3 leading-tight drop-shadow-md">
            <Link to={`/article/${article.id}`} className="hover:underline decoration-2 decoration-secondary underline-offset-4">
              {article.title}
            </Link>
          </h2>
          <p className="text-gray-200 mb-4 line-clamp-2 md:line-clamp-3 text-lg">
            {article.summary}
          </p>
          <div className="flex items-center text-gray-300 text-sm gap-4">
            <span>{article.authorName} 기자</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {date}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 flex flex-col h-full">
      <Link to={`/article/${article.id}`} className="relative h-48 overflow-hidden block">
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute top-3 left-3">
           <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold rounded-md shadow-sm">
            {displayCategory}
          </span>
        </div>
      </Link>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 font-serif leading-snug">
          <Link to={`/article/${article.id}`} className="hover:text-primary transition-colors">
            {article.title}
          </Link>
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
          {article.summary}
        </p>
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{article.authorName}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye size={12}/> {article.views}</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;