// src/core/decisionEngine.ts
// PURE REUSABLE COOK-KIT DECISION ENGINE
// Fully fixed & enhanced: paneer flags, new intents, removed off-topic check

import {
  Recipe,
  DetectedIntent,
  RecommendationResult,
  RecipeMatch,
  ExcludedRecipe,
  AppliedFilter,
} from '../types';
import { recipes } from '../data/recipes';

// Strict off-topic detection: only proceed if ANY intent was detected
function isFoodRelated(intent: DetectedIntent): boolean {
  // If ANY preference or intent flag is set → it's a food request
  return !!(
    intent.package_preference ||
    intent.veg_preference ||
    intent.jain ||
    intent.protein_type?.length ||
    intent.wants_paneer ||
    intent.no_paneer ||
    intent.no_egg ||
    intent.no_dairy ||
    intent.spice_level ||
    intent.exclude_spicy ||
    intent.health_preference ||
    intent.low_oil ||
    intent.light_meal ||
    intent.sensitive_stomach ||
    intent.high_protein ||
    intent.no_chopping ||
    intent.time_constraint ||
    intent.comfort_food ||
    intent.novelty ||
    intent.family_friendly ||
    intent.cuisine_style?.length ||
    intent.meal_type ||
    intent.day_type ||
    intent.people_count ||
    intent.multi_meal ||
    intent.quick_meal ||
    intent.wants_roti ||
    intent.wants_rice ||
    intent.wants_biryani ||
    intent.is_vague
  );
}

