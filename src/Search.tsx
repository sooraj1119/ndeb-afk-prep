import React, { useState, useMemo } from 'react';
import { getQuestions } from './lib/questionsStore';
import { topics } from './lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';


export function Search() {
  const questions = getQuestions();
    const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [generatingIds, setGeneratingIds] = useState<Record<number, boolean>>({});
  const [generatedExplanations, setGeneratedExplanations] = useState<Record<number, string>>({});

  const generateExplanation = async (q: any) => {
    setGeneratingIds(prev => ({...prev, [q.id]: true}));
    try {
        const prompt = `You are an expert NDEB dental instructor. Generate a concise, 1-2 sentence explanation for why the correct answer to this question is "${q.options[q.correctAnswer]}". Question: "${q.question}". Options: ${q.options.join(', ')}. Respond with ONLY the explanation text.`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        setGeneratedExplanations(prev => ({...prev, [q.id]: data.candidates[0].content.parts[0].text}));
    } catch (err) {
        setGeneratedExplanations(prev => ({...prev, [q.id]: "Failed to generate AI explanation. Please check API key."}));
    } finally {
        setGeneratingIds(prev => ({...prev, [q.id]: false}));
    }
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    
    return allQuestions.filter(q => {
      const qMatch = q.question.toLowerCase().includes(lowerQuery);
      const optMatch = q.options.some((o: string) => o.toLowerCase().includes(lowerQuery));
      const expMatch = q.explanation && q.explanation.toLowerCase().includes(lowerQuery);
      return qMatch || optMatch || expMatch;
    }).slice(0, 50); // Limit to 50 results to prevent massive rendering delays
  }, [query]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}
    >
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Global Search</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Instantly search thousands of questions, options, and explanations.</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '3rem' }}>
        <div style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
          <SearchIcon size={24} />
        </div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for 'Amoxicillin', 'Mandible', 'Class II'..."
          style={{ 
            width: '100%', 
            padding: '1.5rem 1.5rem 1.5rem 4rem', 
            fontSize: '1.2rem',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            outline: 'none',
            transition: 'all 0.2s ease',
            color: 'var(--text-primary)',
            background: 'var(--surface-color)'
          }}
          autoFocus
        />
      </div>

      <div>
        {query.trim() && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No results found</h3>
            <p>Try adjusting your search terms.</p>
          </div>
        )}

        {query.trim() && results.length > 0 && (
          <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Found {results.length} {results.length === 50 ? '(showing top 50)' : ''} results
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((q) => {
            const topic = topics.find(t => t.id === q.topicId);
            const isExpanded = expandedId === q.id;

            return (
              <motion.div 
                key={q.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel"
                style={{ overflow: 'hidden' }}
              >
                <div 
                  onClick={() => toggleExpand(q.id)}
                  style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ background: '#e0f2fe', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {topic?.name || q.topicId}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 600 }}>
                      {q.question}
                    </h3>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', padding: '0.5rem' }}>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ borderTop: '1px solid var(--border-color)' }}
                    >
                      <div style={{ padding: '1.5rem', background: 'var(--surface-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                          {q.options.map((opt: string, idx: number) => (
                            <div key={idx} style={{ 
                              padding: '1rem', 
                              background: idx === q.correctAnswer ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-hover)',
                              border: idx === q.correctAnswer ? '1px solid var(--success-color)' : '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.8rem',
                              color: idx === q.correctAnswer ? 'var(--success-color)' : 'var(--text-primary)',
                              fontWeight: idx === q.correctAnswer ? 600 : 400
                            }}>
                              {idx === q.correctAnswer && <CheckCircle2 size={18} color="var(--success-color)" />}
                              <span style={{ marginLeft: idx === q.correctAnswer ? 0 : '1.5rem' }}>{opt}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                            <Sparkles size={18} /> Tutor Explanation
                          </div>
                          <div style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '1rem' }}>
                            {q.explanation ? q.explanation : "No explanation provided for this question."}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}




