/**
 * Offline Storage Service
 * 
 * Handles local storage, caching, and offline data management
 * with automatic sync when connection is restored
 */

import { ref, computed } from 'vue';
import type { Challenge } from '@/types/challenge';
import type { EvaluationResult } from '@/types/user';
import type { AIChatMessage } from '@/types/api';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';
import { networkService } from './networkService';

export interface CachedChallenge {
  challenge: Challenge;
  cachedAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export interface PendingEvaluation {
  id: string;
  challengeId: string;
  submittedCode: string;
  userId?: string;
  timeSpent: number;
  attempts: number;
  createdAt: Date;
  retryCount: number;
}

export interface CachedChatHistory {
  challengeId: string;
  userId?: string;
  messages: AIChatMessage[];
  lastUpdated: Date;
}

export interface OfflineData {
  challenges: Record<string, CachedChallenge>;
  pendingEvaluations: Record<string, PendingEvaluation>;
  chatHistories: Record<string, CachedChatHistory>;
  userProgress: any;
  settings: Record<string, any>;
  metadata: {
    version: string;
    lastSync: Date;
    totalSize: number;
  };
}

export interface StorageQuota {
  used: number;
  available: number;
  total: number;
  percentage: number;
}

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private readonly STORAGE_KEY = 'kiro-kaiju-offline-data';
  private readonly VERSION = '1.0.0';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_CHALLENGES = 20;
  private readonly MAX_CHAT_HISTORIES = 10;
  private readonly CHALLENGE_EXPIRY_DAYS = 7;

  // Reactive state
  private _isInitialized = ref(false);
  private _storageQuota = ref<StorageQuota>({ used: 0, available: 0, total: 0, percentage: 0 });
  private _pendingSync = ref(0);
  private _lastSync = ref<Date | null>(null);

  private syncListeners: Array<(data: { type: string; count: number }) => void> = [];
  private storageListeners: Array<(quota: StorageQuota) => void> = [];

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  // Computed properties
  get isInitialized() {
    return computed(() => this._isInitialized.value);
  }

  get storageQuota() {
    return computed(() => this._storageQuota.value);
  }

  get pendingSync() {
    return computed(() => this._pendingSync.value);
  }

  get lastSync() {
    return computed(() => this._lastSync.value);
  }

  get isStorageFull() {
    return computed(() => this._storageQuota.value.percentage > 90);
  }

  /**
   * Initialize offline storage
   */
  private async initialize(): Promise<void> {
    try {
      // Check storage availability
      if (!this.isStorageAvailable()) {
        throw new Error('Local storage is not available');
      }

      // Initialize storage structure
      await this.initializeStorage();

      // Update storage quota
      await this.updateStorageQuota();

      // Set up network listener for auto-sync
      networkService.addStatusListener(this.handleNetworkChange.bind(this));

      this._isInitialized.value = true;
      console.log('Offline storage initialized successfully');

    } catch (error) {
      errorHandler.handle(error, { context: 'offline_storage_init' });
      throw error;
    }
  }

  /**
   * Check if storage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize storage structure
   */
  private async initializeStorage(): Promise<void> {
    const existingData = this.getOfflineData();
    
    if (!existingData) {
      const initialData: OfflineData = {
        challenges: {},
        pendingEvaluations: {},
        chatHistories: {},
        userProgress: null,
        settings: {},
        metadata: {
          version: this.VERSION,
          lastSync: new Date(),
          totalSize: 0
        }
      };

      this.saveOfflineData(initialData);
    } else {
      // Migrate data if version changed
      if (existingData.metadata.version !== this.VERSION) {
        await this.migrateData(existingData);
      }
    }

    // Clean up expired data
    await this.cleanupExpiredData();
  }

