import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export interface QuizAnswers {
  gender: string;
  style: string;
  colors: string;
  occasions: string;
  bodyType: string;
  budget: string;
}

interface PersonalizationQuizProps {
  onComplete: (answers: QuizAnswers) => void;
  onSkip: () => void;
}

const questions = [
  {
    id: 'gender',
    question: "How do you identify?",
    options: [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'non-binary', label: 'Non-Binary' },
      { value: 'prefer-not-to-say', label: 'Prefer Not to Say' },
    ],
  },
  {
    id: 'style',
    question: "What's your go-to style?",
    options: [
      { value: 'casual', label: 'Casual & Comfortable' },
      { value: 'formal', label: 'Formal & Professional' },
      { value: 'sporty', label: 'Sporty & Active' },
      { value: 'trendy', label: 'Trendy & Fashion-Forward' },
      { value: 'classic', label: 'Classic & Timeless' },
    ],
  },
  {
    id: 'colors',
    question: "Which color palette do you prefer?",
    options: [
      { value: 'neutrals', label: 'Neutrals (Black, White, Beige)' },
      { value: 'bold', label: 'Bold Colors (Red, Blue, Green)' },
      { value: 'pastels', label: 'Pastels (Pink, Lavender, Mint)' },
      { value: 'earth', label: 'Earth Tones (Brown, Olive, Rust)' },
      { value: 'mixed', label: 'I Love Mixing Everything!' },
    ],
  },
  {
    id: 'occasions',
    question: "What occasions do you dress for most?",
    options: [
      { value: 'work', label: 'Work & Professional Events' },
      { value: 'casual', label: 'Everyday Casual Outings' },
      { value: 'social', label: 'Social Events & Parties' },
      { value: 'athletic', label: 'Gym & Athletic Activities' },
      { value: 'mixed', label: 'Variety of Occasions' },
    ],
  },
  {
    id: 'bodyType',
    question: "What fit do you prefer?",
    options: [
      { value: 'fitted', label: 'Fitted & Tailored' },
      { value: 'relaxed', label: 'Relaxed & Loose' },
      { value: 'balanced', label: 'Balanced & Standard' },
      { value: 'oversized', label: 'Oversized & Comfortable' },
    ],
  },
  {
    id: 'budget',
    question: "What's your typical budget per outfit?",
    options: [
      { value: 'budget', label: 'Budget-Friendly (Under $50)' },
      { value: 'moderate', label: 'Moderate ($50-$150)' },
      { value: 'mid', label: 'Mid-Range ($150-$300)' },
      { value: 'premium', label: 'Premium ($300+)' },
      { value: 'flexible', label: 'Flexible - Depends on the Item' },
    ],
  },
];

export const PersonalizationQuiz = ({ onComplete, onSkip }: PersonalizationQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canGoNext = answers[currentQ.id as keyof QuizAnswers];

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQ.id]: value });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(answers as QuizAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    setCurrentQuestion(currentQuestion - 1);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Let's Personalize Your Experience</CardTitle>
          </div>
          <CardDescription>
            Question {currentQuestion + 1} of {questions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{currentQ.question}</h3>
            <RadioGroup
              value={answers[currentQ.id as keyof QuizAnswers] || ''}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {currentQ.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              {currentQuestion > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={onSkip}
              >
                Skip for Now
              </Button>
            </div>
            
            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              className="gap-2"
            >
              {isLastQuestion ? 'Complete' : 'Next'}
              {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex gap-1 justify-center pt-2">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentQuestion
                    ? 'w-8 bg-primary'
                    : idx < currentQuestion
                    ? 'w-1.5 bg-primary'
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
