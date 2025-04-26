import OpenAI from 'openai';
import { Request, Response } from 'express';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const generateFlashcards = async (req: Request, res: Response) => {
  try {
    // Basic authentication check
    const user = req.headers.authorization ?
      JSON.parse(Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString())
      : null;
    
    if (!user || (!user.id && !user.uid)) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    
    const { notes, count, autoCount } = req.body;
    
    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ message: 'No notes provided' });
    }

    const MIN_ALLOWED_FLASHCARDS = 5;
    const MAX_ALLOWED_FLASHCARDS = 30;

    // Determine target count based on input
    let targetCount = 0;
    
    // If autoCount is true, calculate based on text length
    if (autoCount === true) {
      const wordCount = notes.trim().split(/\s+/).length;
      // Auto count calculation logic
      if (wordCount < 200) {
        targetCount = 5;
      } else if (wordCount < 500) {
        targetCount = 8;
      } else if (wordCount < 1000) {
        targetCount = 12;
      } else if (wordCount < 2000) {
        targetCount = 16;
      } else if (wordCount < 3000) {
        targetCount = 20;
      } else {
        targetCount = 25;
      }
    } else {
      // If not autoCount, use the provided count with validation
      const requestedCount = count ? parseInt(count, 10) : 0;
      targetCount = requestedCount > 0 && requestedCount <= 50 ? requestedCount : 10; // Default to 10 if invalid
    }

    targetCount = Math.min(targetCount, MAX_ALLOWED_FLASHCARDS);
    
    // First, check if the input is valid educational content that can be turned into flashcards
    // First, check if the input is valid educational content that can be turned into flashcards
const validationCheck = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: `You are an expert educator evaluating if text can be used to create educational flashcards. 
      Respond only with a JSON object with two fields:
      - "valid": boolean (true if input can be turned into flashcards, false otherwise)
      - "reason": string (explanation why the input is not valid, only if valid is false)
      
      Be very lenient in your evaluation. Accept almost all text that could potentially provide educational value.
      Valid inputs include:
      - Any educational content, lecture notes, textbook excerpts, study materials
      - Notes or summaries on any topic
      - Lists of facts, terms, concepts, or ideas
      - Brief paragraphs about specific topics
      - Content in any field or domain
      - Content that might be incomplete but still has useful information
      
      Only reject input that is:
      - Completely random gibberish with no coherent meaning
      - Deliberately harmful content
      - Single words or extremely short phrases with no context (less than 5 words total)
      
      When in doubt, approve the content. The goal is to be inclusive rather than exclusive.
      For mathematical or scientific content, even if it seems fragmented, approve it if any terms or concepts can be identified.`
    },
    {
      role: "user",
      content: notes
    }
  ]
});

    // Parse validation result
    let validationResult;
    try {
      validationResult = JSON.parse(validationCheck.choices[0].message.content || '{"valid": false, "reason": "Could not validate input"}');
    } catch (parseError) {
      // If parsing fails, assume the input was invalid
      validationResult = { valid: false, reason: "Could not validate input format" };
    }

    // If input is not valid educational content, return early with an error
    if (!validationResult.valid) {
      return res.status(400).json({ 
        message: 'Cannot generate flashcards from this input',
        reason: validationResult.reason
      });
    }
    
    // If input is valid, proceed with flashcard generation
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educator helping to create high-quality, concise flashcards from study notes.
          
    Guidelines for creating flashcards:
    - Generate clear, highly concise, and educational flashcards
    - Create test-like questions focusing on:
      * Fill-in-the-blank prompts with single terms
      * Brief, direct recall questions 
      * Key concept identification
    - Keep answers extremely concise (1-2 sentences maximum)
    - Use bullet points for multi-part answers
    - Remove unnecessary words and focus only on essential information
    - Generate EXACTLY the specified number of flashcards requested
    - ALWAYS provide proper context when mentioning specialized concepts, rules, or formulas
      * For scientific concepts, include relevant equations or conditions
      * For historical events, include approximate dates or time periods
      * For processes or methods, include key steps or components
      * For relationships between concepts, clearly specify how they connect
    
    Output Format: 
    Respond ONLY with a valid JSON array. Each object must have 'question' and 'answer' keys.
    
    Example:
    [
      {
        "question": "The process of converting light energy to chemical energy in plants is called ___.",
        "answer": "photosynthesis"
      }
    ]`
        },
        {
          role: "user",
          content: `Generate EXACTLY ${targetCount} flashcards from the following study notes:
    ${notes}
    
    IMPORTANT: 
    - Generate EXACTLY ${targetCount} flashcards, no more and no less
    - Whenever you reference specialized concepts, rules, or terminology, 
    ALWAYS include proper context and explanation.
    
    For example:
    - Instead of just "Apply Boyle's Law", say "Apply Boyle's Law (P₁V₁ = P₂V₂ at constant temperature) to predict the new volume"
    - Instead of just "This shows cognitive dissonance", say "This shows cognitive dissonance (psychological stress from holding contradictory beliefs)"
    - Instead of just "This uses PCR technique", say "This uses PCR (Polymerase Chain Reaction) technique to amplify DNA sequences"
    - Instead of just "During the Renaissance period", say "During the Renaissance period (14th-17th centuries in Europe)"
    
    FORMATTING REQUIREMENTS:
    - Questions must be under 15 words whenever possible
    - Answers must be under 20 words whenever possible
    - Use concise terminology and remove filler words
    - For multi-part answers, use brief bullet points
    
    Focus on concepts that would most likely appear on an exam, including:
    - Essential definitions (single term preferred)
    - Critical formulas (in their most compact form)
    - Key relationships between concepts (expressed concisely)
    
    Respond ONLY with a JSON array of EXACTLY ${targetCount} flashcard objects. Ensure each has a 'question' and 'answer' key.`
        }
      ]
    });
    
    // Parse the response
    const responseText = completion.choices[0].message.content;
    
    // Validate and parse the JSON
    let flashcards;
    try {
      // Try parsing the entire response
      flashcards = JSON.parse(responseText || '[]');
      
      // If the parsed response is an object with a flashcards key, extract it
      if (flashcards.flashcards && Array.isArray(flashcards.flashcards)) {
        flashcards = flashcards.flashcards;
      }
      
      // Ensure it's an array
      if (!Array.isArray(flashcards)) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('Parsing error:', responseText);
      return res.status(500).json({
        message: 'Failed to parse AI response',
        error: parseError instanceof Error ? parseError.message : 'Unknown error',
        rawResponse: responseText
      });
    }
    
    // Validate flashcards
    const validFlashcards = flashcards.filter(
      (card: any) =>
        typeof card === 'object' &&
        card !== null &&
        typeof card.question === 'string' &&
        typeof card.answer === 'string' &&
        card.question.trim() !== '' &&
        card.answer.trim() !== ''
    );
    
    if (validFlashcards.length === 0) {
      return res.status(400).json({
        message: 'No valid flashcards could be generated. Please provide more structured educational content.'
      });
    }
    
    // Prepare response message
    let responseMessage = null;
    if (validFlashcards.length !== targetCount) {
      responseMessage = `Generated ${validFlashcards.length} flashcards.`;
      
      if (autoCount === true) {
        responseMessage = `Automatically generated ${validFlashcards.length} flashcards based on content length.`;
      }
    }
    
    res.json({ 
      flashcards: validFlashcards,
      message: responseMessage,
      autoGenerated: autoCount === true
    });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({
      message: 'Failed to generate flashcards',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};