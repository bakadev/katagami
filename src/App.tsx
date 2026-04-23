import { Routes, Route, Navigate } from "react-router";
import Home from "./routes/Home";
import Document from "./routes/Document";
import NotFound from "./routes/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/p/:projectId" element={<Navigate to="." replace />} />
      <Route path="/p/:projectId/d/:docId" element={<Document />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
