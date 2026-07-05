export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  ollama: {
    model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    delayMs: parseInt(process.env.EMAIL_DELAY || '5000', 10),
  },
  candidate: {
    name: process.env.YOUR_NAME || 'Candidate',
    email: process.env.YOUR_EMAIL || '',
    phone: process.env.YOUR_PHONE || '',
  },
  resumePath: process.env.RESUME_PATH || './assets/Resume - 2026.pdf',
});
