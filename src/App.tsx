import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supportedSubjects, subjectLabels } from "./data/subjects";
import "./style.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGraphRoute = location.pathname === "/graph";
  const isHome = location.pathname === "/";
  const topicSearch = new URLSearchParams(location.search);
  const activeNavSubject = location.pathname === "/topics" ? topicSearch.get("subject") : null;

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
      </header>
      <Outlet />
    </div>
  );
}

export default App;


