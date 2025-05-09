// src/components/OptimizedFlashcardPreview.tsx
import React, { useState } from 'react';
import {
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Grid as GridIcon,
  List as ListIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
} from 'lucide-react';

export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  questionImage?: string;
  answerImage?: string;
}

export interface FlashcardSet {
  flashcards: Flashcard[];
}

export interface OptimizedFlashcardPreviewProps {
  flashcardSet: FlashcardSet;
  /** Optional callback to show an image in a modal/previewer */
  setPreviewImage?: (url: string) => void;
}

const OptimizedFlashcardPreview: React.FC<OptimizedFlashcardPreviewProps> = ({
  flashcardSet,
  setPreviewImage,
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllAnswers, setShowAllAnswers] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'index' | 'alphabetical'>('index');

  // 1) Filter cards by search
  const filteredCards = flashcardSet.flashcards.filter((card) =>
    card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2) Sort cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.question.localeCompare(b.question);
    }
    // 'index' means original order
    return 0;
  });

  // 3) Handlers
  const toggleCardExpansion = (index: number) => {
    const next = new Set(expandedCards);
    next.has(index) ? next.delete(index) : next.add(index);
    setExpandedCards(next);
  };

  const toggleAllAnswers = () => {
    if (showAllAnswers) {
      setExpandedCards(new Set());
    } else {
      setExpandedCards(new Set(sortedCards.map((_, i) => i)));
    }
    setShowAllAnswers(!showAllAnswers);
  };

  const showImagePreview = (url: string) => {
    if (setPreviewImage) setPreviewImage(url);
  };

  // 4) Sub-components
  const CardImage: React.FC<{ image?: string; alt: string }> = ({ image, alt }) => {
    if (!image) return null;
    return (
      <div className="relative border rounded-lg overflow-hidden mb-2 bg-gray-50">
        <img
          src={image}
          alt={alt}
          className="w-full h-auto max-h-[100px] object-contain cursor-zoom-in"
          onClick={() => showImagePreview(image)}
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="bg-white/70 backdrop-blur-sm p-1.5 rounded-lg">
            <SearchIcon className="w-4 h-4 text-[#004a74]" />
          </div>
        </div>
      </div>
    );
  };

  const GridCard: React.FC<{ card: Flashcard; index: number }> = ({ card, index }) => {
    const isExpanded = expandedCards.has(index);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-[#004a74]/30 overflow-hidden flex flex-col h-full">
        <div className="bg-gradient-to-r from-[#004a74]/90 to-[#0060a1]/90 text-white px-3 py-2 text-sm flex justify-between items-center">
          <span className="font-medium truncate">Card {index + 1}</span>
        </div>
        <div className="p-3 flex-grow flex flex-col">
          {/* Question */}
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-[#004a74] mb-1 flex items-center">
              <span className="bg-[#e3f3ff] text-[#004a74] px-1.5 py-0.5 rounded text-xs mr-1.5">Q</span>
              Question
            </h4>
            <div className="bg-gray-50 p-2 rounded border border-gray-200 min-h-[60px]">
              <CardImage image={card.questionImage} alt="Question" />
              <p className="text-sm text-gray-800 break-words line-clamp-3">{card.question}</p>
            </div>
          </div>
          {/* Answer toggle */}
          <button
            onClick={() => toggleCardExpansion(index)}
            className="w-full flex items-center justify-between text-xs font-semibold text-[#004a74] p-1 border border-blue-100 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <span className="bg-[#e3f3ff] text-[#004a74] px-1.5 py-0.5 rounded text-xs mr-1.5">A</span>
              Answer
            </div>
            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          </button>
          {isExpanded && (
            <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200 animate-fadeIn">
              <CardImage image={card.answerImage} alt="Answer" />
              <p className="text-sm text-gray-800 break-words">{card.answer}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ListCard: React.FC<{ card: Flashcard; index: number }> = ({ card, index }) => {
    const isExpanded = expandedCards.has(index);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all hover:border-[#004a74]/30 overflow-hidden">
        <div className="grid grid-cols-12 w-full">
          {/* Question */}
          <div className="col-span-12 sm:col-span-6 p-3 border-b sm:border-b-0 sm:border-r border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-[#004a74] flex items-center">
                <span className="bg-[#e3f3ff] text-[#004a74] px-2 py-0.5 rounded text-xs mr-1.5">Q</span>
                <span className="text-gray-500 mr-1 font-normal">{index + 1}.</span>
                Question
              </h4>
            </div>
            <div className="bg-gray-50 p-2 rounded border border-gray-200">
              <CardImage image={card.questionImage} alt="Question" />
              <p className="text-sm text-gray-800">{card.question}</p>
            </div>
          </div>
          {/* Answer */}
          <div className={`col-span-12 sm:col-span-6 p-3 ${isExpanded ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-[#004a74] flex items-center">
                <span className="bg-[#e3f3ff] text-[#004a74] px-2 py-0.5 rounded text-xs mr-1.5">A</span>
                Answer
              </h4>
            </div>
            <div className="bg-gray-50 p-2 rounded border border-gray-200">
              <CardImage image={card.answerImage} alt="Answer" />
              <p className="text-sm text-gray-800">{card.answer}</p>
            </div>
          </div>
        </div>
        {/* Mobile toggle */}
        <button
          onClick={() => toggleCardExpansion(index)}
          className="w-full flex items-center justify-center p-1 bg-blue-50 text-[#004a74] border-t border-blue-100 hover:bg-blue-100 transition-colors sm:hidden"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="w-4 h-4 mr-1" /> Hide Answer
            </>
          ) : (
            <>
              <ChevronDownIcon className="w-4 h-4 mr-1" /> Show Answer
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative w-full sm:w-auto sm:flex-grow">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004a74]/30 focus:border-[#004a74] transition-all"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-white border border-gray-300 rounded-lg flex overflow-hidden">
            <button
              onClick={() => setViewType('grid')}
              className={`px-3 py-2 flex items-center gap-1 text-sm ${
                viewType === 'grid'
                  ? 'bg-[#004a74] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GridIcon className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`px-3 py-2 flex items-center gap-1 text-sm ${
                viewType === 'list'
                  ? 'bg-[#004a74] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ListIcon className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
            </button>
          </div>
          <button
            onClick={toggleAllAnswers}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm ${
              showAllAnswers
                ? 'bg-blue-100 border-blue-200 text-[#004a74]'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {showAllAnswers ? (
              <>
                <EyeOffIcon className="w-4 h-4" /> <span className="hidden sm:inline">Hide Answers</span>
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" /> <span className="hidden sm:inline">Show Answers</span>
              </>
            )}
          </button>
          <div className="relative">
            <button
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 text-sm"
              onClick={() => setSortBy(sortBy === 'index' ? 'alphabetical' : 'index')}
            >
              <FilterIcon className="w-4 h-4" />{' '}
              <span className="hidden sm:inline">
                {sortBy === 'index' ? 'Sort A→Z' : 'Default Order'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* No results */}
      {filteredCards.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-600">No flashcards match your search criteria.</p>
        </div>
      )}

      {/* Cards */}
      {filteredCards.length > 0 && (
        <>
          <div className="text-sm text-gray-500">
            Showing {filteredCards.length} of {flashcardSet.flashcards.length} cards
          </div>
          {viewType === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedCards.map((card, i) => (
                <GridCard key={card.id} card={card} index={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCards.map((card, i) => (
                <ListCard key={card.id} card={card} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OptimizedFlashcardPreview;
