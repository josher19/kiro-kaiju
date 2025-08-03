// Quick debug script to see actual evaluation scores
import { EvaluationService } from './src/services/evaluationService.ts';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from './src/types/challenge.ts';

const evaluationService = new EvaluationService();

const poorCode = `
function x(a){if(a>0){if(a<10){if(a%2==0){return a*2}else{return a*3}}else{return a/2}}else{return 0}}
var y=x(5);var z=x(10);var w=x(-1);
`;

const mockChallenge = {
  id: 'test',
  kaiju: { id: 'test', type: 'complexasaur', name: 'Test' },
  config: {
    language: ProgrammingLanguage.JAVASCRIPT,
    category: ChallengeCategory.REFACTORING,
    difficulty: DifficultyLevel.INTERMEDIATE
  },
  requirements: [],
  testCases: [],
  initialCode: '',
  title: 'Test',
  description: 'Test',
  hints: [],
  createdAt: new Date()
};

const request = {
  challengeId: 'test',
  challenge: mockChallenge,
  submittedCode: poorCode,
  timeSpent: 1000,
  attempts: 1
};

try {
  const result = await evaluationService.evaluateCode(request);
  console.log('Scores:', result.scores);
  console.log('Overall:', result.overallScore);
  console.log('Passed:', result.passed);
} catch (error) {
  console.error('Error:', error.message);
}