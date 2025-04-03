import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft as ChevronLeftIcon,
  Sparkles as SparklesIcon,
  ArrowRight as ArrowRightIcon,
  X as XIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import NavBar from '../../components/NavBar';

const AIGeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const [inputNotes, setInputNotes] = useState<string>(() => {
    // Retrieve notes from local storage when component mounts
    return localStorage.getItem('ai-generate-notes') || '';
  });
  const [notesError, setNotesError] = useState<string>('');
  const [showTip, setShowTip] = useState<boolean>(() => {
    // Check local storage to see if user has previously dismissed the tip
    const dismissedTip = localStorage.getItem('ai-generate-tip-dismissed');
    return dismissedTip !== 'true';
  });
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);

  // Save notes to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-generate-notes', inputNotes);
  }, [inputNotes]);

  // Validate form before generating
  const validateForm = () => {
    let isValid = true;
    setNotesError('');

    if (!inputNotes.trim()) {
      setNotesError("Please provide some notes to generate flashcards");
      isValid = false;
    }

    return isValid;
  };

  // Generate Flashcards (placeholder for future AI functionality)
  const handleGenerateFlashcards = () => {
    if (validateForm()) {
      // Future: Implement AI generation logic
      console.log('Generating flashcards for:', {
        notes: inputNotes
      });
    }
  };

  // Dismiss tip permanently
  const handleDismissTip = () => {
    if (dontShowAgainChecked) {
      localStorage.setItem('ai-generate-tip-dismissed', 'true');
    }
    setShowTip(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header with back button and page title */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/set-creator')}
            className="flex items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm border border-[#004a74]/20 text-[#004a74] hover:bg-[#e3f3ff] transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" /> Back to Set Creator
          </button>
          <h1 className="text-xl font-bold text-[#004a74]">
            AI Flashcard Generator
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with AI Theme */}
          <div className="bg-[#004a74] px-6 py-4 text-white flex items-center">
            <SparklesIcon className="w-6 h-6 mr-3" />
            <h2 className="text-xl font-bold">Generate Flashcards with AI</h2>
          </div>

          <div className="p-6">
            {/* Notes Input */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Your Study Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="notes"
                value={inputNotes}
                onChange={(e) => {
                  setInputNotes(e.target.value);
                  setNotesError('');
                }}
                placeholder="Paste or type your study notes here. The more detailed, the better the flashcards!"
                className={`w-full min-h-[300px] p-4 text-base rounded-lg border 
                  focus:outline-none focus:ring-2 transition-all resize-none
                  ${notesError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#004a74]/20'}`}
              />
              {notesError && (
                <div className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircleIcon className="w-4 h-4 mr-1" />
                  {notesError}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button 
              onClick={handleGenerateFlashcards}
              className="w-full flex items-center justify-center gap-2 
                bg-[#004a74] text-white font-bold
                px-6 py-3 rounded-lg hover:bg-[#00659f] transition-colors shadow-md"
            >
              <SparklesIcon className="w-6 h-6" />
              Generate Flashcards
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>

            {/* Info Panel */}
            {showTip && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
                <button 
                  onClick={() => setShowTip(false)}
                  className="absolute top-2 right-2 text-[#004a74] hover:bg-blue-100 rounded-full p-1"
                >
                  <XIcon className="w-5 h-5" />
                </button>
                <div className="flex items-start">
                  <SparklesIcon className="w-5 h-5 text-[#004a74] mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-[#004a74]">How AI Generation Works</h3>
                    <ul className="mt-2 text-sm text-[#004a74]/80 space-y-1">
                      <li>Paste your study notes in the text area</li>
                      <li>Our AI will analyze the notes and generate relevant flashcards</li>
                      <li>You can edit the generated flashcards before saving</li>
                    </ul>
                    <div className="mt-2 flex items-center">
                      <input
                        type="checkbox"
                        id="dontShowAgain"
                        checked={dontShowAgainChecked}
                        onChange={(e) => setDontShowAgainChecked(e.target.checked)}
                        className="mr-2 text-[#004a74] focus:ring-[#004a74] rounded"
                      />
                      <label 
                        htmlFor="dontShowAgain" 
                        className="text-sm text-[#004a74]"
                      >
                        Don't show this tip again
                      </label>
                    </div>
                    <button 
                      onClick={handleDismissTip}
                      className="mt-2 text-sm text-[#004a74] bg-blue-100 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratePage;