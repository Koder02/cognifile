export interface QAResponse {
  question: string;
  answer: string;
  snippets: Array<{sentence: string; score: number}>;
  source?: string;
}

export default class QAService {
  static async ask(question: string, docId?: string): Promise<QAResponse> {
    const res = await fetch('http://localhost:3001/api/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, docId })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`QA request failed: ${res.status} ${res.statusText} ${txt}`);
    }
    return res.json();
  }
}
