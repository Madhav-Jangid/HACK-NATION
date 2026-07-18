# Product Requirements Document (PRD)

# VC Brain — Autonomous AI Investment Committee

**Hackathon:** Hack-Nation 6th Global AI Hackathon  
**Challenge:** VC Brain  
**Version:** MVP v1.0  
**Timeline:** ~19 Hours

---

# 1. Product Vision

## Problem Statement

Early-stage Venture Capital firms spend significant time manually sourcing founders, reviewing public profiles, reading GitHub repositories, evaluating technical capability, researching markets, and preparing investment memos.

This process is:

- Slow
- Expensive
- Difficult to scale
- Highly subjective
- Prone to missing exceptional founders

---

## Vision

VC Brain is an AI-powered investment intelligence platform that acts as an **Autonomous Investment Committee**.

Instead of replacing investors, it performs the first layer of due diligence by autonomously researching founders, analyzing technical and market signals, debating internally through specialized AI agents, and producing transparent, evidence-backed investment recommendations.

---

# 2. Objective

Build an MVP capable of:

- Discovering founders
- Collecting public information
- Building structured founder memory
- Running multiple AI agents
- Generating explainable investment recommendations
- Producing investor-ready investment memos

All within **60 seconds**.

---

# 3. Success Criteria

A judge should be able to:

- Search any founder
- Watch AI perform autonomous research
- View multiple AI agents reasoning independently
- Receive an investment recommendation
- Verify every AI claim with evidence

---

# 4. Target Users

## Primary Users

- Venture Capital Firms
- Angel Investors
- Startup Accelerators
- Investment Analysts

## Secondary Users

- University Incubators
- Corporate Innovation Teams
- Startup Scouts

---

# 5. Core Workflow

```text
Search Founder
        │
        ▼
Collect Public Data
        │
        ▼
Build Founder Memory
        │
        ▼
AI Investment Committee
        │
        ▼
Founder Score
        │
        ▼
Investment Memo
        │
        ▼
Evidence & Sources
        │
        ▼
Investment Recommendation
```

---

# 6. Features

---

## Feature 1 — Founder Search

### Description

Search founders using:

- Founder Name
- Startup Name
- GitHub URL
- LinkedIn URL
- Portfolio Website

### Output

- Public Profiles
- Projects
- GitHub Repositories
- Company Information
- Articles
- Social Links

---

## Feature 2 — AI Research Engine

Automatically gathers information from:

- GitHub
- Portfolio
- Product Hunt
- Devpost
- Blogs
- Company Website
- LinkedIn (public data)
- News Articles
- Research Papers
- Hackathons

### Pipeline

```text
Search

↓

Collect Documents

↓

Normalize

↓

Extract Knowledge

↓

Generate Structured Founder Profile
```

---

## Feature 3 — Founder Memory

Creates a structured knowledge profile.

### Includes

- Personal Information
- Education
- Experience
- Projects
- Open Source Contributions
- Awards
- Skills
- Companies
- Research
- Patents
- Funding
- Timeline

---

## Feature 4 — Autonomous AI Investment Committee

The heart of the application.

Instead of one AI making decisions, multiple specialized AI agents independently evaluate the founder.

---

### Agent 1 — Technical Partner

Responsibilities

- Analyze GitHub
- Evaluate engineering capability
- Review architecture
- Assess open-source impact
- Measure technical depth

Output

- Technical Score
- Technical Summary
- Confidence
- Supporting Evidence

---

### Agent 2 — Founder Partner

Responsibilities

- Leadership
- Experience
- Consistency
- Execution Ability
- Career Growth

Output

- Founder Score
- Leadership Assessment
- Confidence
- Evidence

---

### Agent 3 — Market Partner

Responsibilities

- Market Size
- Industry Trends
- Competitive Landscape
- Timing
- Product Opportunity

Output

- Market Score
- Market Analysis
- Confidence

---

### Agent 4 — Risk Partner

Purpose

Challenge every positive assumption.

Looks for:

- Missing Information
- Risks
- Weaknesses
- Competition
- Technical Debt
- Red Flags

Output

- Risk Assessment
- Critical Questions
- Risk Score

---

### Agent 5 — Managing Partner

Reads outputs from every agent.

Produces:

- Final Recommendation
- Investment Memo
- Confidence Score
- Suggested Next Steps

---

# 7. Founder Score

Overall Score

```
86 / 100
```

Breakdown

- Technical
- Leadership
- Innovation
- Execution
- Consistency
- Market
- Risk

Visualization

- Radar Chart
- Progress Bars

---

# 8. Investment Memo

Automatically generated report.

Sections

- Executive Summary
- Founder Overview
- Technical Evaluation
- Market Opportunity
- SWOT Analysis
- Competitive Landscape
- Risk Analysis
- Questions for Founder
- Investment Recommendation

