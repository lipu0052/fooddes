// src/core/decisionEngine.ts
// PURE REUSABLE COOK-KIT DECISION ENGINE
// Exact copy of your ultra-extended recommendRecipes logic
// Callable by website, ChatGPT App, etc.

import {
  Recipe,
  DetectedIntent,
  RecommendationResult,
  RecipeMatch,
  ExcludedRecipe,
  AppliedFilter
} from '../types';
import { recipes } from '../data/recipes';

export function getCookKitRecommendation(
  intent: DetectedIntent
): RecommendationResult {

  const matches: RecipeMatch[] = [];
  const excluded: ExcludedRecipe[] = [];
  const applied_filters: AppliedFilter[] = [];
  let failure_type: "contradictory_constraints" | "impossible_time" | "unavailable_protein" | "conflicting_spice" | "vague_query" | "off_topic" | null = null;
  let followup_question: string | undefined = undefined;
  let fallback_used = false;
  let explanation = "";

  // if (intent.time_constraint && intent.time_constraint < 10) {
  //   return {
  //     matches: recipes
  //       .sort((a, b) =>
  //         (a.prep_time_minutes + a.cook_time_minutes) -
  //         (b.prep_time_minutes + b.cook_time_minutes)
  //       )
  //       .slice(0, 5)
  //       .map(r => ({
  //         recipe: r,
  //         score: 15,
  //         reasons: [
  //           `Fastest available: ready in ${r.prep_time_minutes + r.cook_time_minutes} minutes`
  //         ]
  //       })),
  //     excluded: [],
  //     intent,
  //     applied_filters,
  //     fallback_used: true,
  //     explanation:
  //       "No fresh-cooked dish can be ready in under 10 minutes. Here are the fastest realistic options:",
  //     failure_type: "impossible_time",
  //     followup_question: undefined
  //   };
  // }

  if (intent.package_preference) {
    applied_filters.push({
      name: "Package Preference",
      value: intent.package_preference === "ghar_ka_khana"
        ? "Ghar Ka Khana: Everyday comfort, familiar Indian food"
        : intent.package_preference === "aaj_kuch_naya"
          ? "Aaj Kuch Naya: Novelty, variety, non-traditional"
          : "Khana Khazana: Abundance, multi-dish premium",
      type: "hard"
    });
  }

  if (intent.veg_preference) {
    applied_filters.push({
      name: "Diet Type",
      value: intent.veg_preference === "veg" ? "Vegetarian only (no meat/egg)" : "Non-vegetarian (includes meat/egg)",
      type: "hard"
    });
  }

  if (intent.jain) {
    applied_filters.push({
      name: "Diet Type",
      value: "Jain (no onion, garlic, roots)",
      type: "hard"
    });
  }

  if (intent.spice_level) {
    applied_filters.push({
      name: "Spice Level",
      value: intent.spice_level.charAt(0).toUpperCase() + intent.spice_level.slice(1) + (intent.exclude_spicy ? " (no spicy)" : ""),
      type: intent.exclude_spicy ? "hard" : "soft"
    });
  }

  if (intent.time_constraint) {
    applied_filters.push({
      name: "Time Limit",
      value: `Total prep + cook under ${intent.time_constraint} minutes`,
      type: "hard"
    });
  }

  if (intent.no_chopping) {
    applied_filters.push({
      name: "Effort Level",
      value: "No chopping/prep (minimal prep time)",
      type: "soft"
    });
  }

  if (intent.no_dairy) {
    applied_filters.push({ name: "Dietary Restriction", value: "No dairy (excludes milk, butter, etc.)", type: "hard" });
  }

  if (intent.no_paneer) {
    applied_filters.push({ name: "Dietary Restriction", value: "No paneer (excludes cottage cheese)", type: "hard" });
  }

  if (intent.no_egg) {
    applied_filters.push({ name: "Dietary Restriction", value: "No egg", type: "hard" });
  }

  if (intent.high_protein) {
    applied_filters.push({ name: "Protein Goal", value: "High protein density preferred", type: "soft" });
  }

  if (intent.low_oil) {
    applied_filters.push({ name: "Oil Level", value: "Very low oil preferred (minimal greasy)", type: "soft" });
  }

  if (intent.light_meal) {
    applied_filters.push({ name: "Meal Weight", value: "Light meal (low calorie, easy digestion)", type: "soft" });
  }

  if (intent.sensitive_stomach) {
    applied_filters.push({ name: "Health Concern", value: "Sensitive stomach (mild, light, non-irritating)", type: "soft" });
  }

  if (intent.health_preference) {
    applied_filters.push({
      name: "Health Style",
      value: intent.health_preference === "healthy" ? "Healthy, light, low calorie" : "Indulgent, rich, creamy",
      type: "soft"
    });
  }

  if (intent.comfort_food) {
    applied_filters.push({ name: "Meal Style", value: "Comfort food (familiar, home-like)", type: "soft" });
  }

  if (intent.novelty) {
    applied_filters.push({ name: "Meal Style", value: "Novelty & variety (something different)", type: "soft" });
  }

  if (intent.family_friendly) {
    applied_filters.push({ name: "Audience", value: "Family & kid friendly (mild, appealing to children)", type: "soft" });
  }

  if (intent.cuisine_style && intent.cuisine_style.length > 0) {
    applied_filters.push({
      name: "Cuisine Style",
      value: intent.cuisine_style.map(c => c.replace(/_/g, " ")).join(", "),
      type: "soft"
    });
  }

  if (intent.best_sellers) {
    applied_filters.push({ name: "Popularity", value: "Best sellers & popular choices only", type: "soft" });
  }

  if (intent.meal_type) {
    applied_filters.push({
      name: "Meal Type",
      value: intent.meal_type.charAt(0).toUpperCase() + intent.meal_type.slice(1),
      type: "soft"
    });
  }

  if (intent.day_type) {
    applied_filters.push({
      name: "Day Type",
      value: intent.day_type === "weekday" ? "Weekday (simple, quick)" : "Weekend (indulgent, special)",
      type: "soft"
    });
  }

  if (intent.people_count) {
    applied_filters.push({
      name: "Portion Size",
      value: `${intent.people_count} people (solo/couple/family adjusted)`,
      type: "soft"
    });
  }

  if (intent.multi_meal) {
    applied_filters.push({
      name: "Meal Planning",
      value: "Cook once, eat twice (good for leftovers)",
      type: "soft"
    });
  }

  if (intent.difficulty_preference) {
    applied_filters.push({
      name: "Difficulty",
      value: intent.difficulty_preference.charAt(0).toUpperCase() + intent.difficulty_preference.slice(1),
      type: "soft"
    });
  }

  if (intent.dish_format) {
    applied_filters.push({
      name: "Dish Format",
      value: intent.dish_format.replace(/_/g, " "),
      type: "soft"
    });
  }

  let candidates = recipes;
  if (intent.package_preference) {
    candidates = recipes.filter(r => r.package === intent.package_preference);
    if (candidates.length === 0) {
      failure_type = "contradictory_constraints";
      explanation = "No dishes available in your preferred package type. Showing alternatives from other packages:";
      followup_question = "Do you want to stick to your package preference, or see options from other packages?";
      candidates = recipes;
      fallback_used = true;
    }
  }

  for (const recipe of candidates) {
    const excluded_reasons: string[] = [];
    let score = 0;
    const reasons: string[] = [];

    if (intent.veg_preference && recipe.veg_nonveg !== intent.veg_preference) {
      excluded_reasons.push(`Does not match your ${intent.veg_preference} preference (recipe is ${recipe.veg_nonveg})`);
    }

    if (intent.jain && !recipe.diet_tags.includes("jain")) {
      excluded_reasons.push(`Not Jain-friendly (may contain onion/garlic/roots)`);
    }

    if (intent.exclude_spicy && recipe.spice_level === "spicy") {
      excluded_reasons.push(`Too spicy for your mild preference (recipe spice level is spicy)`);
    }

    const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
    if (intent.time_constraint && totalTime > intent.time_constraint) {
      excluded_reasons.push(`Takes ${totalTime} minutes, which exceeds your ${intent.time_constraint}-minute limit`);
    } else if (intent.time_constraint) {
      score += 30;
      reasons.push(`Fits your time limit: ready in ${totalTime} minutes`);
    }

    if (intent.no_chopping && recipe.prep_time_minutes > 5) {
      excluded_reasons.push(`Requires prep/chopping (prep time ${recipe.prep_time_minutes} mins)`);
    }

    if (intent.no_dairy && recipe.contains_dairy) {
      excluded_reasons.push(`Contains dairy, which you requested to avoid`);
    }

    if (intent.no_paneer && recipe.contains_paneer) {
      excluded_reasons.push(`Contains paneer, which you requested to avoid`);
    }

    if (intent.no_egg && recipe.contains_egg) {
      excluded_reasons.push(`Contains egg, which you requested to avoid`);
    }

    if (intent.allergen_tags && intent.allergen_tags.some(tag => recipe.allergen_tags.includes(tag))) {
      excluded_reasons.push(`Contains allergen(s) you want to avoid: ${intent.allergen_tags.join(", ")}`);
    }

    if (intent.avoid_if && intent.avoid_if.some(avoid => recipe.avoid_if.includes(avoid))) {
      excluded_reasons.push(`Not suitable for your avoid condition: ${intent.avoid_if.join(", ")}`);
    }

    if (intent.seasonality && !intent.seasonality.some(s => recipe.seasonality.includes(s))) {
      excluded_reasons.push(`Not in season for your preferences: ${intent.seasonality.join(", ")}`);
    }

    if (intent.sensitive_stomach) {
      if (recipe.spice_level !== "mild" || recipe.oil_level !== "low" || recipe.calorie_density !== "light") {
        excluded_reasons.push(`Not suitable for sensitive stomach (may be spicy/oily/heavy)`);
      }
    }

    if (excluded_reasons.length > 0) {
      excluded.push({ recipe, excluded_reasons });
      continue;
    }

    if (intent.package_preference && recipe.package === intent.package_preference) {
      score += 60;
      reasons.push(`Matches your package preference: ${intent.package_preference}`);
    }

    if (intent.protein_type?.some(p => recipe.primary_protein === p || recipe.secondary_protein === p)) {
      score += 40;
      reasons.push(`Features preferred protein: ${recipe.primary_protein || recipe.secondary_protein}`);
    }

    if (intent.high_protein) {
      if (recipe.protein_density === "high") {
        score += 50;
        reasons.push(`High protein density match`);
      } else if (recipe.protein_density === "medium") {
        score += 15;
        reasons.push(`Medium protein density — reasonable fit`);
      } else {
        score -= 20;
      }
    }

    if (intent.low_oil) {
      if (recipe.oil_level === "low") {
        score += 50;
        reasons.push(`Very low oil — ideal for 'very less oil' preference`);
      } else if (recipe.oil_level === "medium") {
        score += 10;
        reasons.push(`Medium oil — acceptable but not the lightest`);
      } else if (recipe.oil_level === "high") {
        score -= 60;
      }
    }

    if (intent.light_meal) {
      if (recipe.calorie_density === "light") {
        score += 40;
        reasons.push(`Light calorie density — easy on digestion`);
      } else if (recipe.calorie_density === "medium") {
        score += 10;
        reasons.push(`Medium calorie — moderate fit for light meal`);
      } else {
        score -= 30;
      }
    }

    if (intent.sensitive_stomach) {
      if (recipe.spice_level === "mild") score += 20;
      if (recipe.oil_level === "low") score += 20;
      if (recipe.calorie_density === "light") score += 20;
      reasons.push(`Suitable for sensitive stomach: mild, low oil, light`);
    }

    if (intent.spice_level && recipe.spice_level === intent.spice_level) {
      score += 25;
      reasons.push(`Exact spice level match: ${intent.spice_level}`);
    } else if (intent.spice_level) {
      score -= 10;
    }

    if (intent.health_preference === "healthy") {
      if (recipe.health_positioning === "healthy" || recipe.calorie_density === "light") {
        score += 35;
        reasons.push(`Healthy positioning — low calorie/light`);
      } else if (recipe.health_positioning === "balanced") {
        score += 10;
        reasons.push(`Balanced health — moderate fit`);
      } else {
        score -= 20;
      }
    } else if (intent.health_preference === "indulgent") {
      if (recipe.health_positioning === "indulgent" || recipe.calorie_density === "high") {
        score += 30;
        reasons.push(`Indulgent and rich — perfect match`);
      } else {
        score -= 10;
      }
    }

    if (intent.comfort_food && recipe.comfort_food) {
      score += 45;
      reasons.push(`Comfort food match — familiar and soothing`);
    }

    if (intent.novelty && (recipe.package === "aaj_kuch_naya" || recipe.typical_user_intents.includes("something different"))) {
      score += 45;
      reasons.push(`Novelty match — something new and exciting`);
    }

    if (intent.family_friendly && recipe.kid_friendly) {
      score += 30;
      reasons.push(`Kid and family friendly — mild and appealing`);
    }

    if (intent.cuisine_style?.includes(recipe.cuisine_style) || intent.cuisine_style?.includes(recipe.region_style)) {
      score += 35;
      reasons.push(`Cuisine/region match: ${recipe.cuisine_style || recipe.region_style}`);
    }

    if (recipe.best_seller) {
      score += 40;
      reasons.push(`Best seller — proven popular choice`);
    } else if (intent.best_sellers) {
      score -= 15;
    }

    if (intent.day_type === "weekday" && recipe.weekday_suitable) {
      score += 20;
      reasons.push(`Suitable for weekdays — quick and simple`);
    } else if (intent.day_type === "weekend" && recipe.weekend_indulgent) {
      score += 20;
      reasons.push(`Indulgent for weekends — special treat`);
    }

    if (intent.meal_type && recipe.meal_type.includes(intent.meal_type)) {
      score += 25;
      reasons.push(`Matches meal context: ${intent.meal_type}`);
    }

    if (intent.multi_meal && !recipe.avoid_if.includes("does not store well")) {
      score += 25;
      reasons.push(`Good for leftovers — cook once, eat twice`);
    }

    if (intent.is_vague && recipe.difficulty_level === "easy") {
      score += 15;
      reasons.push(`Easy difficulty — no hassle for tired days`);
    }
    if (intent.difficulty_preference && recipe.difficulty_level === intent.difficulty_preference) {
      score += 20;
      reasons.push(`Matches difficulty preference: ${intent.difficulty_preference}`);
    }

    if (intent.carb_type && recipe.carb_type === intent.carb_type) {
      score += 20;
      reasons.push(`Matches your carb preference: ${intent.carb_type}`);
    }

    if (intent.diet_tags && intent.diet_tags.some(tag => recipe.diet_tags.includes(tag))) {
      score += 25;
      reasons.push(`Matches your diet tags: ${intent.diet_tags.join(", ")}`);
    }

    if (intent.typical_spice_profile && intent.typical_spice_profile.some(profile => recipe.typical_spice_profile.includes(profile))) {
      score += 15;
      reasons.push(`Spice profile match: ${intent.typical_spice_profile.join(", ")}`);
    }

    if (intent.seasonality && intent.seasonality.some(s => recipe.seasonality.includes(s))) {
      score += 15;
      reasons.push(`In season for your preference: ${intent.seasonality.join(", ")}`);
    }

    if (intent.is_vague) {
      failure_type = "vague_query";

      if (recipe.best_seller) score += 100;
      if (recipe.comfort_food) score += 90;
      if (recipe.veg_nonveg === "veg") score += 80;
      if (recipe.kid_friendly) score += 50;
      if (recipe.weekday_suitable) score += 40;
      if (recipe.difficulty_level === "easy") score += 30;

      if (intent.is_vague) {
        if (recipe.best_seller) score += 60;
        if (recipe.comfort_food) score += 50;
        if (recipe.veg_nonveg === "veg") score += 40;

        if (!intent.package_preference) {
          if (recipe.name.toLowerCase().includes("rajma")) score += 120;
          if (recipe.name.toLowerCase().includes("dal makhani")) score += 100;
        }

        if (intent.veg_preference === "non_veg" && recipe.name.toLowerCase().includes("butter chicken")) {
          score += 80;
        }
      }

      if (recipe.name.toLowerCase().includes("butter chicken")) score += 120;

      reasons.push("Safe, popular, no-brainer choice for when you don't want to think");
    }

    if (intent.people_count) {
      if (intent.people_count === 1 && !recipe.kid_friendly) score += 10;
      if (intent.people_count === 2 && recipe.weekend_indulgent) score += 10;
      if (intent.people_count >= 4 && recipe.kid_friendly) score += 15;
      reasons.push(`Adjusted for ${intent.people_count} people`);
    }

    if (score > 0 || intent.is_vague) {
      matches.push({
        recipe,
        score,
        reasons: reasons.length > 0 ? reasons : ["Solid recommendation based on your request"]
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  const hasTrueHighProteinVegMatch = matches.some(
    m => m.recipe.protein_density === "high" && m.recipe.veg_nonveg === "veg"
  );

  if (
    intent.high_protein &&
    intent.veg_preference === "veg" &&
    intent.no_paneer &&
    matches.length < 2
  ) {
    failure_type = "contradictory_constraints";
    if (hasTrueHighProteinVegMatch) {
      explanation = "Great! Found high-protein vegetarian options without paneer.";
    } else {
      explanation = "Quick check — high-protein vegetarian without paneer is quite tricky in Indian cooking. Most high-protein veg dishes rely heavily on paneer. Showing the best lentil and bean-based alternatives:";
      followup_question = "Would you like to keep it strictly no-paneer, or should I include paneer options for higher protein?";
    }
  } else if (intent.spice_level === "spicy" && intent.family_friendly) {
    failure_type = "contradictory_constraints";
    explanation = "Quick check — spicy food for kids is tricky, as most kid-friendly dishes are mild. Showing milder alternatives:";
    followup_question = "Do you want to keep it spicy, or prioritize kid-friendly mild flavors?";
  } else if (intent.jain && intent.veg_preference === "non_veg") {
    failure_type = "contradictory_constraints";
    explanation = "Jain diet is strictly vegetarian. Cannot include non-veg. Showing Jain veg options:";
    followup_question = "Do you mean pure veg Jain, or relax to non-Jain veg?";
  } else if (intent.sensitive_stomach && intent.spice_level === "spicy") {
    failure_type = "contradictory_constraints";
    explanation = "Spicy food may not suit sensitive stomach. Showing mild alternatives:";
    followup_question = "Prefer to keep spicy, or switch to mild for stomach safety?";
  } else if (intent.light_meal && intent.health_preference === "indulgent") {
    failure_type = "contradictory_constraints";
    explanation = "Light meal contradicts indulgent (rich/creamy). Showing balanced options:";
    followup_question = "Prioritize light or indulgent?";
  }

  else if (intent.time_constraint && intent.time_constraint < 10) {
    failure_type = "impossible_time";
    explanation = "No fresh-cooked dish can be ready in under 10 minutes. Here are our fastest realistic options:";
    fallback_used = true;
    const quickOptions = recipes
      .sort((a, b) => (a.prep_time_minutes + a.cook_time_minutes) - (b.prep_time_minutes + b.cook_time_minutes))
      .slice(0, 5);
    quickOptions.forEach(r => {
      matches.push({
        recipe: r,
        score: 15,
        reasons: [`Fastest available: ready in ${r.prep_time_minutes + r.cook_time_minutes} minutes`]
      });
    });
  } else if (intent.no_chopping && intent.time_constraint && intent.time_constraint < 15) {
    failure_type = "impossible_time";
    explanation = "No chopping + under 15 mins is tough for proper meals. Showing minimal-prep quick options:";
    followup_question = "Relax time limit or allow some prep?";
    fallback_used = true;
  }

  else if (intent.protein_type && !matches.some(m => intent.protein_type?.some(p => m.recipe.primary_protein === p || m.recipe.secondary_protein === p))) {
    failure_type = "unavailable_protein";
    explanation = `No matches for your specific protein: ${intent.protein_type.join(", ")}. Showing closest alternatives:`;
    fallback_used = true;
  } else if (intent.jain && matches.length < 3) {
    failure_type = "contradictory_constraints";
    explanation = "Limited Jain options available. Showing all Jain-friendly dishes:";
    followup_question = "Stick to Jain, or include non-Jain veg?";
  }

  else if (matches.length === 0) {
    fallback_used = true;
    explanation = "No dishes matched all your criteria. Showing our most loved comfort options instead:";
    const safeFallback = recipes
      .filter(r => r.best_seller || r.comfort_food)
      .sort((a, b) => (b.best_seller ? 1 : 0) - (a.best_seller ? 1 : 0))
      .slice(0, 5);
    safeFallback.forEach(r => {
      matches.push({
        recipe: r,
        score: 10,
        reasons: ["Popular and safe choice (closest available match)"]
      });
    });
  }

  else if (intent.is_vague) {
    explanation = "You seem tired of deciding — here are our most popular, safe, and comforting options that work for almost everyone:";
  }

  else {
    if (intent.jain) {
      explanation = `Jain-friendly options — no onion/garlic/roots:`;
    } else if (intent.low_oil && intent.high_protein) {
      explanation = `Perfect — high protein with very less oil! Here are lighter, protein-packed options:`;
    } else if (intent.low_oil) {
      explanation = `Got it — very less oil! Here are light, minimal-oil choices:`;
    } else if (intent.high_protein) {
      explanation = `High protein picks coming right up — here are the best options:`;
    } else if (intent.comfort_food) {
      explanation = `Comfort food just like home — here are familiar, cozy options:`;
    } else if (intent.novelty) {
      explanation = `Something new and different — here are exciting variety options:`;
    } else if (intent.family_friendly) {
      explanation = `Family-friendly and kid-approved — here are mild, fun options:`;
    } else if (intent.light_meal) {
      explanation = `Light and easy meals — here are non-heavy options:`;
    } else if (intent.sensitive_stomach) {
      explanation = `Gentle on the stomach — here are mild, digestible choices:`;
    } else if (intent.multi_meal) {
      explanation = `Cook once, eat twice — here are leftover-friendly options:`;
    } else if (intent.day_type === "weekday") {
      explanation = `Weekday simple meals — quick and routine-friendly:`;
    } else if (intent.day_type === "weekend") {
      explanation = `Weekend specials — indulgent and fun:`;
    } else if (intent.meal_type === "lunch") {
      explanation = `Lunch ideas — light and office-friendly:`;
    } else if (intent.meal_type === "dinner") {
      explanation = `Dinner options — comforting end-of-day meals:`;
    } else {
      explanation = `Found ${matches.length} excellent options tailored to your request:`;
    }
  }

  const decision: "recommendation" | "clarification" | "fallback" =
    followup_question
      ? "clarification"
      : fallback_used
        ? "fallback"
        : "recommendation";


  // Ensure fallback_used is true if a clarification is asked
  if (followup_question && !fallback_used) fallback_used = true;

return {
  decision,
  matches: matches.slice(0, 5),
  excluded,
  intent,
  applied_filters,
  fallback_used,
  explanation,
  failure_type,
  followup_question
};



}