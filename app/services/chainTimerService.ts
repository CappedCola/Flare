import { ChainTimer, FlareChain } from '../types';
import { ChainTimerStatus } from '../types/flare';
import { flareChainService } from './flareChainService';

export class ChainTimerService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, (timer: ChainTimer) => void> = new Map();

  // Start a timer for a chain participant
  startTimer(chainId: string, participantId: string, durationMinutes: number = 60): ChainTimer {
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);
    
    const timer: ChainTimer = {
      chainId,
      participantId,
      startTime: now,
      endTime,
      timeRemaining: durationMinutes * 60 * 1000, // milliseconds
      status: ChainTimerStatus.ACTIVE,
      warningsSent: 0,
    };

    // Clear any existing timer
    this.clearTimer(chainId, participantId);

    // Start countdown interval
    const timerId = setInterval(() => {
      this.updateTimer(chainId, participantId);
    }, 1000); // Update every second

    this.timers.set(`${chainId}-${participantId}`, timerId);
    
    return timer;
  }

  // Update timer state
  private updateTimer(chainId: string, participantId: string): void {
    const now = new Date();
    const callback = this.callbacks.get(`${chainId}-${participantId}`);
    
    if (!callback) return;

    // Calculate time remaining
    const timer = this.calculateTimeRemaining(chainId, participantId);
    
    if (timer.timeRemaining <= 0) {
      // Timer expired
      timer.status = ChainTimerStatus.EXPIRED;
      timer.timeRemaining = 0;
      this.handleTimerExpiration(chainId, participantId);
    } else if (timer.timeRemaining <= 5 * 60 * 1000 && timer.warningsSent < 2) {
      // 5 minutes or less - urgent
      timer.status = ChainTimerStatus.URGENT;
      this.sendTimerWarning(chainId, participantId, 'urgent');
      timer.warningsSent = 2;
    } else if (timer.timeRemaining <= 15 * 60 * 1000 && timer.warningsSent < 1) {
      // 15 minutes or less - warning
      timer.status = ChainTimerStatus.WARNING;
      this.sendTimerWarning(chainId, participantId, 'warning');
      timer.warningsSent = 1;
    }

    callback(timer);
  }

  // Calculate current time remaining
  calculateTimeRemaining(chainId: string, participantId: string): ChainTimer {
    const now = new Date();
    // In a real implementation, you'd get this from storage/database
    // For now, we'll calculate based on chain creation time + 60 minutes
    
    const timer: ChainTimer = {
      chainId,
      participantId,
      startTime: new Date(now.getTime() - 10 * 60 * 1000), // Started 10 minutes ago
      endTime: new Date(now.getTime() + 50 * 60 * 1000), // 50 minutes remaining
      timeRemaining: 50 * 60 * 1000,
      status: ChainTimerStatus.ACTIVE,
      warningsSent: 0,
    };

    timer.timeRemaining = Math.max(0, timer.endTime.getTime() - now.getTime());
    
    if (timer.timeRemaining <= 0) {
      timer.status = ChainTimerStatus.EXPIRED;
    } else if (timer.timeRemaining <= 5 * 60 * 1000) {
      timer.status = ChainTimerStatus.URGENT;
    } else if (timer.timeRemaining <= 15 * 60 * 1000) {
      timer.status = ChainTimerStatus.WARNING;
    } else {
      timer.status = ChainTimerStatus.ACTIVE;
    }

    return timer;
  }

  // Format time remaining as string
  formatTimeRemaining(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Get timer status color
  getTimerColor(status: ChainTimerStatus): string {
    switch (status) {
      case ChainTimerStatus.ACTIVE:
        return '#4ECDC4';
      case ChainTimerStatus.WARNING:
        return '#FFD93D';
      case ChainTimerStatus.URGENT:
        return '#FF6B6B';
      case ChainTimerStatus.EXPIRED:
        return '#95A5A6';
      default:
        return '#CCC';
    }
  }

  // Subscribe to timer updates
  subscribeToTimer(
    chainId: string, 
    participantId: string, 
    callback: (timer: ChainTimer) => void
  ): () => void {
    const key = `${chainId}-${participantId}`;
    this.callbacks.set(key, callback);

    // Start timer if not already running
    if (!this.timers.has(key)) {
      this.startTimer(chainId, participantId);
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(key);
      this.clearTimer(chainId, participantId);
    };
  }

  // Clear a specific timer
  private clearTimer(chainId: string, participantId: string): void {
    const key = `${chainId}-${participantId}`;
    const timerId = this.timers.get(key);
    
    if (timerId) {
      clearInterval(timerId);
      this.timers.delete(key);
    }
  }

  // Handle timer expiration
  private async handleTimerExpiration(chainId: string, participantId: string): Promise<void> {
    try {
      console.log(`Timer expired for participant ${participantId} in chain ${chainId}`);
      
      // Clear the timer
      this.clearTimer(chainId, participantId);
      
      // TODO: Implement chain expiration logic
      // 1. Mark participant as expired
      // 2. Move to next participant or expire chain
      // 3. Send notifications
      
      await flareChainService.expireOverdueChains();
    } catch (error) {
      console.error('Error handling timer expiration:', error);
    }
  }

  // Send timer warning notifications
  private async sendTimerWarning(
    chainId: string, 
    participantId: string, 
    type: 'warning' | 'urgent'
  ): Promise<void> {
    try {
      console.log(`Sending ${type} timer warning for participant ${participantId} in chain ${chainId}`);
      
      // TODO: Implement notification sending
      // 1. Create notification document
      // 2. Send push notification
      // 3. Show in-app notification
      
      const timeLeft = type === 'warning' ? '15 minutes' : '5 minutes';
      const message = `Hurry up! Only ${timeLeft} left to respond to your Flare Chain!`;
      
      // For now, just log
      console.log('Timer warning:', message);
    } catch (error) {
      console.error('Error sending timer warning:', error);
    }
  }

  // Stop all timers (cleanup)
  stopAllTimers(): void {
    this.timers.forEach((timerId) => {
      clearInterval(timerId);
    });
    this.timers.clear();
    this.callbacks.clear();
  }

  // Get time remaining for a chain
  async getTimeRemaining(chainId: string, participantId: string): Promise<number> {
    try {
      const chain = await flareChainService.getChainById(chainId);
      
      if (!chain) {
        return 0;
      }

      const now = new Date();
      const expiresAt = new Date(chain.expiresAt);
      
      return Math.max(0, expiresAt.getTime() - now.getTime());
    } catch (error) {
      console.error('Error getting time remaining:', error);
      return 0;
    }
  }

  // Check if timer is critical (< 15 minutes)
  isTimerCritical(timeRemaining: number): boolean {
    return timeRemaining <= 15 * 60 * 1000; // 15 minutes in milliseconds
  }

  // Check if timer is urgent (< 5 minutes)
  isTimerUrgent(timeRemaining: number): boolean {
    return timeRemaining <= 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Get formatted time with appropriate urgency
  getFormattedTimeWithStatus(timeRemaining: number): { time: string; status: ChainTimerStatus; color: string } {
    let status: ChainTimerStatus;
    
    if (timeRemaining <= 0) {
      status = ChainTimerStatus.EXPIRED;
    } else if (this.isTimerUrgent(timeRemaining)) {
      status = ChainTimerStatus.URGENT;
    } else if (this.isTimerCritical(timeRemaining)) {
      status = ChainTimerStatus.WARNING;
    } else {
      status = ChainTimerStatus.ACTIVE;
    }

    return {
      time: this.formatTimeRemaining(timeRemaining),
      status,
      color: this.getTimerColor(status),
    };
  }
}

// Export singleton instance
export const chainTimerService = new ChainTimerService();