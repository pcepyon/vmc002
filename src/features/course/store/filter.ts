import { create } from 'zustand';
import type { DifficultyLevel, SortBy } from '../lib/dto';

interface CourseFilterStore {
  category: string | undefined;
  difficulty: DifficultyLevel | undefined;
  searchQuery: string;
  sortBy: SortBy;
  page: number;

  setCategory: (category: string | undefined) => void;
  setDifficulty: (level: DifficultyLevel | undefined) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortBy) => void;
  setPage: (page: number) => void;
  reset: () => void;

  // 전체 필터 객체 반환
  getFilters: () => {
    category?: string;
    difficulty?: DifficultyLevel;
    search?: string;
    sort: SortBy;
    page: number;
  };
}

export const useCourseFilterStore = create<CourseFilterStore>((set, get) => ({
  category: undefined,
  difficulty: undefined,
  searchQuery: '',
  sortBy: 'latest',
  page: 1,

  setCategory: (category) => set({ category, page: 1 }),
  setDifficulty: (difficulty) => set({ difficulty, page: 1 }),
  setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
  setSortBy: (sortBy) => set({ sortBy, page: 1 }),
  setPage: (page) => set({ page }),

  reset: () => set({
    category: undefined,
    difficulty: undefined,
    searchQuery: '',
    sortBy: 'latest',
    page: 1
  }),

  getFilters: () => {
    const state = get();
    return {
      ...(state.category && { category: state.category }),
      ...(state.difficulty && { difficulty: state.difficulty }),
      ...(state.searchQuery && { search: state.searchQuery }),
      sort: state.sortBy,
      page: state.page
    };
  }
}));