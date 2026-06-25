# ChemSpectra Agent — H0 AWS+Vercel Voiceover Script

Total: 180 seconds. English. Moderate pace (~2.0 words/second).

---

## Scene 1 — Title (0:00–0:08)
*[No voiceover. Title card: "CHEMSPECTRA AGENT" + H0 Hackathon + Track 2: Monetizable B2B App + AWS DynamoDB + Vercel badges.]*

---

## Scene 2 — B2B Problem (0:08–0:28)
> QC labs spend 30 to 60 minutes on every single FTIR sample — reading peaks, searching spectral libraries, cross-checking literature, writing reports. That's hours of expert time on repetitive work.
>
> ChemSpectra Agent reduces that to under 2 minutes. 30x faster. We already serve polymer manufacturers, pharmaceutical QC labs, and forensics agencies in 52 countries.

---

## Scene 3 — Architecture (0:28–0:53)
> Here's the full-stack architecture. A Vercel-deployed Next.js frontend calls a FastAPI backend. The backend runs a Qwen 3.7-Max ReAct agent with five specialized tools — material identification, peak explanation, functional group assignment, library matching, and public result search.
>
> Each tool hits the FTIR.fun API, backed by 130,000 reference spectra and 28 file formats. Every analysis session is persisted in AWS DynamoDB with full audit trail — session ID, top match, confidence score, and timestamp. Sessions auto-expire after 30 days.

---

## Scene 4 — Vercel Frontend Demo (0:53–1:48)
> Here's the live frontend at chemspectra-agent-h0.vercel.app. Deployed and in production.
>
> We submit peaks at 2920, 1720, and 1230 wavenumbers — asking to identify an unknown white powder. The Agent REASONS about what we asked, then selects three tools: material identification, peak explanation, and functional group assignment.
>
> Results come back: Polyethylene Terephthalate — PET — with 94% confidence. The system detected low initial confidence, launched an automatic verification round, and improved from 0.72 to 0.94. That's a 30% gain through autonomous investigation — no human intervention.
>
> The user can ask follow-up questions, confirm the analysis, and download a structured report. This human-in-the-loop gate meets compliance requirements for regulated industries.

---

## Scene 5 — AWS DynamoDB Evidence (1:48–2:08)
> The H0 hackathon requires AWS database usage. We chose DynamoDB for serverless session persistence. Here's the AWS Console — the chemspectra-sessions table.
>
> Each row is a real analysis session: session ID, top material match, confidence score, match count, and timestamp. The IAM user has DynamoDBFullAccess. We're running on $100 in AWS credits with 184 days remaining. Sessions auto-expire after 30 days via DynamoDB TTL.

---

## Scene 6 — Innovation & B2B Value (2:08–2:38)
> What makes this different: the Agent AUTONOMOUSLY selects which tools to use based on user intent — not a fixed pipeline. Different questions trigger different tool combinations. Self-verification detects conflicts and launches corrective rounds automatically.
>
> This is a monetizable B2B SaaS. SaaS subscription plus per-sample pricing. 30x faster analysis means direct ROI for QC labs. Target customers: polymer manufacturers, pharmaceutical QC, forensics agencies, environmental testing labs. Already revenue-generating.

---

## Scene 7 — Closing (2:38–3:00)
> ChemSpectra Agent: Vercel frontend, AWS DynamoDB backend, Qwen 3.7-Max ReAct agent with self-verification. Five autonomous tools backed by 130,000 production spectra.
>
> Built by a domain expert who lived the problem. Powered by AWS and AI. Open source on GitHub.
>
> Thank you.

---

## Recording Notes
- Tone: authoritative, B2B pitch style. Not "I'm a scientist" — "this is a product."
- Emphasize: "AWS DynamoDB" (Scene 5), "Vercel" (Scene 4), "52 countries" (Scene 2), "0.72 → 0.94" (Scene 4).
- Scene 5 (DynamoDB) is the H0 submission requirement — make it clear and deliberate.
- Scene 4 URL bar must be visible — "chemspectra-agent-h0.vercel.app" proves Vercel deployment.
