/**
 * Network Service Tests
 * 
 * Tests for network connectivity detection, monitoring, and quality assessment
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NetworkService, useNetworkStatus } from '../networkService';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn()
  }
});

describe.skip('NetworkService', () => {
  let networkService: NetworkService;
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true });
    
    networkService = NetworkService.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with online status', () => {
      expect(networkService.isOnline.value).toBe(true);
    });

    it('should detect connection type from navigator.connection', () => {
      expect(networkService.connectionType.value).toBe('wifi');
      expect(networkService.effectiveType.value).toBe('4g');
      expect(networkService.downlink.value).toBe(10);
      expect(networkService.rtt.value).toBe(50);
    });
  });

  describe('Network Quality Assessment', () => {
    it('should assess excellent network quality', () => {
      // Mock excellent connection
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50
        }
      });

      const quality = networkService.getNetworkQuality();
      expect(quality).toBe('excellent');
    });

    it('should assess good network quality', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 3,
          rtt: 150
        }
      });

      const quality = networkService.getNetworkQuality();
      expect(quality).toBe('good');
    });

    it('should assess fair network quality', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '3g',
          downlink: 1,
          rtt: 300
        }
      });

      const quality = networkService.getNetworkQuality();
      expect(quality).toBe('fair');
    });

    it('should assess poor network quality', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.3,
          rtt: 800
        }
      });

      const quality = networkService.getNetworkQuality();
      expect(quality).toBe('poor');
    });

    it('should return offline when not connected', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      networkService = NetworkService.getInstance();

      const quality = networkService.getNetworkQuality();
      expect(quality).toBe('offline');
    });
  });

  describe('Network Recommendations', () => {
    it('should provide excellent connection recommendations', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false
        }
      });

      const recommendations = networkService.getNetworkRecommendations();
      expect(recommendations).toEqual({
        enableImages: true,
        enableAnimations: true,
        enableAutoRefresh: true,
        enablePrefetch: true,
        maxConcurrentRequests: 6
      });
    });

    it('should provide poor connection recommendations', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.3,
          rtt: 800,
          saveData: true
        }
      });

      const recommendations = networkService.getNetworkRecommendations();
      expect(recommendations).toEqual({
        enableImages: false,
        enableAnimations: false,
        enableAutoRefresh: false,
        enablePrefetch: false,
        maxConcurrentRequests: 1
      });
    });

    it('should respect saveData preference', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 5,
          rtt: 100,
          saveData: true
        }
      });

      const recommendations = networkService.getNetworkRecommendations();
      expect(recommendations.enableAnimations).toBe(false);
      expect(recommendations.enablePrefetch).toBe(false);
    });

    it('should provide offline recommendations', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      networkService = NetworkService.getInstance();

      const recommendations = networkService.getNetworkRecommendations();
      expect(recommendations).toEqual({
        enableImages: false,
        enableAnimations: false,
        enableAutoRefresh: false,
        enablePrefetch: false,
        maxConcurrentRequests: 0
      });
    });
  });

  describe('Connectivity Testing', () => {
    it('should perform successful connectivity test', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const isConnected = await networkService.checkConnectivity();
      expect(isConnected).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith('/favicon.ico', expect.objectContaining({
        method: 'HEAD',
        cache: 'no-cache'
      }));
    });

    it('should handle failed connectivity test', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const isConnected = await networkService.checkConnectivity();
      expect(isConnected).toBe(false);
    });

    it('should use fallback test when primary fails', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Primary test failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200
        } as Response);

      const isConnected = await networkService.checkConnectivity();
      expect(isConnected).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('should test specific URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200
      } as Response);

      const isReachable = await networkService.testUrl('https://example.com');
      expect(isReachable).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        method: 'HEAD'
      }));
    });

    it('should handle URL test timeout', async () => {
      fetchMock.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const isReachable = await networkService.testUrl('https://example.com', 100);
      expect(isReachable).toBe(false);
    });
  });

  describe('Status Listeners', () => {
    it('should notify status listeners on network change', () => {
      const listener = vi.fn();
      networkService.addStatusListener(listener);

      // Simulate network status change
      const event = new Event('offline');
      window.dispatchEvent(event);

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        isOnline: false
      }));
    });

    it('should remove status listeners', () => {
      const listener = vi.fn();
      networkService.addStatusListener(listener);
      networkService.removeStatusListener(listener);

      const event = new Event('offline');
      window.dispatchEvent(event);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Connection Type Detection', () => {
    it('should detect WiFi connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { type: 'wifi' }
      });

      networkService = NetworkService.getInstance();
      expect(networkService.connectionType.value).toBe('wifi');
    });

    it('should detect cellular connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { type: 'cellular' }
      });

      networkService = NetworkService.getInstance();
      expect(networkService.connectionType.value).toBe('cellular');
    });

    it('should handle unknown connection type', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { type: 'unknown' }
      });

      networkService = NetworkService.getInstance();
      expect(networkService.connectionType.value).toBe('unknown');
    });
  });

  describe('Slow/Fast Connection Detection', () => {
    it('should detect slow connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.3
        }
      });

      networkService = NetworkService.getInstance();
      expect(networkService.isSlowConnection).toBe(true);
      expect(networkService.isFastConnection).toBe(false);
    });

    it('should detect fast connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 5
        }
      });

      networkService = NetworkService.getInstance();
      expect(networkService.isSlowConnection).toBe(false);
      expect(networkService.isFastConnection).toBe(true);
    });
  });

  describe('Consecutive Failure Handling', () => {
    it('should only mark offline after multiple failures', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      // First failure - should still be online
      await networkService.checkConnectivity();
      expect(networkService.isOnline.value).toBe(true);

      // Second failure - should now be offline
      await networkService.checkConnectivity();
      expect(networkService.isOnline.value).toBe(false);
    });

    it('should reset failure count on successful check', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true } as Response);

      // First failure
      await networkService.checkConnectivity();
      expect(networkService.isOnline.value).toBe(true);

      // Success - should reset failure count
      await networkService.checkConnectivity();
      expect(networkService.isOnline.value).toBe(true);

      // Another failure - should still be online (failure count reset)
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      await networkService.checkConnectivity();
      expect(networkService.isOnline.value).toBe(true);
    });
  });
});

describe.skip('useNetworkStatus', () => {
  it('should provide reactive network status', () => {
    const {
      isOnline,
      connectionType,
      effectiveType,
      isSlowConnection,
      isFastConnection,
      getNetworkQuality
    } = useNetworkStatus();

    expect(isOnline.value).toBe(true);
    expect(connectionType.value).toBe('wifi');
    expect(effectiveType.value).toBe('4g');
    expect(typeof getNetworkQuality).toBe('function');
  });

  it('should provide network testing functions', () => {
    const { checkConnectivity, testUrl } = useNetworkStatus();

    expect(typeof checkConnectivity).toBe('function');
    expect(typeof testUrl).toBe('function');
  });
});