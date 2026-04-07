import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { learningQuests } from "../data/contents";
import { graphData } from "../graphData";
import { getPracticeQuestions, type PracticeServedBy } from "../services/practiceService";
import { topicSnapshots } from "../data/snapshots";
import type { ContentStep, PracticeDifficulty, PracticeQuestion, StepChoice } from "../types";

type CheckResult = {
  checked: boolean;
  correct: boolean;
  earned: number;
  feedback: string;
};

type LoadingInsight = {
  kind: "FACT" | "THINK" | "AVOID";
  text: string;
};

const getStepPoints = (step: ContentStep): number => step.points ?? 10;

const evaluateStep = (step: ContentStep, selectedChoiceIds: string[]): CheckResult => {
  const choices = step.choices ?? [];
  if (choices.length === 0) {
    return { checked: true, correct: true, earned: 0, feedback: "Great, move ahead." };
  }

  const selected = new Set(selectedChoiceIds);
  const correctChoices = choices.filter((choice) => choice.correct).map((choice) => choice.id);
  const correctSet = new Set(correctChoices);

  let correct = false;
  if (step.type === "single-choice" || step.type === "checkpoint") {
    correct =
      selectedChoiceIds.length === 1 &&
      correctChoices.length === 1 &&
      selectedChoiceIds[0] === correctChoices[0];
  } else {
    correct = selected.size === correctSet.size && [...correctSet].every((choiceId) => selected.has(choiceId));
  }

  const pickedChoices: StepChoice[] = choices.filter((choice) => selected.has(choice.id));
  const firstPickedFeedback = pickedChoices.find((choice) => choice.feedback)?.feedback;
  const correctFeedback = choices.find((choice) => choice.correct)?.feedback;
  const feedback = correct
    ? correctFeedback ?? "Correct. Great work."
    : firstPickedFeedback ?? "Not quite. Try once more with the hint.";

  return {
    checked: true,
    correct,
    earned: correct ? getStepPoints(step) : 0,
    feedback,
  };
};

const getAdaptiveStepHelp = (step: ContentStep, attempts: number): string => {
  if (attempts <= 0) return "";

  if (attempts === 1) {
    return step.adaptiveHints?.firstTry ?? step.hints?.[0] ?? "First count total equal parts, then match the asked part.";
  }

  if (attempts === 2) {
    return step.adaptiveHints?.secondTry ?? "Think in two moves: (1) count total equal parts, (2) count selected or shaded parts.";
  }

  return step.adaptiveHints?.recap ?? `Quick recap: ${step.prompt}`;
};
const normalizeDifficulty = (value: string | null): PracticeDifficulty => {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return "easy";
};

const getQuestionPoints = (difficulty: PracticeDifficulty): number => {
  if (difficulty === "hard") return 20;
  if (difficulty === "medium") return 15;
  return 10;
};

const getDemoLocalMinLoadingMs = (): number => {
  const raw = Number(import.meta.env.VITE_DEMO_LOCAL_LOADING_MS ?? 2200);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.floor(raw);
};

const getLoadingFactRotateMs = (): number => {
  const raw = Number(import.meta.env.VITE_LOADING_FACT_ROTATE_MS ?? 2200);
  if (!Number.isFinite(raw) || raw < 300) return 2200;
  return Math.floor(raw);
};

const getNextPracticeDifficulty = (difficulty: PracticeDifficulty): PracticeDifficulty | null => {
  if (difficulty === "easy") return "medium";
  if (difficulty === "medium") return "hard";
  return null;
};

const getDifficultyBadgeClass = (difficulty: PracticeDifficulty): string => {
  if (difficulty === "easy") return "difficultyEasy";
  if (difficulty === "medium") return "difficultyMedium";
  return "difficultyHard";
};

