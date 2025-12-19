// src/routes/recommend.ts
// FULLY ALIGNED WITH PDF DOCUMENT (Categories A, B, C visible)
// - Exact phrasing, turn strategy, and flow from document examples
// - Category A (Decision Fatigue): Butter Chicken / Rajma / Dal Makhani defaults
// - Category B (Time/Effort): Veg Khichdi priority for quick/no-chopping, Rajma/Dal for multi-meal
// - No overwriting: Category B wins when time_constraint/no_chopping/multi_meal detected
// - One binary question max per turn
// - Escape options always present
// - Soft close with WhatsApp/cart options

import { Router } from 'express';
import { recipes } from '../data/recipes';
import { getRecommendation } from '../services/recommendationService'; // ← CHANGED
import { DetectedIntent, Recipe, RecommendationResult, RecipeMatch } from '../types';

const router = Router();

// In-memory conversation state
const conversationState = new Map<string, {
  userId: string;
  lastIntent?: DetectedIntent;
  currentIntent?: DetectedIntent;
  pendingRecipeId?: string;
  name?: string;
  stage: 'initial' | 'narrowing' | 'commitment' | 'capture_name' | 'soft_close' | 'closed';
}>();

function getRecipeByName(nameSubstring: string): Recipe | null {
  return recipes.find(r => r.name.toLowerCase().includes(nameSubstring.toLowerCase())) || null;
}

function getPendingRecipe(pendingId?: string): Recipe | null {
  if (!pendingId) return null;
  return recipes.find(r => r.id === pendingId) || null;
}

