import type { ComponentType } from "react";
import { useParams } from "react-router";
import DocumentsA from "./DocumentsA";
import DocumentsB from "./DocumentsB";
import DocumentsC from "./DocumentsC";
import DocumentsD from "./DocumentsD";
import DocumentsDProject from "./DocumentsDProject";

/** Round 7 — signed-in home (/documents). One route: three variants plus D's two pages. */
const VARIANTS: Record<string, ComponentType> = {
  "documents-a": DocumentsA,
  "documents-b": DocumentsB,
  "documents-c": DocumentsC,
  "documents-d": DocumentsD,
  "documents-d-project": DocumentsDProject,
};

export default function DocumentsExploration() {
  const { variant = "documents-a" } = useParams();
  const Page = VARIANTS[variant] ?? DocumentsA;
  return <Page />;
}
