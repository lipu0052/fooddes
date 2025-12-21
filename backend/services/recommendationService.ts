// src/services/recommendationService.ts
import { detectIntent } from './intentDetector';
import { getCookKitRecommendation } from '../core/recommenderEngine';
import { GetRecommendationResult } from '../types';

export function getRecommendation(message: string): GetRecommendationResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // === PHASE 0: ROBUST FOOD vs NON-FOOD DETECTION ===

  // Expanded food-related keywords — these indicate the user is thinking about eating/cooking
const foodRelatedKeywords = /\b(khana|food|meal|dish|eat|kha|khaana|dinner|lunch|breakfast|snack|recipe|banau|banao|cook|pakana|pakao|suggest|batao|chahiye|idea|chicken|dal|paneer|veg|nonveg|non-veg|spicy|mild|protein|masala|roti|rice|sabzi|gravy|curry|rajma|chole|butter chicken|hungry|bhook|bhukh|pet|stomach|mood|craving|mana kar raha)\b/gi;

  const hasFoodContext = foodRelatedKeywords.test(lower);

  // Known explicit off-topic patterns (pricing, about us, etc.)
  const offTopicPatterns = [
    "what is cook kit", "cook kit kya hai", "cookkit", "cook kit hai",
    "what is this", "ye kya hai", "how does this work", "kaise kaam karta",
    "pricing", "price", "kitna", "cost", "subscription", "plan",
    "who are you", "tum kaun", "about", "team", "company",
    "contact", "support", "delivery", "order", "cancel", "refund",
    "menu dekhao", "full menu", "all options", "sab kuch dikhao"
  ];

  const matchesOffTopicPattern = offTopicPatterns.some(p => lower.includes(p));

  // Questions that start with what/how/who etc.
  const startsWithQuestion = /^(what|kya|kaise|how|who|kaun|tell me|batavo|show|dikhao)/i.test(trimmed);

  // Final off-topic decision:
  // - Explicit off-topic phrase → off-topic
  // - OR it's a question AND has ZERO food context → off-topic
  // Otherwise → treat as food-related (even if vague like "meal" or "dinner")
  const isOffTopic = matchesOffTopicPattern ||
    (startsWithQuestion && !hasFoodContext);

  if (isOffTopic) {
    return {
      off_topic: true,
      response: "Hey, that doesn't sound like you're thinking about food right now 😊 I'm your cooking buddy — tell me what you'd like to eat, and I'll suggest something perfect!"
    };
  }

  // === IF FOOD-RELATED BUT VERY VAGUE → Optional safe clarification (handled later in decisionEngine) ===
  // We now let it pass through to intent detection and recommender
  // The recommender already handles is_vague = true with safe popular picks

  const intent = detectIntent(message);
  return getCookKitRecommendation(intent);
}