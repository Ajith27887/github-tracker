import express from "express";
import type { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const GeminiAPI = process.env.GEMINI_API_KEY;

import prisma from "../prismaClient.ts";
const router = express.Router();

function computeCommitDays(events: Array<{ createdat: Date }>, days: number): number[] {
	const buckets = new Array(7).fill(0);
	const now = new Date();
	events.forEach(e => {
		const diff = Math.floor((now.getTime() - new Date(e.createdat).getTime()) / (1000 * 60 * 60 * 24));
		if (days === 30) {
			const weekIdx = Math.min(6, Math.floor(diff / (30 / 7)));
			buckets[6 - weekIdx]++;
		} else {
			const dow = new Date(e.createdat).getDay(); // 0=Sun
			const idx = dow === 0 ? 6 : dow - 1; // Mon=0 … Sun=6
			buckets[idx]++;
		}
	});
	return buckets;
}

router.get("/", async (req: Request, res: Response) => {
	const userId = req.session.userId;
	if (!userId) return res.status(401).json({ error: "Unauthorized" });

	const repoId = Number(req.query.repoId);
	if (!repoId) return res.status(400).json({ error: "repoId required" });

	const tf = req.query.tf === "30d" ? "30d" : "7d";
	const days = tf === "30d" ? 30 : 7;

	const repoRecord = await prisma.repo.findFirst({
		where: { id: repoId, userId }
	});
	if (!repoRecord) return res.status(404).json({ error: "Repo not found" });

	const since = new Date();
	since.setDate(since.getDate() - days);

	const events = await prisma.event.findMany({
		where: { createdat: { gte: since }, repoId: repoRecord.id }
	});

	// Fetch PR and issue counts from GitHub (best-effort; fails silently for private repos)
	const userRecord = await prisma.user.findUnique({ where: { id: userId } });
	const token = userRecord?.accessToken;
	const [owner, repoName] = repoRecord.repo.split("/");

	const ghHeaders: HeadersInit = {
		Accept: "application/vnd.github+json",
		"User-Agent": "github-tracker-recap",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};

	let mergedPRs = 0, openedPRs = 0, closedIssues = 0, openedIssues = 0;
	let reviewingPRs = 0;

	try {
		const prsRes = await fetch(
			`https://api.github.com/repos/${owner}/${repoName}/pulls?state=closed&per_page=100&sort=updated`,
			{ headers: ghHeaders }
		);
		if (prsRes.ok) {
			const prs = await prsRes.json() as Array<{ merged_at: string | null; created_at: string }>;
			mergedPRs = prs.filter(p => p.merged_at && new Date(p.merged_at) >= since).length;
			openedPRs = prs.filter(p => new Date(p.created_at) >= since).length;
		}
	} catch {}

	try {
		const openPRsRes = await fetch(
			`https://api.github.com/repos/${owner}/${repoName}/pulls?state=open&per_page=50`,
			{ headers: ghHeaders }
		);
		if (openPRsRes.ok) {
			const open = await openPRsRes.json() as Array<{ draft: boolean }>;
			reviewingPRs = open.filter((p: any) => !p.draft).length;
		}
	} catch {}

	try {
		const issuesRes = await fetch(
			`https://api.github.com/repos/${owner}/${repoName}/issues?state=closed&per_page=100&sort=updated`,
			{ headers: ghHeaders }
		);
		if (issuesRes.ok) {
			const issues = await issuesRes.json() as Array<{ pull_request?: object; closed_at: string; created_at: string }>;
			const realIssues = issues.filter(i => !i.pull_request);
			closedIssues = realIssues.filter(i => new Date(i.closed_at) >= since).length;
			openedIssues = realIssues.filter(i => new Date(i.created_at) >= since).length;
		}
	} catch {}

	const commitDays = computeCommitDays(events, days);
	const commitMessages = events.slice(0, 60).map(e => `- [${e.branch}] ${e.message}`).join("\n");

	const ai = new GoogleGenAI({ apiKey: GeminiAPI });

	const prompt = `You are analyzing a GitHub repository's recent activity.
Repository: ${repoRecord.repo}
Timeframe: last ${days} days
Total commits: ${events.length}
PRs merged: ${mergedPRs}
Issues closed: ${closedIssues}

Recent commit messages:
${commitMessages || "(no commits recorded via webhook in this period)"}

Return ONLY valid JSON with no markdown fences or explanation:
{
  "narrative": "2-3 sentence plain English summary of what the team worked on and the overall momentum",
  "themes": ["key change or theme 1", "key change or theme 2", "key change or theme 3", "key change or theme 4"],
  "next": ["suggested next action 1", "suggested next action 2"]
}`;

	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: prompt,
		});

		let narrative = "", themes: string[] = [], next: string[] = [];
		try {
			const raw = (response.text ?? "")
				.replace(/^```json\s*/i, "").replace(/^```\s*/i, "")
				.replace(/```\s*$/i, "").trim();
			const parsed = JSON.parse(raw);
			narrative = String(parsed.narrative ?? "");
			themes = Array.isArray(parsed.themes) ? parsed.themes.map(String) : [];
			next = Array.isArray(parsed.next) ? parsed.next.map(String) : [];
		} catch {
			narrative = response.text ?? "";
		}

		res.json({
			narrative,
			themes,
			next,
			stats: {
				commits: events.length,
				prs: mergedPRs,
				issues: closedIssues,
				contributors: 0,
			},
			deltas: { commits: 0, prs: 0, issues: 0, contributors: 0 },
			commitDays,
			breakdown: {
				merged: mergedPRs,
				opened: openedPRs + mergedPRs,
				reviewing: reviewingPRs,
			},
			issueSplit: {
				closed: closedIssues,
				opened: openedIssues,
				stale: 0,
			},
			contributors: [],
		});
	} catch (err: any) {
		console.error("Gemini error:", err);
		const msg = String(err?.message ?? "");
		const isUnavailable = msg.includes('"code":503') || msg.includes("UNAVAILABLE");
		if (isUnavailable) {
			return res.status(503).json({ error: "MODEL_UNAVAILABLE", message: "Gemini is busy. Please retry." });
		}
		res.status(500).json({ error: "SUMMARY_FAILED", message: msg });
	}
});

export default router;
