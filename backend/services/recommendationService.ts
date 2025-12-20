// src/services/recommendationService.ts
import { detectIntent } from './intentDetector';
import { getCookKitRecommendation } from '../core/recommenderEngine';
import { GetRecommendationResult } from '../types';

export function getRecommendation(message: string): GetRecommendationResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // === PHASE 0: EARLY OFF-TOPIC DETECTION ===
  const offTopicPatterns = [
    "what is cook kit", "cook kit kya hai", "cookkit", "cook kit hai",
    "what is this", "ye kya hai", "how does this work", "kaise kaam karta",
    "pricing", "price", "kitna", "cost", "subscription", "plan",
    "who are you", "tum kaun", "about", "team", "company",
    "contact", "support", "delivery", "order", "cancel", "refund"
  ];

  const startsWithQuestion = /^(what|kya|how|kaise|who|kaun|tell me|batavo|show menu)/i.test(trimmed);

  const foodKeywords = /\b(khana|food|dinner|lunch|recipe|banau|banao|chicken|dal|veg|nonveg|spicy|mild|protein|cook|suggest|idea|chahiye|batao|quick|easy)\b/i;
  const hasFoodContext = foodKeywords.test(lower);

  const isOffTopic =
    offTopicPatterns.some(p => lower.includes(p)) ||
    (startsWithQuestion && !hasFoodContext);

  if (isOffTopic) {
    return {
      off_topic: true,
      response: "Hey, that doesn't sound like a recipe or food request right now 😊 I'm here to help you decide what to cook — just tell me what you're in the mood for!"
    };
  }

  // === NORMAL FOOD PATH ===
  const intent = detectIntent(message);
  return getCookKitRecommendation(intent);
}