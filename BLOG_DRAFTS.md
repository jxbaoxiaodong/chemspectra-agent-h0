# Blog Drafts for H0 AWS+Vercel Hackathon

> Three articles for dev.to / Medium / LinkedIn — each worth +0.2 bonus points (up to +0.6)

---

## Article 1: Technical Deep Dive (dev.to)

# How I Built a Self-Verifying AI Agent with DynamoDB and ReAct Reasoning

*Built for the #H0Hackathon — Hack the Zero Stack with Vercel v0 and AWS Databases*

---

Most AI pipelines follow a fixed script: input in, output out, nobody checks the work. For the H0 hackathon (Track 2: Monetizable B2B App), I built **ChemSpectra Agent** — an FTIR spectral analysis system where the AI verifies its own conclusions and self-corrects when evidence conflicts.

### The ReAct Loop

Instead of hardcoding which tools to call, the agent uses a ReAct loop with Qwen-3.7-Max function calling. The LLM autonomously selects from 5 tools — `identify_material` (130K+ reference spectra), `explain_peaks`, `assign_functional_groups`, `match_library_topk`, and `search_public_results`. A material ID request might trigger two tools; a deformulation request triggers all three analytical tools. The LLM decides, not the developer.

### Cross-Validation and Self-Verification

After tools return results, `_detect_evidence_conflicts()` compares outputs. If `identify_material` says "PET" but `assign_functional_groups` found no ester groups, that's a contradiction:

```python
expected_groups = {
    "pet": ["ester", "c=o", "aromatic"],
    "nylon": ["amide", "n-h", "c=o"],
}
```

The agent estimates confidence from match scores, candidate score gaps, and functional group coverage. Below 0.75 confidence or any conflicts, a verification round fires automatically:

```python
needs_verification = (
    confidence < 0.75 or len(conflicts) > 0
)
```

The agent gets told exactly what went wrong and calls additional tools to investigate. Post-verification confidence is logged, creating traces like `[0.62, 0.84]`.

### DynamoDB: Beyond Key-Value Storage

Every session persists to DynamoDB with 30-day TTL — tool call logs, confidence traces, synthesis, final report. But we went deeper than basic CRUD:

- **Two GSIs** — `gsi-created` (partition: `ALL`, sort: `created_at`) replaces full-table scan with efficient time-ordered query; `gsi-material` (partition: `top_match`, sort: `created_at`) enables "show me all PET analyses" aggregation
- **Atomic counters** — a separate `chemspectra-stats` table tracks `total_analyses` and `total_tools_called` via DynamoDB `ADD` operations, safe under concurrent requests
- **Conditional writes** — confirmed sessions use `attribute_not_exists(session_id) OR step <> :confirmed` to prevent concurrent overwrites of finalized reports

Regulated industries (pharma, forensics) require this audit trail. DynamoDB fits because the primary access is single-item by `session_id`, the GSIs cover the two secondary patterns, and TTL handles cleanup automatically.

### Results

The loop runs 2-4 iterations in under 30 seconds. Self-repair for malformed LLM JSON has near-100% recovery. This turns "AI that gives answers" into "AI that checks its work" — essential when reports go into regulatory filings.

