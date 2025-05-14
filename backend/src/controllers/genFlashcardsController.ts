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
    const MAX_ALLOWED_FLASHCARDS = 50; // Updated to 50 from 30

    // Determine target count based on input
    let targetCount = 0;
    
    // If autoCount is true, calculate based on text length with adjusted scale for max 50
    if (autoCount === true) {
      const wordCount = notes.trim().split(/\s+/).length;
      // Auto count calculation logic - optimized for max of 50
      if (wordCount < 200) {
        targetCount = 5;
      } else if (wordCount < 500) {
        targetCount = 10;
      } else if (wordCount < 1000) {
        targetCount = 15;
      } else if (wordCount < 2000) {
        targetCount = 25;
      } else if (wordCount < 3000) {
        targetCount = 35;
      } else {
        targetCount = 50; // Maximum auto-generated cards is now 50
      }
    } else {
      // If not autoCount, use the provided count with validation
      const requestedCount = count ? parseInt(count, 10) : 0;
      targetCount = requestedCount > 0 && requestedCount <= 50 ? requestedCount : 10; // Updated max limit to 50
    }

    // No need to cap at MAX_ALLOWED_FLASHCARDS since logic above already ensures max is 50
    
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
    - Generate clear, highly informative flashcards with FULL CONTEXT in every question
    - CRITICAL: NEVER include the answer or hints to the answer within the question itself
    - NO PART of the answer should ever appear anywhere in the question
    - NEVER include point values, expected answers, or solution notes in the question
    - QUESTIONS MUST ASK FOR THE ANSWER, not instruct how to find it
    - Questions should be phrased to directly ask for information (e.g., "What is X?" not "Calculate X")
    - Create test-like questions focusing on:
      * Fill-in-the-blank prompts with necessary context
      * Direct recall questions with complete reference information
      * Key concept identification with sufficient background
    - CRITICAL: Include ALL necessary context in the question - don't refer to content without showing it
    - For code examples, ALWAYS include the relevant code snippet in the question, but NEVER show the output/result
    - Keep answers concise (1-2 sentences maximum)
    - Use bullet points for multi-part answers
    - Remove unnecessary words while ensuring ALL ESSENTIAL CONTEXT remains
    - Generate EXACTLY the specified number of flashcards requested
    - ALWAYS provide proper context when mentioning specialized concepts, rules, or formulas
      * For scientific concepts, include relevant equations or conditions
      * For historical events, include approximate dates or time periods
      * For processes or methods, include key steps or components
      * For relationships between concepts, clearly specify how they connect
      * For code-related questions, include the specific code being referenced
    - For problems requiring calculations or specific data:
      * Always include all necessary information in the question to solve the problem
      * For physics problems, include relevant measurements, units, and conditions
      * For math problems, include all variables and constraints needed to work out the solution
      * For chemistry problems, include concentrations, temperatures, or other relevant parameters
      * Never separate crucial data from the question that would be needed to arrive at the answer
      * For code evaluation questions, include the COMPLETE code block being referenced
    
    Output Format: 
    Respond ONLY with a valid JSON array. Each object must have 'question' and 'answer' keys.
    
    Example:
    [
      {
        "question": "In the code 'const x = 5; const y = 10; console.log(x < y);', what will be logged to the console?",
        "answer": "true"
      }
    ]`
        },
        {
          role: "user",
          content: `Generate EXACTLY ${targetCount} flashcards from the following study notes:
    ${notes}
    
    IMPORTANT: 
    - Generate EXACTLY ${targetCount} flashcards, no more and no less
    - NEVER reference content without including it directly in the question
    - NEVER include the answer in the question text - not even part of it
    - NEVER include point values, scoring information, or expected answers in the question
    - REMOVE any text like "(1 point for X)" or "answer: Y" from the question
    - Questions should directly ASK for information, not INSTRUCT how to find it
    - For code questions, ALWAYS include the specific code snippet being referenced, but NEVER show the result
    - Word limits are flexible if more words are needed to provide sufficient context
    
    For example:
    - INCORRECT: "What is the result on line 3?" (missing code)
    - CORRECT: "In the code 'x = 5; y = 2; console.log(x > y);', what will be logged to the console?"
    
    - INCORRECT: "What is the result when 5 > 2?" (contains answer)
    - CORRECT: "Is the expression '5 > 2' true or false?"
    
    - INCORRECT: "What is the value of x? x = 5 + 10*10 // 10**2, 6 (1 point for 6.0)" (includes answer and point value)
    - CORRECT: "What is the value of x in the equation: x = 5 + 10*10 // 10**2?"
    
    - INCORRECT: "Calculate the number of members playing only one sport" (gives instruction, not question)
    - CORRECT: "How many members play exactly one of the three sports offered by the club?"
    
    - INCORRECT: "Apply Boyle's Law to solve the problem"
    - CORRECT: "Apply Boyle's Law (P₁V₁ = P₂V₂ at constant temperature) to calculate the final volume when pressure increases from 2atm to 4atm"
    
    - When creating flashcards for code or specific references:
      * BAD: "What happens on line 3?" (doesn't show the code)
      * GOOD: "What is output when this code runs: 'let x = 5; let y = '5'; console.log(x == y);'?"
      * BAD: "Is the statement on page 42 true?" (doesn't show the statement)
      * GOOD: "Is the statement 'Mitochondria contain their own circular DNA molecules' true or false?"
      * BAD: "The comparison 'let x = 5; let y = '5'; console.log(x == y);' yields true" (includes answer)
      * GOOD: "What will this code return: 'let x = 5; let y = '5'; console.log(x == y);'?"
      * BAD: "Calculate x = 5 + 3*4, answer: 17" (includes answer)
      * GOOD: "What is the value of x: x = 5 + 3*4?"
      * BAD: "What is the value of x? x = 10 // 2, 5 points" (includes answer and points)
      * GOOD: "What is the value of x in this expression: x = 10 // 2?"
      * BAD: "Find the derivative of f(x) = x² + 2x" (instruction, not question)
      * GOOD: "What is the derivative of f(x) = x² + 2x?"
      * BAD: "Solve for the equilibrium price when supply is S = 2p and demand is D = 10 - p" (instruction)
      * GOOD: "What is the equilibrium price when supply is S = 2p and demand is D = 10 - p?"
    
    FORMATTING REQUIREMENTS:
    - Questions must be complete with ALL necessary context
    - Questions must NEVER contain the answer or any part of it
    - REMOVE all point values, grading notes, or "answer: X" text from questions
    - Questions should ASK for information, not INSTRUCT how to find it (use "What is" not "Calculate")
    - Include ALL relevant code, equations, or references directly in the question
    - Answers should be under 30 words whenever possible
    - Use concise terminology and remove filler words
    - For multi-part answers, use brief bullet points
    
    Focus on concepts that would most likely appear on an exam, including:
    - Essential definitions (with proper context)
    - Critical formulas (in their most compact form)
    - Key relationships between concepts (expressed concisely)
    - Code evaluation (with complete code snippets)
    
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
      
      // Additional cleanup to remove any answers that might be in the questions
      flashcards = flashcards.map((card: any) => {
        if (typeof card.question === 'string' && typeof card.answer === 'string') {
          // Remove any instances of the answer in the question
          let cleanQuestion = card.question
            .replace(/\(\d+ points?\)/gi, '') // Remove point values
            .replace(/\(\d+ points? for [^)]+\)/gi, '') // Remove "points for X" notes
            .replace(/answer:\s*[^,\n]+/gi, '') // Remove "answer: X" text
            .trim();
          
          // Convert instructional phrases to questions
          cleanQuestion = cleanQuestion
            .replace(/^Calculate /i, 'What is ')
            .replace(/^Find /i, 'What is ')
            .replace(/^Determine /i, 'What is ')
            .replace(/^Solve /i, 'What is the solution for ')
            .replace(/^Compute /i, 'What is ')
            .replace(/^Evaluate /i, 'What is the value of ');
          
          // Add question mark if missing
          if (!cleanQuestion.endsWith('?')) {
            cleanQuestion += '?';
          }
          
          return {
            ...card,
            question: cleanQuestion
          };
        }
        return card;
      });
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