router.post('/recommend', (req, res) => {
  const { message, userId = 'anon' } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  try {
    const recommenderResult: RecommendationResult = getRecommendation(message); // ← CHANGED (was detectIntent + recommendRecipes)

    if (recommenderResult.failure_type === 'impossible_time') {
      res.json({
        success: true,
        data: {
          explanation: recommenderResult.explanation,
          followup_question: null,
          intent: recommenderResult.intent,
          applied_filters: recommenderResult.applied_filters,
          failure_type: recommenderResult.failure_type,
          fallback_used: true,
          conversation_stage: 'closed',
          escape_options: ['Show fastest options', 'Reset / start over'],
          soft_close_options: [],
          total_matches: recommenderResult.matches.length,
          total_excluded: 0,
          recommendations: recommenderResult.matches.map(m => ({
            id: m.recipe.id,
            name: m.recipe.name,
            total_time: m.recipe.prep_time_minutes + m.recipe.cook_time_minutes,
            veg_nonveg: m.recipe.veg_nonveg,
            score: m.score,
            reasons: m.reasons
          })),
          excluded: []
        }
      });
      return;
    }

    if (!conversationState.has(userId)) {
      conversationState.set(userId, { userId, stage: 'initial' });
    }
    const state = conversationState.get(userId)!;

    const mergedIntent: DetectedIntent = { ...state.lastIntent, ...recommenderResult.intent };
    state.currentIntent = mergedIntent;
    state.lastIntent = mergedIntent;

    let conversationalResponse = '';
    let followupQuestion: string | null = null;
    let softCloseOptions: string[] = [];
    const escapeOptions: string[] = ['Show full menu', 'Show bestsellers', 'Reset / start over'];

    const hasMatches = recommenderResult.matches.length > 0;
    let topRecipe: Recipe | null = recommenderResult.matches[0]?.recipe || null;

    const isDecisionFatigue =
      mergedIntent.is_vague === true && state.stage === 'initial';

    const isTimeEffort =
      mergedIntent.time_constraint !== undefined ||
      mergedIntent.no_chopping === true ||
      mergedIntent.multi_meal === true;

    const peopleCount = mergedIntent.people_count || 2;

    let currentRecipe: Recipe | null = getPendingRecipe(state.pendingRecipeId);

    if (isTimeEffort && state.stage === 'initial') {
      if (mergedIntent.time_constraint !== undefined || mergedIntent.no_chopping) {
        currentRecipe = topRecipe;

        if (!currentRecipe || mergedIntent.is_vague) {
          const khichdi = getRecipeByName('khichdi');
          if (khichdi) currentRecipe = topRecipe = khichdi;
        }
      }

      else if (mergedIntent.multi_meal) {
        const dal = getRecipeByName('dal makhani') || getRecipeByName('rajma');
        if (dal) currentRecipe = topRecipe = dal;
      }

      if (currentRecipe) {
        const totalTime = currentRecipe.prep_time_minutes + currentRecipe.cook_time_minutes;
        conversationalResponse = `Yeah, those days 😄\n\nIf you want something genuinely quick, I’d suggest ${currentRecipe.name} — light, comforting, and done in about ${totalTime} mins end-to-end.\n\nNo chopping, oil and masala are included.`;
        followupQuestion = mergedIntent.veg_preference
          ? null
          : 'Veg works, or do you want chicken instead?';
        state.stage = 'narrowing';
        state.pendingRecipeId = currentRecipe.id;
      }
    }
    else if (isTimeEffort && currentRecipe) {
      if (state.stage === 'narrowing' && mergedIntent.veg_preference) {
        conversationalResponse = `Perfect. Most people cook this once and use the rest for lunch the next day too.`;
        followupQuestion = `Shall I set this up for ${peopleCount} people?`;
        state.stage = 'commitment';
      } else if (state.stage === 'commitment' && /yes|haan|ok|sure|yeah|yes please/i.test(message)) {
        conversationalResponse = `Got it 👍\n\nWhat name should I save this under?`;
        state.stage = 'capture_name';
      } else if (state.stage === 'capture_name') {
        state.name = message.trim();
        conversationalResponse = `Thanks ${state.name}.\n\nWant me to add this to cart now, or send the summary on WhatsApp so you can order later?`;
        softCloseOptions = ['Add to cart', 'Send on WhatsApp'];
        state.stage = 'soft_close';
      } else if (state.stage === 'soft_close') {
        conversationalResponse = `Cool! All set whenever you're ready 😊`;
        state.stage = 'closed';
      }
    }

    else if (isDecisionFatigue && !isTimeEffort && state.stage === 'initial') {
      if (message.toLowerCase().includes("dont ask questions") || message.toLowerCase().includes("don't ask")) {
        const rajma = getRecipeByName("rajma chawal") || getRecipeByName("rajma") || getRecipeByName("dal makhani");
        if (rajma) {
          currentRecipe = topRecipe = rajma;
          conversationalResponse = `Got it 🙂\n\nI’d go with ${rajma.name} today — simple, filling, and very home-style.\n\nIt’s one of our safest comfort meals when you don’t want to think.\n\nIf that works, I can set it up for you right away.\n\nOr if you prefer chicken instead, just tell me.`;
          followupQuestion = null;
          state.pendingRecipeId = rajma.id;
          state.stage = 'narrowing';
        }
      }
      else {
        const butterChicken = getRecipeByName('butter chicken');
        const rajma = getRecipeByName('rajma') || getRecipeByName('dal makhani');
        currentRecipe = topRecipe = butterChicken || rajma || topRecipe;

        if (currentRecipe) {
          conversationalResponse = `Totally get it — decision fatigue is real 😄\n\nIf you want a no-brainer, I’d suggest ${currentRecipe.name} with naan or rice.\n\nIt’s our most ordered dish and works for almost everyone.`;
          followupQuestion = 'Want me to lock something veg or non-veg for you?';
          state.pendingRecipeId = currentRecipe.id;
          state.stage = 'narrowing';
        }
      }
    }
    else if (isDecisionFatigue && !isTimeEffort && currentRecipe) {
      const totalTime = currentRecipe.prep_time_minutes + currentRecipe.cook_time_minutes;

      if (state.stage === 'narrowing' && mergedIntent.veg_preference) {
        conversationalResponse = `Perfect. Then I’d stick with ${currentRecipe.name} — mild, comforting, and done in about ${totalTime} mins.\n\nMost people cook once and use leftovers for lunch the next day too.`;
        followupQuestion = `Shall I set this up for ${peopleCount} people?`;
        state.stage = 'commitment';
      } else if (state.stage === 'commitment' && /yes|haan|ok|sure|yeah/i.test(message)) {
        conversationalResponse = `Nice. I’ll keep that ready.\n\nBy the way, what name should I save this under?`;
        state.stage = 'capture_name';
      } else if (state.stage === 'capture_name') {
        state.name = message.trim();
        conversationalResponse = `Thanks ${state.name} 👍\n\nWant me to add this to cart now, or should I send the details on WhatsApp so you can check out later?`;
        softCloseOptions = ['Add to cart', 'Send on WhatsApp'];
        state.stage = 'soft_close';
      } else if (state.stage === 'soft_close') {
        conversationalResponse = `Cool! All set whenever you're ready 😊`;
        state.stage = 'closed';
      }
    }

    if (conversationalResponse === '' && hasMatches && topRecipe) {
      const totalTime = topRecipe.prep_time_minutes + topRecipe.cook_time_minutes;
      conversationalResponse = `Got it 😊\n\nHere’s a great option for you: ${topRecipe.name} — ready in about ${totalTime} mins.\n\nWant me to lock this in?`;
      followupQuestion = mergedIntent.veg_preference ? null : 'Veg or non-veg?';
      state.pendingRecipeId = topRecipe.id;
      state.stage = 'narrowing';
    } else if (conversationalResponse === '') {
      conversationalResponse =
        recommenderResult.explanation ||
        'No perfect matches right now. Here are our most loved comfort options:';
    }

    res.json({
      success: true,
      data: {
        explanation: conversationalResponse,
        followup_question: followupQuestion || recommenderResult.followup_question || null,
        intent: mergedIntent,
        applied_filters: recommenderResult.applied_filters,
        failure_type: recommenderResult.failure_type || null,
        fallback_used: recommenderResult.fallback_used,
        conversation_stage: state.stage,
        escape_options: escapeOptions,
        soft_close_options: softCloseOptions,
        total_matches: recommenderResult.matches.length,
        total_excluded: recommenderResult.excluded.length,

        recommendations: recommenderResult.matches.map((match: RecipeMatch) => ({
          id: match.recipe.id,
          name: match.recipe.name,
          veg_nonveg: match.recipe.veg_nonveg,
          primary_protein: match.recipe.primary_protein,
          spice_level: match.recipe.spice_level,
          prep_time: match.recipe.prep_time_minutes,
          cook_time: match.recipe.cook_time_minutes,
          total_time: match.recipe.prep_time_minutes + match.recipe.cook_time_minutes,
          health_positioning: match.recipe.health_positioning,
          cuisine_style: match.recipe.cuisine_style,
          region_style: match.recipe.region_style,
          diet_tags: match.recipe.diet_tags,
          allergen_tags: match.recipe.allergen_tags,
          comfort_food: match.recipe.comfort_food,
          kid_friendly: match.recipe.kid_friendly,
          best_seller: match.recipe.best_seller,
          package: match.recipe.package,
          image_url: match.recipe.image_url,
          score: match.score,
          reasons: match.reasons,
        })),
        excluded: recommenderResult.excluded.map(exc => ({
          id: exc.recipe.id,
          name: exc.recipe.name,
          excluded_reasons: exc.excluded_reasons,
        })),
      },
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/recipes/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json({ success: true, data: recipe });
});

router.post('/reset', (req, res) => {
  const { userId = 'anon' } = req.body;
  conversationState.delete(userId);
  res.json({ success: true, message: 'Conversation reset' });
});

export default router;