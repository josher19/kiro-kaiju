import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockService } from '../services/bedrockService';
import { v4 as uuidv4 } from 'uuid';
import { KaijuType } from '../types';

const bedrockService = new BedrockService();

export const generateChallenge = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { language, framework, category, difficulty } = JSON.parse(event.body);

    if (!language || !difficulty) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Language and difficulty are required' })
      };
    }

    // Generate challenge using Bedrock
    const challengeData = await bedrockService.generateChallenge(language, framework, difficulty);
    
    // Create complete challenge object
    const challenge = {
      id: uuidv4(),
      kaiju: {
        id: uuidv4(),
        name: getKaijuName(challengeData.kaiju),
        type: challengeData.kaiju as KaijuType,
        description: getKaijuDescription(challengeData.kaiju),
        avatar: `/images/kaiju/${challengeData.kaiju}_small.png`
      },
      initialCode: challengeData.initialCode,
      requirements: challengeData.requirements,
      language,
      framework,
      difficulty,
      createdAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(challenge)
    };
  } catch (error) {
    console.error('Challenge generation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to generate challenge' })
    };
  }
};

function getKaijuName(type: string): string {
  const names = {
    'hydra-bug': 'HydraBug',
    'complexasaur': 'Complexasaur',
    'duplicatron': 'Duplicatron',
    'spaghettizilla': 'Spaghettizilla',
    'memoryleak-odactyl': 'Memoryleak-odactyl'
  };
  return names[type as keyof typeof names] || 'Unknown Kaiju';
}

function getKaijuDescription(type: string): string {
  const descriptions = {
    'hydra-bug': 'A monstrous bug that spawns two more bugs when you try to fix it incorrectly',
    'complexasaur': 'A massive creature that creates overly complex and nested code structures',
    'duplicatron': 'A replicating monster that fills your codebase with duplicate functions and logic',
    'spaghettizilla': 'A tangled beast that creates messy, interdependent code with unclear data flow',
    'memoryleak-odactyl': 'A flying menace that leaves memory leaks and resource management issues in its wake'
  };
  return descriptions[type as keyof typeof descriptions] || 'A mysterious coding challenge awaits';
}