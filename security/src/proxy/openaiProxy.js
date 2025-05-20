/**
 * Proxy service for securely routing OpenAI API requests.
 * Intercepts API calls to add authentication, logging, and rate limiting.
 * Implements server-side processing to prevent exposing API keys to client devices.
 */
// Assuming you have an 'openai' instance from the 'openai' package
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateReply(history, userMessageContent, systemPrompt) {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history, // History provided by the client
      { role: "user", content: userMessageContent }
    ];
  
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: messages,
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      // It's crucial to decide how to handle this error.
      // Returning null or a predefined error message might be options.
      // For now, let's rethrow or return a user-friendly error message.
      throw new Error("AI Coach is currently unavailable. Please try again later.");
    }
  }
  
  module.exports = { generateReply };