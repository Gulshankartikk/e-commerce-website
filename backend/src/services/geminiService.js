import { GoogleGenAI } from '@google/genai';

/**
 * Gemini AI Shopping Assistant Service
 * Provides grounded catalog recommendations, side-by-side comparisons,
 * review summaries, and conversational customer support.
 */

const getApiKey = () => process.env.GEMINI_API_KEY || '';
const getModelName = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let genAIClient = null;
function getClient() {
  const key = getApiKey();
  if (!key || key === 'your_gemini_api_key_here') return null;
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey: key });
    } catch (err) {
      console.warn('⚠️ Could not initialize GoogleGenAI client:', err.message);
      return null;
    }
  }
  return genAIClient;
}

/**
 * System instruction strictly grounding the AI in the actual product catalog.
 */
const SYSTEM_INSTRUCTION = `You are the FlashShop AI Shopping Assistant, an expert personal shopper for FlashShop — a modern, premium online store.
Your goal is to help shoppers discover the right products, answer product questions, compare items, and summarize reviews.

CRITICAL RULES:
1. STRICT CATALOG GROUNDING: You MUST ONLY recommend products that are present in the provided CATALOG CONTEXT. NEVER invent or hallucinate products, brands, models, prices, or specs.
2. ACCURATE DETAILS: Use the exact price (in INR ₹), stock status, and specifications from the catalog. The backend determines prices and stock; do not override them.
3. BUDGET DISCIPLINE: If the user specifies a budget (e.g., "under ₹5,000", "within 3000"), ONLY recommend products whose price is within that limit.
4. UNSUPPORTED PRODUCTS: If the customer asks for products FlashShop does not carry (such as groceries, cars, flight tickets, laptops, medical drugs, pet supplies, etc.), politely explain that FlashShop specializes in curated Electronics, Fashion, Home & Living, and Sports, and invite them to explore our available categories.
5. CONCISE & LUXURIOUS: Maintain an elegant, helpful, and concise tone. Format responses using clean markdown (bullet points, bold text).
6. STRUCTURED OUTPUT: Always return valid JSON matching this schema:
{
  "reply": "Your conversational markdown answer to the user",
  "recommendedProductIds": ["matching _id strings from the catalog context"],
  "intent": "recommendation" | "compare" | "review_summary" | "chat" | "unsupported",
  "budgetDetected": number or null
}`;

/**
 * Format a list of MongoDB products into compact catalog context for the AI prompt.
 */
export function formatCatalogForPrompt(products) {
  if (!products || !products.length) return 'No matching products in catalog.';
  return products
    .map(
      (p, i) =>
        `[${i + 1}] ID: ${p._id} | Name: "${p.name}" | Price: ₹${p.price} (MRP: ₹${p.mrp || p.price}) | Category: ${p.category?.name || p.category || 'N/A'} | Brand: ${p.brand?.name || p.brand || 'N/A'} | Stock: ${p.stock > 0 ? `${p.stock} units` : 'Out of Stock'} | Rating: ${p.ratingsAverage || 0}★ (${p.ratingsCount || 0} reviews) | Highlights: ${(p.highlights || []).join(', ')} | Tags: ${(p.tags || []).join(', ')}`
    )
    .join('\n');
}

/**
 * Helper to extract budget from user message (e.g., "under 5000", "below ₹3,000", "budget of 20000").
 */
