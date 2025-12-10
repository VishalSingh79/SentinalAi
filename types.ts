// Type definitions for the application

/**
 * Severity levels for violence incidents
 */
export enum Severity {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

/**
 * Individual violence incident detected in video
 */
export interface Incident {
  id: string;
  timestamp: string;
  seconds: number;
  severity: Severity;
  description: string;
}

/**
 * Complete analysis result from Gemini API
 */
export interface AnalysisResult {
  summary: string;
  incidents: Incident[];
}

/**
 * Application state enum
 */
export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

/**
 * Filter state for severity levels
 */
export interface FilterState {
  [Severity.LOW]: boolean;
  [Severity.MEDIUM]: boolean;
  [Severity.HIGH]: boolean;
}

/**
 * Video file validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * API configuration
 */
export interface ApiConfig {
  apiKey: string;
  model: string;
  maxFileSize: number;
}