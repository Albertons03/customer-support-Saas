import { testOpenAI } from "./lib/openai";

/**
 * Test the OpenAI integration
 * Run this in the browser console or create a test page
 */
export async function runOpenAITest() {
  console.log("🧪 Testing OpenAI Integration...");
  console.log("=====================================");

  const isWorking = await testOpenAI();

  if (isWorking) {
    console.log("✅ OpenAI integration is working correctly!");
    console.log("You can now use the AI chatbot features.");
  } else {
    console.log("❌ OpenAI integration test failed.");
    console.log("Please check:");
    console.log("1. VITE_OPENAI_API_KEY is set in your .env file");
    console.log("2. Your API key is valid");
    console.log("3. You have credits/quota available");
  }

  console.log("=====================================");
  return isWorking;
}

// Auto-run test if this file is imported
if (import.meta.env.DEV) {
  console.log("💡 To test OpenAI integration, run: runOpenAITest()");
}
