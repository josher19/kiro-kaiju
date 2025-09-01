<template>
  <div class="grading-results bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
        AI Grading Results
      </h3>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatDate(results.gradingTimestamp) }}
        </span>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Overall Score -->
    <div class="mb-8">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
             :class="getScoreColorClass(results.averageScore)">
          <span class="text-3xl font-bold text-white">
            {{ results.averageScore }}
          </span>
        </div>
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Overall Score
        </h4>
        <p class="text-gray-600 dark:text-gray-400">
          {{ getScoreDescription(results.averageScore) }}
        </p>
      </div>
    </div>

    <!-- Individual Role Scores -->
    <div class="mb-8">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Individual Role Evaluations
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="evaluation in results.roleEvaluations"
          :key="evaluation.role"
          class="role-evaluation bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 rounded-full"
                   :class="getScoreColorClass(evaluation.score)">
              </div>
              <h5 class="font-semibold text-gray-900 dark:text-white">
                {{ formatRoleName(evaluation.role) }}
              </h5>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-2xl font-bold"
                    :class="getScoreTextColor(evaluation.score)">
                {{ evaluation.score }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                / 100
              </span>
            </div>
          </div>
          
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {{ evaluation.feedback }}
          </p>
          
          <div class="flex flex-wrap gap-1 mb-3">
            <span
              v-for="area in evaluation.focusAreas"
              :key="area"
              class="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
            >
              {{ area }}
            </span>
          </div>
          
          <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Model: {{ evaluation.modelUsed }}</span>
            <button
              @click="toggleDetailedAnalysis(evaluation.role)"
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ showDetailedAnalysis[evaluation.role] ? 'Hide' : 'Show' }} Details
            </button>
          </div>
          
          <!-- Detailed Analysis (Expandable) -->
          <div
            v-if="showDetailedAnalysis[evaluation.role]"
            class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600"
          >
            <h6 class="font-medium text-gray-900 dark:text-white mb-2">
              Detailed Analysis
            </h6>
            <div class="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {{ evaluation.detailedAnalysis }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overall Feedback -->
    <div class="mb-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Overall Feedback
      </h4>
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {{ results.overallFeedback }}
        </div>
      </div>
    </div>

    <!-- Auto-navigation Notice -->
    <div v-if="props.autoNavigateCountdown > 0" class="mb-8 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="text-blue-500 dark:text-blue-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <strong>Great job!</strong> Your progress has been saved. Navigating to Progress page in <strong>{{ props.autoNavigateCountdown }}</strong> seconds...
          </div>
        </div>
        <button
          @click="$emit('cancel-auto-navigate')"
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row gap-3">
      <button
        @click="$emit('save-to-history')"
        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        View My Progress
      </button>
      <button
        @click="$emit('view-history')"
        class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        View Grading History
      </button>
      <button
        @click="$emit('close')"
        class="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { AIGradingResponse } from '@/types/api';
import { GradingRole } from '@/types/api';

interface Props {
  results: AIGradingResponse;
  autoNavigateCountdown?: number;
}

const props = withDefaults(defineProps<Props>(), {
  autoNavigateCountdown: 0
});

defineEmits<{
  close: [];
  'save-to-history': [];
  'view-history': [];
  'cancel-auto-navigate': [];
}>();

// State for expandable detailed analysis
const showDetailedAnalysis = reactive<Record<string, boolean>>({});

const toggleDetailedAnalysis = (role: GradingRole) => {
  showDetailedAnalysis[role] = !showDetailedAnalysis[role];
};

const formatRoleName = (role: GradingRole): string => {
  const roleNames: Record<GradingRole, string> = {
    [GradingRole.DEVELOPER]: 'Developer',
    [GradingRole.ARCHITECT]: 'Architect',
    [GradingRole.SQA]: 'QA Engineer',
    [GradingRole.PRODUCT_OWNER]: 'Product Owner'
  };
  return roleNames[role] || role;
};

const getScoreColorClass = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-blue-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getScoreTextColor = (score: number): string => {
  if (score >= 90) return 'text-green-600 dark:text-green-400';
  if (score >= 75) return 'text-blue-600 dark:text-blue-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getScoreDescription = (score: number): string => {
  if (score >= 90) return 'Excellent work! Outstanding code quality across all areas.';
  if (score >= 75) return 'Good job! Solid implementation with room for minor improvements.';
  if (score >= 60) return 'Satisfactory work. Several areas could benefit from enhancement.';
  if (score >= 40) return 'Needs improvement. Focus on the feedback provided by each role.';
  return 'Significant improvements needed. Consider refactoring based on the detailed feedback.';
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};
</script>

<style scoped>
.grading-results {
  max-height: 90vh;
  overflow-y: auto;
}

.role-evaluation {
  transition: all 0.2s ease-in-out;
}

.role-evaluation:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .grading-results {
    max-height: 95vh;
    padding: 1rem;
  }
}
</style>