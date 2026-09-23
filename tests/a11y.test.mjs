import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runAxeOnHtml(htmlPath, description, options = {}) {
  console.log(`\n========================================`);
  console.log(`Running axe-core on: ${description} (${htmlPath})`);
  console.log(`========================================`);

  const fullPath = path.resolve(rootDir, htmlPath);
  const htmlContent = fs.readFileSync(fullPath, 'utf8');

  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost:8080/'
  });

  const { document, window } = dom.window;

  if (options.mutateDom) {
    options.mutateDom(document, window);
  }

  const results = await axe.run(document.documentElement, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
    },
    rules: {
      // Color contrast can't be computed accurately in JSDOM without real style layout rendering
      'color-contrast': { enabled: false }
    }
  });

  console.log(`\n[Axe Results Summary for ${description}]`);
  console.log(`- Passes: ${results.passes.length}`);
  console.log(`- Inapplicable: ${results.inapplicable.length}`);
  console.log(`- Incomplete: ${results.incomplete.length}`);
  console.log(`- Violations: ${results.violations.length}`);

  if (results.violations.length > 0) {
    console.error(`\n❌ Found ${results.violations.length} accessibility violation(s):`);
    results.violations.forEach((violation, idx) => {
      console.error(`\n  ${idx + 1}. [${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.help}`);
      console.error(`     Help URL: ${violation.helpUrl}`);
      console.error(`     Nodes affected: ${violation.nodes.length}`);
      violation.nodes.forEach((node, nodeIdx) => {
        console.error(`       (${nodeIdx + 1}) Target: ${node.target.join(', ')}`);
        console.error(`           HTML: ${node.html}`);
        console.error(`           Failure summary: ${node.failureSummary}`);
      });
    });
    return false;
  } else {
    console.log(`\n✅ 0 axe-core violations found! All criteria satisfied.`);
    return true;
  }
}

