import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { learningQuests } from "../data/contents";
import { subtopicPacks } from "../data/sub-topics";
import { graphData } from "../graphData";
import {
  clearPracticeCache,
  getPracticePipelinePreference,
  getPracticeQuestions,
  type PracticePipeline,
  type PracticeServedBy,
} from "../services/practiceService";
import type { PracticeDifficulty } from "../types";

const resolveApiBase = (): string => {
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "https:" : "http:";
    const host = window.location.hostname || "localhost";
    return `${proto}//${host}:3001`;
  }

  return "http://localhost:3001";
};

const resolveLearningGenerateEndpoint = (): string => `${resolveApiBase()}/api/learning/generate`;
const resolveLearningManualIngestEndpoint = (): string => `${resolveApiBase()}/api/learning/manual-ingest`;

const toSubjectBadge = (subject: string): string => (subject === "math" ? "MATHS" : subject.toUpperCase());

const toPipelineLabel = (pipeline: PracticePipeline): string => {
  if (pipeline === "local-cache") return "LOCAL CACHE";
  if (pipeline === "llm-fast") return "LLM FAST";
  if (pipeline === "llm-quality") return "LLM QUALITY";
  return "OPENROUTER";
};

const toServedByLabel = (servedBy: PracticeServedBy): string => {
  if (servedBy === "local") return "LOCAL";
  if (servedBy === "cache") return "CACHE";
  if (servedBy === "ollama") return "OLLAMA";
  return "OPENROUTER";
};

