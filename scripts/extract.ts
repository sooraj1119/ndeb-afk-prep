import { questions } from '../src/lib/data';
import fs from 'fs';

fs.writeFileSync('src/lib/questions.json', JSON.stringify(questions, null, 2));
console.log('Successfully extracted questions to src/lib/questions.json');
