import { Link } from "react-router-dom";

export function HumanReviewHubPage() {
  return (
    <section className="panel">
      <h2>Human Review</h2>
      <p className="muted">
        Choose the approval workflow you want to review. More approval modules can be added here.
      </p>

      <div className="hubGrid">
        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Topic Approval</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Review topic-level structure and approve final topic definitions.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/human-review/topic-approval">
              Show component
            </Link>
          </div>
        </article>

        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Subtopic Approval</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Review suggested subtopics and finalize approve/reject/pending states.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/human-review/subtopic-approval">
              Show component
            </Link>
          </div>
        </article>

        <article className="hubCard">
          <div className="hubSection hubSectionHead">
            <h3>Prerequisite Approval</h3>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionBody">
            <p>Review prerequisite mapping quality and approve dependency updates.</p>
          </div>
          <div className="hubDivider" />
          <div className="hubSection hubSectionFoot">
            <Link className="hubBtn" to="/human-review/prerequisite-approval">
              Show component
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
