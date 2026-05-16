import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChainPrompt, DailyPrompt, PromptCategory, UsePromptsReturn, CustomPromptData } from '../types';
import { PromptCategoryType } from '../types/flare';
import { promptService } from '../services/promptService';

export const usePrompts = (): UsePromptsReturn => {
  const { user } = useAuth();
  const [dailyPrompts, setDailyPrompts] = useState<DailyPrompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [trendingPrompts, setTrendingPrompts] = useState<ChainPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all prompt data in parallel
      const [daily, cats, trending] = await Promise.all([
        promptService.getWeeklyPrompts(),
        promptService.getPromptCategories(),
        promptService.getTrendingPrompts(),
      ]);

      setDailyPrompts(daily);
      setCategories(cats);
      setTrendingPrompts(trending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prompts');
      console.error('Error loading prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCustomPrompt = async (
    title: string,
    description: string,
    category?: PromptCategoryType,
    tags: string[] = []
  ): Promise<CustomPromptData> => {
    try {
      if (!user?.id) {
        throw new Error('Please sign in to create a custom prompt');
      }

      const username = user.username || user.displayName || 'Anonymous';
      const newPrompt = await promptService.createCustomPrompt(
        title,
        description,
        user.id,
        username,
        category,
        tags,
      );

      // Add to trending prompts temporarily
      setTrendingPrompts(prev => [newPrompt, ...prev]);
      
      return newPrompt;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to create custom prompt';
      setError(error);
      throw new Error(error);
    }
  };

  const refreshPrompts = async (): Promise<void> => {
    await loadPrompts();
  };

  const getPromptsByCategory = async (category: PromptCategoryType): Promise<ChainPrompt[]> => {
    try {
      return await promptService.getPromptsByCategory(category);
    } catch (err) {
      console.error('Error loading category prompts:', err);
      return [];
    }
  };

  const getTodaysPrompt = async (): Promise<DailyPrompt | null> => {
    try {
      return await promptService.getTodaysPrompt();
    } catch (err) {
      console.error('Error loading today\'s prompt:', err);
      return null;
    }
  };

  const searchPrompts = async (query: string): Promise<ChainPrompt[]> => {
    try {
      return await promptService.searchPrompts(query);
    } catch (err) {
      console.error('Error searching prompts:', err);
      return [];
    }
  };

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  return {
    dailyPrompts,
    categories,
    trendingPrompts,
    loading,
    error,
    createCustomPrompt,
    refreshPrompts,
    // Additional helper functions
    getPromptsByCategory,
    getTodaysPrompt,
    searchPrompts,
  };
};
