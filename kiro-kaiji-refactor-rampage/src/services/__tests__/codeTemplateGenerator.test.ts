/**
 * Code Template Generator Tests
 * 
 * Unit tests for the code template generation service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeTemplateGenerator } from '../codeTemplateGenerator';
import { 
  ProgrammingLanguage, 
  ChallengeCategory, 
  DifficultyLevel,
  Framework
} from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

describe('CodeTemplateGenerator', () => {
  let generator: CodeTemplateGenerator;

  beforeEach(() => {
    generator = new CodeTemplateGenerator();
  });

  describe('generateBaseTemplate', () => {
    it('should generate JavaScript template with correct structure', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        undefined,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.JAVASCRIPT);
      expect(template.baseCode).toContain('class DataProcessor');
      expect(template.baseCode).toContain('processData');
      expect(template.baseCode).toContain('validateInput');
      expect(template.testSetup).toContain('describe');
    });

    it('should generate TypeScript template with type annotations', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.TYPESCRIPT,
        undefined,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(template.baseCode).toContain('interface DataItem');
      expect(template.baseCode).toContain(': DataItem[]');
      expect(template.baseCode).toContain('ProcessingResult');
    });

    it('should generate Python template with proper syntax', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.PYTHON,
        undefined,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.PYTHON);
      expect(template.baseCode).toContain('class DataProcessor:');
      expect(template.baseCode).toContain('def process_data');
      expect(template.baseCode).toContain('from typing import');
      expect(template.testSetup).toContain('unittest');
    });

    it('should generate Java template with proper class structure', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVA,
        undefined,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.JAVA);
      expect(template.baseCode).toContain('public class DataProcessor');
      expect(template.baseCode).toContain('public Map<String, Object> processData');
      expect(template.baseCode).toContain('import java.util.*;');
      expect(template.testSetup).toContain('@Test');
    });

    it('should generate C# template with proper namespace and class', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.CSHARP,
        undefined,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.CSHARP);
      expect(template.baseCode).toContain('public class DataProcessor');
      expect(template.baseCode).toContain('Dictionary<string, object>');
      expect(template.baseCode).toContain('using System');
      expect(template.testSetup).toContain('[TestMethod]');
    });

    it('should generate Vue.js template when Vue framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        Framework.VUE,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.VUE);
      expect(template.baseCode).toContain('<template>');
      expect(template.baseCode).toContain('<script>');
      expect(template.baseCode).toContain('export default');
      expect(template.imports).toContain('vue');
    });

    it('should generate React template when React framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        Framework.REACT,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.REACT);
      expect(template.baseCode).toContain('import React');
      expect(template.baseCode).toContain('useState');
      expect(template.baseCode).toContain('export default');
      expect(template.imports).toContain('react');
    });

    it('should generate Node.js template when Node framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        Framework.NODE,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.NODE);
      expect(template.baseCode).toContain('require(');
      expect(template.baseCode).toContain('module.exports');
      expect(template.baseCode).toContain('async');
      expect(template.imports).toContain('fs');
      expect(template.imports).toContain('path');
    });

    it('should generate Django template when Django framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.PYTHON,
        Framework.DJANGO,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.DJANGO);
      expect(template.baseCode).toContain('from django');
      expect(template.baseCode).toContain('JsonResponse');
      expect(template.baseCode).toContain('class DataProcessorView');
      expect(template.imports).toContain('django');
    });

    it('should generate Flask template when Flask framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.PYTHON,
        Framework.FLASK,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.FLASK);
      expect(template.baseCode).toContain('from flask');
      expect(template.baseCode).toContain('@app.route');
      expect(template.baseCode).toContain('Flask(__name__)');
      expect(template.imports).toContain('flask');
    });

    it('should generate Spring template when Spring framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVA,
        Framework.SPRING,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.SPRING);
      expect(template.baseCode).toContain('@RestController');
      expect(template.baseCode).toContain('@PostMapping');
      expect(template.baseCode).toContain('ResponseEntity');
      expect(template.imports).toContain('org.springframework');
    });

    it('should generate .NET template when .NET framework is specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.CSHARP,
        Framework.DOTNET,
        ChallengeCategory.REFACTORING
      );

      expect(template.framework).toBe(Framework.DOTNET);
      expect(template.baseCode).toContain('[ApiController]');
      expect(template.baseCode).toContain('[HttpPost');
      expect(template.baseCode).toContain('ActionResult');
      expect(template.imports).toContain('System');
    });

    it('should generate TypeScript Vue template when both are specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.TYPESCRIPT,
        Framework.VUE,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(template.framework).toBe(Framework.VUE);
      expect(template.baseCode).toContain('<script setup lang="ts">');
      expect(template.baseCode).toContain('interface DataItem');
      expect(template.baseCode).toContain('ref<');
    });

    it('should generate TypeScript React template when both are specified', () => {
      const template = generator.generateBaseTemplate(
        ProgrammingLanguage.TYPESCRIPT,
        Framework.REACT,
        ChallengeCategory.REFACTORING
      );

      expect(template.language).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(template.framework).toBe(Framework.REACT);
      expect(template.baseCode).toContain('React.FC');
      expect(template.baseCode).toContain('interface DataItem');
      expect(template.baseCode).toContain('useState<');
      expect(template.imports).toContain('@types/react');
    });
  });

  describe('generateProblematicPatterns', () => {
    it('should generate HydraBug patterns with interconnected bugs', () => {
      const patterns = generator.generateProblematicPatterns(
        KaijuType.HYDRA_BUG,
        ProgrammingLanguage.JAVASCRIPT,
        DifficultyLevel.INTERMEDIATE
      );

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.kaijuType === KaijuType.HYDRA_BUG)).toBe(true);
      
      const globalStatePattern = patterns.find(p => 
        p.pattern.includes('Global state modification')
      );
      expect(globalStatePattern).toBeDefined();
      expect(globalStatePattern!.severity).toBe('high');
    });

    it('should generate Complexasaur patterns with complexity issues', () => {
      const patterns = generator.generateProblematicPatterns(
        KaijuType.COMPLEXASAUR,
        ProgrammingLanguage.PYTHON,
        DifficultyLevel.ADVANCED
      );

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.kaijuType === KaijuType.COMPLEXASAUR)).toBe(true);
      
      const nestedPattern = patterns.find(p => 
        p.pattern.includes('nested')
      );
      expect(nestedPattern).toBeDefined();
    });

    it('should generate Duplicatron patterns with code duplication', () => {
      const patterns = generator.generateProblematicPatterns(
        KaijuType.DUPLICATRON,
        ProgrammingLanguage.JAVA,
        DifficultyLevel.INTERMEDIATE
      );

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.kaijuType === KaijuType.DUPLICATRON)).toBe(true);
      
      const duplicationPattern = patterns.find(p => 
        p.pattern.includes('Repeated code')
      );
      expect(duplicationPattern).toBeDefined();
      expect(duplicationPattern!.severity).toBe('medium');
    });

    it('should generate Spaghettizilla patterns with tangled dependencies', () => {
      const patterns = generator.generateProblematicPatterns(
        KaijuType.SPAGHETTIZILLA,
        ProgrammingLanguage.CSHARP,
        DifficultyLevel.EXPERT
      );

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.kaijuType === KaijuType.SPAGHETTIZILLA)).toBe(true);
      
      const dependencyPattern = patterns.find(p => 
        p.pattern.includes('dependencies')
      );
      expect(dependencyPattern).toBeDefined();
      expect(dependencyPattern!.severity).toBe('high');
    });

    it('should generate MemoryLeak-odactyl patterns with resource issues', () => {
      const patterns = generator.generateProblematicPatterns(
        KaijuType.MEMORYLEAK_ODACTYL,
        ProgrammingLanguage.JAVASCRIPT,
        DifficultyLevel.ADVANCED
      );

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.every(p => p.kaijuType === KaijuType.MEMORYLEAK_ODACTYL)).toBe(true);
      
      const resourcePattern = patterns.find(p => 
        p.pattern.includes('resources')
      );
      expect(resourcePattern).toBeDefined();
      expect(resourcePattern!.severity).toBe('high');
    });

    it('should include JavaScript-specific memory leak patterns', () => {
      const jsPatterns = generator.generateProblematicPatterns(
        KaijuType.MEMORYLEAK_ODACTYL,
        ProgrammingLanguage.JAVASCRIPT,
        DifficultyLevel.INTERMEDIATE
      );

      const eventListenerPattern = jsPatterns.find(p => 
        p.pattern.includes('Event listener')
      );
      expect(eventListenerPattern).toBeDefined();
    });

    it('should include more patterns for higher difficulty levels', () => {
      const beginnerPatterns = generator.generateProblematicPatterns(
        KaijuType.HYDRA_BUG,
        ProgrammingLanguage.JAVASCRIPT,
        DifficultyLevel.BEGINNER
      );

      const intermediatePatterns = generator.generateProblematicPatterns(
        KaijuType.HYDRA_BUG,
        ProgrammingLanguage.JAVASCRIPT,
        DifficultyLevel.INTERMEDIATE
      );

      expect(intermediatePatterns.length).toBeGreaterThanOrEqual(beginnerPatterns.length);
    });

    it('should return empty array for unknown Kaiju type', () => {
      const patterns = generator.generateProblematicPatterns(
        'unknown-kaiju' as KaijuType,
        ProgrammingLanguage.JAVASCRIPT,
        DifficultyLevel.INTERMEDIATE
      );

      expect(patterns).toEqual([]);
    });
  });

  describe('template structure validation', () => {
    it('should include proper imports for each language template', () => {
      const jsTemplate = generator.generateBaseTemplate(ProgrammingLanguage.JAVASCRIPT);
      const tsTemplate = generator.generateBaseTemplate(ProgrammingLanguage.TYPESCRIPT);
      const pythonTemplate = generator.generateBaseTemplate(ProgrammingLanguage.PYTHON);
      const javaTemplate = generator.generateBaseTemplate(ProgrammingLanguage.JAVA);
      const csharpTemplate = generator.generateBaseTemplate(ProgrammingLanguage.CSHARP);

      expect(jsTemplate.imports).toBeDefined();
      expect(tsTemplate.imports).toBeDefined();
      expect(pythonTemplate.imports).toBeDefined();
      expect(javaTemplate.imports).toBeDefined();
      expect(csharpTemplate.imports).toBeDefined();
    });

    it('should include test setup for each language', () => {
      const languages = [
        ProgrammingLanguage.JAVASCRIPT,
        ProgrammingLanguage.TYPESCRIPT,
        ProgrammingLanguage.PYTHON,
        ProgrammingLanguage.JAVA,
        ProgrammingLanguage.CSHARP
      ];

      languages.forEach(language => {
        const template = generator.generateBaseTemplate(language);
        expect(template.testSetup).toBeDefined();
        expect(template.testSetup!.length).toBeGreaterThan(0);
      });
    });

    it('should have consistent method names across templates', () => {
      const languages = [
        ProgrammingLanguage.JAVASCRIPT,
        ProgrammingLanguage.TYPESCRIPT,
        ProgrammingLanguage.PYTHON,
        ProgrammingLanguage.JAVA,
        ProgrammingLanguage.CSHARP
      ];

      languages.forEach(language => {
        const template = generator.generateBaseTemplate(language);
        
        // Each template should have some form of process, validate, and format methods
        const hasProcessMethod = template.baseCode.toLowerCase().includes('process');
        const hasValidateMethod = template.baseCode.toLowerCase().includes('validat');
        const hasFormatMethod = template.baseCode.toLowerCase().includes('format');

        expect(hasProcessMethod).toBe(true);
        expect(hasValidateMethod).toBe(true);
        expect(hasFormatMethod).toBe(true);
      });
    });

    it('should generate valid syntax for each language', () => {
      // Basic syntax validation - checking for common syntax elements
      const jsTemplate = generator.generateBaseTemplate(ProgrammingLanguage.JAVASCRIPT);
      expect(jsTemplate.baseCode).toMatch(/class\s+\w+/); // Class declaration
      expect(jsTemplate.baseCode).toMatch(/function\s+\w+|^\s*\w+\s*\(/m); // Function declaration

      const pythonTemplate = generator.generateBaseTemplate(ProgrammingLanguage.PYTHON);
      expect(pythonTemplate.baseCode).toMatch(/class\s+\w+:/); // Python class
      expect(pythonTemplate.baseCode).toMatch(/def\s+\w+/); // Python method

      const javaTemplate = generator.generateBaseTemplate(ProgrammingLanguage.JAVA);
      expect(javaTemplate.baseCode).toMatch(/public\s+class\s+\w+/); // Java class
      expect(javaTemplate.baseCode).toMatch(/public\s+\w+.*\(/); // Java method

      const csharpTemplate = generator.generateBaseTemplate(ProgrammingLanguage.CSHARP);
      expect(csharpTemplate.baseCode).toMatch(/public\s+class\s+\w+/); // C# class
      expect(csharpTemplate.baseCode).toMatch(/public\s+\w+.*\(/); // C# method
    });
  });

  describe('framework-specific features', () => {
    it('should include framework-specific imports', () => {
      const vueTemplate = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        Framework.VUE
      );
      const reactTemplate = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        Framework.REACT
      );
      const djangoTemplate = generator.generateBaseTemplate(
        ProgrammingLanguage.PYTHON,
        Framework.DJANGO
      );

      expect(vueTemplate.imports).toContain('vue');
      expect(reactTemplate.imports).toContain('react');
      expect(djangoTemplate.imports).toContain('django');
    });

    it('should include framework-specific patterns in code', () => {
      const springTemplate = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVA,
        Framework.SPRING
      );
      const dotnetTemplate = generator.generateBaseTemplate(
        ProgrammingLanguage.CSHARP,
        Framework.DOTNET
      );

      expect(springTemplate.baseCode).toContain('@RestController');
      expect(dotnetTemplate.baseCode).toContain('[ApiController]');
    });

    it('should maintain language consistency with framework additions', () => {
      const vanillaJS = generator.generateBaseTemplate(ProgrammingLanguage.JAVASCRIPT);
      const vueJS = generator.generateBaseTemplate(
        ProgrammingLanguage.JAVASCRIPT,
        Framework.VUE
      );

      expect(vanillaJS.language).toBe(vueJS.language);
      expect(vueJS.framework).toBe(Framework.VUE);
      expect(vanillaJS.framework).toBeUndefined();
    });
  });
});