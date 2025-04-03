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
          content: "You are an expert in educational assessment who specializes in creating high-quality, unambiguously incorrect distractors for multiple-choice questions."
        },
        {
          role: "user",
          content: `Generate ${numberOfDistractors} distractors for a multiple-choice question.
                      
          Question: ${question}
          Correct Answer: ${correctAnswer}
                      
          Guidelines:
          - Create distractors that are unambiguously incorrect but still plausible enough to tempt someone with incomplete knowledge
          - Analyze the correct answer and question carefully to identify common misconceptions or partial understandings
          - Ensure distractors target specific misunderstandings related to the core concept being tested
          - Use the same level of vocabulary, technical terminology, and sentence structure as the correct answer
          - Avoid distractors that could be argued as partially correct in any reasonable interpretation
          - Make sure distractors represent mutually exclusive alternatives to the correct answer
          - Each distractor should be believable to someone who doesn't fully understand the material
          
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