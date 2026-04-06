# Decisions Log
Track key product and engineering decisions here so future changes stay consistent.
## Template
### YYYY-MM-DD - <Decision Title>
- Context: 
- Decision: 
- Why: 
- Trade-offs: 
- Follow-ups: 
---
## Entries

### 2026-04-06 - Dynamic Practice Content Sourcing (LLM + Cache)
- Context: Practice questions should feel relatable and adapt to learner progress while keeping the app reliable.
- Decision: Use LLM-generated questions as the primary source in production, with local cache as fallback. During development, local cache can remain primary for stability and speed.
- Why: LLM improves personalization and freshness; cache ensures continuity when API is unavailable/slow.
- Trade-offs: Requires source transparency, quality checks, and fallback handling to avoid inconsistent difficulty/format.
- Follow-ups: Add source metrics, response validation, and progression tuning by difficulty band.
