// src/services/intentDetector.ts
// Fully updated with enhanced intent detection for ultra-extended recommender
// Fixed paneer logic + added more common Indian food intents

import { DetectedIntent } from '../types';

export function detectIntent(userMessage: string): DetectedIntent {
  const message = userMessage.toLowerCase().trim();
  const intent: DetectedIntent = {
    is_vague: false,
  };
  // Generic food/eating mention (to catch "i want to eat", "food", "meal", etc.)

  // 1. Package Preference
  if (/\b(ghar ka khana|home style|comfort food|simple indian food|no experiment|routine|safe option|daily|roz ka|ghar jaisa)\b/.test(message)) {
    intent.package_preference = "ghar_ka_khana";
  } else if (/\b(kuch naya|something different|fusion|special dinner|celebration|indulgent mood|party type food|special|bahar ka|restaurant style)\b/.test(message)) {
    intent.package_preference = "aaj_kuch_naya";
  }

  // 2. Veg / Non-veg + Jain
  if (intent.jain) intent.veg_preference = "veg";

  if (/\b(veg|vegetarian|pure veg|jain food|no nonveg|no onion no garlic|satvik)\b/.test(message) &&
    !/\b(non.?veg|chicken|fish|mutton|meat|prawn|egg|seafood|nonveg|non-veg)\b/.test(message)) {
    intent.veg_preference = "veg";
  } else if (/\b(non.?veg|chicken|fish|mutton|prawn|meat|egg|seafood|nonveg|non-veg)\b/.test(message)) {
    intent.veg_preference = "non_veg";
  }

  // Jain detection (expanded)
  if (/\b(jain|no onion no garlic|no roots|satvik)\b/.test(message)) {
    intent.jain = true;
  }

  // 3. Protein types (only animal + lentils)
  const proteinTypes = new Set<string>();
  if (/\b(chicken|murga|kukkad)\b/.test(message)) proteinTypes.add("chicken");
  if (/\b(fish|machli|prawn|jhinga|seafood)\b/.test(message)) proteinTypes.add("fish");
  if (/\b(mutton|goat|lamb|gosht)\b/.test(message)) proteinTypes.add("mutton");
  if (/\b(egg|anda)\b/.test(message)) proteinTypes.add("egg");
  if (/\b(dal|lentils|dhal|moong|masoor|rajma|chole|pulses|beans)\b/.test(message)) proteinTypes.add("lentils");
  if (proteinTypes.size > 0) intent.protein_type = Array.from(proteinTypes);

  // PANEER - Fixed: use flags only (no protein_type confusion)
  if (/\b(no paneer|without paneer|avoid paneer|paneer mat|no paneer please|paneer nahi|paneer avoid)\b/.test(message)) {
    intent.no_paneer = true;
  }
  if (/\b(paneer|paneer chahiye|want paneer|only paneer|paneer dish|paneer recipe|matar paneer|palak paneer|shahi paneer)\b/.test(message)) {
    intent.wants_paneer = true;
  }

  if (/\b(no egg|without egg|eggless|no anda|egg free|vegan|egg avoid)\b/.test(message)) intent.no_egg = true;

  // 4. Spice level
  if (/\b(spicy|teekha|mirchi|masaledar|hot|very spicy|full spice)\b/.test(message) && !/\b(not|no|kam|less|mild|soft)\b/.test(message)) {
    intent.spice_level = "spicy";
  } else if (/\b(mild|kam teekha|not spicy|soft spice|light spice|no chilli)\b/.test(message)) {
    intent.spice_level = "mild";
    intent.exclude_spicy = true;
  } else if (/\b(medium|normal spice|thoda teekha|balanced)\b/.test(message)) {
    intent.spice_level = "medium";
  }

  // 5. Health & indulgence
  if (/\b(healthy|light|diet|low calorie|protein rich|less oil|not oily|soft food|easy digestion|sensitive stomach|gut friendly|weight loss)\b/.test(message)) {
    intent.health_preference = "healthy";
    if (/\b(less oil|kam oil|no oil|oil free|oil kam ho|low fat)\b/.test(message)) intent.low_oil = true;
    if (/\b(light|halka|easy digestion|soft food|light weight)\b/.test(message)) intent.light_meal = true;
    if (/\b(sensitive stomach|pet upset|acidity|food allergy|gas|bloating)\b/.test(message)) intent.sensitive_stomach = true;
  } else if (/\b(indulgent|rich|creamy|buttery|restaurant style|party|special|malai|makhani|korma|naan|butter)\b/.test(message)) {
    intent.health_preference = "indulgent";
  }

  // 6. Time constraint
  const timeMatch = message.match(/(\d+)\s*(min|minute|mins|minutes)/i);
  if (timeMatch) intent.time_constraint = parseInt(timeMatch[1], 10);

  // 7. No chopping / Quick prep
  if (/\b(no chopping|no prep|minimal prep|less effort|quick|fast|jaldi|easy|simple)\b/.test(message)) {
    intent.no_chopping = true;
    intent.quick_meal = true;
  }

  // 8. High protein & no dairy
  if (/\b(high protein|protein heavy|protein chahiye|muscle|gym|bodybuilding)\b/.test(message)) intent.high_protein = true;
  if (/\b(no dairy|dairy free|without milk|no milk|vegan|lakto free)\b/.test(message)) intent.no_dairy = true;

  // 9. Style & cuisine (expanded)
  if (/\b(home|ghar|comfort|simple|ghar ka|desi)\b/.test(message)) intent.comfort_food = true;
  if (/\b(new|naya|different|fusion|special|celebration|party|adventurous|variety)\b/.test(message)) intent.novelty = true;
  if (/\b(kid|children|family|bachche|family friendly|kids)\b/.test(message)) intent.family_friendly = true;

  const cuisines = new Set<string>();
  if (/\b(south indian|idli|dosa|uttapam|chettinad|kerala|tamil|andhra|sambar|rasam)\b/.test(message)) cuisines.add("south_indian");
  if (/\b(north indian|punjabi|dal makhani|butter chicken|roti|naan|paratha|rajma|chole)\b/.test(message)) cuisines.add("north_indian");
  if (/\b(indo.?chinese|hakka|chinese|manchurian|noodles|chilli chicken|fried rice)\b/.test(message)) cuisines.add("indo_chinese");
  if (/\b(biryani|hyderabadi|chicken biryani|veg biryani|kebab)\b/.test(message)) cuisines.add("biryani");
  if (cuisines.size > 0) intent.cuisine_style = Array.from(cuisines);

  // 10. Meal type
  if (/\b(lunch|dopahar|khana|office lunch)\b/.test(message)) intent.meal_type = "lunch";
  else if (/\b(dinner|raat|night|khana raat)\b/.test(message)) intent.meal_type = "dinner";
  else if (/\b(breakfast|nashta|subah|poori|idli|dosa|poha|paratha)\b/.test(message)) intent.meal_type = "breakfast";

  // 11. Day type
  if (/\b(weekday|office day|working day|daily)\b/.test(message)) intent.day_type = "weekday";
  else if (/\b(weekend|saturday|sunday|holiday|party|festive)\b/.test(message)) intent.day_type = "weekend";

  // 12. People count
  if (/\b(solo|single|akela|one person|myself)\b/.test(message)) intent.people_count = 1;
  else if (/\b(couple|2 log|two|date night|duo)\b/.test(message)) intent.people_count = 2;
  else if (/\b(family|kids|children|whole family|4 log|4-5 log|group)\b/.test(message)) intent.people_count = 4;

  // 13. Multi-meal / Leftovers
  if (/\b(cook once|leftovers|kal lunch|cook once kal lunch bhi ho jaaye|ek baar mein do baar)\b/.test(message)) intent.multi_meal = true;

  // 14. Vague / Decision fatigue (expanded)
  const vagueMatch = /\b(kya banau|kya khana|kya bana du|dont ask questions|just recommend|pick for me|surprise me|random|anything|kuch bhi|decide karo|dimag nahi|tired|exhausted|bored|bore ho gaya|kuch bhi chalega|kuch bhi ho|koi bhi)\b/i.test(message);
  intent.is_vague = vagueMatch;

const genericFoodWords =
/\b(eat(ing)?|food|meal|hungry|kh(a|aa)?n(a|e)?|kha(na|oge|lenge|lo)?|bh(u|oo)k(h)?|dinner|lunch|breakfast|what to eat|kya kha(na|yein)?|khila(o|yein)?|pet bh(ar|ra))\b/i;
if (genericFoodWords.test(message)) {
  intent.has_food_mention = true;
}
  // === EXTRA: Common dish-specific intents ===
  if (/\b(roti|chapati|paratha|naan|phulka)\b/.test(message)) intent.wants_roti = true;
  if (/\b(rice|chawal|jeera rice|pulao|khichdi)\b/.test(message)) intent.wants_rice = true;
  if (/\b(biryani|pulao|khichdi)\b/.test(message)) intent.wants_biryani = true;

  return intent;
}