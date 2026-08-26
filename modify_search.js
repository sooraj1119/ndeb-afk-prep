const fs = require('fs');
let code = fs.readFileSync('C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/Search_mod.tsx', 'utf8');

// Fix imports
code = code.replace(
  "import { Search as SearchIcon, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';",
  "import { Search as SearchIcon, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Loader2, Crown } from 'lucide-react';\nimport { getIsPremium } from './lib/storage';\nimport { PaywallModal } from './PaywallModal';"
);

// Add hooks
code = code.replace(
  "export function Search() {",
  "export function Search() {\n  const isPremium = getIsPremium();\n  const [showPaywall, setShowPaywall] = useState(false);"
);

// Add displayResults
code = code.replace(
  "const toggleExpand = (id: number) => {\n    setExpandedId(expandedId === id ? null : id);\n  };",
  "const toggleExpand = (id: number) => {\n    setExpandedId(expandedId === id ? null : id);\n  };\n\n  const displayResults = isPremium ? results : results.slice(0, 5);"
);

// Change results.map
code = code.replace(
  "{results.map((q) => {",
  "{displayResults.map((q) => {"
);

// Add paywall banner and modal
const searchBanner = 
        {/* End of displayResults map */}
        {!isPremium && results.length > 5 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(217,119,6,0.1) 100%)',
              border: '2px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              textAlign: 'center',
              marginTop: '2rem',
              cursor: 'pointer'
            }}
            onClick={() => setShowPaywall(true)}
            whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(245,158,11,0.15)' }}
          >
            <Crown size={32} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              Unlock {results.length - 5} more results
            </h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
              Subscribe to Pro to search the entire 7,500+ question databank instantly.
            </p>
            <button
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              <Crown size={16} /> Upgrade to Pro
            </button>
          </motion.div>
        )}
      </div>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} feature="Unlimited Search" />
;

code = code.replace(
  "        </div>\n      </div>\n    </motion.div>\n  );\n}",
  searchBanner + "\n    </motion.div>\n  );\n}"
);

fs.writeFileSync('C:/Users/sooraj/.gemini/antigravity/brain/5c9ff53c-3a20-4bb5-bf9d-4269cb96d384/scratch/Search_mod.tsx', code);
console.log('Modified successfully.');