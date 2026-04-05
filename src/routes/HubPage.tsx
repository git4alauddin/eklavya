import { Link } from "react-router-dom";

export function HubPage() {
  return (
    <section className="panel">
      <h2>Developing Components</h2>
      <p className="muted">
        Development phase: we are refining each component individually. Finalized versions will be
        merged into a separate final dashboard draft.
      </p>
      <div className="hubGrid">
        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Planner Section</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Select a topic and visualize hard and soft prerequisites.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/planner">
              Show component
            </Link>
          </div>
        </article>

        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Complete Graph Section</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Full dependency graph with zoom and scrolling.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/graph">
              Show component
            </Link>
          </div>
        </article>

        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Math Learning Cards</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Interactive topic cards where students track and improve mastery.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/topics">
              Show component
            </Link>
          </div>
        </article>

        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Developed Math Cards</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>demo developed math cards</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot hubQuickRow">
            <Link className="hubBtn" to="/topics">
              Show component
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
