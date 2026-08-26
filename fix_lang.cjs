const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

const newToggle = `const toggleLanguage = () => {
    if (isFrench) {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + window.location.hostname + '; path=/;';
      const parts = window.location.hostname.split('.');
      if (parts.length > 2) {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.' + parts.slice(-2).join('.') + '; path=/;';
      }
      document.cookie = 'googtrans=/en/en; path=/;';
      document.cookie = 'googtrans=/en/en; domain=' + window.location.hostname + '; path=/;';
      localStorage.removeItem('googtrans');
      sessionStorage.removeItem('googtrans');
    } else {
      document.cookie = 'googtrans=/en/fr; path=/';
      document.cookie = 'googtrans=/en/fr; domain=' + window.location.hostname + '; path=/';
    }
    setIsFrench(!isFrench);
    window.location.reload();
  };`;

file = file.replace(/const toggleLanguage = \(\) => \{[\s\S]*?window\.location\.reload\(\);\s*\};/, newToggle);
fs.writeFileSync('src/App.tsx', file, 'utf8');
console.log('Fixed toggleLanguage');
