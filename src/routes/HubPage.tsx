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
            <h3>Planner</h3>
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
            <h3>Graph</h3>
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
            <h3>Learning Cards</h3>
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
            <h3>Developed Cards</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>demo developed math cards</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot hubQuickRow">
            <Link className="hubBtn" to="/developed-cards">
              Show component
            </Link>
          </div>
        </article>

        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Human Review</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Human-in-the-loop review for subtopics, approvals, and final updates.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/human-review">Show component</Link>
          </div>
        </article>
      </div>
    </section>
  );
}