export function getCookKitRecommendation(
  intent: DetectedIntent
): RecommendationResult {

  if (!isFoodRelated(intent)) {
    return {
      decision: "fallback",
      matches: [],
      excluded: [],
      intent,
      applied_filters: [],
      fallback_used: true,
      explanation:
        "Hey, that doesn't sound like a recipe or food request right now 😊 I'm here to help you decide what to cook — just tell me what you're in the mood for!",
      failure_type: "off_topic",
      followup_question: undefined,
      debug: {
        intent,
        applied_filters: [],
        excluded_count: 0,
        match_scores: [],
        decision_reason: "Input not recognized as food-related",
      },
    };
  }
  const matches: RecipeMatch[] = [];
  const excluded: ExcludedRecipe[] = [];
  const applied_filters: AppliedFilter[] = [];
  let failure_type:
    | "contradictory_constraints"
    | "impossible_time"
    | "unavailable_protein"
    | "conflicting_spice"
    | "vague_query"
    | "off_topic"
    | null = null;
  let followup_question: string | undefined = undefined;
  let fallback_used = false;
  let explanation = "";

  // === HARD FILTERS ===
  function passesHardFilters(recipe: Recipe, intent: DetectedIntent): {
    passes: boolean;
    reasons: string[];
  } {
    const excluded_reasons: string[] = [];

    if (intent.veg_preference && recipe.veg_nonveg !== intent.veg_preference) {
      excluded_reasons.push(`Does not match your ${intent.veg_preference} preference.`);
    }
    if (intent.jain && !recipe.diet_tags.includes("jain")) {
      excluded_reasons.push("Not Jain-friendly (may contain onion/garlic/roots).");
    }
    if (intent.exclude_spicy && recipe.spice_level === "spicy") {
      excluded_reasons.push("Too spicy for your preference.");
    }
    if (intent.time_constraint) {
      const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
      if (totalTime > intent.time_constraint) {
        excluded_reasons.push(`Exceeds your time limit of ${intent.time_constraint} mins.`);
      }
    }
    if (intent.no_chopping && recipe.prep_time_minutes > 5) {
      excluded_reasons.push("Requires chopping/prep, which you wanted to avoid.");
    }
    if (intent.no_dairy && recipe.contains_dairy) {
      excluded_reasons.push("Contains dairy.");
    }
    if (intent.no_paneer && recipe.contains_paneer) {
      excluded_reasons.push("Contains paneer.");
    }
    if (intent.wants_paneer && !recipe.contains_paneer) {
      excluded_reasons.push("Does not contain paneer.");
    }
    if (intent.no_egg && recipe.contains_egg) {
      excluded_reasons.push("Contains egg.");
    }
    if (intent.allergen_tags?.some((tag) => recipe.allergen_tags.includes(tag))) {
      excluded_reasons.push("Contains allergen(s) you want to avoid.");
    }
    if (intent.avoid_if?.some((tag) => recipe.avoid_if.includes(tag))) {
      excluded_reasons.push("Matches an avoid condition.");
    }
    if (intent.seasonality && !intent.seasonality.some((s) => recipe.seasonality.includes(s))) {
      excluded_reasons.push("Not in season.");
    }

    return { passes: excluded_reasons.length === 0, reasons: excluded_reasons };
  }

  // === APPLIED FILTERS (for UI/debug) ===
  if (intent.package_preference) {
    applied_filters.push({
      name: "Package Preference",
      value:
        intent.package_preference === "ghar_ka_khana"
          ? "Ghar Ka Khana: Everyday comfort, familiar Indian food"
          : intent.package_preference === "aaj_kuch_naya"
          ? "Aaj Kuch Naya: Novelty, variety, non-traditional"
          : "Khana Khazana: Abundance, multi-dish premium",
      type: "hard",
    });
  }
  if (intent.veg_preference) {
    applied_filters.push({
      name: "Diet Type",
      value:
        intent.veg_preference === "veg"
          ? "Vegetarian only (no meat/egg)"
          : "Non-vegetarian (includes meat/egg)",
      type: "hard",
    });
  }
  if (intent.jain) {
    applied_filters.push({
      name: "Diet Type",
      value: "Jain (no onion, garlic, roots)",
      type: "hard",
    });
  }
  if (intent.spice_level) {
    applied_filters.push({
      name: "Spice Level",
      value:
        intent.spice_level.charAt(0).toUpperCase() +
        intent.spice_level.slice(1) +
        (intent.exclude_spicy ? " (no spicy)" : ""),
      type: intent.exclude_spicy ? "hard" : "soft",
    });
  }
  if (intent.time_constraint) {
    applied_filters.push({
      name: "Time Limit",
      value: `Total prep + cook under ${intent.time_constraint} minutes`,
      type: "hard",
    });
  }
  if (intent.no_chopping) {
    applied_filters.push({
      name: "Effort Level",
      value: "No chopping/prep (minimal prep time)",
      type: "soft",
    });
  }
  if (intent.no_dairy) {
    applied_filters.push({
      name: "Dietary Restriction",
      value: "No dairy (excludes milk, butter, etc.)",
      type: "hard",
    });
  }
  if (intent.no_paneer) {
    applied_filters.push({
      name: "Dietary Restriction",
      value: "No paneer (excludes cottage cheese)",
      type: "hard",
    });
  }
  if (intent.wants_paneer) {
    applied_filters.push({
      name: "Dietary Preference",
      value: "Must contain paneer",
      type: "hard",
    });
  }
  if (intent.no_egg) {
    applied_filters.push({
      name: "Dietary Restriction",
      value: "No egg",
      type: "hard",
    });
  }
  if (intent.high_protein) {
    applied_filters.push({
      name: "Protein Goal",
      value: "High protein density preferred",
      type: "soft",
    });
  }
  if (intent.low_oil) {
    applied_filters.push({
      name: "Oil Level",
      value: "Very low oil preferred (minimal greasy)",
      type: "soft",
    });
  }
  if (intent.light_meal) {
    applied_filters.push({
      name: "Meal Weight",
      value: "Light meal (low calorie, easy digestion)",
      type: "soft",
    });
  }
  if (intent.sensitive_stomach) {
    applied_filters.push({
      name: "Health Concern",
      value: "Sensitive stomach (mild, light, non-irritating)",
      type: "soft",
    });
  }
  if (intent.health_preference) {
    applied_filters.push({
      name: "Health Style",
      value:
        intent.health_preference === "healthy"
          ? "Healthy, light, low calorie"
          : "Indulgent, rich, creamy",
      type: "soft",
    });
  }
  if (intent.comfort_food) {
    applied_filters.push({
      name: "Meal Style",
      value: "Comfort food (familiar, home-like)",
      type: "soft",
    });
  }
  if (intent.novelty) {
    applied_filters.push({
      name: "Meal Style",
      value: "Novelty & variety (something different)",
      type: "soft",
    });
  }
  if (intent.family_friendly) {
    applied_filters.push({
      name: "Audience",
      value: "Family & kid friendly (mild, appealing to children)",
      type: "soft",
    });
  }
  if (intent.cuisine_style && intent.cuisine_style.length > 0) {
    applied_filters.push({
      name: "Cuisine Style",
      value: intent.cuisine_style.map((c) => c.replace(/_/g, " ")).join(", "),
      type: "soft",
    });
  }
  if (intent.meal_type) {
    applied_filters.push({
      name: "Meal Type",
      value: intent.meal_type.charAt(0).toUpperCase() + intent.meal_type.slice(1),
      type: "soft",
    });
  }
  if (intent.day_type) {
    applied_filters.push({
      name: "Day Type",
      value:
        intent.day_type === "weekday"
          ? "Weekday (simple, quick)"
          : "Weekend (indulgent, special)",
      type: "soft",
    });
  }
  if (intent.people_count) {
    applied_filters.push({
      name: "Portion Size",
      value: `${intent.people_count} people (solo/couple/family adjusted)`,
      type: "soft",
    });
  }
  if (intent.multi_meal) {
    applied_filters.push({
      name: "Meal Planning",
      value: "Cook once, eat twice (good for leftovers)",
      type: "soft",
    });
  }
  if (intent.quick_meal) {
    applied_filters.push({
      name: "Effort Level",
      value: "Quick & easy meal",
      type: "soft",
    });
  }
  if (intent.wants_roti) {
    applied_filters.push({
      name: "Carb Preference",
      value: "Roti / Chapati / Paratha based",
      type: "soft",
    });
  }
  if (intent.wants_rice) {
    applied_filters.push({
      name: "Carb Preference",
      value: "Rice based",
      type: "soft",
    });
  }
  if (intent.wants_biryani) {
    applied_filters.push({
      name: "Dish Preference",
      value: "Biryani or similar",
      type: "soft",
    });
  }

  // === CANDIDATE SELECTION ===
  let candidates = recipes;
  if (intent.package_preference) {
    candidates = recipes.filter((r) => r.package === intent.package_preference);
    if (candidates.length === 0) {
      failure_type = "contradictory_constraints";
      explanation =
        "No dishes available in your preferred package type. Showing alternatives from other packages:";
      followup_question =
        "Do you want to stick to your package preference, or see options from other packages?";
      candidates = recipes;
      fallback_used = true;
    }
  }

  // === SCORING ===
  for (const recipe of candidates) {
    const { passes, reasons: excluded_reasons } = passesHardFilters(recipe, intent);
    if (!passes) {
      excluded.push({ recipe, excluded_reasons });
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // Core scoring
    if (intent.high_protein) {
      score +=
        recipe.protein_density === "high"
          ? 50
          : recipe.protein_density === "medium"
          ? 15
          : -20;
      reasons.push(`Protein match: ${recipe.protein_density}`);
    }
    if (intent.low_oil) {
      score += recipe.oil_level === "low" ? 50 : recipe.oil_level === "medium" ? 10 : -60;
    }
    if (intent.light_meal) {
      score +=
        recipe.calorie_density === "light"
          ? 40
          : recipe.calorie_density === "medium"
          ? 10
          : -30;
    }
    if (intent.sensitive_stomach) {
      if (recipe.spice_level === "mild") score += 20;
      if (recipe.oil_level === "low") score += 20;
      if (recipe.calorie_density === "light") score += 20;
      reasons.push("Suitable for sensitive stomach");
    }
    if (intent.spice_level && recipe.spice_level === intent.spice_level) {
      score += 25;
      reasons.push(`Exact spice level match: ${intent.spice_level}`);
    }
    if (intent.health_preference) {
      if (intent.health_preference === "healthy") {
        score +=
          recipe.health_positioning === "healthy" || recipe.calorie_density === "light"
            ? 35
            : recipe.health_positioning === "balanced"
            ? 10
            : -20;
      } else if (intent.health_preference === "indulgent") {
        score +=
          recipe.health_positioning === "indulgent" || recipe.calorie_density === "high"
            ? 30
            : -10;
      }
    }

    // Style boosts
    if (intent.comfort_food && recipe.comfort_food) score += 45;
    if (intent.novelty && (recipe.package === "aaj_kuch_naya" || recipe.typical_user_intents.includes("something different"))) {
      score += 45;
    }
    if (intent.family_friendly && recipe.kid_friendly) score += 30;
    if (intent.best_sellers && recipe.best_seller) score += 40;

    // NEW: Special intent boosts
    if (intent.wants_paneer && recipe.contains_paneer) {
      score += 60;
      reasons.push("Contains paneer");
    }
    if (intent.quick_meal && recipe.prep_time_minutes + recipe.cook_time_minutes < 30) {
      score += 35;
      reasons.push("Quick meal");
    }
   
    if (intent.wants_biryani && recipe.name.toLowerCase().includes("biryani")) {
      score += 80;
      reasons.push("Biryani match");
    }

    // Vague query boost
    if (intent.is_vague) {
      score += recipe.best_seller ? 100 : 0;
      score += recipe.comfort_food ? 90 : 0;
      score += recipe.veg_nonveg === "veg" ? 80 : 0;
      score += recipe.kid_friendly ? 50 : 0;
      score += recipe.weekday_suitable ? 40 : 0;
      score += recipe.difficulty_level === "easy" ? 30 : 0;
      reasons.push("Safe, popular choice for vague query");
      failure_type = "vague_query";
    }

    if (score > 0 || intent.is_vague) {
      matches.push({ recipe, score, reasons });
    }
  }

  // === CONTRADICTORY / FALLBACK LOGIC ===
  if (matches.length === 0) {
    fallback_used = true;
    explanation =
      "No perfect matches after applying your preferences. Showing safe, popular alternatives that respect ALL your hard constraints:";
    const safeFallback = recipes
      .filter((r) => r.best_seller || r.comfort_food)
      .filter((r) => passesHardFilters(r, intent).passes)
      .sort((a, b) => (b.best_seller ? 1 : 0) - (a.best_seller ? 1 : 0))
      .slice(0, 5);

    safeFallback.forEach((r) =>
      matches.push({
        recipe: r,
        score: 10,
        reasons: ["Popular and safe fallback (respects all your hard preferences)"],
      })
    );

    if (safeFallback.length === 0) {
      explanation = "No alternatives found even in fallbacks — your constraints are too strict.";
      matches.length = 0;
    }
  }

  matches.sort((a, b) => b.score - a.score);

  // Contradictory checks
  if (intent.high_protein && intent.veg_preference === "veg" && intent.no_paneer) {
    const hasHighProteinVeg = matches.some(
      (m) => m.recipe.protein_density === "high" && m.recipe.veg_nonveg === "veg"
    );
    if (!hasHighProteinVeg) {
      failure_type = "contradictory_constraints";
      explanation =
        "High-protein vegetarian without paneer is very limited. Showing best alternatives.";
      followup_question =
        "Include paneer for higher protein, or keep strictly no-paneer?";
      fallback_used = true;
    }
  } else if (intent.time_constraint && intent.time_constraint < 10) {
    failure_type = "impossible_time";
    explanation =
      "No fresh-cooked dish can be ready in under 10 minutes. Here are our fastest realistic options:";
    fallback_used = true;
    const quickOptions = recipes
      .filter((r) => {
        const tempIntent = { ...intent, time_constraint: undefined };
        return passesHardFilters(r, tempIntent).passes;
      })
      .sort(
        (a, b) =>
          a.prep_time_minutes + a.cook_time_minutes - (b.prep_time_minutes + b.cook_time_minutes)
      )
      .slice(0, 5);
    quickOptions.forEach((r) => {
      matches.push({
        recipe: r,
        score: 15,
        reasons: [`Fastest available: ready in ${r.prep_time_minutes + r.cook_time_minutes} minutes`],
      });
    });
  } else if (intent.no_chopping && intent.time_constraint && intent.time_constraint < 15) {
    failure_type = "impossible_time";
    explanation =
      "No chopping + under 15 mins is tough for proper meals. Showing minimal-prep quick options:";
    followup_question = "Relax time limit or allow some prep?";
    fallback_used = true;
    const quickOptions = recipes
      .filter((r) => {
        const tempIntent = { ...intent, time_constraint: undefined, no_chopping: false };
        return passesHardFilters(r, tempIntent).passes;
      })
      .sort(
        (a, b) =>
          a.prep_time_minutes + a.cook_time_minutes - (b.prep_time_minutes + b.cook_time_minutes)
      )
      .slice(0, 5);
    quickOptions.forEach((r) => {
      matches.push({
        recipe: r,
        score: 15,
        reasons: [`Minimal-prep quick option: ready in ${r.prep_time_minutes + r.cook_time_minutes} minutes`],
      });
    });
  }

  // Additional contradictory checks
  if (intent.spice_level === "spicy" && intent.family_friendly) {
    failure_type = "contradictory_constraints";
    explanation =
      "Spicy food for kids is tricky, as most kid-friendly dishes are mild. Showing milder alternatives:";
    followup_question = "Do you want to keep it spicy, or prioritize kid-friendly mild flavors?";
  } else if (intent.jain && intent.veg_preference === "non_veg") {
    failure_type = "contradictory_constraints";
    explanation = "Jain diet is strictly vegetarian. Showing Jain veg options:";
    followup_question = "Do you mean pure veg Jain, or relax to non-Jain veg?";
  } else if (intent.sensitive_stomach && intent.spice_level === "spicy") {
    failure_type = "contradictory_constraints";
    explanation = "Spicy food may not suit sensitive stomach. Showing mild alternatives:";
    followup_question = "Prefer to keep spicy, or switch to mild for stomach safety?";
  } else if (intent.light_meal && intent.health_preference === "indulgent") {
    failure_type = "contradictory_constraints";
    explanation = "Light meal contradicts indulgent (rich/creamy). Showing balanced options:";
    followup_question = "Prioritize light or indulgent?";
  } else if (
    intent.protein_type &&
    !matches.some((m) =>
      intent.protein_type?.some(
        (p) => m.recipe.primary_protein === p || m.recipe.secondary_protein === p
      )
    )
  ) {
    failure_type = "unavailable_protein";
    explanation = `No matches for your specific protein: ${intent.protein_type.join(
      ", "
    )}. Showing closest alternatives:`;
    fallback_used = true;
  } else if (intent.jain && matches.length < 3) {
    failure_type = "contradictory_constraints";
    explanation = "Limited Jain options available. Showing all Jain-friendly dishes:";
    followup_question = "Stick to Jain, or include non-Jain veg?";
  }

  // Explanation fallback
  if (intent.is_vague) {
    explanation =
      "You seem tired of deciding — here are our most popular, safe, and comforting options that work for almost everyone:";
  } else if (!explanation) {
    explanation = `Found ${matches.length} excellent options tailored to your request:`;
  }

  const decision: "recommendation" | "clarification" | "fallback" = followup_question
    ? "clarification"
    : fallback_used
    ? "fallback"
    : "recommendation";

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
    followup_question,
    debug: {
      intent,
      applied_filters,
      excluded_count: excluded.length,
      match_scores: matches.slice(0, 5).map((m) => ({
        recipe_id: m.recipe.id,
        score: m.score,
        reasons: m.reasons,
      })),
      decision_reason: followup_question
        ? "Clarification required due to conflicting or incomplete intent"
        : fallback_used
        ? "Fallback triggered because strict constraints reduced viable matches"
        : "Enough high-confidence matches found",
    },
  };
}