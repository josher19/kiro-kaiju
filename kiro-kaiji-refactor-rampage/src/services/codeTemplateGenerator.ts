/**
 * Code Template Generator
 * 
 * Generates code templates and problematic patterns for different programming languages
 * and Kaiju monster types.
 */

import { 
  ProgrammingLanguage, 
  ChallengeCategory, 
  DifficultyLevel,
  Framework 
} from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

export interface CodeTemplate {
  language: ProgrammingLanguage;
  framework?: Framework;
  baseCode: string;
  imports: string[];
  exports: string[];
  testSetup?: string;
}

export interface ProblematicPattern {
  pattern: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  kaijuType: KaijuType;
}

export class CodeTemplateGenerator {
  /**
   * Generate a base code template for the given language and framework
   */
  generateBaseTemplate(
    language: ProgrammingLanguage,
    framework?: Framework,
    category: ChallengeCategory = ChallengeCategory.REFACTORING
  ): CodeTemplate {
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
        return this.generateJavaScriptTemplate(framework, category);
      case ProgrammingLanguage.TYPESCRIPT:
        return this.generateTypeScriptTemplate(framework, category);
      case ProgrammingLanguage.PYTHON:
        return this.generatePythonTemplate(framework, category);
      case ProgrammingLanguage.JAVA:
        return this.generateJavaTemplate(framework, category);
      case ProgrammingLanguage.CSHARP:
        return this.generateCSharpTemplate(framework, category);
      default:
        return this.generateJavaScriptTemplate(framework, category);
    }
  }

  /**
   * Generate problematic code patterns for a specific Kaiju type
   */
  generateProblematicPatterns(
    kaijuType: KaijuType,
    language: ProgrammingLanguage,
    difficulty: DifficultyLevel
  ): ProblematicPattern[] {
    const patterns: ProblematicPattern[] = [];

    switch (kaijuType) {
      case KaijuType.HYDRA_BUG:
        patterns.push(...this.generateHydraBugPatterns(language, difficulty));
        break;
      case KaijuType.COMPLEXASAUR:
        patterns.push(...this.generateComplexasaurPatterns(language, difficulty));
        break;
      case KaijuType.DUPLICATRON:
        patterns.push(...this.generateDuplicatronPatterns(language, difficulty));
        break;
      case KaijuType.SPAGHETTIZILLA:
        patterns.push(...this.generateSpaghettizillaPatterns(language, difficulty));
        break;
      case KaijuType.MEMORYLEAK_ODACTYL:
        patterns.push(...this.generateMemoryLeakPatterns(language, difficulty));
        break;
    }

    return patterns;
  }

  // JavaScript template generation
  private generateJavaScriptTemplate(framework?: Framework, category: ChallengeCategory = ChallengeCategory.REFACTORING): CodeTemplate {
    let baseCode = '';
    let imports: string[] = [];
    let exports: string[] = [];

    switch (framework) {
      case Framework.VUE:
        baseCode = this.getVueJSTemplate(category);
        imports = ['vue'];
        break;
      case Framework.REACT:
        baseCode = this.getReactJSTemplate(category);
        imports = ['react'];
        break;
      case Framework.NODE:
        baseCode = this.getNodeJSTemplate(category);
        imports = ['fs', 'path'];
        break;
      default:
        baseCode = this.getVanillaJSTemplate(category);
    }

    return {
      language: ProgrammingLanguage.JAVASCRIPT,
      framework,
      baseCode,
      imports,
      exports,
      testSetup: this.getJSTestSetup()
    };
  }

  // TypeScript template generation
  private generateTypeScriptTemplate(framework?: Framework, category: ChallengeCategory = ChallengeCategory.REFACTORING): CodeTemplate {
    let baseCode = '';
    let imports: string[] = [];

    switch (framework) {
      case Framework.VUE:
        baseCode = this.getVueTSTemplate(category);
        imports = ['vue'];
        break;
      case Framework.REACT:
        baseCode = this.getReactTSTemplate(category);
        imports = ['react', '@types/react'];
        break;
      default:
        baseCode = this.getVanillaTSTemplate(category);
    }

    return {
      language: ProgrammingLanguage.TYPESCRIPT,
      framework,
      baseCode,
      imports,
      exports: [],
      testSetup: this.getTSTestSetup()
    };
  }

  // Python template generation
  private generatePythonTemplate(framework?: Framework, category: ChallengeCategory = ChallengeCategory.REFACTORING): CodeTemplate {
    let baseCode = '';
    let imports: string[] = [];

    switch (framework) {
      case Framework.DJANGO:
        baseCode = this.getDjangoTemplate(category);
        imports = ['django'];
        break;
      case Framework.FLASK:
        baseCode = this.getFlaskTemplate(category);
        imports = ['flask'];
        break;
      default:
        baseCode = this.getVanillaPythonTemplate(category);
    }

    return {
      language: ProgrammingLanguage.PYTHON,
      framework,
      baseCode,
      imports,
      exports: [],
      testSetup: this.getPythonTestSetup()
    };
  }

  // Java template generation
  private generateJavaTemplate(framework?: Framework, category: ChallengeCategory = ChallengeCategory.REFACTORING): CodeTemplate {
    let baseCode = '';
    let imports: string[] = [];

    switch (framework) {
      case Framework.SPRING:
        baseCode = this.getSpringTemplate(category);
        imports = ['org.springframework'];
        break;
      default:
        baseCode = this.getVanillaJavaTemplate(category);
    }

    return {
      language: ProgrammingLanguage.JAVA,
      framework,
      baseCode,
      imports,
      exports: [],
      testSetup: this.getJavaTestSetup()
    };
  }

  // C# template generation
  private generateCSharpTemplate(framework?: Framework, category: ChallengeCategory = ChallengeCategory.REFACTORING): CodeTemplate {
    let baseCode = '';
    let imports: string[] = [];

    switch (framework) {
      case Framework.DOTNET:
        baseCode = this.getDotNetTemplate(category);
        imports = ['System'];
        break;
      default:
        baseCode = this.getVanillaCSharpTemplate(category);
    }

    return {
      language: ProgrammingLanguage.CSHARP,
      framework,
      baseCode,
      imports,
      exports: [],
      testSetup: this.getCSharpTestSetup()
    };
  }

  // Template implementations
  private getVanillaJSTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - Vanilla JavaScript