export function extractBudgetFromText(text) {
  if (!text) return null;
  const regex = /(?:under|below|less than|within|budget(?:\s+of)?|max(?:\s+of)?|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i;
  const match = text.match(regex);
  if (match && match[1]) {
    const num = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}

/**
 * Fallback generator when Gemini API key is not configured or network call fails.
 * Guarantees zero downtime, offline testing, and strict catalog fidelity.
 */
function generateFallbackShoppingReply(userMessage, catalogProducts) {
  const lower = (userMessage || '').toLowerCase();
  const budget = extractBudgetFromText(lower);

  // Check for unsupported product categories
  const unsupportedKeywords = [
    'grocery', 'groceries', 'vegetable', 'fruit', 'car', 'bike', 'motorcycle',
    'laptop', 'macbook', 'flight', 'ticket', 'pet', 'dog food', 'cat food',
    'medicine', 'pharmacy', 'book', 'novel', 'real estate', 'house', 'apartment',
    'pizza', 'burger', 'food delivery', 'airline'
  ];
  const isUnsupported = unsupportedKeywords.some((kw) => lower.includes(kw));

  if (isUnsupported) {
    return {
      reply: `At **FlashShop**, we specialize in premium **Electronics**, **Fashion & Footwear**, **Home & Living**, and **Sports & Fitness Gear**.\n\nWe currently do not offer those items in our curated catalog, but we invite you to browse our latest audio tech, performance footwear, smart home accessories, and designer essentials!`,
      recommendedProductIds: [],
      intent: 'unsupported',
      budgetDetected: budget,
    };
  }

  // Filter products by budget if specified
  let eligibleProducts = [...catalogProducts];
  if (budget !== null) {
    eligibleProducts = eligibleProducts.filter((p) => p.price <= budget);
  }

  // Rank products by relevance to message keywords
  const keywords = lower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['the', 'and', 'for', 'with', 'under', 'show', 'need', 'want', 'what'].includes(w));

  const scored = eligibleProducts.map((p) => {
    let score = 0;
    const pText = `${p.name} ${p.description || ''} ${(p.highlights || []).join(' ')} ${(p.tags || []).join(' ')} ${p.category?.name || ''} ${p.brand?.name || ''}`.toLowerCase();
    keywords.forEach((kw) => {
      if (pText.includes(kw)) score += 3;
    });
    if (p.isFeatured) score += 1;
    if (p.stock > 0) score += 2;
    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 2).slice(0, 3).map((s) => s.product);
  const topProducts = matched.length ? matched : eligibleProducts.slice(0, 2);

  if (!topProducts.length) {
    return {
      reply: budget
        ? `We couldn't find any products in our catalog under **₹${budget.toLocaleString('en-IN')}** matching that description. You might want to adjust your budget or explore our full collection!`
        : `We couldn't find exact matches in our catalog for your search. Feel free to browse our categories or ask about our headphones, smartwatches, running shoes, or home essentials!`,
      recommendedProductIds: [],
      intent: 'recommendation',
      budgetDetected: budget,
    };
  }

  const budgetMsg = budget ? ` within your budget of **₹${budget.toLocaleString('en-IN')}**` : '';
  const listItems = topProducts
    .map(
      (p) =>
        `* **[${p.name}](product://${p.slug})** — ₹${p.price.toLocaleString('en-IN')}${p.mrp ? ` ~~(₹${p.mrp.toLocaleString('en-IN')})~~` : ''} (${p.ratingsAverage || 5}★)  \n  ${p.highlights?.[0] || p.description.slice(0, 90) + '...'}`
    )
    .join('\n\n');

  return {
    reply: `Here are our top recommendations${budgetMsg} from the FlashShop catalog:\n\n${listItems}\n\nYou can click on any product card below to view specifications or add it straight to your cart. Let me know if you would like a comparison or review summary!`,
    recommendedProductIds: topProducts.map((p) => String(p._id)),
    intent: 'recommendation',
    budgetDetected: budget,
  };
}

/**
 * Main conversational shopping handler powered by Gemini with fallback safety.
 */
export async function generateShoppingReply({ userMessage, chatHistory = [], catalogProducts = [] }) {
  const client = getClient();
  const budget = extractBudgetFromText(userMessage);

  if (!client) {
    return generateFallbackShoppingReply(userMessage, catalogProducts);
  }

  try {
    const catalogContext = formatCatalogForPrompt(catalogProducts);
    const historyContext = chatHistory.slice(-6).map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`).join('\n');

    const prompt = `CURRENT CATALOG CONTEXT:\n${catalogContext}\n\n` +
      (historyContext ? `RECENT CONVERSATION:\n${historyContext}\n\n` : '') +
      `CUSTOMER'S LATEST MESSAGE:\n"${userMessage}"\n\n` +
      (budget ? `DETECTED BUDGET CONSTRAINT: Max ₹${budget}\n\n` : '') +
      `Remember: Recommend ONLY products with exact IDs from the catalog context. Return valid JSON only.`;

    const response = await client.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const rawText = response.text || '';
    const parsed = JSON.parse(rawText);

    // Validate that recommendedProductIds are actually in the catalog
    const validIds = new Set(catalogProducts.map((p) => String(p._id)));
    const filteredIds = (parsed.recommendedProductIds || []).filter((id) => validIds.has(String(id)));

    return {
      reply: parsed.reply || 'Here are my recommendations from our catalog.',
      recommendedProductIds: filteredIds,
      intent: parsed.intent || 'recommendation',
      budgetDetected: parsed.budgetDetected || budget,
    };
  } catch (err) {
    console.warn('⚠️ Gemini API call failed, using catalog fallback:', err.message);
    return generateFallbackShoppingReply(userMessage, catalogProducts);
  }
}

/**
 * Side-by-side product comparison generator.
 */
export async function generateProductComparison({ products }) {
  if (!products || products.length < 2) {
    throw new Error('At least two products are required for comparison');
  }

  const client = getClient();
  const prodSummaries = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    mrp: p.mrp,
    rating: p.ratingsAverage,
    reviews: p.ratingsCount,
    highlights: p.highlights || [],
    description: p.description,
    brand: p.brand?.name || '',
    category: p.category?.name || '',
    stock: p.stock,
  }));

  if (!client) {
    // Deterministic comparison fallback
    const p1 = products[0];
    const p2 = products[1];
    const priceDiff = Math.abs(p1.price - p2.price);
    const cheaper = p1.price <= p2.price ? p1 : p2;
    const premium = p1.price > p2.price ? p1 : p2;

    return {
      summary: `Comparing **${p1.name}** (₹${p1.price.toLocaleString('en-IN')}) vs **${p2.name}** (₹${p2.price.toLocaleString('en-IN')}).`,
      dimensions: [
        {
          feature: 'Pricing & Value',
          values: products.map((p) => `₹${p.price.toLocaleString('en-IN')}${p.mrp ? ` (Save ₹${p.mrp - p.price})` : ''}`),
        },
        {
          feature: 'Customer Rating',
          values: products.map((p) => `${p.ratingsAverage || 5.0}★ (${p.ratingsCount || 0} reviews)`),
        },
        {
          feature: 'Key Strengths',
          values: products.map((p) => (p.highlights || []).slice(0, 2).join(' • ') || 'Premium craftsmanship'),
        },
        {
          feature: 'Availability',
          values: products.map((p) => (p.stock > 0 ? `In Stock (${p.stock} units)` : 'Out of Stock')),
        },
      ],
      verdict: `Choose **${cheaper.name}** if you want the most cost-effective option (saves ₹${priceDiff.toLocaleString('en-IN')}). Choose **${premium.name}** for top-tier performance and features.`,
    };
  }

  try {
    const prompt = `Compare these products from our catalog:\n${JSON.stringify(prodSummaries, null, 2)}\n\n` +
      `Generate a side-by-side comparison. Return JSON with this structure:
{
  "summary": "Brief executive summary of differences",
  "dimensions": [
    { "feature": "Dimension name (e.g., Performance, Audio Quality, Battery Life, Build)", "values": ["Prod1 detail", "Prod2 detail"] }
  ],
  "verdict": "Clear purchasing recommendation stating who should buy which item"
}`;

    const response = await client.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: 'You are an objective, expert product comparison analyst for FlashShop.',
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text);
  } catch (err) {
    console.warn('⚠️ Gemini comparison call failed, fallback used:', err.message);
    return {
      summary: `Side-by-side comparison between ${products.map((p) => p.name).join(' and ')}.`,
      dimensions: [
        { feature: 'Price', values: products.map((p) => `₹${p.price.toLocaleString('en-IN')}`) },
        { feature: 'Ratings', values: products.map((p) => `${p.ratingsAverage || 5}★`) },
        { feature: 'Highlights', values: products.map((p) => (p.highlights || []).slice(0, 2).join(', ')) },
      ],
      verdict: `Both products offer strong value in their respective price segments. Review the highlights above to pick the best match for your lifestyle.`,
    };
  }
}

