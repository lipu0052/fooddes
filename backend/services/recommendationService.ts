// src/services/recommendationService.ts
import { detectIntent } from './intentDetector';
import { getCookKitRecommendation } from '../core/recommenderEngine';
import { GetRecommendationResult } from '../types';

export function getRecommendation(message: string): GetRecommendationResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // === PHASE 0: IS IT FOOD-RELATED? ===
  const foodKeywords = /\b(khana|food|dinner|lunch|recipe|banau|banao|chicken|dal|veg|nonveg|spicy|mild|protein|cook|suggest|idea|chahiye|batao|quick|easy|meal|dish|eat|what to eat|paneer|egg|mutton|fish|healthy|light|indulgent|tasty|khana banao|kya khana|kuch naya)\b/i;

  const hasFoodContext = foodKeywords.test(lower);

  if (!hasFoodContext) {
    return {
      off_topic: true,
      response: "Hey, that doesn't sound like a recipe or food request right now 😊 I'm here to help you decide what to cook — just tell me what you're in the mood for!"
    };
  }

  // === NORMAL FOOD PATH ===
  const intent = detectIntent(message);

  // Let decisionEngine handle vague cases automatically
  return getCookKitRecommendation(intent);
}