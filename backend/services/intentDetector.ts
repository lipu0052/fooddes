// src/services/intentDetector.ts
// Fully updated to support ALL fields used in the ultra-extended recommender

import { DetectedIntent } from '../types';

export function detectIntent(userMessage: string): DetectedIntent {
  const message = userMessage.toLowerCase().trim();
  const intent: DetectedIntent = {
    is_vague: false,
  };

  // 1. Package Preference
  if (/\b(ghar ka khana|home style|comfort food|simple indian food|no experiment|routine|safe option)\b/.test(message)) {
    intent.package_preference = "ghar_ka_khana";
  } else if (/\b(kuch naya|something different|fusion|special dinner|celebration|indulgent mood|party type food)\b/.test(message)) {
    intent.package_preference = "aaj_kuch_naya";
  }

  // 2. Veg / Non-veg + Jain
  if (intent.jain) intent.veg_preference = "veg";

  if (/\b(veg|vegetarian|pure veg|jain food|no nonveg|no onion no garlic)\b/.test(message) &&
      !/\b(non.?veg|chicken|fish|mutton|meat|prawn|egg|seafood)\b/.test(message)) {
    intent.veg_preference = "veg";
  } else if (/\b(non.?veg|chicken|fish|mutton|prawn|meat|egg|seafood)\b/.test(message)) {
    intent.veg_preference = "non_veg";
  }

  // 3. Protein types
  const proteinTypes = new Set<string>();
  if (/\bchicken\b/.test(message)) proteinTypes.add("chicken");
  if (/\b(fish|prawn|seafood|machli)\b/.test(message)) proteinTypes.add("fish");
  if (/\b(dal|lentils|dhal|rajma|chole|pulses)\b/.test(message)) proteinTypes.add("lentils");
  if (/\b(mutton|goat|lamb)\b/.test(message)) proteinTypes.add("mutton");
  if (/\b(egg|anda)\b/.test(message)) proteinTypes.add("egg");
  if (proteinTypes.size > 0) intent.protein_type = Array.from(proteinTypes);

  // PANEER
  const hasPaneer = /\bpaneer\b/.test(message);
  const noPaneer = /\b(no paneer|without paneer|avoid paneer|paneer mat)\b/.test(message);
  if (noPaneer) {
    intent.no_paneer = true;
    if (intent.protein_type) intent.protein_type = intent.protein_type.filter(p => p !== "paneer");
  } else if (hasPaneer) {
    if (!intent.protein_type) intent.protein_type = [];
    if (!intent.protein_type.includes("paneer")) intent.protein_type.push("paneer");
  }

  if (/\b(no egg|without egg|eggless|no anda|egg free)\b/.test(message)) intent.no_egg = true;

  // 4. Spice level
  if (/\b(spicy|teekha|mirchi|masaledar)\b/.test(message) && !/\b(not|no|kam|less|mild)\b/.test(message)) {
    intent.spice_level = "spicy";
  } else if (/\b(mild|kam teekha|not spicy|soft spice)\b/.test(message)) {
    intent.spice_level = "mild";
    intent.exclude_spicy = true;
  } else if (/\b(medium|normal spice|thoda teekha|balanced)\b/.test(message)) {
    intent.spice_level = "medium";
  }

  // 5. Health & indulgence
  if (/\b(healthy|light|diet|low calorie|protein rich|less oil|not oily|soft food|easy digestion|sensitive stomach)\b/.test(message)) {
    intent.health_preference = "healthy";
    if (/\b(less oil|kam oil|no oil|oil kam ho)\b/.test(message)) intent.low_oil = true;
    if (/\b(light|halka|easy digestion|soft food)\b/.test(message)) intent.light_meal = true;
    if (/\b(sensitive stomach|pet upset|acidity|food allergy)\b/.test(message)) intent.sensitive_stomach = true;
  } else if (/\b(indulgent|rich|creamy|buttery|restaurant style|party|special|malai|makhani)\b/.test(message)) {
    intent.health_preference = "indulgent";
  }

  // 6. Time constraint
  const timeMatch = message.match(/(\d+)\s*(min|minute|mins)/i);
  if (timeMatch) intent.time_constraint = parseInt(timeMatch[1], 10);

  // 7. No chopping
  if (/\b(no chopping|no prep|minimal prep|less effort)\b/.test(message)) intent.no_chopping = true;

  // 8. High protein & no dairy
  if (/\b(high protein|protein heavy|protein chahiye)\b/.test(message)) intent.high_protein = true;
  if (/\b(no dairy|dairy free|without milk)\b/.test(message)) intent.no_dairy = true;

  // 9. Style & cuisine
  if (/\b(home|ghar|comfort|simple)\b/.test(message)) intent.comfort_food = true;
  if (/\b(new|naya|different|fusion|special|celebration|party)\b/.test(message)) intent.novelty = true;
  if (/\b(kid|children|family|bachche)\b/.test(message)) intent.family_friendly = true;

  const cuisines = new Set<string>();
  if (/\b(south indian|chettinad|coastal|kerala|tamil|andhra)\b/.test(message)) cuisines.add("south_indian");
  if (/\b(north indian|punjabi|dal makhani|butter chicken)\b/.test(message)) cuisines.add("north_indian");
  if (/\b(indo.?chinese|hakka|chinese|manchurian|noodles|chilli chicken)\b/.test(message)) cuisines.add("indo_chinese");
  if (cuisines.size > 0) intent.cuisine_style = Array.from(cuisines);

  // 10. Meal type
  if (/\b(lunch|dopahar)\b/.test(message)) intent.meal_type = "lunch";
  else if (/\b(dinner|raat)\b/.test(message)) intent.meal_type = "dinner";

  // 11. Day type
  if (/\b(weekday|office day)\b/.test(message)) intent.day_type = "weekday";
  else if (/\b(weekend|saturday|sunday)\b/.test(message)) intent.day_type = "weekend";

  // 12. People count
  if (/\b(solo|single|akela|one person)\b/.test(message)) intent.people_count = 1;
  else if (/\b(couple|2 log|two|date night)\b/.test(message)) intent.people_count = 2;
  else if (/\b(family|kids|children|whole family|4 log)\b/.test(message)) intent.people_count = 4;

  // 13. Multi-meal
  if (/\b(cook once|leftovers|kal lunch|cook once kal lunch bhi ho jaaye)\b/.test(message)) intent.multi_meal = true;

  // 14. Vague / Decision fatigue
  const vagueMatch = /\b(kya banau|kya khana|dont ask questions|just recommend|pick for me|surprise me|random|anything|kuch bhi|decide karo|dimag nahi|tired|exhausted)\b/i.test(message);
  intent.is_vague = vagueMatch;

  return intent;
}
