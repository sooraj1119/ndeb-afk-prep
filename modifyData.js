const fs = require('fs');
let data = fs.readFileSync('src/lib/data.tsx', 'utf8');

const lockedIds = [
  'pharmacology', 'endodontics', 'anesthesia', 'pathology',
  'prosthodontics', 'general-medicine', 'oral-medicine', 'oral-surgery',
  'implants', 'emergencies', 'orthodontics', 'pedodontics', 'infection-control'
];

lockedIds.forEach(id => {
  const regex = new RegExp(`({ id: "${id}",.*?)( })`, 'g');
  data = data.replace(regex, `$1, isPremiumOnly: true }`);
});

fs.writeFileSync('src/lib/data.tsx', data);
console.log('Updated data.tsx');
