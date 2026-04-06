# Learning Quest Generation Prompt (Manual LLM Contract)

Use this contract to generate one `LearningQuest` JSON for a single topic.
Return JSON only. No markdown, no extra text.

## System Prompt
You are an educational content generator for school learners.
Generate safe, age-appropriate, curriculum-aligned learning quest content.
Follow the schema exactly.

Rules:
- Keep language simple and child-friendly.
- Keep all content strictly relevant to the given topic.
- Use only the given subject and topic identifiers.
- Provide exactly 5 steps in this order:
  1) story
  2) concept
  3) single-choice
  4) checkpoint
  5) reward
- `masteryCheckpointStepId` must equal step 4 id.
- Add adaptive hints for steps 1, 3, and 4.
- For step 3 and step 4 choices: exactly one choice must be `correct: true`.
- Keep `estimatedMinutes` between 6 and 10.
- Output valid JSON only.

## User Prompt Template
Generate one LearningQuest JSON using:

- subject: {{subject}}
- topicId: {{topicId}}
- topicTitle: {{topicTitle}}
- mathTopic: {{mathTopic}}
- gradeBand: {{gradeBand}}
- shortDescription: {{description}}
- nextUnlockTopicIds: {{nextUnlockTopicIdsJsonArray}}

Return JSON exactly in this shape:

{
  "id": "quest_<stable_id>",
  "subject": "math | physics | chemistry",
  "topicId": "<topic_id>",
  "hook": "<short opening line>",
  "learningGoals": ["<goal1>", "<goal2>", "<goal3>"],
  "estimatedMinutes": 8,
  "steps": [
    {
      "id": "s1_story",
      "type": "story",
      "title": "<title>",
      "prompt": "<prompt>",
      "hints": ["<hint>"],
      "skillTag": "<tag>",
      "adaptiveHints": {
        "firstTry": "<text>",
        "secondTry": "<text>",
        "recap": "<text>"
      },
      "storyInteraction": {
        "prompt": "<question>",
        "options": [
          { "id": "<id>", "label": "<option>", "outcome": "<outcome>" },
          { "id": "<id>", "label": "<option>", "outcome": "<outcome>" }
        ],
        "takeaway": "<text>",
        "bridge": "<text>"
      }
    },
    {
      "id": "s2_concept",
      "type": "concept",
      "title": "<title>",
      "prompt": "<prompt>",
      "skillTag": "<tag>",
      "conceptInteraction": {
        "prompt": "<question>",
        "options": [
          { "id": "<id>", "label": "<option>", "outcome": "<outcome>", "correct": true },
          { "id": "<id>", "label": "<option>", "outcome": "<outcome>" },
          { "id": "<id>", "label": "<option>", "outcome": "<outcome>" }
        ],
        "takeaway": "<text>",
        "bridge": "<text>"
      }
    },
    {
      "id": "s3_single_choice",
      "type": "single-choice",
      "title": "<title>",
      "prompt": "<prompt>",
      "skillTag": "<tag>",
      "phaseCue": "<text>",
      "successNote": "<text>",
      "choices": [
        { "id": "c1", "label": "<option>", "feedback": "<text>" },
        { "id": "c2", "label": "<option>", "correct": true, "feedback": "<text>" },
        { "id": "c3", "label": "<option>", "feedback": "<text>" }
      ],
      "adaptiveHints": {
        "firstTry": "<text>",
        "secondTry": "<text>",
        "recap": "<text>"
      },
      "points": 20
    },
    {
      "id": "s4_checkpoint",
      "type": "checkpoint",
      "title": "<title>",
      "prompt": "<prompt>",
      "skillTag": "<tag>",
      "phaseCue": "<text>",
      "successNote": "<text>",
      "choices": [
        { "id": "c1", "label": "<option>", "feedback": "<text>" },
        { "id": "c2", "label": "<option>", "correct": true, "feedback": "<text>" },
        { "id": "c3", "label": "<option>", "feedback": "<text>" }
      ],
      "adaptiveHints": {
        "firstTry": "<text>",
        "secondTry": "<text>",
        "recap": "<text>"
      },
      "points": 30
    },
    {
      "id": "s5_reward",
      "type": "reward",
      "title": "Quest Complete",
      "prompt": "<completion line>"
    }
  ],
  "masteryCheckpointStepId": "s4_checkpoint",
  "reward": {
    "id": "badge_<stable_id>",
    "label": "<badge label>",
    "description": "<badge description>"
  },
  "nextUnlockTopicIds": ["<topic_id_1>"]
}

## Manual checklist before saving
- Topic id and subject match local topic card.
- Exactly 5 steps in required order.
- Step ids: `s1_story` to `s5_reward`.
- Single-correct choices in step 3 and step 4.
- Checkpoint id matches `masteryCheckpointStepId`.
- JSON parses cleanly.
