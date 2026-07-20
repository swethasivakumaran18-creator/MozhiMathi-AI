export interface LanguageInfo {
  detected_language: string;
  confidence: number;
  contains_tanglish: boolean;
}

export interface LintWarning {
  original_term: string;
  suggested_pure_term: string;
  phonetic_rendering: string;
  start_index: number;
  end_index: number;
  confidence_score: number;
  is_verified: boolean;
  explanation: string;
  example_usage?: string;
}

export interface QualityMetrics {
  writing_score: number;
  readability_level: string;
  grammar_errors_count: number;
}

export interface LintResponse {
  original_text: string;
  language_info: LanguageInfo;
  warnings: LintWarning[];
  quality_metrics: QualityMetrics;
  suggested_rewrite_pure: string;
  suggested_rewrite_phonetic: string;
}

export interface Definition {
  id?: number;
  tamil_definition: string;
  english_definition?: string;
}

export interface Example {
  id?: number;
  tamil_example: string;
  english_example?: string;
}

export interface Domain {
  id: number;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Source {
  id: number;
  name: string;
  url?: string;
  description?: string;
}

export interface Term {
  id: number;
  english_term: string;
  tamil_term: string;
  pure_tamil_term: string;
  ipa_tamil?: string;
  domain_id?: number;
  category_id?: number;
  source_id?: number;
  confidence_score: number;
  is_verified: boolean;
  domain?: Domain;
  category?: Category;
  source?: Source;
  definitions?: Definition[];
  examples?: Example[];
}
