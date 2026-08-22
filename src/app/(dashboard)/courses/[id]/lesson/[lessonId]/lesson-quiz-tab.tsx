"use client";

import { useState, useEffect } from "react";
import { getOrGenerateQuiz, submitQuizAttempt } from "@/server/actions/quiz";
import { logEvent } from "@/server/actions/progress";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export function LessonQuizTab({ topicId }: { topicId: string }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const handleStartQuiz = async () => {
    setIsLoading(true);
    logEvent("QUIZ_STARTED", topicId);
    
    const res = await getOrGenerateQuiz(topicId);
    if (res.success && res.quiz) {
      setQuiz(res.quiz);
    }
    
    setIsLoading(false);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !quiz) return;
    
    const currentQ = quiz.questions[currentQuestionIdx];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;
    
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setCurrentQuestionIdx(i => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Finish quiz
      setIsFinished(true);
      const finalScore = (score + (selectedAnswer === quiz.questions[currentQuestionIdx].correctAnswer ? 1 : 0)) / quiz.questions.length;
      submitQuizAttempt(quiz.id, finalScore);
      logEvent("QUIZ_COMPLETED", topicId, JSON.stringify({ score: finalScore }));
    }
  };

  useEffect(() => {
    if (isFinished && quiz) {
      const percentage = Math.round((score / quiz.questions.length) * 100);
      if (percentage === 100) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B5CF6', '#4C1D95', '#F59E0B', '#10B981']
        });
      }
    }
  }, [isFinished, quiz, score]);

  if (isFinished && quiz) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex-1 p-sp-4 flex flex-col items-center justify-center text-center"
      >
        <span className={`material-symbols-outlined text-5xl mb-4 ${percentage >= 70 ? 'text-green-500' : 'text-orange-500'}`}>
          {percentage >= 70 ? 'workspace_premium' : 'model_training'}
        </span>
        <h3 className="font-headline-md text-text-primary mb-2">Quiz Complete!</h3>
        <p className="font-body-base text-text-secondary mb-6">
          You scored {score} out of {quiz.questions.length} ({percentage}%)
        </p>
        <button 
          disabled={isLoading}
          onClick={async () => {
            setIsLoading(true);
            const res = await getOrGenerateQuiz(topicId, true); // true = forceRegenerate
            if (res.success && res.quiz) {
              setQuiz(res.quiz);
              setCurrentQuestionIdx(0);
              setSelectedAnswer(null);
              setShowExplanation(false);
              setScore(0);
              setIsFinished(false);
            } else {
              console.error("Quiz regeneration failed:", res.error);
              alert("Failed to generate new quiz: " + res.error);
            }
            setIsLoading(false);
          }}
          className="px-6 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg border border-white/10 transition-all text-text-primary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Generating New Quiz..." : "Retake Quiz"}
        </button>
      </motion.div>
    );
  }

  if (quiz) {
    const currentQ = quiz.questions[currentQuestionIdx];
    const options = JSON.parse(currentQ.options);
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    return (
      <div className="flex-1 flex flex-col p-sp-4 overflow-y-auto hide-scrollbar relative">
        <div className="mb-6 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-secondary font-label-mono text-label-mono">
              Question {currentQuestionIdx + 1} of {quiz.questions.length}
            </span>
            <span className="text-primary font-label-mono text-label-mono">
              Score: {score}
            </span>
          </div>
          <div className="h-1 w-full bg-surface-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQuestionIdx) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="font-body-lg text-text-primary mb-4 shrink-0">{currentQ.text}</h3>

        <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[200px]">
          {options.map((opt: string, idx: number) => {
            let btnClass = "p-4 text-left rounded-lg border transition-all font-body-base ";
            
            if (!showExplanation) {
              btnClass += selectedAnswer === idx 
                ? "border-primary bg-primary/10 text-primary shadow-glow-primary" 
                : "border-white/10 bg-surface-1 hover:bg-surface-2 text-text-secondary hover:text-text-primary";
            } else {
              if (idx === currentQ.correctAnswer) {
                btnClass += "border-green-500/50 bg-green-500/10 text-green-400";
              } else if (idx === selectedAnswer) {
                btnClass += "border-red-500/50 bg-red-500/10 text-red-400";
              } else {
                btnClass += "border-white/5 bg-surface-1/50 text-text-muted opacity-50";
              }
            }

            return (
              <motion.button
                key={idx}
                disabled={showExplanation}
                onClick={() => setSelectedAnswer(idx)}
                className={btnClass}
                whileHover={!showExplanation ? { scale: 1.01 } : {}}
                whileTap={!showExplanation ? { scale: 0.98 } : {}}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {showExplanation && (
          <div className={`mt-4 p-4 rounded-lg shrink-0 ${isCorrect ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'}`}>
            <p className="font-body-sm font-semibold mb-1">{isCorrect ? 'Correct!' : 'Incorrect.'}</p>
            <p className="font-body-sm text-text-secondary">{currentQ.explanation}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 shrink-0">
          {!showExplanation ? (
            <button
              disabled={selectedAnswer === null}
              onClick={handleSubmitAnswer}
              className="w-full py-3 bg-primary-gradient rounded-lg text-white font-body-base disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow-primary transition-all"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="w-full py-3 bg-surface-2 hover:bg-surface-3 border border-white/10 rounded-lg text-text-primary font-body-base transition-all"
            >
              {currentQuestionIdx < quiz.questions.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-sp-4 flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-4xl text-text-muted mb-4">quiz</span>
      <h3 className="font-headline-md text-text-primary mb-2">Check Your Knowledge</h3>
      <p className="font-body-sm text-text-secondary mb-6 max-w-xs">Take a quick 5-question quiz generated by AI to test your understanding of this lesson.</p>
      <button 
        onClick={handleStartQuiz}
        disabled={isLoading}
        className="px-6 py-2.5 rounded-lg bg-primary-gradient text-white font-body-base hover:scale-105 hover:shadow-glow-primary transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? "Generating Quiz..." : "Start Quiz"}
      </button>
    </div>
  );
}
