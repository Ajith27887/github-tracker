"use client"

export default function Home() {
	const callapi = async () => {
		const res = await fetch("http://localhost:3001/");
		if (!res.ok) {
			console.log("Error");
			
		}
		const data =  await res.json();
		console.log(data);
	}

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome to My App</h1>
      <p>This is a dummy Next.js home page.</p>
      <ul>
        <li>Fast</li>
        <li>Scalable</li>
        <li>Built with Next.js</li>
      </ul>
      <button
	  	onClick={() => callapi()}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Get Started
      </button>
    </main>
  );
}
