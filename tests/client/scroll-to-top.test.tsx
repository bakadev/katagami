// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router";
import { ScrollToTop } from "../../src/components/site/ScrollToTop";

function App() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Link to="/terms">terms</Link>} />
        <Route path="/terms" element={<Link to="/pricing#faq">faq</Link>} />
        <Route path="/pricing" element={<p>pricing</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ScrollToTop", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("scrolls to the top when the path changes", () => {
    const { getByText } = render(<App />);
    expect(window.scrollTo).toHaveBeenCalledTimes(1); // initial mount
    act(() => getByText("terms").click());
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ top: 0 }),
    );
  });

  it("leaves in-page anchors to the browser", () => {
    const { getByText } = render(<App />);
    act(() => getByText("terms").click());
    const calls = (window.scrollTo as ReturnType<typeof vi.fn>).mock.calls.length;
    act(() => getByText("faq").click());
    expect(window.scrollTo).toHaveBeenCalledTimes(calls);
  });
});
