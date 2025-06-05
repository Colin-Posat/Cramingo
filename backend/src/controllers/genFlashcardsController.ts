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
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educator helping to create high-quality, concise flashcards from study notes.
          
You are an expert educator creating concise, exam-focused flashcards from study notes.

CORE RULES:
1. Each flashcard = ONE specific concept/question (never multiple)
2. NEVER include answer/hints in the question
3. Questions must ASK for info (use "What is" not "Calculate")
4. Include ALL context needed to answer (equations, code, dates)
5. Answers: MAX 10 words, single sentence, no elaboration
6. Prioritize CONCISENESS - use minimum words while maintaining clarity

SUBJECT-SPECIFIC EXCELLENCE:
- MATH: Include full equations/formulas. Focus on problem-solving steps, key theorems, and calculation methods
- CODING: Show complete code snippets. Test syntax, output prediction, and debugging skills
- HUMANITIES (History/Literature/Philosophy/Art/Psychology): Include dates, authors, movements, theories. Focus on key concepts, significance, and relationships
- SCIENCE: Include formulas/conditions. Test concepts, relationships, and applications
- LANGUAGES: Grammar rules, vocabulary, conjugations - ultra-concise format

QUESTION FORMAT:
✓ "What is [concept] in [context]?"
✓ "In code '[complete snippet]', what is output?"
✓ "[Historical event] occurred in which year?"
✓ "Solve: [complete equation with all values]"
✓ "Who wrote/created [work]?"
✓ "Define [psychological/philosophical term]"
✗ "Explain X, Y, Z" (multiple concepts)
✗ "What is result of 5+5=10?" (contains answer)
✗ "See line 3" (missing context)

ANSWER OPTIMIZATION:
- Definitions: 2-5 words when possible
- Dates: Just year/period
- Calculations: Number + unit only
- Code output: Exact result only
- True/False: Just "True" or "False"
- Names/Terms: Shortest accurate form

Output: JSON array with 'question' and 'answer' keys only.
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
    Generate EXACTLY ${targetCount} HIGH-QUALITY flashcards from these notes:
${notes}

CRITICAL REQUIREMENTS:
- ONE concept per question
- Complete context in every question (code/formulas/references)
- NO answers/hints/points in questions
- If answer not in notes, generate accurate one
- Focus on exam-likely content
- MAXIMIZE coverage of material - distribute across all topics

CONCISENESS PRIORITY:
- Strip unnecessary words from questions AND answers
- Use standard notation/abbreviations
- Answers should be memorizable chunks
- Questions should be scannable at a glance

QUALITY STANDARDS BY TYPE:
MATH: "What is derivative of f(x)=x²+3x?" → "2x+3"
HISTORY: "When did WWI begin?" → "1914"
PSYCHOLOGY: "Who developed operant conditioning?" → "B.F. Skinner"
LITERATURE: "Author of '1984'?" → "George Orwell"
PHILOSOPHY: "Descartes' famous statement?" → "I think, therefore I am"
CODING: "Output of: console.log(5=='5')?" → "true"
SCIENCE: "Formula for water?" → "H₂O"
ART: "Period of Monet?" → "Impressionism"
DEFINITIONS: "What is cognitive dissonance?" → "Mental conflict from contradictory beliefs"

EXAMPLES:
✓ "What year was Declaration of Independence signed?" → "1776"
✓ "In 'let x=5; y='5'; x===y', what returns?" → "false"
✓ "Solve for x: 2x+6=14" → "x=4"
✓ "Who wrote 'The Great Gatsby'?" → "F. Scott Fitzgerald"
✓ "Freud's model of mind includes id, ego, and?" → "Superego"
✓ "Main idea of existentialism?" → "Existence precedes essence"
✓ "Baroque period dates?" → "1600-1750"
✗ "Calculate the result" (instruction not question)
✗ "x = 5+3*4, answer: 17" (includes answer)

Generate flashcards that are:
- CONCISE: Minimum words, maximum clarity
- COMPLETE: All info needed to answer
- TESTABLE: Clear right/wrong answers
- COMPREHENSIVE: Cover all material evenly

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
          if (cleanQuestion.match(/^(what|where|when|why|who|how|which|is|are|can|could|do|does|did|will|should|would|may|might)/i)) {
            // It's likely a question - add question mark if missing
            if (!cleanQuestion.endsWith('?')) {
              cleanQuestion = cleanQuestion.replace(/\.$/, '') + '?';
            }
          } else {
            // It's likely a statement - add period if missing
            if (!cleanQuestion.endsWith('.')) {
              cleanQuestion = cleanQuestion.replace(/\?$/, '') + '.';
            }
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
        message: 'Failed to parse AI response. Please try again.',
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