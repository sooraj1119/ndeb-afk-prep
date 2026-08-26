const fs = require('fs');
let code = fs.readFileSync('src/MistakesList.tsx', 'utf8');

code = code.replace(
  'interface Props {',
  'interface Props {\n  onBack?: () => void;'
);

code = code.replace(
  'export function MistakesList({ onStartMistakesQuiz }: Props) {',
  'import { ArrowLeft } from \'lucide-react\';\nexport function MistakesList({ onStartMistakesQuiz, onBack }: Props) {'
);

code = code.replace(
  'style={{ maxWidth: \'800px\', margin: \'0 auto\', padding: \'1rem\' }}',
  'style={{ maxWidth: \'800px\', margin: \'0 auto\', padding: \'1rem\' }}'
);

code = code.replace(
  '<div style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'2rem\' }}>',
  '<div style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\', marginBottom: \'2rem\' }}>\n        <div style={{ display: \'flex\', alignItems: \'center\', gap: \'1rem\' }}>\n          {onBack && (\n            <button onClick={onBack} style={{ background: \'transparent\', border: \'none\', cursor: \'pointer\', padding: \'0.5rem\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', borderRadius: \'50%\', color: \'var(--text-secondary)\' }}>\n              <ArrowLeft size={24} />\n            </button>\n          )}\n          <div>\n            <h2 style={{ fontSize: \'2rem\', margin: 0, color: \'var(--text-primary)\' }}>My Mistakes</h2>\n            <p style={{ margin: 0, color: \'var(--text-secondary)\' }}>{mistakes.length} questions need review</p>\n          </div>\n        </div>'
);

code = code.replace(
  '<h2 style={{ fontSize: \'2.5rem\', margin: \'0 0 0.5rem 0\', color: \'var(--text-primary)\' }}>My Mistakes</h2>\n          <p style={{ margin: 0, color: \'var(--text-secondary)\', fontSize: \'1.1rem\' }}>{mistakes.length} questions need review</p>',
  ''
);

fs.writeFileSync('src/MistakesList.tsx', code, 'utf8');