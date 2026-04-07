import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supportedSubjects, subjectLabels } from "./data/subjects";
import {
  getPracticePipelinePreference,
  setPracticePipelinePreference,
  type PracticePipeline,
} from "./services/practiceService";
import "./style.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGraphRoute = location.pathname === "/graph";
  const isHome = location.pathname === "/";
  const topicSearch = new URLSearchParams(location.search);
  const activeNavSubject = location.pathname === "/topics" ? topicSearch.get("subject") : null;
  const [pipeline, setPipeline] = useState<PracticePipeline>(() => getPracticePipelinePreference());

  useEffect(() => {
    setPipeline(getPracticePipelinePreference());
  }, [location.pathname]);

  const applyPipeline = (next: PracticePipeline) => {
    setPracticePipelinePreference(next);
    setPipeline(next);
  };

  return (
    <div className={isGraphRoute ? "page pageGraph" : "page"}>
      <div className="topNav">
        <div className="topNavLeft">
          <Link className={isHome ? "brandLink active" : "brandLink"} to="/">
            Eklavya
          </Link>
        </div>

        <div className="scopeNav">
          <button
            type="button"
            className="backBadge scopeNavArrow"
            aria-label="Go back"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
                return;
              }
              navigate("/");
            }}
          >
            {"\u2190"}
          </button>

          <div className="scopeBadges">
            {supportedSubjects.map((subject) => (
              <Link
                key={subject}
                className={`scopeBadge scopeBadgeLink ${activeNavSubject === subject ? "active" : ""}`}
                to={`/topics?subject=${subject}`}
                title={subjectLabels[subject]}
              >
                {subjectLabels[subject]}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="backBadge scopeNavArrow"
            aria-label="Go forward"
            onClick={() => window.history.forward()}
          >
            {"\u2192"}
          </button>
        </div>

        <Link className={isHome ? "homeBtn active" : "homeBtn"} to="/">
          Home
        </Link>
      </div>

      <header className="hero">
        <p>Clear paths, interactive practice, and confident mastery in one place.</p>
        {isHome ? (
          <div className="pipelineBadges" aria-label="Practice pipeline selector">
            <button
              type="button"
              className={`pipelineBadge ${pipeline === "local-cache" ? "active" : ""}`}
              onClick={() => applyPipeline("local-cache")}
            >
              Local Cache
            </button>
            <button
              type="button"
              className={`pipelineBadge ${pipeline === "llm-quality" ? "active" : ""}`}
              onClick={() => applyPipeline("llm-quality")}
            >
              LLM Quality
            </button>
            <button
              type="button"
              className={`pipelineBadge ${pipeline === "llm-fast" ? "active" : ""}`}
              onClick={() => applyPipeline("llm-fast")}
            >
              LLM Fast
            </button>
            <button
              type="button"
              className={`pipelineBadge ${pipeline === "openrouter" ? "active" : ""}`}
              onClick={() => applyPipeline("openrouter")}
            >
              OpenRouter
            </button>
          </div>
        ) : null}
      </header>
      <Outlet />
    </div>
  );
}

export default App;
