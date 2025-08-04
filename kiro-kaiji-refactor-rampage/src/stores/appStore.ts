/**
 * App Store
 * 
 * Pinia store for managing global application state including
 * theme, mobile detection, and general UI state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';
export type ViewType = 'challenges' | 'coding' | 'progress';

export const useAppStore = defineStore('app', () => {
  // State
  const theme = ref<Theme>('auto');
  const isMobile = ref(false);
  const currentView = ref<ViewType>('challenges');
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const loadingMessage = ref('Loading...');

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

  // Initialize app state
  const initializeApp = () => {
    // Load theme preference
    const savedTheme = localStorage.getItem('kiro-kaiju-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('auto');
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
    toggleMobileMenu,
    closeMobileMenu,
    toggleAIPanel,
    toggleZoomPanel,
    closeMobilePanels,
    initializeApp
  };
});