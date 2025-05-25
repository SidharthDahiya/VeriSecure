// src/parser/solidity-parser.js
const solidityParser = require('@solidity-parser/parser');

function parse(code) {
  try {
    // Parse the solidity code to AST
    const ast = solidityParser.parse(code, { loc: true, range: true });
    return ast;
  } catch (error) {
    console.error('Error parsing contract:', error.message);
    throw new Error(`Parsing error: ${error.message}`);
  }
}

module.exports = {
  parse
};
