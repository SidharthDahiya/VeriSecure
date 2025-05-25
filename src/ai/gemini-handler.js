// src/ai/gemini-handler.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// The API key is provided, but ideally should be in an .env file for security
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyD1BeUUpKOtxzW2j84g4LcxRbF_pwW39k4";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

async function analyzeContract(contractCode) {
  try {
    // Use the gemini-2.0-flash model instead of gemini-pro
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
