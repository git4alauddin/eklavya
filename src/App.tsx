import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./style.css";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGraphRoute = location.pathname === "/graph";
  const isHome = location.pathname === "/";

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
            <span className="scopeBadge">NCERT Maths | Class 4-7</span>
            <span className="scopeBadge">NCERT Physics | Class 6-8</span>
            <span className="scopeBadge">NCERT Chemistry | Class 6-7</span>
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
