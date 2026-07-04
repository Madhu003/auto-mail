// Verifies the local Ollama server is up before we try to use it, so a
// not-yet-started/still-starting Ollama fails with a clear message instead
// of a raw "ECONNREFUSED" stack trace deep in the fetch call.
export async function ensureOllamaRunning(): Promise<void> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

  try {
    const res = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      throw new Error(`Ollama responded with HTTP ${res.status}`);
    }
    console.log(`✅ Ollama server reachable at ${baseUrl}`);
  } catch {
    throw new Error(
      `🦙❌ Can't reach Ollama at ${baseUrl}. Make sure the Ollama app (or \`ollama serve\`) is running, then try again.`,
    );
  }
}
