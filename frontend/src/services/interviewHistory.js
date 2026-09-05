export const INTERVIEW_HISTORY_KEY = "ai_mock_interview_history";

const clampScore = (value) => {
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
};

const normalizeText = (value, fallback = "N/A") => (
  typeof value === "string" && value.trim() ? value.trim() : fallback
);

const normalizeList = (items) => (
  Array.isArray(items)
    ? items.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : []
);

export const readInterviewHistory = () => {
  try {
    const stored = window.localStorage.getItem(INTERVIEW_HISTORY_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((record) => {
        if (!record || typeof record !== "object") return null;
        const overallScore = clampScore(record.overallScore ?? record.score);
        if (overallScore === null) return null;

        const date = new Date(record.date || record.completedAt);
        if (Number.isNaN(date.getTime())) return null;

        return {
          ...record,
          id: normalizeText(record.id, date.toISOString()),
          date: date.toISOString(),
          role: normalizeText(record.role, "Candidate"),
          experience: normalizeText(record.experience),
          skill: normalizeText(record.skill),
          difficulty: normalizeText(record.difficulty),
          resumeUsed: Boolean(record.resumeUsed),
          overallScore,
          performanceLevel: normalizeText(record.performanceLevel, "Needs Improvement"),
          questions: Array.isArray(record.questions) ? record.questions : [],
          answers: Array.isArray(record.answers) ? record.answers : [],
          evaluations: Array.isArray(record.evaluations) ? record.evaluations : [],
          strengths: normalizeList(record.strengths),
          weaknesses: normalizeList(record.weaknesses),
          improvementSuggestions: normalizeList(record.improvementSuggestions)
        };
      })
      .filter(Boolean)
      .sort((first, second) => new Date(second.date) - new Date(first.date));
  } catch (error) {
    return [];
  }
};

export const saveInterviewRecord = (record) => {
  if (!record || typeof record !== "object") return false;

  try {
    const history = readInterviewHistory();
    const existingIndex = history.findIndex((item) => item.id === record.id);
    const nextHistory = existingIndex >= 0
      ? history.map((item, index) => (index === existingIndex ? { ...item, ...record } : item))
      : [record, ...history];

    window.localStorage.setItem(INTERVIEW_HISTORY_KEY, JSON.stringify(nextHistory));
    return true;
  } catch (error) {
    return false;
  }
};
