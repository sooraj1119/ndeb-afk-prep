const { execSync } = require('child_process');

process.env.NETLIFY_AUTH_TOKEN = 'nfp_JS6rAT7WNzvGkNhb99TesvVmqeUk5rNPdde0';

try {
  console.log('Deploying to Netlify...');
  const output = execSync(
    'netlify deploy --prod --dir=dist --site=d84812ad-fb4c-4bbc-af87-fabea94786d9 --auth=nfp_JS6rAT7WNzvGkNhb99TesvVmqeUk5rNPdde0',
    { encoding: 'utf8', stdio: 'inherit' }
  );
  console.log('Deploy complete! Live at: https://ndeb-afk-prep.netlify.app');
} catch (e) {
  console.error('Deploy failed:', e.message);
}
