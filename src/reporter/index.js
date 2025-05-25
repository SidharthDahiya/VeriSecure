// src/reporter/index.js
const chalk = require('chalk');
const fs = require('fs-extra');

function generateReport(contractPath, issues) {
  console.log("DEBUG: Starting basic report generation");
  const report = {
    contractPath,
    timestamp: new Date().toISOString(),
    issueCount: issues.length,
    issues: categorizeIssues(issues),
    summary: generateSummary(issues)
  };

  // Print report to console
  printConsoleReport(report);
  console.log("DEBUG: Basic report generation complete");

  return report;
}

function enhanceReportWithAI(report, aiAnalysis) {
  console.log("DEBUG: Starting AI report enhancement");
  // Create enhanced report with AI findings
  const enhancedReport = {
    ...report,
    ai: {
      analysis: aiAnalysis,
      timestamp: new Date().toISOString()
    }
  };

  // Print AI report section
  printAIReport(aiAnalysis);
  console.log("DEBUG: AI report enhancement complete");

  return enhancedReport;
}

function categorizeIssues(issues) {
  const categorized = {
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low'),
    informational: issues.filter(i => i.severity === 'informational')
  };

  return categorized;
}

function generateSummary(issues) {
  const severityCounts = {
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    informational: issues.filter(i => i.severity === 'informational').length
  };

  const detectorCounts = {};
  issues.forEach(issue => {
    detectorCounts[issue.detector] = (detectorCounts[issue.detector] || 0) + 1;
  });

  return {
    severityCounts,
    detectorCounts
  };
}

function printConsoleReport(report) {
  console.log("DEBUG: Starting console report printing");
  console.log(`DEBUG: Report has ${report.issueCount} issues`);

  console.log('\n' + chalk.bold('====== SMART CONTRACT AUDIT REPORT ======'));
  console.log(chalk.bold(`Contract: ${report.contractPath}`));
  console.log(chalk.bold(`Date: ${new Date(report.timestamp).toLocaleString()}`));
  console.log(chalk.bold(`Total Issues: ${report.issueCount}\n`));

  // Print high severity issues
  console.log(`DEBUG: Printing ${report.issues.high.length} high severity issues`);
  if (report.issues.high.length > 0) {
    console.log(chalk.red.bold(`🔴 HIGH SEVERITY ISSUES: ${report.issues.high.length}`));
    report.issues.high.forEach(issue => {
      printIssue(issue, 'red');
    });
  } else {
    console.log(chalk.green(`✅ No high severity issues found`));
  }

  // Print medium severity issues
  console.log(`DEBUG: Printing ${report.issues.medium.length} medium severity issues`);
  if (report.issues.medium.length > 0) {
    console.log(chalk.yellow.bold(`🟡 MEDIUM SEVERITY ISSUES: ${report.issues.medium.length}`));
    report.issues.medium.forEach(issue => {
      printIssue(issue, 'yellow');
    });
  } else {
    console.log(chalk.green(`✅ No medium severity issues found`));
  }

  // Print low severity issues
  console.log(`DEBUG: Printing ${report.issues.low.length} low severity issues`);
  if (report.issues.low.length > 0) {
    console.log(chalk.blue.bold(`🔵 LOW SEVERITY ISSUES: ${report.issues.low.length}`));
    report.issues.low.forEach(issue => {
      printIssue(issue, 'blue');
    });
  } else {
    console.log(chalk.green(`✅ No low severity issues found`));
  }

  // Print informational issues
  const infoCount = report.issues.informational ? report.issues.informational.length : 0;
  console.log(`DEBUG: Printing ${infoCount} informational issues`);
  if (report.issues.informational && report.issues.informational.length > 0) {
    console.log(chalk.cyan.bold(`ℹ️ INFORMATIONAL ISSUES: ${report.issues.informational.length}`));
    report.issues.informational.forEach(issue => {
      printIssue(issue, 'cyan');
    });
  }

  console.log('\n' + chalk.bold('====== SUMMARY ======'));
  console.log(chalk.bold('Issues by Severity:'));
  console.log(`- High: ${report.summary.severityCounts.high}`);
  console.log(`- Medium: ${report.summary.severityCounts.medium}`);
  console.log(`- Low: ${report.summary.severityCounts.low}`);
  console.log(`- Informational: ${report.summary.severityCounts.informational || 0}`);

  console.log(chalk.bold('\nIssues by Detector:'));
  for (const [detector, count] of Object.entries(report.summary.detectorCounts)) {
    console.log(`- ${detector}: ${count}`);
  }

  console.log("DEBUG: Console report printing complete");
}

function printIssue(issue, color) {
  console.log(chalk[color](`\n[${issue.severity.toUpperCase()}] ${issue.description}`));
  console.log(`  Line: ${issue.line}`);
  if (issue.function) {
    console.log(`  Function: ${issue.function}`);
  }
  console.log(`  Detector: ${issue.detector}`);
  console.log(`  Details: ${issue.details}`);
}

function printAIReport(aiAnalysis) {
  console.log("DEBUG: Starting AI report printing");
  console.log(`DEBUG: AI analysis text length: ${aiAnalysis.analysis.length} characters`);

  console.log('\n' + chalk.magenta.bold('====== GEMINI AI ANALYSIS ======'));

  // Print the complete analysis in chunks to avoid terminal buffer issues
  const chunkSize = 1000;
  const analysisText = aiAnalysis.analysis;

  console.log(chalk.cyan.bold('\n==== FULL GEMINI ANALYSIS (Start) ===='));

  for (let i = 0; i < analysisText.length; i += chunkSize) {
    const chunk = analysisText.slice(i, i + chunkSize);
    console.log(chalk.magenta(chunk));
    console.log(chalk.gray(`---- [${i+chunkSize >= analysisText.length ? 'END' : 'Continued...'}] ----`));
  }

  console.log(chalk.cyan.bold('==== FULL GEMINI ANALYSIS (End) ====\n'));
  console.log(chalk.magenta(`\nAnalysis performed using ${aiAnalysis.model}`));
  console.log(chalk.magenta(`Processing time: ${aiAnalysis.processingTime.elapsed_ms}ms`));

  console.log("DEBUG: AI report printing complete");
}

module.exports = {
  generateReport,
  enhanceReportWithAI
};
