import { useMemo, useState } from "react";
import { graphData } from "../graphData";

type TopicReviewStatus = "pending" | "approved" | "rejected";

const statusMark = (status: TopicReviewStatus): string => {
  if (status === "approved") return "\u2713";
  if (status === "rejected") return "\u2715";
  return "\u2022";
};

const toStatusClassSuffix = (status: TopicReviewStatus): "Approved" | "Rejected" | "Pending" => {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
};

export function TopicApprovalPage() {
  const topicsByGrade = useMemo(() => {
    const byGrade = new Map<string, typeof graphData.topics>();

    for (const topic of graphData.topics) {
      const existing = byGrade.get(topic.gradeBand) ?? [];
      existing.push(topic);
      byGrade.set(topic.gradeBand, existing);
    }

    return Array.from(byGrade.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gradeBand, topics]) => ({
        gradeBand,
        topics: [...topics].sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, []);

  const initialStatusMap = useMemo(
    () => Object.fromEntries(graphData.topics.map((topic) => [topic.id, "pending"])) as Record<string, TopicReviewStatus>,
    [],
  );

  const [statusMap, setStatusMap] = useState<Record<string, TopicReviewStatus>>(initialStatusMap);

  const totalTopics = graphData.topics.length;

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Topic Approval</h2>
          <span className="resultCount">{topicsByGrade.length} Grades</span>
          <span className="resultCount">{totalTopics} Topics</span>
        </div>
      </div>
      <p className="muted">Review topic-level structure and finalize approve/reject/pending states.</p>

      <div className="sectionDivider" />

      <div className="reviewGrid">
        {topicsByGrade.map(({ gradeBand, topics }) => {
          const counts = topics.reduce(
            (acc, topic) => {
              const status = statusMap[topic.id] ?? "pending";
              if (status === "approved") acc.approved += 1;
              if (status === "rejected") acc.rejected += 1;
              if (status === "pending") acc.pending += 1;
              return acc;
            },
            { approved: 0, rejected: 0, pending: 0 },
          );

          return (
            <article className="reviewCard" key={gradeBand}>
              <div className="reviewSection reviewSectionTop">
                <div className="reviewHead">
                  <div>
                    <h3>{gradeBand} Topics</h3>
                    <p className="muted">Topic count: {topics.length}</p>
                  </div>
                  <button className="smallBtn reviewOpenBtn" type="button">
                    Suggest me
                  </button>
                </div>

                <div className="chipWrap">
                  <span className="reviewStatus approved">Approved {counts.approved}</span>
                  <span className="reviewStatus rejected">Rejected {counts.rejected}</span>
                  <span className="reviewStatus pending">Pending {counts.pending}</span>
                </div>
              </div>

              <div className="reviewDivider" />

              <div className="reviewSection reviewSectionMid">
                <div className="reviewSubtopicList">
                  {topics.map((topic) => {
                    const status = statusMap[topic.id] ?? "pending";
                    const statusSuffix = toStatusClassSuffix(status);

                    return (
                      <div className="reviewSubtopicRow" key={topic.id}>
                        <span className={`chip chipSoft reviewSubtopicChip reviewSubtopicChip${statusSuffix}`}>
                          <span
                            className={`reviewSubtopicMark reviewSubtopicMark${statusSuffix}`}
                            aria-hidden="true"
                          >
                            {statusMark(status)}
                          </span>
                          {topic.title} | {topic.mathTopic}
                        </span>
                        <div className="reviewSubtopicActions">
                          <button
                            className={`smallBtn reviewActionBtn reviewActionApprove ${status === "approved" ? "isActiveApprove" : ""}`}
                            onClick={() =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [topic.id]: "approved",
                              }))
                            }
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className={`smallBtn reviewActionBtn reviewActionReject ${status === "rejected" ? "isActiveReject" : ""}`}
                            onClick={() =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [topic.id]: "rejected",
                              }))
                            }
                            type="button"
                          >
                            Reject
                          </button>
                          <button
                            className={`smallBtn reviewActionBtn reviewActionPending ${status === "pending" ? "isActivePending" : ""}`}
                            onClick={() =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [topic.id]: "pending",
                              }))
                            }
                            type="button"
                          >
                            Pending
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="reviewDivider" />

              <div className="reviewSection reviewSectionFoot">
                <div className="plannerMeta reviewConfirmRow">
                  <button className="smallBtn reviewConfirmBtn" type="button">
                    Update
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
