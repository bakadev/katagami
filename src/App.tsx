import { Routes, Route, Navigate, useLocation } from "react-router";
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
import AuthExploration from "./routes/design/auth/AuthExploration";
import DocumentsExploration from "./routes/design/documents/DocumentsExploration";
import SignIn from "./routes/SignIn";
import Welcome from "./routes/Welcome";
import Claim from "./routes/Claim";
import Documents from "./routes/Documents";
import Project from "./routes/Project";
import Document from "./routes/Document";
import NotFound from "./routes/NotFound";
import DesignIndex from "./routes/design/DesignIndex";
import { ScrollToTop } from "./components/site/ScrollToTop";
import { UtilityBar } from "./components/site/UtilityBar";

/** The utility bar belongs to the marketing pages, not the editor or the
 *  design explorations (which render their own bar variants). */
function SiteChrome() {
  const { pathname } = useLocation();
  // The editor and the signed-in home carry the app header instead.
  const inApp =
    pathname.startsWith("/p/") || pathname === "/documents" || pathname.startsWith("/documents/");
  const inDesign = pathname.startsWith("/design");
  // Sign-in carries its own wordmark; the audience switch would be noise there.
  const inAuth = pathname === "/signin";
  if (inApp || inDesign || inAuth) return null;
  return <UtilityBar />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <SiteChrome />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/developers" element={<Developers />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/claim" element={<Claim />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:projectId" element={<Project />} />
        <Route path="/p/:projectId" element={<Navigate to="." replace />} />
        <Route path="/p/:projectId/d/:docId" element={<Document />} />
        {/* Design explorations — public but unlinked.
          See docs/design-explorations/README.md */}
        <Route path="/design" element={<DesignIndex />} />
        <Route path="/design/contact/a" element={<ContactA />} />
        <Route path="/design/contact/b" element={<ContactB />} />
        <Route path="/design/contact/c" element={<ContactC />} />
        <Route path="/design/auth/:variant" element={<AuthExploration />} />
        <Route path="/design/documents/:variant" element={<DocumentsExploration />} />
      <Route path="/design/topbar/:variant" element={<TopBarExploration />} />
        <Route
          path="/design/topbar/:variant/:audience"
          element={<TopBarExploration />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
