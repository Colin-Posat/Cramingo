import React, { useState, useRef } from 'react';
import { 
  X as XIcon,
  Terminal as TerminalIcon,
  Save as SaveIcon
} from 'lucide-react';

// Define proper types for component props
interface EquationKeypadProps {
  onInsert: (symbol: string) => void;
  onClose: () => void;
}

// Define the EquationKeypad component
const EquationKeypad: React.FC<EquationKeypadProps> = ({ onInsert, onClose }) => {
  // Categories for organizing symbols
  const categories = [
    { 
      name: 'Greek', 
      symbols: [
        { symbol: 'α', name: 'alpha' },
        { symbol: 'β', name: 'beta' },
        { symbol: 'γ', name: 'gamma' },
        { symbol: 'Γ', name: 'Gamma' },
        { symbol: 'δ', name: 'delta' },
        { symbol: 'Δ', name: 'Delta' },
        { symbol: 'ε', name: 'epsilon' },
        { symbol: 'η', name: 'eta' },
        { symbol: 'θ', name: 'theta' },
        { symbol: 'Θ', name: 'Theta' },
        { symbol: 'λ', name: 'lambda' },
        { symbol: 'Λ', name: 'Lambda' },
        { symbol: 'μ', name: 'mu' },
        { symbol: 'π', name: 'pi' },
        { symbol: 'Π', name: 'Pi' },
        { symbol: 'ρ', name: 'rho' },
        { symbol: 'σ', name: 'sigma' },
        { symbol: 'Σ', name: 'Sigma' },
        { symbol: 'τ', name: 'tau' },
        { symbol: 'φ', name: 'phi' },
        { symbol: 'Φ', name: 'Phi' },
        { symbol: 'ω', name: 'omega' },
        { symbol: 'Ω', name: 'Omega' }
      ]
    },
    {
      name: 'Operators',
      symbols: [
        { symbol: '÷', name: 'divide' },
        { symbol: '×', name: 'multiply' },
        { symbol: '±', name: 'plus-minus' },
        { symbol: '∑', name: 'sum' },
        { symbol: '∏', name: 'product' },
        { symbol: '√', name: 'sqrt' },
        { symbol: '∛', name: 'cube-root' },
        { symbol: '∫', name: 'integral' },
        { symbol: '∬', name: 'double-integral' },
        { symbol: '∮', name: 'contour-integral' },
        { symbol: '∇', name: 'nabla' },
        { symbol: '∂', name: 'partial' },
        { symbol: '∞', name: 'infinity' }
      ]
    },
    {
      name: 'Relations',
      symbols: [
        { symbol: '≈', name: 'approx' },
        { symbol: '≠', name: 'not-equal' },
        { symbol: '≤', name: 'less-equal' },
        { symbol: '≥', name: 'greater-equal' },
        { symbol: '∝', name: 'proportional' },
        { symbol: '∈', name: 'element-of' },
        { symbol: '∉', name: 'not-element' },
        { symbol: '⊂', name: 'subset' },
        { symbol: '⊃', name: 'superset' },
        { symbol: '∪', name: 'union' },
        { symbol: '∩', name: 'intersection' },
        { symbol: '≡', name: 'equiv' }
      ]
    },
    {
      name: 'Functions',
      symbols: [
        { symbol: 'sin', name: 'sin' },
        { symbol: 'cos', name: 'cos' },
        { symbol: 'tan', name: 'tan' },
        { symbol: 'ln', name: 'ln' },
        { symbol: 'log', name: 'log' },
        { symbol: 'lim', name: 'lim' },
        { symbol: 'max', name: 'max' },
        { symbol: 'min', name: 'min' },
        { symbol: 'exp', name: 'exp' }
      ]
    },
    {
      name: 'Misc',
      symbols: [
        { symbol: '→', name: 'rightarrow' },
        { symbol: '←', name: 'leftarrow' },
        { symbol: '↑', name: 'uparrow' },
        { symbol: '↓', name: 'downarrow' },
        { symbol: '⇒', name: 'Rightarrow' },
        { symbol: '⟹', name: 'implies' },
        { symbol: '∀', name: 'forall' },
        { symbol: '∃', name: 'exists' },
        { symbol: '¬', name: 'not' },
        { symbol: '⊥', name: 'perpendicular' },
        { symbol: '∥', name: 'parallel' },
        { symbol: '…', name: 'dots' },
        { symbol: '°', name: 'degree' }
      ]
    }
  ];

  // State for active category
  const [activeCategory, setActiveCategory] = useState('Greek');

  // Get symbols for the active category
  const activeSymbols = categories.find(cat => cat.name === activeCategory)?.symbols || [];

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border border-gray-200 w-full max-h-[500px] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-[#004a74]">Math Symbols</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Category tabs - Centered with flex */}
      <div className="flex justify-center overflow-x-auto mb-4 pb-2 scrollbar-thin">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(category.name)}
            className={`px-3 py-1 mx-1 whitespace-nowrap rounded-md text-sm font-medium ${
              activeCategory === category.name
                ? 'bg-[#004a74] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Symbol grid - larger grid with more columns */}
      <div className="grid grid-cols-8 gap-2">
        {activeSymbols.map((item, index) => (
          <button
            key={index}
            onClick={() => onInsert(item.symbol)}
            className="w-full h-10 flex items-center justify-center border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors text-lg"
            title={item.name}
          >
            {item.symbol}
          </button>
        ))}
      </div>

      {/* Common operators and functions in a row - expanded and centered */}
      <div className="mt-4 flex justify-center space-x-2">
        {['+', '-', '=', '(', ')', '[', ']', '{', '}', '|', '_', '^'].map((symbol) => (
          <button
            key={symbol}
            onClick={() => onInsert(symbol)}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
};

// Define proper types for the EquationEditor component
interface EquationEditorProps {
  onSave: (equation: string) => void;
  onCancel: () => void;
  initialValue?: string;
}

// Main Equation Editor component
const EquationEditor: React.FC<EquationEditorProps> = ({ 
  onSave, 
  onCancel, 
  initialValue = '' 
}) => {
  const [equation, setEquation] = useState(initialValue);
  const [showKeypad, setShowKeypad] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Handle direct text input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEquation(e.target.value);
  };

  // Insert symbol at cursor position
  const insertSymbol = (symbol: string) => {
    // Get textarea element
    const textarea = document.getElementById('equation-input') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    const newEquation = 
      equation.substring(0, startPos) + 
      symbol + 
      equation.substring(endPos);
    
    setEquation(newEquation);
    
    // Set cursor position after the inserted symbol
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + symbol.length;
      textarea.selectionEnd = startPos + symbol.length;
    }, 10);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-full" ref={editorRef}>
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-lg font-bold text-[#004a74]">Equation Editor</h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      
      <textarea
        id="equation-input"
        value={equation}
        onChange={handleInput}
        placeholder="Type or insert math equation here..."
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004a74]/20 focus:outline-none min-h-[100px] font-mono"
      />
      
      <div className="mt-3 flex justify-between items-center">
        <button
          onClick={() => setShowKeypad(!showKeypad)}
          className="inline-flex items-center gap-1 text-[#004a74] hover:text-[#00659f]"
        >
          <TerminalIcon className="w-4 h-4" />
          <span className="text-sm">{showKeypad ? 'Hide keypad' : 'Show keypad'}</span>
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(equation)}
            className="px-3 py-1 text-sm bg-[#004a74] text-white rounded-md hover:bg-[#00659f] flex items-center gap-1"
          >
            <SaveIcon className="w-4 h-4" />
            Insert
          </button>
        </div>
      </div>
      
      {showKeypad && (
        <div className="mt-3 flex justify-center">
          <div className="w-full">
            <EquationKeypad onInsert={insertSymbol} onClose={() => setShowKeypad(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EquationEditor;