const getCorrectAnswerText = (question: PracticeQuestion): string => {
  if (question.type === "short") {
    return question.correctText?.trim() || "-";
  }

  const correctIds = new Set(question.correctOptionIds ?? []);
  const labels = (question.options ?? [])
    .filter((option) => correctIds.has(option.id))
    .map((option) => option.text.trim())
    .filter(Boolean);

  return labels.length > 0 ? labels.join(", ") : "-";
};

const evaluatePracticeQuestion = (
  question: PracticeQuestion,
  selectedChoiceIds: string[],
  shortAnswer: string,
): CheckResult => {
  if (question.type === "short") {
    const expected = (question.correctText ?? "").trim().toLowerCase();
    const actual = shortAnswer.trim().toLowerCase();
    const correct = expected.length > 0 && actual === expected;
    return {
      checked: true,
      correct,
      earned: correct ? getQuestionPoints(question.difficulty) : 0,
      feedback: correct ? "Correct. Great work." : question.explanation,
    };
  }

  const selected = new Set(selectedChoiceIds);
  const correctIds = question.correctOptionIds ?? [];
  const correctSet = new Set(correctIds);

  const correct =
    question.type === "single-choice"
      ? selectedChoiceIds.length === 1 && correctIds.length === 1 && selectedChoiceIds[0] === correctIds[0]
      : selected.size === correctSet.size && [...correctSet].every((id) => selected.has(id));

  return {
    checked: true,
    correct,
    earned: correct ? getQuestionPoints(question.difficulty) : 0,
    feedback: correct ? "Correct. Great work." : question.explanation,
  };
};

const practiceWarmupBullets: Record<PracticeDifficulty, string[]> = {
  easy: [
    "Build confidence with direct and foundational questions.",
    "Focus on core patterns and clean basic reasoning.",
    "Great for warming up before timed attempts.",
  ],
  medium: [
    "Mix of concept checks and small application twists.",
    "You may need one extra reasoning step before answering.",
    "Best level to improve consistency and accuracy.",
  ],
  hard: [
    "Multi-step reasoning with fewer obvious clues.",
    "Requires precision and careful elimination.",
    "Designed to stretch mastery under challenge.",
  ],
};

