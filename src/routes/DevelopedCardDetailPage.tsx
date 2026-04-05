import { Link, useParams } from "react-router-dom";
import { learningQuests } from "../data/contents";
import { subtopicPacks } from "../data/sub-topics";
import { graphData } from "../graphData";

export function DevelopedCardDetailPage() {
  const { topicId = "" } = useParams();
  const topic = graphData.topics.find((item) => item.id === topicId);
  const quest = learningQuests.find((item) => item.topicId === topicId);
  const subtopicPack = subtopicPacks.find((pack) => pack.topicId === topicId);

  if (!topic || !quest) {
    return (
      <section className="panel">
        <h2>Developed Card</h2>
        <p className="emptyState">No developed card details are available for this topic yet.</p>
        <div className="plannerMeta">
          <Link className="smallBtn" to="/developed-cards">
            Back To Developed Cards
          </Link>
        </div>
      </section>
    );
  }

  const checkpoint = quest.steps.find((step) => step.id === quest.masteryCheckpointStepId);

  return (
    <section className="panel">
      <div className="sectionHead">
        <div className="sectionTitleWithBadge">
          <h2>{topic.title}</h2>
          <span className="resultCount">{topic.gradeBand}</span>
        </div>
      </div>
      <p className="muted">{topic.mathTopic}</p>

      <div className="developedSplit">
        <article className="plannerViz">
          <h3>Learning</h3>
          <p className="muted">{quest.hook}</p>
          <div className="learningGoalsWrap">
            {(subtopicPack?.subtopics ?? []).map((subtopic, idx) => (
              <span className="learningGoalTag" key={subtopic.id}>
                {idx + 1}. {subtopic.name}
              </span>
            ))}
            {!subtopicPack ? (
              <span className="learningGoalTag">Subtopics not authored yet.</span>
            ) : null}
          </div>
          <div className="plannerMeta learningActionRow">
            <Link className="actionBtn actionBtnPrimary" to={`/quest/${topicId}`}>
              Start Learning
            </Link>
          </div>
        </article>

        <article className="plannerViz">
          <h3>Practicing</h3>
          <p className="muted">
            {checkpoint?.prompt ?? "Practice with checkpoint-style quick questions."}
          </p>
          <p className="questHint">Choose difficulty to enter the matching practice section.</p>
          <div className="plannerMeta learningActionRow">
            <Link className="actionBtn actionBtnEasy" to={`/quest/${topicId}?mode=practice&level=easy`}>
              Easy
            </Link>
            <Link className="actionBtn actionBtnMedium" to={`/quest/${topicId}?mode=practice&level=medium`}>
              Medium
            </Link>
            <Link className="actionBtn actionBtnHard" to={`/quest/${topicId}?mode=practice&level=hard`}>
              Hard
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

