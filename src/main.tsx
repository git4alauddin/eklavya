import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import { DevelopedCardDetailPage } from "./routes/DevelopedCardDetailPage";
import { DevelopedCardsPage } from "./routes/DevelopedCardsPage";
import { GraphPage } from "./routes/GraphPage";
import { HubPage } from "./routes/HubPage";
import { HumanReviewHubPage } from "./routes/HumanReviewHubPage";
import { LlmIntegrationPage } from "./routes/LlmIntegrationPage";
import { PlannerPage } from "./routes/PlannerPage";
import { PrerequisiteApprovalPage } from "./routes/PrerequisiteApprovalPage";
import { QuestPage } from "./routes/QuestPage";
import { SubtopicReviewPage } from "./routes/SubtopicReviewPage";
import { TopicApprovalPage } from "./routes/TopicApprovalPage";
import { TopicCardsPage } from "./routes/TopicCardsPage";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HubPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="topics" element={<TopicCardsPage />} />
          <Route path="developed-cards" element={<DevelopedCardsPage />} />
          <Route path="developed-card/:topicId" element={<DevelopedCardDetailPage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="human-review" element={<HumanReviewHubPage />} />
          <Route path="llm-integration" element={<LlmIntegrationPage />} />
          <Route path="human-review/topic-approval" element={<TopicApprovalPage />} />
          <Route path="human-review/subtopic-approval" element={<SubtopicReviewPage />} />
          <Route
            path="human-review/prerequisite-approval"
            element={<PrerequisiteApprovalPage />}
          />
          <Route path="subtopic-review" element={<SubtopicReviewPage />} />
          <Route path="quest/:topicId" element={<QuestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
