/**
 * Memoryleak-odactyl Monster
 * 
 * Represents memory management issues and resource leaks.
 * This monster creates code that doesn't properly clean up resources.
 */

import { BaseKaijuMonster, type CodeGenerationOptions, type GeneratedCode } from '../kaijuEngine';
import { KaijuType, type CodeAntiPattern, type DifficultyModifier } from '@/types/kaiju';
import { ProgrammingLanguage } from '@/types/challenge';

export class MemoryleakOdactyl extends BaseKaijuMonster {
  id = 'memoryleak-odactyl-001';
  name = 'Memoryleak-odactyl';
  type = KaijuType.MEMORYLEAK_ODACTYL;
  description = 'A prehistoric beast that hoards resources and never lets them go, causing memory leaks and performance degradation.';
  avatar = '🦕💾';
  flavorText = 'I collect references and never let them go! My memory is eternal!';

  specialAbilities = [
    'Resource Hoarding: Creates references that are never cleaned up',
    'Event Listener Accumulation: Adds listeners without removing them',
    'Closure Capture: Captures large objects in closures unnecessarily'
  ];

  weaknesses = [
    'Proper Cleanup: Explicitly removing references and listeners',
    'Weak References: Using weak references where appropriate',
    'Resource Management: Implementing proper lifecycle management'
  ];

  codePatterns: CodeAntiPattern[] = [
    {
      id: 'uncleaned-event-listeners',
      name: 'Uncleaned Event Listeners',
      description: 'Event listeners that are added but never removed',
      severity: 'high',
      examples: [
        'DOM event listeners not removed on component unmount',
        'Global event listeners that accumulate over time',
        'Timer callbacks that reference large objects'
      ]
    },
    {
      id: 'circular-references',
      name: 'Circular References',
      description: 'Objects that reference each other preventing garbage collection',
      severity: 'medium',
      examples: [
        'Parent-child object references without cleanup',
        'Observer patterns without proper unsubscription',
        'Cache objects that reference their keys'
      ]
    },
    {
      id: 'closure-memory-leaks',
      name: 'Closure Memory Leaks',
      description: 'Closures that capture large objects unnecessarily',
      severity: 'medium',
      examples: [
        'Event handlers that capture entire component state',
        'Callbacks that hold references to large data structures',
        'Timers that capture unnecessary scope variables'
      ]
    }
  ];

  difficultyModifiers: DifficultyModifier[] = [
    {
      factor: 0.7,
      description: 'Increases number of memory leaks and their subtlety',
      affectedMetrics: ['memory_leak_count', 'reference_complexity', 'cleanup_difficulty']
    }
  ];

