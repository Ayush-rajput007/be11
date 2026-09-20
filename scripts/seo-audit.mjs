import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

console.log('==================================================');
console.log('       BE11 PRODUCTION SEO VALIDATION SUITE       ');
console.log('==================================================\n');

// 1. Audit robots.txt
console.log('1. Auditing frontend/public/robots.txt...');
const robotsPath = path.join(ROOT, 'frontend', 'public', 'robots.txt');
assert(fs.existsSync(robotsPath), 'robots.txt exists in frontend/public');

if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  assert(robots.includes('User-agent: *'), 'robots.txt contains User-agent: *');
  assert(robots.includes('Allow: /'), 'robots.txt allows public crawling (Allow: /)');
  assert(robots.includes('Disallow: /admin'), 'robots.txt disallows /admin');
  assert(robots.includes('Disallow: /dashboard'), 'robots.txt disallows /dashboard');
  assert(robots.includes('Disallow: /profile'), 'robots.txt disallows /profile');
  assert(robots.includes('Disallow: /api/'), 'robots.txt disallows /api/');
  assert(robots.includes('Sitemap: https://be11.in/sitemap.xml'), 'robots.txt references https://be11.in/sitemap.xml');
}

// 2. Audit sitemap.xml
console.log('\n2. Auditing frontend/public/sitemap.xml...');
const sitemapPath = path.join(ROOT, 'frontend', 'public', 'sitemap.xml');
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in frontend/public');

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml has valid XML declaration');
  assert(sitemap.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'sitemap.xml has valid urlset schema');

  const requiredUrls = [
    'https://be11.in/',
    'https://be11.in/venues',
    'https://be11.in/venues/rrr-cricket-club-kidawali-faridabad',
    'https://be11.in/venues/playnow-cricket-ground',
    'https://be11.in/venues/ab-cricket-ground',
    'https://be11.in/live-matches',
    'https://be11.in/coaches',
    'https://be11.in/store',
    'https://be11.in/jersey-builder',
    'https://be11.in/kit-builder',
    'https://be11.in/add-ons',
    'https://be11.in/toss',
    'https://be11.in/tournaments',
    'https://be11.in/become-vendor',
    'https://be11.in/privacy',
    'https://be11.in/terms',
  ];

  requiredUrls.forEach((url) => {
    assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml includes canonical URL: ${url}`);
  });

  // Ensure no private routes
  const privatePatterns = ['/admin', '/dashboard', '/profile', '/settings', '/my-bookings', '/login', '/signup', '/api'];
  privatePatterns.forEach((priv) => {
    assert(!sitemap.includes(`https://be11.in${priv}<`), `sitemap.xml excludes private route: ${priv}`);
  });
}

// 3. Audit index.html & Favicons
console.log('\n3. Auditing frontend/index.html baseline SEO, favicons & structured data...');
const indexPath = path.join(ROOT, 'frontend', 'index.html');
assert(fs.existsSync(indexPath), 'index.html exists');

if (fs.existsSync(indexPath)) {
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  assert(indexHtml.includes('<title>BE11 Sports | Cricket Grounds, Live Matches & Sports</title>'), 'index.html has brand & informative title tag');
  assert(indexHtml.includes('<meta name="description"'), 'index.html has meta description');
  assert(indexHtml.includes('<link rel="canonical" href="https://be11.in/" />'), 'index.html has canonical tag');
  assert(indexHtml.includes('href="/favicon.ico"'), 'index.html references /favicon.ico');
  assert(indexHtml.includes('href="/favicon-32x32.png"'), 'index.html references /favicon-32x32.png');
  assert(indexHtml.includes('href="/favicon-16x16.png"'), 'index.html references /favicon-16x16.png');
  assert(indexHtml.includes('href="/apple-touch-icon.png"'), 'index.html references /apple-touch-icon.png');
  assert(indexHtml.includes('href="/manifest.webmanifest"'), 'index.html references /manifest.webmanifest');
  assert(indexHtml.includes('<meta property="og:title"'), 'index.html has og:title');
  assert(indexHtml.includes('<meta property="og:image"'), 'index.html has og:image');
  assert(indexHtml.includes('<meta name="twitter:card"'), 'index.html has twitter:card');
  assert(indexHtml.includes('"@type": "Organization"'), 'index.html has Organization structured data');
  assert(indexHtml.includes('"@type": "WebSite"'), 'index.html has WebSite structured data');
}

// 3.1 Audit Favicon Assets
console.log('\n3.1 Auditing official BE11 favicon assets in frontend/public...');
const publicDir = path.join(ROOT, 'frontend', 'public');
const faviconFiles = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-48x48.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
];
faviconFiles.forEach((file) => {
  const fPath = path.join(publicDir, file);
  assert(fs.existsSync(fPath) && fs.statSync(fPath).size > 0, `Favicon asset exists and is non-empty: ${file}`);
});

// 4. Audit Frontend Pages for SEO components
console.log('\n4. Auditing React Page components for SEO integration...');
const pagesDir = path.join(ROOT, 'frontend', 'src', 'pages');

const publicPages = [
  'Home.tsx',
  'Venues.tsx',
  'VenueDetail.tsx',
  'LiveMatches.tsx',
  'Coaches.tsx',
  'CoachProfile.tsx',
  'Shop.tsx',
  'KitBuilder.tsx',
  'Capture.tsx',
  'Toss.tsx',
  'Tournaments.tsx',
  'BecomeVendor.tsx',
  'PrivacyPolicy.tsx',
  'TermsOfService.tsx',
];

publicPages.forEach((page) => {
  const filePath = path.join(pagesDir, page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert(content.includes('<SEO') || content.includes('SEO'), `${page} integrates SEO component`);
  }
});

const privatePages = [
  'Login.tsx',
  'Signup.tsx',
  'ForgotPassword.tsx',
  'VerifyPhone.tsx',
  'VerifyEmail.tsx',
  'Dashboard.tsx',
  'ProfileSettings.tsx',
  'MyBookings.tsx',
  'CoachDashboard.tsx',
  'MyTraining.tsx',
  'Admin.tsx',
];

privatePages.forEach((page) => {
  const filePath = path.join(pagesDir, page);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert(content.includes('noindex'), `${page} includes noindex directive`);
  }
});

console.log('\n==================================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED: ${passedChecks}`);
console.log(`FAILED: ${failedChecks}`);
console.log('==================================================\n');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL SEO CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
}
