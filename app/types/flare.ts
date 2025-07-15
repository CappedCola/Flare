// Flare Chain specific types and enums

export enum ChainStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum ParticipantStatus {
  PENDING = 'pending',
  RESPONDED = 'responded',
  SKIPPED = 'skipped',
  EXPIRED = 'expired'
}

export enum PromptType {
  DAILY = 'daily',
  CATEGORY = 'category',
  CUSTOM = 'custom'
}

export enum PromptCategoryType {
  EMOTIONS = 'emotions',
  ADVENTURE = 'adventure',
  CREATIVITY = 'creativity',
  CONNECTION = 'connection',
  GROWTH = 'growth'
}

export enum ChainTimerStatus {
  ACTIVE = 'active',
  WARNING = 'warning', // < 15 minutes remaining
  URGENT = 'urgent',   // < 5 minutes remaining
  EXPIRED = 'expired'
}

export enum NotificationType {
  CHAIN_INVITATION = 'chain_invitation',
  CHAIN_RESPONSE = 'chain_response',
  CHAIN_COMPLETED = 'chain_completed',
  CHAIN_TIMER_WARNING = 'chain_timer_warning',
  CHAIN_TIMER_URGENT = 'chain_timer_urgent',
  CHAIN_EXPIRED = 'chain_expired'
}

// Color mappings for different states
export const ChainColors = {
  [ChainStatus.ACTIVE]: '#4ECDC4',
  [ChainStatus.COMPLETED]: '#6BCF7F',
  [ChainStatus.EXPIRED]: '#95A5A6',
  [ChainStatus.CANCELLED]: '#95A5A6'
} as const;

export const PromptCategoryColors = {
  [PromptCategoryType.EMOTIONS]: '#FF6B6B',
  [PromptCategoryType.ADVENTURE]: '#4ECDC4',
  [PromptCategoryType.CREATIVITY]: '#A8E6CF',
  [PromptCategoryType.CONNECTION]: '#FFD93D',
  [PromptCategoryType.GROWTH]: '#FF8B94'
} as const;

export const TimerColors = {
  [ChainTimerStatus.ACTIVE]: '#4ECDC4',
  [ChainTimerStatus.WARNING]: '#FFD93D',
  [ChainTimerStatus.URGENT]: '#FF6B6B',
  [ChainTimerStatus.EXPIRED]: '#95A5A6'
} as const;