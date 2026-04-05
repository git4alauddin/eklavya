import { useMemo, useState } from "react";
import { subtopicPacks } from "../data/subtopics";
import { graphData } from "../graphData";

type SubtopicReviewStatus = "pending" | "approved" | "rejected";

const getKey = (topicId: string, subtopicId: string) => `${topicId}::${subtopicId}`;

export function SubtopicReviewPage() {
  const initialStatusMap = useMemo(() => {
    const entries: Array<[string, SubtopicReviewStatus]> = [];

    for (const pack of subtopicPacks) {
      for (const subtopic of pack.subtopics) {
        entries.push([
          getKey(pack.topicId, subtopic.id),
          pack.reviewStatus === "approved" ? "approved" : "pending",
        ]);
      }
    }

    return Object.fromEntries(entries) as Record<string, SubtopicReviewStatus>;
  }, []);

  const [statusMap, setStatusMap] = useState<Record<string, SubtopicReviewStatus>>(initialStatusMap);

  const reviewedPacks = subtopicPacks.map((pack) => {
    const topic = graphData.topics.find((item) => item.id === pack.topicId);
    const counts = pack.subtopics.reduce(
      (acc, subtopic) => {
        const status = statusMap[getKey(pack.topicId, subtopic.id)] ?? "pending";
        if (status === "approved") acc.approved += 1;
        if (status === "rejected") acc.rejected += 1;
        if (status === "pending") acc.pending += 1;
        return acc;
      },
      { approved: 0, rejected: 0, pending: 0 },
    );

    return { pack, topic, counts };
  });

  const totalSubtopics = reviewedPacks.reduce((sum, item) => sum + item.pack.subtopics.length, 0);

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Subtopic Approval Review</h2>
          <span className="resultCount">{reviewedPacks.length} Packs</span>
          <span className="resultCount">{totalSubtopics} Subtopics</span>
        </div>
      </div>
      <p className="muted">Review each subtopic and approve/reject individually before release.</p>

      <div className="sectionDivider" />

      <div className="reviewGrid">
        {reviewedPacks.map(({ pack, topic, counts }) => (
          <article className="reviewCard" key={pack.topicId}>
            <div className="reviewSection reviewSectionTop">
              <div className="reviewHead">
                <div>
                  <h3>{topic?.title ?? pack.topicId}</h3>
                  <p className="muted">
                    {topic?.gradeBand ?? "Unknown grade"} | {topic?.mathTopic ?? "Unknown topic"}
                  </p>
                </div>
                <button className="smallBtn reviewOpenBtn" type="button">Suggest me</button>
              </div>

              <p className="muted">Subtopics: {pack.subtopics.length} | Version: {pack.version}</p>

              <div className="chipWrap">
                <span className="reviewStatus approved">Approved {counts.approved}</span>
                <span className="reviewStatus rejected">Rejected {counts.rejected}</span>
                <span className="reviewStatus pending">Pending {counts.pending}</span>
              </div>
            </div>

            <div className="reviewDivider" />

            <div className="reviewSection reviewSectionMid">
              <div className="reviewSubtopicList">
                {pack.subtopics.map((subtopic) => {
                  const key = getKey(pack.topicId, subtopic.id);
                  const status = statusMap[key] ?? "pending";

                  return (
                    <div className="reviewSubtopicRow" key={subtopic.id}>
                      <span className={`chip chipSoft reviewSubtopicChip reviewSubtopicChip${status.charAt(0).toUpperCase() + status.slice(1)}`}>
                        <span className={`reviewSubtopicMark reviewSubtopicMark${status.charAt(0).toUpperCase() + status.slice(1)}`} aria-hidden="true">
                          {status === "approved" ? "\u2713" : status === "rejected" ? "\u2715" : "\u2022"}
                        </span>
                        {subtopic.name}
                      </span>
                      <div className="reviewSubtopicActions">
                        <button
                          className={`smallBtn reviewActionBtn reviewActionApprove ${status === "approved" ? "isActiveApprove" : ""}`}
                          onClick={() =>
                            setStatusMap((prev) => ({
                              ...prev,
                              [key]: "approved",
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
                              [key]: "rejected",
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
                              [key]: "pending",
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
                <button className="smallBtn reviewConfirmBtn" type="button">Update</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}








