import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { learningQuests } from "../data/content";
import { graphData, starterMastery } from "../graphData";
import type { LearnerMastery } from "../types";

export function DevelopedCardsPage() {
  const navigate = useNavigate();
  const [mastery, setMastery] = useState<LearnerMastery>(starterMastery);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cardsPerPage, setCardsPerPage] = useState(6);
  const cardGridRef = useRef<HTMLDivElement | null>(null);

  const questTopicIds = useMemo(
    () => new Set(learningQuests.map((quest) => quest.topicId)),
    [],
  );

  const developedTopics = useMemo(
    () => graphData.topics.filter((topic) => questTopicIds.has(topic.id)),
    [questTopicIds],
  );

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return developedTopics;
    }
    return developedTopics.filter((topic) => {
      const hay = `${topic.mathTopic} ${topic.title} ${topic.description} ${topic.gradeBand}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search, developedTopics]);

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
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / cardsPerPage));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const pagedTopics = useMemo(() => {
    const start = (currentPage - 1) * cardsPerPage;
    return filteredTopics.slice(start, start + cardsPerPage);
  }, [filteredTopics, currentPage, cardsPerPage]);

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>Developed Math Cards</h2>
          <span className="resultCount">Total: {developedTopics.length}</span>
        </div>
        <span className="pageStatus">Page {currentPage} of {totalPages}</span>
      </div>
      <div className="searchRow">
        <input
          className="searchInput"
          type="text"
          placeholder="Search topics, grade band, or concept..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="smallBtn" onClick={() => setSearch("")}>
          Clear
        </button>
      </div>
      <div className="sectionDivider" />
      <div className="cardGrid" ref={cardGridRef}>
        {pagedTopics.map((topic) => {
          const value = mastery[topic.id] ?? 0;
          const masteryLabel = value >= 0.75 ? "Strong" : value >= 0.45 ? "Developing" : "Needs Work";
          return (
            <article
              className="card cardQuest"
              key={topic.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/developed-card/${topic.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(`/developed-card/${topic.id}`);
                }
              }}
            >
              <div className="cardTopicScopeRow">
                <div className="cardTopicScopeBadge">{topic.mathTopic}</div>
                <span className="gradeBadge">{topic.gradeBand}</span>
              </div>
              <div className="cardDivider" />
              <div className="cardSection sectionTitle">
                <div className="cardTitleRow">
                  <h3>{topic.title}</h3>
                  <span className="masteryBadge">Quest</span>
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
