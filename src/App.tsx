import { Routes, Route, Navigate } from "react-router";
import Home from "./routes/Home";
import Developers from "./routes/Developers";
import Pricing from "./routes/Pricing";
import Privacy from "./routes/Privacy";
import Terms from "./routes/Terms";
import Contact from "./routes/Contact";
import ContactA from "./routes/design/contact/ContactA";
import ContactB from "./routes/design/contact/ContactB";
import ContactC from "./routes/design/contact/ContactC";
import TopBarExploration from "./routes/design/topbar/TopBarExploration";
import Document from "./routes/Document";
import NotFound from "./routes/NotFound";
import DesignIndex from "./routes/design/DesignIndex";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/developers" element={<Developers />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/p/:projectId" element={<Navigate to="." replace />} />
      <Route path="/p/:projectId/d/:docId" element={<Document />} />
      {/* Design explorations — public but unlinked.
          See docs/design-explorations/README.md */}
      <Route path="/design" element={<DesignIndex />} />
      <Route path="/design/contact/a" element={<ContactA />} />
      <Route path="/design/contact/b" element={<ContactB />} />
      <Route path="/design/contact/c" element={<ContactC />} />
      <Route path="/design/topbar/:variant" element={<TopBarExploration />} />
      <Route path="/design/topbar/:variant/:audience" element={<TopBarExploration />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
