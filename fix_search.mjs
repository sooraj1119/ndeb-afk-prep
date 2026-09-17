import fs from "fs";
let s = fs.readFileSync("src/Search.tsx", "utf8");
s = s.replace(
  /const init = async \(\) => \{\r?\n\s+setLoading\(true\);\r?\n\s+await loadAllQuestions\(\);\r?\n\s+setQuestions\(getQuestions\(\)\);\r?\n\s+setLoading\(false\);\r?\n\s+\};/,
  `const init = async () => {
      setLoading(true);
      await loadAllQuestions();
      let allQs = getQuestions();
      if (!getIsPremium()) {
        const premiumIds = topics.filter(t => t.isPremiumOnly).map(t => t.id);
        allQs = allQs.filter(q => !premiumIds.includes(q.topicId));
      }
      setQuestions(allQs);
      setLoading(false);
    };`
);
fs.writeFileSync("src/Search.tsx", s);
console.log("Fixed:", s.includes("premiumIds"));
