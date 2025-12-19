// src/services/recommendationService.ts
import { detectIntent } from './intentDetector';
import { getCookKitRecommendation } from '../core/recommenderEngine';
import { RecommendationResult } from '../types';

export function getRecommendation(message: string, debug: boolean = false): RecommendationResult {
  const intent = detectIntent(message);
  return getCookKitRecommendation(intent, debug);  // <-- pass debug to decision engine
}