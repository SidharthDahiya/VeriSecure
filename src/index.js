// src/index.js
const fs = require('fs-extra');
const path = require('path');
const parser = require('./parser/solidity-parser');
const detectors = require('./detectors');
const reporter = require('./reporter');
// Updated import to use Gemini handler
const aiHandler = require('./ai/gemini-handler');

async function auditContract(contractPath, options = { useAI: false }) {
  try {
    console.log(`Auditing smart contract: ${contractPath}`);

    // Read contract code
    const contractCode = await fs.readFile(contractPath, 'utf8');

    // Parse the contract
    const ast = parser.parse(contractCode);

    // Run detectors
    const issues = await detectors.runAll(ast, contractCode);

    // Generate basic report
    let report = reporter.generateReport(contractPath, issues);

    // If AI is enabled, enhance the report with AI analysis using Gemini
    if (options.useAI) {
      console.log('Running AI analysis with Gemini API...');
      try {
        const aiAnalysis = await aiHandler.analyzeContract(contractCode);
        report = reporter.enhanceReportWithAI(report, aiAnalysis);
      } catch (aiError) {
        console.error(`AI analysis failed: ${aiError.message}`);
        report.aiError = aiError.message;
      }
    }

    return report;
  } catch (error) {
    console.error(`Error auditing contract: ${error.message}`);
    throw error;
  }
}

module.exports = {
  auditContract
};
