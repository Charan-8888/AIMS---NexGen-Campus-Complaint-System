/**
 * AI Service — Pluggable complaint analysis using Groq (default) or mock.
 *
 * Architecture:
 *   complaintController → aiService.analyzeComplaint() → Groq LLM
 *   → structured JSON → validated → stored in AIAnalysis collection
 *
 * To add a new provider: add a case to the switch below and implement
 * the same interface: { category, confidence, priority, priorityScore,
 *   department, reason, recommendedAction, summary }
 */

const Groq = require('groq-sdk');
const AIAnalysis = require('../models/AIAnalysis');
const env = require('../config/environment');
const logger = require('../utils/logger');

// ─── Groq Client ─────────────────────────────────────────────────────────

let groqClient = null;
if (env.GROQ_API_KEY) {
  groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
}

// ─── Prompt Builder ───────────────────────────────────────────────────────

const buildSystemPrompt = () => `
You are an intelligent campus maintenance assistant for NexGen University.
Your task is to analyze a campus maintenance complaint and return a structured JSON response.

Available categories:
- Electrical, Plumbing, HVAC, IT/Network, Furniture, Civil, Cleaning, Laboratory, Security, Hostel, Transport, General Maintenance, Other

Available priorities:
- LOW: Minor issue with no immediate impact
- MEDIUM: Issue affects a small number of users
- HIGH: Significantly affects a classroom, lab, or facility
- CRITICAL: Safety risk, major infrastructure failure, flooding, electrical hazard, fire risk

Available departments:
- Electrical Maintenance, Plumbing Maintenance, HVAC Maintenance, IT Support, Furniture & Civil, Housekeeping, Laboratory Maintenance, Security, Hostel Maintenance, Transport, General Maintenance

IMPORTANT: Respond ONLY with a valid JSON object. No explanation. No markdown. No additional text.

JSON format:
{
  "category": "string",
  "confidence": 0.00-1.00,
  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
  "priorityScore": 1-10,
  "department": "string",
  "reason": "1-2 sentence explanation",
  "recommendedAction": "string",
  "summary": "one sentence summary"
}
`.trim();

const buildUserPrompt = (title, description) =>
  `Analyze this campus maintenance complaint:\n\nTitle: ${title}\n\nDescription: ${description}`;

// ─── Validation ───────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'Electrical', 'Plumbing', 'HVAC', 'IT/Network', 'Furniture',
  'Civil', 'Cleaning', 'Laboratory', 'Security', 'Hostel',
  'Transport', 'General Maintenance', 'Other',
];

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const validateAndSanitize = (raw) => {
  const result = {
    category: VALID_CATEGORIES.includes(raw.category) ? raw.category : 'General Maintenance',
    confidence: typeof raw.confidence === 'number'
      ? Math.min(1, Math.max(0, raw.confidence))
      : 0.5,
    priority: VALID_PRIORITIES.includes(raw.priority) ? raw.priority : 'MEDIUM',
    priorityScore: typeof raw.priorityScore === 'number'
      ? Math.min(10, Math.max(1, Math.round(raw.priorityScore)))
      : 5,
    department: typeof raw.department === 'string' ? raw.department.slice(0, 100) : 'General Maintenance',
    reason: typeof raw.reason === 'string' ? raw.reason.slice(0, 500) : '',
    recommendedAction: typeof raw.recommendedAction === 'string' ? raw.recommendedAction.slice(0, 500) : '',
    summary: typeof raw.summary === 'string' ? raw.summary.slice(0, 300) : '',
  };
  return result;
};

// ─── Groq Provider ─────────────────────────────────────────────────────────

