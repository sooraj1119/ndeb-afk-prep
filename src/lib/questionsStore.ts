// Lazy-load questions per topic — avoids downloading 5MB on mobile data
const cache: Record<string, any[]> = {};

export const loadTopicQuestions = async (topicId: string): Promise<any[]> => {
  if (cache[topicId]) return cache[topicId];
  const res = await fetch(import.meta.env.BASE_URL + "questions/" + topicId + ".json");
  if (!res.ok) throw new Error("Failed to load questions for " + topicId);
  const data = await res.json();
  cache[topicId] = data;
  return data;
};

export const loadAllQuestions = async (): Promise<void> => {
  const res = await fetch(import.meta.env.BASE_URL + "questions/manifest.json");
  const manifest = await res.json();
  for (const t of manifest) {
    await loadTopicQuestions(t.id);
  }
};

export const getQuestions = (): any[] => {
  return ([] as any[]).concat(...Object.values(cache));
};

export const getTopicQuestions = (topicId: string): any[] => {
  return cache[topicId] || [];
};
