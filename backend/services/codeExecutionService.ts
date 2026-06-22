import axios from 'axios';
import http from 'http';
import https from 'https';

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const USE_RAPIDAPI = JUDGE0_URL.includes('rapidapi.com');

// Reuse TCP/TLS connections across submissions instead of handshaking each time.
const keepAliveHttpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const keepAliveHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
const judge0Client = axios.create({
  httpAgent: keepAliveHttpAgent,
  httpsAgent: keepAliveHttpsAgent,
  timeout: 30_000,
});

const LANGUAGE_MAP: Record<string, { id: number; name: string }> = {
  javascript: { id: 63, name: 'JavaScript (Node.js 12.14.0)' },
  python: { id: 71, name: 'Python (3.8.1)' },
  java: { id: 62, name: 'Java (OpenJDK 13.0.1)' },
  cpp: { id: 54, name: 'C++ (GCC 9.2.0)' },
  c: { id: 50, name: 'C (GCC 9.2.0)' },
  typescript: { id: 74, name: 'TypeScript (3.7.4)' },
  go: { id: 60, name: 'Go (1.13.5)' },
  rust: { id: 73, name: 'Rust (1.40.0)' },
  csharp: { id: 51, name: 'C# (Mono 6.6.0.161)' },
  ruby: { id: 72, name: 'Ruby (2.7.0)' },
  php: { id: 68, name: 'PHP (7.4.1)' },
  swift: { id: 83, name: 'Swift (5.2.3)' },
  kotlin: { id: 78, name: 'Kotlin (1.3.70)' }
};

export async function executeCode(language: string, code: string, input: string = ''): Promise<any> {
  // Skip the HTTP call entirely when no API key is configured
  if (USE_RAPIDAPI && !RAPIDAPI_KEY) {
    return {
      success: false,
      output: '',
      error: 'Code execution API not configured. Please set up Judge0 API or self-host.',
      exitCode: 1
    };
  }

  try {
    const langConfig = LANGUAGE_MAP[language.toLowerCase()] || LANGUAGE_MAP.javascript;

    const submitHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (USE_RAPIDAPI) {
      submitHeaders['X-RapidAPI-Key'] = RAPIDAPI_KEY;
      submitHeaders['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
    }

    const submitPayload = {
      source_code: Buffer.from(code).toString('base64'),
      language_id: langConfig.id,
      stdin: Buffer.from(input || '').toString('base64'),
      cpu_time_limit: 5,
      memory_limit: 128000
    };

    const submitResponse = await judge0Client.post(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`,
      submitPayload,
      { headers: submitHeaders }
    );

    const result = submitResponse.data;

    const stdout = result.stdout ? Buffer.from(result.stdout, 'base64').toString('utf-8') : '';
    const stderr = result.stderr ? Buffer.from(result.stderr, 'base64').toString('utf-8') : '';
    const compileOutput = result.compile_output ? Buffer.from(result.compile_output, 'base64').toString('utf-8') : '';

    const isSuccess = result.status_id === 3;

    return {
      success: isSuccess,
      output: stdout.trim(),
      error: stderr.trim() || (result.status_id === 6 ? compileOutput.trim() : ''),
      exitCode: result.exit_code || 0,
      compileOutput: compileOutput.trim(),
      compileError: result.status_id === 6 ? compileOutput.trim() : '',
      statusId: result.status_id,
      statusDescription: result.status?.description || ''
    };
  } catch (error: any) {
    console.error('Code execution error:', error.message);

    if (error.response?.status === 401) {
      return {
        success: false,
        output: '',
        error: 'Code execution API not configured. Please set up Judge0 API or self-host.',
        exitCode: 1
      };
    }

    return {
      success: false,
      output: '',
      error: error.response?.data?.message || error.message || 'Execution failed',
      exitCode: 1
    };
  }
}

export async function runTestCases(language: string, code: string, testCases: any[]): Promise<any> {
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const input = testCase.input || '';
    const expectedOutput = (testCase.output || '').trim();

    try {
      const execResult = await executeCode(language, code, input);

      const actualOutput = execResult.output.trim();
      const passed = actualOutput === expectedOutput;

      results.push({
        testNumber: i + 1,
        input: input,
        expectedOutput: expectedOutput,
        actualOutput: actualOutput,
        passed: passed,
        error: execResult.error || null,
        executionTime: null
      });
    } catch (error: any) {
      results.push({
        testNumber: i + 1,
        input: input,
        expectedOutput: expectedOutput,
        actualOutput: '',
        passed: false,
        error: error.message
      });
    }
  }

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  return {
    results,
    summary: {
      passed: passedCount,
      total: totalCount,
      allPassed: passedCount === totalCount,
      score: totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0
    }
  };
}

export async function getLanguages() {
  return Object.entries(LANGUAGE_MAP).map(([key, value]) => ({
    key: key,
    id: value.id,
    name: value.name
  }));
}
