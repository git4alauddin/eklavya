import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { learningQuests } from "../data/contents";
import { graphData } from "../graphData";
import { getPracticeQuestions } from "../services/practiceService";
import type { ContentStep, PracticeDifficulty, PracticeQuestion, StepChoice } from "../types";

type CheckResult = {
  checked: boolean;
  correct: boolean;
  earned: number;
  feedback: string;
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
  const feedback = correct
    ? "Correct. Great work."
    : pickedChoices.find((choice) => choice.feedback)?.feedback ?? "Not quite. Try once more with the hint.";

  return {
    checked: true,
    correct,
    earned: correct ? getStepPoints(step) : 0,
    feedback,
  };
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

export function QuestPage() {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const practiceMode = mode === "practice";
  const practiceDifficulty = normalizeDifficulty(searchParams.get("level"));

  const quest = useMemo(() => learningQuests.find((item) => item.topicId === topicId), [topicId]);

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedByStep, setSelectedByStep] = useState<Record<string, string[]>>({});
  const [resultsByStep, setResultsByStep] = useState<Record<string, CheckResult>>({});

  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceError, setPracticeError] = useState<string>("");
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, string[]>>({});
  const [answerByQuestion, setAnswerByQuestion] = useState<Record<string, string>>({});
  const [resultsByQuestion, setResultsByQuestion] = useState<Record<string, CheckResult>>({});

  useEffect(() => {
    if (!quest || practiceMode) return;
    const checkpointIndex = quest.steps.findIndex((step) => step.id === quest.masteryCheckpointStepId);
    setStepIndex(checkpointIndex >= 0 ? checkpointIndex : 0);
    setSelectedByStep({});
    setResultsByStep({});
  }, [quest, practiceMode]);

  useEffect(() => {
    if (!practiceMode || !topicId) return;

    let cancelled = false;

    const load = async () => {
      setPracticeLoading(true);
      setPracticeError("");
      try {
        const session = await getPracticeQuestions({
          topicId,
          difficulty: practiceDifficulty,
          targetCount: 6,
        });

        if (cancelled) return;
        setPracticeQuestions(session.questions);
        setPracticeIndex(0);
        setSelectedByQuestion({});
        setAnswerByQuestion({});
        setResultsByQuestion({});
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
  }, [practiceMode, topicId, practiceDifficulty]);

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
      return (
        <section className="panel">
          <h2>Practice Mode</h2>
          <p className="emptyState">Loading questions...</p>
        </section>
      );
    }

    if (practiceError) {
      return (
        <section className="panel">
          <h2>Practice Mode</h2>
          <p className="emptyState">{practiceError}</p>
          <div className="plannerMeta">
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

    const isLastQuestion = practiceIndex === practiceQuestions.length - 1;
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

    return (
      <section className="panel">
        <div className="sectionHead practiceHead">
          <div className="sectionTitleWithBadge">
            <h2>Practice Mode</h2>
            <span className="resultCount">{practiceDifficulty.toUpperCase()}</span>
          </div>
          <p className="practiceTopicInline">{topic.title} | {topic.mathTopic}</p>
          <span className="pageStatus">
            Q {practiceIndex + 1}/{practiceQuestions.length}
          </span>
        </div>

        <article className="questCard">
          <div className="questionTopRow">
            <h3>{question.prompt}</h3>
            <span className="questionSourceBadge">{question.id.startsWith("llm_") ? "LLM" : "LOCAL CACHE"}</span>
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
                            {isLastQuestion ? (
            <div className="practiceLiveResult">
              <div className="practiceScoreWrap">
                <span className="practiceScoreBadge">Score: {totalEarned}/{totalPossible}</span>
              </div>
              <div className="plannerMeta practiceResultActions">
                <Link className="smallBtn practiceResultBtn" to="/topics">
                  Back To Topics
                </Link>
                <Link className="smallBtn practiceResultBtn" to="/planner">
                  Back To Planner
                </Link>
              </div>
            </div>
          ) : null}
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

  const totalEarned = Object.values(resultsByStep).reduce((sum, row) => sum + row.earned, 0);
  const totalPossible = quest.steps
    .filter((item) => (item.choices?.length ?? 0) > 0)
    .reduce((sum, item) => sum + getStepPoints(item), 0);

  const nextUnlockTitles = quest.nextUnlockTopicIds
    .map((id) => graphData.topics.find((topic) => topic.id === id)?.title)
    .filter(Boolean);

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Quest Player</h2>
          <span className="resultCount">{quest.estimatedMinutes} min</span>
        </div>
        <span className="pageStatus">
          Step {stepIndex + 1}/{quest.steps.length}
        </span>
      </div>

      <article className="questCard">
        <p className="questHook">{quest.hook}</p>
        <h3>{step.title}</h3>
        <p className="muted">{step.prompt}</p>

        {step.hints && step.hints.length > 0 ? <p className="questHint">Hint: {step.hints[0]}</p> : null}

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
                </button>
              );
            })}
          </div>
        ) : null}

        {isChoiceStep ? (
          <div className="plannerMeta">
            <button
              type="button"
              className="smallBtn"
              onClick={() => {
                const evaluated = evaluateStep(step, selectedChoices);
                setResultsByStep((prev) => ({ ...prev, [step.id]: evaluated }));
              }}
              disabled={selectedChoices.length === 0}
            >
              Check Answer
            </button>
            {stepResult ? (
              <span className={stepResult.correct ? "readinessBanner ready" : "readinessBanner blocked"}>
                {stepResult.feedback}
              </span>
            ) : null}
          </div>
        ) : null}
      </article>

      {stepIndex === quest.steps.length - 1 ? (
        <article className="plannerViz">
          <h3>Quest Result</h3>
          <p className="muted">
            Score: {totalEarned}/{totalPossible}
          </p>
          <p className="muted">
            Reward unlocked: <strong>{quest.reward.label}</strong> - {quest.reward.description}
          </p>
          {nextUnlockTitles.length > 0 ? (
            <p className="muted">Next unlock topics: {nextUnlockTitles.join(", ")}</p>
          ) : null}
          <div className="plannerMeta">
            <Link className="smallBtn" to="/planner">
              Back To Planner
            </Link>
            <Link className="smallBtn" to="/topics">
              Back To Topics
            </Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}


















