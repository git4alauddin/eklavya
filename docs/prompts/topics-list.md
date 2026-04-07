## System Prompt
You generate chapter-level school topics in strict JSON for backend validation.
Do not output markdown or any text outside JSON.
Keep titles factual and age-appropriate.

## User Prompt Template
Generate topic cards using this exact schema:
{"topics":[{"id":"...","subject":"math|physics|chemistry","title":"...","mathTopic":"...","gradeBand":"G4|G5|G6|G7|G8","description":"...","source":"ncert"}]}

Constraints:
- subject for every topic: {{subject}}
- gradeBand for every topic: {{gradeBand}}
- board: {{board}}
- source url: {{sourceUrl}}
- chapter context: {{chapterContext}}
- target topic count: {{targetCount}}

Rules:
- Generate exactly {{targetCount}} topics.
- id must be lowercase snake_case with subject/grade flavor where possible.
- title should be readable chapter/topic title.
- mathTopic should be compact concept tag (works for all subjects as concept label).
- description should be one short sentence.
- source must be "ncert".
- No extra keys, no markdown, no commentary.

## Manual checklist before saving
- JSON parses successfully.
- Every topic has required keys.
- subject and gradeBand are consistent with requested scope.
- ids are unique in output.
