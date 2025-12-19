// src/services/recommendationService.ts
import { detectIntent } from './intentDetector';
import { getCookKitRecommendation } from '../core/recommenderEngine';
import { RecommendationResult } from '../types';

export function getRecommendation(message: string): RecommendationResult {
  const intent = detectIntent(message);
  return getCookKitRecommendation(intent);
}