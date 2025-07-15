import { useState, useEffect, useRef } from 'react';
import { ChainTimer, UseChainTimerReturn } from '../types';
import { ChainTimerStatus } from '../types/flare';
import { chainTimerService } from '../services/chainTimerService';

export const useChainTimer = (
  chainId: string,
  participantId: string,
  initialTimeRemaining?: number
): UseChainTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining || 0);
  const [status, setStatus] = useState<ChainTimerStatus>(ChainTimerStatus.ACTIVE);
  const [warningsShown, setWarningsShown] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!chainId || !participantId) return;

    // Subscribe to timer updates
    const unsubscribe = chainTimerService.subscribeToTimer(
      chainId,
      participantId,
      (timer: ChainTimer) => {
        setTimeRemaining(timer.timeRemaining);
        setStatus(timer.status);
        setWarningsShown(timer.warningsSent);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Load initial time remaining
    const loadInitialTime = async () => {
      const remaining = await chainTimerService.getTimeRemaining(chainId, participantId);
      setTimeRemaining(remaining);
    };

    loadInitialTime();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [chainId, participantId]);

  // Format time as MM:SS or HH:MM:SS
  const formattedTime = chainTimerService.formatTimeRemaining(timeRemaining);

  // Check if timer has expired
  const isExpired = timeRemaining <= 0;

  // Get timer color based on status
  const timerColor = chainTimerService.getTimerColor(status);

  // Get urgency level
  const isUrgent = chainTimerService.isTimerUrgent(timeRemaining);
  const isCritical = chainTimerService.isTimerCritical(timeRemaining);

  // Get status text
  const getStatusText = (): string => {
    switch (status) {
      case ChainTimerStatus.ACTIVE:
        return 'Time remaining';
      case ChainTimerStatus.WARNING:
        return 'Hurry up!';
      case ChainTimerStatus.URGENT:
        return 'Almost out of time!';
      case ChainTimerStatus.EXPIRED:
        return 'Time expired';
      default:
        return 'Timer';
    }
  };

  // Get progress percentage (0-100)
  const getProgress = (): number => {
    const totalTime = 60 * 60 * 1000; // 60 minutes in milliseconds
    const progress = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
    return Math.round(progress);
  };

  // Get time segments for display
  const getTimeSegments = () => {
    const totalSeconds = Math.floor(timeRemaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
  };

  // Check if should show warning
  const shouldShowWarning = (): boolean => {
    return (isCritical && warningsShown < 1) || (isUrgent && warningsShown < 2);
  };

  return {
    timeRemaining,
    status,
    formattedTime,
    isExpired,
    warningsShown,
    // Additional helper properties
    timerColor,
    isUrgent,
    isCritical,
    statusText: getStatusText(),
    progress: getProgress(),
    timeSegments: getTimeSegments(),
    shouldShowWarning: shouldShowWarning(),
  } as UseChainTimerReturn & {
    timerColor: string;
    isUrgent: boolean;
    isCritical: boolean;
    statusText: string;
    progress: number;
    timeSegments: { hours: number; minutes: number; seconds: number };
    shouldShowWarning: boolean;
  };
};