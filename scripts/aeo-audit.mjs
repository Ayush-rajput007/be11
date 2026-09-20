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
console.log('       BE11 PRODUCTION AEO VALIDATION SUITE       ');
console.log('==================================================\n');

// 1. Audit frontend/public/llms.txt
console.log('1. Auditing frontend/public/llms.txt...');
const llmsPath = path.join(ROOT, 'frontend', 'public', 'llms.txt');
assert(fs.existsSync(llmsPath), 'llms.txt exists in frontend/public');

if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, 'utf8');
  assert(llms.includes('# BE11'), 'llms.txt has standard H1 title header');
  assert(llms.includes('https://be11.in'), 'llms.txt contains primary canonical domain');
  assert(llms.includes('Faridabad'), 'llms.txt specifies Faridabad geographic area');
  assert(llms.includes('+91 87001 90843') || llms.includes('8700190843'), 'llms.txt lists verified WhatsApp support contact');
  assert(llms.includes('support@be11.in'), 'llms.txt lists official support email');
  assert(llms.includes('RRR Cricket Club Kidawali Faridabad'), 'llms.txt covers RRR venue');
  assert(llms.includes('Playnow Cricket Ground'), 'llms.txt covers Playnow venue');
  assert(llms.includes('AB Cricket Ground'), 'llms.txt covers AB venue');
  assert(llms.includes('₹299'), 'llms.txt lists verified RRR individual price ₹299');
  assert(llms.includes('₹5,000'), 'llms.txt lists verified RRR whole ground price ₹5,000');
  
  // Security checks: no secret tokens
  const forbiddenKeywords = ['DATABASE_URL', 'JWT_SECRET', 'RAZORPAY_KEY_SECRET', 'SMTP_PASS', 'password', 'Bearer '];
  forbiddenKeywords.forEach((kw) => {
    assert(!llms.includes(kw), `llms.txt contains zero sensitive tokens (${kw})`);
  });
}

// 2. Audit frontend/public/llms-full.txt
console.log('\n2. Auditing frontend/public/llms-full.txt...');
const llmsFullPath = path.join(ROOT, 'frontend', 'public', 'llms-full.txt');
assert(fs.existsSync(llmsFullPath), 'llms-full.txt exists in frontend/public');

if (fs.existsSync(llmsFullPath)) {
  const llmsFull = fs.readFileSync(llmsFullPath, 'utf8');
  assert(llmsFull.includes('# BE11 Full Knowledge Base'), 'llms-full.txt has header');
  assert(llmsFull.includes('RRR Cricket Club Kidawali Faridabad'), 'llms-full.txt contains RRR details');
  assert(llmsFull.includes('Playnow Cricket Ground'), 'llms-full.txt contains Playnow details');
  assert(llmsFull.includes('AB Cricket Ground'), 'llms-full.txt contains AB details');
  assert(llmsFull.includes('BE11 WELCOMES'), 'llms-full.txt references active promo code');
  assert(llmsFull.includes('support@be11.in'), 'llms-full.txt lists official email');
  assert(llmsFull.includes('87001 90843'), 'llms-full.txt lists verified phone');

  // Security checks
  const forbiddenKeywords = ['DATABASE_URL', 'JWT_SECRET', 'RAZORPAY_KEY_SECRET', 'SMTP_PASS', 'password:'];
  forbiddenKeywords.forEach((kw) => {
    assert(!llmsFull.includes(kw), `llms-full.txt contains zero sensitive credentials (${kw})`);
  });
}

// 3. Audit central AEO Knowledge Base
console.log('\n3. Auditing frontend/src/config/aeoKnowledge.ts...');
const aeoKnowledgePath = path.join(ROOT, 'frontend', 'src', 'config', 'aeoKnowledge.ts');
assert(fs.existsSync(aeoKnowledgePath), 'aeoKnowledge.ts exists');

