import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  X as XIcon,
  Sparkles as SparklesIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as LoaderIcon,
  Upload as UploadIcon,
  FileText as FileTextIcon,
  Trash2 as TrashIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Minus as MinusIcon,
  Plus as PlusIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

interface AIGenerateOverlayProps {
  onClose: () => void;
  onGenerate: (flashcards: { question: string; answer: string }[]) => void;
}

const AIGenerateOverlay: React.FC<AIGenerateOverlayProps> = ({ onClose, onGenerate }) => {
  const [inputNotes, setInputNotes] = useState<string>('');
  const [notesError, setNotesError] = useState<string>('');
  const [notesSuccess, setNotesSuccess] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [flashcardCount, setFlashcardCount] = useState<number>(10); // Default count
  const [useAutoCount, setUseAutoCount] = useState<boolean>(false); // Auto count option
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  
  // Use the auth context instead of localStorage
  const { user, isAuthenticated } = useAuth();
  
  const MIN_CHARACTERS = 100;
  const MAX_CHARACTERS = 30000;
  const MIN_FLASHCARDS = 5;
  const MAX_FLASHCARDS = 30;

  // Auto-focus the textarea when there's no file uploaded
  useEffect(() => {
    if (!uploadedFile && notesRef.current && !isParsing && !isGenerating) {
      notesRef.current.focus();
    }
  }, [uploadedFile, isParsing, isGenerating]);

  // Auto-parse PDF when file is uploaded (better UX)
  useEffect(() => {
    if (uploadedFile && !isParsing && !isGenerating) {
      parsePdfContent();
    }
  }, [uploadedFile]);

  // File validation function
  const validateFile = (file: File): string | null => {
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are supported';
    }
    
    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds the 10MB limit';
    }
    
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    
    const error = validateFile(file);
    if (error) {
      setNotesError(error);
      setNotesSuccess('');
      return;
    }
    
    // Clear previous file and notes
    setUploadedFile(file);
    setInputNotes('');
    setNotesError('');
    setNotesSuccess(`"${file.name}" selected`);
    
    // Simulated upload progress for better UX
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGenerating && !isParsing) {
      setIsDragging(true);
    }
  }, [isGenerating, isParsing]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGenerating && !isParsing) {
      setIsDragging(true);
    }
  }, [isGenerating, isParsing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set isDragging to false if we're leaving the dropzone and not entering a child element
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x <= rect.left || 
      x >= rect.right || 
      y <= rect.top || 
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isGenerating || isParsing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);
      
      if (error) {
        setNotesError(error);
        setNotesSuccess('');
        return;
      }
      
      setUploadedFile(file);
      setInputNotes('');
      setNotesError('');
      setNotesSuccess(`"${file.name}" dropped successfully`);
      
      // Simulated upload progress for better UX
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 50);
    }
  }, [isGenerating, isParsing]);

  const parsePdfContent = async () => {
    if (!uploadedFile) return;
    
    setIsParsing(true);
    setNotesError('');
    setNotesSuccess('');
    
    try {
      // Check if user is authenticated using auth context
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated. Please log in.');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('pdfFile', uploadedFile);
      
      // Encode user info for authorization - use the user from context
      const authHeader = `Bearer ${btoa(JSON.stringify(user))}`;
      
      const response = await fetch(`${API_BASE_URL}/files/parse-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: formData
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to parse PDF file');
      }
  
      const data = await response.json();
      
      // Check if we received text data
      if (!data.text) {
        throw new Error('Received invalid response from server. Missing text content.');
      }
      
      // Check if extracted text is too long
      if (data.text.length > MAX_CHARACTERS) {
        setInputNotes(data.text.substring(0, MAX_CHARACTERS));
        setNotesError(`PDF content exceeds ${MAX_CHARACTERS} characters. Text has been truncated.`);
      } else if (data.text.length < MIN_CHARACTERS) {
        setInputNotes(data.text);
        setNotesError(`Extracted text is less than ${MIN_CHARACTERS} characters. Add more content for better results.`);
      } else {
        setInputNotes(data.text);
        // Show page count information if available
        if (data.pageCount) {
          setNotesSuccess(`Successfully parsed ${data.pageCount} page${data.pageCount !== 1 ? 's' : ''} from PDF.`);
          
          // Auto scroll to the textarea
          setTimeout(() => {
            notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setNotesError(
        error instanceof Error 
          ? error.message 
          : "Failed to parse PDF. Please try a different file."
      );
    } finally {
      setIsParsing(false);
      setUploadProgress(0);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setNotesSuccess('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle flashcard count change
  const handleFlashcardCountChange = (newCount: number) => {
    if (newCount >= MIN_FLASHCARDS && newCount <= MAX_FLASHCARDS) {
      setFlashcardCount(newCount);
    }
  };

  const generateFlashcardsWithAI = async () => {
    if (!inputNotes.trim()) {
      setNotesError("Please provide some notes or upload a PDF to generate flashcards");
      setNotesSuccess('');
      return;
    }

    if (inputNotes.trim().length < MIN_CHARACTERS) {
      setNotesError(`Please provide at least ${MIN_CHARACTERS} characters of notes for better results`);
      setNotesSuccess('');
      return;
    }

    setIsGenerating(true);
    setNotesError('');
    setNotesSuccess('');

    try {
      // Check if user is authenticated using auth context
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated. Please log in.');
      }
      
      // Encode user info for authorization - use the user from context
      const authHeader = `Bearer ${btoa(JSON.stringify(user))}`;
      
      const response = await fetch(`${API_BASE_URL}/ai/generate-flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          notes: inputNotes.trim(),
          count: flashcardCount,
          autoCount: useAutoCount
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

      // Show message from backend if any
      if (data.message) {
        setNotesSuccess(data.message);
      }

      onGenerate(generatedFlashcards);
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

  // Character count with color feedback
  const getCharacterCountColor = () => {
    if (inputNotes.length === 0) return "text-gray-500";
    if (inputNotes.length < MIN_CHARACTERS) return "text-amber-600";
    if (inputNotes.length > MAX_CHARACTERS * 0.9) return "text-orange-600";
    return "text-green-600";
  };

  // Get button state based on current input
  const getButtonState = () => {
    if (isGenerating) {
      return {
        disabled: true,
        text: "Generating Flashcards...",
        icon: <LoaderIcon className="w-6 h-6 animate-spin mr-2" />
      };
    }
    
    if (isParsing) {
      return {
        disabled: true,
        text: "Processing PDF...",
        icon: <LoaderIcon className="w-6 h-6 animate-spin mr-2" />
      };
    }
    
    if (inputNotes.trim().length < MIN_CHARACTERS) {
      return {
        disabled: true,
        text: `Need ${MIN_CHARACTERS - inputNotes.trim().length} More Characters`,
        icon: <SparklesIcon className="w-6 h-6 opacity-50" />
      };
    }
    
    return {
      disabled: false,
      text: useAutoCount 
        ? "Generate Flashcards (Auto Count)" 
        : `Generate ${flashcardCount} Flashcards`,
      icon: <SparklesIcon className="w-6 h-6" />
    };
  };

  const buttonState = getButtonState();

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
            disabled={isGenerating || isParsing}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Overlay Content */}
        <div className="p-6 flex-grow overflow-y-auto">
          {/* PDF Upload Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="pdfUpload" className="block text-sm font-medium text-gray-700">
                Upload PDF of Lecture Materials or Notes (Optional)
              </label>
              <span className="text-xs text-gray-500">or type your content in the text area below</span>
            </div>

            {/* Drop area */}
            <div 
              ref={dropAreaRef}
              className={`w-full border border-dashed rounded-lg p-4 text-center transition-all
                ${isDragging 
                  ? 'border-[#004a74] bg-[#004a74]/5 shadow-md' 
                  : uploadedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-[#004a74]/50 hover:bg-[#004a74]/5'
                }
                ${isGenerating || isParsing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!uploadedFile ? (
                <>
                  <input
                    type="file"
                    id="pdfUpload"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                    disabled={isGenerating || isParsing}
                  />
                  <label 
                    htmlFor="pdfUpload" 
                    className="flex flex-col items-center justify-center cursor-pointer py-4"
                  >
                    <UploadIcon className={`w-10 h-10 mb-2 ${isDragging ? 'text-[#004a74]' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isDragging ? 'text-[#004a74]' : 'text-gray-600'}`}>
                      {isDragging ? 'Drop your PDF here' : 'Click to upload or drag and drop a PDF'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Maximum file size: 10MB
                    </p>
                  </label>
                </>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <FileTextIcon className="w-8 h-8 text-[#004a74] mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                        {uploadedFile.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <span className="ml-2">Uploading: {uploadProgress}%</span>
                        )}
                        {uploadProgress === 100 && !isParsing && (
                          <span className="ml-2 flex items-center text-green-500">
                            <CheckCircleIcon className="w-3 h-3 mr-1" /> Ready
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isParsing && uploadProgress === 100 && (
                      <button
                        onClick={removeUploadedFile}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove file"
                        disabled={isParsing || isGenerating}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Show progress bar when uploading or parsing */}
              {(uploadProgress > 0 || isParsing) && (
                <div className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${isParsing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}
                    style={{ width: `${isParsing ? '100' : uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            {/* Status/Error messages for PDF */}
            {(notesError && notesError.includes('PDF')) && (
              <div className="text-red-500 flex items-center text-sm mt-1">
                <AlertCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>{notesError}</span>
              </div>
            )}
            {(notesSuccess && isParsing) && (
              <div className="text-blue-500 flex items-center text-sm mt-1">
                <LoaderIcon className="w-4 h-4 mr-1 animate-spin" />
                <span>Parsing PDF content...</span>
              </div>
            )}
            {(notesSuccess && !isParsing && !notesError) && (
              <div className="text-green-600 flex items-center text-sm mt-1">
                <CheckCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>{notesSuccess}</span>
              </div>
            )}
          </div>

          {/* Text input area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="aiNotes" className="block text-sm font-medium text-gray-700">
                Your Notes or Lecture<span className="text-red-500">*</span>
              </label>
              <div className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center">
                <InfoIcon className="w-3 h-3 mr-1 text-gray-500" />
                <span>Min: {MIN_CHARACTERS} characters</span>
              </div>
            </div>
            <textarea
              id="aiNotes"
              ref={notesRef}
              maxLength={MAX_CHARACTERS}
              value={inputNotes}
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue.length <= MAX_CHARACTERS) {
                  setInputNotes(newValue);
                  if (newValue.trim().length >= MIN_CHARACTERS || newValue.trim().length === 0) {
                    setNotesError('');
                  }
                }
              }}
              placeholder="Paste or type your lecture content or notes here. The more detailed, the better the flashcards!"
              className={`w-full min-h-[300px] p-4 text-base rounded-lg border 
                focus:outline-none focus:ring-2 transition-all resize-none
                ${notesError && !notesError.includes('PDF') ? 'border-red-500 focus:ring-red-200' : 
                  inputNotes.length >= MIN_CHARACTERS ? 'border-green-500 focus:ring-green-200' : 
                  'border-gray-300 focus:ring-[#004a74]/20'}`}
              disabled={isGenerating || isParsing}
            />
            
            {/* Character count and status messages */}
            <div className="flex flex-wrap justify-between text-sm mt-1">
              {notesError && !notesError.includes('PDF') && (
                <div className="text-red-500 flex items-center mr-4">
                  <AlertCircleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span>{notesError}</span>
                </div>
              )}
              
              <div className={`flex items-center ml-auto ${getCharacterCountColor()}`}>
                <span>{inputNotes.length}</span>
                <span className="mx-1">/</span>
                <span>{MAX_CHARACTERS}</span>
                <span className="ml-1">characters</span>
                {inputNotes.length >= MIN_CHARACTERS && (
                  <CheckCircleIcon className="w-4 h-4 ml-1 text-green-500" />
                )}
              </div>
            </div>
          </div>
          
          {/* Flashcard Count Selector */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Number of Flashcards
              </label>
              <span className="text-xs text-gray-500">{MIN_FLASHCARDS}-{MAX_FLASHCARDS} cards</span>
            </div>
            
            {/* Count selector */}
            <div className={`transition-opacity duration-150 ${useAutoCount ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleFlashcardCountChange(flashcardCount - 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full 
                    ${(flashcardCount <= MIN_FLASHCARDS || isGenerating || isParsing || useAutoCount) ? 
                      'text-gray-400 bg-gray-100 cursor-not-allowed' : 
                      'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                  disabled={flashcardCount <= MIN_FLASHCARDS || isGenerating || isParsing || useAutoCount}
                  aria-label="Decrease flashcard count"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min={MIN_FLASHCARDS}
                    max={MAX_FLASHCARDS}
                    value={flashcardCount}
                    onChange={(e) => setFlashcardCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004a74]"
                    disabled={isGenerating || isParsing || useAutoCount}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>{MIN_FLASHCARDS}</span>
                    <span>{MAX_FLASHCARDS}</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleFlashcardCountChange(flashcardCount + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full
                    ${(flashcardCount >= MAX_FLASHCARDS || isGenerating || isParsing || useAutoCount) ? 
                      'text-gray-400 bg-gray-100 cursor-not-allowed' : 
                      'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
                  disabled={flashcardCount >= MAX_FLASHCARDS || isGenerating || isParsing || useAutoCount}
                  aria-label="Increase flashcard count"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                
                <div className="w-12 h-8 flex items-center justify-center bg-[#004a74]/10 text-[#004a74] font-medium rounded">
                  {flashcardCount}
                </div>
              </div>
            </div>
            
            {/* Auto Count Checkbox */}
            <div className="flex items-center mt-3">
              <input
                id="autoCountCheckbox"
                type="checkbox"
                checked={useAutoCount}
                onChange={(e) => setUseAutoCount(e.target.checked)}
                disabled={isGenerating || isParsing}
                className="h-4 w-4 rounded border-gray-300 text-[#004a74] focus:ring-[#004a74]"
              />
              <label htmlFor="autoCountCheckbox" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Choose for me based on text length
              </label>
              {useAutoCount && (
                <div className="ml-2 px-2 py-0.5 bg-[#004a74]/10 text-[#004a74] text-xs rounded-full">
                  Auto
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button 
            onClick={generateFlashcardsWithAI}
            className={`w-full flex items-center justify-center gap-2 
              bg-[#004a74] text-white font-bold
              px-6 py-4 rounded-lg hover:bg-[#00659f] transition-all shadow-md
              ${buttonState.disabled ? 'opacity-70 cursor-not-allowed' : 'transform hover:-translate-y-0.5'}`}
            disabled={buttonState.disabled}
          >
            {buttonState.icon}
            {buttonState.text}
          </button>

          {/* Info Panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <SparklesIcon className="w-5 h-5 text-[#004a74] mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-[#004a74]">How AI Generation Works</h3>
                <ul className="mt-2 text-sm text-[#004a74]/80 space-y-1">
                  <li>Upload a PDF document or paste your notes ({MIN_CHARACTERS}-{MAX_CHARACTERS} characters)</li>
                  <li>Specify the number of flashcards or let AI choose based on content length</li>
                  <li>Our AI will analyze the content and generate relevant flashcards</li>
                  <li>You can edit the generated flashcards before saving</li>
                  <li>Works best with lecture notes, textbook chapters, and study guides</li>
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