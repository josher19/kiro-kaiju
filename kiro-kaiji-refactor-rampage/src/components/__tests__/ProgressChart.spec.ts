/**
 * Progress Chart Component Tests
 * 
 * Tests for the progress visualization chart component
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressChart from '../progress/ProgressChart.vue';

describe('ProgressChart', () => {
  it('renders correctly with empty scores', () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [],
        improvementTrend: 'stable'
      }
    });

    expect(wrapper.find('.progress-chart').exists()).toBe(true);
    expect(wrapper.find('h3').text()).toBe('Performance Trend');
  });

  it('renders chart with score data', () => {
    const scores = [60, 70, 80, 85, 90];
    const wrapper = mount(ProgressChart, {
      props: {
        scores,
        improvementTrend: 'improving'
      }
    });

    // Should render SVG chart
    expect(wrapper.find('svg').exists()).toBe(true);
    
    // Should render data points
    const circles = wrapper.findAll('circle');
    expect(circles.length).toBe(scores.length);
    
    // Should render trend line
    expect(wrapper.find('polyline').exists()).toBe(true);
  });

  it('displays correct improvement trend text', () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [70, 75, 80],
        improvementTrend: 'improving'
      }
    });

    expect(wrapper.text()).toContain('📈 Improving');
  });

  it('displays declining trend correctly', () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [90, 80, 70],
        improvementTrend: 'declining'
      }
    });

    expect(wrapper.text()).toContain('📉 Needs Focus');
  });

  it('displays stable trend correctly', () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [75, 74, 76],
        improvementTrend: 'stable'
      }
    });

    expect(wrapper.text()).toContain('📊 Stable');
  });

  it('limits display to last 10 scores', () => {
    const scores = Array.from({ length: 15 }, (_, i) => 60 + i * 2);
    const wrapper = mount(ProgressChart, {
      props: {
        scores,
        improvementTrend: 'improving'
      }
    });

    // Should only render 10 data points
    const circles = wrapper.findAll('circle');
    expect(circles.length).toBe(10);
  });

  it('shows correct legend items', () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [85],
        improvementTrend: 'stable'
      }
    });

    expect(wrapper.text()).toContain('Excellent (90+)');
    expect(wrapper.text()).toContain('Good (70-89)');
    expect(wrapper.text()).toContain('Fair (50-69)');
    expect(wrapper.text()).toContain('Needs Work (<50)');
  });

  it('handles single score correctly', () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [85],
        improvementTrend: 'stable'
      }
    });

    // Should render one data point
    const circles = wrapper.findAll('circle');
    expect(circles.length).toBe(1);
    
    // Should not render trend line (needs at least 2 points)
    expect(wrapper.find('polyline').exists()).toBe(false);
  });

  it('shows tooltip on hover', async () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [75, 80, 85],
        improvementTrend: 'improving'
      }
    });

    const firstCircle = wrapper.find('circle');
    await firstCircle.trigger('mouseenter');

    // Tooltip should be visible
    expect(wrapper.find('.absolute.z-10').exists()).toBe(true);
  });

  it('hides tooltip on mouse leave', async () => {
    const wrapper = mount(ProgressChart, {
      props: {
        scores: [75, 80, 85],
        improvementTrend: 'improving'
      }
    });

    const firstCircle = wrapper.find('circle');
    await firstCircle.trigger('mouseenter');
    await firstCircle.trigger('mouseleave');

    // Tooltip should be hidden
    expect(wrapper.find('.absolute.z-10').exists()).toBe(false);
  });
});