  generateCode(options: CodeGenerationOptions): GeneratedCode {
    const { language, difficulty } = options;
    
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return this.generateJavaScriptCode(difficulty);
      case ProgrammingLanguage.PYTHON:
        return this.generatePythonCode(difficulty);
      default:
        return this.generateJavaScriptCode(difficulty);
    }
  }

  private generateJavaScriptCode(difficulty: number): GeneratedCode {
    const baseCode = `// Data Visualization Dashboard - Memoryleak-odactyl Edition

class DataDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = [];
        this.dataCache = new Map();
        this.updateInterval = null;
        this.eventListeners = [];
        this.observers = [];
        
        this.init();
    }
    
    init() {
        // Memory leak 1: Event listeners never removed
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        document.addEventListener('click', (event) => {
            this.handleGlobalClick(event);
        });
        
        // Memory leak 2: Timer that captures 'this' and never stops
        this.updateInterval = setInterval(() => {
            this.updateCharts();
        }, 1000);
        
        // Memory leak 3: Creating circular references
        this.setupChartReferences();
    }
    
    setupChartReferences() {
        // Creates circular references between charts
        for (let i = 0; i < 5; i++) {
            const chart = {
                id: i,
                dashboard: this, // Circular reference!
                data: [],
                element: document.createElement('div'),
                neighbors: [] // Will reference other charts
            };
            
            // Memory leak 4: DOM elements not properly cleaned up
            chart.element.innerHTML = \`<canvas id="chart-\${i}"></canvas>\`;
            this.container.appendChild(chart.element);
            
            // Add event listener to each chart (never removed)
            chart.element.addEventListener('mouseover', (event) => {
                this.handleChartHover(chart, event);
            });
            
            this.charts.push(chart);
        }
        
        // Create circular references between charts
        this.charts.forEach((chart, index) => {
            chart.neighbors = this.charts.filter((_, i) => i !== index);
        });
    }
    
    handleResize() {
        // Memory leak 5: Accumulating data in cache without cleanup
        const resizeData = {
            timestamp: new Date(),
            windowSize: { width: window.innerWidth, height: window.innerHeight },
            charts: this.charts.map(c => ({ id: c.id, bounds: c.element.getBoundingClientRect() }))
        };
        
        this.dataCache.set(\`resize-\${Date.now()}\`, resizeData);
        
        // Never cleans up old resize data!
        console.log(\`Cache size: \${this.dataCache.size}\`);
    }
    
    handleGlobalClick(event) {
        // Memory leak 6: Creating new objects on every click
        const clickData = {
            timestamp: new Date(),
            target: event.target,
            charts: this.charts, // References all charts!
            dashboard: this // Self reference!
        };
        
        this.dataCache.set(\`click-\${Date.now()}\`, clickData);
        
        // Create observer that never gets cleaned up
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // Captures clickData in closure!
                console.log('Mutation observed', clickData);
            });
        });
        
        observer.observe(event.target, { childList: true, subtree: true });
        this.observers.push(observer); // Never disconnected!
    }
    
    handleChartHover(chart, event) {
        // Memory leak 7: Closure captures large objects
        const hoverHandler = () => {
            // Captures entire chart object and dashboard
            console.log(\`Hovering over chart \${chart.id}\`);
            console.log(\`Dashboard has \${this.charts.length} charts\`);
            
            // Creates more references
            chart.lastHover = {
                timestamp: new Date(),
                dashboard: this,
                allCharts: this.charts
            };
        };
        
        // Memory leak 8: Timeout that captures closure
        setTimeout(hoverHandler, 100);
    }
    
    updateCharts() {
        // Memory leak 9: Accumulating data without bounds
        this.charts.forEach(chart => {
            const newData = {
                timestamp: new Date(),
                value: Math.random() * 100,
                chart: chart, // Reference back to chart
                dashboard: this // Reference to dashboard
            };
            
            chart.data.push(newData);
            
            // Never removes old data!
            if (chart.data.length > 1000) {
                console.warn(\`Chart \${chart.id} has \${chart.data.length} data points!\`);
            }
        });
        
        // Memory leak 10: Creating new functions in loops
        this.charts.forEach(chart => {
            chart.updateCallback = () => {
                // Captures chart and this in closure
                this.renderChart(chart);
            };
        });
    }
    
    renderChart(chart) {
        // Memory leak 11: Creating DOM elements without cleanup
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.innerHTML = \`Chart \${chart.id}: \${chart.data.length} points\`;
        
        // Adds to DOM but never removes
        document.body.appendChild(tooltip);
        
        // Memory leak 12: Event listener on tooltip
        tooltip.addEventListener('click', () => {
            // Captures chart and this
            this.showChartDetails(chart);
        });
    }
    
    showChartDetails(chart) {
        // Memory leak 13: Modal that references everything
        const modal = {
            chart: chart,
            dashboard: this,
            element: document.createElement('div'),
            data: chart.data.slice() // Copies all data!
        };
        
        modal.element.innerHTML = \`
            <div class="modal">
                <h3>Chart \${chart.id} Details</h3>
                <p>Data points: \${chart.data.length}</p>
                <button onclick="this.parentElement.remove()">Close</button>
            </div>
        \`;
        
        document.body.appendChild(modal.element);
        
        // Never removes modal from memory even when DOM element is removed
        this.modals = this.modals || [];
        this.modals.push(modal);
    }
    
    // Missing cleanup method!
    // destroy() {
    //     // Should clean up all references, listeners, timers, observers
    // }
}

// Usage that creates memory leaks
const dashboard1 = new DataDashboard('dashboard-container-1');
const dashboard2 = new DataDashboard('dashboard-container-2');

// Memory leak 14: Global references never cleaned up
window.dashboards = [dashboard1, dashboard2];

// Memory leak 15: Creating new dashboards without cleaning up old ones
function recreateDashboard() {
    const newDashboard = new DataDashboard('dashboard-container-1');
    window.dashboards.push(newDashboard);
    // Old dashboard still referenced but not used!
}

// Simulate dashboard recreation
setInterval(recreateDashboard, 30000); // Every 30 seconds!`;

    const complexCode = difficulty > 2 ? `

// Additional complexity for higher difficulty
class DataProcessor {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.workers = [];
        this.cache = new WeakMap(); // Good! But used incorrectly
        this.strongCache = new Map(); // Bad! Creates strong references
        
        this.setupWorkers();
    }
    
    setupWorkers() {
        // Memory leak 16: Web Workers not terminated
        for (let i = 0; i < 4; i++) {
            const worker = new Worker('data-worker.js');
            
            worker.onmessage = (event) => {
                // Captures this and dashboard
                this.handleWorkerMessage(event.data, worker);
            };
            
            this.workers.push(worker);
            // Workers never terminated!
        }
    }
    
    handleWorkerMessage(data, worker) {
        // Memory leak 17: Storing processed data with strong references
        const processedData = {
            original: data,
            processed: this.processData(data),
            worker: worker,
            dashboard: this.dashboard,
            timestamp: new Date()
        };
        
        // Using Map instead of WeakMap creates strong references
        this.strongCache.set(data, processedData);
        
        // Memory leak 18: Promise chains that capture scope
        Promise.resolve(processedData)
            .then(result => {
                // Captures this, worker, dashboard
                return this.validateData(result);
            })
            .then(validatedData => {
                // More captures
                this.dashboard.updateWithProcessedData(validatedData);
            })
            .catch(error => {
                // Error handler captures everything too
                console.error('Processing error', error, this.dashboard);
            });
    }
    
    processData(data) {
        // Memory leak 19: Recursive processing without cleanup
        const processedChunks = [];
        
        function processChunk(chunk, depth = 0) {
            if (depth > 100) return chunk; // Prevent infinite recursion
            
            const processed = {
                chunk: chunk,
                depth: depth,
                parent: processedChunks, // Circular reference!
                children: []
            };
            
            if (chunk.children) {
                processed.children = chunk.children.map(child => 
                    processChunk(child, depth + 1)
                );
            }
            
            processedChunks.push(processed);
            return processed;
        }
        
        return processChunk(data);
    }
}

// Memory leak 20: Global processor instances
window.processors = [];

dashboard1.processor = new DataProcessor(dashboard1);
dashboard2.processor = new DataProcessor(dashboard2);

window.processors.push(dashboard1.processor, dashboard2.processor);` : '';

    return {
      code: baseCode + complexCode,
      problems: [
        'Event listeners added but never removed (window, document, DOM elements)',
        'Timers and intervals that run indefinitely',
        'Circular references between objects preventing garbage collection',
        'DOM elements created but never removed from memory',
        'Data cache that grows indefinitely without cleanup',
        'MutationObservers that are never disconnected',
        'Closures that capture large objects unnecessarily',
        'Global references that prevent cleanup',
        ...(difficulty > 2 ? [
          'Web Workers that are never terminated',
          'Promise chains that capture large scope objects',
          'Recursive data structures with circular references',
          'WeakMap used incorrectly alongside Map creating mixed reference types'
        ] : [])
      ],
      hints: [
        'Implement a destroy/cleanup method that removes all listeners and references',
        'Use WeakMap and WeakSet for caches that should allow garbage collection',
        'Clear timers and intervals when components are destroyed',
        'Remove DOM elements and their event listeners properly',
        'Avoid capturing large objects in closures unnecessarily',
        'Disconnect MutationObservers when no longer needed',
        ...(difficulty > 2 ? [
          'Terminate Web Workers when processing is complete',
          'Use AbortController for cancellable operations',
          'Implement proper lifecycle management for recursive structures',
          'Use weak references for parent-child relationships'
        ] : [])
      ],
      requirements: [
        'Implement proper cleanup for all event listeners',
        'Add bounds to data caches and implement cleanup strategies',
        'Fix circular references between objects',
        'Properly manage DOM element lifecycle',
        'Implement a destroy method that cleans up all resources',
        'Ensure timers and intervals are cleared appropriately'
      ]
    };
  }

  private generatePythonCode(difficulty: number): GeneratedCode {
    const baseCode = `# Data Processing System - Memoryleak-odactyl Edition
import threading
import time
import weakref
from collections import defaultdict

class DataProcessor:
    def __init__(self):
        self.cache = {}  # Strong references - memory leak!
        self.observers = []
        self.threads = []
        self.timers = []
        self.circular_refs = []
        
        self.setup_processing()
    
    def setup_processing(self):
        # Memory leak 1: Threads that never stop
        worker_thread = threading.Thread(target=self.continuous_processing)
        worker_thread.daemon = False  # Won't stop when main thread exits
        worker_thread.start()
        self.threads.append(worker_thread)
        
        # Memory leak 2: Timer that captures self
        timer = threading.Timer(1.0, self.periodic_cleanup)
        timer.start()
        self.timers.append(timer)
    
    def continuous_processing(self):
        while True:  # Infinite loop - never stops!
            try:
                # Memory leak 3: Accumulating data without bounds
                data = self.generate_data()
                processed = self.process_data(data)
                
                # Store in cache without cleanup
                cache_key = f"data_{time.time()}"
                self.cache[cache_key] = {
                    'original': data,
                    'processed': processed,
                    'processor': self,  # Circular reference!
                    'timestamp': time.time()
                }
                
                print(f"Cache size: {len(self.cache)}")
                
                time.sleep(0.1)
            except Exception as e:
                # Exception handler captures self
                error_data = {
                    'error': e,
                    'processor': self,
                    'cache_size': len(self.cache)
                }
                self.cache[f"error_{time.time()}"] = error_data
    
    def generate_data(self):
        # Memory leak 4: Creating objects with circular references
        data_items = []
        
        for i in range(10):
            item = {
                'id': i,
                'value': i * 2,
                'processor': self,  # Reference back to processor
                'siblings': data_items  # Reference to list being built
            }
            data_items.append(item)
        
        # Create circular references between items
        for i, item in enumerate(data_items):
            item['next'] = data_items[(i + 1) % len(data_items)]
            item['prev'] = data_items[i - 1]
        
        return data_items
    
    def process_data(self, data):
        # Memory leak 5: Nested processing with references
        processed_items = []
        
        for item in data:
            processed = {
                'original': item,  # Keeps reference to original
                'result': item['value'] * 2,
                'processor': self,
                'all_processed': processed_items  # Circular reference
            }
            processed_items.append(processed)
        
        return processed_items
    
    def periodic_cleanup(self):
        # Memory leak 6: Fake cleanup that doesn't actually clean
        print(f"Fake cleanup - cache still has {len(self.cache)} items")
        
        # This doesn't actually remove anything!
        old_items = [k for k, v in self.cache.items() 
                    if time.time() - v.get('timestamp', 0) > 60]
        
        print(f"Found {len(old_items)} old items (but not removing them)")
        
        # Schedule next cleanup (creates new timer)
        timer = threading.Timer(10.0, self.periodic_cleanup)
        timer.start()
        self.timers.append(timer)  # Accumulating timers!
    
    def add_observer(self, callback):
        # Memory leak 7: Observers that are never removed
        observer = {
            'callback': callback,
            'processor': self,
            'created_at': time.time()
        }
        self.observers.append(observer)
        
        # Create circular reference
        observer['observers_list'] = self.observers
    
    def notify_observers(self, data):
        # Memory leak 8: Notification data accumulates
        for observer in self.observers:
            try:
                # Create notification record
                notification = {
                    'data': data,
                    'observer': observer,
                    'processor': self,
                    'timestamp': time.time()
                }
                
                # Store notification (never cleaned up)
                self.cache[f"notification_{time.time()}"] = notification
                
                observer['callback'](notification)
            except Exception as e:
                # Error handling creates more references
                error_record = {
                    'error': e,
                    'observer': observer,
                    'data': data,
                    'processor': self
                }
                self.cache[f"observer_error_{time.time()}"] = error_record

class DataManager:
    def __init__(self):
        self.processors = []
        self.global_cache = defaultdict(list)  # Never cleaned up
        
    def create_processor(self):
        # Memory leak 9: Creating processors without cleanup
        processor = DataProcessor()
        
        # Add observer that captures self
        processor.add_observer(lambda data: self.handle_processor_data(data, processor))
        
        self.processors.append(processor)
        return processor
    
    def handle_processor_data(self, data, processor):
        # Memory leak 10: Global cache accumulates data
        cache_entry = {
            'data': data,
            'processor': processor,
            'manager': self,
            'timestamp': time.time()
        }
        
        self.global_cache[processor].append(cache_entry)
        
        # Never removes old entries!
        print(f"Global cache size: {sum(len(v) for v in self.global_cache.values())}")

# Memory leak 11: Global instances never cleaned up
global_manager = DataManager()

# Create multiple processors
for i in range(3):
    processor = global_manager.create_processor()
    
# Memory leak 12: Module-level references
_all_processors = global_manager.processors
_global_cache_ref = global_manager.global_cache

# Memory leak 13: Function that creates closures
def create_data_handler(manager):
    def handler(data):
        # Captures manager in closure
        manager.global_cache['handler_data'].append({
            'data': data,
            'manager': manager,
            'timestamp': time.time()
        })
    return handler

# Create handlers that capture manager
for i in range(5):
    handler = create_data_handler(global_manager)
    # Handlers are created but references are lost, creating memory leaks`;

    return {
      code: baseCode,
      problems: [
        'Threads that run infinite loops without stop conditions',
        'Timers that accumulate without being cancelled',
        'Cache that grows indefinitely without cleanup',
        'Circular references between objects preventing garbage collection',
        'Observers that are never removed or disconnected',
        'Global references that prevent cleanup',
        'Closures that capture large objects unnecessarily'
      ],
      hints: [
        'Implement proper thread shutdown mechanisms',
        'Cancel timers when they are no longer needed',
        'Use weak references where appropriate',
        'Implement cache size limits and cleanup strategies',
        'Provide methods to remove observers',
        'Use context managers for resource management'
      ],
      requirements: [
        'Implement proper cleanup for threads and timers',
        'Add bounds to caches and implement cleanup',
        'Fix circular references between objects',
        'Implement observer removal mechanisms',
        'Add proper resource management and cleanup methods'
      ]
    };
  }
}