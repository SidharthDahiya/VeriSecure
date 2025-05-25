// src/detectors/overflow-underflow-detector.js
const { visit } = require('@solidity-parser/parser');

function detect(ast, contractCode) {
  console.log('Checking for arithmetic overflow/underflow vulnerabilities...');
  const issues = [];

  // Check if using SafeMath or Solidity 0.8+
  const usesSafeMath = contractCode.includes('SafeMath') ||
                        contractCode.includes('pragma solidity ^0.8') ||
                        contractCode.includes('pragma solidity >=0.8');

  if (!usesSafeMath) {
    // Look for arithmetic operations on uint/int values
    visit(ast, {
      BinaryOperation(node) {
        if (['+', '-', '*'].includes(node.operator)) {
          issues.push({
            detector: 'overflow-underflow',
            severity: 'medium',
            description: 'Potential arithmetic overflow/underflow',
            line: node.loc.start.line,
            details: `Arithmetic operation ${node.operator} without using SafeMath or Solidity 0.8+ could lead to overflow/underflow.`
          });
        }
      }
    });
  }

  return issues;
}

module.exports = {
  detect
};
