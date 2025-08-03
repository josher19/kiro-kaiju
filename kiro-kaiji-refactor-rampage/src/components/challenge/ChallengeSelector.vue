<template>
  <div class="challenge-selector bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
      Select Your Challenge
    </h2>
    
    <form @submit.prevent="handleGenerateChallenge" class="space-y-6">
      <!-- Programming Language Selection -->
      <div class="form-group">
        <label for="language" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Programming Language *
        </label>
        <select
          id="language"
          v-model="selectedLanguage"
          @change="handleLanguageChange"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Select a language...</option>
          <option 
            v-for="language in availableLanguages" 
            :key="language.value" 
            :value="language.value"
          >
            {{ language.label }}
          </option>
        </select>
      </div>

      <!-- Framework Selection (Optional) -->
      <div class="form-group">
        <label for="framework" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Framework (Optional)
        </label>
        <select
          id="framework"
          v-model="selectedFramework"
          :disabled="!selectedLanguage || (availableFrameworks || []).length === 0"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <option value="">No framework</option>
          <option 
            v-for="framework in availableFrameworkOptions" 
            :key="framework.value" 
            :value="framework.value"
          >
            {{ framework.label }}
          </option>
        </select>
        <p v-if="selectedLanguage && (availableFrameworks || []).length === 0" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No frameworks available for {{ getLanguageLabel(selectedLanguage) }}
        </p>
      </div>

      <!-- Challenge Category Selection -->
      <div class="form-group">
        <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Challenge Category *
        </label>
        <select
          id="category"
          v-model="selectedCategory"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Select a category...</option>
          <option 
            v-for="category in availableCategories" 
            :key="category.value" 
            :value="category.value"
          >
            {{ category.label }}
          </option>
        </select>
      </div>

      <!-- Difficulty Level Selection -->
      <div class="form-group">
        <label for="difficulty" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Difficulty Level *
        </label>
        <select
          id="difficulty"
          v-model="selectedDifficulty"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Select difficulty...</option>
          <option 
            v-for="difficulty in availableDifficulties" 
            :key="difficulty.value" 
            :value="difficulty.value"
          >
            {{ difficulty.label }}
          </option>
        </select>
      </div>

      <!-- Error Message -->
      <div v-if="generationError" class="error-message bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
        <p class="text-sm text-red-600 dark:text-red-400">{{ generationError }}</p>
      </div>

      <!-- Generate Challenge Button -->
      <div class="form-actions">
        <button
          type="submit"
          :disabled="!canGenerate"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span v-if="isGenerating" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Challenge...
          </span>
          <span v-else>Generate Challenge</span>
        </button>
      </div>

      <!-- Reset Button -->
      <div class="form-actions">
        <button
          type="button"
          @click="handleReset"
          :disabled="isGenerating"
          class="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset Selection
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useChallengeStore } from '@/stores/challengeStore';
import { 
  ProgrammingLanguage, 
  Framework, 
  ChallengeCategory, 
  DifficultyLevel 
} from '@/types';

// Store
const challengeStore = useChallengeStore();

// Local reactive state for form inputs
const selectedLanguage = ref<ProgrammingLanguage | ''>('');
const selectedFramework = ref<Framework | ''>('');
const selectedCategory = ref<ChallengeCategory | ''>('');
const selectedDifficulty = ref<DifficultyLevel | ''>('');

// Computed properties from store
const { availableFrameworks, isConfigValid, canGenerate, isGenerating, generationError } = storeToRefs(challengeStore);

// Available options for dropdowns
const availableLanguages = computed(() => [
  { value: ProgrammingLanguage.JAVASCRIPT, label: 'JavaScript' },
  { value: ProgrammingLanguage.TYPESCRIPT, label: 'TypeScript' },
  { value: ProgrammingLanguage.PYTHON, label: 'Python' },
  { value: ProgrammingLanguage.JAVA, label: 'Java' },
  { value: ProgrammingLanguage.CSHARP, label: 'C#' },
  { value: ProgrammingLanguage.CPP, label: 'C++' },
  { value: ProgrammingLanguage.GO, label: 'Go' },
  { value: ProgrammingLanguage.RUST, label: 'Rust' }
]);

