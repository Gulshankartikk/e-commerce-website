/**
 * Smart Text Chunking Utility for Knowledge Ingestion
 * Preserves markdown headings, respects paragraph and sentence boundaries,
 * and maintains sliding overlap across chunk boundaries.
 */

export function chunkDocumentText(text, options = {}) {
  const {
    maxChunkChars = 650,
    overlapChars = 120,
    minChunkChars = 30,
  } = options;

  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const sections = [];
  let currentHeading = 'Overview';
  let currentSectionLines = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (currentSectionLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentSectionLines.join('\n').trim(),
        });
        currentSectionLines = [];
      }
      currentHeading = headingMatch[2].trim();
    } else {
      currentSectionLines.push(line);
    }
  }

  if (currentSectionLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentSectionLines.join('\n').trim(),
    });
  }

  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const secContent = section.content;
    if (!secContent) continue;

    // If section fits in one chunk
    if (secContent.length <= maxChunkChars) {
      chunks.push({
        chunkIndex: chunkIndex++,
        sectionHeading: section.heading,
        content: `### ${section.heading}\n${secContent}`,
        tokenCount: Math.ceil((secContent.length + section.heading.length) / 4),
      });
      continue;
    }

    // Split section by paragraphs or sentences
    const paragraphs = secContent.split(/\n\s*\n/).filter((p) => p.trim());
    let currentChunkText = `### ${section.heading}\n`;

    for (const para of paragraphs) {
      if ((currentChunkText.length + para.length) <= maxChunkChars) {
        currentChunkText += (currentChunkText.endsWith('\n') ? '' : '\n\n') + para.trim();
      } else {
        if (currentChunkText.trim().length >= minChunkChars) {
          chunks.push({
            chunkIndex: chunkIndex++,
            sectionHeading: section.heading,
            content: currentChunkText.trim(),
            tokenCount: Math.ceil(currentChunkText.length / 4),
          });
        }

        // Apply sliding overlap
        const tailOverlap = currentChunkText.slice(-overlapChars).trim();
        currentChunkText = `### ${section.heading} (cont.)\n` + (tailOverlap ? `${tailOverlap}\n` : '') + para.trim();

        // If paragraph itself is excessively large, split by sentences
        if (currentChunkText.length > maxChunkChars) {
          const sentences = para.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [para];
          currentChunkText = `### ${section.heading} (cont.)\n`;
          for (const sentence of sentences) {
            if ((currentChunkText.length + sentence.length) <= maxChunkChars) {
              currentChunkText += sentence;
            } else {
              chunks.push({
                chunkIndex: chunkIndex++,
                sectionHeading: section.heading,
                content: currentChunkText.trim(),
                tokenCount: Math.ceil(currentChunkText.length / 4),
              });
              currentChunkText = `### ${section.heading} (cont.)\n` + sentence;
            }
          }
        }
      }
    }

    if (currentChunkText.trim().length >= minChunkChars) {
      chunks.push({
        chunkIndex: chunkIndex++,
        sectionHeading: section.heading,
        content: currentChunkText.trim(),
        tokenCount: Math.ceil(currentChunkText.length / 4),
      });
    }
  }

  return chunks;
}
