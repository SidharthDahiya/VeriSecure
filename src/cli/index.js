#!/usr/bin/env node
// src/cli/index.js
const { program } = require('commander');
const fs = require('fs-extra');
const path = require('path');
const { auditContract } = require('../index');

let pdfGenerator;
try {
  pdfGenerator = require('../reporter/pdf-generator');
  console.log("PDF generation capability loaded successfully");
} catch (e) {
  console.log("PDF generation not available. Install puppeteer with: npm install puppeteer");
}

program
  .name('verisecure')
  .description('VeriSecure: Advanced smart contract security auditing tool')
  .version('1.0.0');

program
  .argument('<contract-path>', 'Path to the smart contract file')
  .option('-o, --output <path>', 'Output report to JSON file')
  .option('--ai', 'Use Gemini AI to enhance the analysis')
  // Fix: Changed option definition to properly handle default values
  .option('--pdf [path]', 'Generate PDF report (default: audit_report.pdf)')
  .action(async (contractPath, options) => {
    try {
      // Validate file exists
      if (!fs.existsSync(contractPath)) {
        console.error(`Error: Contract file not found at ${contractPath}`);
        process.exit(1);
      }

      // Run the audit
      const report = await auditContract(contractPath, { useAI: !!options.ai });

      // Output to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        console.log(`Saving JSON report to ${outputPath}...`);
        await fs.writeJson(outputPath, report, { spaces: 2 });
        console.log(`✅ JSON report saved to ${outputPath}`);
      }

      // Generate PDF report if requested
      if (options.pdf) {
        if (!pdfGenerator) {
          console.error('PDF generation is not available. Install puppeteer with: npm install puppeteer');
        } else {
          // FIX: Handle the case when options.pdf is boolean true
          const pdfPath = options.pdf === true ? 'audit_report.pdf' : options.pdf;
          const resolvedPdfPath = path.resolve(pdfPath);

          console.log(`\n📝 Generating PDF report at ${resolvedPdfPath}...`);

          try {
            await pdfGenerator.generatePdfReport(report, resolvedPdfPath);
            console.log(`\n✅ PDF report successfully generated at ${resolvedPdfPath}`);
          } catch (error) {
            console.error(`\n❌ PDF generation failed: ${error.message}`);
            console.error('Make sure you have all required dependencies installed:');
            console.error('npm install puppeteer marked highlight.js');
          }
        }
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