const availableFrameworkOptions = computed(() => {
  const frameworkLabels: Record<Framework, string> = {
    [Framework.VUE]: 'Vue.js',
    [Framework.REACT]: 'React',
    [Framework.ANGULAR]: 'Angular',
    [Framework.SVELTE]: 'Svelte',
    [Framework.NODE]: 'Node.js',
    [Framework.EXPRESS]: 'Express.js',
    [Framework.DJANGO]: 'Django',
    [Framework.FLASK]: 'Flask',
    [Framework.FASTAPI]: 'FastAPI',
    [Framework.SPRING]: 'Spring',
    [Framework.SPRING_BOOT]: 'Spring Boot',
    [Framework.DOTNET]: '.NET',
    [Framework.ASP_NET]: 'ASP.NET'
  };

  return (availableFrameworks.value || []).map(framework => ({
    value: framework,
    label: frameworkLabels[framework]
  }));
});

const availableCategories = computed(() => [
  { value: ChallengeCategory.REFACTORING, label: 'Refactoring' },
  { value: ChallengeCategory.BUG_FIXING, label: 'Bug Fixing' },
  { value: ChallengeCategory.FEATURE_ADDITION, label: 'Feature Addition' },
  { value: ChallengeCategory.PERFORMANCE_OPTIMIZATION, label: 'Performance Optimization' },
  { value: ChallengeCategory.CODE_REVIEW, label: 'Code Review' },
  { value: ChallengeCategory.TESTING, label: 'Testing' },
  { value: ChallengeCategory.ARCHITECTURE, label: 'Architecture' }
]);

const availableDifficulties = computed(() => [
  { value: DifficultyLevel.BEGINNER, label: 'Beginner (1/5)' },
  { value: DifficultyLevel.INTERMEDIATE, label: 'Intermediate (2/5)' },
  { value: DifficultyLevel.ADVANCED, label: 'Advanced (3/5)' },
  { value: DifficultyLevel.EXPERT, label: 'Expert (4/5)' },
  { value: DifficultyLevel.LEGENDARY, label: 'Legendary (5/5)' }
]);

// Helper function to get language label
const getLanguageLabel = (language: ProgrammingLanguage) => {
  const languageOption = availableLanguages.value.find(l => l.value === language);
  return languageOption?.label || language;
};

// Event handlers
const handleLanguageChange = () => {
  if (selectedLanguage.value) {
    challengeStore.updateLanguage(selectedLanguage.value as ProgrammingLanguage);
  }
};

const handleGenerateChallenge = async () => {
  await challengeStore.generateChallenge();
};

const handleReset = () => {
  selectedLanguage.value = '';
  selectedFramework.value = '';
  selectedCategory.value = '';
  selectedDifficulty.value = '';
  challengeStore.resetConfig();
};

// Watchers to sync local state with store
watch(selectedFramework, (newFramework) => {
  challengeStore.updateFramework(newFramework as Framework || undefined);
});

watch(selectedCategory, (newCategory) => {
  if (newCategory) {
    challengeStore.updateCategory(newCategory as ChallengeCategory);
  }
});

watch(selectedDifficulty, (newDifficulty) => {
  if (newDifficulty) {
    challengeStore.updateDifficulty(newDifficulty as DifficultyLevel);
  }
});

// Clear framework when language changes and framework is no longer available
watch(availableFrameworks, (newFrameworks) => {
  if (selectedFramework.value && !newFrameworks.includes(selectedFramework.value as Framework)) {
    selectedFramework.value = '';
  }
});
</script>

<style scoped>
.challenge-selector {
  /* Component-specific styles if needed */
}

.form-group {
  /* Form group styles */
}

.error-message {
  /* Error message styles */
}

.form-actions {
  /* Form action styles */
}

/* Loading spinner animation is handled by Tailwind classes */
</style>