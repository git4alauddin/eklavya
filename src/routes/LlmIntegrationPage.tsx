import { useMemo, useState } from "react";

type LlmSectionId = "learning" | "practice" | "topics" | "subtopics" | "prerequisites";

type FlowCard = {
  id: string;
  title: string;
  brief: string;
};

type TopicScopeState = {
  subject: "math" | "physics" | "chemistry";
  grades: string;
  board: string;
  source: string;
  includeContext: boolean;
};

type TopicScopeResponse = {
  normalizedScope: {
    subject: "math" | "physics" | "chemistry";
    board: string;
    source: string;
    includeChapterContext: boolean;
    gradeBands: string[];
  };
  stats: {
    matchedTopicCount: number;
    sampleCount: number;
  };
  sample: Array<{
    id: string;
    title: string;
    gradeBand: string;
    mathTopic: string;
  }>;
};

const sectionMeta: Record<LlmSectionId, { title: string; brief: string }> = {
  learning: {
    title: "Learning",
    brief: "Quest/story learning flow generation with structured step contract.",
  },
  practice: {
    title: "Practice",
    brief: "Difficulty-wise question generation and validation flow.",
  },
  topics: {
    title: "Topics",
    brief: "Topic list generation and chapter-level mapping updates.",
  },
  subtopics: {
    title: "Subtopics",
    brief: "Subtopic decomposition, sequencing, and review support.",
  },
  prerequisites: {
    title: "Pre-requisites",
    brief: "Dependency/prerequisite graph generation and checks.",
  },
};

const learningFlowCards: FlowCard[] = [
  { id: "payload", title: "Payload Builder", brief: "Prepare subject/topic metadata as structured request input." },
  { id: "prompt-contract", title: "Prompt Contract", brief: "Load and apply the learning prompt template contract." },
  { id: "llm-call", title: "LLM Call", brief: "Send the generated prompt to provider endpoint." },
  { id: "parser-validator", title: "Parser + Validator", brief: "Parse JSON and validate against learning quest schema." },
  { id: "result-preview", title: "Result Preview", brief: "Show generated quest output before ingest/write." },
  { id: "manual-ingest", title: "Manual Ingest", brief: "Pass validated output into local data write flow." },
];

const practiceFlowCards: FlowCard[] = [
  { id: "practice-payload", title: "Payload Builder", brief: "Prepare topic, difficulty, and target count as request payload." },
  { id: "practice-prompt", title: "Prompt Builder", brief: "Build question-generation prompt from practice request fields." },
  { id: "practice-llm-call", title: "LLM Call", brief: "Send prompt to provider and get raw question response." },
  { id: "practice-parse", title: "Parser + Validator", brief: "Parse JSON and validate with practice question schema." },
  { id: "practice-cache", title: "Cache + Fallback", brief: "Store valid output and fall back to local cache if needed." },
  { id: "practice-return", title: "Result Preview", brief: "Return normalized question set to practice UI flow." },
];

const topicsFlowCards: FlowCard[] = [
  { id: "topics-source", title: "Source Scope", brief: "Select syllabus/class scope and source constraints." },
  { id: "topics-extract", title: "Topic Extraction", brief: "Generate chapter-level topic list with ids and labels." },
  { id: "topics-normalize", title: "Normalizer", brief: "Normalize title, grade, subject, and mathTopic fields." },
  { id: "topics-validate", title: "Schema Validator", brief: "Validate `TopicNode` structure and uniqueness constraints." },
  { id: "topics-review", title: "Review + Approval", brief: "Human review/approval before data write to topics files." },
  { id: "topics-write", title: "Write + Index", brief: "Write topic files and update subject topic index." },
];

