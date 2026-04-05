import { useEffect, useMemo, useState } from "react";
import { subjectLabels, supportedSubjects } from "../data/subjects";
import { graphData } from "../graphData";
import type { Subject } from "../types";

type TopicReviewStatus = "pending" | "approved" | "rejected";

export function TopicApprovalPage() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const groupedBySubject = useMemo(() => {
    const bySubject = new Map<Subject, Map<string, typeof graphData.topics>>();

    for (const topic of graphData.topics) {
      const gradeMap = bySubject.get(topic.subject) ?? new Map<string, typeof graphData.topics>();
      const existing = gradeMap.get(topic.gradeBand) ?? [];
      existing.push(topic);
      gradeMap.set(topic.gradeBand, existing);
      bySubject.set(topic.subject, gradeMap);
    }

    return bySubject;
  }, []);

  const totalTopics = graphData.topics.length;

  const subjectCards = useMemo(
    () =>
      supportedSubjects.map((subject) => {
        const gradeMap = groupedBySubject.get(subject) ?? new Map();
        const topicCount = Array.from(gradeMap.values()).reduce((sum, topics) => sum + topics.length, 0);
        const grades = Array.from(gradeMap.keys()).sort((a, b) => a.localeCompare(b));
        return { subject, topicCount, grades };
      }),
    [groupedBySubject],
  );

  const selectedSubjectGrades = useMemo(() => {
    if (!selectedSubject) return [];
    return Array.from(groupedBySubject.get(selectedSubject)?.keys() ?? []).sort((a, b) => a.localeCompare(b));
  }, [groupedBySubject, selectedSubject]);

  const selectedTopics = useMemo(() => {
    if (!selectedSubject || !selectedGrade) return [];
    return (groupedBySubject.get(selectedSubject)?.get(selectedGrade) ?? [])
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [groupedBySubject, selectedSubject, selectedGrade]);

  const [statusMap, setStatusMap] = useState<Record<string, TopicReviewStatus>>({});

  useEffect(() => {
    setSelectedTopicId(null);
  }, [selectedSubject, selectedGrade]);

  const selectedTopic = useMemo(
    () => selectedTopics.find((topic) => topic.id === selectedTopicId) ?? null,
    [selectedTopicId, selectedTopics],
  );

  const selectedTopicStatus = selectedTopic ? statusMap[selectedTopic.id] ?? "pending" : "pending";

  const gradeStatusCounts = useMemo(
    () =>
      selectedTopics.reduce(
        (acc, topic) => {
          const status = statusMap[topic.id] ?? "pending";
          if (status === "approved") acc.approved += 1;
          if (status === "rejected") acc.rejected += 1;
          if (status === "pending") acc.pending += 1;
          return acc;
        },
        { approved: 0, rejected: 0, pending: 0 },
      ),
    [selectedTopics, statusMap],
  );

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Topic Approval</h2>
          <span className="resultCount">{totalTopics} Topics</span>
        </div>
      </div>
      <p className="muted">Choose subject and grade, then review topic list.</p>

      <div className="sectionDivider" />

      {!selectedSubject || !selectedGrade ? (
        <div className="approvalSelectGrid">
          {subjectCards.map((item) => (
            <article className="approvalSelectCard" key={item.subject}>
              <h3>{subjectLabels[item.subject]}</h3>
              <p className="muted">{item.topicCount} topics</p>
              <div className="chipWrap approvalGradeChips">
                {item.grades.length > 0 ? (
                  item.grades.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className="chip chipSoft approvalGradeChipBtn"
                      onClick={() => {
                        setSelectedSubject(item.subject);
                        setSelectedGrade(g);
                      }}
                    >
                      {g}
                    </button>
                  ))
                ) : (
                  <span className="chip chipSoft">No data</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="plannerMeta">
            <button
              className="smallBtn"
              type="button"
              onClick={() => {
                setSelectedSubject(null);
                setSelectedGrade(null);
              }}
            >
              Back To Subjects
            </button>
            <span className="resultCount">{subjectLabels[selectedSubject]}</span>
            {selectedSubjectGrades.map((grade) => (
              <button
                key={grade}
                type="button"
                className={`chip chipSoft approvalGradeSwitchBtn ${selectedGrade === grade ? "active" : ""}`}
                onClick={() => setSelectedGrade(grade)}
              >
                {grade}
              </button>
            ))}
          </div>

          <div className="reviewGrid reviewGridTopicApproval">
            <article className="reviewCard" key={`${selectedSubject}-${selectedGrade}`}>
              <div className="reviewSection reviewSectionTop">
                <div className="reviewHead">
                  <div>
                    <h3>{selectedGrade} Topics</h3>
                    <p className="muted">Topic count: {selectedTopics.length}</p>
                  </div>
                  <div className="chipWrap">
                    <span className="reviewStatus approved">Approved {gradeStatusCounts.approved}</span>
                    <span className="reviewStatus rejected">Rejected {gradeStatusCounts.rejected}</span>
                    <span className="reviewStatus pending">Pending {gradeStatusCounts.pending}</span>
                  </div>
                </div>
              </div>

              <div className="reviewDivider" />

              <div className="reviewSection reviewSectionMid">
                <div className="chipWrap topicApprovalTopicWrap">
                  {selectedTopics.map((topic, idx) => (
                    <button
                      type="button"
                      className={`chip chipSoft reviewSubtopicChip topicApprovalTopicChip ${selectedTopicId === topic.id ? "active" : ""}`}
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      {idx + 1}. {topic.title} | {topic.mathTopic}
                    </button>
                  ))}
                </div>
              </div>

              {selectedTopic ? (
                <>
                  <div className="reviewDivider" />
                  <div className="reviewSection reviewSectionFoot">
                    <h3 className="topicApprovalDetailTitle">{selectedTopic.title}</h3>
                    <p className="muted">{selectedTopic.mathTopic}</p>
                    <div className="plannerMeta topicApprovalActionRow">
                      <button
                        className={`smallBtn reviewActionBtn reviewActionApprove ${selectedTopicStatus === "approved" ? "isActiveApprove" : ""}`}
                        type="button"
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [selectedTopic.id]: "approved",
                          }))
                        }
                      >
                        Approve
                      </button>
                      <button
                        className={`smallBtn reviewActionBtn reviewActionReject ${selectedTopicStatus === "rejected" ? "isActiveReject" : ""}`}
                        type="button"
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [selectedTopic.id]: "rejected",
                          }))
                        }
                      >
                        Reject
                      </button>
                      <button
                        className={`smallBtn reviewActionBtn reviewActionPending ${selectedTopicStatus === "pending" ? "isActivePending" : ""}`}
                        type="button"
                        onClick={() =>
                          setStatusMap((prev) => ({
                            ...prev,
                            [selectedTopic.id]: "pending",
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
