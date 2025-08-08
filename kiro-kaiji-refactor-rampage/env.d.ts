/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Local LLM Configuration
  readonly VITE_LOCAL_LLM_ENDPOINT?: string
  readonly VITE_LOCAL_LLM_MODEL?: string
  readonly VITE_LOCAL_LLM_TIMEOUT?: string
  readonly VITE_LOCAL_LLM_MAX_RETRIES?: string
  
  // OpenRouter Configuration
  readonly VITE_OPENROUTER_API_KEY?: string
  readonly VITE_OPENROUTER_MODEL?: string
  readonly VITE_OPENROUTER_BASE_URL?: string
  
  // General AI Configuration
  readonly VITE_AI_PROVIDER?: 'kiro' | 'local-llm' | 'openrouter'
  readonly VITE_AI_REQUEST_DELAY?: string
  readonly VITE_AI_MODE?: 'local' | 'cloud'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
