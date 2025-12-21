// src/services/intentDetector.ts
// Fully updated to support ALL fields used in the ultra-extended recommender
// Includes detection for no_egg, advanced constraints, and future-ready patterns
// Modified according to the document: expanded regex with phrases from all relevant categories (A-L)
// Added new fields: meal_type, day_type, people_count, multi_meal, no_chopping, light_meal, jain, sensitive_stomach

import { DetectedIntent } from '../types';

export function detectIntent(userMessage: string): DetectedIntent {
  const message = userMessage.toLowerCase().trim();
  const intent: DetectedIntent = {
    is_vague: false,
  };

  // 1. Package Preference — Highest priority
  if (/\b(ghar ka khana|ghar ka|home style|maa jaisa|simple food|no experiment|weekday dinner|comfort food|homely|daily food|routine|safe option|comfort food chahiye|ghar jaisa khana|maa ke haath jaisa|simple indian food|no experiments please|plain khana|safe option hi batao|regular type food|daily wala khana|emotional comfort food|bachpan wala taste|restaurant type nahi|normal dinner chahiye|nothing fancy today|basic indian meal)\b/.test(message)) {
    intent.package_preference = "ghar_ka_khana";
  } else if (/\b(aaj kuch naya|kuch naya|something different|something new|bored|try new|variety|fusion|indo chinese|hakka|different gravy|new flavor|kuch naya try karna hai|different but safe|weekend special|special dinner idea|date night at home|something fancy|bore ho gaya normal food se|new but not risky|impress someone|occasion type meal|aaj kuch alag|indulgent mood|celebration dinner|party type food|treat meal)\b/.test(message)) {
    intent.package_preference = "aaj_kuch_naya";
  }

  // 2. Veg / Non-veg + Jain
  if (intent.jain) {
    intent.veg_preference = "veg";
  }

  if (/\b(veg|vegetarian|pure veg|pure vegetarian|only veg options|pure vegetarian food only|no nonveg|jain food options|no onion no garlic)\b/.test(message) && !/\b(non.?veg|chicken|fish|mutton|meat|prawn|egg|seafood)\b/.test(message)) {
    intent.veg_preference = "veg";
  } else if (/\b(non.?veg|nonveg|chicken|fish|mutton|prawn|meat|egg|seafood)\b/.test(message)) {
    intent.veg_preference = "non_veg";
  }

  // 3. Protein types (EXCEPT paneer — handled separately below)
  const proteinTypes = new Set<string>();
  if (/\bchicken\b/.test(message)) proteinTypes.add("chicken");
  if (/\b(fish|prawn|seafood|machli)\b/.test(message)) proteinTypes.add("fish");
  if (/\b(dal|lentils|dhal|rajma|beans|chole|chickpea|pulses)\b/.test(message)) proteinTypes.add("lentils");
  if (/\b(mutton|goat|lamb)\b/.test(message)) proteinTypes.add("mutton");
  if (/\b(egg|anda)\b/.test(message)) proteinTypes.add("egg");

  if (proteinTypes.size > 0) {
    intent.protein_type = Array.from(proteinTypes);
  }

  // 4. Spice level
  if (/\b(spicy|teekha|hot|mirchi|masaledar|proper spicy|chatpata|south indian spicy vibes|teekha khana)\b/.test(message) && !/\b(not|no|kam|less|mild)\b/.test(message)) {
    intent.spice_level = "spicy";
  } else if (/\b(mild|kam teekha|not spicy|not too spicy|no spice|no mirch|soft spice|zyada teekha nahi|bilkul bland nahi but not very spicy|kids ke liye mild|teekha khana avoid karna hai)\b/.test(message)) {
    intent.spice_level = "mild";
    intent.exclude_spicy = true;
  } else if (/\b(medium|normal spice|thoda teekha|medium spice|balanced ho)\b/.test(message)) {
    intent.spice_level = "medium";
  }

  // 5. Health & indulgence + Low oil + New: light_meal, sensitive_stomach
  if (/\b(healthy|light|diet|low calorie|fitness|weight loss|less oil|kam oil|not oily|very less oil|no oil|light oil|high protein|protein rich|protein wala|more protein|gym ke baad kya khau|something healthy but filling|light but nutritious meal|daily eating type food not junk|diet pe hoon but indian food chahiye|low calorie dinner ideas|healthy veg food without paneer|protein but not oily|post workout meal no junk|something balanced not too heavy|weight loss ke liye kya best hai|low carb indian option|protein chahiye but simple|healthy ghar ka khana type|healthy options kya hai|something healthy but not boring|aaj thoda healthy khana hai|light and healthy dinner please|indulgent nahi chahiye aaj|balance wala khana suggest karo|trying to eat better these days|not junk proper food chahiye|healthy indian food options|clean eating type meal batao|something wholesome not heavy|trying to be good today|aaj cheat day nahi hai|normal ghar ka khana healthy type|low oil food chahiye|oil kam ho bas|greasy nahi please|less oil cooking|no oily curries today|simple less masala less oil|pet heavy lagta hai oily food se|cant eat oily stuff|oil control karna hai|low calorie options|calories kam ho bas|trying to cut calories|weight loss friendly food|diet pe hoon aaj|not too many calories please|light calorie dinner|something filling but low calorie|light food chahiye|easy digestion wala khana|pet thoda upset hai|heavy food avoid karna hai|simple dal rice type kuch|comforting but light|aaj digestion ka dhyaan rakhna hai|soft food type|guilt-free dinner ideas|khane ke baad regret nahi chahiye|something healthy-ish|thoda indulgent but not too much|balance rakho please|i want to enjoy but not overdo it|mid-week guilt free food|sensitive stomach hai|medical reason se spicy nahi|doctor ne oily mana kiya hai|acidity issues safe food|food allergy thoda concern hai|cant eat heavy masala|health issue hai simple food|something safe for stomach)\b/.test(message)) {
    intent.health_preference = "healthy";
    if (/\b(less oil|kam oil|not oily|very less oil|no oil|light oil|low oil|oil kam ho bas|greasy nahi|less oil cooking|no oily curries|simple less masala less oil|pet heavy lagta hai oily food se|cant eat oily stuff|oil control karna hai)\b/.test(message)) {
      intent.low_oil = true;
    }
    if (/\b(light|halka|not heavy|light food|light and healthy|light calorie|light but nutritious|something light|easy digestion|soft food|comforting but light|something wholesome not heavy|light food chahiye|easy digestion wala khana|heavy food avoid karna hai|simple dal rice type kuch|aaj digestion ka dhyaan rakhna hai|soft food type)\b/.test(message)) {
      intent.light_meal = true;
    }
    if (/\b(sensitive stomach|pet upset|acidity|digestion ka dhyan|medical reason|health issue|sensitive stomach hai|medical reason se spicy nahi|doctor ne oily mana kiya hai|acidity issues|food allergy|cant eat heavy masala|health issue hai|something safe for stomach|pet thoda upset hai)\b/.test(message)) {
      intent.sensitive_stomach = true;
    }
  } else if (/\b(indulgent|rich|creamy|buttery|restaurant style|party|special|butter|makhani|malai|indulgent mood|celebration dinner|party type food|treat meal|thoda indulgent but not too much|buttery type food mood mein hoon)\b/.test(message)) {
    intent.health_preference = "indulgent";
  }

  // 6. Time constraint + New: no_chopping
  const timeMatch = message.match(/(\d+)\s*(min|minute|mins)/i);
  if (timeMatch) {
    intent.time_constraint = parseInt(timeMatch[1], 10);
  }

  if (/\b(no chopping|no prep|bas cook|no cutting|less effort|minimal prep|no chopping please|after work kuch easy|simple steps wala kuch)\b/.test(message)) {
    intent.no_chopping = true;
  }

  // 7. Specific constraints
  if (/\b(high protein|protein rich|protein wala|more protein|high protein dinner chahiye|protein heavy food suggest karo|gym ke baad kya khau|i want something healthy but filling|protein but not oily|post workout meal no junk|protein chahiye but simple)\b/.test(message)) intent.high_protein = true;
  if (/\b(no dairy|dairy free|without milk|no milk|no cream|lactose|no dairy please|milk products avoid|lactose intolerant|kuch bhi chalega bas paneer mat ho|dairy-free options)\b/.test(message)) intent.no_dairy = true;

  // PANEER: Separate positive vs negative detection — now handles "panner" misspellings
  const hasPaneerMention = /\b(paneer|panner)\b/i.test(message);
  const hasPaneerNegation = /\b(no paneer|without paneer|not paneer|but not paneer|paneer nahi|paneer mat|avoid paneer|no cottage cheese|bas paneer mat|paneer avoid|paneer exclude|paneer mat ho|no panner|not panner|without panner|panner nahi|panner mat|but not panner|avoid panner)\b/i.test(message);

  if (hasPaneerNegation) {
    intent.no_paneer = true;
    if (intent.protein_type) {
      intent.protein_type = intent.protein_type.filter(p => p.toLowerCase() !== "paneer");
    }
  } else if (hasPaneerMention && !hasPaneerNegation) {
    if (!intent.protein_type) intent.protein_type = [];
    if (!intent.protein_type.some(p => p.toLowerCase() === "paneer")) {
      intent.protein_type.push("paneer");
    }
  }

  if (/\b(no egg|without egg|eggless|no anda|egg free|avoid egg|egg nahi khata|no eggs no meat|sirf veg but no paneer|no eggs)\b/.test(message)) intent.no_egg = true;

  // 8. Style & occasion
  if (/\b(comfort|ghar|home|maa jaisa|simple|weekday|daily|routine|homemade|comfort food chahiye|ghar jaisa khana|maa ke haath jaisa|simple indian food|no experiments please|plain khana|safe option hi batao|regular type food|daily wala khana|emotional comfort food|bachpan wala taste|restaurant type nahi|normal dinner chahiye|nothing fancy today|basic indian meal)\b/.test(message)) intent.comfort_food = true;
  if (/\b(new|naya|different|variety|bored|try something|change|alag|experiment|kuch naya try karna hai|different but safe|weekend special|special dinner idea|date night at home|something fancy|bore ho gaya normal food se|new but not risky|impress someone|occasion type meal|aaj kuch alag|indulgent mood|celebration dinner|party type food|treat meal)\b/.test(message)) intent.novelty = true;
  if (/\b(kid|child|children|family|bachche|kids|baccha|family meals|parivar|whole family|kids ke liye best|kids ke liye mild|kids need mild)\b/.test(message)) intent.family_friendly = true;

  // 9. Cuisine hints
  const cuisines = new Set<string>();
  if (/\b(south indian|chettinad|coastal|kerala|goan|tamil|andhra|south indian style|coastal food chahiye|chettinad flavour|south indian spicy vibes)\b/.test(message)) cuisines.add("south_indian");
  if (/\b(north indian|punjabi|dal makhani|butter chicken|north indian khana|punjabi type)\b/.test(message)) cuisines.add("north_indian");
  if (/\b(indo.?chinese|hakka|chinese|manchurian|noodles|chilli chicken|indo-chinese mood)\b/.test(message)) cuisines.add("indo_chinese");
  if (/\b(ghar jaisa|home-style|simple indian food|proper desi khana)\b/.test(message)) cuisines.add("home_style");
  if (/\b(restaurant style|restaurant jaisa taste chahiye|restaurant type curry)\b/.test(message)) cuisines.add("restaurant_style");
  if (/\b(hyderabadi|hyderabadi style)\b/.test(message)) cuisines.add("hyderabadi");
  if (/\b(street-style|street-style taste)\b/.test(message)) cuisines.add("street_style");
  if (cuisines.size > 0) intent.cuisine_style = Array.from(cuisines);

  // 10. Popularity
  if (/\b(best seller|popular|top|favorite|bestseller|most ordered|everyone orders|most popular kya hai|sab log kya lete hai|safe first order kya hoga|kids ke liye best|repeat customers kya order karte hai)\b/.test(message)) intent.best_sellers = true;

  // 11. Vague / Decision fatigue
  const vagueMatch = /\b(kya banau|kya khana|dont ask questions|just recommend|dont ask|no questions|pick for me|surprise me|random|anything|whatever|kuch bhi|decide karo|dimag nahi|brain dead|tired|exhausted)\b/i.test(message);

  intent.is_vague =
    vagueMatch &&
    !intent.time_constraint &&
    !intent.no_chopping &&
    !intent.multi_meal &&
    !intent.veg_preference &&
    !intent.protein_type &&
    !intent.health_preference &&
    !intent.meal_type &&
    !intent.spice_level &&
    !intent.package_preference &&
    !intent.jain &&
    !intent.no_dairy &&
    !intent.no_egg &&
    !intent.no_paneer &&
    !intent.exclude_spicy;

  // 12. New: meal_type
  if (/\b(lunch|dopahar ka khana|office lunch|something light for lunch|lunch ke liye kya banaun|office lunch type food|lunch ideas chaiye)\b/.test(message)) {
    intent.meal_type = "lunch";
  } else if (/\b(dinner|raat ka khana|dinner ideas|lunch vs dinner|dinner ideas chahiye|heavy dinner nahi chahiye|proper dinner meal batao|raat ko kya best rahega)\b/.test(message)) {
    intent.meal_type = "dinner";
  }

  // 13. New: day_type
  if (/\b(weekday|weekdays|office day|aaj weekday hai|weekday simple food|weekday special kuch|weekdays mein kya best rehta|aaj weekday hai easy kuch)\b/.test(message)) {
    intent.day_type = "weekday";
  } else if (/\b(weekend|saturday|sunday|weekend special|weekend simple food|saturday night dinner idea|sunday ko thoda indulgent|weekends mein kya best rehta|weekend special khana chahiye)\b/.test(message)) {
    intent.day_type = "weekend";
  }

  // 14. New: people_count
  if (/\b(solo|single|akela|one person|sirf mere liye|main akela hoon|cooking for myself today|single guy food ideas|1 log|single person meal|one person dinner)\b/.test(message)) {
    intent.people_count = 1;
  } else if (/\b(couple|2 log|two|me and wife|hum dono|date night|couple dinner ideas|date night at home|hum dono ke liye kuch|2 ke liye kya banaun|2 people|dinner for two|me and wife dinner|hum dono ke liye kuch)\b/.test(message)) {
    intent.people_count = 2;
  } else if (/\b(family|parivar|kids|children|bachche|whole family|family meals|4 log|family ke liye kya banaun)\b/.test(message)) {
    intent.people_count = 4;
  }

  // 15. New: multi_meal
  if (/\b(cook once|ek baar pakao|do time khana|leftovers|kal lunch|cook once eat twice|ek baar pakao do time khana|most people cook once and use leftovers for lunch too|can i eat leftovers tomorrow|stretch to next day|cook once kal lunch bhi ho jaaye)\b/.test(message)) {
    intent.multi_meal = true;
  }

  return intent;
}