const analyzeWithGroq = async (title, description) => {
  if (!groqClient) {
    throw new Error('Groq API key not configured');
  }

  const start = Date.now();

  const completion = await groqClient.chat.completions.create({
    model: env.AI_MODEL || 'llama3-8b-8192',
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(title, description) },
    ],
    temperature: 0.1, // Low temperature for consistent structured output
    max_tokens: 500,
    response_format: { type: 'json_object' }, // Force JSON output
  });

  const durationMs = Date.now() - start;
  const rawText = completion.choices[0]?.message?.content || '{}';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`AI returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  return {
    result: validateAndSanitize(parsed),
    rawResponse: parsed,
    model: env.AI_MODEL,
    promptTokens: completion.usage?.prompt_tokens,
    completionTokens: completion.usage?.completion_tokens,
    durationMs,
  };
};

// ─── Mock / Fallback Provider ──────────────────────────────────────────────

const MOCK_RULES = [
  { keywords: ['water', 'leak', 'flood', 'pipe', 'tap'], category: 'Plumbing', priority: 'HIGH', department: 'Plumbing Maintenance' },
  { keywords: ['light', 'switch', 'socket', 'power', 'electric', 'wire', 'fan'], category: 'Electrical', priority: 'MEDIUM', department: 'Electrical Maintenance' },
  { keywords: ['ac', 'air condition', 'hvac', 'cooling', 'heat', 'ventilation'], category: 'HVAC', priority: 'HIGH', department: 'HVAC Maintenance' },
  { keywords: ['wifi', 'internet', 'network', 'computer', 'lab', 'projector', 'it'], category: 'IT/Network', priority: 'MEDIUM', department: 'IT Support' },
  { keywords: ['desk', 'chair', 'furniture', 'bench', 'broken', 'damage'], category: 'Furniture', priority: 'LOW', department: 'Furniture & Civil' },
  { keywords: ['clean', 'dirty', 'washroom', 'toilet', 'hygiene', 'garbage'], category: 'Cleaning', priority: 'MEDIUM', department: 'Housekeeping' },
  { keywords: ['hostel', 'room', 'dorm', 'dormitory'], category: 'Hostel', priority: 'MEDIUM', department: 'Hostel Maintenance' },
  { keywords: ['security', 'cctv', 'camera', 'lock', 'door', 'gate'], category: 'Security', priority: 'HIGH', department: 'Security' },
];

const analyzeWithMock = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();

  let match = MOCK_RULES.find((rule) =>
    rule.keywords.some((kw) => text.includes(kw))
  );

  if (!match) {
    match = { category: 'General Maintenance', priority: 'LOW', department: 'General Maintenance' };
  }

  // Upgrade to CRITICAL if flooding/safety keywords found
  let priority = match.priority;
  if (/flood|electrocut|fire|blaze|emerg|safety|hazard|collapse/.test(text)) {
    priority = 'CRITICAL';
  }

  const priorityScoreMap = { LOW: 3, MEDIUM: 5, HIGH: 7, CRITICAL: 9 };

  return {
    result: {
      category: match.category,
      confidence: 0.78,
      priority,
      priorityScore: priorityScoreMap[priority],
      department: match.department,
      reason: `Complaint mentions keywords associated with ${match.category} issues.`,
      recommendedAction: `Dispatch ${match.department} team to inspect and resolve the issue.`,
      summary: `${match.category} issue reported: ${title.slice(0, 80)}`,
    },
    rawResponse: { mock: true },
    model: 'mock-rule-engine',
    promptTokens: 0,
    completionTokens: 0,
    durationMs: 10,
  };
};

// ─── Main Export ───────────────────────────────────────────────────────────

/**
 * Analyze a complaint and persist the result.
 * @param {string} title
 * @param {string} description
 * @param {string} complaintId - MongoDB ObjectId string
 * @param {string} complaintNumber
 * @returns {Promise<AIAnalysis document>}
 */
const analyzeComplaint = async (title, description, complaintId, complaintNumber) => {
  // Create pending record
  const analysisDoc = await AIAnalysis.create({
    complaintId,
    complaintNumber,
    input: { title, description },
    status: 'PENDING',
    provider: env.AI_PROVIDER || 'groq',
  });

  try {
    let analysisData;

    const provider = env.AI_PROVIDER || 'groq';

    switch (provider) {
      case 'groq':
        analysisData = await analyzeWithGroq(title, description);
        break;
      case 'mock':
        analysisData = analyzeWithMock(title, description);
        break;
      default:
        logger.warn(`[AI] Unknown provider: ${provider}. Using mock.`);
        analysisData = analyzeWithMock(title, description);
    }

    // Update the record with results
    await AIAnalysis.findByIdAndUpdate(analysisDoc._id, {
      ...analysisData,
      status: 'SUCCESS',
    });

    logger.info(
      `[AI] Complaint ${complaintNumber} analyzed: ` +
      `category=${analysisData.result.category}, priority=${analysisData.result.priority}`
    );

    return await AIAnalysis.findById(analysisDoc._id);
  } catch (error) {
    logger.error(`[AI] Analysis failed for ${complaintNumber}: ${error.message}`);

    // Fallback to mock on failure
    const fallback = analyzeWithMock(title, description);

    await AIAnalysis.findByIdAndUpdate(analysisDoc._id, {
      ...fallback,
      status: 'FALLBACK',
      errorMessage: error.message,
    });

    return await AIAnalysis.findById(analysisDoc._id);
  }
};

module.exports = { analyzeComplaint };