if (fs.existsSync(aeoKnowledgePath)) {
  const aeoCode = fs.readFileSync(aeoKnowledgePath, 'utf8');
  assert(aeoCode.includes('AEO_KNOWLEDGE'), 'aeoKnowledge.ts exports AEO_KNOWLEDGE constant');
  assert(aeoCode.includes('rrr-cricket-club-kidawali-faridabad'), 'AEO model defines RRR venue');
  assert(aeoCode.includes('playnow-cricket-ground'), 'AEO model defines Playnow venue');
  assert(aeoCode.includes('ab-cricket-ground'), 'AEO model defines AB venue');
  assert(aeoCode.includes('live-matches'), 'AEO model defines live-matches service');
  assert(aeoCode.includes('jersey-builder'), 'AEO model defines jersey-builder service');
  assert(aeoCode.includes('kit-builder'), 'AEO model defines kit-builder service');
  assert(aeoCode.includes('coaches'), 'AEO model defines coaches service');
  assert(aeoCode.includes('store'), 'AEO model defines store service');
  assert(aeoCode.includes('capture'), 'AEO model defines capture service');
  assert(aeoCode.includes('toss'), 'AEO model defines toss service');
  assert(aeoCode.includes('tournaments'), 'AEO model defines tournaments service');
  assert(aeoCode.includes('become-vendor'), 'AEO model defines become-vendor service');
}

// 4. Audit FAQSection and SEO.tsx support for FAQPage Schema
console.log('\n4. Auditing FAQPage Schema & FAQSection component...');
const seoCompPath = path.join(ROOT, 'frontend', 'src', 'components', 'common', 'SEO.tsx');
assert(fs.existsSync(seoCompPath), 'SEO.tsx component exists');
if (fs.existsSync(seoCompPath)) {
  const seoCode = fs.readFileSync(seoCompPath, 'utf8');
  assert(seoCode.includes('faqJsonLd'), 'SEO.tsx accepts faqJsonLd prop');
  assert(seoCode.includes("'@type': 'FAQPage'") || seoCode.includes('"@type": "FAQPage"'), 'SEO.tsx constructs Schema.org FAQPage structured data');
}

const faqCompPath = path.join(ROOT, 'frontend', 'src', 'components', 'common', 'FAQSection.tsx');
assert(fs.existsSync(faqCompPath), 'FAQSection.tsx component exists');

// 5. Audit Public Pages for AEO FAQ / Answer Integration
console.log('\n5. Auditing public pages for FAQPage & AEO direct answer integration...');
const pagesToAudit = [
  { file: 'frontend/src/pages/Home.tsx', name: 'Home.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/Venues.tsx', name: 'Venues.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/VenueDetail.tsx', name: 'VenueDetail.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/LiveMatches.tsx', name: 'LiveMatches.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/Shop.tsx', name: 'Shop.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/JerseyBuilder/index.jsx', name: 'JerseyBuilder/index.jsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/KitBuilder.tsx', name: 'KitBuilder.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/Coaches.tsx', name: 'Coaches.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/Tournaments.tsx', name: 'Tournaments.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/BecomeVendor.tsx', name: 'BecomeVendor.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/Capture.tsx', name: 'Capture.tsx', check: 'faqJsonLd' },
  { file: 'frontend/src/pages/Toss.tsx', name: 'Toss.tsx', check: 'faqJsonLd' },
];

pagesToAudit.forEach((p) => {
  const pagePath = path.join(ROOT, p.file);
  assert(fs.existsSync(pagePath), `${p.name} exists`);
  if (fs.existsSync(pagePath)) {
    const code = fs.readFileSync(pagePath, 'utf8');
    assert(code.includes(p.check), `${p.name} incorporates ${p.check} structured data`);
  }
});

console.log('\n==================================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED:       ${passedChecks}`);
console.log(`FAILED:       ${failedChecks}`);
console.log('==================================================');

if (failedChecks > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL AEO CHECKS PASSED!\n');
}
