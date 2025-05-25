// src/reporter/pdf-generator.js
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

async function generatePdfReport(report, outputPath) {
  try {
    console.log("Starting PDF generation...");

    // Process markdown content for AI analysis
    let aiAnalysisHtml = '';
    if (report.ai && report.ai.analysis) {
      const analysis = report.ai.analysis.analysis;
      try {
        const marked = require('marked');
        aiAnalysisHtml = marked.parse(analysis);
      } catch (e) {
        // Simple markdown conversion if marked is not available
        aiAnalysisHtml = analysis
          .replace(/## (.*)/g, '<h3>$1</h3>')
          .replace(/# (.*)/g, '<h2>$1</h2>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/``````/g, '<pre><code>$1</code></pre>');
      }
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>VeriSecure Audit Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto+Mono&display=swap');
        
        :root {
          --primary-color: #4a6ee0;
          --high-severity: #ff5252;
          --medium-severity: #ffab40;
          --low-severity: #29b6f6;
          --info-severity: #66bb6a;
          --text-color: #333;
          --background-color: #fff;
          --code-bg: #f5f7fa;
          --border-color: #e0e0e0;
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Open Sans', sans-serif;
          margin: 0;
          padding: 0;
          color: var(--text-color);
          background-color: var(--background-color);
          line-height: 1.6;
          font-size: 14px;
          width: 100%;
        }
        
        .container {
          width: 100%;
          max-width: 100%;
          padding: 0;
          margin: 0 auto;
        }
        
        .report-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid var(--border-color);
        }
        
        h1 {
          color: var(--primary-color);
          font-size: 26px;
          margin: 0 0 10px 0;
        }
        
        h2 {
          color: var(--primary-color);
          font-size: 20px;
          margin: 25px 0 15px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid var(--border-color);
        }
        
        h3 {
          font-size: 18px;
          margin: 20px 0 10px 0;
        }
        
        h4 {
          font-size: 16px;
          margin: 15px 0 8px 0;
        }
        
        .metadata {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        
        .metadata-item {
          margin-bottom: 5px;
          flex-basis: 48%;
        }
        
        .severity-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 15px 0;
        }
        
        .severity-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 600;
          color: white; /* Ensure text is visible on colored backgrounds */
        }
        
        .high {
          background-color: var(--high-severity);
        }
        
        .medium {
          background-color: var(--medium-severity);
        }
        
        .low {
          background-color: var(--low-severity);
        }
        
        .info {
          background-color: var(--info-severity);
        }
        
        .issue-list {
          margin-top: 15px;
          width: 100%;
        }
        
        .issue-card {
          background-color: #f9f9f9;
          border-left: 4px solid #ddd;
          margin-bottom: 15px;
          padding: 12px;
          border-radius: 0 4px 4px 0;
          color: #333; /* Ensure text is visible */
        }
        
        .issue-card.high {
          border-left-color: var(--high-severity);
        }
        
        .issue-card.medium {
          border-left-color: var(--medium-severity);
        }
        
        .issue-card.low {
          border-left-color: var(--low-severity);
        }
        
        .issue-card.info {
          border-left-color: var(--info-severity);
        }
        
        .issue-title {
          font-size: 16px;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 8px;
        }
        
        .issue-meta {
          display: grid;
          grid-template-columns: 100px 1fr;
          margin-bottom: 8px;
          row-gap: 4px;
        }
        
        .issue-meta-label {
          font-weight: 600;
          color: #555;
        }
        
        pre, code {
          font-family: 'Roboto Mono', monospace;
          font-size: 12px; /* Reduced font size for code */
        }
        
        pre {
          background-color: var(--code-bg);
          border-radius: 4px;
          padding: 10px;
          margin: 10px 0;
          border: 1px solid var(--border-color);
          white-space: pre-wrap; /* Allow wrapping for long code lines */
          word-break: break-all; /* Break words to prevent overflow */
          overflow-x: visible; /* Ensure content doesn't get cut off */
          width: 100%; /* Use full width */
          max-width: 100%; /* Limit width to container */
        }
        
        code {
          background-color: var(--code-bg);
          padding: 2px 4px;
          border-radius: 3px;
          word-break: break-all; /* Break words to prevent overflow */
        }
        
        .ai-analysis {
          margin-top: 25px;
          background-color: #f8f9fe;
          border-radius: 6px;
          padding: 15px;
          border: 1px solid #e8eaf6;
        }
        
        .ai-analysis h2 {
          color: #5c6bc0;
          border-bottom-color: #c5cae9;
        }
        
        .ai-analysis h3 {
          color: #3949ab;
        }
        
        .ai-analysis pre {
          background-color: #eceff1;
          border-color: #cfd8dc;
          width: 100%; /* Use full width */
          white-space: pre-wrap; /* Allow wrapping */
        }
        
        .ai-analysis code {
          background-color: #eceff1;
          word-wrap: break-word;
        }
        
        .ai-analysis table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        .ai-analysis th, .ai-analysis td {
          border: 1px solid #cfd8dc;
          padding: 6px 8px;
          text-align: left;
        }
        
        .ai-analysis th {
          background-color: #e8eaf6;
        }
        
        .ai-analysis tr:nth-child(even) {
          background-color: #f5f7fa;
        }
        
        .ai-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          font-size: 12px;
          color: #757575;
          border-top: 1px solid #e0e0e0;
          padding-top: 10px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: left;
        }
        
        th {
          background-color: #f2f2f2;
        }
        
        tr:nth-child(even) {
          background-color: #f8f8f8;
        }
        
        ul, ol {
          margin-left: 15px;
          padding-left: 15px;
        }
        
        li {
          margin-bottom: 3px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="report-header">
          <h1>🛡️ VeriSecure Audit Report</h1>
        </div>
        
        <div class="metadata">
          <div class="metadata-item"><strong>Contract:</strong> ${report.contractPath}</div>
          <div class="metadata-item"><strong>Date:</strong> ${new Date(report.timestamp).toLocaleString()}</div>
          <div class="metadata-item"><strong>Total Issues:</strong> ${report.issueCount}</div>
        </div>
        
        <h2>📊 Vulnerability Summary</h2>
        
        <div class="severity-summary">
          <div class="severity-badge high">🔴 High: ${report.summary.severityCounts.high}</div>
          <div class="severity-badge medium">🟠 Medium: ${report.summary.severityCounts.medium}</div>
          <div class="severity-badge low">🔵 Low: ${report.summary.severityCounts.low}</div>
          <div class="severity-badge info">ℹ️ Info: ${report.summary.severityCounts.informational || 0}</div>
        </div>
        
        <h3>Issues by Detector</h3>
        <ul>
          ${Object.entries(report.summary.detectorCounts).map(([detector, count]) => 
            `<li><strong>${detector}:</strong> ${count}</li>`
          ).join('')}
        </ul>
        
        <h2>🔍 Issues Details</h2>
        
        ${['high', 'medium', 'low', 'informational'].map(severity => {
          const issues = report.issues[severity] || [];
          if (issues.length === 0) return '';
          
          const severityEmoji = severity === 'high' ? '🔴' : 
                               severity === 'medium' ? '🟠' : 
                               severity === 'low' ? '🔵' : 'ℹ️';
          
          return `
            <h3>${severityEmoji} ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity Issues</h3>
            <div class="issue-list">
              ${issues.map(issue => `
                <div class="issue-card ${severity}">
                  <h4 class="issue-title">${severityEmoji} ${issue.description}</h4>
                  
                  <div class="issue-meta">
                    <span class="issue-meta-label">Line:</span>
                    <span>${issue.line}</span>
                    
                    ${issue.function ? `
                    <span class="issue-meta-label">Function:</span>
                    <span>${issue.function}</span>
                    ` : ''}
                    
                    <span class="issue-meta-label">Detector:</span>
                    <span>${issue.detector}</span>
                  </div>
                  
                  <h4>Details:</h4>
                  <pre><code>${issue.details}</code></pre>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
        
        ${report.ai && report.ai.analysis ? `
          <div class="page-break"></div>
          <div class="ai-analysis">
            <h2>🤖 Gemini AI Analysis</h2>
            ${aiAnalysisHtml}
            
            <div class="ai-meta">
              <div><strong>Analysis performed using:</strong> ${report.ai.analysis.model}</div>
              <div><strong>Processing time:</strong> ${report.ai.analysis.processingTime.elapsed_ms}ms</div>
            </div>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
    `;

    // Launch a headless browser with specific options
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set content with longer timeout
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Generate PDF with reduced margins to use more page width
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',  // Reduced from 20mm
        bottom: '10mm',
        left: '10mm'    // Reduced from 20mm
      },
      displayHeaderFooter: false,
      preferCSSPageSize: false
    });

    await browser.close();

    console.log(`PDF report successfully created at: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('PDF GENERATION ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}

module.exports = { generatePdfReport };
