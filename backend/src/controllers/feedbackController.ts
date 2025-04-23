import { Request, Response } from 'express';
import { emailService } from '../services/emailService';

/**
 * Controller to handle user feedback submissions
 * Sends feedback (and optional user email) to fliply.help@gmail.com
 */
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { feedback, email } = req.body;

    if (!feedback) {
      res.status(400).json({ message: "Feedback content is required" });
      return;
    }

    // Build a body that includes the user email (or marks it anonymous)
    const emailBody = `
      Feedback:
      ${feedback}

      ${email ? `From: ${email}` : 'From: Anonymous'}
    `.trim();

    await emailService.sendFeedbackEmail(
      'fliply.help@gmail.com',     // recipient
      'New User Feedback',         // subject
      emailBody                    // body content
    );

    console.log(`Feedback email sent successfully`);
    res.status(200).json({ message: "Thank you for your feedback!" });
  } catch (emailError) {
    console.error("Error sending feedback email:", emailError);
    res.status(500).json({
      message: "There was an error submitting your feedback. Please try again later."
    });
  }
};
