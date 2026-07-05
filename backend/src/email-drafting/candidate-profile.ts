// Summary of the candidate's background, used to ground LLM-generated cold emails.
// Consolidated from resume content — edit this to keep generated emails accurate
// to your actual experience as it evolves.
export function buildCandidateProfile(name: string, email: string, phone: string): string {
  return `
Name: ${name}
Title: Senior Software Engineer
Location: Bengaluru, Karnataka, India
Email: ${email}
Phone: ${phone}
LinkedIn: linkedin.com/in/madhu003

Professional Summary:
Senior Full Stack Engineer with 9+ years of experience delivering end-to-end, highly scalable web
applications, balancing robust backend infrastructure with high-performance frontend architectures.
Proven track record designing highly available Node.js and Python (FastAPI) RESTful APIs, optimizing
PostgreSQL/BigQuery databases, and managing secure cloud deployments on GCP. Equally adept at
engineering complex React.js micro-frontends, UI design systems, and real-time WebSockets dashboards.
Drives operational efficiency by owning the full technical stack, from secure credential management to
rendering millions of data points at a strict 60 FPS standard.

Technical Skills:
- Frontend & UI: React.js (Hooks, Context), TypeScript, Next.js, Redux Toolkit, TanStack Query (React Query),
  Micro-Frontends (Webpack Module Federation), UI Design Systems, WebComponents, HTML5 Canvas.
- Backend & Cloud: Node.js, Python (FastAPI, Asyncio), RESTful APIs, WebSockets, Microservices,
  Java Spring Boot, GCP (Compute Engine/VMs, Cloud Storage, Secret Manager), Firebase.
- Databases: PostgreSQL, MySQL, SQL, Google BigQuery, database schema design, query optimization.
- DevOps & Tooling: Docker, Jenkins (CI/CD), Webpack/Vite, Linux environment management, NPM SDK design.
- Languages: JavaScript (ES6+), TypeScript, Python, Java, SQL, HTML5/CSS3.

Work Experience:
- Impact Analytics, Bengaluru — Senior Software Engineer (Sep 2023 - Present)
  Architected a reactive Pricing Dashboard using React + WebSockets (Python FastAPI backend) consuming
  live AI simulation events, cutting data-fetching latency by 40%. Built a high-performance Excel-like
  pivot table with drag-and-drop grouping over multi-dimensional datasets, and a runtime-configurable
  Dynamic UI Engine that renders forms/tables from JSON metadata, cutting client onboarding time by 70%.
  Also designed highly available Node.js REST APIs on GCP VMs with GCP Secret Manager for credential
  management, and a React.js micro-frontend platform (Webpack Module Federation + event bus).

- Nagarro, Jaipur — Associate Staff Engineer (Sep 2022 - Jan 2023)
  Developed WebComponents/micro-frontends integrated into an Adobe Experience Manager (AEM) application.
  Architected a secure Node.js + MySQL backend integrating PCI-compliant payment gateways for a
  high-traffic e-commerce platform, and Redux-based enterprise state management for multi-step checkout.

- Impact Analytics, Bengaluru — Senior Software Engineer (Apr 2021 - Jul 2022)
  Engineered high-throughput Node.js + Google BigQuery services for retrieving/visualizing millions of
  retail KPI data points. Led refactor of legacy callback/then-catch code into async/await patterns, and
  built client-side caching/virtualization for instant filtering of large datasets without extra DB load.

- Ranosys Technologies, Jaipur — Software Engineer (Apr 2019 - Apr 2021)
  Built a Python (FastAPI) OCR middleware orchestrating OpenCV/Tesseract for automated identity document
  text extraction. Architected a modular Node.js NPM SDK for banking clients for real-time video KYC
  validation, with normalized MySQL schemas for secure, compliant log storage. Also built an HTML5 Canvas
  annotation tool for pixel-perfect bounding-box labeling to improve AI model training data.

- PaniPuri Soft — Full Stack Developer (Jan 2017 - Apr 2019)
  Built an end-to-end supply chain and point-of-sale system using Java Spring Boot and Angular,
  automating inventory workflows from production through retail reporting.

Education: B.Tech. in Computer Science Engineering, Vyas Institute of Engineering & Technology, Jodhpur (2012-2016)

Available to join immediately. Open to relocation depending on the role.
`.trim();
}

// Fixed email signature — appended programmatically after LLM generation so
// the name/title/links are always exact, never left to the model to recall.
export const CANDIDATE_SIGNATURE = `Madhu Soodan
Senior Software Engineer
LinkedIn Profile (https://www.linkedin.com/in/madhu003/) | GitHub Portfolio (https://github.com/Madhu003)`;
