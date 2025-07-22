import { useState, useEffect, useCallback } from 'react';
import { FlareChain, ChainPrompt, UseFlareChainReturn } from '../types';
import { flareChainService } from '../services/flareChainService';

export const useFlareChains = (userId?: string): UseFlareChainReturn => {
  const [activeChains, setActiveChains] = useState<FlareChain[]>([]);
  const [completedChains, setCompletedChains] = useState<FlareChain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's chains
  const loadChains = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load active and completed chains in parallel
      const [active, completed] = await Promise.all([
        flareChainService.getActiveChains(userId),
        flareChainService.getChainHistory(userId),
      ]);

      setActiveChains(active);
      setCompletedChains(completed);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chains';
      setError(errorMessage);
      console.error('Error loading chains:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create a new chain
  const createChain = async (
    prompt: ChainPrompt, 
    participants: string[],
    firstPhotoUri?: string
  ): Promise<FlareChain> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      const newChain = await flareChainService.createChain(
        prompt,
        participants,
        8, // maxParticipants
        userId,
        firstPhotoUri
      );

      // Add to active chains
      setActiveChains(prev => [newChain, ...prev]);
      
      return newChain;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chain';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Respond to a chain
  const respondToChain = async (
    chainId: string, 
    photoUri: string, 
    interpretation?: string
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      
      // PHASE 1: Pre-submission validation - fetch fresh chain data
      console.log('🔍 Validating turn status before submission...');
      const freshChain = await flareChainService.getChainById(chainId);
      
      if (!freshChain) {
        throw new Error('Chain not found');
      }

      // Check if it's still the user's turn
      const currentParticipant = freshChain.participants.find(p => 
        p.status === 'CURRENT_TURN'
      );
      
      if (!currentParticipant || currentParticipant.userId !== userId) {
        throw new Error('It is no longer your turn to respond');
      }

      // Check if turn has expired (with 30-second grace period buffer)
      const now = new Date();
      const expirationBuffer = 30 * 1000; // 30 seconds in milliseconds
      const turnExpiresAt = new Date(freshChain.currentTurnExpiresAt);
      
      if (now.getTime() + expirationBuffer >= turnExpiresAt.getTime()) {
        throw new Error('Your turn has expired or is about to expire');
      }

      console.log('✅ Turn validation passed, submitting response...');
      
      await flareChainService.respondToChain(chainId, userId, photoUri, interpretation);
      
      // Refresh chains to get updated data
      await loadChains();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to respond to chain';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Refresh all chains
  const refreshChains = async (): Promise<void> => {
    await loadChains();
  };

  // Get chains that need user response
  const getChainsAwaitingResponse = useCallback(async (): Promise<FlareChain[]> => {
    if (!userId) return [];
    
    try {
      return await flareChainService.getChainsAwaitingResponse(userId);
    } catch (err) {
      console.error('Error getting chains awaiting response:', err);
      return [];
    }
  }, [userId]);

  // Get a specific chain
  const getChainById = useCallback(async (chainId: string): Promise<FlareChain | null> => {
    try {
      return await flareChainService.getChainById(chainId);
    } catch (err) {
      console.error('Error getting chain by ID:', err);
      return null;
    }
  }, []);

  // Cancel a chain (creator only)
  const cancelChain = useCallback(async (chainId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await flareChainService.cancelChain(chainId, userId);
      
      // Remove from active chains
      setActiveChains(prev => prev.filter(chain => chain.id !== chainId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel chain';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId]);

  // Subscribe to real-time chain updates
  const subscribeToChain = useCallback((
    chainId: string, 
    callback: (chain: FlareChain | null) => void
  ): (() => void) => {
    return flareChainService.subscribeToChain(chainId, callback);
  }, []);

  // Load chains on mount or when userId changes
  useEffect(() => {
    loadChains();
  }, [loadChains]);

  return {
    activeChains,
    completedChains,
    loading,
    error,
    createChain,
    respondToChain,
    refreshChains,
    // Additional helper functions
    getChainsAwaitingResponse,
    getChainById,
    cancelChain,
    subscribeToChain,
  } as UseFlareChainReturn & {
    getChainsAwaitingResponse: () => Promise<FlareChain[]>;
    getChainById: (chainId: string) => Promise<FlareChain | null>;
    cancelChain: (chainId: string) => Promise<void>;
    subscribeToChain: (chainId: string, callback: (chain: FlareChain | null) => void) => () => void;
  };
};