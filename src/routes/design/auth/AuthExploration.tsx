import type { ComponentType } from "react";
import { useParams } from "react-router";
import SignInA from "./SignInA";
import SignInB from "./SignInB";
import SignInC from "./SignInC";
import WelcomeA from "./WelcomeA";
import WelcomeB from "./WelcomeB";
import ClaimA from "./ClaimA";
import ClaimB from "./ClaimB";

/** Round 6 — authentication pages. One route, seven variants. */
const VARIANTS: Record<string, ComponentType> = {
  "signin-a": SignInA,
  "signin-b": SignInB,
  "signin-c": SignInC,
  "welcome-a": WelcomeA,
  "welcome-b": WelcomeB,
  "claim-a": ClaimA,
  "claim-b": ClaimB,
};

export default function AuthExploration() {
  const { variant = "signin-a" } = useParams();
  const Page = VARIANTS[variant] ?? SignInA;
  return <Page />;
}