export function QuestPage() {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode");
  const practiceMode = mode === "practice";
  const practiceDifficulty = normalizeDifficulty(searchParams.get("level"));
  const practicePreferredSkillTags = useMemo(() => {
    const raw = searchParams.get("skills");
    if (!raw) return [];
    return raw
      .split(",")
      .map((item) => decodeURIComponent(item.trim()))
      .filter(Boolean);
  }, [searchParams]);

  const loadingInsights = useMemo<LoadingInsight[]>(() => {
    const snapshot = topicSnapshots.find((item) => item.topicId === topicId);

    const facts = (snapshot?.keyFacts ?? practiceWarmupBullets[practiceDifficulty])
      .filter((item) => item.trim())
      .map((text) => ({ kind: "FACT" as const, text }));

    const remembers = (snapshot?.revisePrompts ?? [])
      .filter((item) => item.trim())
      .map((text) => ({ kind: "THINK" as const, text }));

    const avoids = (snapshot?.commonMistakes ?? [])
      .filter((item) => item.trim())
      .map((text) => ({ kind: "AVOID" as const, text }));

    const combined = [...facts, ...remembers, ...avoids];
    if (combined.length === 0) {
      return [{ kind: "FACT", text: "Preparing your practice set..." }];
    }

    // Randomize order per load so the experience feels dynamic.
    const shuffled = [...combined].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [topicId, practiceDifficulty]);



  const quest = useMemo(() => learningQuests.find((item) => item.topicId === topicId), [topicId]);

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedByStep, setSelectedByStep] = useState<Record<string, string[]>>({});
  const [resultsByStep, setResultsByStep] = useState<Record<string, CheckResult>>({});
  const [attemptsByStep, setAttemptsByStep] = useState<Record<string, number>>({});
  const [checkedSelectionsByStep, setCheckedSelectionsByStep] = useState<Record<string, string[]>>({});
  const [storyChoiceByStep, setStoryChoiceByStep] = useState<Record<string, string>>({});
  const [conceptChoiceByStep, setConceptChoiceByStep] = useState<Record<string, string>>({});

  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string>("");
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, string[]>>({});
  const [answerByQuestion, setAnswerByQuestion] = useState<Record<string, string>>({});
  const [resultsByQuestion, setResultsByQuestion] = useState<Record<string, CheckResult>>({});
  const [practiceReloadKey, setPracticeReloadKey] = useState(0);
  const [loadingFactIndex, setLoadingFactIndex] = useState(0);
  const [loadedPracticeDifficulty, setLoadedPracticeDifficulty] = useState<PracticeDifficulty | null>(null);
  const [practiceServedBy, setPracticeServedBy] = useState<PracticeServedBy>("local");
  const [practiceRequestedAt, setPracticeRequestedAt] = useState<string>("");
  const [practiceContentGeneratedAt, setPracticeContentGeneratedAt] = useState<string>("");
  const [practiceLatencyMs, setPracticeLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    if (!quest || practiceMode) return;
    setStepIndex(0);
    setSelectedByStep({});
    setResultsByStep({});
    setAttemptsByStep({});
    setCheckedSelectionsByStep({});
    setStoryChoiceByStep({});
    setConceptChoiceByStep({});
  }, [quest, practiceMode]);

  useEffect(() => {
    if (!practiceMode || !topicId) return;

    let cancelled = false;

    const load = async () => {
      setPracticeLoading(true);
      setPracticeError("");
      setLoadedPracticeDifficulty(null);
      setPracticeQuestions([]);
      setPracticeIndex(0);
      setSelectedByQuestion({});
      setAnswerByQuestion({});
      setResultsByQuestion({});
      setPracticeServedBy("local");
      setPracticeRequestedAt("");
      setPracticeContentGeneratedAt("");
      setPracticeLatencyMs(null);
      try {
        const loadStartedAt = Date.now();
        const session = await getPracticeQuestions({
          topicId,
          difficulty: practiceDifficulty,
          targetCount: 6,
          preferredSkillTags: practicePreferredSkillTags,
        });

        if (cancelled) return;

        const isLocalBackedSource =
          session.source === "local-only" ||
          session.source === "local+cache" ||
          session.source === "cache-only";

        if (isLocalBackedSource) {
          const minMs = getDemoLocalMinLoadingMs();
          const elapsed = Date.now() - loadStartedAt;
          const waitMs = Math.max(0, minMs - elapsed);
          if (waitMs > 0) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, waitMs));
            if (cancelled) return;
          }
        }

        setPracticeQuestions(session.questions);
        setPracticeIndex(0);
        setSelectedByQuestion({});
        setAnswerByQuestion({});
        setResultsByQuestion({});
        setLoadedPracticeDifficulty(practiceDifficulty);
        setPracticeServedBy(session.servedBy);
        setPracticeRequestedAt(session.requestedAt);
        setPracticeContentGeneratedAt(session.contentGeneratedAt ?? "");
        setPracticeLatencyMs(typeof session.latencyMs === "number" ? session.latencyMs : null);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load practice questions.";
        setPracticeError(message);
      } finally {
        if (!cancelled) {
          setPracticeLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [practiceMode, topicId, practiceDifficulty, practiceReloadKey, practicePreferredSkillTags]);

  useEffect(() => {
    if (!practiceMode || !practiceLoading) return;
    setLoadingFactIndex(0);
    if (loadingInsights.length <= 1) return;
    const timer = window.setInterval(() => {
      setLoadingFactIndex((prev) => (prev + 1) % loadingInsights.length);
    }, getLoadingFactRotateMs());
    return () => window.clearInterval(timer);
  }, [practiceMode, practiceLoading, loadingInsights]);

  useEffect(() => {
    if (!practiceMode || practiceLoading || practiceError) return;
    if (loadedPracticeDifficulty !== practiceDifficulty) return;
    if (practiceQuestions.length === 0) return;

    const answeredCount = Object.keys(resultsByQuestion).length;
    if (answeredCount !== practiceQuestions.length) return;

    const totalEarnedNow = Object.values(resultsByQuestion).reduce((sum, item) => sum + item.earned, 0);
    const totalPossibleNow = practiceQuestions.reduce((sum, item) => sum + getQuestionPoints(item.difficulty), 0);
    if (totalPossibleNow <= 0 || totalEarnedNow !== totalPossibleNow) return;

    const nextDifficulty = getNextPracticeDifficulty(practiceDifficulty);
    if (!nextDifficulty) return;

    // Perfect-score progression: auto-move to the next level.
    const timer = window.setTimeout(() => {
      const skillsParam =
        practicePreferredSkillTags.length > 0
          ? `&skills=${practicePreferredSkillTags.map((item) => encodeURIComponent(item)).join(",")}`
          : "";
      navigate(`?mode=practice&level=${nextDifficulty}${skillsParam}`, { replace: true });
    }, 900);

    return () => window.clearTimeout(timer);
  }, [
    practiceMode,
    practiceLoading,
    practiceError,
    practiceQuestions,
    resultsByQuestion,
    practiceDifficulty,
    loadedPracticeDifficulty,
    navigate,
  ]);

  if (practiceMode) {
    const topic = graphData.topics.find((item) => item.id === topicId);

    if (!topic) {
      return (
        <section className="panel">
          <h2>Practice Mode</h2>
          <p className="emptyState">Unknown topic. Please go back and choose a valid learning card.</p>
          <div className="plannerMeta">
            <Link className="smallBtn" to="/topics">
              Back To Topics
            </Link>
          </div>
        </section>
      );
    }

    if (practiceLoading) {
      const activeInsight = loadingInsights[loadingFactIndex] ?? { kind: "FACT", text: "Preparing your practice set..." };
      return (
        <section className="panel">
          <article className="questCard practiceWarmupCard">
            <div className="practiceWarmupList">
              <p key={`${activeInsight.kind}:${activeInsight.text}`}><span className="practiceInsightTag">{activeInsight.kind}</span> {activeInsight.text}</p>
            </div>
          </article>
        </section>
      );
    }

    if (practiceError) {
      return (
        <section className="panel">
          <h2>Practice Mode</h2>
          <p className="emptyState">{practiceError}</p>
          <div className="plannerMeta">
            <button
              type="button"
              className="smallBtn"
              onClick={() => {
                setPracticeReloadKey((k) => k + 1);
              }}
            >
              Retry
            </button>
            <Link className="smallBtn" to="/topics">
              Back To Topics
            </Link>
          </div>
        </section>
      );
    }

    if (practiceQuestions.length === 0) {
      return (
        <section className="panel">
          <h2>Practice Mode</h2>
          <p className="emptyState">No practice pack is available for this topic yet.</p>
          <div className="plannerMeta">
            <Link className="smallBtn" to="/topics">
              Back To Topics
            </Link>
          </div>
        </section>
      );
    }

    const question = practiceQuestions[practiceIndex];
    const selectedChoices = selectedByQuestion[question.id] ?? [];
    const shortAnswer = answerByQuestion[question.id] ?? "";

    const totalEarned = Object.values(resultsByQuestion).reduce((sum, item) => sum + item.earned, 0);
    const totalPossible = practiceQuestions.reduce((sum, item) => sum + getQuestionPoints(item.difficulty), 0);

    const canSubmitPractice =
      question.type === "short" ? shortAnswer.trim().length > 0 : selectedChoices.length > 0;

    const commitPracticeResult = (evaluated: CheckResult): void => {
      setResultsByQuestion((prev) => ({ ...prev, [question.id]: evaluated }));
      setPracticeIndex((idx) => Math.min(practiceQuestions.length - 1, idx + 1));
    };

    const answeredProgress = practiceQuestions
      .map((item, index) => {
        const row = resultsByQuestion[item.id];
        if (!row) return null;
        return { index, question: item, result: row };
      })
      .filter(
        (item): item is { index: number; question: PracticeQuestion; result: CheckResult } => item !== null,
      );

    const isPracticeComplete = answeredProgress.length === practiceQuestions.length;

    const practiceSourceLabel: Record<PracticeServedBy, string> = {
      local: "LOCAL FILE",
      cache: "BROWSER CACHE",
      ollama: "OLLAMA",
      openrouter: "OPENROUTER",
    };

    const formattedRequestedAt = practiceRequestedAt
      ? new Date(practiceRequestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "";
    const formattedContentAt = practiceContentGeneratedAt
      ? new Date(practiceContentGeneratedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "";

    return (
      <section className="panel">
        <div className="sectionHead practiceHead">
          <div className="sectionTitleWithBadge">
            <h2>Practice Mode</h2>
            <span className={`resultCount ${getDifficultyBadgeClass(practiceDifficulty)}`}>{practiceDifficulty.toUpperCase()}</span>
          </div>
          <p className="practiceTopicInline">{topic.title} | {topic.mathTopic}</p>
          <span className="pageStatus">
            Q {practiceIndex + 1}/{practiceQuestions.length}
          </span>
        </div>

        <article className="questCard">
          <div className="questionTopRow">
            <h3>{question.prompt}</h3>
            <span className="questionSourceBadge">{practiceSourceLabel[practiceServedBy]}</span>
            {(formattedContentAt || formattedRequestedAt) ? (
              <span className="practiceFetchMeta">{`${formattedContentAt || formattedRequestedAt}${practiceLatencyMs !== null ? ` | ${practiceLatencyMs} ms` : ""}`}</span>
            ) : null}
          </div>
          <p className="muted">Skill: {question.skillTag}</p>

          {question.type === "short" ? (
            <input
              className="topicSearch"
              placeholder="Type your answer"
              value={shortAnswer}
              onChange={(event) => {
                const value = event.target.value;
                setAnswerByQuestion((prev) => ({ ...prev, [question.id]: value }));
              }}
            />
          ) : (
            <div className="questChoiceGrid">
              {question.options?.map((option) => {
                const selected = selectedChoices.includes(option.id);
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={selected ? "questChoice selected" : "questChoice"}
                    onClick={() => {
                      if (question.type === "single-choice") {
                        setSelectedByQuestion((prev) => ({ ...prev, [question.id]: [option.id] }));
                        return;
                      }

                      setSelectedByQuestion((prev) => {
                        const curr = prev[question.id] ?? [];
                        const next = curr.includes(option.id)
                          ? curr.filter((id) => id !== option.id)
                          : [...curr, option.id];
                        return { ...prev, [question.id]: next };
                      });
                    }}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
          )}

          {!isPracticeComplete ? (
            <div className="plannerMeta practiceSubmitRow">
              <button
                type="button"
                className="smallBtn"
                onClick={() => {
                  if (!canSubmitPractice) return;
                  const evaluated =
                    question.type === "short"
                      ? evaluatePracticeQuestion(question, [], shortAnswer)
                      : evaluatePracticeQuestion(question, selectedChoices, shortAnswer);
                  commitPracticeResult(evaluated);
                }}
                disabled={!canSubmitPractice}
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="practiceLiveResult">
              <div className="practiceScoreWrap">
                <span className={totalEarned === totalPossible ? "practiceScoreBadge perfect" : "practiceScoreBadge notPerfect"}>
                  Score: {totalEarned}/{totalPossible}
                </span>
              </div>
              {totalEarned === totalPossible ? (
                <p className="muted">Perfect score unlocked. Moving to next level...</p>
              ) : null}
              <div className="plannerMeta practiceResultActions">
                <Link className="smallBtn practiceResultBtn" to="/topics">
                  Back To Topics
                </Link>
                <Link className="smallBtn practiceResultBtn" to="/planner">
                  Back To Planner
                </Link>
              </div>
            </div>
          )}
        </article>

        <article className="plannerViz practiceLiveViz">
          <h3>Live Progress</h3>
          {answeredProgress.length === 0 ? (
            <p className="muted">Answer a question to see live progress updates here.</p>
          ) : (
            <div className="practiceLiveList">
              {answeredProgress.map((item) => (
                <p key={item.index} className={item.result.correct ? "practiceLiveItem ok" : "practiceLiveItem block"}>
                  {`Q${item.index + 1}: `}
                  {item.result.correct ? (
                    <span>[correct]</span>
                  ) : (
                    <>
                      <span className="practiceAnswerText">[{getCorrectAnswerText(item.question)}]</span>
                      {`. ${item.question.explanation}`}
                    </>
                  )}
                </p>
              ))}
            </div>
          )}
</article>
      </section>
    );
  }

  if (!quest) {
    return (
      <section className="panel">
        <h2>Quest Player</h2>
        <p className="emptyState">No quest pack is available for this topic yet.</p>
        <div className="plannerMeta">
          <Link className="smallBtn" to="/planner">
            Back To Planner
          </Link>
          <Link className="smallBtn" to="/topics">
            View Topics
          </Link>
        </div>
      </section>
    );
  }

  const step = quest.steps[stepIndex];
  const selectedChoices = selectedByStep[step.id] ?? [];
  const stepResult = resultsByStep[step.id];
  const hasChoices = (step.choices?.length ?? 0) > 0;
  const isChoiceStep =
    step.type === "single-choice" || step.type === "multi-choice" || step.type === "checkpoint";
  const stepAttempts = attemptsByStep[step.id] ?? 0;
  const adaptiveStepHelp = getAdaptiveStepHelp(step, stepAttempts);
  const showHintBadge = stepAttempts === 1;
  const checkedChoices = checkedSelectionsByStep[step.id] ?? [];
  const feedbackLockedToCurrentSelection =
    checkedChoices.length > 0 &&
    checkedChoices.length === selectedChoices.length &&
    checkedChoices.every((id) => selectedChoices.includes(id));
  const storyChoiceId = storyChoiceByStep[step.id] ?? "";
  const storySelectedOption =
    step.type === "story"
      ? step.storyInteraction?.options.find((option) => option.id === storyChoiceId)
      : undefined;
  const conceptChoiceId = conceptChoiceByStep[step.id] ?? "";
  const conceptSelectedOption =
    step.type === "concept"
      ? step.conceptInteraction?.options.find((option) => option.id === conceptChoiceId)
      : undefined;
  const canGoNext = isChoiceStep
    ? Boolean(stepResult?.correct)
    : step.type === "concept"
      ? Boolean(conceptSelectedOption)
      : step.type === "story"
        ? Boolean(storySelectedOption)
        : true;

  const totalEarned = Object.values(resultsByStep).reduce((sum, row) => sum + row.earned, 0);
  const totalPossible = quest.steps
    .filter((item) => (item.choices?.length ?? 0) > 0)
    .reduce((sum, item) => sum + getStepPoints(item), 0);

  const nextUnlockTitles = quest.nextUnlockTopicIds
    .map((id) => graphData.topics.find((topic) => topic.id === id)?.title)
    .filter(Boolean);

  const weakSkillTags = Array.from(
    new Set(
      quest.steps
        .filter((item) => {
          if (!item.skillTag) return false;
          const attempts = attemptsByStep[item.id] ?? 0;
          const result = resultsByStep[item.id];
          return attempts > 0 || result?.correct === false;
        })
        .map((item) => item.skillTag as string),
    ),
  );

  const isFinalStep = stepIndex === quest.steps.length - 1;

  const practiceStartLink =
    weakSkillTags.length > 0
      ? `/quest/${quest.topicId}?mode=practice&level=easy&skills=${weakSkillTags.map((item) => encodeURIComponent(item)).join(",")}`
      : `/quest/${quest.topicId}?mode=practice&level=easy`;

  const questTopic = graphData.topics.find((item) => item.id === quest.topicId);
  const learningSubjectLabel = questTopic?.subject === "math" ? "MATHS" : (questTopic?.subject?.toUpperCase() ?? "SUBJECT");
  const learningSourceLabel = "LOCAL FILE";

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Quest Player</h2>
          <span className="subjectBadge">{learningSubjectLabel}</span>
          <span className="resultCount">{quest.estimatedMinutes} min</span>
        </div>
        <div className="sectionHeadRight">
          <span className="questionSourceBadge">{learningSourceLabel}</span>
          <span className="pageStatus">
            Step {stepIndex + 1}/{quest.steps.length}
          </span>
        </div>
      </div>

      <article className={step.type === "story" ? "questCard storyStepCard" : step.type === "concept" ? "questCard conceptStepCard" : step.type === "checkpoint" ? "questCard checkpointStepCard" : "questCard"}>
        <h3>{step.title}</h3>

        {isFinalStep ? <p className="questCompleteSummary">{step.prompt}</p> : null}
        {isFinalStep ? <div className="questCompleteDivider" /> : null}

        {isFinalStep ? (
          <div className="questInlineResult">
            <h4>Quest Result</h4>
            <p className="questScoreLine">Score: {totalEarned}/{totalPossible}</p>
            <p className="muted">
              Reward unlocked: <strong>{quest.reward.label}</strong> - {quest.reward.description}
            </p>
            {nextUnlockTitles.length > 0 ? (
              <p className="questUnlockLine">Next unlock topics: {nextUnlockTitles.join(", ")}</p>
            ) : null}
            <div className="plannerMeta">
              <Link className="smallBtn" to={practiceStartLink}>
                Start Practice
              </Link>
              <Link className="smallBtn" to="/topics">
                Back To Topics
              </Link>
              <Link className="smallBtn" to="/planner">
                Back To Planner
              </Link>
            </div>
          </div>
        ) : null}

        {step.type === "story" ? (
          <div className="storyNarrative">
            <p className="storySectionLabel">STORY SETUP</p>
            <p className="storyNarrativeText">{step.prompt}</p>
          </div>
        ) : !isFinalStep ? (
          <p className="muted">{step.prompt}</p>
        ) : null}

        {step.type === "story" && step.hints && step.hints.length > 0 ? (
          <p className="storyClue">
            <span className="storyClueBadge">CLUE</span>
            {step.hints[0]}
          </p>
        ) : step.hints && step.hints.length > 0 ? (
          <p className="questHint">Hint: {step.hints[0]}</p>
        ) : null}

        {step.type === "checkpoint" && step.phaseCue ? (
          <div className="checkpointCueRow">
            <p className="checkpointLabel">FINAL CHECK</p>
            <p className="checkpointCueInline">{step.phaseCue}</p>
          </div>
        ) : null}

        {step.type === "single-choice" && step.phaseCue ? (
          <p className="phaseCueStrip">{step.phaseCue}</p>
        ) : null}

        {isChoiceStep && !stepResult?.correct && adaptiveStepHelp ? (
          <p className="learningAssist">
            {showHintBadge ? <span className="learningAssistBadge">HINT</span> : null}
            {adaptiveStepHelp}
          </p>
        ) : null}

        {step.type === "story" && step.storyInteraction ? (
          <div className="storyInteraction">
            <p className="storySectionLabel">YOUR CHOICE</p>
            <p className="storyPrompt">{step.storyInteraction.prompt ?? "Pick a path:"}</p>
            <div className="storyOptionRow">
              {step.storyInteraction.options.map((option) => {
                const selected = storyChoiceId === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={selected ? "storyOptionBtn selected" : "storyOptionBtn"}
                    onClick={() => {
                      setStoryChoiceByStep((prev) => ({ ...prev, [step.id]: option.id }));
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {storySelectedOption ? (
              <div className="storyOutcome">
                <p>{storySelectedOption.outcome}</p>
                {step.storyInteraction.takeaway ? <p className="storyTakeaway">{step.storyInteraction.takeaway}</p> : null}
                {step.storyInteraction.bridge ? <p className="storyBridge">{step.storyInteraction.bridge}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {step.type === "concept" && step.conceptInteraction ? (
          <div className="conceptInteraction">
            <p className="conceptPrompt">{step.conceptInteraction.prompt ?? "Try this concept check:"}</p>
            <div className="conceptOptionRow">
              {step.conceptInteraction.options.map((option) => {
                const selected = conceptChoiceId === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={selected ? "conceptOptionBtn selected" : "conceptOptionBtn"}
                    onClick={() => {
                      setConceptChoiceByStep((prev) => ({ ...prev, [step.id]: option.id }));
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {conceptSelectedOption ? (
              <div className="conceptOutcome">
                <p>{conceptSelectedOption.outcome}</p>
                {step.conceptInteraction.takeaway ? <p className="conceptTakeaway">{step.conceptInteraction.takeaway}</p> : null}
                {step.conceptInteraction.bridge ? <p className="conceptBridge">{step.conceptInteraction.bridge}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {hasChoices ? (
          <div className="questChoiceGrid">
            {step.choices?.map((choice) => {
              const selected = selectedChoices.includes(choice.id);
              return (
                <button
                  type="button"
                  key={choice.id}
                  className={selected ? "questChoice selected" : "questChoice"}
                  onClick={() => {
                    if (step.type === "single-choice" || step.type === "checkpoint") {
                      setSelectedByStep((prev) => ({ ...prev, [step.id]: [choice.id] }));
                      return;
                    }
                    setSelectedByStep((prev) => {
                      const curr = prev[step.id] ?? [];
                      const next = curr.includes(choice.id)
                        ? curr.filter((id) => id !== choice.id)
                        : [...curr, choice.id];
                      return { ...prev, [step.id]: next };
                    });
                  }}
                >
                  {choice.label}
                  {stepResult && !stepResult.correct && feedbackLockedToCurrentSelection && selected && choice.feedback ? (
                    <span className="questChoiceInlineFeedback">{choice.feedback}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}


        {isChoiceStep ? (
          <div className="plannerMeta learningCheckRow">
            <button
              type="button"
              className="smallBtn"
              onClick={() => {
                const evaluated = evaluateStep(step, selectedChoices);
                setResultsByStep((prev) => ({ ...prev, [step.id]: evaluated }));
                setCheckedSelectionsByStep((prev) => ({ ...prev, [step.id]: [...selectedChoices] }));
                setAttemptsByStep((prev) => ({
                  ...prev,
                  [step.id]: evaluated.correct ? 0 : (prev[step.id] ?? 0) + 1,
                }));
              }}
              disabled={selectedChoices.length === 0}
            >
              Check Answer
            </button>
          </div>
        ) : null}

        {isChoiceStep && stepResult ? (
          <>
            <p className={stepResult.correct ? "stepCheckFeedback ready" : "stepCheckFeedback blocked"}>
              {stepResult.feedback}
            </p>
            {(step.type === "single-choice" || step.type === "checkpoint") && stepResult.correct && step.successNote ? (
              <p className={step.type === "checkpoint" ? "phaseSuccessNote checkpointSuccessNote" : "phaseSuccessNote"}>{step.successNote}</p>
            ) : null}
          </>
        ) : null}

        {!isFinalStep ? (
          <div className="plannerMeta learningNavRow">
            <button
              type="button"
              className="smallBtn"
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="smallBtn"
              onClick={() => setStepIndex((prev) => Math.min(quest.steps.length - 1, prev + 1))}
              disabled={stepIndex >= quest.steps.length - 1 || !canGoNext}
            >
              Next
            </button>
          </div>
        ) : null}
      </article>
    </section>
  );
}












