const subtopicsFlowCards: FlowCard[] = [
  { id: "subtopics-input", title: "Topic Input", brief: "Use approved topic + context as subtopic generation input." },
  { id: "subtopics-generate", title: "Subtopic Generation", brief: "Generate ordered subtopics with dependency links." },
  { id: "subtopics-checkpoints", title: "Checkpoint Builder", brief: "Attach misconceptions/examples/checkpoints per subtopic." },
  { id: "subtopics-validate", title: "Pack Validator", brief: "Validate `TopicSubtopicPack` schema and graph consistency." },
  { id: "subtopics-review", title: "Approval Review", brief: "Approve/reject/pending per subtopic before persistence." },
  { id: "subtopics-write", title: "Write + Index", brief: "Write subtopic pack file and refresh subtopic index." },
];

const prerequisitesFlowCards: FlowCard[] = [
  { id: "prereq-map", title: "Dependency Mapping", brief: "Generate hard/soft prerequisite edges between topics." },
  { id: "prereq-thresholds", title: "Mastery Thresholds", brief: "Set min mastery thresholds for each dependency edge." },
  { id: "prereq-cycle-check", title: "Cycle Check", brief: "Run DAG validation to detect cyclic dependencies." },
  { id: "prereq-toposort", title: "Topological Layers", brief: "Compute roadmap layers from prerequisite graph." },
  { id: "prereq-review", title: "Review + Override", brief: "Human review for edge quality and pedagogic correctness." },
  { id: "prereq-write", title: "Write Graph Data", brief: "Persist edges to subject graph data and reindex." },
];

const flowCardsBySection: Record<LlmSectionId, FlowCard[]> = {
  learning: learningFlowCards,
  practice: practiceFlowCards,
  topics: topicsFlowCards,
  subtopics: subtopicsFlowCards,
  prerequisites: prerequisitesFlowCards,
};

const resolveTopicsScopeEndpoint = (): string =>
  String(import.meta.env.VITE_TOPICS_SCOPE_ENDPOINT ?? "http://localhost:3001/api/topics/source-scope");

