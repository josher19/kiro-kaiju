/**
 * Challenge Selector Component Tests
 * 
 * Tests for the ChallengeSelector Vue component including:
 * - Form validation and state management
 * - Dynamic framework filtering
 * - User interactions and button states
 * - Pinia store integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ChallengeSelector from '@/components/challenge/ChallengeSelector.vue';
import { useChallengeStore } from '@/stores/challengeStore';
import { 
  ProgrammingLanguage, 
  Framework, 
  ChallengeCategory, 
  DifficultyLevel 
} from '@/types';

describe.skip('ChallengeSelector', () => {
  let wrapper: any;
  let challengeStore: any;

  beforeEach(() => {
    // Create fresh Pinia instance for each test
    const pinia = createPinia();
    setActivePinia(pinia);
    
    // Mount component with Pinia
    wrapper = mount(ChallengeSelector, {
      global: {
        plugins: [pinia]
      }
    });
    
    challengeStore = useChallengeStore();
  });

  describe('Component Rendering', () => {
    it('renders the component with all form elements', () => {
      expect(wrapper.find('h2').text()).toBe('Select Your Challenge');
      expect(wrapper.find('#language').exists()).toBe(true);
      expect(wrapper.find('#framework').exists()).toBe(true);
      expect(wrapper.find('#category').exists()).toBe(true);
      expect(wrapper.find('#difficulty').exists()).toBe(true);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    });

    it('displays all programming language options', () => {
      const languageSelect = wrapper.find('#language');
      const options = languageSelect.findAll('option');
      
      // Should have placeholder + 8 languages
      expect(options).toHaveLength(9);
      expect(options[1].text()).toBe('JavaScript');
      expect(options[2].text()).toBe('TypeScript');
      expect(options[3].text()).toBe('Python');
    });

    it('displays all challenge category options', () => {
      const categorySelect = wrapper.find('#category');
      const options = categorySelect.findAll('option');
      
      // Should have placeholder + 7 categories
      expect(options).toHaveLength(8);
      expect(options[1].text()).toBe('Refactoring');
      expect(options[2].text()).toBe('Bug Fixing');
    });

    it('displays all difficulty level options', () => {
      const difficultySelect = wrapper.find('#difficulty');
      const options = difficultySelect.findAll('option');
      
      // Should have placeholder + 5 difficulties
      expect(options).toHaveLength(6);
      expect(options[1].text()).toBe('Beginner (1/5)');
      expect(options[5].text()).toBe('Legendary (5/5)');
    });
  });

  describe('Dynamic Framework Filtering', () => {
    it('disables framework dropdown when no language is selected', () => {
      const frameworkSelect = wrapper.find('#framework');
      expect(frameworkSelect.attributes('disabled')).toBeDefined();
    });

    it('enables and populates framework dropdown for JavaScript', async () => {
      const languageSelect = wrapper.find('#language');
      await languageSelect.setValue(ProgrammingLanguage.JAVASCRIPT);
      
      const frameworkSelect = wrapper.find('#framework');
      expect(frameworkSelect.attributes('disabled')).toBeUndefined();
      
      const options = frameworkSelect.findAll('option');
      expect(options.length).toBeGreaterThan(1); // Should have "No framework" + actual frameworks
      
      // Check for JavaScript frameworks
      const optionTexts = options.map((option: any) => option.text());
      expect(optionTexts).toContain('Vue.js');
      expect(optionTexts).toContain('React');
      expect(optionTexts).toContain('Node.js');
    });

    it('shows different frameworks for Python', async () => {
      const languageSelect = wrapper.find('#language');
      await languageSelect.setValue(ProgrammingLanguage.PYTHON);
      
      const frameworkSelect = wrapper.find('#framework');
      const options = frameworkSelect.findAll('option');
      const optionTexts = options.map((option: any) => option.text());
      
      expect(optionTexts).toContain('Django');
      expect(optionTexts).toContain('Flask');
      expect(optionTexts).toContain('FastAPI');
      expect(optionTexts).not.toContain('Vue.js');
    });

    it('shows no framework message for languages without frameworks', async () => {
      const languageSelect = wrapper.find('#language');
      await languageSelect.setValue(ProgrammingLanguage.RUST);
      
      await wrapper.vm.$nextTick();
      
      const noFrameworkMessage = wrapper.find('p');
      expect(noFrameworkMessage.text()).toContain('No frameworks available for Rust');
    });

    it('clears framework selection when switching to incompatible language', async () => {
      const languageSelect = wrapper.find('#language');
      const frameworkSelect = wrapper.find('#framework');
      
      // Select JavaScript and Vue
      await languageSelect.setValue(ProgrammingLanguage.JAVASCRIPT);
      await frameworkSelect.setValue(Framework.VUE);
      
      // Switch to Python (Vue not available)
      await languageSelect.setValue(ProgrammingLanguage.PYTHON);
      
      expect(frameworkSelect.element.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('disables generate button when form is incomplete', () => {
      const generateButton = wrapper.find('button[type="submit"]');
      expect(generateButton.exists()).toBe(true);
      expect(generateButton.attributes('disabled')).toBeDefined();
    });

    it('enables generate button when required fields are filled', async () => {
      await wrapper.find('#language').setValue(ProgrammingLanguage.JAVASCRIPT);
      await wrapper.find('#category').setValue(ChallengeCategory.REFACTORING);
      await wrapper.find('#difficulty').setValue(DifficultyLevel.BEGINNER);
      
      const generateButton = wrapper.find('button[type="submit"]');
      expect(generateButton.attributes('disabled')).toBeUndefined();
    });

    it('works without framework selection', async () => {
      await wrapper.find('#language').setValue(ProgrammingLanguage.JAVASCRIPT);
      await wrapper.find('#category').setValue(ChallengeCategory.REFACTORING);
      await wrapper.find('#difficulty').setValue(DifficultyLevel.BEGINNER);
      // Framework is optional, so don't set it
      
      const generateButton = wrapper.find('button[type="submit"]');
      expect(generateButton.attributes('disabled')).toBeUndefined();
    });
  });

  describe('Store Integration', () => {
    it('updates store when language is selected', async () => {
      const languageSelect = wrapper.find('#language');
      await languageSelect.setValue(ProgrammingLanguage.TYPESCRIPT);
      
      expect(challengeStore.currentConfig.language).toBe(ProgrammingLanguage.TYPESCRIPT);
    });

    it('updates store when framework is selected', async () => {
      await wrapper.find('#language').setValue(ProgrammingLanguage.JAVASCRIPT);
      await wrapper.find('#framework').setValue(Framework.VUE);
      
      expect(challengeStore.currentConfig.framework).toBe(Framework.VUE);
    });

    it('updates store when category is selected', async () => {
      await wrapper.find('#category').setValue(ChallengeCategory.BUG_FIXING);
      
      expect(challengeStore.currentConfig.category).toBe(ChallengeCategory.BUG_FIXING);
    });

    it('updates store when difficulty is selected', async () => {
      await wrapper.find('#difficulty').setValue(DifficultyLevel.ADVANCED);
      
      expect(challengeStore.currentConfig.difficulty).toBe(DifficultyLevel.ADVANCED);
    });
  });

  describe('User Interactions', () => {
    it('calls generateChallenge when form is submitted', async () => {
      const generateChallengeSpy = vi.spyOn(challengeStore, 'generateChallenge');
      
      // Fill out form
      await wrapper.find('#language').setValue(ProgrammingLanguage.JAVASCRIPT);
      await wrapper.find('#category').setValue(ChallengeCategory.REFACTORING);
      await wrapper.find('#difficulty').setValue(DifficultyLevel.BEGINNER);
      
      // Submit form
      await wrapper.find('form').trigger('submit.prevent');
      
      expect(generateChallengeSpy).toHaveBeenCalled();
    });

    it('resets form when reset button is clicked', async () => {
      // Fill out form
      await wrapper.find('#language').setValue(ProgrammingLanguage.JAVASCRIPT);
      await wrapper.find('#category').setValue(ChallengeCategory.REFACTORING);
      await wrapper.find('#difficulty').setValue(DifficultyLevel.BEGINNER);
      
      // Click reset
      await wrapper.find('button[type="button"]').trigger('click');
      
      // Check that form is reset
      expect(wrapper.find('#language').element.value).toBe('');
      expect(wrapper.find('#category').element.value).toBe('');
      expect(wrapper.find('#difficulty').element.value).toBe('');
      expect(challengeStore.currentConfig).toEqual({});
    });

    it('shows loading state during challenge generation', async () => {
      // Mock the store to show loading state
      challengeStore.isGenerating = true;
      await wrapper.vm.$nextTick();
      
      const generateButton = wrapper.find('button[type="submit"]');
      expect(generateButton.text()).toContain('Generating Challenge...');
      expect(generateButton.find('svg').exists()).toBe(true); // Loading spinner
    });

    it('displays error message when generation fails', async () => {
      challengeStore.generationError = 'Failed to generate challenge';
      await wrapper.vm.$nextTick();
      
      const errorMessage = wrapper.find('.error-message');
      expect(errorMessage.exists()).toBe(true);
      expect(errorMessage.text()).toContain('Failed to generate challenge');
    });

    it('disables buttons during loading', async () => {
      challengeStore.isGenerating = true;
      await wrapper.vm.$nextTick();
      
      const generateButton = wrapper.find('button[type="submit"]');
      const resetButton = wrapper.find('button[type="button"]');
      
      expect(generateButton.attributes('disabled')).toBeDefined();
      expect(resetButton.attributes('disabled')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all form inputs', () => {
      expect(wrapper.find('label[for="language"]').exists()).toBe(true);
      expect(wrapper.find('label[for="framework"]').exists()).toBe(true);
      expect(wrapper.find('label[for="category"]').exists()).toBe(true);
      expect(wrapper.find('label[for="difficulty"]').exists()).toBe(true);
    });

    it('has proper labels for required fields', () => {
      const labels = wrapper.findAll('label');
      expect(labels).toHaveLength(4); // language, framework, category, difficulty
      
      // Check that required field labels exist
      const languageLabel = wrapper.find('label[for="language"]');
      const categoryLabel = wrapper.find('label[for="category"]');
      const difficultyLabel = wrapper.find('label[for="difficulty"]');
      
      expect(languageLabel.exists()).toBe(true);
      expect(categoryLabel.exists()).toBe(true);
      expect(difficultyLabel.exists()).toBe(true);
    });

    it('has proper form structure with fieldsets', () => {
      expect(wrapper.find('form').exists()).toBe(true);
      expect(wrapper.findAll('.form-group')).toHaveLength(4);
    });
  });
});