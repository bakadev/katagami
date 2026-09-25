import { Routes, Route, Navigate } from "react-router";
import Home from "./routes/Home";
import Developers from "./routes/Developers";
import Document from "./routes/Document";
import NotFound from "./routes/NotFound";
import DesignIndex from "./routes/design/DesignIndex";
import PricingA from "./routes/design/pricing/PricingA";
import PricingB from "./routes/design/pricing/PricingB";
import PricingC from "./routes/design/pricing/PricingC";
import PricingD from "./routes/design/pricing/PricingD";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/p/:projectId" element={<Navigate to="." replace />} />
      <Route path="/p/:projectId/d/:docId" element={<Document />} />
      {/* Design explorations — public but unlinked.
          See docs/design-explorations/README.md */}
      <Route path="/design" element={<DesignIndex />} />
      <Route path="/design/pricing/a" element={<PricingA />} />
      <Route path="/design/pricing/b" element={<PricingB />} />
      <Route path="/design/pricing/c" element={<PricingC />} />
      <Route path="/design/pricing/d" element={<PricingD />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
