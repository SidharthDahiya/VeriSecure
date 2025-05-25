// src/detectors/access-control-detector.js
const { visit } = require('@solidity-parser/parser');

function detect(ast, contractCode) {
  console.log('Checking for access control issues...');
  const issues = [];

  // Check for functions that modify state but don't have access control
  visit(ast, {
    ContractDefinition(node) {
      const contractName = node.name;
      const hasOwnerVariable = node.subNodes.some(
        n => n.nodeType === 'VariableDeclaration' &&
             (n.name === 'owner' || n.name === '_owner')
      );

      // Check all functions in the contract
      node.subNodes.forEach(subNode => {
        if (subNode.nodeType === 'FunctionDefinition' &&
            !subNode.isConstructor &&
            subNode.visibility !== 'private' &&
            subNode.visibility !== 'internal') {

          // Check if function modifies state
          let modifiesState = false;
          visit(subNode, {
            Assignment: () => { modifiesState = true; }
          });

          // Check if function has access control
          const hasAccessControl =
            subNode.modifiers.some(m =>
              ['onlyOwner', 'onlyAdmin', 'onlyRole'].some(role =>
                m.name.includes(role)
              )
            ) ||
            hasAccessControlCheck(subNode);

          if (modifiesState && !hasAccessControl) {
            issues.push({
              detector: 'access-control',
              severity: 'high',
              description: 'Missing access control',
              function: subNode.name,
              line: subNode.loc.start.line,
              details: `Function ${subNode.name} modifies state but doesn't have access control checks.`
            });
          }
        }
      });
    }
  });

  return issues;
}

// Helper to check if function body has access control checks
function hasAccessControlCheck(functionNode) {
  let hasCheck = false;

  // Look for statements like require(msg.sender == owner)
  visit(functionNode, {
    FunctionCall(node) {
      if (node.expression && node.expression.name === 'require') {
        const args = node.arguments[0];
        if (args && args.nodeType === 'BinaryOperation') {
          // Check for msg.sender comparison
          if (isMessageSenderCheck(args)) {
            hasCheck = true;
          }
        }
      }
    }
  });

  return hasCheck;
}

// Helper to identify msg.sender checks
function isMessageSenderCheck(node) {
  if (node.nodeType !== 'BinaryOperation') return false;

  if (['==', '!='].includes(node.operator)) {
    // Check if either side is msg.sender
    return (
      (node.left.nodeType === 'MemberAccess' &&
       node.left.expression &&
       node.left.expression.name === 'msg' &&
       node.left.memberName === 'sender') ||
      (node.right.nodeType === 'MemberAccess' &&
       node.right.expression &&
       node.right.expression.name === 'msg' &&
       node.right.memberName === 'sender')
    );
  }

  return false;
}

module.exports = {
  detect
};