export function LlmIntegrationPage() {
  const [selectedSection, setSelectedSection] = useState<LlmSectionId | null>(null);
  const [topicScope, setTopicScope] = useState<TopicScopeState>({
    subject: "math",
    grades: "G4-G7",
    board: "NCERT",
    source: "https://ncert.nic.in/textbook.php",
    includeContext: true,
  });
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [scopeResponse, setScopeResponse] = useState<TopicScopeResponse | null>(null);

  const visibleSections: LlmSectionId[] = selectedSection
    ? [selectedSection]
    : (Object.keys(sectionMeta) as LlmSectionId[]);

  const topicScopePayload = useMemo(
    () => ({
      subject: topicScope.subject,
      grades: topicScope.grades,
      board: topicScope.board,
      source: topicScope.source,
      includeChapterContext: topicScope.includeContext,
    }),
    [topicScope],
  );

  const runTopicScope = async () => {
    setScopeLoading(true);
    setScopeError(null);
    setScopeResponse(null);

    try {
      const endpoint = resolveTopicsScopeEndpoint();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topicScopePayload),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(err.message ?? err.error ?? `Request failed: ${response.status}`);
      }

      const data = (await response.json()) as TopicScopeResponse;
      setScopeResponse(data);
    } catch (error) {
      setScopeError(error instanceof Error ? error.message : "Unknown error while resolving source scope");
    } finally {
      setScopeLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="sectionHead llmHeader">
        <div>
          <h2>LLM Integration</h2>
          <p className="muted">LLM-backed components for dynamic content generation.</p>
        </div>
      </div>

      <div className="sectionDivider" />

      <div className="llmActionGrid">
        {visibleSections.map((sectionId) => {
          const meta = sectionMeta[sectionId];
          const isSelected = selectedSection === sectionId;

          return (
            <article className={`llmActionCard ${isSelected ? "expanded" : ""}`} key={sectionId}>
              <div className="llmActionSection llmActionSectionHead">
                <div className="llmActionHead">
                  <h3>{meta.title}</h3>
                </div>
              </div>

              <div className="llmActionDivider" />

              <div className="llmActionSection llmActionSectionBody">
                <p className="muted">{meta.brief}</p>
              </div>

              <div className="llmActionDivider" />

              <div className="llmActionSection llmActionSectionFoot">
                <div className="llmActionBtns">
                  <button
                    className="smallBtn"
                    onClick={() => setSelectedSection(isSelected ? null : sectionId)}
                    type="button"
                  >
                    {isSelected ? "Back" : "Open"}
                  </button>
                </div>
              </div>

              {isSelected ? (
                <div className="llmStubDetails">
                  {sectionId === "topics" ? (
                    <div className="llmScopePanel">
                      <h4>Source Scope</h4>
                      <p className="muted">Set source boundaries for topic generation.</p>

                      <div className="llmScopeGrid">
                        <label className="llmScopeField">
                          Subject
                          <select
                            value={topicScope.subject}
                            onChange={(event) =>
                              setTopicScope((prev) => ({
                                ...prev,
                                subject: event.target.value as TopicScopeState["subject"],
                              }))
                            }
                          >
                            <option value="math">Math</option>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                          </select>
                        </label>

                        <label className="llmScopeField">
                          Grades
                          <input
                            type="text"
                            value={topicScope.grades}
                            onChange={(event) =>
                              setTopicScope((prev) => ({ ...prev, grades: event.target.value }))
                            }
                          />
                        </label>

                        <label className="llmScopeField">
                          Board
                          <input
                            type="text"
                            value={topicScope.board}
                            onChange={(event) =>
                              setTopicScope((prev) => ({ ...prev, board: event.target.value }))
                            }
                          />
                        </label>

                        <label className="llmScopeField llmScopeFieldWide">
                          Source URL
                          <input
                            type="text"
                            value={topicScope.source}
                            onChange={(event) =>
                              setTopicScope((prev) => ({ ...prev, source: event.target.value }))
                            }
                          />
                        </label>

                        <label className="llmScopeCheck">
                          <input
                            type="checkbox"
                            checked={topicScope.includeContext}
                            onChange={(event) =>
                              setTopicScope((prev) => ({
                                ...prev,
                                includeContext: event.target.checked,
                              }))
                            }
                          />
                          Include chapter context in generation
                        </label>
                      </div>

                      <div className="llmScopeActions">
                        <button className="smallBtn subjectSwitchBtnBlue" disabled={scopeLoading} onClick={runTopicScope} type="button">
                          {scopeLoading ? "Resolving..." : "Run source scope"}
                        </button>
                      </div>

                      {scopeError ? <p className="llmScopeError">{scopeError}</p> : null}

                      <div className="llmScopePreview">
                        <p className="llmBlockLabel">Request Payload</p>
                        <pre>
                          <code>{JSON.stringify(topicScopePayload, null, 2)}</code>
                        </pre>
                      </div>

                      {scopeResponse ? (
                        <>
                          <div className="llmScopePreview">
                            <p className="llmBlockLabel">Normalized Scope</p>
                            <pre>
                              <code>{JSON.stringify(scopeResponse.normalizedScope, null, 2)}</code>
                            </pre>
                          </div>

                          <div className="llmScopeStats">
                            <span className="resultCount">Matched Topics: {scopeResponse.stats.matchedTopicCount}</span>
                            <span className="resultCount">Sample: {scopeResponse.stats.sampleCount}</span>
                          </div>

                          <div className="llmScopePreview">
                            <p className="llmBlockLabel">Sample Topics</p>
                            <pre>
                              <code>{JSON.stringify(scopeResponse.sample, null, 2)}</code>
                            </pre>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="llmFlowGrid">
                    {flowCardsBySection[sectionId].map((card) => (
                      <article className="llmFlowCard" key={card.id}>
                        <h4>{card.title}</h4>
                        <p>{card.brief}</p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
