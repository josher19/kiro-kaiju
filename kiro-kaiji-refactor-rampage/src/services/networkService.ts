/**
 * Network Service
 * 
 * Handles network connectivity detection, monitoring, and graceful degradation
 * for offline support and network-aware functionality
 */

import { ref, computed } from 'vue';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface NetworkServiceConfig {
  checkInterval: number;
  timeoutDuration: number;
  maxRetries: number;
  retryDelay: number;
}

export class NetworkService {
  private static instance: NetworkService;
  private config: NetworkServiceConfig;
  private statusListeners: Array<(status: NetworkStatus) => void> = [];
  private checkInterval: number | null = null;
  private lastCheckTime = 0;
  private consecutiveFailures = 0;

  // Reactive state
  private _isOnline = ref(navigator.onLine);
  private _connectionType = ref<NetworkStatus['connectionType']>('unknown');
  private _effectiveType = ref<NetworkStatus['effectiveType']>('unknown');
  private _downlink = ref(0);
  private _rtt = ref(0);
  private _saveData = ref(false);
  private _isChecking = ref(false);

  private constructor(config: Partial<NetworkServiceConfig> = {}) {
    this.config = {
      checkInterval: 30000, // 30 seconds
      timeoutDuration: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    this.initialize();
  }

  static getInstance(config?: Partial<NetworkServiceConfig>): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService(config);
    }
    return NetworkService.instance;
  }

  // Computed properties
  get isOnline() {
    return computed(() => this._isOnline.value);
  }

  get connectionType() {
    return computed(() => this._connectionType.value);
  }

  get effectiveType() {
    return computed(() => this._effectiveType.value);
  }

  get downlink() {
    return computed(() => this._downlink.value);
  }

  get rtt() {
    return computed(() => this._rtt.value);
  }

  get saveData() {
    return computed(() => this._saveData.value);
  }

  get isChecking() {
    return computed(() => this._isChecking.value);
  }

  get networkStatus(): NetworkStatus {
    return {
      isOnline: this._isOnline.value,
      connectionType: this._connectionType.value,
      effectiveType: this._effectiveType.value,
      downlink: this._downlink.value,
      rtt: this._rtt.value,
      saveData: this._saveData.value
    };
  }

  get isSlowConnection(): boolean {
    return this._effectiveType.value === 'slow-2g' || 
           this._effectiveType.value === '2g' ||
           this._downlink.value < 0.5;
  }

  get isFastConnection(): boolean {
    return this._effectiveType.value === '4g' && this._downlink.value > 2;
  }

  /**
   * Initialize network service
   */
  private initialize(): void {
    // Set up event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Initialize connection info if available
    this.updateConnectionInfo();

    // Start periodic connectivity checks
    this.startPeriodicChecks();

    // Initial connectivity check
    this.checkConnectivity();
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('Network: Online event detected');
    this._isOnline.value = true;
    this.consecutiveFailures = 0;
    this.updateConnectionInfo();
    this.notifyListeners();
    
    // Perform immediate connectivity check to verify
    this.checkConnectivity();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('Network: Offline event detected');
    this._isOnline.value = false;
    this.notifyListeners();
  }

  /**
   * Update connection information from Network Information API
   */
  private updateConnectionInfo(): void {
    try {
      // Check if Network Information API is available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        this._connectionType.value = this.mapConnectionType(connection.type);
        this._effectiveType.value = connection.effectiveType || 'unknown';
        this._downlink.value = connection.downlink || 0;
        this._rtt.value = connection.rtt || 0;
        this._saveData.value = connection.saveData || false;

        // Listen for connection changes
        connection.addEventListener('change', () => {
          this.updateConnectionInfo();
          this.notifyListeners();
        });
      }
    } catch (error) {
      console.warn('Failed to get connection info:', error);
    }
  }

  /**
   * Map connection type to our enum
   */
  private mapConnectionType(type: string): NetworkStatus['connectionType'] {
    switch (type) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'cellular';
      case 'ethernet':
        return 'ethernet';
      default:
        return 'unknown';
    }
  }

  /**
   * Start periodic connectivity checks
   */
  private startPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = window.setInterval(() => {
      this.checkConnectivity();
    }, this.config.checkInterval);
  }

  /**
   * Stop periodic connectivity checks
   */
  private stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check actual connectivity by making a test request
   */
  async checkConnectivity(): Promise<boolean> {
    // Avoid too frequent checks
    const now = Date.now();
    if (now - this.lastCheckTime < 5000) {
      return this._isOnline.value;
    }

    this.lastCheckTime = now;
    this._isChecking.value = true;

    try {
      const isConnected = await this.performConnectivityTest();
      
      if (isConnected) {
        this._isOnline.value = true;
        this.consecutiveFailures = 0;
      } else {
        this.consecutiveFailures++;
        
        // Only mark as offline after multiple failures
        if (this.consecutiveFailures >= 2) {
          this._isOnline.value = false;
        }
      }

      this.notifyListeners();
      return isConnected;

    } catch (error) {
      errorHandler.handle(error, { 
        context: 'connectivity_check',
        consecutiveFailures: this.consecutiveFailures 
      });
      
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 2) {
        this._isOnline.value = false;
        this.notifyListeners();
      }
      
      return false;
    } finally {
      this._isChecking.value = false;
    }
  }

  /**
   * Perform actual connectivity test
   */
  private async performConnectivityTest(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration);

    try {
      // Test with a small, fast endpoint
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // If the main test fails, try a fallback test
      return this.performFallbackConnectivityTest();
    }
  }

  /**
   * Fallback connectivity test using external service
   */
  private async performFallbackConnectivityTest(): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutDuration);

    try {
      // Use a reliable external service for connectivity test
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
        mode: 'no-cors' // Avoid CORS issues
      });

      clearTimeout(timeoutId);
      return true; // If we get any response, we're connected

    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Test if a specific URL is reachable
   */
  async testUrl(url: string, timeout = 5000): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Get network quality assessment
   */
  getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' {
    if (!this._isOnline.value) {
      return 'offline';
    }

    const effectiveType = this._effectiveType.value;
    const downlink = this._downlink.value;
    const rtt = this._rtt.value;

    if (effectiveType === '4g' && downlink > 5 && rtt < 100) {
      return 'excellent';
    }

    if (effectiveType === '4g' || (downlink > 2 && rtt < 200)) {
      return 'good';
    }

    if (effectiveType === '3g' || (downlink > 0.5 && rtt < 500)) {
      return 'fair';
    }

    return 'poor';
  }

  /**
   * Get recommended behavior based on network conditions
   */
  getNetworkRecommendations(): {
    enableImages: boolean;
    enableAnimations: boolean;
    enableAutoRefresh: boolean;
    enablePrefetch: boolean;
    maxConcurrentRequests: number;
  } {
    const quality = this.getNetworkQuality();
    const saveData = this._saveData.value;

    switch (quality) {
      case 'excellent':
        return {
          enableImages: true,
          enableAnimations: true,
          enableAutoRefresh: true,
          enablePrefetch: true,
          maxConcurrentRequests: 6
        };

      case 'good':
        return {
          enableImages: true,
          enableAnimations: !saveData,
          enableAutoRefresh: true,
          enablePrefetch: !saveData,
          maxConcurrentRequests: 4
        };

      case 'fair':
        return {
          enableImages: !saveData,
          enableAnimations: false,
          enableAutoRefresh: false,
          enablePrefetch: false,
          maxConcurrentRequests: 2
        };

      case 'poor':
        return {
          enableImages: false,
          enableAnimations: false,
          enableAutoRefresh: false,
          enablePrefetch: false,
          maxConcurrentRequests: 1
        };

      case 'offline':
      default:
        return {
          enableImages: false,
          enableAnimations: false,
          enableAutoRefresh: false,
          enablePrefetch: false,
          maxConcurrentRequests: 0
        };
    }
  }

  /**
   * Add status change listener
   */
  addStatusListener(listener: (status: NetworkStatus) => void): void {
    this.statusListeners.push(listener);
  }

  /**
   * Remove status change listener
   */
  removeStatusListener(listener: (status: NetworkStatus) => void): void {
    const index = this.statusListeners.indexOf(listener);
    if (index > -1) {
      this.statusListeners.splice(index, 1);
    }
  }

  /**
   * Notify all status listeners
   */
  private notifyListeners(): void {
    const status = this.networkStatus;
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.warn('Network status listener failed:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopPeriodicChecks();
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.statusListeners = [];
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();

// Convenience functions
export function useNetworkStatus() {
  const service = NetworkService.getInstance();
  
  return {
    isOnline: service.isOnline,
    connectionType: service.connectionType,
    effectiveType: service.effectiveType,
    downlink: service.downlink,
    rtt: service.rtt,
    saveData: service.saveData,
    isChecking: service.isChecking,
    isSlowConnection: service.isSlowConnection,
    isFastConnection: service.isFastConnection,
    networkStatus: service.networkStatus,
    getNetworkQuality: () => service.getNetworkQuality(),
    getNetworkRecommendations: () => service.getNetworkRecommendations(),
    checkConnectivity: () => service.checkConnectivity(),
    testUrl: (url: string, timeout?: number) => service.testUrl(url, timeout)
  };
}