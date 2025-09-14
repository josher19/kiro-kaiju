import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { GradingRole } from '../types';

export class BedrockService {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
  }

  async generateChallenge(language: string, framework: string | undefined, difficulty: number): Promise<any> {
    const prompt = this.buildChallengePrompt(language, framework, difficulty);
    
    const response = await this.invokeModel(prompt);
    return this.parseChallengeResponse(response);
  }

  async gradeCode(code: string, requirements: string[], max_tokens = 300): Promise<Record<GradingRole, [number, string]>> {
    const prompt = this.buildGradingPrompt(code, requirements);
    
    const response = await this.invokeModel(prompt, max_tokens);
    return this.parseGradingResponse(response);
  }

  async chatCompletion(messages: any[], model?: string, max_tokens = 2000): Promise<string> {
    const prompt = this.buildChatPrompt(messages);
    return await this.invokeModel(prompt, max_tokens);
  }

  private async invokeModel(prompt: string, max_tokens = 2000): Promise<string> {
    const body = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body: body,
      contentType: 'application/json',
      accept: 'application/json'
    });

    try {
      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      return responseBody.content[0].text;
    } catch (error) {
      console.error('Bedrock invocation error:', error);
      throw new Error('Failed to invoke Bedrock model');
    }
  }

  private buildChallengePrompt(language: string, framework: string | undefined, difficulty: number): string {
    return `Generate a coding challenge for ${language}${framework ? ` with ${framework}` : ''} at difficulty level ${difficulty}/5.

Create a JSON response with:
- kaiju: random selection from [hydra-bug, complexasaur, duplicatron, spaghettizilla, memoryleak-odactyl]
- initialCode: problematic code (50-100 lines) with issues matching the kaiju type
- requirements: array of 3-5 specific requirements to implement
- description: brief challenge description

Kaiju types and their code problems:
- hydra-bug: bugs that create more bugs when fixed incorrectly
- complexasaur: overly complex, nested code
- duplicatron: massive code duplication
- spaghettizilla: tangled dependencies
- memoryleak-odactyl: memory management issues

Return only valid JSON.`;
  }

  private buildGradingPrompt(code: string, requirements: string[]): string {
    return `Evaluate this code from four professional perspectives and return ONLY a JSON object in this exact format:
{"developer": [score, "reason"], "architect": [score, "reason"], "sqa": [score, "reason"], "productOwner": [score, "reason"]}

Code to evaluate:
\`\`\`
${code}
\`\`\`

Requirements:
${requirements.map((req, i) => `${i + 1}. ${req}`).join('\n')}

Evaluation criteria:
- Developer: code quality, best practices, maintainability (score 1-10)
- Architect: system design, scalability, patterns (score 1-10)  
- SQA: defects, edge cases, testing coverage (score 1-10)
- Product Owner: requirement fulfillment, user value (score 1-10)

Return ONLY the JSON object, no other text.`;
  }

  private buildChatPrompt(messages: any[]): string {
    return messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');
  }

  private parseChallengeResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        kaiju: 'complexasaur',
        initialCode: '// Generated challenge code\nfunction example() {\n  return "Hello World";\n}',
        requirements: ['Refactor the code', 'Add error handling', 'Improve readability'],
        description: 'Basic refactoring challenge'
      };
    }
  }

  private parseGradingResponse(response: string): Record<GradingRole, [number, string]> {
    try {
      const parsed = JSON.parse(response);
      return {
        [GradingRole.DEVELOPER]: parsed.developer || [5, 'No evaluation available'],
        [GradingRole.ARCHITECT]: parsed.architect || [5, 'No evaluation available'],
        [GradingRole.SQA]: parsed.sqa || [5, 'No evaluation available'],
        [GradingRole.PRODUCT_OWNER]: parsed.productOwner || [5, 'No evaluation available']
      };
    } catch (error) {
      // Fallback scores if parsing fails
      return {
        [GradingRole.DEVELOPER]: [5, 'Evaluation failed'],
        [GradingRole.ARCHITECT]: [5, 'Evaluation failed'],
        [GradingRole.SQA]: [5, 'Evaluation failed'],
        [GradingRole.PRODUCT_OWNER]: [5, 'Evaluation failed']
      };
    }
  }
}