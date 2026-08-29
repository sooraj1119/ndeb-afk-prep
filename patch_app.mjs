import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add import
if (!content.includes('initializeRevenueCat')) {
    content = content.replace(
        "import { hasAcceptedDisclaimer", 
        "import { initializeRevenueCat } from './lib/revenuecat';\nimport { hasAcceptedDisclaimer"
    );
}

// 2. Add useEffect to call initializeRevenueCat on mount
if (!content.includes('initializeRevenueCat()')) {
    const useEffectInjection = 
  useEffect(() => {
    initializeRevenueCat();
  }, []);
;
    content = content.replace(
        "const [disclaimerAccepted, setDisclaimerAccepted] = useState(hasAcceptedDisclaimer());",
        "const [disclaimerAccepted, setDisclaimerAccepted] = useState(hasAcceptedDisclaimer());\n" + useEffectInjection
    );
}

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx patched for RevenueCat");