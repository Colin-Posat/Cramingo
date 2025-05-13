// Updated AIGenerateOverlay.tsx with improved flashcard selector
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
  Plus as PlusIcon,
  HelpCircle as HelpCircleIcon,
  Crown as CrownIcon
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// Simplified shimmer animation
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

interface AIGenerateOverlayProps {
  onClose: () => void;
  onGenerate: (flashcards: { question: string; answer: string }[], shouldScroll: boolean) => void;
}

const AIGenerateOverlay: React.FC<AIGenerateOverlayProps> = ({ onClose, onGenerate }) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
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
  const notesRef = useRef<HTMLTextAreaElement>(null);
  
  // Use the auth context
  const { user, isAuthenticated } = useAuth();
  
  const MIN_CHARACTERS = 100;
  const MAX_CHARACTERS = 30000;
  const MIN_FLASHCARDS = 5;
  const MAX_FLASHCARDS = 50;



  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Common breakpoint for mobile
    };
    
    checkMobile(); // Check on initial load
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);



  

  // Auto-parse PDF when file is uploaded
  useEffect(() => {
    if (uploadedFile && !isParsing && !isGenerating) {
      parsePdfContent();
    }
  }, [uploadedFile]);

  // File validation function
  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return 'Only PDF files are supported';
    }
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
    
    setUploadedFile(file);
    setInputNotes('');
    setNotesError('');
    setNotesSuccess(`"${file.name}" selected`);
    
    // Simulated upload progress
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

  // Drag and drop handlers (simplified)
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGenerating && !isParsing) setIsDragging(true);
  }, [isGenerating, isParsing]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isGenerating && !isParsing) setIsDragging(true);
  }, [isGenerating, isParsing]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
      
      // Simulated upload progress
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
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated. Please log in.');
      }
      
      const formData = new FormData();
      formData.append('pdfFile', uploadedFile);
      
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
      
      if (!data.text) {
        throw new Error('Received invalid response from server. Missing text content.');
      }
      
      if (data.text.length > MAX_CHARACTERS) {
        setInputNotes(data.text.substring(0, MAX_CHARACTERS));
        setNotesError(`PDF content exceeds ${MAX_CHARACTERS} characters. Text has been truncated.`);
      } else if (data.text.length < MIN_CHARACTERS) {
        setInputNotes(data.text);
        setNotesError(`Extracted text is less than ${MIN_CHARACTERS} characters. Add more content for better results.`);
      } else {
        setInputNotes(data.text);
        if (data.pageCount) {
          setNotesSuccess(`Successfully parsed ${data.pageCount} page${data.pageCount !== 1 ? 's' : ''} from PDF.`);
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

  // Handle flashcard count change with bounds checking
  const handleFlashcardCountChange = (newCount: number) => {
    const boundedCount = Math.min(Math.max(newCount, MIN_FLASHCARDS), MAX_FLASHCARDS);
    setFlashcardCount(boundedCount);
  };

  // Get color based on flashcard count
  const getCountColor = () => {
    if (flashcardCount <= 10) return "bg-green-500";
    if (flashcardCount <= 20) return "bg-blue-500";
    if (flashcardCount <= 35) return "bg-purple-500";
    return "bg-orange-500";
  };
  
  // Get tooltip text based on flashcard count
  const getCountTooltip = () => {
    if (flashcardCount <= 10) return "Quick study session";
    if (flashcardCount <= 20) return "Balanced set";
    if (flashcardCount <= 35) return "Comprehensive review";
    return "Intensive study";
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
      if (!isAuthenticated || !user) {
        throw new Error('User not authenticated. Please log in.');
      }
      
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

      if (data.message) {
        setNotesSuccess(data.message);
      } else {
        setNotesSuccess(`Successfully generated ${generatedFlashcards.length} flashcards! You can now edit them to your preference.`);
      }

      onGenerate(generatedFlashcards, true);
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
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
        text: "Generating...",
        icon: <LoaderIcon className="w-5 h-5 animate-spin" />
      };
    }
    
    if (isParsing) {
      return {
        disabled: true,
        text: "Processing PDF...",
        icon: <LoaderIcon className="w-5 h-5 animate-spin" />
      };
    }
    
    if (inputNotes.trim().length < MIN_CHARACTERS) {
      return {
        disabled: true,
        text: `Need ${MIN_CHARACTERS - inputNotes.trim().length} more chars`,
        icon: <SparklesIcon className="w-5 h-5 opacity-50" />
      };
    }
    
    return {
      disabled: false,
      text: useAutoCount ? "Generate Flashcards (Auto)" : `Generate ${flashcardCount} Flashcards`,
      icon: <SparklesIcon className="w-5 h-5" />
    };
  };

  // Predefined common counts for quick selection
  const quickCounts = [5, 10, 15, 20, 30];

  const buttonState = getButtonState();

  return (
    <>
      <style>{shimmerKeyframes}</style>
      
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header - increased padding */}
          <div className="bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-3 text-white flex items-center justify-between rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" style={{ animation: 'shimmer 2s infinite' }}></div>
            
            <div className="flex items-center z-10">
              <SparklesIcon className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-bold">Generate Flashcards with AI</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-red-200 transition-colors z-10"
              aria-label="Close"
              disabled={isGenerating || isParsing}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Compact tabbed content - with explicit scrollbar */}
          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="p-4">
              {/* File Upload Section - Compact */}
              <div className="mb-3">
                <div 
                  className={`border border-dashed rounded-md p-3 text-center transition-all
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 
                      uploadedFile ? 'border-green-500 bg-green-50' : 'border-gray-300'}
                    ${isGenerating || isParsing ? 'opacity-70' : 'hover:border-blue-400 hover:bg-blue-50'}`}
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
                        className="flex items-center justify-center cursor-pointer py-2"
                      >
                        <UploadIcon className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Upload or drag PDF (optional)</span>
                      </label>
                    </>
                  ) : (
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center">
                        <FileTextIcon className="w-5 h-5 text-blue-500 mr-2" />
                        <p className="text-sm text-gray-700 truncate max-w-xs">
                          {uploadedFile.name}
                        </p>
                      </div>
                      <button
                        onClick={removeUploadedFile}
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                        title="Remove file"
                        disabled={isParsing || isGenerating}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Progress bar */}
                  {(uploadProgress > 0 || isParsing) && (
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={isParsing ? 'bg-blue-500 animate-pulse h-full' : 'bg-blue-500 h-full'}
                        style={{ width: `${isParsing ? '100' : uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                
                {/* Status messages for PDF */}
                {(notesError && notesError.includes('PDF')) && (
                  <div className="text-red-500 flex items-center text-xs mt-0.5">
                    <AlertCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span>{notesError}</span>
                  </div>
                )}
                {(notesSuccess && !isParsing && !notesError) && (
                  <div className="text-green-600 flex items-center text-xs mt-0.5">
                    <CheckCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span>{notesSuccess}</span>
                  </div>
                )}
              </div>

              {/* Text input area - more compact */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="aiNotes" className="block text-xs font-medium text-gray-700">
                    Your Notes or Lecture Content <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs bg-blue-50 px-1.5 py-0.5 rounded flex items-center">
                    <span>Min: {MIN_CHARACTERS} chars</span>
                  </span>
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
                  placeholder="Paste or type your lecture notes here. More details = better flashcards!"
                  className={`w-full min-h-[150px] p-3 text-sm rounded-md border 
                    focus:outline-none focus:ring-1 transition-all resize-none
                    ${notesError && !notesError.includes('PDF') ? 'border-red-500' : 
                      inputNotes.length >= MIN_CHARACTERS ? 'border-blue-500' : 'border-gray-300'}`}
                  disabled={isGenerating || isParsing}
                />
                
                {/* Character count */}
                <div className="flex flex-wrap justify-between text-xs mt-0.5">
                  {notesError && !notesError.includes('PDF') && (
                    <div className="text-red-500 flex items-center mr-4">
                      <AlertCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{notesError}</span>
                    </div>
                  )}
                  
                  <div className={`flex items-center ml-auto ${getCharacterCountColor()}`}>
                    <span>{inputNotes.length}</span>
                    <span className="mx-1">/</span>
                    <span>{MAX_CHARACTERS}</span>
                  </div>
                </div>
              </div>
              
              {/* Improved Flashcard Count Selector */}
              <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-700">Flashcard Count</h3>
                    <span className="group relative ml-1 cursor-help">
                      <HelpCircleIcon className="h-3.5 w-3.5 text-gray-400" />
                      <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity group-hover:opacity-100 z-10">
                        <div className="w-48 rounded bg-gray-800 p-2 text-xs text-white shadow-lg">
                          <p>Set the number of flashcards to generate. Choose fewer cards for quick sessions or more for deep learning.</p>
                        </div>
                      </div>
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{MIN_FLASHCARDS}-{MAX_FLASHCARDS}</div>
                </div>
                
                {/* Quick select buttons */}
                <div className={`flex flex-wrap gap-1.5 mb-2 transition-opacity ${useAutoCount ? 'opacity-40' : 'opacity-100'}`}>
                  {quickCounts.map(count => (
                    <button
                      key={count}
                      onClick={() => handleFlashcardCountChange(count)}
                      disabled={isGenerating || isParsing || useAutoCount}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        flashcardCount === count 
                          ? 'bg-blue-100 text-blue-700 font-medium border border-blue-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                      } ${isGenerating || isParsing || useAutoCount ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {count}
                    </button>
                  ))}
                  <button
                    onClick={() => handleFlashcardCountChange(MAX_FLASHCARDS)}
                    disabled={isGenerating || isParsing || useAutoCount}
                    className={`px-2 py-1 text-xs rounded-md transition-all flex items-center ${
                      flashcardCount === MAX_FLASHCARDS 
                        ? 'bg-blue-100 text-blue-700 font-medium border border-blue-300' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                    } ${isGenerating || isParsing || useAutoCount ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <CrownIcon className="w-3 h-3 mr-1" />
                    <span>{MAX_FLASHCARDS}</span>
                  </button>
                </div>

                {/* Slider control */}
                <div className={`transition-opacity duration-150 ${useAutoCount ? 'opacity-40' : 'opacity-100'}`}>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFlashcardCountChange(flashcardCount - 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full 
                        ${(flashcardCount <= MIN_FLASHCARDS || isGenerating || isParsing || useAutoCount) ? 
                          'text-gray-400 bg-gray-100' : 
                          'text-gray-700 bg-blue-100 hover:bg-blue-200 active:bg-blue-300'}`}
                      disabled={flashcardCount <= MIN_FLASHCARDS || isGenerating || isParsing || useAutoCount}
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex-1 relative h-7 flex items-center">
                      {/* Track marks */}
                      <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                        {[1, 2, 3, 4].map((_, index) => (
                          <div key={index} className="w-px h-2 bg-gray-300 mt-2.5"></div>
                        ))}
                      </div>
                      
                      <input
                        type="range"
                        min={MIN_FLASHCARDS}
                        max={MAX_FLASHCARDS}
                        value={flashcardCount}
                        onChange={(e) => setFlashcardCount(parseInt(e.target.value, 10))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer 
                          bg-gradient-to-r from-green-200 via-blue-200 to-purple-200 
                          accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
                        disabled={isGenerating || isParsing || useAutoCount}
                      />
                    </div>
                    
                    <button
                      onClick={() => handleFlashcardCountChange(flashcardCount + 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full 
                        ${(flashcardCount >= MAX_FLASHCARDS || isGenerating || isParsing || useAutoCount) ? 
                          'text-gray-400 bg-gray-100' : 
                          'text-gray-700 bg-blue-100 hover:bg-blue-200 active:bg-blue-300'}`}
                      disabled={flashcardCount >= MAX_FLASHCARDS || isGenerating || isParsing || useAutoCount}
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="relative group">
                      <div 
                        className={`${getCountColor()} text-white font-medium rounded-lg px-3 py-1 min-w-10 text-center text-xs transition-all`}
                      >
                        {flashcardCount}
                      </div>
                      <div className="absolute bottom-full right-0 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          {getCountTooltip()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Auto Count Checkbox */}
                <div className="mt-3 flex items-center">
                  <input
                    id="autoCountCheckbox"
                    type="checkbox"
                    checked={useAutoCount}
                    onChange={(e) => setUseAutoCount(e.target.checked)}
                    disabled={isGenerating || isParsing}
                    className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <label htmlFor="autoCountCheckbox" className="ml-2 text-xs text-gray-700 cursor-pointer">
                    Auto-choose count based on content length
                  </label>
                  {useAutoCount && (
                    <span className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                      AI optimized
                    </span>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button 
                onClick={generateFlashcardsWithAI}
                className={`w-full flex items-center justify-center
                  bg-gradient-to-r from-blue-500 to-sky-500 text-white
                  px-4 py-3 rounded-md hover:from-blue-600 hover:to-sky-600
                  transition-all shadow-md relative overflow-hidden
                  ${buttonState.disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={buttonState.disabled}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" style={{ animation: 'shimmer 2s infinite' }}></div>
                <div className="flex items-center gap-2 z-10">
                  {buttonState.icon}
                  <span>{buttonState.text}</span>
                </div>
              </button>
              
              {/* Brief Info - super compact */}
              <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                <div className="flex items-center text-blue-600 mb-1">
                  <InfoIcon className="w-3 h-3 mr-1" />
                  <span className="font-medium">All generated flashcards are fully editable</span>
                </div>
                <div>
                  Upload a PDF or paste notes ({MIN_CHARACTERS}+ chars) → Specify count or auto → 
                  Generate → Edit as needed.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIGenerateOverlay;