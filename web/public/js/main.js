// web/public/js/main.js - Complete corrected version
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, initializing UI");

  // DOM Elements - Core
  const auditForm = document.getElementById('audit-form');
  const contractFileInput = document.getElementById('contract-file');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const removeFileBtn = document.getElementById('remove-file');
  const statusSection = document.getElementById('status-section');
  const resultsSection = document.getElementById('results-section');
  const statusTitle = document.getElementById('status-title');
  const statusMessage = document.getElementById('status-message');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const progressStage = document.getElementById('progress-stage');
  const submitBtn = document.getElementById('submit-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const dropzone = document.getElementById('dropzone');

  // Summary elements
  const highCount = document.getElementById('high-count');
  const mediumCount = document.getElementById('medium-count');
  const lowCount = document.getElementById('low-count');
  const infoCount = document.getElementById('info-count');
  const contractName = document.getElementById('contract-name');
  const auditDate = document.getElementById('audit-date');
  const totalIssues = document.getElementById('total-issues');
  const detectorList = document.getElementById('detector-list');

  // Vulnerabilities elements
  const vulnerabilityList = document.getElementById('vulnerability-list');
  const severityFilter = document.getElementById('severity-filter');
  const vulnSearch = document.getElementById('vuln-search');

  // AI Analysis elements
  const aiContent = document.getElementById('ai-content');
  const aiMeta = document.getElementById('ai-meta');
  const aiModel = document.getElementById('ai-model');
  const aiProcessingTime = document.getElementById('ai-processing-time');

  // Report elements
  const downloadPdfBtn = document.getElementById('download-pdf');
  const generateReportBtn = document.getElementById('generate-report-btn');

  // Socket.IO
  const socket = io();

  // Store audit results
  let auditResults = null;
  let issuesChart = null;

  // Initialize Starknet integration
  let starknetIntegration = null;

  // Initialize Starknet integration
  if (typeof StarknetIntegration !== 'undefined') {
    starknetIntegration = new StarknetIntegration();
    initializeWalletConnection();
  } else {
    console.warn('StarknetIntegration not available - blockchain features disabled');
  }

  // Dark mode toggle
  if (themeToggle) {
    console.log("Dark mode toggle found, setting up event listener");

    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      console.log("Dark mode toggle clicked");

      document.body.classList.toggle('dark-mode');

      if (document.body.classList.contains('dark-mode')) {
        themeToggle.innerHTML = '<i class="bx bx-sun"></i>';
        localStorage.setItem('theme', 'dark');
        console.log("Switched to dark mode");
      } else {
        themeToggle.innerHTML = '<i class="bx bx-moon"></i>';
        localStorage.setItem('theme', 'light');
        console.log("Switched to light mode");
      }
    });

    // Check for saved theme preference on load
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-mode');
      themeToggle.innerHTML = '<i class="bx bx-sun"></i>';
      console.log("Applied saved dark mode");
    }
  } else {
    console.log("Dark mode toggle button not found");
  }

  // File input change
  contractFileInput.addEventListener('change', handleFileSelection);

  // Remove file button
  removeFileBtn.addEventListener('click', () => {
    contractFileInput.value = '';
    fileInfo.style.display = 'none';
    submitBtn.disabled = true;
  });

  // Drag and drop handling
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.add('dragging');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => {
      dropzone.classList.remove('dragging');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length) {
      contractFileInput.files = files;
      handleFileSelection();
    }
  }, false);

  function handleFileSelection() {
    console.log("File selection changed");

    if (contractFileInput.files.length > 0) {
      const file = contractFileInput.files[0];
      const extension = file.name.split('.').pop().toLowerCase();

      if (['sol', 'cairo'].includes(extension)) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'flex';
        submitBtn.disabled = false;
      } else {
        alert('Please select a .sol or .cairo file');
        contractFileInput.value = '';
      }
    } else {
      fileInfo.style.display = 'none';
      submitBtn.disabled = true;
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // Form submission
  auditForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!contractFileInput.files.length) {
      alert('Please select a contract file');
      return;
    }

    // Disable submit button and show status
    submitBtn.disabled = true;
    statusSection.style.display = 'block';
    resultsSection.style.display = 'none';
    updateProgress(10, 'Uploading contract...');
    setActiveStep('upload');

    // Create form data
    const formData = new FormData();
    formData.append('contract', contractFileInput.files[0]);
    formData.append('useAI', document.getElementById('use-ai').checked);
    formData.append('generatePdf', document.getElementById('generate-pdf').checked);

    try {
      // Send request
      const response = await fetch('/api/audit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to audit contract');
      }

      // Parse response
      const result = await response.json();
      auditResults = result.result;

      // Update UI with results
      updateResults(auditResults, result.pdfUrl);

      // Hide status, show results
      statusSection.style.display = 'none';
      resultsSection.style.display = 'block';
      submitBtn.disabled = false;
    } catch (error) {
      console.error('Audit error:', error);
      statusMessage.textContent = `Error: ${error.message}`;
      statusTitle.textContent = 'Audit Failed';
      submitBtn.disabled = false;
    }
  });

  // Socket status updates
  socket.on('auditStatus', (data) => {
    statusMessage.textContent = data.message;

    if (data.progress) {
      updateProgress(data.progress, data.message);
    }

    switch(data.status) {
      case 'upload':
        setActiveStep('upload');
        break;
      case 'parsing':
        setActiveStep('parsing');
        break;
      case 'analysis':
        setActiveStep('analysis');
        break;
      case 'ai':
        setActiveStep('ai');
        break;
      case 'report':
        setActiveStep('report');
        break;
      case 'completed':
        setActiveStep('report');
        // Mark all steps as completed
        document.querySelectorAll('.status-step').forEach(step => {
          step.classList.add('completed');
        });
        break;
      case 'failed':
        statusTitle.textContent = 'Audit Failed';
        break;
    }
  });

  function updateProgress(percent, message) {
    progressBar.style.setProperty('--progress', `${percent}%`);
    progressPercent.textContent = `${percent}%`;
    progressStage.textContent = message;
  }

  function setActiveStep(step) {
    const steps = document.querySelectorAll('.status-step');
    let reached = false;

    steps.forEach(statusStep => {
      const stepId = statusStep.dataset.step;

      if (stepId === step) {
        statusStep.classList.add('active');
        reached = true;
      } else if (!reached) {
        statusStep.classList.remove('active');
        statusStep.classList.add('completed');
      } else {
        statusStep.classList.remove('active');
        statusStep.classList.remove('completed');
      }
    });
  }

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

      // Add active class to clicked tab
      button.classList.add('active');
      const targetTab = document.getElementById(button.dataset.tab);
      targetTab.classList.add('active');
    });
  });

  // Update results in UI
  function updateResults(results, pdfUrl) {
    // Update summary
    highCount.textContent = results.summary.severityCounts.high;
    mediumCount.textContent = results.summary.severityCounts.medium;
    lowCount.textContent = results.summary.severityCounts.low;
    infoCount.textContent = results.summary.severityCounts.informational || 0;

    contractName.textContent = results.contractPath.split('/').pop();
    auditDate.textContent = new Date(results.timestamp).toLocaleString();
    totalIssues.textContent = results.issueCount;

    // Update detector list
    detectorList.innerHTML = '';
    Object.entries(results.summary.detectorCounts).forEach(([detector, count]) => {
      const detectorItem = document.createElement('div');
      detectorItem.className = 'detector-item';
      detectorItem.innerHTML = `
        <span class="detector-name">${detector}</span>
        <span class="detector-count">${count}</span>
      `;
      detectorList.appendChild(detectorItem);
    });

    // Create or update chart
    createIssuesChart(results);

    // Update vulnerabilities
    updateVulnerabilities(results.issues);

    // Update AI analysis if available
    if (results.ai && results.ai.analysis) {
      try {
        // Check if marked is defined
        if (typeof marked !== 'undefined') {
          aiContent.innerHTML = marked.parse(results.ai.analysis.analysis);
        } else {
          // Fallback if marked is not available
          aiContent.innerHTML = `<pre>${results.ai.analysis.analysis}</pre>`;
        }

        // Update AI metadata
        aiModel.textContent = results.ai.analysis.model;
        aiProcessingTime.textContent = `${results.ai.analysis.processingTime.elapsed_ms}ms`;
        aiMeta.style.display = 'flex';

        // Apply syntax highlighting
        document.querySelectorAll('.ai-content pre code').forEach((block) => {
          if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
          }
        });
      } catch (e) {
        console.error("Error rendering AI analysis:", e);
        aiContent.innerHTML = `<p>Error rendering AI analysis. See raw content below:</p>
          <pre>${results.ai.analysis.analysis}</pre>`;
      }
    } else {
      aiContent.innerHTML = '<p class="ai-placeholder">AI analysis was not enabled for this audit.</p>';
      aiMeta.style.display = 'none';
    }

    // Update report tab
    if (pdfUrl) {
      downloadPdfBtn.href = pdfUrl;
      downloadPdfBtn.style.display = 'inline-flex';
      generateReportBtn.style.display = 'none';
    } else {
      downloadPdfBtn.style.display = 'none';
      generateReportBtn.style.display = 'inline-flex';

      generateReportBtn.addEventListener('click', async () => {
        generateReportBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Generating...';
        generateReportBtn.disabled = true;

        try {
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ results: auditResults })
          });

          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }

          const data = await response.json();
          downloadPdfBtn.href = data.pdfUrl;
          downloadPdfBtn.style.display = 'inline-flex';
          downloadPdfBtn.onclick = function() {
            window.open(data.pdfUrl, '_blank');
            return true;
          };
          generateReportBtn.style.display = 'none';
        } catch (error) {
          console.error('PDF generation error:', error);
          alert(`Failed to generate PDF: ${error.message}`);
        } finally {
          generateReportBtn.innerHTML = '<i class="bx bxs-file"></i> Generate Report';
          generateReportBtn.disabled = false;
        }
      });
    }

    // Show blockchain features section after results
    const blockchainFeaturesSection = document.getElementById('blockchain-features-section');
    if (blockchainFeaturesSection) {
      blockchainFeaturesSection.style.display = 'block';
    }

    // Show submit to blockchain button if wallet is connected
    const submitToBlockchainBtn = document.getElementById('submit-to-blockchain');
    if (submitToBlockchainBtn && starknetIntegration && starknetIntegration.connection) {
      submitToBlockchainBtn.style.display = 'inline-flex';
      submitToBlockchainBtn.innerHTML = '<i class="bx bx-upload"></i> Create Blockchain Certificate';
    }
  }

  // STARKNET INTEGRATION FUNCTIONS
  function initializeWalletConnection() {
    const walletBtn = document.getElementById('wallet-connect');
    const viewRegistryBtn = document.getElementById('view-registry');
    const blockchainSection = document.getElementById('blockchain-section');
    const submitToBlockchainBtn = document.getElementById('submit-to-blockchain');

    if (!walletBtn) {
      console.warn('Wallet connect button not found - make sure to update HTML');
      return;
    }

    // Wallet connection
    walletBtn.addEventListener('click', async () => {
      try {
        if (starknetIntegration.connection) {
          // Disconnect
          starknetIntegration.disconnect();
          walletBtn.innerHTML = '<i class="bx bx-wallet"></i> Connect Wallet';
          walletBtn.classList.remove('connected');
          // Hide submit buttons
          if (submitToBlockchainBtn) submitToBlockchainBtn.style.display = 'none';
        } else {
          // Connect
          walletBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Connecting...';
          await starknetIntegration.connectWallet();
          walletBtn.innerHTML = '<i class="bx bx-check"></i> Wallet Connected';
          walletBtn.classList.add('connected');

          // Show submit buttons after connection
          if (submitToBlockchainBtn) {
            submitToBlockchainBtn.style.display = 'inline-flex';
          }

          console.log('🎉 Wallet connected successfully!');
        }
      } catch (error) {
        console.error('Wallet connection failed:', error);
        walletBtn.innerHTML = '<i class="bx bx-wallet"></i> Connect Wallet';
        alert('Failed to connect wallet: ' + error.message);
      }
    });

    // View registry button
    if (viewRegistryBtn) {
      viewRegistryBtn.addEventListener('click', () => {
        // Direct navigation to updated contract address
        window.open('https://sepolia.starkscan.co/contract/0x0455c60412d2e77b1763699575163d8a72c75759b2ca6f7124bbe4237baa974c', '_blank');
      });
    }

    // Submit to blockchain button
    if (submitToBlockchainBtn) {
      submitToBlockchainBtn.addEventListener('click', async () => {
        if (!auditResults) {
          alert('No audit results to submit');
          return;
        }

        try {
          submitToBlockchainBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Submitting...';
          const result = await starknetIntegration.submitAuditToBlockchain(auditResults);

          // Show blockchain section with certificate
          showBlockchainCertificate(result);
          submitToBlockchainBtn.style.display = 'none';

        } catch (error) {
          console.error('Blockchain submission failed:', error);
          alert('Failed to submit to blockchain: ' + error.message);
        } finally {
          submitToBlockchainBtn.innerHTML = '<i class="bx bx-upload"></i> Create Blockchain Certificate';
        }
      });
    }
  }

  function showBlockchainCertificate(result) {
    const blockchainSection = document.getElementById('blockchain-section');
    const txHash = document.getElementById('tx-hash');
    const txLink = document.getElementById('tx-link');
    const auditId = document.getElementById('audit-id');
    const verifyCertificateBtn = document.getElementById('verify-certificate');
    const shareCertificateBtn = document.getElementById('share-certificate');
    const submitToBlockchainBtn = document.getElementById('submit-to-blockchain');

    if (!blockchainSection) {
      console.warn('Blockchain section not found - make sure to update HTML');
      return;
    }

    // Update certificate details
    if (txHash) txHash.textContent = result.transactionHash.substring(0, 16) + '...';
    if (txLink) txLink.href = `https://sepolia.starkscan.co/tx/${result.transactionHash}`;
    if (auditId) auditId.textContent = `#${result.auditId || 'Unknown'}`;

    // Show blockchain section
    blockchainSection.style.display = 'block';

    // Scroll to blockchain section
    blockchainSection.scrollIntoView({ behavior: 'smooth' });

    // Add verification functionality
    if (verifyCertificateBtn) {
      verifyCertificateBtn.addEventListener('click', () => {
        window.open(`https://sepolia.starkscan.co/tx/${result.transactionHash}`, '_blank');
      });
    }

    // Add share functionality
    if (shareCertificateBtn) {
      shareCertificateBtn.style.display = 'inline-flex';
      shareCertificateBtn.addEventListener('click', () => {
        const shareText = `🛡️ Contract audited and verified on Starknet!\n\nView certificate: https://sepolia.starkscan.co/tx/${result.transactionHash}\n\nAudited by VeriSecure`;
        navigator.clipboard.writeText(shareText).then(() => {
          alert('Certificate link copied to clipboard!');
        });
      });
    }

    // Update submit button to show success
    if (submitToBlockchainBtn) {
      submitToBlockchainBtn.innerHTML = '<i class="bx bx-check"></i> Certificate Created';
      submitToBlockchainBtn.disabled = true;
      submitToBlockchainBtn.classList.add('success');
    }

    // Show success alert
    showSuccessAlert(result);
  }

  function showSuccessAlert(result) {
    const alert = document.createElement('div');
    alert.className = 'blockchain-alert success';
    alert.innerHTML = `
      <i class='bx bx-check-circle'></i>
      <div>
        <strong>Audit Certificate Created!</strong><br>
        Your audit has been permanently recorded on Starknet blockchain.
        <a href="https://sepolia.starkscan.co/tx/${result.transactionHash}" target="_blank" style="margin-left: 8px;">View Transaction</a>
      </div>
    `;

    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.insertBefore(alert, resultsSection.firstChild);

      // Remove alert after 10 seconds
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 10000);
    }
  }

  // Create issues chart
  function createIssuesChart(results) {
    const ctx = document.getElementById('issues-chart').getContext('2d');

    if (issuesChart) {
      issuesChart.destroy();
    }

    const data = {
      labels: ['High', 'Medium', 'Low', 'Informational'],
      datasets: [{
        label: 'Issues by Severity',
        data: [
          results.summary.severityCounts.high,
          results.summary.severityCounts.medium,
          results.summary.severityCounts.low,
          results.summary.severityCounts.informational || 0
        ],
        backgroundColor: [
          '#ff5252',
          '#ffab40',
          '#29b6f6',
          '#66bb6a'
        ],
        borderColor: [
          '#ff5252',
          '#ffab40',
          '#29b6f6',
          '#66bb6a'
        ],
        borderWidth: 1
      }]
    };

    issuesChart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Issues by Severity'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  // Update vulnerabilities list
  function updateVulnerabilities(issues) {
    vulnerabilityList.innerHTML = '';

    // Helper to create vulnerability cards
    function createVulnerabilityCard(issue, severity) {
      const severityEmoji = severity === 'high' ? '🔴' :
                           severity === 'medium' ? '🟠' :
                           severity === 'low' ? '🔵' : 'ℹ️';

      const card = document.createElement('div');
      card.className = 'vuln-card';
      card.dataset.severity = severity;
      card.dataset.search = `${issue.description} ${issue.detector} ${issue.function || ''} ${severity}`.toLowerCase();

      const header = document.createElement('div');
      header.className = `vuln-header ${severity}`;
      header.innerHTML = `
        <div class="vuln-title">
          <span>${severityEmoji}</span>
          ${issue.description}
        </div>
        <div class="vuln-info">
          <span class="severity-badge ${severity}">${severity.toUpperCase()}</span>
          <i class="bx bx-chevron-down vuln-arrow"></i>
        </div>
      `;

      const body = document.createElement('div');
      body.className = 'vuln-body';

      const content = document.createElement('div');
      content.className = 'vuln-content';
      content.innerHTML = `
        <div class="vuln-detail">
          <div class="detail-grid">
            <div class="detail-label">Line:</div>
            <div class="detail-value">${issue.line}</div>
            
            ${issue.function ? `
            <div class="detail-label">Function:</div>
            <div class="detail-value">${issue.function}</div>
            ` : ''}
            
            <div class="detail-label">Detector:</div>
            <div class="detail-value">${issue.detector}</div>
          </div>
        </div>
        
        <h4>Details:</h4>
        <div class="code-block">
          <div class="code-header">
            <div class="code-title">Code</div>
            <button class="code-copy">
              <i class="bx bx-copy"></i> Copy
            </button>
          </div>
          <pre><code class="language-solidity">${issue.details}</code></pre>
        </div>
      `;

      // Toggle body on header click
      header.addEventListener('click', () => {
        body.classList.toggle('active');
        header.classList.toggle('active');
      });

      body.appendChild(content);
      card.appendChild(header);
      card.appendChild(body);

      // Setup copy button for this card
      const copyBtn = content.querySelector('.code-copy');
      const codeText = issue.details;

      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(codeText)
          .then(() => {
            copyBtn.innerHTML = '<i class="bx bx-check"></i> Copied!';
            setTimeout(() => {
              copyBtn.innerHTML = '<i class="bx bx-copy"></i> Copy';
            }, 2000);
          });
      });

      return card;
    }

    // Add all vulnerabilities
    ['high', 'medium', 'low', 'informational'].forEach(severity => {
      if (issues[severity] && issues[severity].length > 0) {
        issues[severity].forEach(issue => {
          vulnerabilityList.appendChild(createVulnerabilityCard(issue, severity));
        });
      }
    });

    // No vulnerabilities message
    if (vulnerabilityList.children.length === 0) {
      vulnerabilityList.innerHTML = '<div class="text-center mb-4">No vulnerabilities detected.</div>';
    }

    // Apply syntax highlighting
    document.querySelectorAll('.vuln-content pre code').forEach((block) => {
      if (typeof hljs !== 'undefined') {
        hljs.highlightElement(block);
      }
    });

    // Filter by severity
    severityFilter.addEventListener('change', filterVulnerabilities);

    // Search functionality
    vulnSearch.addEventListener('input', filterVulnerabilities);
  }

  // Filter vulnerabilities based on severity and search
  function filterVulnerabilities() {
    const selectedSeverity = severityFilter.value;
    const searchQuery = vulnSearch.value.toLowerCase();
    const cards = vulnerabilityList.querySelectorAll('.vuln-card');

    cards.forEach(card => {
      const matchesSeverity = selectedSeverity === 'all' || card.dataset.severity === selectedSeverity;
      const matchesSearch = !searchQuery || card.dataset.search.includes(searchQuery);

      if (matchesSeverity && matchesSearch) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });

    // Show message if no results
    const visibleCards = Array.from(cards).filter(card => card.style.display !== 'none');
    if (visibleCards.length === 0 && cards.length > 0) {
      let noResultsEl = vulnerabilityList.querySelector('.no-results');
      if (!noResultsEl) {
        noResultsEl = document.createElement('div');
        noResultsEl.className = 'no-results text-center mb-4';
        vulnerabilityList.appendChild(noResultsEl);
      }
      noResultsEl.textContent = 'No vulnerabilities match your filters.';
      noResultsEl.style.display = 'block';
    } else {
      const noResultsEl = vulnerabilityList.querySelector('.no-results');
      if (noResultsEl) {
        noResultsEl.style.display = 'none';
      }
    }
  }
});
