/**
 * Server-Side Citation Validation Engine
 * Enforces strict attribution: every citation MUST correspond to an authentic,
 * retrieved KnowledgeChunk. Prevents hallucinated sources, validates snippets,
 * and normalizes inline citation markers.
 */

export function validateAndVerifyCitations(llmResponse, retrievedChunks = []) {
  const verifiedCitations = [];
  const chunkMapById = new Map();
  const chunkMapBySource = new Map();

  retrievedChunks.forEach((c, idx) => {
    chunkMapById.set(c.chunkId, c);
    if (!chunkMapBySource.has(c.sourceId)) {
      chunkMapBySource.set(c.sourceId, c);
    }
  });

  const rawCitations = Array.isArray(llmResponse?.citations) ? llmResponse.citations : [];
  const usedChunkIds = new Set();

  rawCitations.forEach((rawCite, index) => {
    // Determine target chunk
    let targetChunk = null;

    if (rawCite.chunkId && chunkMapById.has(rawCite.chunkId)) {
      targetChunk = chunkMapById.get(rawCite.chunkId);
    } else if (rawCite.sourceId && chunkMapBySource.has(rawCite.sourceId)) {
      targetChunk = chunkMapBySource.get(rawCite.sourceId);
    } else if (typeof rawCite.citationIndex === 'number' && retrievedChunks[rawCite.citationIndex - 1]) {
      targetChunk = retrievedChunks[rawCite.citationIndex - 1];
    } else if (typeof rawCite === 'string' && chunkMapById.has(rawCite)) {
      targetChunk = chunkMapById.get(rawCite);
    }

    // Strict validation: Reject if chunk was not retrieved
    if (!targetChunk) {
      console.warn(`⚠️ Rejected unverified hallucinated citation:`, rawCite);
      return;
    }

    // Deduplicate citations to the same chunk
    if (usedChunkIds.has(targetChunk.chunkId)) {
      return;
    }
    usedChunkIds.add(targetChunk.chunkId);

    // Extract genuine evidence snippet from verified chunk content
    let snippet = (rawCite.quote || rawCite.claim || '').trim();
    if (!snippet || snippet.length < 15 || !targetChunk.content.toLowerCase().includes(snippet.toLowerCase().slice(0, 30))) {
      // Fallback to authoritative text snippet directly from chunk
      snippet = targetChunk.content
        .split('\n')
        .find((line) => line.length > 30 && !line.startsWith('#')) || targetChunk.content.slice(0, 180);
    }

    verifiedCitations.push({
      citationId: `cite_${verifiedCitations.length + 1}`,
      marker: `[${verifiedCitations.length + 1}]`,
      chunkId: targetChunk.chunkId,
      sourceId: targetChunk.sourceId,
      title: targetChunk.title,
      url: targetChunk.url,
      documentType: targetChunk.documentType,
      snippet: snippet.trim(),
      relevanceScore: targetChunk.score || 0.9,
      verified: true,
    });
  });

  // If LLM returned text markers [1], [2] but empty citations array, auto-bind to retrieved chunks
  if (verifiedCitations.length === 0 && retrievedChunks.length > 0) {
    const text = llmResponse?.reply || '';
    const hasInlineMarker = /\[(\d+)\]/.test(text);

    if (hasInlineMarker) {
      retrievedChunks.slice(0, 3).forEach((chunk, i) => {
        const marker = `[${i + 1}]`;
        if (text.includes(marker)) {
          const sampleSnippet = chunk.content
            .split('\n')
            .find((l) => l.length > 25 && !l.startsWith('#')) || chunk.content.slice(0, 160);

          verifiedCitations.push({
            citationId: `cite_${verifiedCitations.length + 1}`,
            marker,
            chunkId: chunk.chunkId,
            sourceId: chunk.sourceId,
            title: chunk.title,
            url: chunk.url,
            documentType: chunk.documentType,
            snippet: sampleSnippet.trim(),
            relevanceScore: chunk.score || 0.85,
            verified: true,
          });
        }
      });
    }
  }

  // Sanitize reply text: remove any dangling citations to non-existent markers
  let sanitizedReply = llmResponse?.reply || '';
  const validMarkers = new Set(verifiedCitations.map((c) => c.marker));

  sanitizedReply = sanitizedReply.replace(/\[(\d+)\]/g, (match) => {
    return validMarkers.has(match) ? match : '';
  });

  return {
    verifiedCitations,
    sanitizedReply: sanitizedReply.replace(/\s{2,}/g, ' ').trim(),
    citationPrecision: rawCitations.length > 0 ? verifiedCitations.length / rawCitations.length : 1.0,
    citationCount: verifiedCitations.length,
  };
}
