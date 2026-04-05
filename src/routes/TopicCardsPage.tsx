import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { learningQuests } from "../data/contents";
import { subjectLabels, supportedSubjects } from "../data/subjects";
import { graphData, starterMastery } from "../graphData";
import type { LearnerMastery, Subject } from "../types";

export function TopicCardsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mastery, setMastery] = useState<LearnerMastery>(starterMastery);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(6);
  const cardGridRef = useRef<HTMLDivElement | null>(null);

  const questTopicIds = useMemo(
    () => new Set(learningQuests.map((quest) => quest.topicId)),
    [],
  );

  useEffect(() => {
    const param = searchParams.get("subject");
    const isValidSubject = supportedSubjects.includes(param as Subject);
    setSelectedSubject(isValidSubject ? (param as Subject) : null);
  }, [searchParams]);

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();

    const scopedTopics = selectedSubject
      ? graphData.topics.filter((topic) => topic.subject === selectedSubject)
      : graphData.topics;

    if (!q) {
      return scopedTopics;
    }

    return scopedTopics.filter((topic) => {
      const hay = `${topic.mathTopic} ${topic.title} ${topic.description} ${topic.gradeBand}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search, selectedSubject]);

  const totalInScope = useMemo(
    () =>
      selectedSubject
        ? graphData.topics.filter((topic) => topic.subject === selectedSubject).length
        : graphData.topics.length,
    [selectedSubject],
  );

  const setTopicMastery = (topicId: string, value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setMastery((prev) => ({ ...prev, [topicId]: clamped }));
  };

  useEffect(() => {
    const grid = cardGridRef.current;
    if (!grid) return;

    const updateCardsPerPage = () => {
      const styles = window.getComputedStyle(grid);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "12") || 12;
      const minCardWidth = 230;
      const columns = Math.max(1, Math.floor((grid.clientWidth + gap) / (minCardWidth + gap)));
      setCardsPerPage(columns * 2);
    };

    updateCardsPerPage();
    const observer = new ResizeObserver(updateCardsPerPage);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedSubject]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / cardsPerPage));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pagedTopics = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return filteredTopics.slice(start, start + cardsPerPage);
  }, [filteredTopics, currentPage, cardsPerPage]);

  const updateSubjectFilter = (subject: Subject | null) => {
    setSelectedSubject(subject);
    const nextParams = new URLSearchParams(searchParams);
    if (subject) {
      nextParams.set("subject", subject);
    } else {
      nextParams.delete("subject");
    }
    setSearchParams(nextParams);
  };

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Learning Cards</h2>
          <span className="resultCount">Total: {totalInScope}</span>
        </div>
        <div className="sectionHeadRight">
          <div className="subjectSwitchRow">
            {(["all", ...supportedSubjects] as const).map((subject) => (
              <button
                key={subject}
                type="button"
                className={`smallBtn subjectSwitchBtn compact ${subject !== "all" ? "subjectSwitchBtnBlue" : ""} ${selectedSubject === subject ? "active" : ""}`}
                onClick={() => updateSubjectFilter(subject === "all" ? null : (subject as Subject))}
              >
                {subject === "all" ? "ALL" : subjectLabels[subject]}
              </button>
            ))}
          </div>
          <span className="pageStatus">Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      <div className="searchRow">
        <input
          className="searchInput"
          type="text"
          placeholder="Search topics, grade band, or concept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="smallBtn"
          onClick={() => {
            setSearch("");
            updateSubjectFilter(null);
          }}
        >
          Clear
        </button>
      </div>
      <div className="sectionDivider" />
      <div className="cardGrid" ref={cardGridRef}>
        {pagedTopics.map((topic) => {
          const value = mastery[topic.id] ?? 0;
          const masteryLabel = value >= 0.75 ? "Strong" : value >= 0.45 ? "Developing" : "Needs Work";
          const hasQuest = questTopicIds.has(topic.id);
          return (
            <article
              className={hasQuest ? "card cardQuest" : "card"}
              key={topic.id}
              role={hasQuest ? "button" : undefined}
              tabIndex={hasQuest ? 0 : undefined}
              onClick={() => {
                if (hasQuest) {
                  navigate(`/quest/${topic.id}`);
                }
              }}
              onKeyDown={(e) => {
                if (!hasQuest) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/quest/${topic.id}`);
                }
              }}
            >
              <div className="cardTopicScopeRow">
                <div className="cardTopicScopeBadge">{topic.mathTopic}</div>
                <span className="subjectBadge">{topic.subject === "math" ? "MATHS" : topic.subject.toUpperCase()}</span>
                <span className="gradeBadge">{topic.gradeBand}</span>
              </div>
              <div className="cardDivider" />
              <div className="cardSection sectionTitle">
                <div className="cardTitleRow">
                  <h3>{topic.title}</h3>
                  {hasQuest ? <span className="masteryBadge">Quest</span> : null}
                </div>
              </div>
              <div className="cardDivider" />
              <div className="cardSection sectionDesc">
                <p className="muted truncatedDesc" title={topic.description}>
                  {topic.description}
                </p>
              </div>
              <div className="cardDivider" />
              <div className="cardSection sectionMastery" onClick={(e) => e.stopPropagation()}>
                <div className="masteryRow">
                  <label className="masteryLabel" htmlFor={`slider-${topic.id}`}>
                    Mastery
                  </label>
                  <div className="masteryMeta">
                    <span className="percentBadge">{Math.round(value * 100)}%</span>
                    <span className="masteryBadge">{masteryLabel}</span>
                  </div>
                </div>
                <input
                  id={`slider-${topic.id}`}
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(value * 100)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setTopicMastery(topic.id, Number(e.target.value) / 100)}
                />
              </div>
            </article>
          );
        })}
      </div>
      {totalPages > 1 ? (
        <div className="paginationRow">
          <button type="button" className="smallBtn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <span className="paginationMeta">
            Page {currentPage} of {totalPages}
          </span>
          <button type="button" className="smallBtn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}

