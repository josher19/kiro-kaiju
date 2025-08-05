/**
 * App Store
 * 
 * Pinia store for managing global application state including
 * theme, mobile detection, and general UI state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  createKiroIntegrationService, 
  getKiroIntegrationService,
  defaultKiroConfig,
  type KiroIntegrationConfig 
} from '@/services/kiroIntegrationService';

export type Theme = 'light' | 'dark' | 'auto';
export type ViewType = 'challenges' | 'coding' | 'progress';
export type DeploymentMode = 'local' | 'cloud';

export const useAppStore = defineStore('app', () => {
  // State
  const theme = ref<Theme>('auto');
  const isMobile = ref(false);
  const currentView = ref<ViewType>('challenges');
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadingMessage = ref('Loading...');

  // Deployment mode state
  const deploymentMode = ref<DeploymentMode>('local');
  const kiroIntegrationEnabled = ref(false);
  const kiroConfig = ref<KiroIntegrationConfig>(defaultKiroConfig);

  // Mobile panel states
  const isMobileMenuOpen = ref(false);
  const isAIPanelOpen = ref(false);
  const isZoomPanelOpen = ref(false);

  // Computed properties
  const isDarkMode = computed(() => {
    if (theme.value === 'dark') return true;
    if (theme.value === 'light') return false;
    // Auto mode - check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const isDesktop = computed(() => !isMobile.value);

  // Actions
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Save preference to localStorage
    localStorage.setItem('kiro-kaiju-theme', newTheme);
  };

  const setMobile = (mobile: boolean) => {
    isMobile.value = mobile;
    
    // Close mobile panels when switching to desktop
    if (!mobile) {
      closeMobilePanels();
      isMobileMenuOpen.value = false;
    }
  };

  const setCurrentView = (view: ViewType) => {
    currentView.value = view;
    closeMobilePanels();
    isMobileMenuOpen.value = false;
  };

  const setLoading = (loading: boolean, message?: string) => {
    isLoading.value = loading;
    if (message) {
      loadingMessage.value = message;
    }
  };

  const setError = (errorMessage: string | null) => {
    error.value = errorMessage;
  };

  const clearError = () => {
    error.value = null;
  };

  // Mobile panel management
  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
  };

  const toggleAIPanel = () => {
    if (isMobile.value) {
      isZoomPanelOpen.value = false;
      isAIPanelOpen.value = !isAIPanelOpen.value;
    }
  };

  const toggleZoomPanel = () => {
    if (isMobile.value) {
      isAIPanelOpen.value = false;
      isZoomPanelOpen.value = !isZoomPanelOpen.value;
    }
  };

  const closeMobilePanels = () => {
    isAIPanelOpen.value = false;
    isZoomPanelOpen.value = false;
  };

  // Deployment mode management
  const setDeploymentMode = async (mode: DeploymentMode) => {
    try {
      setLoading(true, `Switching to ${mode} mode...`);
      
      // Cleanup existing integration if switching modes
      if (kiroIntegrationEnabled.value && deploymentMode.value !== mode) {
        await cleanupKiroIntegration();
      }

      deploymentMode.value = mode;
      
      // Initialize Kiro integration for local mode
      if (mode === 'local') {
        await initializeKiroIntegration();
      }

      // Save preference
      localStorage.setItem('kiro-kaiju-deployment-mode', mode);
      
    } catch (error) {
      console.error('Failed to switch deployment mode:', error);
      setError(`Failed to switch to ${mode} mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeKiroIntegration = async () => {
    try {
      // Check if we're in Kiro IDE environment
      if (typeof window === 'undefined' || !window.kiro) {
        console.warn('Kiro IDE environment not detected - running in standalone mode');
        kiroIntegrationEnabled.value = false;
        return;
      }

      // Create and initialize Kiro integration service
      const integrationService = createKiroIntegrationService(kiroConfig.value);
      await integrationService.initialize();
      
      kiroIntegrationEnabled.value = true;
      console.log('Kiro integration initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Kiro integration:', error);
      kiroIntegrationEnabled.value = false;
      // Don't throw error for standalone usage
      console.warn('Continuing in standalone mode without Kiro integration');
    }
  };

  const cleanupKiroIntegration = async () => {
    try {
      if (kiroIntegrationEnabled.value) {
        const integrationService = getKiroIntegrationService();
        await integrationService.cleanup();
        kiroIntegrationEnabled.value = false;
        console.log('Kiro integration cleaned up');
      }
    } catch (error) {
      console.error('Failed to cleanup Kiro integration:', error);
    }
  };

  const updateKiroConfig = (newConfig: Partial<KiroIntegrationConfig>) => {
    kiroConfig.value = { ...kiroConfig.value, ...newConfig };
    
    // Save config to localStorage
    localStorage.setItem('kiro-kaiju-config', JSON.stringify(kiroConfig.value));
  };

  // Initialize app state
  const initializeApp = async () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('kiro-kaiju-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('auto');
    }

    // Load deployment mode preference
    const savedMode = localStorage.getItem('kiro-kaiju-deployment-mode') as DeploymentMode;
    if (savedMode && ['local', 'cloud'].includes(savedMode)) {
      await setDeploymentMode(savedMode);
    } else {
      // Auto-detect deployment mode - default to cloud for standalone usage
      const detectedMode = (typeof window !== 'undefined' && window.kiro) ? 'local' : 'cloud';
      await setDeploymentMode(detectedMode);
    }

    // Load Kiro config
    const savedConfig = localStorage.getItem('kiro-kaiju-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        kiroConfig.value = { ...defaultKiroConfig, ...parsedConfig };
      } catch (error) {
        console.warn('Failed to parse saved Kiro config:', error);
      }
    }

    // Set initial mobile state
    setMobile(window.innerWidth < 1024);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        setTheme('auto'); // Re-apply auto theme
      }
    });
  };

  return {
    // State
    theme,
    isMobile,
    currentView,
    isLoading,
    error,
    loadingMessage,
    deploymentMode,
    kiroIntegrationEnabled,
    kiroConfig,
    isMobileMenuOpen,
    isAIPanelOpen,
    isZoomPanelOpen,

    // Computed
    isDarkMode,
    isDesktop,

    // Actions
    setTheme,
    setMobile,
    setCurrentView,
    setLoading,
    setError,
    clearError,
    setDeploymentMode,
    initializeKiroIntegration,
    cleanupKiroIntegration,
    updateKiroConfig,
    toggleMobileMenu,
    closeMobileMenu,
    toggleAIPanel,
    toggleZoomPanel,
    closeMobilePanels,
    initializeApp
  };
});