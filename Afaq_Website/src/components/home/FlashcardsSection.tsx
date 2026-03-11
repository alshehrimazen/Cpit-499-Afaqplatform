import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  concept: string;
}

const flashcards: Flashcard[] = [
  {
    id: '1',
    concept: 'Sequences',
    front: 'Sequences',
    back: 'An ordered list of numbers following a specific pattern. Arithmetic sequences have a constant difference between terms, while geometric sequences have a constant ratio.'
  },
  {
    id: '2',
    concept: 'Probability',
    front: 'Probability',
    back: 'The likelihood of an event occurring, expressed as a number between 0 and 1. Formula: P(event) = Number of favorable outcomes / Total number of possible outcomes.'
  },
  {
    id: '3',
    concept: 'Speed',
    front: 'Speed',
    back: 'The rate at which an object covers distance. Formula: Speed = Distance ÷ Time. Units are typically km/h or m/s.'
  },
  {
    id: '4',
    concept: 'Verbal Strategy',
    front: 'Verbal Strategy',
    back: 'Techniques for solving verbal reasoning problems: identify keywords, eliminate wrong answers first, look for context clues, and manage time effectively.'
  }
];

export function FlashcardsSection() {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const card = flashcards[currentCard];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl mb-2">EN Flashcards for Core Concepts (Tahsili)</h2>
        <p className="text-gray-600">
          Review essential concepts with interactive flashcards
        </p>
      </div>

      <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-2xl mx-auto">
          {/* Flashcard */}
          <div 
            className="relative h-64 mb-6 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div 
              className={`absolute inset-0 transition-all duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front */}
              <div 
                className={`absolute inset-0 bg-white rounded-xl shadow-xl flex items-center justify-center p-8 backface-hidden ${
                  isFlipped ? 'invisible' : 'visible'
                }`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4 text-sm">
                    Front
                  </div>
                  <h3 className="text-4xl">{card.front}</h3>
                  <p className="text-gray-500 mt-4">Click to flip</p>
                </div>
              </div>

              {/* Back */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-xl flex items-center justify-center p-8 backface-hidden ${
                  isFlipped ? 'visible' : 'invisible'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 text-sm">
                    Back
                  </div>
                  <p className="text-lg leading-relaxed">{card.back}</p>
                  <p className="text-white/70 mt-4 text-sm">Click to flip back</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <Button 
              onClick={handlePrevious}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {currentCard + 1} / {flashcards.length}
              </span>
              <Button
                onClick={handleFlip}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Flip
              </Button>
            </div>

            <Button 
              onClick={handleNext}
              variant="outline"
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {flashcards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentCard(index);
                  setIsFlipped(false);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentCard 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Quick Reference */}
      <Card className="mt-4 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
        <h3 className="text-xl mb-4">💡 Quick Tips for Using Flashcards</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600">•</span>
            <span>Try to recall the answer before flipping the card</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">•</span>
            <span>Review flashcards regularly for better retention</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">•</span>
            <span>Focus on cards you find challenging</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
