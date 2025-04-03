import React, { useState } from 'react';
import { 
  X as XIcon,
  Sparkles as SparklesIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as LoaderIcon
} from 'lucide-react';

interface AIGenerateOverlayProps {
  onClose: () => void;
  onGenerate: (flashcards: { question: string; answer: string }[]) => void;
}

const AIGenerateOverlay: React.FC<AIGenerateOverlayProps> = ({ onClose, onGenerate }) => {
  const [inputNotes, setInputNotes] = useState<string>('');
  const [notesError, setNotesError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const MAX_CHARACTERS = 2000;

  const generateFlashcardsWithAI = async () => {
    if (!inputNotes.trim()) {
      setNotesError("Please provide some notes to generate flashcards");
      return;
    }

    setIsGenerating(true);
    setNotesError('');

    try {
      // Retrieve user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Ensure user is authenticated
      if (!user.id && !user.uid) {
        throw new Error('User not authenticated. Please log in.');
      }
      
      // Encode user info for authorization
      const authHeader = `Bearer ${btoa(JSON.stringify(user))}`;
      
      const response = await fetch('http://localhost:6500/api/ai/generate-flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          notes: inputNotes.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate flashcards');
      }

      const data = await response.json();
      
      // Validate the returned flashcards
      const generatedFlashcards = data.flashcards
        .map((card: any) => ({
          question: card.question?.trim() || '',
          answer: card.answer?.trim() || ''
        }))
        .filter((card: { question: string; answer: string }) => 
          card.question !== '' && card.answer !== ''
        );

      if (generatedFlashcards.length === 0) {
        setNotesError("No valid flashcards could be generated. Please try different notes.");
        return;
      }

      // Limit to 20 flashcards
      const limitedFlashcards = generatedFlashcards.slice(0, 20);

      onGenerate(limitedFlashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setNotesError(
        error instanceof Error 
          ? error.message 
          : "Failed to generate flashcards. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Overlay Header */}
        <div className="bg-[#004a74] px-6 py-4 text-white flex items-center justify-between rounded-t-xl">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-bold">Generate Flashcards with AI</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-red-300 transition-colors"
            aria-label="Close AI Generate"
            disabled={isGenerating}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Overlay Content */}
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-6">
            <label htmlFor="aiNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Your Study Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="aiNotes"
              maxLength={MAX_CHARACTERS}
              value={inputNotes}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= MAX_CHARACTERS) {
                  setInputNotes(newValue);
                  setNotesError('');
                }
              }}
              placeholder="Paste or type your study notes here. The more detailed, the better the flashcards!"
              className={`w-full min-h-[300px] p-4 text-base rounded-lg border 
                focus:outline-none focus:ring-2 transition-all resize-none
                ${notesError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#004a74]/20'}`}
              disabled={isGenerating}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              {notesError && (
                <div className="text-red-500 flex items-center">
                  <AlertCircleIcon className="w-4 h-4 mr-1" />
                  {notesError}
                </div>
              )}
              <div className="ml-auto">
                {inputNotes.length} / {MAX_CHARACTERS} characters
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={generateFlashcardsWithAI}
            className={`w-full flex items-center justify-center gap-2 
              bg-[#004a74] text-white font-bold
              px-6 py-3 rounded-lg hover:bg-[#00659f] transition-colors shadow-md
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoaderIcon className="w-6 h-6 animate-spin mr-2" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6" />
                Generate Flashcards
              </>
            )}
          </button>

          {/* Info Panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <SparklesIcon className="w-5 h-5 text-[#004a74] mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-[#004a74]">How AI Generation Works</h3>
                <ul className="mt-2 text-sm text-[#004a74]/80 space-y-1">
                  <li>Paste your study notes in the text area</li>
                  <li>Our AI will analyze the notes and generate potential flashcards</li>
                  <li>You can edit the generated flashcards before saving</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerateOverlay;