import { Request, Response, Router } from 'express';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Route to generate distractors
router.post('/generate-distractors', async (req: Request, res: Response) => {
  try {
    const { correctAnswer, question, numberOfDistractors = 3 } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates plausible but incorrect multiple-choice answers."
        },
        {
          role: "user",
          content: `Generate ${numberOfDistractors} distractors for a multiple-choice question.
          
          Question: ${question}
          Correct Answer: ${correctAnswer}
          
          Guidelines:
          - Create plausible but incorrect answers
          - Ensure distractors are related to the topic
          - Make sure they're not obviously wrong
          - Avoid repeating the correct answer
          
          Return the distractors as a JSON object with a 'distractors' key containing an array of strings.`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    const distractors = responseContent 
      ? JSON.parse(responseContent).distractors || []
      : [];

    res.json(distractors);
  } catch (error) {
    console.error('Error generating distractors:', error);
    res.status(500).json({ error: 'Failed to generate distractors' });
  }
});

export default router;