class DataProcessor {
    constructor() {
        this.data = [];
        this.cache = new Map();
    }

    processData(input) {
        // Implementation needed
        return input;
    }

    validateInput(input) {
        // Validation logic needed
        return true;
    }

    formatOutput(data) {
        // Formatting logic needed
        return data;
    }
}

// Usage example
const processor = new DataProcessor();
const result = processor.processData({ items: [] });
console.log(result);`;
  }

  private getVueJSTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - Vue.js Component
<template>
  <div class="data-processor">
    <input v-model="inputData" @change="processData" />
    <div class="results">{{ formattedResults }}</div>
  </div>
</template>

<script>
export default {
  name: 'DataProcessor',
  data() {
    return {
      inputData: '',
      results: [],
      cache: new Map()
    };
  },
  computed: {
    formattedResults() {
      // Formatting logic needed
      return this.results;
    }
  },
  methods: {
    processData() {
      // Processing logic needed
    },
    validateInput(input) {
      // Validation logic needed
      return true;
    }
  }
};
</script>`;
  }

  private getVanillaTSTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - TypeScript
interface DataItem {
  id: number;
  value: string;
  metadata?: Record<string, any>;
}

interface ProcessingResult {
  success: boolean;
  data: DataItem[];
  errors: string[];
}

class DataProcessor {
  private data: DataItem[] = [];
  private cache: Map<string, any> = new Map();

  processData(input: DataItem[]): ProcessingResult {
    // Implementation needed
    return {
      success: true,
      data: input,
      errors: []
    };
  }

  validateInput(input: DataItem[]): boolean {
    // Validation logic needed
    return true;
  }

  formatOutput(data: DataItem[]): string {
    // Formatting logic needed
    return JSON.stringify(data);
  }
}

// Usage example
const processor = new DataProcessor();
const result = processor.processData([]);
console.log(result);`;
  }

  private getVanillaPythonTemplate(category: ChallengeCategory): string {
    return `# ${category} Challenge - Python
from typing import List, Dict, Any, Optional

