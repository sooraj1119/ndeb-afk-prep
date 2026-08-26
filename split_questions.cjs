const fs = require("fs");
const questions = require("./public/questions.json");

const byTopic = {};
questions.forEach(q => {
  if (!byTopic[q.topicId]) byTopic[q.topicId] = [];
  byTopic[q.topicId].push(q);
});

const topicDir = "./public/questions";
if (!fs.existsSync(topicDir)) fs.mkdirSync(topicDir, { recursive: true });

Object.entries(byTopic).forEach(([topicId, qs]) => {
  fs.writeFileSync(topicDir + "/" + topicId + ".json", JSON.stringify(qs));
  const sizeKB = (fs.statSync(topicDir + "/" + topicId + ".json").size / 1024).toFixed(1);
  console.log(topicId + ": " + qs.length + " questions (" + sizeKB + " KB)");
});

const manifest = Object.keys(byTopic).map(id => ({ id, count: byTopic[id].length }));
fs.writeFileSync("./public/questions/manifest.json", JSON.stringify(manifest));
console.log("Done! " + manifest.length + " topics written.");
