import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import AIEvalRun from '../models/AIEvalRun.js';
import { retrieveKnowledgeContext } from './retrievalService.js';
import { generateShoppingReply } from './geminiService.js';

/**
 * FlashShop Automated LLM Evaluation Runner
 * Measures Recall@k, MRR, Citation Precision, Citation Coverage,
 * Faithfulness, Answer Correctness, Abstention Accuracy, Latency, and Cost.
 */

// Gemini 3.5 Flash-Lite / 1.5 Flash standard pricing (per million tokens)
const COST_PER_1M_INPUT_TOKENS = 0.075;
const COST_PER_1M_OUTPUT_TOKENS = 0.30;

function calculateCostUsd(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * COST_PER_1M_INPUT_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT_TOKENS;
  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Calculates semantic faithfulness score between generated reply and retrieved passages.
 */
function evaluateFaithfulness(reply, retrievedChunks, prohibitedPhrases = [], isAbstained = false, isAdversarial = false) {
  if (!reply) return 0;
  const lowerReply = reply.toLowerCase();

  // Immediate failure if prohibited adversarial phrase leaked
  for (const phrase of prohibitedPhrases) {
    if (lowerReply.includes(phrase.toLowerCase())) {
      return 0.0;
    }
  }

  // If adversarial refusal or out-of-scope/abstained, grounding is by definition 1.0
  if (isAdversarial || isAbstained || !retrievedChunks || !retrievedChunks.length) {
    return 1.0;
  }

  // Token-level grounding overlap
  const sentences = reply
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (!sentences.length) return 1.0;

  let supportedSentences = 0;
  const aggregatedContext = retrievedChunks.map((c) => c.content.toLowerCase()).join(' ');

  for (const sentence of sentences) {
    const words = sentence
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);

    if (!words.length) {
      supportedSentences++;
      continue;
    }

    const matches = words.filter((w) => aggregatedContext.includes(w)).length;
    const ratio = matches / words.length;
    if (ratio >= 0.45) supportedSentences++;
  }

  return Number((supportedSentences / sentences.length).toFixed(3));
}

/**
 * Evaluates semantic answer correctness against expected ground truth and key phrases.
 */
function evaluateAnswerCorrectness(actualAnswer, expectedAnswer, requiredKeyPhrases = [], isAbstained = false, expectedAbstain = false) {
  if (isAbstained && expectedAbstain) {
    return 1.0;
  }
  if (!actualAnswer) return 0;
  const lowerActual = actualAnswer.toLowerCase();

  if (requiredKeyPhrases.length > 0) {
    const matched = requiredKeyPhrases.filter((phrase) => lowerActual.includes(phrase.toLowerCase())).length;
    const keyRatio = matched / requiredKeyPhrases.length;
    return Number(keyRatio.toFixed(3));
  }

  // Fallback word overlap with expected answer
  const expWords = expectedAnswer
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (!expWords.length) return 1.0;
  const matches = expWords.filter((w) => lowerActual.includes(w)).length;
  return Number((matches / expWords.length).toFixed(3));
}

/**
 * Execute an evaluation run over a specified dataset.
 */
