import { useState, useEffect, useCallback } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number; // 每个字符的延迟（毫秒）
  startDelay?: number; // 开始前的延迟
  onComplete?: () => void; // 完成回调
}

export const useTypewriter = ({
  text,
  speed = 30,
  startDelay = 100,
  onComplete
}: UseTypewriterOptions) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startTyping = useCallback(() => {
    if (!text || isTyping) {
      return;
    }

    setIsTyping(true);
    setIsComplete(false);
    setDisplayText('');

    // 开始延迟
    setTimeout(() => {
      let currentIndex = 0;

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          currentIndex++;
          setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          setIsComplete(true);
          onComplete?.();
        }
      };

      typeNextChar();
    }, startDelay);
  }, [text, speed, startDelay, onComplete, isTyping]);

  // 🔧 自动监听text变化并开始打字
  useEffect(() => {
    if (text && !isTyping && !isComplete) {
      startTyping();
    }
  }, [text, isTyping, isComplete, startTyping]);

  // 重置函数
  const reset = useCallback(() => {
    setDisplayText('');
    setIsTyping(false);
    setIsComplete(false);
  }, []);

  // 立即完成
  const complete = useCallback(() => {
    setDisplayText(text);
    setIsTyping(false);
    setIsComplete(true);
    onComplete?.();
  }, [text, onComplete]);

  return {
    displayText,
    isTyping,
    isComplete,
    startTyping,
    reset,
    complete
  };
};
