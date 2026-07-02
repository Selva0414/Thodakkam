import Groq from "groq-sdk";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing. Set it in backend environment variables to use AI code evaluation.");
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

export interface AICodingResult {
  score: number;
  breakdown: {
    logic: number;
    quality: number;
    edgeCases: number;
    efficiency: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export async function evaluateCode(
  code: string,
  language: string,
  problemDescription?: string
): Promise<AICodingResult> {
  const groq = getGroqClient();

  const prompt = `You are an expert code reviewer. Evaluate the following ${language} code submission for a coding assessment.

${problemDescription ? `Problem Description: ${problemDescription}\n` : ""}
Code Submitted:
\`\`\`${language}
${code}
\`\`\`

Evaluate the code on these 4 dimensions (0-25 points each, total 100):
1. Logic Correctness (0-25): Does the logic solve the problem correctly?
2. Code Quality (0-25): Is the code clean, readable, well-structured?
3. Edge Case Handling (0-25): Does it handle edge cases and invalid inputs?
4. Efficiency (0-25): Is the time/space complexity reasonable?

Respond ONLY with a valid JSON object, no markdown, no explanation outside JSON:
{
  "score": <total 0-100>,
  "breakdown": {
    "logic": <0-25>,
    "quality": <0-25>,
    "edgeCases": <0-25>,
    "efficiency": <0-25>
  },
  "feedback": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 512,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";

  // Extract JSON from response (handles cases where model wraps in markdown)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI returned non-JSON response");

  const parsed = JSON.parse(jsonMatch[0]) as AICodingResult;
  // Clamp values
  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  parsed.breakdown.logic = Math.max(0, Math.min(25, Math.round(parsed.breakdown.logic)));
  parsed.breakdown.quality = Math.max(0, Math.min(25, Math.round(parsed.breakdown.quality)));
  parsed.breakdown.edgeCases = Math.max(0, Math.min(25, Math.round(parsed.breakdown.edgeCases)));
  parsed.breakdown.efficiency = Math.max(0, Math.min(25, Math.round(parsed.breakdown.efficiency)));
  return parsed;
}
