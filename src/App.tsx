import { Link, Outlet, useLocation } from "react-router-dom";
import "./style.css";

function App() {
  const location = useLocation();
  const isGraphRoute = location.pathname === "/graph";

  return (
    <div className={isGraphRoute ? "page pageGraph" : "page"}>
      <div className="topNav">
        <div className="brandMark">Eklavya</div>
        <div className="scopeBadge">NCERT Maths | Class 4-7</div>
        <Link className={location.pathname === "/" ? "homeBtn active" : "homeBtn"} to="/">
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
