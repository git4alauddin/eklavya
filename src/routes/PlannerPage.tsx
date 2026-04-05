import { useMemo, useState } from "react";
import { graphData, starterMastery } from "../graphData";
import { getNextSuggestions } from "../graphEngine";
import type { LearnerMastery } from "../types";

const targetLabel = (gradeBand: string, mathTopic: string, title: string) =>
  `[${gradeBand}] ${title} | ${mathTopic}`;

export function PlannerPage() {
  const [targetId, setTargetId] = useState(graphData.topics[0]?.id ?? "");
  const [targetSearch, setTargetSearch] = useState("");
  const [mastery, setMastery] = useState<LearnerMastery>(starterMastery);

  const topicById = useMemo(
    () => new Map(graphData.topics.map((topic) => [topic.id, topic])),
    [],
  );

  const directPrereqs = useMemo(
    () => graphData.edges.filter((edge) => edge.to === targetId),
    [targetId],
  );

  const hard = directPrereqs.filter((edge) => edge.type === "hard");
  const soft = directPrereqs.filter((edge) => edge.type === "soft");
  const recommendations = useMemo(
    () => getNextSuggestions(graphData, mastery, targetId, 3),
    [mastery, targetId],
  );
  const directPrereqIds = useMemo(
    () => [...new Set(directPrereqs.map((edge) => edge.from))],
    [directPrereqs],
  );
  const overallProgress = useMemo(() => {
    const values = directPrereqIds.map((id) => mastery[id] ?? 0);
    if (values.length === 0) {
      return null;
    }
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(avg * 100);
  }, [directPrereqIds, mastery]);

  return (
    <section className="panel">
      <h2>Planner Section</h2>
      <p className="muted">Select a topic, inspect prerequisites, and get recommendations.</p>

      <article className="plannerViz">
        <h3>Target and Prerequisites</h3>
        <div className="plannerTop">
          <input
            className="searchInput"
            list="planner-target-options"
            value={targetSearch}
            onChange={(e) => {
              const nextValue = e.target.value;
              setTargetSearch(nextValue);
              const matched = graphData.topics.find(
                (topic) =>
                  targetLabel(topic.gradeBand, topic.mathTopic, topic.title).toLowerCase() ===
                  nextValue.toLowerCase(),
              );
              if (matched) {
                setTargetId(matched.id);
              }
            }}
            placeholder="Search target topic..."
          />
          <datalist id="planner-target-options">
            {graphData.topics.map((topic) => (
              <option
                key={topic.id}
                value={targetLabel(topic.gradeBand, topic.mathTopic, topic.title)}
              />
            ))}
          </datalist>
        </div>
        <div className="plannerGrid">
          <article className="plannerCard hard">
            <h3>Hard Prerequisites</h3>
            {hard.length > 0 ? (
              <div className="chipWrap">
                {hard.map((edge) => {
                  const t = topicById.get(edge.from);
                  return (
                    <span className="chip chipHard chipWithGrade" key={`${edge.from}-${edge.to}`}>
                      <span>{t?.mathTopic}</span>
                      <span className="chipGrade">{t?.gradeBand}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="emptyState">No hard prerequisite.</p>
            )}
          </article>

          <article className="plannerCard soft">
            <h3>Soft Prerequisites</h3>
            {soft.length > 0 ? (
              <div className="chipWrap">
                {soft.map((edge) => {
                  const t = topicById.get(edge.from);
                  return (
                    <span className="chip chipSoft chipWithGrade" key={`${edge.from}-${edge.to}`}>
                      <span>{t?.mathTopic}</span>
                      <span className="chipGrade">{t?.gradeBand}</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="emptyState">No soft prerequisite.</p>
            )}
          </article>
        </div>
      </article>

      <article className="plannerViz">
        <h3>Current Progress Inputs</h3>
        <div className="plannerMeta">
          <span className="percentBadge">
            Overall progress: {overallProgress === null ? "\u2014" : `${overallProgress}%`}
          </span>
        </div>
        {directPrereqIds.length > 0 ? (
          <div className="plannerSliders">
            {directPrereqIds.map((id) => (
              <div className="plannerSliderRow" key={`m-${id}`}>
                <label htmlFor={`planner-mastery-${id}`}>
                  <span className="topicLabelWithGrade">
                    <span>{topicById.get(id)?.mathTopic}</span>
                    <span className="chipGrade">{topicById.get(id)?.gradeBand}</span>
                  </span>
                </label>
                <div className="plannerSliderControl">
                  <span className="percentBadge">{Math.round((mastery[id] ?? 0) * 100)}%</span>
                  <input
                    id={`planner-mastery-${id}`}
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((mastery[id] ?? 0) * 100)}
                    onChange={(e) =>
                      setMastery((prev) => ({
                        ...prev,
                        [id]: Number(e.target.value) / 100,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="emptyState">No direct prerequisites for this topic, so no progress sliders here.</p>
        )}
      </article>

      <article className="plannerViz">
        <h3>Recommendations</h3>
        {recommendations.length > 0 ? (
          <div className="recommendList">
            {recommendations.map((item, index) => (
              <div className="recommendItem" key={`r-${item.topicId}`}>
                <span className="rankBadge">#{index + 1}</span>
                <span className="plannerNode targetSmall topicLabelWithGrade">
                  <span>{topicById.get(item.topicId)?.mathTopic}</span>
                  <span className="chipGrade">{topicById.get(item.topicId)?.gradeBand}</span>
                </span>
                <span className="plannerArrow">{item.reason}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="emptyState">No recommendation needed for this topic right now.</p>
        )}
      </article>
    </section>
  );
}
