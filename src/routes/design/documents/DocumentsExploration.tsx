import type { ComponentType } from "react";
import { useParams } from "react-router";
import DocumentsA from "./DocumentsA";
import DocumentsB from "./DocumentsB";
import DocumentsC from "./DocumentsC";

/** Round 7 — signed-in home (/documents). One route, three variants. */
const VARIANTS: Record<string, ComponentType> = {
  "documents-a": DocumentsA,
  "documents-b": DocumentsB,
  "documents-c": DocumentsC,
};

export default function DocumentsExploration() {
  const { variant = "documents-a" } = useParams();
  const Page = VARIANTS[variant] ?? DocumentsA;
  return <Page />;
}
