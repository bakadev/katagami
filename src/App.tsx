import { Routes, Route, Navigate } from "react-router";
import Home from "./routes/Home";
import Document from "./routes/Document";
import NotFound from "./routes/NotFound";
import DesignIndex from "./routes/design/DesignIndex";
import HomeDeveloper from "./routes/design/home/HomeDeveloper";
import HomeProduct from "./routes/design/home/HomeProduct";
import HomeEnterprise from "./routes/design/home/HomeEnterprise";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/p/:projectId" element={<Navigate to="." replace />} />
      <Route path="/p/:projectId/d/:docId" element={<Document />} />
      {/* Design explorations — public so reviewers can see them.
          See docs/design-explorations/README.md */}
      <Route path="/design" element={<DesignIndex />} />
      <Route path="/design/home/developer" element={<HomeDeveloper />} />
      <Route path="/design/home/product" element={<HomeProduct />} />
      <Route path="/design/home/enterprise" element={<HomeEnterprise />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
