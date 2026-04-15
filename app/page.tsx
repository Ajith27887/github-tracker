"use client"

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={() => { window.location.href = "http://localhost:3001/auth/"; }}
        style={{
          padding: "0.75rem 1.5rem",
          background: "#24292f",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "1rem",
        }}
      >
        Login with GitHub
      </button>
    </main>
  );
}