Export Options

- PDF
- Markdown

---

# 9. Evidence Layer

Every AI-generated statement must include:

- Source
- Evidence
- Confidence
- Timestamp

Example

```text
Claim

Strong Open Source Presence

Evidence

GitHub Repository
1,200 Stars

Confidence

96%
```

---

# 10. Explainability

Every recommendation should answer:

- Why?
- Based on what evidence?
- Confidence level?
- Which sources?

No black-box reasoning.

---

# 11. Technology Stack

## Frontend

- Next.js 15
- React
- TailwindCSS
- shadcn/ui
- Framer Motion
- Recharts

---

## Backend

- FastAPI
- Python
- Pydantic

---

## AI

- OpenAI GPT
- Structured Outputs
- JSON Mode

---

## Search

- Tavily API

---

## Storage

- SQLite (MVP)

or

- Supabase PostgreSQL

---

## Deployment

- Vercel
- Railway

---

# 12. High-Level Architecture

```text
                    User
                      │
                      ▼
              Founder Search
                      │
                      ▼
               Tavily Search API
                      │
                      ▼
          Public Data Collection
                      │
                      ▼
      Cleaning & Normalization Layer
                      │
                      ▼
             Founder Memory Builder
                      │
     ┌────────────┬────────────┬────────────┐
     ▼            ▼            ▼            ▼
Technical     Founder      Market       Risk
 Partner       Partner      Partner     Partner
     └────────────┴────────────┴────────────┘
                      │
                      ▼
             Managing Partner
                      │
                      ▼
         Investment Memo Generator
                      │
                      ▼
          Dashboard & Evidence UI
```

---

# 13. UI Pages

## Landing Page

- Hero Section
- Founder Search
- Product Overview

---

## Research Page

Shows live progress

- Searching...
- Collecting...
- Reasoning...
- Building Memory...

---

## Founder Dashboard

Displays

- Founder Profile
- Timeline
- Founder Score
- GitHub
- Projects
- Skills

---

## Investment Committee

Animated AI cards

Shows every AI partner reasoning independently.

---

## Investment Memo

Full investor report

Download as PDF

---

# 14. Demo Flow

## Step 1

Search a founder.

Example

```
Elon Musk
```

(or any well-documented public founder)

---

## Step 2

Display live AI research.

```
Searching GitHub...

Searching Articles...

Building Founder Memory...

Generating Investment Analysis...
```

---

## Step 3

Show AI committee discussion.

- Technical Partner
- Founder Partner
- Market Partner
- Risk Partner

---

## Step 4

Reveal recommendation.

```
INVEST

Confidence: 92%
```

---

## Step 5

Open Investment Memo.

---

## Step 6

Click evidence.

Display:

- Source
- Supporting Data
- Confidence

---

# 15. Development Plan

## Phase 1 — Project Setup (1 Hour)

- Initialize frontend
- Initialize backend
- Configure OpenAI
- Configure Tavily
- Create project structure

---

## Phase 2 — Intelligence Pipeline (3 Hours)

- Founder Search
- Data Collection
- Founder Profile Generation
- Memory Builder

---

## Phase 3 — AI Committee (2 Hours)

- Technical Agent
- Founder Agent
- Market Agent
- Risk Agent
- Managing Partner

---

## Sleep (4–5 Hours)

---

## Phase 4 — Dashboard (3 Hours)

- Founder Dashboard
- Radar Chart
- Timeline
- Evidence Panel
- Animations

---

## Phase 5 — Polish (3 Hours)

- PDF Export
- Error Handling
- Responsive Design
- Deployment
- Demo Recording

---

# 16. Stretch Goals

If time permits:

- ElevenLabs voice narration
- Downloadable investment memo
- Founder comparison
- Founder timeline visualization
- Persistent founder watchlist
- Semantic founder search
- AI chat with investment memo

---

# 17. MVP Scope

## Must Have

- Founder Search
- AI Research
- Founder Memory
- Multi-Agent Analysis
- Founder Score
- Investment Memo
- Evidence Layer
- Clean Dashboard

## Nice to Have

- Voice Narration
- PDF Export
- Founder Comparison
- Watchlist
- Analytics

---

# 18. Future Scope

- Portfolio Management
- Startup Discovery Feed
- CRM Integration
- Investor Collaboration
- Continuous Founder Tracking
- Funding Prediction
- Deal Flow Automation
- Personalized Investment Preferences

---

# Final Product Statement

**VC Brain transforms early-stage venture investing from manual research into an autonomous, explainable, AI-driven due diligence workflow. By combining public data retrieval, structured founder memory, multi-agent reasoning, and evidence-backed investment recommendations, it enables investors to discover exceptional founders faster while maintaining complete transparency and trust in every decision.**