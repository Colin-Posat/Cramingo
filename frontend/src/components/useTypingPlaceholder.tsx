import { useState, useEffect, useRef } from 'react';

// Custom hook for auto-typing placeholder text
export const useTypingPlaceholder = (words: string[], typingSpeed = 100, deletingSpeed = 50, delayAfterWord = 2000) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);

  const currentIndex = useRef(0);
  const currentWord = words[wordIndex];

  // Handle cursor blinking
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);
    
    return () => clearInterval(cursorInterval);
  }, []);

  // Handle typing animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDeleting) {
        // Deleting text
        setDisplayText(currentWord.substring(0, currentIndex.current - 1));
        currentIndex.current -= 1;
        
        // When deletion is complete, move to next word
        if (currentIndex.current <= 0) {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      } else {
        // Typing text
        setDisplayText(currentWord.substring(0, currentIndex.current + 1));
        currentIndex.current += 1;
        
        // When word is complete, pause then start deleting
        if (currentIndex.current >= currentWord.length) {
          setTimeout(() => {
            setIsDeleting(true);
          }, delayAfterWord);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);
    
    return () => clearTimeout(timer);
  }, [currentWord, isDeleting, typingSpeed, deletingSpeed, delayAfterWord, words]);

  return { displayText, cursorVisible };
};