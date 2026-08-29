const fs = require('fs');
let content = fs.readFileSync('C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/Quiz_back.tsx', 'utf8');

// Replace handleNext
content = content.replace(
  /const handleNext = \(\) => \{\s+if \(currentIndex/g,
  `const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
    }
  };

  const handleNext = () => {
      if (currentIndex`
);

// Replace Next Button
const target = `<button
                  onClick={handleNext}
                  className="primary-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
                >
                  {currentIndex < topicQuestions.length - 1 ? 'Next' : 'Finish'} <ArrowRight size={18} />
                </button>`;

const replacement = `<div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    style={{ 
                      background: 'var(--surface-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
                      padding: '0.8rem 1.2rem', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentIndex === 0 ? 0.5 : 1
                    }}
                  >
                    <ArrowLeft size={18} /> Prev
                  </button>
                  <button
                    onClick={handleNext}
                    className="primary-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}
                  >
                    {currentIndex < topicQuestions.length - 1 ? 'Next' : 'Finish'} <ArrowRight size={18} />
                  </button>
                </div>`;

content = content.replace(target, replacement);

fs.writeFileSync('C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/Quiz_back.tsx', content);
console.log("Patched scratch file successfully.");