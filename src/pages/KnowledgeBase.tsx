import { Routes, Route } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { ArticleList, ArticleEditor } from "../components/knowledge-base";

export function KnowledgeBase() {
  return (
    <DashboardLayout pageTitle="Knowledge Base">
      <Routes>
        <Route path="/" element={<ArticleList />} />
        <Route path="/new" element={<ArticleEditor />} />
        <Route path="/edit/:id" element={<ArticleEditor />} />
      </Routes>
    </DashboardLayout>
  );
}