class DataProcessor:
    def __init__(self):
        self.data: List[Dict[str, Any]] = []
        self.cache: Dict[str, Any] = {}

    def process_data(self, input_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process the input data and return results."""
        # Implementation needed
        return {
            'success': True,
            'data': input_data,
            'errors': []
        }

    def validate_input(self, input_data: List[Dict[str, Any]]) -> bool:
        """Validate the input data."""
        # Validation logic needed
        return True

    def format_output(self, data: List[Dict[str, Any]]) -> str:
        """Format the output data."""
        # Formatting logic needed
        return str(data)

# Usage example
processor = DataProcessor()
result = processor.process_data([])
print(result)`;
  }

  private getVanillaJavaTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - Java
import java.util.*;

public class DataProcessor {
    private List<Map<String, Object>> data;
    private Map<String, Object> cache;

    public DataProcessor() {
        this.data = new ArrayList<>();
        this.cache = new HashMap<>();
    }

    public Map<String, Object> processData(List<Map<String, Object>> input) {
        // Implementation needed
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", input);
        result.put("errors", new ArrayList<>());
        return result;
    }

    public boolean validateInput(List<Map<String, Object>> input) {
        // Validation logic needed
        return true;
    }

    public String formatOutput(List<Map<String, Object>> data) {
        // Formatting logic needed
        return data.toString();
    }

    // Usage example
    public static void main(String[] args) {
        DataProcessor processor = new DataProcessor();
        Map<String, Object> result = processor.processData(new ArrayList<>());
        System.out.println(result);
    }
}`;
  }

  private getVanillaCSharpTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - C#
using System;
using System.Collections.Generic;

public class DataProcessor
{
    private List<Dictionary<string, object>> data;
    private Dictionary<string, object> cache;

    public DataProcessor()
    {
        data = new List<Dictionary<string, object>>();
        cache = new Dictionary<string, object>();
    }

    public Dictionary<string, object> ProcessData(List<Dictionary<string, object>> input)
    {
        // Implementation needed
        return new Dictionary<string, object>
        {
            ["success"] = true,
            ["data"] = input,
            ["errors"] = new List<string>()
        };
    }

    public bool ValidateInput(List<Dictionary<string, object>> input)
    {
        // Validation logic needed
        return true;
    }

    public string FormatOutput(List<Dictionary<string, object>> data)
    {
        // Formatting logic needed
        return data.ToString();
    }
}

// Usage example
class Program
{
    static void Main()
    {
        var processor = new DataProcessor();
        var result = processor.ProcessData(new List<Dictionary<string, object>>());
        Console.WriteLine(result);
    }
}`;
  }

  // Framework-specific templates
  private getReactJSTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - React Component
import React, { useState, useEffect } from 'react';

const DataProcessor = () => {
  const [inputData, setInputData] = useState('');
  const [results, setResults] = useState([]);
  const [cache] = useState(new Map());

  const processData = (input) => {
    // Processing logic needed
    setResults(input);
  };

  const validateInput = (input) => {
    // Validation logic needed
    return true;
  };

  useEffect(() => {
    if (inputData) {
      processData(inputData);
    }
  }, [inputData]);

  return (
    <div className="data-processor">
      <input 
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
      />
      <div className="results">
        {JSON.stringify(results)}
      </div>
    </div>
  );
};

export default DataProcessor;`;
  }

  private getNodeJSTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - Node.js
const fs = require('fs');
const path = require('path');

class DataProcessor {
    constructor() {
        this.data = [];
        this.cache = new Map();
    }

    async processData(input) {
        // Implementation needed
        return {
            success: true,
            data: input,
            errors: []
        };
    }

    validateInput(input) {
        // Validation logic needed
        return true;
    }

    async saveResults(data, filename) {
        // File saving logic needed
        const filePath = path.join(__dirname, filename);
        await fs.promises.writeFile(filePath, JSON.stringify(data));
    }
}

// Usage example
const processor = new DataProcessor();
processor.processData([]).then(result => {
    console.log(result);
});

module.exports = DataProcessor;`;
  }

  // Problematic pattern generators for each Kaiju type
  private generateHydraBugPatterns(language: ProgrammingLanguage, difficulty: DifficultyLevel): ProblematicPattern[] {
    const patterns: ProblematicPattern[] = [
      {
        pattern: 'Global state modification in multiple functions',
        description: 'Functions modify global variables causing unexpected side effects',
        severity: 'high',
        kaijuType: KaijuType.HYDRA_BUG
      },
      {
        pattern: 'Interconnected conditional logic',
        description: 'Complex if-else chains where fixing one condition breaks others',
        severity: 'medium',
        kaijuType: KaijuType.HYDRA_BUG
      }
    ];

    if (difficulty >= DifficultyLevel.INTERMEDIATE) {
      patterns.push({
        pattern: 'Race conditions in async operations',
        description: 'Asynchronous operations that interfere with each other',
        severity: 'high',
        kaijuType: KaijuType.HYDRA_BUG
      });
    }

    return patterns;
  }

  private generateComplexasaurPatterns(language: ProgrammingLanguage, difficulty: DifficultyLevel): ProblematicPattern[] {
    return [
      {
        pattern: 'Deeply nested function calls',
        description: 'Functions with excessive nesting levels',
        severity: 'medium',
        kaijuType: KaijuType.COMPLEXASAUR
      },
      {
        pattern: 'Overly complex conditional logic',
        description: 'Complex boolean expressions with multiple conditions',
        severity: 'high',
        kaijuType: KaijuType.COMPLEXASAUR
      }
    ];
  }

  private generateDuplicatronPatterns(language: ProgrammingLanguage, difficulty: DifficultyLevel): ProblematicPattern[] {
    return [
      {
        pattern: 'Repeated code blocks',
        description: 'Identical or nearly identical code repeated multiple times',
        severity: 'medium',
        kaijuType: KaijuType.DUPLICATRON
      },
      {
        pattern: 'Copy-paste programming',
        description: 'Functions that are copies of each other with minor variations',
        severity: 'high',
        kaijuType: KaijuType.DUPLICATRON
      }
    ];
  }

  private generateSpaghettizillaPatterns(language: ProgrammingLanguage, difficulty: DifficultyLevel): ProblematicPattern[] {
    return [
      {
        pattern: 'Tangled dependencies',
        description: 'Functions and modules with circular or unclear dependencies',
        severity: 'high',
        kaijuType: KaijuType.SPAGHETTIZILLA
      },
      {
        pattern: 'Mixed concerns',
        description: 'Functions that handle multiple unrelated responsibilities',
        severity: 'medium',
        kaijuType: KaijuType.SPAGHETTIZILLA
      }
    ];
  }

  private generateMemoryLeakPatterns(language: ProgrammingLanguage, difficulty: DifficultyLevel): ProblematicPattern[] {
    const patterns: ProblematicPattern[] = [
      {
        pattern: 'Unclosed resources',
        description: 'Resources that are opened but never properly closed',
        severity: 'high',
        kaijuType: KaijuType.MEMORYLEAK_ODACTYL
      }
    ];

    if (language === ProgrammingLanguage.JAVASCRIPT || language === ProgrammingLanguage.TYPESCRIPT) {
      patterns.push({
        pattern: 'Event listener leaks',
        description: 'Event listeners that are added but never removed',
        severity: 'medium',
        kaijuType: KaijuType.MEMORYLEAK_ODACTYL
      });
    }

    return patterns;
  }

  // Test setup templates
  private getJSTestSetup(): string {
    return `// Test setup for JavaScript
describe('DataProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new DataProcessor();
  });

  test('should process data correctly', () => {
    // Test implementation needed
  });
});`;
  }

  private getTSTestSetup(): string {
    return `// Test setup for TypeScript
import { DataProcessor } from './DataProcessor';

describe('DataProcessor', () => {
  let processor: DataProcessor;

  beforeEach(() => {
    processor = new DataProcessor();
  });

  test('should process data correctly', () => {
    // Test implementation needed
  });
});`;
  }

  private getPythonTestSetup(): string {
    return `# Test setup for Python
import unittest
from data_processor import DataProcessor

class TestDataProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = DataProcessor()

    def test_process_data(self):
        # Test implementation needed
        pass

if __name__ == '__main__':
    unittest.main()`;
  }

  private getJavaTestSetup(): string {
    return `// Test setup for Java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class DataProcessorTest {
    private DataProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new DataProcessor();
    }

    @Test
    void shouldProcessDataCorrectly() {
        // Test implementation needed
    }
}`;
  }

  private getCSharpTestSetup(): string {
    return `// Test setup for C#
using Microsoft.VisualStudio.TestTools.UnitTesting;

[TestClass]
public class DataProcessorTests
{
    private DataProcessor processor;

    [TestInitialize]
    public void Setup()
    {
        processor = new DataProcessor();
    }

    [TestMethod]
    public void ShouldProcessDataCorrectly()
    {
        // Test implementation needed
    }
}`;
  }

  // Additional framework templates
  private getVueTSTemplate(category: ChallengeCategory): string {
    return `<!-- ${category} Challenge - Vue.js with TypeScript -->
<template>
  <div class="data-processor">
    <input v-model="inputData" @change="processData" />
    <div class="results">{{ formattedResults }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface DataItem {
  id: number;
  value: string;
}

const inputData = ref<string>('');
const results = ref<DataItem[]>([]);
const cache = ref<Map<string, any>>(new Map());

const formattedResults = computed(() => {
  // Formatting logic needed
  return results.value;
});

const processData = (): void => {
  // Processing logic needed
};

const validateInput = (input: string): boolean => {
  // Validation logic needed
  return true;
};
</script>`;
  }

  private getReactTSTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - React with TypeScript
import React, { useState, useEffect } from 'react';

interface DataItem {
  id: number;
  value: string;
}

const DataProcessor: React.FC = () => {
  const [inputData, setInputData] = useState<string>('');
  const [results, setResults] = useState<DataItem[]>([]);
  const [cache] = useState<Map<string, any>>(new Map());

  const processData = (input: string): void => {
    // Processing logic needed
  };

  const validateInput = (input: string): boolean => {
    // Validation logic needed
    return true;
  };

  useEffect(() => {
    if (inputData) {
      processData(inputData);
    }
  }, [inputData]);

  return (
    <div className="data-processor">
      <input 
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
      />
      <div className="results">
        {JSON.stringify(results)}
      </div>
    </div>
  );
};

export default DataProcessor;`;
  }

  private getDjangoTemplate(category: ChallengeCategory): string {
    return `# ${category} Challenge - Django
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import json

@method_decorator(csrf_exempt, name='dispatch')
class DataProcessorView(View):
    def __init__(self):
        super().__init__()
        self.cache = {}

    def post(self, request):
        try:
            data = json.loads(request.body)
            result = self.process_data(data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def process_data(self, input_data):
        # Implementation needed
        return {
            'success': True,
            'data': input_data,
            'errors': []
        }

    def validate_input(self, input_data):
        # Validation logic needed
        return True`;
  }

  private getFlaskTemplate(category: ChallengeCategory): string {
    return `# ${category} Challenge - Flask
from flask import Flask, request, jsonify

app = Flask(__name__)

class DataProcessor:
    def __init__(self):
        self.cache = {}

    def process_data(self, input_data):
        # Implementation needed
        return {
            'success': True,
            'data': input_data,
            'errors': []
        }

    def validate_input(self, input_data):
        # Validation logic needed
        return True

processor = DataProcessor()

@app.route('/process', methods=['POST'])
def process_data():
    try:
        data = request.get_json()
        result = processor.process_data(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)`;
  }

  private getSpringTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - Spring Boot
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;

@RestController
@RequestMapping("/api/data")
public class DataProcessorController {
    private Map<String, Object> cache = new HashMap<>();

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processData(@RequestBody List<Map<String, Object>> input) {
        try {
            Map<String, Object> result = processDataInternal(input);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    private Map<String, Object> processDataInternal(List<Map<String, Object>> input) {
        // Implementation needed
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", input);
        result.put("errors", new ArrayList<>());
        return result;
    }

    private boolean validateInput(List<Map<String, Object>> input) {
        // Validation logic needed
        return true;
    }
}`;
  }

  private getDotNetTemplate(category: ChallengeCategory): string {
    return `// ${category} Challenge - .NET
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

[ApiController]
[Route("api/[controller]")]
public class DataProcessorController : ControllerBase
{
    private Dictionary<string, object> cache = new Dictionary<string, object>();

    [HttpPost("process")]
    public ActionResult<Dictionary<string, object>> ProcessData([FromBody] List<Dictionary<string, object>> input)
    {
        try
        {
            var result = ProcessDataInternal(input);
            return Ok(result);
        }
        catch (System.Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    private Dictionary<string, object> ProcessDataInternal(List<Dictionary<string, object>> input)
    {
        // Implementation needed
        return new Dictionary<string, object>
        {
            ["success"] = true,
            ["data"] = input,
            ["errors"] = new List<string>()
        };
    }

    private bool ValidateInput(List<Dictionary<string, object>> input)
    {
        // Validation logic needed
        return true;
    }
}`;
  }
}

// Export singleton instance
export const codeTemplateGenerator = new CodeTemplateGenerator();