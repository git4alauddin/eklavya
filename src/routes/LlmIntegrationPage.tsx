import { useState } from "react";

type LlmSectionId = "learning" | "practice" | "topics" | "subtopics" | "prerequisites";

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

export function LlmIntegrationPage() {
  const [selectedSection, setSelectedSection] = useState<LlmSectionId | null>(null);

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
        {(Object.keys(sectionMeta) as LlmSectionId[]).map((sectionId) => {
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
                    {isSelected ? "Hide details" : "Open"}
                  </button>
                </div>
              </div>

              {isSelected ? (
                <div className="llmStubDetails">
                  <p className="muted">This section is ready. We will implement this pipeline next.</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
