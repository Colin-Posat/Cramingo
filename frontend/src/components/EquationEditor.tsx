import React, { useState, useRef, useEffect } from 'react';
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
      name: 'Variables',
      symbols: [
        { symbol: '𝑎', name: 'italic-a' },
        { symbol: '𝑏', name: 'italic-b' },
        { symbol: '𝑐', name: 'italic-c' },
        { symbol: '𝑑', name: 'italic-d' },
        { symbol: '𝑒', name: 'italic-e' },
        { symbol: '𝑓', name: 'italic-f' },
        { symbol: '𝑔', name: 'italic-g' },
        { symbol: '𝑚', name: 'italic-m' },
        { symbol: '𝑛', name: 'italic-n' },
        { symbol: '𝑝', name: 'italic-p' },
        { symbol: '𝑞', name: 'italic-q' },
        { symbol: '𝑟', name: 'italic-r' },
        { symbol: '𝑠', name: 'italic-s' },
        { symbol: '𝑡', name: 'italic-t' },
        { symbol: '𝑢', name: 'italic-u' },
        { symbol: '𝑣', name: 'italic-v' },
        { symbol: '𝑤', name: 'italic-w' },
        { symbol: '𝑥', name: 'italic-x' },
        { symbol: '𝑦', name: 'italic-y' },
        { symbol: '𝑧', name: 'italic-z' }
      ]
    },
    {
      name: 'Unit Vectors',
      symbols: [
        { symbol: 'î', name: 'unit-i' },
        { symbol: 'ĵ', name: 'unit-j' },
        { symbol: 'k̂', name: 'unit-k' },
        { symbol: 'x̂', name: 'unit-x' },
        { symbol: 'ŷ', name: 'unit-y' },
        { symbol: 'ẑ', name: 'unit-z' },
        { symbol: 'r̂', name: 'unit-r' },
        { symbol: 'ρ̂', name: 'unit-rho' },  // Added unit vector for rho
        { symbol: 'θ̂', name: 'unit-theta' },
        { symbol: 'φ̂', name: 'unit-phi' },
        { symbol: '⃗', name: 'vector-arrow' }
      ]
    },
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
        { symbol: 'arcsin', name: 'arcsin' },  // Added inverse trig function
        { symbol: 'arccos', name: 'arccos' },  // Added inverse trig function
        { symbol: 'arctan', name: 'arctan' },  // Added inverse trig function
        { symbol: 'sin⁻¹', name: 'sin-inverse' }, // Alternative notation
        { symbol: 'cos⁻¹', name: 'cos-inverse' }, // Alternative notation
        { symbol: 'tan⁻¹', name: 'tan-inverse' }, // Alternative notation
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
    },
    {
      name: 'Superscript',
      symbols: [
        { symbol: '²', name: 'squared' },
        { symbol: '³', name: 'cubed' },
        { symbol: '⁴', name: 'to-fourth' },
        { symbol: '⁵', name: 'to-fifth' },
        { symbol: '⁶', name: 'to-sixth' },
        { symbol: '⁷', name: 'to-seventh' },
        { symbol: '⁸', name: 'to-eighth' },
        { symbol: '⁹', name: 'to-ninth' },
        { symbol: '⁰', name: 'to-zero' },
        { symbol: '⁻', name: 'negative' },
        { symbol: '⁺', name: 'positive' },
        { symbol: 'ⁿ', name: 'to-n' },
      ]
    },
    {
      name: 'Subscript',
      symbols: [
        { symbol: '₀', name: 'sub-0' },
        { symbol: '₁', name: 'sub-1' },
        { symbol: '₂', name: 'sub-2' },
        { symbol: '₃', name: 'sub-3' },
        { symbol: '₄', name: 'sub-4' },
        { symbol: '₅', name: 'sub-5' },
        { symbol: '₆', name: 'sub-6' },
        { symbol: '₇', name: 'sub-7' },
        { symbol: '₈', name: 'sub-8' },
        { symbol: '₉', name: 'sub-9' },
        { symbol: 'ₓ', name: 'sub-x' },
        { symbol: 'ᵢ', name: 'sub-i' },
      ]
    },
    {
      name: 'Integrals',
      symbols: [
        { symbol: '∫', name: 'integral' },
        { symbol: '∬', name: 'double-integral' },
        { symbol: '∭', name: 'triple-integral' },
        { symbol: '∮', name: 'contour-integral' },
        { symbol: '∯', name: 'surface-integral' },
        { symbol: '∰', name: 'volume-integral' },
        { symbol: '\\int_{0}^{1}', name: 'bounded-integral' },
        { symbol: 'dx', name: 'dx' },
        { symbol: 'dy', name: 'dy' },
        { symbol: 'dz', name: 'dz' },
        { symbol: 'dt', name: 'dt' },
        { symbol: 'dθ', name: 'dtheta' },
      ]
    }
  ];

  // State for active category
  const [activeCategory, setActiveCategory] = useState('Operators');

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

      {/* Category tabs - Centered with flex, no overflow */}
      <div className="flex flex-wrap justify-center mb-4">
        {categories.map(category => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(category.name)}
            className={`px-2 py-1 m-1 whitespace-nowrap rounded-md text-xs font-medium ${
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

// Enhanced formatMathNotation function with improved integral handling
const formatMathNotation = (text: string): string => {
  let result = text;
  
  // Convert superscripts (^) - Keep this part unchanged
  const caretRegex = /([^\^])\^([a-zA-Z0-9]|{([^}]+)})/g;
  result = result.replace(caretRegex, (match, base, exponent, bracedExponent) => {
    // If the exponent is enclosed in curly braces, extract it
    const actualExponent = bracedExponent !== undefined ? bracedExponent : exponent;
    
    // Map for converting characters to their superscript equivalents
    const superscriptMap: Record<string, string> = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
      'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
      'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
      'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'q': 'ᑫ', 'r': 'ʳ',
      's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ',
      'y': 'ʸ', 'z': 'ᶻ',
      'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ', 'F': 'ᶠ',
      'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
      'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'Q': 'Q', 'R': 'ᴿ',
      'S': 'ˢ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'X': 'ˣ',
      'Y': 'ʸ', 'Z': 'ᶻ'
    };
    
    let superscript = '';
    for (const char of actualExponent) {
      superscript += superscriptMap[char] || char;
    }
    
    return base + superscript;
  });
  
  // Convert subscripts (_) - Keep this part unchanged
  const underscoreRegex = /([^_])_([a-zA-Z0-9]|{([^}]+)})/g;
  result = result.replace(underscoreRegex, (match, base, subscript, bracedSubscript) => {
    // If the subscript is enclosed in curly braces, extract it
    const actualSubscript = bracedSubscript !== undefined ? bracedSubscript : subscript;
    
    // Map for converting characters to their subscript equivalents
    const subscriptMap: Record<string, string> = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', 
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
      'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 
      'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 
      'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 
      'v': 'ᵥ', 'x': 'ₓ'
    };
    
    let subscriptText = '';
    for (const char of actualSubscript) {
      subscriptText += subscriptMap[char] || char;
    }
    
    return base + subscriptText;
  });
  
  // IMPROVED: Handle integral bounds using \int_{lower}^{upper} with better styling
  // First, handle different integral types
  result = result.replace(/\\(int|iint|iiint|oint|oiint|oiiint)/g, (match, type) => {
    const integralMap: Record<string, string> = {
      'int': '∫',
      'iint': '∬',
      'iiint': '∭',
      'oint': '∮',
      'oiint': '∯',
      'oiiint': '∰'
    };
    return integralMap[type] || '∫';
  });
  
  // Now handle bounds with better styling
  // This regex captures integral symbol with potential bounds
  const integralRegex = /(∫|∬|∭|∮|∯|∰)(?:_\{([^}]+)\})?(?:\^{([^}]+)})?/g;
  
  result = result.replace(integralRegex, (match, integral, lowerBound, upperBound) => {
    // Start with the integral symbol
    let formatted = integral;
    
    // Function to convert text to superscript or subscript
    const convertToScript = (text: string, isSuper: boolean): string => {
      // Define map types properly to avoid TypeScript errors
      type ScriptMap = {[key: string]: string};
      
      // Superscript map
      const superscriptMap: ScriptMap = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
        '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
        'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
        'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
        'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'q': 'ᑫ', 'r': 'ʳ',
        's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ',
        'y': 'ʸ', 'z': 'ᶻ',
        'A': 'ᴬ', 'B': 'ᴮ', 'C': 'ᶜ', 'D': 'ᴰ', 'E': 'ᴱ', 'F': 'ᶠ',
        'G': 'ᴳ', 'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
        'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'Q': 'Q', 'R': 'ᴿ',
        'S': 'ˢ', 'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ', 'X': 'ˣ',
        'Y': 'ʸ', 'Z': 'ᶻ',
        ' ': ' ', ',': ',' // Preserve spaces and commas
      };
      
      // Subscript map
      const subscriptMap: ScriptMap = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', 
        '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
        '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
        'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 
        'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 
        'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 
        'v': 'ᵥ', 'x': 'ₓ',
        ' ': ' ', ',': ',' // Preserve spaces and commas
      };
      
      // Choose the appropriate map
      const mapper = isSuper ? superscriptMap : subscriptMap;
      
      let result = '';
      for (const char of text) {
        // Convert to lowercase for lookup and provide a fallback
        const lowerChar = char.toLowerCase();
        result += mapper[lowerChar] !== undefined ? mapper[lowerChar] : char;
      }
      return result;
    };
    
    // If we have upper bound, add it with proper spacing
    if (upperBound) {
      formatted = formatted + ' ' + convertToScript(upperBound, true);
    }
    
    // If we have lower bound, add it with proper spacing
    if (lowerBound) {
      formatted = formatted + ' ' + convertToScript(lowerBound, false);
    }
    
    return formatted;
  });
  
  // Special case for common integral expressions like dx, dy, etc.
  result = result.replace(/\b(d[a-zA-Z])\b/g, '$1');
  
  return result;
};

// Main Equation Editor component
const EquationEditor: React.FC<EquationEditorProps> = ({ 
  onSave, 
  onCancel, 
  initialValue = '' 
}) => {
  const [equation, setEquation] = useState(initialValue);
  const [previewEquation, setPreviewEquation] = useState('');
  const [showKeypad, setShowKeypad] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Update the preview whenever the equation changes
  useEffect(() => {
    setPreviewEquation(formatMathNotation(equation));
  }, [equation]);
  
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
        placeholder="Type or insert math equation here (e.g., x^2 + y_1 = z)"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004a74]/20 focus:outline-none min-h-[100px] font-mono"
      />
      
      {/* Preview section with title */}
      <div className="mt-2">
        <div className="text-sm font-medium text-gray-600 mb-1">Preview:</div>
        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[50px]">
          <div className="font-mono text-gray-800 whitespace-pre-wrap">
            {previewEquation}
          </div>
        </div>
      </div>
      
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
            onClick={() => onSave(previewEquation)} // Save the formatted equation with superscripts
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
      
      {/* Quick Reference - simplified */}
      <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-blue-50 text-sm">
  <h4 className="font-bold text-[#004a74] mb-1">Quick Reference:</h4>
  <div>
    <span className="font-bold">Basic Notation:</span>
    <div className="flex">
      <div className="w-1/2">
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><span className="font-mono">x^2</span> → x² (superscript)</li>
          <li><span className="font-mono">x_2</span> → x₂ (subscript)</li>
          <li><span className="font-mono">\int_{0}^{1}</span> → ∫₀¹ (integral with bounds)</li>
        </ul>
      </div>
      <div className="w-1/2">
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li><span className="font-mono">x_2</span> → x₂ (single-character subscript)</li>
          <li><span className="font-mono">x_{'{'+'10'+'}'}</span> → x₁₀ (multi-character subscript needs curly braces)</li>
          <li><span className="font-mono">x_{'{'}"i"+1{'}'}</span> → xᵢ₊₁ (expressions as subscript need curly braces)</li>
        </ul>
      </div>
    </div>
  </div>
</div>
</div>
  );
};

export default EquationEditor;