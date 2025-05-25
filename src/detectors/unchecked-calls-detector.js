// src/detectors/unchecked-calls-detector.js
const { visit } = require('@solidity-parser/parser');

function detect(ast, contractCode) {
  console.log('Checking for unchecked external calls...');
  const issues = [];

  // Look for external calls without return value checks
  visit(ast, {
    FunctionCall(node) {
      if (node.expression &&
          node.expression.memberName &&
          ['call', 'send'].includes(node.expression.memberName)) {

        // Check parent nodes to see if the return value is checked
        let isReturnValueChecked = false;

        // This is a simplified check - a proper implementation would need to trace
        // the call up through the AST to see if the return value is used in a condition

        if (!isReturnValueChecked) {
          issues.push({
            detector: 'unchecked-call',
            severity: 'medium',
            description: 'Unchecked return value from external call',
            line: node.loc.start.line,
            details: `Return value from ${node.expression.memberName} is not checked, which could lead to silent failures.`
          });
        }
      }
    }
  });

  return issues;
}

module.exports = {
  detect
};
