/**
 * Challenge Store
 * 
 * Pinia store for managing challenge configuration, generation,
 * and current challenge state
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  type ChallengeConfig, 
  type Challenge, 
  ProgrammingLanguage, 
  Framework, 
  ChallengeCategory, 
  DifficultyLevel 
} from '@/types';

export const useChallengeStore = defineStore('challenge', () => {
  // State
  const currentConfig = ref<Partial<ChallengeConfig>>({});
  const currentChallenge = ref<Challenge | null>(null);
  const activeChallenges = ref<Challenge[]>([]);
  const isGenerating = ref(false);
  const generationError = ref<string | null>(null);

  // Framework mappings for dynamic filtering
  const frameworkMappings: Record<ProgrammingLanguage, Framework[]> = {
    [ProgrammingLanguage.JAVASCRIPT]: [
      Framework.VUE,
      Framework.REACT,
      Framework.ANGULAR,
      Framework.SVELTE,
      Framework.NODE,
      Framework.EXPRESS
    ],
    [ProgrammingLanguage.TYPESCRIPT]: [
      Framework.VUE,
      Framework.REACT,
      Framework.ANGULAR,
      Framework.SVELTE,
      Framework.NODE,
      Framework.EXPRESS
    ],
    [ProgrammingLanguage.PYTHON]: [
      Framework.DJANGO,
      Framework.FLASK,
      Framework.FASTAPI
    ],
    [ProgrammingLanguage.JAVA]: [
      Framework.SPRING,
      Framework.SPRING_BOOT
    ],
    [ProgrammingLanguage.CSHARP]: [
      Framework.DOTNET,
      Framework.ASP_NET
    ],
    [ProgrammingLanguage.CPP]: [],
    [ProgrammingLanguage.GO]: [],
    [ProgrammingLanguage.RUST]: []
  };

  // Computed
  const availableFrameworks = computed(() => {
    if (!currentConfig.value.language) return [];
    return frameworkMappings[currentConfig.value.language] || [];
  });

  const isConfigValid = computed(() => {
    return !!(
      currentConfig.value.language &&
      currentConfig.value.category &&
      currentConfig.value.difficulty
    );
  });

  const canGenerate = computed(() => {
    return isConfigValid.value && !isGenerating.value;
  });

  // Actions
  const updateLanguage = (language: ProgrammingLanguage) => {
    currentConfig.value.language = language;
    // Clear framework if it's not available for the new language
    if (currentConfig.value.framework && 
        !availableFrameworks.value.includes(currentConfig.value.framework)) {
      currentConfig.value.framework = undefined;
    }
  };

  const updateFramework = (framework: Framework | undefined) => {
    currentConfig.value.framework = framework;
  };

  const updateCategory = (category: ChallengeCategory) => {
    currentConfig.value.category = category;
  };

  const updateDifficulty = (difficulty: DifficultyLevel) => {
    currentConfig.value.difficulty = difficulty;
  };

  const resetConfig = () => {
    currentConfig.value = {};
    generationError.value = null;
  };

  const generateChallenge = async () => {
    if (!isConfigValid.value) {
      generationError.value = 'Please complete all required fields';
      return null;
    }

    isGenerating.value = true;
    generationError.value = null;

    try {
      // Import challenge service dynamically to avoid circular dependencies
      const { challengeService } = await import('@/services/challengeService');
      
      const response = await challengeService.generateChallenge({
        config: currentConfig.value as ChallengeConfig
      });
      
      const newChallenge = response.challenge;
      
      // Add to active challenges
      activeChallenges.value.push(newChallenge);
      
      // Set as current challenge
      currentChallenge.value = newChallenge;
      
      // Reset config after successful generation
      currentConfig.value = {};
      
      return newChallenge;
    } catch (error) {
      generationError.value = error instanceof Error ? error.message : 'Failed to generate challenge';
      console.error('Challenge generation error:', error);
      return null;
    } finally {
      isGenerating.value = false;
    }
  };

  const setCurrentChallenge = (challenge: Challenge) => {
    currentChallenge.value = challenge;
  };

  const removeChallenge = (challengeId: string) => {
    const index = activeChallenges.value.findIndex(c => c.id === challengeId);
    if (index !== -1) {
      activeChallenges.value.splice(index, 1);
      
      // If we removed the current challenge, set a new one or null
      if (currentChallenge.value?.id === challengeId) {
        currentChallenge.value = activeChallenges.value.length > 0 
          ? activeChallenges.value[0] 
          : null;
      }
    }
  };

  const clearAllChallenges = () => {
    activeChallenges.value = [];
    currentChallenge.value = null;
  };

  return {
    // State
    currentConfig,
    currentChallenge,
    activeChallenges,
    isGenerating,
    generationError,
    
    // Computed
    availableFrameworks,
    isConfigValid,
    canGenerate,
    
    // Actions
    updateLanguage,
    updateFramework,
    updateCategory,
    updateDifficulty,
    resetConfig,
    generateChallenge,
    setCurrentChallenge,
    removeChallenge,
    clearAllChallenges
  };
});