import { Router } from 'express';
import { recipes } from '../data/recipes';
import { getRecommendation } from '../services/recommendationService';
import { DetectedIntent, Recipe, RecipeMatch } from '../types';

const router = Router();

/**
 * In-memory conversation state
 */
const conversationState = new Map<string, {
  userId: string;
  lastIntent?: DetectedIntent;
  currentIntent?: DetectedIntent;
  pendingRecipeId?: string;
  name?: string;
  stage: 'initial' | 'narrowing' | 'commitment' | 'capture_name' | 'soft_close' | 'closed';
}>();

function getRecipeByName(nameSubstring: string): Recipe | null {
  return recipes.find(r =>
    r.name.toLowerCase().includes(nameSubstring.toLowerCase())
  ) || null;
}

function getPendingRecipe(pendingId?: string): Recipe | null {
  if (!pendingId) return null;
  return recipes.find(r => r.id === pendingId) || null;
}

router.post('/recommend', (req, res) => {
  const { message, userId = 'anon', debug = false } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message must be a string' });
  }

  try {
    const recommenderResult = getRecommendation(message);

    /* =========================================================
       PHASE 0 — CLIENT DEBUG MODE (NO CONVERSATION)
       ========================================================= */
    if (debug === true) {
      let decision: 'recommendation' | 'clarification' | 'fallback';

      if (recommenderResult.followup_question) {
        decision = 'clarification';
      } else if (recommenderResult.matches.length > 0) {
        decision = 'recommendation';
      } else {
        decision = 'fallback';
      }

      return res.json({
        success: true,
        phase: 'phase_0',

        input: message,

        intent_understood: recommenderResult.intent,

        decision,

        explanation: recommenderResult.explanation,

        applied_rules: recommenderResult.applied_filters,

        ranking: recommenderResult.matches.map((m: RecipeMatch) => ({
          recipe: m.recipe.name,
          score: m.score,
          reasons: m.reasons,
        })),

        excluded: recommenderResult.excluded.map(e => ({
          recipe: e.recipe.name,
          reasons: e.excluded_reasons,
        })),

        fallback_used: decision === 'fallback',
        failure_type: recommenderResult.failure_type ?? 'none',
      });
    }

    /* =========================================================
       PHASE 1+ — CONVERSATIONAL MODE
       ========================================================= */

    if (!conversationState.has(userId)) {
      conversationState.set(userId, { userId, stage: 'initial' });
    }

    const state = conversationState.get(userId)!;

    const mergedIntent: DetectedIntent = {
      ...state.lastIntent,
      ...recommenderResult.intent,
    };

    state.currentIntent = mergedIntent;
    state.lastIntent = mergedIntent;

    let conversationalResponse = '';
    let followupQuestion: string | null = null;
    let softCloseOptions: string[] = [];

    const escapeOptions = ['Show full menu', 'Show bestsellers', 'Reset'];

    const hasMatches = recommenderResult.matches.length > 0;
    let topRecipe: Recipe | null = recommenderResult.matches[0]?.recipe || null;

    const isDecisionFatigue =
      mergedIntent.is_vague === true && state.stage === 'initial';

    const isTimeEffort =
      mergedIntent.time_constraint !== undefined ||
      mergedIntent.no_chopping === true ||
      mergedIntent.multi_meal === true;

    const peopleCount = mergedIntent.people_count || 2;

    let currentRecipe = getPendingRecipe(state.pendingRecipeId);

    /* ---------- CATEGORY B: TIME / EFFORT ---------- */
    if (isTimeEffort && state.stage === 'initial') {
      if (mergedIntent.no_chopping || mergedIntent.time_constraint) {
        currentRecipe =
          getRecipeByName('khichdi') ||
          topRecipe;
      } else if (mergedIntent.multi_meal) {
        currentRecipe =
          getRecipeByName('dal makhani') ||
          getRecipeByName('rajma');
      }

      if (currentRecipe) {
        const totalTime =
          currentRecipe.prep_time_minutes +
          currentRecipe.cook_time_minutes;

        conversationalResponse =
          `If you want something genuinely easy, I’d suggest ${currentRecipe.name} — ready in about ${totalTime} mins.\n\nNo chopping, very low effort.`;

        followupQuestion = mergedIntent.veg_preference
          ? null
          : 'Veg works, or do you want chicken instead?';

        state.pendingRecipeId = currentRecipe.id;
        state.stage = 'narrowing';
      }
    }

    /* ---------- CATEGORY A: DECISION FATIGUE ---------- */
    else if (isDecisionFatigue && state.stage === 'initial') {
      currentRecipe =
        getRecipeByName('butter chicken') ||
        getRecipeByName('rajma') ||
        getRecipeByName('dal makhani');

      if (currentRecipe) {
        conversationalResponse =
          `Totally get it 😄 If you don’t want to think, ${currentRecipe.name} is a safe, comforting choice.`;

        followupQuestion = 'Veg or non-veg?';
        state.pendingRecipeId = currentRecipe.id;
        state.stage = 'narrowing';
      }
    }

    /* ---------- CONTINUATION ---------- */
    else if (currentRecipe) {
      if (state.stage === 'narrowing' && mergedIntent.veg_preference !== undefined) {
        conversationalResponse =
          `Perfect. Shall I set this up for ${peopleCount} people?`;
        state.stage = 'commitment';
      } else if (
        state.stage === 'commitment' &&
        /yes|ok|haan|sure/i.test(message)
      ) {
        conversationalResponse = `Great 👍 What name should I save this under?`;
        state.stage = 'capture_name';
      } else if (state.stage === 'capture_name') {
        state.name = message.trim();
        conversationalResponse =
          `Thanks ${state.name}. Want me to add this to cart or send it on WhatsApp?`;
        softCloseOptions = ['Add to cart', 'Send on WhatsApp'];
        state.stage = 'soft_close';
      } else if (state.stage === 'soft_close') {
        conversationalResponse = `All set 😊`;
        state.stage = 'closed';
      }
    }

    /* ---------- FALLBACK ---------- */
    if (conversationalResponse === '') {
      conversationalResponse =
        recommenderResult.explanation ||
        'Here are some popular comfort options people love:';
    }

    let decision: 'recommendation' | 'clarification' | 'fallback';
    if (followupQuestion) decision = 'clarification';
    else if (hasMatches) decision = 'recommendation';
    else decision = 'fallback';

    return res.json({
      success: true,
      data: {
        explanation: conversationalResponse,
        decision,
        followup_question: followupQuestion,
        intent: mergedIntent,
        applied_filters: recommenderResult.applied_filters,
        fallback_used: decision === 'fallback',
        conversation_stage: state.stage,
        escape_options: escapeOptions,
        soft_close_options: softCloseOptions,

        recommendations: recommenderResult.matches.map((m: RecipeMatch) => ({
          id: m.recipe.id,
          name: m.recipe.name,
          veg_nonveg: m.recipe.veg_nonveg,
          spice_level: m.recipe.spice_level,
          total_time:
            m.recipe.prep_time_minutes + m.recipe.cook_time_minutes,
          image_url: m.recipe.image_url,
          score: m.score,
          reasons: m.reasons,
        })),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===================== OTHER ROUTES ===================== */

router.post('/reset', (req, res) => {
  const { userId = 'anon' } = req.body;
  conversationState.delete(userId);
  res.json({ success: true });
});

export default router;
