import React from 'react';
import { 
  PlusIcon, 
  SearchIcon, 
  BookIcon, 
  LightbulbIcon,
  ArrowRightIcon 
} from 'lucide-react';

type EmptyStateProps = {
  onCreateSet: () => void;
  onSearchSets: () => void;
};

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateSet, onSearchSets }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] py-8 w-full">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-blue-100 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#004a74] to-[#0074c2]"></div>
        
        {/* Decorative background elements */}
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-blue-50 rounded-full opacity-60"></div>
        <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-blue-50 rounded-full opacity-60"></div>
        
        {/* Icon with subtle pulse animation */}
        <div className="relative mb-6 inline-block">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
          <div className="relative bg-gradient-to-r from-[#004a74] to-[#0074c2] p-5 rounded-full shadow-lg">
            <BookIcon className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-[#004a74] mb-3">
          Ready to start studying?
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-xs mx-auto">
          Create your first flashcard set or find sets from your classmates.
        </p>
        
        {/* Action buttons with improved styling */}
        <div className="space-y-3">
          <button
            onClick={onCreateSet}
            className="w-full bg-gradient-to-r from-[#004a74] to-[#0074c2] text-white py-3 px-6 rounded-xl 
              flex items-center justify-center gap-2 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="font-medium">Create Your First Set</span>
            <ArrowRightIcon className="w-4 h-4 ml-1" />
          </button>
          
          <button
            onClick={onSearchSets}
            className="w-full bg-white text-[#004a74] py-3 px-6 rounded-xl border-2 border-[#004a74] 
              flex items-center justify-center gap-2 hover:bg-blue-50 transition-all duration-300"
          >
            <SearchIcon className="w-5 h-5" />
            <span className="font-medium">Find Existing Sets</span>
          </button>
        </div>
        
        {/* Simple tip at the bottom */}
        <div className="mt-8 pt-4 border-t border-blue-100 flex items-center justify-center text-sm text-gray-500">
          <LightbulbIcon className="w-4 h-4 mr-2 text-yellow-500" />
          <span>Pro tip: Create sets to earn study points!</span>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;