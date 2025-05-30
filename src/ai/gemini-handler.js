// src/ai/gemini-handler.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();


const API_KEY = process.env.GEMINI_API_KEY || "ENTER API KEY";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

async function analyzeContract(contractCode) {
  try {
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a smart contract security expert specialized in auditing Solidity code. 
    Analyze the provided contract for security vulnerabilities and provide a detailed report.
    
    ${contractCode}`;

    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const endTime = Date.now();

    return {
      analysis: text,
      model: "gemini-2.0-flash",
      processingTime: {
        total_tokens: "N/A for Gemini API",
        elapsed_ms: endTime - startTime
      }
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error.message);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
}

module.exports = {
  analyzeContract
};
