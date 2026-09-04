// Lazy-load questions per topic — avoids downloading 5MB on mobile data
const cache: Record<string, any[]> = {};
let manifestCache: { id: string; count: number }[] | null = null;

export const loadTopicQuestions = async (topicId: string): Promise<any[]> => {
  if (cache[topicId]) return cache[topicId];
  const res = await fetch(import.meta.env.BASE_URL + "questions/" + topicId + ".json");
  if (!res.ok) throw new Error("Failed to load questions for " + topicId);
  const data = await res.json();
  cache[topicId] = data;
  return data;
};

export const loadAllQuestions = async (): Promise<void> => {
  if (manifestCache) return;
  try {
    const res = await fetch(import.meta.env.BASE_URL + "questions/manifest.json");
    manifestCache = await res.json();
  } catch (e) {
    console.error("Failed to load manifest", e);
  }
};

export const getTotalQuestionCount = (): number => {
  if (!manifestCache) return 7500;
  return manifestCache.reduce((acc, t) => acc + (t.count || 0), 0);
};

export const getQuestions = (): any[] => {
  return ([] as any[]).concat(...Object.values(cache));
};

export const getTopicQuestions = (topicId: string): any[] => {
  return cache[topicId] || [];
};
