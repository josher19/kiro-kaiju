/**
 * GradingResults Component Tests
 * 
 * Tests for the AI grading results display component
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import GradingResults from '@/components/challenge/GradingResults.vue';
import { GradingRole } from '@/types/api';
import type { AIGradingResponse } from '@/types/api';

describe.skip('GradingResults', () => {
  const mockGradingResults: AIGradingResponse = {
    success: true,
    challengeId: 'test-challenge-1',
    roleEvaluations: [
      {
        role: GradingRole.DEVELOPER,
        modelUsed: 'test-model-1',
        score: 85,
        feedback: 'Good code quality with proper error handling. Consider improving modularity.',
        detailedAnalysis: 'The code demonstrates solid understanding of best practices. Areas for improvement include: 1. Better separation of concerns 2. More comprehensive error handling 3. Additional unit tests',
        focusAreas: ['code quality', 'best practices', 'maintainability'],
        timestamp: new Date('2024-01-15T10:30:00Z')
      },
      {
        role: GradingRole.ARCHITECT,
        modelUsed: 'test-model-2',
        score: 78,
        feedback: 'Architectural decisions are sound but could benefit from better design patterns.',
        detailedAnalysis: 'The system design shows good understanding of architectural principles. Recommendations: 1. Implement more design patterns 2. Improve scalability considerations 3. Better dependency management',
        focusAreas: ['system design', 'scalability', 'design patterns'],
        timestamp: new Date('2024-01-15T10:31:00Z')
      },
      {
        role: GradingRole.SQA,
        modelUsed: 'test-model-3',
        score: 92,
        feedback: 'Excellent attention to quality with comprehensive edge case handling.',
        detailedAnalysis: 'Quality assurance aspects are well handled. Strengths: 1. Good edge case coverage 2. Proper input validation 3. Robust error handling',
        focusAreas: ['defect detection', 'edge cases', 'testing coverage'],
        timestamp: new Date('2024-01-15T10:32:00Z')
      },
      {
        role: GradingRole.PRODUCT_OWNER,
        modelUsed: 'test-model-4',
        score: 88,
        feedback: 'Requirements are well met with good user experience considerations.',
        detailedAnalysis: 'Business requirements are properly addressed. Highlights: 1. All requirements fulfilled 2. Good user experience 3. Clear business value delivery',
        focusAreas: ['requirement fulfillment', 'user experience', 'business value'],
        timestamp: new Date('2024-01-15T10:33:00Z')
      }
    ],
    averageScore: 86,
    overallFeedback: '👍 Good job! Your code shows solid understanding with room for some improvements.\n\n**Overall Score: 86/100**\n**Individual Role Scores:** developer: 85, architect: 78, sqa: 92, product-owner: 88\n\n**Key Insights:**\n• **DEVELOPER**: Good code quality with proper error handling.\n• **ARCHITECT**: Architectural decisions are sound but could benefit from better design patterns.\n• **SQA**: Excellent attention to quality with comprehensive edge case handling.\n• **PRODUCT_OWNER**: Requirements are well met with good user experience considerations.',
    gradingTimestamp: new Date('2024-01-15T10:30:00Z')
  };

  const createWrapper = (props = {}) => {
    return mount(GradingResults, {
      props: {
        results: mockGradingResults,
        ...props
      }
    });
  };

  describe('Component Rendering', () => {
    it('should render the component with grading results', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('.grading-results').exists()).toBe(true);
      expect(wrapper.find('h3').text()).toBe('AI Grading Results');
    });

    it('should display the overall score prominently', () => {
      const wrapper = createWrapper();

      const overallScore = wrapper.find('.text-3xl.font-bold');
      expect(overallScore.text()).toBe('86');
    });

    it('should display the correct score description for good scores', () => {
      const wrapper = createWrapper();

      const description = wrapper.find('p.text-gray-600');
      expect(description.text()).toContain('Solid implementation with room for minor improvements');
    });

    it('should display all role evaluations', () => {
      const wrapper = createWrapper();

      const roleEvaluations = wrapper.findAll('.role-evaluation');
      expect(roleEvaluations).toHaveLength(4);
    });

    it('should display formatted role names correctly', () => {
      const wrapper = createWrapper();

      const roleNames = wrapper.findAll('.role-evaluation h5');
      expect(roleNames[0].text()).toBe('Developer');
      expect(roleNames[1].text()).toBe('Architect');
      expect(roleNames[2].text()).toBe('QA Engineer');
      expect(roleNames[3].text()).toBe('Product Owner');
    });

    it('should display individual role scores', () => {
      const wrapper = createWrapper();

      const scores = wrapper.findAll('.role-evaluation .text-2xl.font-bold');
      expect(scores[0].text()).toBe('85');
      expect(scores[1].text()).toBe('78');
      expect(scores[2].text()).toBe('92');
      expect(scores[3].text()).toBe('88');
    });

    it('should display role feedback', () => {
      const wrapper = createWrapper();

      const feedbacks = wrapper.findAll('.role-evaluation .text-sm.text-gray-600');
      expect(feedbacks[0].text()).toContain('Good code quality with proper error handling');
      expect(feedbacks[1].text()).toContain('Architectural decisions are sound');
      expect(feedbacks[2].text()).toContain('Excellent attention to quality');
      expect(feedbacks[3].text()).toContain('Requirements are well met');
    });

    it('should display focus areas as tags', () => {
      const wrapper = createWrapper();

      const focusAreaTags = wrapper.findAll('.role-evaluation .inline-block.px-2.py-1');
      expect(focusAreaTags.length).toBeGreaterThan(0);
      
      // Check first role's focus areas
      const firstRoleTags = wrapper.findAll('.role-evaluation')[0].findAll('.inline-block.px-2.py-1');
      expect(firstRoleTags[0].text()).toBe('code quality');
      expect(firstRoleTags[1].text()).toBe('best practices');
      expect(firstRoleTags[2].text()).toBe('maintainability');
    });

    it('should display model information', () => {
      const wrapper = createWrapper();

      const modelInfo = wrapper.findAll('.role-evaluation .text-xs.text-gray-500');
      expect(modelInfo[0].text()).toContain('Model: test-model-1');
    });

    it('should display overall feedback', () => {
      const wrapper = createWrapper();

      const overallFeedback = wrapper.find('.whitespace-pre-wrap');
      expect(overallFeedback.text()).toContain('Good job!');
      expect(overallFeedback.text()).toContain('Overall Score: 86/100');
    });

    it('should format timestamp correctly', () => {
      const wrapper = createWrapper();

      const timestamp = wrapper.find('.text-sm.text-gray-500');
      expect(timestamp.text()).toMatch(/Jan 15, 2024/);
    });
  });

  describe('Score Color Coding', () => {
    it('should apply correct color class for excellent scores (90+)', () => {
      const excellentResults = {
        ...mockGradingResults,
        averageScore: 95,
        roleEvaluations: [
          { ...mockGradingResults.roleEvaluations[0], score: 95 }
        ]
      };

      const wrapper = createWrapper({ results: excellentResults });
      const scoreCircle = wrapper.find('.w-24.h-24.rounded-full');
      expect(scoreCircle.classes()).toContain('bg-green-500');
    });

    it('should apply correct color class for good scores (75-89)', () => {
      const wrapper = createWrapper();
      const scoreCircle = wrapper.find('.w-24.h-24.rounded-full');
      expect(scoreCircle.classes()).toContain('bg-blue-500');
    });

    it('should apply correct color class for satisfactory scores (60-74)', () => {
      const satisfactoryResults = {
        ...mockGradingResults,
        averageScore: 65
      };

      const wrapper = createWrapper({ results: satisfactoryResults });
      const scoreCircle = wrapper.find('.w-24.h-24.rounded-full');
      expect(scoreCircle.classes()).toContain('bg-yellow-500');
    });

    it('should apply correct color class for poor scores (40-59)', () => {
      const poorResults = {
        ...mockGradingResults,
        averageScore: 45
      };

      const wrapper = createWrapper({ results: poorResults });
      const scoreCircle = wrapper.find('.w-24.h-24.rounded-full');
      expect(scoreCircle.classes()).toContain('bg-orange-500');
    });

    it('should apply correct color class for very poor scores (<40)', () => {
      const veryPoorResults = {
        ...mockGradingResults,
        averageScore: 25
      };

      const wrapper = createWrapper({ results: veryPoorResults });
      const scoreCircle = wrapper.find('.w-24.h-24.rounded-full');
      expect(scoreCircle.classes()).toContain('bg-red-500');
    });
  });

  describe('Interactive Features', () => {
    it('should toggle detailed analysis when show/hide details is clicked', async () => {
      const wrapper = createWrapper();

      // Initially, detailed analysis should be hidden
      expect(wrapper.find('.border-t.border-gray-200').exists()).toBe(false);

      // Click show details button for first role
      const showDetailsButtons = wrapper.findAll('button').filter(btn => 
        btn.text().includes('Details')
      );
      expect(showDetailsButtons.length).toBeGreaterThan(0);
      const showDetailsButton = showDetailsButtons[0];
      expect(showDetailsButton.text()).toBe('Show Details');
      
      await showDetailsButton.trigger('click');

      // Detailed analysis should now be visible
      expect(wrapper.find('.border-t.border-gray-200').exists()).toBe(true);
      expect(wrapper.find('h6').text()).toBe('Detailed Analysis');
      
      // Button text should change to "Hide Details"
      expect(showDetailsButton.text()).toBe('Hide Details');

      // Click hide details
      await showDetailsButton.trigger('click');

      // Detailed analysis should be hidden again
      expect(wrapper.find('.border-t.border-gray-200').exists()).toBe(false);
    });

    it('should emit close event when close button is clicked', async () => {
      const wrapper = createWrapper();

      const closeButton = wrapper.find('button[aria-label="close"], .text-gray-400');
      await closeButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('should emit save-to-history event when save button is clicked', async () => {
      const wrapper = createWrapper();

      const saveButton = wrapper.find('.bg-blue-600');
      expect(saveButton.text()).toBe('Save to Progress History');
      
      await saveButton.trigger('click');

      expect(wrapper.emitted('save-to-history')).toBeTruthy();
    });

    it('should emit view-history event when view history button is clicked', async () => {
      const wrapper = createWrapper();

      const viewHistoryButton = wrapper.find('.bg-gray-600');
      expect(viewHistoryButton.text()).toBe('View Grading History');
      
      await viewHistoryButton.trigger('click');

      expect(wrapper.emitted('view-history')).toBeTruthy();
    });

    it('should emit close event when close action button is clicked', async () => {
      const wrapper = createWrapper();

      const closeActionButton = wrapper.find('.bg-gray-300');
      expect(closeActionButton.text()).toBe('Close');
      
      await closeActionButton.trigger('click');

      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('Score Descriptions', () => {
    it('should show excellent description for scores 90+', () => {
      const excellentResults = {
        ...mockGradingResults,
        averageScore: 95
      };

      const wrapper = createWrapper({ results: excellentResults });
      const description = wrapper.find('p.text-gray-600');
      expect(description.text()).toContain('Excellent work! Outstanding code quality');
    });

    it('should show satisfactory description for scores 60-74', () => {
      const satisfactoryResults = {
        ...mockGradingResults,
        averageScore: 65
      };

      const wrapper = createWrapper({ results: satisfactoryResults });
      const description = wrapper.find('p.text-gray-600');
      expect(description.text()).toContain('Satisfactory work. Several areas could benefit');
    });

    it('should show needs improvement description for scores 40-59', () => {
      const needsImprovementResults = {
        ...mockGradingResults,
        averageScore: 45
      };

      const wrapper = createWrapper({ results: needsImprovementResults });
      const description = wrapper.find('p.text-gray-600');
      expect(description.text()).toContain('Needs improvement. Focus on the feedback');
    });

    it('should show significant improvements description for scores <40', () => {
      const poorResults = {
        ...mockGradingResults,
        averageScore: 25
      };

      const wrapper = createWrapper({ results: poorResults });
      const description = wrapper.find('p.text-gray-600');
      expect(description.text()).toContain('Significant improvements needed');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid classes for role evaluations', () => {
      const wrapper = createWrapper();

      const grid = wrapper.find('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(grid.exists()).toBe(true);
    });

    it('should have responsive flex classes for action buttons', () => {
      const wrapper = createWrapper();

      const buttonContainer = wrapper.find('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer.exists()).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('h3').exists()).toBe(true); // Main title
      expect(wrapper.find('h4').exists()).toBe(true); // Section titles
      expect(wrapper.find('h5').exists()).toBe(true); // Role names
    });

    it('should have proper color contrast for scores', () => {
      const wrapper = createWrapper();

      // Check that score text has appropriate color classes
      const scoreTexts = wrapper.findAll('span.text-2xl.font-bold');
      expect(scoreTexts.length).toBeGreaterThan(0);
      
      scoreTexts.forEach(scoreText => {
        const classes = scoreText.classes();
        const hasColorClass = classes.some(cls => 
          cls.includes('text-green-') || 
          cls.includes('text-blue-') || 
          cls.includes('text-yellow-') || 
          cls.includes('text-orange-') || 
          cls.includes('text-red-')
        );
        expect(hasColorClass).toBe(true);
      });
    });

    it('should have accessible button text', () => {
      const wrapper = createWrapper();

      const buttons = wrapper.findAll('button');
      buttons.forEach(button => {
        // Skip icon-only buttons (they should have aria-label or similar)
        if (button.find('svg').exists()) {
          // Icon buttons should have accessible attributes
          expect(button.attributes('aria-label') || button.attributes('title')).toBeTruthy();
        } else {
          // Text buttons should have non-empty text
          expect(button.text().trim()).not.toBe('');
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing role evaluations gracefully', () => {
      const emptyResults = {
        ...mockGradingResults,
        roleEvaluations: []
      };

      const wrapper = createWrapper({ results: emptyResults });
      
      expect(wrapper.find('.grading-results').exists()).toBe(true);
      expect(wrapper.findAll('.role-evaluation')).toHaveLength(0);
    });

    it('should handle very long feedback text', () => {
      const longFeedbackResults = {
        ...mockGradingResults,
        roleEvaluations: [
          {
            ...mockGradingResults.roleEvaluations[0],
            feedback: 'This is a very long feedback message that should be handled gracefully by the component without breaking the layout or causing overflow issues. '.repeat(10)
          }
        ]
      };

      const wrapper = createWrapper({ results: longFeedbackResults });
      
      expect(wrapper.find('.role-evaluation').exists()).toBe(true);
      const feedback = wrapper.find('.role-evaluation .text-sm.text-gray-600');
      expect(feedback.text().length).toBeGreaterThan(100);
    });

    it('should handle missing focus areas', () => {
      const noFocusAreasResults = {
        ...mockGradingResults,
        roleEvaluations: [
          {
            ...mockGradingResults.roleEvaluations[0],
            focusAreas: []
          }
        ]
      };

      const wrapper = createWrapper({ results: noFocusAreasResults });
      
      expect(wrapper.find('.role-evaluation').exists()).toBe(true);
      const focusAreaTags = wrapper.find('.role-evaluation').findAll('.inline-block.px-2.py-1');
      expect(focusAreaTags).toHaveLength(0);
    });
  });
});