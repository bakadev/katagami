import { Link } from "react-router";

export default function NotFound() {
  return (
    <main style={{ padding: 16 }}>
      <h1>Not found</h1>
      <Link to="/">Home</Link>
    </main>
  );
}
