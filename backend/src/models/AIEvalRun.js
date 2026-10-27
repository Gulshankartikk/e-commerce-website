import mongoose from 'mongoose';

/**
 * AIEvalRun Schema
 * Stores automated evaluation runs with full metric breakdowns, dataset versions,
 * individual test case evaluations, and latency/cost records.
 */
const testCaseResultSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true },
    category: { type: String, required: true }, // factual, cross_doc, adversarial, ambiguous, unsupported, stale_version
    question: { type: String, required: true },
    expectedAnswer: { type: String },
    actualAnswer: { type: String },
    expectedSourceIds: [{ type: String }],
    retrievedSourceIds: [{ type: String }],
    expectedAbstain: { type: Boolean, default: false },
    actualAbstain: { type: Boolean, default: false },
    citations: [
      {
        citationId: String,
        sourceId: String,
        chunkId: String,
        verified: Boolean,
      },
    ],
    passed: { type: Boolean, required: true },
    metrics: {
      recallAtK: { type: Number },
      mrr: { type: Number },
      citationPrecision: { type: Number },
      citationCoverage: { type: Number },
      faithfulness: { type: Number }, // 0 to 1 score
      answerCorrectness: { type: Number }, // 0 to 1 score
      abstentionCorrect: { type: Boolean },
    },
    latencyMs: { type: Number },
    costUsd: { type: Number },
    failureReason: { type: String },
  },
  { _id: false }
);

const aiEvalRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    datasetVersion: {
      type: String,
      required: true,
      default: 'v1.0.0',
    },
    promptVersion: {
      type: String,
      required: true,
      default: 'system_rag_v1',
    },
    modelName: {
      type: String,
      required: true,
      default: 'gemini-3.5-flash-lite',
    },
    embeddingModel: {
      type: String,
      default: 'gemini-embedding-001',
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    triggerType: {
      type: String,
      enum: ['ci_automated', 'admin_manual', 'nightly_schedule'],
      default: 'ci_automated',
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'completed',
    },
    summaryMetrics: {
      totalCases: { type: Number, required: true },
      passedCases: { type: Number, required: true },
      failedCases: { type: Number, required: true },
      passRate: { type: Number, required: true }, // 0 - 100 %
      meanRecallAtK: { type: Number, default: 0 },
      meanMRR: { type: Number, default: 0 },
      meanCitationPrecision: { type: Number, default: 0 },
      meanCitationCoverage: { type: Number, default: 0 },
      meanFaithfulness: { type: Number, default: 0 },
      meanAnswerCorrectness: { type: Number, default: 0 },
      abstentionAccuracy: { type: Number, default: 0 },
      averageLatencyMs: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      totalCostUsd: { type: Number, default: 0 },
    },
    qualityGatePassed: {
      type: Boolean,
      default: false,
    },
    qualityThresholds: {
      minPassRate: { type: Number, default: 80 },
      minRecallAtK: { type: Number, default: 0.8 },
      minCitationPrecision: { type: Number, default: 0.85 },
      minFaithfulness: { type: Number, default: 0.8 },
      minAbstentionAccuracy: { type: Number, default: 0.85 },
    },
    cases: [testCaseResultSchema],
  },
  { timestamps: true }
);

aiEvalRunSchema.index({ createdAt: -1 });
aiEvalRunSchema.index({ datasetVersion: 1, promptVersion: 1 });

export default mongoose.model('AIEvalRun', aiEvalRunSchema);
