// web/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const http = require('http');
const socketIo = require('socket.io');
const { auditContract } = require('../src/index');

// Setup express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/reports', express.static(path.join(__dirname, 'public', 'reports')));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads');
      fs.ensureDirSync(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const validExtensions = ['.sol', '.cairo'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (validExtensions.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only .sol and .cairo files are allowed'));
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to upload and audit a contract
app.post('/api/audit', upload.single('contract'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const contractPath = req.file.path;
    const useAI = req.body.useAI === 'true';

    // Notify client that audit has started
    io.emit('auditStatus', {
      status: 'upload',
      message: 'Contract uploaded successfully',
      progress: 10
    });

    // Emit parsing status after a short delay
    setTimeout(() => {
      io.emit('auditStatus', {
        status: 'parsing',
        message: 'Parsing contract code...',
        progress: 25
      });
    }, 500);

    // Emit analysis status after another delay
    setTimeout(() => {
      io.emit('auditStatus', {
        status: 'analysis',
        message: 'Running vulnerability detectors...',
        progress: 50
      });
    }, 1500);

    // Run the audit
    const auditResult = await auditContract(contractPath, { useAI });

    // If AI is used, emit AI status
    if (useAI) {
      io.emit('auditStatus', {
        status: 'ai',
        message: 'Processing with Gemini AI...',
        progress: 75
      });

      // Allow time for UI to update before completing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate PDF if requested
    let pdfPath = null;
    if (req.body.generatePdf === 'true') {
      try {
        io.emit('auditStatus', {
          status: 'report',
          message: 'Generating PDF report...',
          progress: 90
        });

        const { generatePdfReport } = require('../src/reporter/pdf-generator');
        const pdfDir = path.join(__dirname, 'public', 'reports');
        fs.ensureDirSync(pdfDir);

        pdfPath = path.join(pdfDir, `report-${Date.now()}.pdf`);
        await generatePdfReport(auditResult, pdfPath);

        const relativePdfPath = path.relative(path.join(__dirname, 'public'), pdfPath);
        pdfPath = `/${relativePdfPath.replace(/\\/g, '/')}`;
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
      }
    }

    // Notify client that audit is complete
    io.emit('auditStatus', {
      status: 'completed',
      message: 'Audit completed successfully',
      progress: 100
    });

    // Short delay before sending response to ensure status updates are seen
    setTimeout(() => {
      res.json({
        success: true,
        result: auditResult,
        pdfUrl: pdfPath
      });
    }, 500);

  } catch (error) {
    console.error('Audit error:', error);
    io.emit('auditStatus', {
      status: 'failed',
      message: error.message,
      progress: 0
    });
    res.status(500).json({ error: error.message });
  }
});


// API endpoint to generate PDF from existing results
app.post('/api/generate-pdf', express.json(), async (req, res) => {
  try {
    const { results } = req.body;

    if (!results) {
      return res.status(400).json({ error: 'No results provided' });
    }

    // Ensure code content is properly formatted
    if (results.issues) {
      Object.values(results.issues).forEach(issueArray => {
        if (Array.isArray(issueArray)) {
          issueArray.forEach(issue => {
            // Ensure code content is properly escaped
            if (issue.details) {
              issue.details = issue.details.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
          });
        }
      });

    // API endpoint to get contract code
app.get('/api/contract-code', async (req, res) => {
  try {
    const contractPath = req.query.path;

    if (!contractPath) {
      return res.status(400).send('No contract path provided');
    }

    if (!fs.existsSync(contractPath)) {
      return res.status(404).send('Contract file not found');
    }

    const contractCode = await fs.readFile(contractPath, 'utf8');
    res.set('Content-Type', 'text/plain');
    res.send(contractCode);
  } catch (error) {
    console.error('Error reading contract code:', error);
    res.status(500).send('Error reading contract file');
  }
});

    }

    // Generate PDF
    const { generatePdfReport } = require('../src/reporter/pdf-generator');
    const pdfDir = path.join(__dirname, 'public', 'reports');
    await fs.ensureDir(pdfDir);

    const pdfPath = path.join(pdfDir, `report-${Date.now()}.pdf`);
    await generatePdfReport(results, pdfPath);

    const relativePath = path.relative(path.join(__dirname, 'public'), pdfPath);
    const pdfUrl = `/${relativePath.replace(/\\/g, '/')}`;

    res.json({
      success: true,
      pdfUrl
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