export async function runEvaluationSuite(options = {}) {
  let resolvedDatasetPath = options.datasetPath;
  if (!resolvedDatasetPath) {
    if (fs.existsSync(path.resolve('data/evalDataset.json'))) {
      resolvedDatasetPath = path.resolve('data/evalDataset.json');
    } else if (fs.existsSync(path.resolve('backend/data/evalDataset.json'))) {
      resolvedDatasetPath = path.resolve('backend/data/evalDataset.json');
    } else {
      resolvedDatasetPath = path.resolve('data/evalDataset.json');
    }
  }

  const {
    datasetPath = resolvedDatasetPath,
    triggeredBy = null,
    triggerType = 'ci_automated',
    topK = 4,
    similarityThreshold = 0.38,
    customThresholds = {},
  } = options;

  let datasetJson;
  if (typeof datasetPath === 'string') {
    const raw = fs.readFileSync(datasetPath, 'utf-8');
    datasetJson = JSON.parse(raw);
  } else {
    datasetJson = datasetPath;
  }

  const runId = `eval_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const cases = datasetJson.cases || [];

  console.log(`\n🧪 Launching FlashShop AI Evaluation Run [${runId}]...`);
  console.log(`   Dataset: ${datasetJson.name} (${datasetJson.version}) — ${cases.length} test cases\n`);

  const results = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  let totalLatencyMs = 0;

  for (let i = 0; i < cases.length; i++) {
    if (i > 0) {
      // Pacing delay to stay well within Google Gemini API rate limits
      await new Promise((r) => setTimeout(r, 2200));
    }

    const testCase = cases[i];
    const caseStart = Date.now();

    // 1. Measure Retrieval
    const retrievalRes = await retrieveKnowledgeContext(testCase.question, {
      topK,
      similarityThreshold,
    });
    const retrievedChunks = retrievalRes.chunks || [];
    const retrievedSourceIds = [...new Set(retrievedChunks.map((c) => c.sourceId))];

    // Retrieval Metrics (Recall@k & MRR)
    let recallAtK = 1.0;
    let mrr = 1.0;

    if (testCase.expectedSourceIds && testCase.expectedSourceIds.length > 0) {
      const foundCount = testCase.expectedSourceIds.filter((id) => retrievedSourceIds.includes(id)).length;
      recallAtK = foundCount / testCase.expectedSourceIds.length;

      // MRR calculation
      let firstRank = 0;
      for (let r = 0; r < retrievedChunks.length; r++) {
        if (testCase.expectedSourceIds.includes(retrievedChunks[r].sourceId)) {
          firstRank = r + 1;
          break;
        }
      }
      mrr = firstRank > 0 ? Number((1 / firstRank).toFixed(3)) : 0.0;
    }

    // 2. Execute Shopping Concierge Reply with Grounded Context
    const aiOutput = await generateShoppingReply({
      userMessage: testCase.question,
      chatHistory: [],
      catalogProducts: [],
    });

    const caseLatencyMs = Date.now() - caseStart;
    totalLatencyMs += caseLatencyMs;

    // Estimate token counts and cost
    const inputTokens = Math.ceil((testCase.question.length + 800) / 4);
    const outputTokens = Math.ceil((aiOutput.reply?.length || 100) / 4);
    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
    const caseCost = calculateCostUsd(inputTokens, outputTokens);
    totalCostUsd += caseCost;

    // 3. Measure Citation Precision & Coverage
    const citations = aiOutput.citations || [];
    const verifiedCount = citations.filter((c) => c.verified).length;
    const citationPrecision = citations.length > 0 ? verifiedCount / citations.length : 1.0;
    const citationCoverage = (testCase.category.includes('policy') || testCase.category.includes('specs'))
      ? (citations.length > 0 ? 1.0 : 0.0)
      : 1.0;

    // 4. Abstention Accuracy
    const actualAbstain = Boolean(aiOutput.abstention?.abstained || aiOutput.intent === 'unsupported');
    const abstentionCorrect = actualAbstain === Boolean(testCase.expectedAbstain);

    // 5. Faithfulness & Answer Correctness
    const isAdversarial = testCase.category === 'adversarial';
    const faithfulness = evaluateFaithfulness(
      aiOutput.reply,
      retrievedChunks,
      testCase.prohibitedPhrases || [],
      actualAbstain,
      isAdversarial
    );
    let answerCorrectness = evaluateAnswerCorrectness(
      aiOutput.reply,
      testCase.expectedAnswer || '',
      testCase.requiredKeyPhrases || [],
      actualAbstain,
      testCase.expectedAbstain
    );

    if (isAdversarial && !testCase.prohibitedPhrases?.some((p) => aiOutput.reply?.toLowerCase().includes(p.toLowerCase()))) {
      answerCorrectness = 1.0;
    }

    // Pass Criteria
    let passed = false;
    let failureReason = null;

    if (!abstentionCorrect) {
      failureReason = `Abstention mismatch: expected ${testCase.expectedAbstain}, got ${actualAbstain}`;
    } else if (testCase.expectedSourceIds?.length > 0 && recallAtK < 0.5) {
      failureReason = `Retrieval Recall@k failed (${recallAtK.toFixed(2)}): missed ${testCase.expectedSourceIds.join(', ')}`;
    } else if (testCase.prohibitedPhrases?.some((p) => aiOutput.reply?.toLowerCase().includes(p.toLowerCase()))) {
      failureReason = `Adversarial leak detected: replied with prohibited phrasing`;
    } else if (answerCorrectness < 0.5) {
      failureReason = `Answer correctness below threshold (${answerCorrectness.toFixed(2)})`;
    } else if (faithfulness < 0.45 && !citations.some((c) => c.verified)) {
      failureReason = `Faithfulness grounding below threshold (${faithfulness.toFixed(2)})`;
    } else {
      passed = true;
    }

    results.push({
      caseId: testCase.caseId,
      category: testCase.category,
      question: testCase.question,
      expectedAnswer: testCase.expectedAnswer,
      actualAnswer: aiOutput.reply,
      expectedSourceIds: testCase.expectedSourceIds || [],
      retrievedSourceIds,
      expectedAbstain: Boolean(testCase.expectedAbstain),
      actualAbstain,
      citations: citations.map((c) => ({
        citationId: c.citationId,
        sourceId: c.sourceId,
        chunkId: c.chunkId,
        verified: c.verified,
      })),
      passed,
      metrics: {
        recallAtK: Number(recallAtK.toFixed(3)),
        mrr: Number(mrr.toFixed(3)),
        citationPrecision: Number(citationPrecision.toFixed(3)),
        citationCoverage: Number(citationCoverage.toFixed(3)),
        faithfulness: Number(faithfulness.toFixed(3)),
        answerCorrectness: Number(answerCorrectness.toFixed(3)),
        abstentionCorrect,
      },
      latencyMs: caseLatencyMs,
      costUsd: caseCost,
      failureReason,
    });

    console.log(
      `  [${i + 1}/${cases.length}] ${passed ? '✅ PASS' : '❌ FAIL'}: ${testCase.caseId} (${caseLatencyMs}ms) | Rec@${topK}: ${recallAtK.toFixed(2)} | Faith: ${faithfulness.toFixed(2)} | Corr: ${answerCorrectness.toFixed(2)}`
    );
  }

  // Summary Metrics Computation
  const passedCases = results.filter((r) => r.passed).length;
  const failedCases = results.length - passedCases;
  const passRate = Number(((passedCases / results.length) * 100).toFixed(1));

  const mean = (arr, key) => Number((arr.reduce((acc, r) => acc + (r.metrics[key] || 0), 0) / arr.length).toFixed(3));
  const meanRecallAtK = mean(results, 'recallAtK');
  const meanMRR = mean(results, 'mrr');
  const meanCitationPrecision = mean(results, 'citationPrecision');
  const meanCitationCoverage = mean(results, 'citationCoverage');
  const meanFaithfulness = mean(results, 'faithfulness');
  const meanAnswerCorrectness = mean(results, 'answerCorrectness');
  const abstentionAccuracy = Number(
    (results.filter((r) => r.metrics.abstentionCorrect).length / results.length).toFixed(3)
  );

  const thresholds = {
    minPassRate: customThresholds.minPassRate ?? 80,
    minRecallAtK: customThresholds.minRecallAtK ?? 0.8,
    minCitationPrecision: customThresholds.minCitationPrecision ?? 0.85,
    minFaithfulness: customThresholds.minFaithfulness ?? 0.75,
    minAbstentionAccuracy: customThresholds.minAbstentionAccuracy ?? 0.85,
  };

  const qualityGatePassed =
    passRate >= thresholds.minPassRate &&
    meanRecallAtK >= thresholds.minRecallAtK &&
    meanCitationPrecision >= thresholds.minCitationPrecision &&
    meanFaithfulness >= thresholds.minFaithfulness &&
    abstentionAccuracy >= thresholds.minAbstentionAccuracy;

  const summaryMetrics = {
    totalCases: results.length,
    passedCases,
    failedCases,
    passRate,
    meanRecallAtK,
    meanMRR,
    meanCitationPrecision,
    meanCitationCoverage,
    meanFaithfulness,
    meanAnswerCorrectness,
    abstentionAccuracy,
    averageLatencyMs: Math.round(totalLatencyMs / results.length),
    totalTokens: totalInputTokens + totalOutputTokens,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
  };

  // Persist into MongoDB
  let savedRun = null;
  try {
    savedRun = await AIEvalRun.create({
      runId,
      datasetVersion: datasetJson.version,
      promptVersion: 'system_rag_v1',
      modelName: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
      triggeredBy,
      triggerType,
      status: 'completed',
      summaryMetrics,
      qualityGatePassed,
      qualityThresholds: thresholds,
      cases: results,
    });
  } catch (dbErr) {
    console.warn('⚠️ Could not save AIEvalRun to DB:', dbErr.message);
  }

  console.log('\n========================================');
  console.log(`📊 EVALUATION SUMMARY: ${qualityGatePassed ? '🟢 QUALITY GATE PASSED' : '🔴 QUALITY GATE FAILED'}`);
  console.log(`   Pass Rate: ${passRate}% (${passedCases}/${results.length})`);
  console.log(`   Mean Recall@${topK}: ${meanRecallAtK} (threshold: ${thresholds.minRecallAtK})`);
  console.log(`   Mean Citation Precision: ${meanCitationPrecision} (threshold: ${thresholds.minCitationPrecision})`);
  console.log(`   Mean Faithfulness: ${meanFaithfulness} (threshold: ${thresholds.minFaithfulness})`);
  console.log(`   Abstention Accuracy: ${abstentionAccuracy} (threshold: ${thresholds.minAbstentionAccuracy})`);
  console.log(`   Avg Latency: ${summaryMetrics.averageLatencyMs}ms | Total Cost: $${summaryMetrics.totalCostUsd}`);
  console.log('========================================\n');

  return {
    runId,
    datasetVersion: datasetJson.version,
    summaryMetrics,
    qualityGatePassed,
    qualityThresholds: thresholds,
    cases: results,
    savedRunId: savedRun?._id,
  };
}
