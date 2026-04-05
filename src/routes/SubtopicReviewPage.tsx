import { useMemo, useState } from "react";
import { subtopicPacks } from "../data/sub-topics";
import { graphData } from "../graphData";

type SubtopicReviewStatus = "pending" | "approved" | "rejected";

type ReviewedTopic = {
  topicId: string;
  title: string;
  mathTopic: string;
  gradeBand: string;
  subtopics: (typeof subtopicPacks)[number]["subtopics"];
};

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
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string | null>(null);

  const reviewedTopics = useMemo<ReviewedTopic[]>(() => {
    return subtopicPacks
      .map((pack) => {
        const topic = graphData.topics.find((item) => item.id === pack.topicId);
        if (!topic) return null;
        return {
          topicId: pack.topicId,
          title: topic.title,
          mathTopic: topic.mathTopic,
          gradeBand: topic.gradeBand,
          subtopics: pack.subtopics,
        };
      })
      .filter(Boolean) as ReviewedTopic[];
  }, []);

  const gradeCards = useMemo(() => {
    const gradeMap = new Map<string, ReviewedTopic[]>();

    for (const topic of reviewedTopics) {
      const existing = gradeMap.get(topic.gradeBand) ?? [];
      existing.push(topic);
      gradeMap.set(topic.gradeBand, existing);
    }

    return Array.from(gradeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([gradeBand, topics]) => ({
        gradeBand,
        topics: topics.sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [reviewedTopics]);

  const topicsForSelectedGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return gradeCards.find((item) => item.gradeBand === selectedGrade)?.topics ?? [];
  }, [gradeCards, selectedGrade]);

  const selectedTopic = useMemo(
    () => topicsForSelectedGrade.find((topic) => topic.topicId === selectedTopicId) ?? null,
    [topicsForSelectedGrade, selectedTopicId],
  );

  const selectedSubtopic = useMemo(
    () => selectedTopic?.subtopics.find((subtopic) => subtopic.id === selectedSubtopicId) ?? null,
    [selectedSubtopicId, selectedTopic],
  );

  const topicStatusCounts = useMemo(() => {
    if (!selectedTopic) {
      return { approved: 0, rejected: 0, pending: 0 };
    }

    return selectedTopic.subtopics.reduce(
      (acc, subtopic) => {
        const status = statusMap[getKey(selectedTopic.topicId, subtopic.id)] ?? "pending";
        if (status === "approved") acc.approved += 1;
        if (status === "rejected") acc.rejected += 1;
        if (status === "pending") acc.pending += 1;
        return acc;
      },
      { approved: 0, rejected: 0, pending: 0 },
    );
  }, [selectedTopic, statusMap]);

  const selectedSubtopicStatus = selectedTopic && selectedSubtopic
    ? statusMap[getKey(selectedTopic.topicId, selectedSubtopic.id)] ?? "pending"
    : "pending";

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Subtopic Approval Review</h2>
          <span className="resultCount">{subtopicPacks.length} Packs</span>
        </div>
      </div>
      <p className="muted">Grade first, then topic, then approve subtopics for that topic.</p>

      <div className="sectionDivider" />

      {!selectedGrade ? (
        <div className="approvalSelectGrid">
          {gradeCards.map(({ gradeBand, topics }) => (
            <article className="approvalSelectCard" key={gradeBand}>
              <h3>{gradeBand}</h3>
              <p className="muted">Topics: {topics.length}</p>
              <div className="chipWrap approvalGradeChips">
                <button
                  type="button"
                  className="chip chipSoft approvalGradeChipBtn"
                  onClick={() => setSelectedGrade(gradeBand)}
                >
                  Open {gradeBand}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : !selectedTopic ? (
        <>
          <div className="plannerMeta">
            <button
              className="smallBtn"
              type="button"
              onClick={() => {
                setSelectedGrade(null);
                setSelectedTopicId(null);
                setSelectedSubtopicId(null);
              }}
            >
              Back To Grades
            </button>
            <span className="resultCount">{selectedGrade}</span>
          </div>

          <div className="reviewGrid reviewGridTopicApproval">
            <article className="reviewCard">
              <div className="reviewSection reviewSectionTop">
                <h3>{selectedGrade} Topics</h3>
                <p className="muted">Choose a topic to review subtopics.</p>
              </div>

              <div className="reviewDivider" />

              <div className="reviewSection reviewSectionMid">
                <div className="chipWrap topicApprovalTopicWrap">
                  {topicsForSelectedGrade.map((topic, idx) => (
                    <button
                      key={topic.topicId}
                      type="button"
                      className="chip chipSoft reviewSubtopicChip topicApprovalTopicChip"
                      onClick={() => {
                        setSelectedTopicId(topic.topicId);
                        setSelectedSubtopicId(null);
                      }}
                    >
                      {idx + 1}. {topic.title} | {topic.mathTopic}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </>
      ) : (
        <>
          <div className="plannerMeta">
            <button
              className="smallBtn"
              type="button"
              onClick={() => {
                setSelectedTopicId(null);
                setSelectedSubtopicId(null);
              }}
            >
              Back To Topics
            </button>
            <button
              className="smallBtn"
              type="button"
              onClick={() => {
                setSelectedGrade(null);
                setSelectedTopicId(null);
                setSelectedSubtopicId(null);
              }}
            >
              Back To Grades
            </button>
            <span className="resultCount">{selectedGrade}</span>
            <span className="resultCount">{selectedTopic.title}</span>
          </div>

          <div className="reviewGrid reviewGridTopicApproval">
            <article className="reviewCard" key={selectedTopic.topicId}>
              <div className="reviewSection reviewSectionTop">
                <div className="reviewHead">
                  <div>
                    <h3>{selectedTopic.title}</h3>
                    <p className="muted">Subtopics: {selectedTopic.subtopics.length}</p>
                  </div>
                  <div className="chipWrap">
                    <span className="reviewStatus approved">Approved {topicStatusCounts.approved}</span>
                    <span className="reviewStatus rejected">Rejected {topicStatusCounts.rejected}</span>
                    <span className="reviewStatus pending">Pending {topicStatusCounts.pending}</span>
                  </div>
                </div>
              </div>

              <div className="reviewDivider" />

              <div className="reviewSection reviewSectionMid">
                <div className="chipWrap topicApprovalTopicWrap">
                  {selectedTopic.subtopics.map((subtopic, idx) => (
                    <button
                      key={subtopic.id}
                      type="button"
                      className={`chip chipSoft reviewSubtopicChip topicApprovalTopicChip ${selectedSubtopicId === subtopic.id ? "active" : ""}`}
                      onClick={() => setSelectedSubtopicId(subtopic.id)}
                    >
                      {idx + 1}. {subtopic.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSubtopic ? (
                <>
                  <div className="reviewDivider" />
                  <div className="reviewSection reviewSectionFoot">
                    <h3 className="topicApprovalDetailTitle">{selectedSubtopic.name}</h3>
                    <p className="muted">{selectedSubtopic.learningGoal}</p>
                    <div className="plannerMeta topicApprovalActionRow">
                      <button
                        className={`smallBtn reviewActionBtn reviewActionApprove ${selectedSubtopicStatus === "approved" ? "isActiveApprove" : ""}`}
                        type="button"
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [getKey(selectedTopic.topicId, selectedSubtopic.id)]: "approved",
                          }))
                        }
                      >
                        Approve
                      </button>
                      <button
                        className={`smallBtn reviewActionBtn reviewActionReject ${selectedSubtopicStatus === "rejected" ? "isActiveReject" : ""}`}
                        type="button"
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [getKey(selectedTopic.topicId, selectedSubtopic.id)]: "rejected",
                          }))
                        }
                      >
                        Reject
                      </button>
                      <button
                        className={`smallBtn reviewActionBtn reviewActionPending ${selectedSubtopicStatus === "pending" ? "isActivePending" : ""}`}
                        type="button"
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [getKey(selectedTopic.topicId, selectedSubtopic.id)]: "pending",
                          }))
                        }
                      >
                        Pending
                      </button>
                      <span className="topicApprovalActionSpacer" />
                      <button className="smallBtn reviewOpenBtn" type="button">
                        Suggest me
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </article>
          </div>
        </>
      )}
    </section>
  );
}
