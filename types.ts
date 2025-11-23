export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'reporter' | 'reader';
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  content: string;
  createdAt: number; // Timestamp
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string; // HTML or Markdown content
  category: string;
  imageUrl: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  views: number;
  tags: string[];
}

export const ADMIN_EMAIL = "acehwan69@gmail.com";

export enum ArticleCategory {
  LOCAL_NEWS = "우리동네 소식",
  SCHOOL = "학교 이야기",
  CULTURE = "문화/행사",
  OPINION = "어린이 생각",
  SCIENCE = "과학/탐구",
}
