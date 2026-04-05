import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { learningQuests } from "../data/content";
import { graphData } from "../graphData";
import type { ContentStep, StepChoice } from "../types";

type CheckResult = {
  checked: boolean;
  correct: boolean;
  earned: number;
  feedback: string;
};

const getStepPoints = (step: ContentStep): number => step.points ?? 10;

const evaluateStep = (
  step: ContentStep,
  selectedChoiceIds: string[],
): CheckResult => {
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
    correct =
      selected.size === correctSet.size &&
      [...correctSet].every((choiceId) => selected.has(choiceId));
  }

  const pickedChoices: StepChoice[] = choices.filter((choice) => selected.has(choice.id));
  const feedback = correct
    ? "Correct. Great work."
    : pickedChoices.find((choice) => choice.feedback)?.feedback ??
      "Not quite. Try once more with the hint.";

  return {
    checked: true,
    correct,
    earned: correct ? getStepPoints(step) : 0,
    feedback,
  };
};

export function QuestPage() {
  const { topicId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const practiceMode = mode === "practice";

  const quest = useMemo(
    () => learningQuests.find((item) => item.topicId === topicId),
    [topicId],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedByStep, setSelectedByStep] = useState<Record<string, string[]>>({});
  const [resultsByStep, setResultsByStep] = useState<Record<string, CheckResult>>({});

  useEffect(() => {
    if (!quest) return;
    const checkpointIndex = quest.steps.findIndex(
      (step) => step.id === quest.masteryCheckpointStepId,
    );
    const startIndex = practiceMode && checkpointIndex >= 0 ? checkpointIndex : 0;
    setStepIndex(startIndex);
    setSelectedByStep({});
    setResultsByStep({});
  }, [quest, practiceMode]);

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
    step.type === "single-choice" ||
    step.type === "multi-choice" ||
    step.type === "checkpoint";

  const totalEarned = Object.values(resultsByStep).reduce((sum, result) => sum + result.earned, 0);
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
          <h2>{practiceMode ? "Practice Mode" : "Quest Player"}</h2>
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

        {step.hints && step.hints.length > 0 ? (
          <p className="questHint">Hint: {step.hints[0]}</p>
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
                const result = evaluateStep(step, selectedChoices);
                setResultsByStep((prev) => ({ ...prev, [step.id]: result }));
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

        <div className="paginationRow">
          <button
            type="button"
            className="smallBtn"
            onClick={() => setStepIndex((idx) => Math.max(0, idx - 1))}
            disabled={stepIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="smallBtn"
            onClick={() => setStepIndex((idx) => Math.min(quest.steps.length - 1, idx + 1))}
            disabled={stepIndex === quest.steps.length - 1}
          >
            Next
          </button>
        </div>
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