export function DevelopedCardDetailPage() {
  const { topicId = "" } = useParams();
  const topic = graphData.topics.find((item) => item.id === topicId);
  const quest = learningQuests.find((item) => item.topicId === topicId);
  const subtopicPack = subtopicPacks.find((pack) => pack.topicId === topicId);

  const [learningRefreshLoading, setLearningRefreshLoading] = useState(false);
  const [learningRefreshMessage, setLearningRefreshMessage] = useState<string>("");
  const [practiceRefreshLoading, setPracticeRefreshLoading] = useState(false);
  const [practiceRefreshMessage, setPracticeRefreshMessage] = useState<string>("");

  const nextUnlockTopicIds = useMemo(() => {
    if (quest?.nextUnlockTopicIds && quest.nextUnlockTopicIds.length > 0) {
      return quest.nextUnlockTopicIds;
    }

    const out = graphData.edges
      .filter((edge) => edge.from === topicId)
      .map((edge) => edge.to)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    return out;
  }, [quest?.nextUnlockTopicIds, topicId]);

  const runLearningPipeline = async () => {
    if (!topic) return;

    setLearningRefreshLoading(true);
    setLearningRefreshMessage("");

    try {
      const generateResponse = await fetch(resolveLearningGenerateEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: topic.subject,
          topicId: topic.id,
          topicTitle: topic.title,
          mathTopic: topic.mathTopic,
          gradeBand: topic.gradeBand,
          description: topic.description,
          nextUnlockTopicIds,
        }),
      });

      if (!generateResponse.ok) {
        const err = (await generateResponse.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(err.message ?? err.error ?? `Learning generate failed: ${generateResponse.status}`);
      }

      const generated = (await generateResponse.json()) as { quest?: unknown };
      if (!generated.quest) {
        throw new Error("Learning generate returned no quest payload");
      }

      const ingestResponse = await fetch(resolveLearningManualIngestEndpoint(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: topic.subject,
          topicId: topic.id,
          fileName: `${topic.id}Quest`,
          exportName: `quest_${topic.id}`,
          quest: generated.quest,
        }),
      });

      if (!ingestResponse.ok) {
        const err = (await ingestResponse.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(err.message ?? err.error ?? `Learning ingest failed: ${ingestResponse.status}`);
      }

      setLearningRefreshMessage("Learning quest refreshed. Reloading view...");
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error while refreshing learning quest";
      setLearningRefreshMessage(message);
    } finally {
      setLearningRefreshLoading(false);
    }
  };

  const runPracticePipeline = async (difficulty: PracticeDifficulty) => {
    if (!topic) return;

    const activePipeline = getPracticePipelinePreference();
    setPracticeRefreshLoading(true);
    setPracticeRefreshMessage("");

    try {
      clearPracticeCache(topic.id);

      if (activePipeline === "local-cache") {
        setPracticeRefreshMessage(`${difficulty.toUpperCase()}: local cache mode active. Cleared topic cache.`);
        return;
      }

      const session = await getPracticeQuestions({
        topicId: topic.id,
        difficulty,
        learnerId: `manual-refresh-${Date.now()}`,
        targetCount: 6,
      });

      setPracticeRefreshMessage(
        `${difficulty.toUpperCase()} refreshed via ${toPipelineLabel(activePipeline)} (${toServedByLabel(session.servedBy)}).`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error while refreshing practice";
      setPracticeRefreshMessage(message);
    } finally {
      setPracticeRefreshLoading(false);
    }
  };

  if (!topic) {
    return (
      <section className="panel">
        <h2>Developed Card</h2>
        <p className="emptyState">No developed card details are available for this topic yet.</p>
        <div className="plannerMeta">
          <Link className="smallBtn" to="/developed-cards">
            Back To Developed Cards
          </Link>
        </div>
      </section>
    );
  }

  const checkpoint = quest?.steps.find((step) => step.id === quest.masteryCheckpointStepId);
  const subjectLabel = toSubjectBadge(topic.subject);

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>{topic.title}</h2>
          <span className="subjectBadge">{subjectLabel}</span>
          <span className="resultCount">{topic.gradeBand}</span>
        </div>
      </div>
      <p className="muted">{topic.mathTopic}</p>
      <div className="sectionDivider" />

      <div className="developedSplit">
        <article className="plannerViz">
          <h3>Learning</h3>
          <p className="muted">{quest?.hook ?? "No quest file yet for this topic."}</p>
          <div className="learningGoalsWrap">
            {(subtopicPack?.subtopics ?? []).map((subtopic, idx) => (
              <span className="learningGoalTag" key={subtopic.id}>
                {idx + 1}. {subtopic.name}
              </span>
            ))}
            {!subtopicPack ? <span className="learningGoalTag">Subtopics not authored yet.</span> : null}
          </div>
          <div className="plannerMeta learningActionRow">
            {quest ? (
              <Link className="actionBtn actionBtnPrimary" to={`/quest/${topicId}`}>
                Start Learning
              </Link>
            ) : (
              <span className="resultCount">Quest not available yet</span>
            )}
            <button className="smallBtn subjectSwitchBtnBlue" disabled={learningRefreshLoading} onClick={runLearningPipeline} type="button">
              {learningRefreshLoading ? "Refreshing..." : "Refresh Learning"}
            </button>
          </div>
          {learningRefreshMessage ? <p className="muted">{learningRefreshMessage}</p> : null}
        </article>

        <article className="plannerViz">
          <h3>Practicing</h3>
          <p className="muted">{checkpoint?.prompt ?? "Practice with checkpoint-style quick questions."}</p>
          <p className="questHint">Choose difficulty to enter the matching practice section.</p>
          <div className="plannerMeta learningActionRow">
            <Link className="actionBtn actionBtnEasy" to={`/quest/${topicId}?mode=practice&level=easy`}>
              Easy
            </Link>
            <Link className="actionBtn actionBtnMedium" to={`/quest/${topicId}?mode=practice&level=medium`}>
              Medium
            </Link>
            <Link className="actionBtn actionBtnHard" to={`/quest/${topicId}?mode=practice&level=hard`}>
              Hard
            </Link>
          </div>
          <div className="plannerMeta learningActionRow">
            <button
              className="smallBtn subjectSwitchBtnBlue"
              disabled={practiceRefreshLoading}
              onClick={() => runPracticePipeline("easy")}
              type="button"
            >
              {practiceRefreshLoading ? "Refreshing..." : "Refresh Easy"}
            </button>
            <button
              className="smallBtn subjectSwitchBtnBlue"
              disabled={practiceRefreshLoading}
              onClick={() => runPracticePipeline("medium")}
              type="button"
            >
              {practiceRefreshLoading ? "Refreshing..." : "Refresh Medium"}
            </button>
            <button
              className="smallBtn subjectSwitchBtnBlue"
              disabled={practiceRefreshLoading}
              onClick={() => runPracticePipeline("hard")}
              type="button"
            >
              {practiceRefreshLoading ? "Refreshing..." : "Refresh Hard"}
            </button>
          </div>
          {practiceRefreshMessage ? <p className="muted">{practiceRefreshMessage}</p> : null}
        </article>
      </div>
    </section>
  );
}
