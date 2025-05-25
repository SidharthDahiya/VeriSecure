// src/detectors/index.js
const reentrancyDetector = require('./reentrancy-detector');
const overflowUnderflowDetector = require('./overflow-underflow-detector');
const uncheckedCallsDetector = require('./unchecked-calls-detector');
const accessControlDetector = require('./access-control-detector');

async function runAll(ast, contractCode) {
  console.log('Running vulnerability detectors...');

  const allIssues = [];

  // Run each detector
  const detectors = [
    reentrancyDetector,
    overflowUnderflowDetector,
    uncheckedCallsDetector,
    accessControlDetector
  ];

  for (const detector of detectors) {
    const issues = await detector.detect(ast, contractCode);
    allIssues.push(...issues);
  }

  return allIssues;
}

module.exports = {
  runAll
};
