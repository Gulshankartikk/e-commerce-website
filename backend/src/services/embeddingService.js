import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

/**
 * FlashShop Embedding Service
 * Produces 768-dimensional normalized embeddings for semantic search
 * using Google's gemini-embedding-001 model with outputDimensionality: 768.
 * Includes deterministic fallback for zero-downtime offline tests and caching.
 */

const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
const EMBEDDING_DIMENSION = 768;

let genAIClient = null;
function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here') return null;
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey: key });
    } catch {
      return null;
    }
  }
  return genAIClient;
}

// In-memory LRU-like cache for frequent text embeddings (max 500 items)
const embeddingCache = new Map();

/**
 * Deterministic unit-normalized pseudo-vector fallback (768-d).
 * Ensures tests and offline environments can execute vector similarity math,
 * ranking, and top-k retrieval without external network calls.
 */
function generateDeterministicEmbedding(text) {
  const dim = EMBEDDING_DIMENSION;
  const vec = new Float64Array(dim);
  const normalized = (text || '').toLowerCase().trim();

  // Character n-gram projection into 768 dimensions
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const bucket = (charCode * 31 + i * 17) % dim;
    vec[bucket] += 1.0;
  }

  // Token hashing for semantic affinity
  const tokens = normalized.split(/\W+/).filter(Boolean);
  tokens.forEach((t, idx) => {
    const hash = crypto.createHash('md5').update(t).digest();
    for (let j = 0; j < 8; j++) {
      const idxDim = hash.readUInt16BE(j * 2) % dim;
      vec[idxDim] += 2.0 / (idx + 1);
    }
  });

  // Normalize to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm) || 1.0;
  const result = new Array(dim);
  for (let i = 0; i < dim; i++) {
    result[i] = Number((vec[i] / norm).toFixed(6));
  }
  return result;
}

/**
 * Computes cosine similarity between two unit-normalized vectors.
 * Dot product equals cosine similarity when vectors are unit length.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Generate embedding for a single text string.
 * Returns Array<Number> of length 768.
 */
export async function getEmbedding(text) {
  const cleaned = (text || '').trim();
  if (!cleaned) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  // Check cache
  const cacheKey = crypto.createHash('sha256').update(cleaned).digest('hex');
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }

  const client = getClient();
  if (client) {
    try {
      const response = await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: cleaned,
        config: { outputDimensionality: EMBEDDING_DIMENSION },
      });

      const values = response.embeddings?.[0]?.values || response.embedding?.values;
      if (Array.isArray(values) && values.length === EMBEDDING_DIMENSION) {
        // Cache and return
        if (embeddingCache.size > 500) {
          const firstKey = embeddingCache.keys().next().value;
          embeddingCache.delete(firstKey);
        }
        embeddingCache.set(cacheKey, values);
        return values;
      }
    } catch (err) {
      console.warn('⚠️ Gemini embedContent API call failed, using deterministic embedding:', err.message);
    }
  }

  const fallbackVec = generateDeterministicEmbedding(cleaned);
  embeddingCache.set(cacheKey, fallbackVec);
  return fallbackVec;
}

/**
 * Generate embeddings for an array of text strings with rate-limit protection.
 */
export async function getEmbeddingsBatch(texts, batchSize = 10) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const chunkPromises = chunk.map((txt) => getEmbedding(txt));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  return results;
}

export { EMBEDDING_DIMENSION, EMBEDDING_MODEL };
