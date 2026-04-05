import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import { GraphPage } from "./routes/GraphPage";
import { HubPage } from "./routes/HubPage";
import { PlannerPage } from "./routes/PlannerPage";
import { QuestPage } from "./routes/QuestPage";
import { TopicCardsPage } from "./routes/TopicCardsPage";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HubPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="topics" element={<TopicCardsPage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="quest/:topicId" element={<QuestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