  /**
   * Cache a challenge for offline use
   */
  async cacheChallenge(challenge: Challenge): Promise<void> {
    try {
      const data = this.getOfflineData();
      if (!data) throw new Error('Offline data not initialized');

      const cachedChallenge: CachedChallenge = {
        challenge,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        accessCount: 0,
        lastAccessed: new Date()
      };

      data.challenges[challenge.id] = cachedChallenge;

      // Enforce cache limits
      await this.enforceCacheLimits(data);

      this.saveOfflineData(data);
      await this.updateStorageQuota();

      console.log(`Challenge ${challenge.id} cached for offline use`);

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'cache_challenge',
        challengeId: challenge.id 
      });
    }
  }

  /**
   * Get cached challenge
   */
  getCachedChallenge(challengeId: string): Challenge | null {
    try {
      const data = this.getOfflineData();
      if (!data) return null;

      const cached = data.challenges[challengeId];
      if (!cached) return null;

      // Check if expired
      if (new Date() > cached.expiresAt) {
        delete data.challenges[challengeId];
        this.saveOfflineData(data);
        return null;
      }

      // Update access info
      cached.accessCount++;
      cached.lastAccessed = new Date();
      this.saveOfflineData(data);

      return cached.challenge;

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'get_cached_challenge',
        challengeId 
      });
      return null;
    }
  }

  /**
   * Get all cached challenges
   */
  getCachedChallenges(): Challenge[] {
    try {
      const data = this.getOfflineData();
      if (!data) return [];

      const now = new Date();
      const validChallenges: Challenge[] = [];

      Object.entries(data.challenges).forEach(([id, cached]) => {
        if (now <= cached.expiresAt) {
          validChallenges.push(cached.challenge);
        } else {
          delete data.challenges[id];
        }
      });

      this.saveOfflineData(data);
      return validChallenges;

    } catch (error) {
      errorHandler.handle(error, { context: 'get_cached_challenges' });
      return [];
    }
  }

  /**
   * Store evaluation for later sync
   */
  async storePendingEvaluation(
    challengeId: string,
    submittedCode: string,
    userId?: string,
    timeSpent = 0,
    attempts = 1
  ): Promise<string> {
    try {
      const data = this.getOfflineData();
      if (!data) throw new Error('Offline data not initialized');

      const evaluationId = `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const pendingEvaluation: PendingEvaluation = {
        id: evaluationId,
        challengeId,
        submittedCode,
        userId,
        timeSpent,
        attempts,
        createdAt: new Date(),
        retryCount: 0
      };

      data.pendingEvaluations[evaluationId] = pendingEvaluation;
      this.saveOfflineData(data);
      
      this._pendingSync.value = Object.keys(data.pendingEvaluations).length;
      await this.updateStorageQuota();

      console.log(`Evaluation ${evaluationId} stored for later sync`);
      return evaluationId;

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'store_pending_evaluation',
        challengeId 
      });
      throw error;
    }
  }

  /**
   * Get pending evaluations
   */
  getPendingEvaluations(): PendingEvaluation[] {
    try {
      const data = this.getOfflineData();
      if (!data) return [];

      return Object.values(data.pendingEvaluations);

    } catch (error) {
      errorHandler.handle(error, { context: 'get_pending_evaluations' });
      return [];
    }
  }

  /**
   * Remove pending evaluation (after successful sync)
   */
  removePendingEvaluation(evaluationId: string): void {
    try {
      const data = this.getOfflineData();
      if (!data) return;

      delete data.pendingEvaluations[evaluationId];
      this.saveOfflineData(data);
      
      this._pendingSync.value = Object.keys(data.pendingEvaluations).length;

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'remove_pending_evaluation',
        evaluationId 
      });
    }
  }

  /**
   * Cache chat history
   */
  async cacheChatHistory(
    challengeId: string,
    messages: AIChatMessage[],
    userId?: string
  ): Promise<void> {
    try {
      const data = this.getOfflineData();
      if (!data) throw new Error('Offline data not initialized');

      const historyKey = `${challengeId}-${userId || 'anonymous'}`;
      
      data.chatHistories[historyKey] = {
        challengeId,
        userId,
        messages: [...messages], // Create a copy
        lastUpdated: new Date()
      };

      // Enforce chat history limits
      await this.enforceChatHistoryLimits(data);

      this.saveOfflineData(data);
      await this.updateStorageQuota();

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'cache_chat_history',
        challengeId 
      });
    }
  }

  /**
   * Get cached chat history
   */
  getCachedChatHistory(challengeId: string, userId?: string): AIChatMessage[] {
    try {
      const data = this.getOfflineData();
      if (!data) return [];

      const historyKey = `${challengeId}-${userId || 'anonymous'}`;
      const cached = data.chatHistories[historyKey];

      return cached ? cached.messages : [];

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'get_cached_chat_history',
        challengeId 
      });
      return [];
    }
  }

  /**
   * Store user progress
   */
  async storeUserProgress(progress: any): Promise<void> {
    try {
      const data = this.getOfflineData();
      if (!data) throw new Error('Offline data not initialized');

      data.userProgress = progress;
      this.saveOfflineData(data);
      await this.updateStorageQuota();

    } catch (error) {
      errorHandler.handle(error, { context: 'store_user_progress' });
    }
  }

  /**
   * Get stored user progress
   */
  getStoredUserProgress(): any {
    try {
      const data = this.getOfflineData();
      return data?.userProgress || null;

    } catch (error) {
      errorHandler.handle(error, { context: 'get_stored_user_progress' });
      return null;
    }
  }

  /**
   * Store app settings
   */
  async storeSetting(key: string, value: any): Promise<void> {
    try {
      const data = this.getOfflineData();
      if (!data) throw new Error('Offline data not initialized');

      data.settings[key] = value;
      this.saveOfflineData(data);

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'store_setting',
        key 
      });
    }
  }

  /**
   * Get stored setting
   */
  getStoredSetting(key: string, defaultValue?: any): any {
    try {
      const data = this.getOfflineData();
      if (!data) return defaultValue;

      return data.settings[key] !== undefined ? data.settings[key] : defaultValue;

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'get_stored_setting',
        key 
      });
      return defaultValue;
    }
  }

  /**
   * Sync pending data when online
   */
  async syncPendingData(): Promise<void> {
    if (!networkService.isOnline.value) {
      console.log('Cannot sync: offline');
      return;
    }

    try {
      const pendingEvaluations = this.getPendingEvaluations();
      
      if (pendingEvaluations.length === 0) {
        console.log('No pending data to sync');
        return;
      }

      console.log(`Syncing ${pendingEvaluations.length} pending evaluations`);

      for (const evaluation of pendingEvaluations) {
        try {
          // Here you would call the actual evaluation service
          // For now, we'll simulate the sync
          await this.syncEvaluation(evaluation);
          this.removePendingEvaluation(evaluation.id);
          
        } catch (error) {
          console.warn(`Failed to sync evaluation ${evaluation.id}:`, error);
          
          // Increment retry count
          const data = this.getOfflineData();
          if (data && data.pendingEvaluations[evaluation.id]) {
            data.pendingEvaluations[evaluation.id].retryCount++;
            
            // Remove if too many retries
            if (data.pendingEvaluations[evaluation.id].retryCount > 5) {
              delete data.pendingEvaluations[evaluation.id];
              console.warn(`Removing evaluation ${evaluation.id} after too many retry attempts`);
            }
            
            this.saveOfflineData(data);
          }
        }
      }

      this._lastSync.value = new Date();
      this.notifySyncListeners({ type: 'evaluations', count: pendingEvaluations.length });

    } catch (error) {
      errorHandler.handle(error, { context: 'sync_pending_data' });
    }
  }

  /**
   * Sync individual evaluation (placeholder)
   */
  private async syncEvaluation(evaluation: PendingEvaluation): Promise<void> {
    // This would call the actual evaluation service
    // For now, we'll simulate a successful sync
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Synced evaluation ${evaluation.id}`);
  }

  /**
   * Handle network status change
   */
  private handleNetworkChange(status: any): void {
    if (status.isOnline && this._pendingSync.value > 0) {
      console.log('Network restored, syncing pending data...');
      this.syncPendingData();
    }
  }

  /**
   * Enforce cache limits
   */
  private async enforceCacheLimits(data: OfflineData): Promise<void> {
    const challengeEntries = Object.entries(data.challenges);
    
    if (challengeEntries.length > this.MAX_CHALLENGES) {
      // Sort by last accessed (oldest first)
      challengeEntries.sort((a, b) => 
        a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime()
      );

      // Remove oldest challenges
      const toRemove = challengeEntries.slice(0, challengeEntries.length - this.MAX_CHALLENGES);
      toRemove.forEach(([id]) => {
        delete data.challenges[id];
      });

      console.log(`Removed ${toRemove.length} old cached challenges`);
    }
  }

  /**
   * Enforce chat history limits
   */
  private async enforceChatHistoryLimits(data: OfflineData): Promise<void> {
    const historyEntries = Object.entries(data.chatHistories);
    
    if (historyEntries.length > this.MAX_CHAT_HISTORIES) {
      // Sort by last updated (oldest first)
      historyEntries.sort((a, b) => 
        a[1].lastUpdated.getTime() - b[1].lastUpdated.getTime()
      );

      // Remove oldest histories
      const toRemove = historyEntries.slice(0, historyEntries.length - this.MAX_CHAT_HISTORIES);
      toRemove.forEach(([key]) => {
        delete data.chatHistories[key];
      });

      console.log(`Removed ${toRemove.length} old chat histories`);
    }
  }

  /**
   * Clean up expired data
   */
  private async cleanupExpiredData(): Promise<void> {
    try {
      const data = this.getOfflineData();
      if (!data) return;

      const now = new Date();
      let cleanedCount = 0;

      // Clean expired challenges
      Object.entries(data.challenges).forEach(([id, cached]) => {
        if (now > cached.expiresAt) {
          delete data.challenges[id];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        this.saveOfflineData(data);
        console.log(`Cleaned up ${cleanedCount} expired challenges`);
      }

    } catch (error) {
      errorHandler.handle(error, { context: 'cleanup_expired_data' });
    }
  }

  /**
   * Update storage quota information
   */
  private async updateStorageQuota(): Promise<void> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 0;
        const available = total - used;
        const percentage = total > 0 ? (used / total) * 100 : 0;

        this._storageQuota.value = {
          used,
          available,
          total,
          percentage
        };

        this.notifyStorageListeners(this._storageQuota.value);
      }
    } catch (error) {
      console.warn('Failed to get storage quota:', error);
    }
  }

  /**
   * Get offline data from localStorage
   */
  private getOfflineData(): OfflineData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects
      this.deserializeDates(parsed);
      
      return parsed;

    } catch (error) {
      errorHandler.handle(error, { context: 'get_offline_data' });
      return null;
    }
  }

  /**
   * Save offline data to localStorage
   */
  private saveOfflineData(data: OfflineData): void {
    try {
      data.metadata.lastSync = new Date();
      data.metadata.totalSize = JSON.stringify(data).length;
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Storage quota exceeded, try to free up space
        this.handleStorageQuotaExceeded(data);
      } else {
        errorHandler.handle(error, { context: 'save_offline_data' });
      }
    }
  }

  /**
   * Handle storage quota exceeded
   */
  private handleStorageQuotaExceeded(data: OfflineData): void {
    console.warn('Storage quota exceeded, cleaning up data...');
    
    // Remove oldest cached challenges
    const challengeEntries = Object.entries(data.challenges);
    if (challengeEntries.length > 0) {
      challengeEntries.sort((a, b) => 
        a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime()
      );
      
      // Remove half of the challenges
      const toRemove = challengeEntries.slice(0, Math.ceil(challengeEntries.length / 2));
      toRemove.forEach(([id]) => {
        delete data.challenges[id];
      });
    }

    // Remove oldest chat histories
    const historyEntries = Object.entries(data.chatHistories);
    if (historyEntries.length > 0) {
      historyEntries.sort((a, b) => 
        a[1].lastUpdated.getTime() - b[1].lastUpdated.getTime()
      );
      
      // Remove half of the histories
      const toRemove = historyEntries.slice(0, Math.ceil(historyEntries.length / 2));
      toRemove.forEach(([key]) => {
        delete data.chatHistories[key];
      });
    }

    // Try to save again
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      errorHandler.handle(error, { context: 'save_after_cleanup' });
    }
  }

  /**
   * Deserialize date strings back to Date objects
   */
  private deserializeDates(obj: any): void {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        if (typeof value === 'string' && this.isDateString(value)) {
          obj[key] = new Date(value);
        } else if (typeof value === 'object') {
          this.deserializeDates(value);
        }
      });
    }
  }

  /**
   * Check if string is a date string
   */
  private isDateString(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }

  /**
   * Migrate data between versions
   */
  private async migrateData(data: OfflineData): Promise<void> {
    console.log(`Migrating offline data from ${data.metadata.version} to ${this.VERSION}`);
    
    // Add migration logic here as needed
    data.metadata.version = this.VERSION;
    this.saveOfflineData(data);
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      await this.initializeStorage();
      await this.updateStorageQuota();
      
      this._pendingSync.value = 0;
      console.log('All offline data cleared');

    } catch (error) {
      errorHandler.handle(error, { context: 'clear_all_data' });
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    challenges: number;
    pendingEvaluations: number;
    chatHistories: number;
    totalSize: number;
    quota: StorageQuota;
  } {
    const data = this.getOfflineData();
    
    return {
      challenges: data ? Object.keys(data.challenges).length : 0,
      pendingEvaluations: data ? Object.keys(data.pendingEvaluations).length : 0,
      chatHistories: data ? Object.keys(data.chatHistories).length : 0,
      totalSize: data ? data.metadata.totalSize : 0,
      quota: this._storageQuota.value
    };
  }

  /**
   * Add sync listener
   */
  addSyncListener(listener: (data: { type: string; count: number }) => void): void {
    this.syncListeners.push(listener);
  }

  /**
   * Remove sync listener
   */
  removeSyncListener(listener: (data: { type: string; count: number }) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  /**
   * Notify sync listeners
   */
  private notifySyncListeners(data: { type: string; count: number }): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.warn('Sync listener failed:', error);
      }
    });
  }

  /**
   * Add storage listener
   */
  addStorageListener(listener: (quota: StorageQuota) => void): void {
    this.storageListeners.push(listener);
  }

  /**
   * Remove storage listener
   */
  removeStorageListener(listener: (quota: StorageQuota) => void): void {
    const index = this.storageListeners.indexOf(listener);
    if (index > -1) {
      this.storageListeners.splice(index, 1);
    }
  }

  /**
   * Notify storage listeners
   */
  private notifyStorageListeners(quota: StorageQuota): void {
    this.storageListeners.forEach(listener => {
      try {
        listener(quota);
      } catch (error) {
        console.warn('Storage listener failed:', error);
      }
    });
  }
}

