"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/app/lib/api";

interface Repo {
  id: number;
  repo: string;
}

interface SummaryResponse {
  summary: string;
  events: any[];
}

type ErrorState =
  | { kind: "retry"; msg: string }
  | { kind: "fatal"; msg: string }
  | null;

export default function RepoSummary() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    api<Repo[]>("/repo/")
      .then((data) => {
        setRepos(data);
        if (data.length > 0) {
          setSelectedRepoId(data[0].id.toString());
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setAuthError(true);
        } else {
          setError({ kind: "fatal", msg: "Failed to load repositories" });
        }
      });
  }, []);

  const generateSummary = async () => {
    if (!selectedRepoId) return;
    setLoading(true);
    setSummary(null);
    setError(null);

    try {
      const data = await api<SummaryResponse>(`/summary/?repoId=${selectedRepoId}`);
      setSummary(data.summary);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 503) {
        setError({
          kind: "retry",
          msg: "Gemini is busy right now. Please try again.",
        });
      } else {
        setError({
          kind: "fatal",
          msg: err?.message ?? "Failed to generate summary",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authError) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-xl font-semibold mb-4">Please log in to continue</h2>
        <p className="text-gray-600">Use the button in the navigation bar to log in with GitHub.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Repository Activity Summary</h1>

      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="repo-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Repository
          </label>
          <select
            id="repo-select"
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
          >
            {repos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.repo}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={generateSummary}
          disabled={loading || !selectedRepoId}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>

        {error?.kind === "retry" && (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-300 flex items-center justify-between gap-4">
            <span>{error.msg}</span>
            <button
              onClick={generateSummary}
              disabled={loading}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 disabled:bg-yellow-300 text-sm font-medium"
            >
              {loading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {error?.kind === "fatal" && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {error.msg}
          </div>
        )}

        {summary && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Last 7 Days Summary</h2>
            <div className="p-4 bg-gray-50 rounded-md border prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
