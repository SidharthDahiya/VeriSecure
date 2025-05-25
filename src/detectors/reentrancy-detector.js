// src/detectors/reentrancy-detector.js
const { visit } = require('@solidity-parser/parser');

function detect(ast, contractCode) {
  console.log('Checking for reentrancy vulnerabilities...');
  const issues = [];

  // Function to check if external calls are followed by state changes
  visit(ast, {
    FunctionDefinition(node) {
      let hasExternalCall = false;
      let stateChangesAfterCall = [];

      // Simplified detection - look for external calls followed by state changes
      visit(node, {
        FunctionCall(callNode) {
          // Check for calls to external contracts (.call, .send, .transfer)
          if (callNode.expression &&
              callNode.expression.memberName &&
              ['call', 'send', 'transfer'].includes(callNode.expression.memberName)) {
            hasExternalCall = true;
          }
        },

        // After finding an external call, check for state changes
        Assignment(assignNode) {
          if (hasExternalCall) {
            stateChangesAfterCall.push({
              line: assignNode.loc.start.line,
              column: assignNode.loc.start.column
            });
          }
        }
      });

      if (stateChangesAfterCall.length > 0) {
        issues.push({
          detector: 'reentrancy',
          severity: 'high',
          description: 'Potential reentrancy vulnerability detected. State changes after external call.',
          function: node.name,
          line: node.loc.start.line,
          details: `Function ${node.name} makes external calls and then changes state. This pattern can lead to reentrancy attacks.`,
          stateChangesLocations: stateChangesAfterCall
        });
      }
    }
  });

  return issues;
}

module.exports = {
  detect
};