// Export singleton instance
export const offlineStorageService = OfflineStorageService.getInstance();

// Convenience functions
export function useOfflineStorage() {
  const service = OfflineStorageService.getInstance();
  
  return {
    isInitialized: service.isInitialized,
    storageQuota: service.storageQuota,
    pendingSync: service.pendingSync,
    lastSync: service.lastSync,
    isStorageFull: service.isStorageFull,
    cacheChallenge: (challenge: Challenge) => service.cacheChallenge(challenge),
    getCachedChallenge: (id: string) => service.getCachedChallenge(id),
    getCachedChallenges: () => service.getCachedChallenges(),
    storePendingEvaluation: (challengeId: string, code: string, userId?: string, timeSpent?: number, attempts?: number) => 
      service.storePendingEvaluation(challengeId, code, userId, timeSpent, attempts),
    getPendingEvaluations: () => service.getPendingEvaluations(),
    cacheChatHistory: (challengeId: string, messages: AIChatMessage[], userId?: string) => 
      service.cacheChatHistory(challengeId, messages, userId),
    getCachedChatHistory: (challengeId: string, userId?: string) => 
      service.getCachedChatHistory(challengeId, userId),
    storeUserProgress: (progress: any) => service.storeUserProgress(progress),
    getStoredUserProgress: () => service.getStoredUserProgress(),
    storeSetting: (key: string, value: any) => service.storeSetting(key, value),
    getStoredSetting: (key: string, defaultValue?: any) => service.getStoredSetting(key, defaultValue),
    syncPendingData: () => service.syncPendingData(),
    clearAllData: () => service.clearAllData(),
    getStorageStats: () => service.getStorageStats()
  };
}