**Try it**: [chemspectra-agent-h0.vercel.app](https://chemspectra-agent-h0.vercel.app) | **Code**: [github.com/jxbaoxiaodong/chemspectra-agent-h0](https://github.com/jxbaoxiaodong/chemspectra-agent-h0)

*Tags: #H0Hackathon #AWS #DynamoDB #AI #Vercel #ReAct #FTIR #ChemicalAnalysis*

---

## Article 2: Product & Business (Medium)

# From Lab Bench to SaaS: Building an AI Copilot for Materials QC

*A #H0Hackathon project — Track 2: Monetizable B2B App*

---

In a polymer QC lab, an FTIR scan takes 30 seconds. The analysis that follows — comparing peaks against references, consulting handbooks, writing the report — takes 30 to 60 minutes. Multiply by dozens of samples daily. That bottleneck is why I built **ChemSpectra Agent** for the H0 hackathon.

### The Problem

FTIR spectroscopy identifies materials by their infrared absorption patterns — C=O near 1730 cm-1, O-H around 3300 cm-1. But interpreting those patterns requires trained spectroscopists, and not every lab has one. Even experts need time to cross-reference peaks against libraries.

ChemSpectra Agent compresses that workflow to under 2 minutes. The AI agent autonomously selects analysis tools, matches against 130,000+ reference spectra, cross-validates evidence, and presents results with confidence scores.

### Why Human-in-the-Loop Is Non-Negotiable

This is not a black box. After multi-tool analysis, results hit a confirmation checkpoint where the analyst reviews the identification, confidence score, and chemical reasoning before accepting.

In regulated industries, this is compliance, not convenience. Pharma companies under FDA 21 CFR Part 11 need documented human review. Forensic labs need expert sign-off. Environmental facilities need verifiable audit trails. The human-in-the-loop checkpoint fits existing compliance frameworks rather than fighting them.

### Real Users, Not Demo Data

ChemSpectra Agent runs on FTIR.fun — a production platform with users in 52 countries, 130,000+ spectra, and 28+ file formats. The hackathon added three things the platform needed: an autonomous AI agent (ReAct reasoning with Qwen-3.7-Max), persistent storage (AWS DynamoDB), and a modern frontend (Vercel v0 / Next.js).

### The B2B Opportunity

The FTIR spectroscopy market exceeds $1.5 billion. Most labs still use 1990s vendor software or manual lookups. ChemSpectra Agent offers SaaS subscription with per-sample pricing. Save 30 minutes per sample across 200 monthly samples = 100 hours recovered.

Target segments: polymer manufacturers (incoming QC), pharmaceutical companies (identity testing), forensic labs (substance ID), and environmental testing (contaminant detection).

Building for a hackathon forces you to ship. Building for B2B forces you to think about who pays. That intersection produced something worth continuing.

**Live demo**: [chemspectra-agent-h0.vercel.app](https://chemspectra-agent-h0.vercel.app) | **Code**: [github.com/jxbaoxiaodong/chemspectra-agent-h0](https://github.com/jxbaoxiaodong/chemspectra-agent-h0)

*Tags: #H0Hackathon #AWS #B2BSaaS #AI #MaterialsScience #FTIR #QualityControl #Vercel*

---

## Article 3: Build Retrospective (LinkedIn)

# What I Learned Building a Full-Stack AI App with AWS + Vercel in 7 Days

*Reflections from the #H0Hackathon — building ChemSpectra Agent*

---

Last week I shipped a full-stack AI app for the H0 hackathon: Next.js on Vercel, FastAPI backend with ReAct reasoning, Amazon DynamoDB for persistence. It analyzes FTIR spectra for materials QC labs — a B2B use case with users in 52 countries.

Here is what I learned.

### Vercel v0: Real Prototyping Power

v0 generated a working Next.js frontend in two hours — file upload, analysis cards, confidence badges, dark theme. Clean TypeScript and Tailwind. I still wired up the API client, SSE streaming, chat interface, and history sidebar, but v0 eliminated the blank-canvas problem.

**Takeaway**: Use v0 for the 80% that is standard UI. Spend your time on the 20% that differentiates.

### DynamoDB: Simple Until You Query

Setup was fast: table, partition key, TTL, done. Single-item reads by `session_id` are instant. The friction came when listing recent sessions — a naive `scan` returns random order. The fix: a GSI (`gsi-created`) with a fixed partition key and `created_at` sort key, turning O(n) scan into O(1) query. I added a second GSI (`gsi-material`) for "show all analyses of Polyethylene" aggregation, atomic counters on a stats table for usage metrics, and conditional writes to prevent overwriting confirmed sessions.

**Takeaway**: Design your access patterns before writing code. Plan GSIs upfront — retrofitting them costs 5-10 minutes of CREATING status per index.

### ReAct Loops Work

I was skeptical about letting the LLM choose tools autonomously. In practice, Qwen-3.7-Max consistently picked sensible combinations — most analyses completed in 2-3 iterations, never hitting the 6-round cap. The self-verification (confidence < 0.75 triggers re-investigation) was the most satisfying feature. Watching the agent detect contradictions and call additional tools to resolve them felt like genuine reasoning.

### Infrastructure Eats Time

Seven days broke down to: Day 1-2 frontend + Vercel, Day 2-3 AWS setup, Day 4-5 integration + CORS + SSH tunnels for public access, Day 5-7 video + docs + polish. Infrastructure consumed more time than features.

### Five Tips for Hackathon Builders

1. **Deploy first.** Get Hello World on your production stack before writing features.
2. **Use code generation aggressively.** v0, Cursor, Claude — whatever kills boilerplate fastest.
3. **Match database to access pattern.** DynamoDB for key-value sessions; would be wrong for relational queries.
4. **Script your demo video first.** It drives feature prioritization.
5. **Ship something real.** Judges know the difference between demos and products.

Building under deadline, with real constraints, for a real use case — that is when the best decisions happen.

**Live**: [chemspectra-agent-h0.vercel.app](https://chemspectra-agent-h0.vercel.app) | **Code**: [github.com/jxbaoxiaodong/chemspectra-agent-h0](https://github.com/jxbaoxiaodong/chemspectra-agent-h0)

*Tags: #H0Hackathon #AWS #Vercel #DynamoDB #AI #Hackathon #FullStack #NextJS #FastAPI #BuildInPublic*