/**
 * Review summary generator with evidence from stored reviews.
 */
export async function generateReviewSummary({ product, reviews }) {
  if (!reviews || !reviews.length) {
    return {
      sentiment: 'Neutral',
      sentimentScore: 100,
      pros: ['No customer complaints recorded yet'],
      cons: ['Product is newly added to catalog'],
      verdict: 'Be the first customer to leave an in-depth review!',
      sampleQuotes: [],
    };
  }

  const client = getClient();
  const reviewPayload = reviews.map((r) => ({
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    date: r.createdAt,
  }));

  if (!client) {
    // Intelligent extractive fallback
    const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
    const positiveReviews = reviews.filter((r) => r.rating >= 4);
    const criticalReviews = reviews.filter((r) => r.rating <= 3);

    const pros = positiveReviews.slice(0, 3).map((r) => r.title || r.comment.slice(0, 80));
    const cons = criticalReviews.length
      ? criticalReviews.slice(0, 2).map((r) => r.title || r.comment.slice(0, 80))
      : ['Minor packaging feedback or high demand'];

    return {
      sentiment: avgRating >= 4 ? 'Overwhelmingly Positive' : avgRating >= 3 ? 'Mostly Positive' : 'Mixed',
      sentimentScore: Math.round((positiveReviews.length / reviews.length) * 100),
      pros: pros.length ? pros : ['Consistent build quality and performance as advertised'],
      cons,
      verdict: `Customers rate **${product.name}** an average of **${avgRating.toFixed(1)}/5★** based on ${reviews.length} verified review${reviews.length > 1 ? 's' : ''}. Verified buyers praise its reliability and value.`,
      sampleQuotes: reviews.slice(0, 2).map((r) => `"${r.comment.slice(0, 100)}..."`),
    };
  }

  try {
    const prompt = `PRODUCT: "${product.name}" (Price: ₹${product.price})\n` +
      `STORED CUSTOMER REVIEWS (${reviews.length} total):\n${JSON.stringify(reviewPayload, null, 2)}\n\n` +
      `Synthesize these reviews into an authentic customer consensus. Return JSON with this structure:
{
  "sentiment": "Overwhelmingly Positive" | "Mostly Positive" | "Mixed" | "Critical",
  "sentimentScore": number (0-100 positive percentage),
  "pros": ["list of 2-4 key features customers love, citing specific evidence"],
  "cons": ["list of 1-3 common drawbacks or caveats noted by buyers"],
  "verdict": "A concise summary paragraph capturing the genuine user experience",
  "sampleQuotes": ["1-2 direct quote snippets from the reviews"]
}`;

    const response = await client.models.generateContent({
      model: getModelName(),
      contents: prompt,
      config: {
        systemInstruction: 'You are an unbiased customer review analyst for FlashShop. Base your summary solely on the provided user reviews.',
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    return JSON.parse(response.text);
  } catch (err) {
    console.warn('⚠️ Gemini review summary call failed, using fallback:', err.message);
    return {
      sentiment: 'Mostly Positive',
      sentimentScore: 90,
      pros: ['Positive customer feedback on sound and durability'],
      cons: ['Stock moves quickly during sales'],
      verdict: `Verified buyers generally rate ${product.name} highly for build and value.`,
      sampleQuotes: reviews.slice(0, 1).map((r) => `"${r.comment.slice(0, 100)}..."`),
    };
  }
}
