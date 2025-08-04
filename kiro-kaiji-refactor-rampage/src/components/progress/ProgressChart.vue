<template>
  <div class="progress-chart bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      Performance Trend
    </h3>
    
    <!-- Chart Container -->
    <div class="relative h-64 mb-4">
      <svg 
        class="w-full h-full" 
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Grid lines -->
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path 
              d="M 40 0 L 0 0 0 20" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="0.5" 
              class="text-gray-300 dark:text-gray-600"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Y-axis labels -->
        <g class="text-xs fill-current text-gray-600 dark:text-gray-400">
          <text x="10" y="15" text-anchor="middle">100</text>
          <text x="10" y="55" text-anchor="middle">75</text>
          <text x="10" y="95" text-anchor="middle">50</text>
          <text x="10" y="135" text-anchor="middle">25</text>
          <text x="10" y="175" text-anchor="middle">0</text>
        </g>
        
        <!-- Trend line -->
        <polyline
          v-if="parsedPoints.length > 1"
          :points="chartPoints"
          fill="none"
          stroke="url(#gradient)"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="drop-shadow-sm"
        />
        
        <!-- Data points -->
        <g v-for="(point, index) in parsedPoints" :key="index">
          <circle
            :cx="point.x"
            :cy="point.y"
            r="4"
            :fill="getPointColor(point.score)"
            stroke="white"
            stroke-width="2"
            class="drop-shadow-sm cursor-pointer hover:r-6 transition-all"
            @mouseenter="showTooltip(index, point, $event)"
            @mouseleave="hideTooltip"
          />
        </g>
        
        <!-- Gradient definition -->
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :style="`stop-color:${trendColor};stop-opacity:0.8`" />
            <stop offset="100%" :style="`stop-color:${trendColor};stop-opacity:1`" />
          </linearGradient>
        </defs>
      </svg>
      
      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        class="absolute z-10 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 pointer-events-none"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="font-semibold">Challenge {{ tooltip.index + 1 }}</div>
        <div>Score: {{ Math.round(tooltip.score) }}%</div>
      </div>
    </div>
    
    <!-- Chart Legend -->
    <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Excellent (90+)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Good (70-89)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Fair (50-69)</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Needs Work (<50)</span>
        </div>
      </div>
      
      <div class="text-right">
        <div class="font-medium">
          {{ improvementTrendText }}
        </div>
        <div class="text-xs">
          Last {{ Math.min(scores.length, 10) }} challenges
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue';

interface Props {
  scores: number[];
  improvementTrend: 'improving' | 'declining' | 'stable';
}

const props = withDefaults(defineProps<Props>(), {
  scores: () => [],
  improvementTrend: 'stable'
});

// Tooltip state
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  index: 0,
  score: 0
});

// Chart dimensions
const chartWidth = 380;
const chartHeight = 180;
const padding = 20;

// Computed properties
const parsedPoints = computed(() => {
  if (props.scores.length === 0) return [];
  
  const points = props.scores.slice(-10); // Show last 10 scores
  const stepX = (chartWidth - padding * 2) / Math.max(points.length - 1, 1);
  
  return points.map((score, index) => ({
    x: padding + (index * stepX),
    y: chartHeight - padding - ((score / 100) * (chartHeight - padding * 2)),
    score
  }));
});

const chartPoints = computed(() => {
  return parsedPoints.value.map(point => `${point.x},${point.y}`).join(' ');
});

const trendColor = computed(() => {
  switch (props.improvementTrend) {
    case 'improving': return '#10b981'; // green-500
    case 'declining': return '#ef4444'; // red-500
    default: return '#6b7280'; // gray-500
  }
});

const improvementTrendText = computed(() => {
  switch (props.improvementTrend) {
    case 'improving': return '📈 Improving';
    case 'declining': return '📉 Needs Focus';
    default: return '📊 Stable';
  }
});

// Helper functions
const getPointColor = (score: number): string => {
  if (score >= 90) return '#10b981'; // green-500
  if (score >= 70) return '#3b82f6'; // blue-500
  if (score >= 50) return '#f59e0b'; // yellow-500
  return '#ef4444'; // red-500
};

const showTooltip = (index: number, point: { x: number; y: number; score: number }, event: MouseEvent) => {
  const rect = (event.target as Element).getBoundingClientRect();
  tooltip.visible = true;
  tooltip.x = point.x + 10;
  tooltip.y = point.y - 40;
  tooltip.index = props.scores.length - Math.min(props.scores.length, 10) + index;
  tooltip.score = point.score;
};

const hideTooltip = () => {
  tooltip.visible = false;
};
</script>

<style scoped>
.progress-chart svg {
  overflow: visible;
}

.progress-chart circle:hover {
  r: 6;
}
</style>