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

    const { notes } = req.body;

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ message: 'No notes provided' });
    }

    // Prompt for generating flashcards
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: `You are an expert educator helping to create high-quality flashcards from study notes.
          
          Guidelines for creating flashcards:
          - Generate clear, concise, and educational flashcards
          - Ensure each card has a distinct question and a comprehensive answer
          - Focus on key concepts, definitions, and important details
          - Avoid overly complex or vague questions
          - Aim for 5-10 flashcards depending on the input notes
          
          Output format: JSON array of objects with 'question' and 'answer' keys`
        },
        {
          role: "user",
          content: `Generate flashcards from the following study notes:

${notes}

Respond ONLY with a JSON array of flashcard objects. Each object must have 'question' and 'answer' keys.`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseText = completion.choices[0].message.content;
    
    // Validate and parse the JSON
    let flashcards;
    try {
      const parsedResponse = JSON.parse(responseText || '{}');
      flashcards = parsedResponse.flashcards || parsedResponse;
      
      // Ensure it's an array of objects with question and answer
      if (!Array.isArray(flashcards)) {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      return res.status(500).json({ 
        message: 'Failed to parse AI response',
        error: parseError instanceof Error ? parseError.message : 'Unknown error'
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
        message: 'No valid flashcards could be generated' 
      });
    }

    res.json({ flashcards: validFlashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    res.status(500).json({ 
      message: 'Failed to generate flashcards',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};