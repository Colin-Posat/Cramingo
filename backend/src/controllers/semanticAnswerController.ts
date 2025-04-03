import { Request, Response } from 'express';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface SemanticResult {
  isCorrect: boolean;
  isClose?: boolean;
  feedback?: string;
  confidence: number;
  userAnswer: string;
  correctAnswer: string;
}

// Make sure the return type is compatible with Express
export const checkSemanticAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAnswer, correctAnswer } = req.body;
    
    // Validate inputs
    if (!userAnswer || !correctAnswer) {
      res.status(400).json({ error: 'Both userAnswer and correctAnswer are required' });
      return;
    }
    
    // Call OpenAI API to check semantic similarity and provide feedback
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Consider using GPT-4 for better instruction following
      messages: [
        {
          role: "system",
          content: `You are evaluating if a student's answer contains the correct concepts compared to the reference answer.
          
          EXTREMELY IMPORTANT: Your primary directive is to determine if the student understands the core concept, ignoring ALL spelling variations.
          
          Return a JSON object with the following properties:
          - isCorrect: boolean (MUST be true if the student demonstrates understanding of the key concepts, regardless of spelling)
          - feedback: string (brief constructive feedback if the answer is incorrect, explaining what's missing)
          
          Examples of what MUST be marked as CORRECT:
          - If "ecology" is misspelled as "ecolog", "ecolojy", "eekology", etc.
          - If scientific terms like "photosynthesis" have spelling errors but are recognizable
          - If names like "Darwin" are spelled as "Darvin" or "Darwyn"
          
          Only mark an answer as incorrect if:
          - A completely different concept is mentioned
          - Critical components of the answer are entirely missing
          
          When in doubt, mark the answer as CORRECT if the student clearly understands the concept despite spelling errors.`
        },
        {
          role: "user",
          content: `Reference answer: "${correctAnswer}"
          Student's answer: "${userAnswer}"
          
          Evaluate the student's answer and provide feedback in JSON format.`
        }
      ],
      temperature: 0.1, // Lower temperature for more consistent results
      response_format: { type: "json_object" },
      max_tokens: 150
    });
    
    // Parse the response to get the evaluation
    const responseContent = response.choices[0]?.message?.content || '{}';
    let evaluation: { isCorrect: boolean; feedback?: string } = { isCorrect: false };
    
    try {
      evaluation = JSON.parse(responseContent);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      // Fallback to basic evaluation if parsing fails
      evaluation = {
        isCorrect: responseContent.toLowerCase().includes('true'),
        feedback: 'Unable to provide detailed feedback.'
      };
    }
    
    // Post-process the result to be more lenient with spelling
    // If the answers are very similar except for spelling, override to correct
    const normalizedUserAnswer = userAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedCorrectAnswer = correctAnswer.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // If normalized answers are similar (allowing for some variation)
    const similarityThreshold = 0.8;
    const similarity = calculateSimilarity(normalizedUserAnswer, normalizedCorrectAnswer);
    
    if (similarity > similarityThreshold && !evaluation.isCorrect) {
      evaluation.isCorrect = true;
      evaluation.feedback = "Your answer is correct. There might be minor spelling variations, but the concept is correct.";
    }
    
    const result: SemanticResult = {
      isCorrect: evaluation.isCorrect,
      isClose: false, // Removing the "close" concept - it's either correct or incorrect
      feedback: evaluation.feedback || '',
      confidence: 0.9,
      userAnswer,
      correctAnswer
    };
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking semantic answer:', error);
    res.status(500).json({ error: 'Failed to check answer' });
  }
};

// Simple string similarity function (Levenshtein distance based)
function calculateSimilarity(str1: string, str2: string): number {
  if (str1.length === 0) return str2.length === 0 ? 1 : 0;
  if (str2.length === 0) return 0;
  
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  // Calculate similarity as 1 - normalized distance
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (matrix[str1.length][str2.length] / maxLength);
}