async function runTestSuite() {
  let allPassed = true;

  // Test 1: Static index.html structure
  const test1 = await runAxeOnHtml('index.html', 'Index Portal Template');
  if (!test1) allPassed = false;

  // Test 2: PDF.js Viewer HTML
  const test2 = await runAxeOnHtml('package/pdfjs/web/viewer.html', 'Accessible PDF.js Viewer');
  if (!test2) allPassed = false;

  // Test 3: Simulated full rendered portal with header, nav, main content, modals, and footer
  const test3 = await runAxeOnHtml('index.html', 'Full Rendered Portal State with Interactive Components', {
    mutateDom: (document) => {
      // Simulate rendered header with title and dropdowns
      const headerLeft = document.getElementById('view_header_left');
      if (headerLeft) {
        headerLeft.innerHTML = `
          <h1 id="main-heading" class="title">Class 10th - Mathematics - Real Numbers</h1>
          <div class="motto" aria-label="Portal Edition">NEP 2020 Compliant Educational Portal</div>
        `;
      }

      // Simulate rendered toolbar
      const toprow = document.getElementById('toprow');
      if (toprow) {
        toprow.innerHTML = `
          <div class="a11y-toolbar" role="region" aria-label="Accessibility Settings">
            <span class="a11y-toolbar-label" id="a11y-tb-label" aria-hidden="true">Accessibility:</span>
            <div class="a11y-btn-group" role="group" aria-labelledby="a11y-tb-label">
              <button id="btn-font-decrease" type="button" class="a11y-btn" aria-label="Decrease text size (A-)">A-</button>
              <button id="btn-font-normal" type="button" class="a11y-btn active" aria-label="Normal text size (100%)">A</button>
              <button id="btn-font-increase" type="button" class="a11y-btn" aria-label="Increase text size (125%)">A+</button>
              <button id="btn-font-largest" type="button" class="a11y-btn" aria-label="Largest text size (150%)">A++</button>
              <button id="btn-contrast-toggle" type="button" class="a11y-btn" aria-pressed="false" aria-label="Toggle High Contrast Theme">🌓 Contrast</button>
              <button id="btn-a11y-help" type="button" class="a11y-btn" aria-haspopup="dialog" aria-label="Accessibility Help &amp; Keyboard Shortcuts">❓ Help</button>
            </div>
          </div>
        `;
      }

      // Simulate rendered subjects nav
      const tabsBar = document.getElementById('tabs_bar');
      if (tabsBar) {
        tabsBar.innerHTML = `
          <nav aria-label="Subjects Navigation" class="subjects-nav">
            <div class="tabs-list" role="tablist">
              <button role="tab" id="tab-math" aria-selected="true" class="tab-btn active" tabindex="0">Mathematics</button>
              <button role="tab" id="tab-sci" aria-selected="false" class="tab-btn" tabindex="-1">Science</button>
              <button role="tab" id="tab-eng" aria-selected="false" class="tab-btn" tabindex="-1">English</button>
            </div>
          </nav>
        `;
      }

      // Simulate main content
      const content = document.getElementById('content');
      if (content) {
        content.innerHTML = `
          <div class="content-wrapper">
            <aside class="sidebar" role="complementary" aria-label="Books and Chapters">
              <nav aria-label="Books Directory">
                <h2 id="books-nav-heading">NCERT Textbook</h2>
                <ul class="book-list" role="list">
                  <li><button type="button" class="chapter-btn active" aria-current="page">Chapter 1: Real Numbers</button></li>
                  <li><button type="button" class="chapter-btn">Chapter 2: Polynomials</button></li>
                </ul>
              </nav>
            </aside>
            <div class="panel-container">
              <div role="tablist" aria-label="Chapter Content Sections" class="content-tabs">
                <button role="tab" id="tab-book" aria-selected="true" aria-controls="panel-book" tabindex="0">📖 Read Book</button>
                <button role="tab" id="tab-video" aria-selected="false" aria-controls="panel-video" tabindex="-1">🎥 Video Lessons</button>
                <button role="tab" id="tab-quiz" aria-selected="false" aria-controls="panel-quiz" tabindex="-1">📝 Practice Questions</button>
              </div>
              <div id="panel-book" role="tabpanel" aria-labelledby="tab-book" tabindex="0">
                <div class="pdf-accessible-controls" role="region" aria-label="Accessible PDF Alternative">
                  <button type="button" class="a11y-html-toggle-btn" aria-expanded="false">📖 Read Accessible HTML Version</button>
                  <a href="/data/math/ch1.pdf" class="a11y-pdf-download-link" download>⬇ Download Chapter PDF (Real Numbers, PDF)</a>
                </div>
                <iframe src="/package/pdfjs/web/viewer.html?file=/data/math/ch1.pdf" title="Interactive PDF Viewer - Chapter 1: Real Numbers" width="100%" height="600px"></iframe>
              </div>
            </div>
          </div>
        `;
      }

      // Simulate GIGW footer
      const footer = document.querySelector('footer');
      if (footer) {
        footer.innerHTML = `
          <div class="footer-content">
            <div class="footer-links" role="navigation" aria-label="Footer Policies and Information">
              <a href="#accessibility-statement" id="link-a11y-statement" role="button">Accessibility Statement</a>
              <a href="#help-shortcuts" id="link-shortcuts" role="button">Keyboard Shortcuts</a>
              <a href="#sitemap" id="link-sitemap" role="button">Sitemap</a>
              <a href="#feedback" id="link-feedback" role="button">Accessibility Feedback</a>
              <a href="#privacy" id="link-privacy" role="button">Privacy Policy</a>
              <a href="#copyright" id="link-copyright" role="button">Copyright Policy</a>
              <a href="#terms" id="link-terms" role="button">Terms &amp; Conditions</a>
              <a href="#hyperlink" id="link-hyperlink" role="button">Hyperlinking Policy</a>
            </div>
            <div class="footer-meta">
              <p>Easy Learning Portal — Compliant with GIGW 3.0 &amp; WCAG 2.1 Level AA Standards.</p>
              <p>Last Reviewed / Updated: 22 September 2026</p>
            </div>
          </div>
        `;
      }
    }
  });
  if (!test3) allPassed = false;

  console.log(`\n========================================`);
  if (allPassed) {
    console.log(`🎉 ALL ACCESSIBILITY AUTOMATED TESTS PASSED!`);
    console.log(`========================================\n`);
    process.exit(0);
  } else {
    console.error(`🚨 SOME ACCESSIBILITY TESTS FAILED!`);
    console.log(`========================================\n`);
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
