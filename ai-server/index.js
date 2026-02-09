import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 4000;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(cors({ origin: true }));
app.use(express.json());

// All AI content must be in Arabic
const ARABIC_ONLY = 'Important: Write ALL content in Arabic (العربية) only. Questions, options, titles, explanations, and any text must be in Arabic. Do not use English in the generated content.';

// Helper: call OpenAI for JSON (optional)
async function generateWithOpenAI(systemPrompt, userPrompt) {
  if (!openai) return null;
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${ARABIC_ONLY}\n\n${systemPrompt}` },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });
    const text = completion.choices?.[0]?.message?.content;
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.error('OpenAI error:', err.message);
    return null;
  }
}

// POST /ai/plan
app.post('/ai/plan', async (req, res) => {
  const { level, preferences } = req.body || {};
  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' });
  }
  if (!level || !preferences) {
    return res.status(400).json({ error: 'level and preferences required' });
  }
  const systemPrompt = `You are an Arabic educational planner for Saudi high school (الثانوية) and التحصيلي exam prep. Return a JSON object with a single key "plans" whose value is an array of exactly one study plan object. Each plan: id (string), title (string in Arabic only), level (string), status ("not-started"), completionPercentage (0), completedModules (empty array), quizScores (empty object), createdAt (ISO date string). The title must be a study plan title in Arabic for level "${level}".`;
  const userPrompt = `Create one study plan for level: ${level}. Preferences: ${JSON.stringify(preferences)}. Return JSON object with key "plans" containing one plan. Title in Arabic.`;
  const generated = await generateWithOpenAI(systemPrompt, userPrompt);
  const plans = Array.isArray(generated) ? generated : (generated?.plans || generated?.plan ? (Array.isArray(generated.plans) ? generated.plans : [generated.plan]) : null);
  if (plans && plans.length > 0) {
    return res.json(plans);
  }
  res.status(503).json({ error: 'Failed to generate plan' });
});

// POST /ai/flashcards
app.post('/ai/flashcards', async (req, res) => {
  const { moduleId, topic } = req.body || {};
  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' });
  }
  if (!moduleId) {
    return res.status(400).json({ error: 'moduleId required' });
  }
  const systemPrompt = `You are an Arabic education assistant. Return a JSON object with a single key "flashcards" whose value is an array of objects: { id (string), front (question in Arabic), back (answer in Arabic) }. Generate 4-6 flashcards. Every "front" and "back" must be written in Arabic only.`;
  const userPrompt = `Module: ${moduleId}. Topic: ${topic || moduleId}. Write all front and back text in Arabic. Return only valid JSON.`;
  const generated = await generateWithOpenAI(systemPrompt, userPrompt);
  if (generated?.flashcards && Array.isArray(generated.flashcards)) {
    return res.json(generated.flashcards.map((f, i) => ({ id: String(i + 1), front: f.front, back: f.back })));
  }
  res.status(503).json({ error: 'Failed to generate flashcards' });
});

// POST /ai/quiz
app.post('/ai/quiz', async (req, res) => {
  const { moduleId, topic } = req.body || {};
  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' });
  }
  if (!moduleId) {
    return res.status(400).json({ error: 'moduleId required' });
  }
  const systemPrompt = `You are an Arabic education assistant. Return a JSON object: { "title": "quiz title in Arabic", "questions": [ { "question": "question in Arabic", "options": ["choice1 in Arabic","choice2 in Arabic","choice3 in Arabic","choice4 in Arabic"], "correctAnswer": 0 } ] }. Generate 5 questions. correctAnswer is 0-based index (0-3). Every question and every option must be in Arabic only.`;
  const userPrompt = `Module: ${moduleId}. Topic: ${topic || moduleId}. Write title, all questions, and all four options for each question in Arabic. Return only valid JSON.`;
  const generated = await generateWithOpenAI(systemPrompt, userPrompt);
  if (generated?.title && Array.isArray(generated.questions)) {
    return res.json({ title: generated.title, questions: generated.questions });
  }
  res.status(503).json({ error: 'Failed to generate quiz' });
});

// POST /ai/final-exam
app.post('/ai/final-exam', async (req, res) => {
  const { planId, level } = req.body || {};
  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' });
  }
  const systemPrompt = `You are an Arabic education assistant for التحصيلي exam. Return a JSON object with key "questions" (array). Each item: { "subject": "subject name in Arabic (e.g. الرياضيات, الفيزياء, الكيمياء, الأحياء, اللغة العربية)", "question": "question in Arabic", "options": ["option1 in Arabic","option2 in Arabic","option3 in Arabic","option4 in Arabic"], "correctAnswer": 0 }. Generate 10 questions across different subjects. correctAnswer is 0-based index (0-3). Every subject, question, and option must be in Arabic only.`;
  const userPrompt = `Plan: ${planId}. Level: ${level || 'intermediate'}. Write all subjects, questions, and four options per question in Arabic. Return only valid JSON.`;
  const generated = await generateWithOpenAI(systemPrompt, userPrompt);
  if (generated?.questions && Array.isArray(generated.questions)) {
    return res.json(generated.questions);
  }
  res.status(503).json({ error: 'Failed to generate final exam' });
});

// POST /ai/module-content
app.post('/ai/module-content', async (req, res) => {
  const { moduleId, topic } = req.body || {};
  if (!openai) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured' });
  }
  if (!moduleId) {
    return res.status(400).json({ error: 'moduleId required' });
  }
  const systemPrompt = `You are an Arabic education assistant. Return a JSON object: { "title": "module title in Arabic", "slides": [ { "title": "slide title in Arabic", "content": "paragraph in Arabic", "example": "example in Arabic", "keyPoints": ["point1 in Arabic","point2 in Arabic"] } ] }. Generate 3-5 slides. Every title, content, example, and each keyPoint must be written in Arabic only.`;
  const userPrompt = `Module: ${moduleId}. Topic: ${topic || moduleId}. Write all slide titles, content, examples, and keyPoints in Arabic. Return only valid JSON.`;
  const generated = await generateWithOpenAI(systemPrompt, userPrompt);
  if (generated?.title && Array.isArray(generated.slides)) {
    return res.json({ title: generated.title, slides: generated.slides });
  }
  res.status(503).json({ error: 'Failed to generate module content' });
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Afaq AI server running at http://localhost:${PORT}`);
  if (!openai) console.log('No OPENAI_API_KEY – all /ai/* endpoints will return 503 until OPENAI_API_KEY is set.');
});
