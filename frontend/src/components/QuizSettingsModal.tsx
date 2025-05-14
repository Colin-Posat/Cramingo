import React, { useState, useEffect } from 'react';
import { X, Shuffle, Check } from 'lucide-react';

interface QuizSettings {
  quizTypes: ('text-input' | 'multiple-choice')[];
  shuffleQuestions: boolean;
}

interface QuizSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: QuizSettings) => void;
}

const QuizSettingsModal: React.FC<QuizSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Always start with multiple-choice and shuffle questions selected
  const [settings, setSettings] = useState<QuizSettings>({
    quizTypes: ['multiple-choice'],
    shuffleQuestions: true
  });

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  const handleCheckboxChange = (quizType: 'text-input' | 'multiple-choice') => {
    setSettings(prev => {
      // If already checked and user clicks it, don't allow unchecking the last option
      if (prev.quizTypes.includes(quizType) && prev.quizTypes.length === 1) {
        return prev;
      }
      
      // Make it exclusive - only select the one that was clicked
      return {
        ...prev,
        quizTypes: [quizType]
      };
    });
  };

  const handleConfirm = () => {
    onConfirm(settings);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      
      {/* Modal position */}
      <div className="flex min-h-screen items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Modal panel */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Modal header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                Quiz Settings
              </h3>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            
            {/* Modal content */}
            <div className="mt-4 space-y-6">
              {/* Question Type Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Question Types</h4>
                <p className="text-xs text-gray-500 mb-3">
                  Select how you want to answer questions. You can choose multiple options.
                </p>
                
                <div className="space-y-2 ml-1">

                 {/* Multiple Choice Option */}
                  <div className="flex items-center">
                    <input
                      id="multiple-choice-option"
                      type="checkbox"
                      checked={settings.quizTypes.includes('multiple-choice')}
                      onChange={() => handleCheckboxChange('multiple-choice')}
                      className="h-4 w-4 rounded border-gray-300 text-[#004a74] focus:ring-[#004a74] cursor-pointer"
                    />
                    <label htmlFor="multiple-choice-option" className="ml-3 block cursor-pointer">
                      <div className="font-medium text-gray-700">Multiple Choice</div>
                      <div className="text-sm text-gray-500">Choose from provided answer options</div>
                    </label>
                  </div>
                </div>
              </div>
                  {/* Text Input Option */}
                  <div className="flex items-center">
                    <input
                      id="text-input-option"
                      type="checkbox"
                      checked={settings.quizTypes.includes('text-input')}
                      onChange={() => handleCheckboxChange('text-input')}
                      className="h-4 w-4 rounded border-gray-300 text-[#004a74] focus:ring-[#004a74] cursor-pointer"
                    />
                    <label htmlFor="text-input-option" className="ml-3 block cursor-pointer">
                      <div className="font-medium text-gray-700">Text Input</div>
                      <div className="text-sm text-gray-500">Type your answers in a text field</div>
                    </label>
                  </div>
                  

              
              {/* Additional Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quiz Behavior</h4>
                
                <div className="space-y-2 ml-1">
                  {/* Shuffle Questions */}
                  <div className="flex items-center">
                    <input
                      id="shuffle-questions"
                      type="checkbox"
                      checked={settings.shuffleQuestions}
                      onChange={() => setSettings(prev => ({ ...prev, shuffleQuestions: !prev.shuffleQuestions }))}
                      className="h-4 w-4 rounded border-gray-300 text-[#004a74] focus:ring-[#004a74] cursor-pointer"
                    />
                    <label htmlFor="shuffle-questions" className="ml-3 block cursor-pointer">
                      <div className="font-medium text-gray-700 flex items-center">
                        Shuffle Questions
                        <Shuffle size={16} className="ml-2 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-500">Randomize the order of questions</div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-[#004a74] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-[#00659f] focus:outline-none focus:ring-2 focus:ring-[#004a74] focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleConfirm}
            >
              <Check size={18} className="mr-2" />
              Start Quiz
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#004a74] focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSettingsModal;