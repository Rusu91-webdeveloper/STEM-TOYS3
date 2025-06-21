export interface Language {
  id: string;
  name: string;
  code: string;
  bookId: string;
  isAvailable: boolean;
}

export interface Book {
  id: string;
  name: string;
  slug: string;
  author: string;
  description: string;
  price: number;
  coverImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
    author?: string;
    publisher?: string;
    publicationDate?: string;
    isbn?: string;
    pageCount?: number;
    language?: string[];
    category?: string;
    targetAudience?: string;
  };
  languages: Language[];
}
