import { useNavigate } from 'react-router-dom';
import { PersonalizationQuiz, QuizAnswers } from '@/components/PersonalizationQuiz';
import { useToast } from '@/hooks/use-toast';

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuizComplete = (answers: QuizAnswers) => {
    localStorage.setItem('mira_user_preferences', JSON.stringify(answers));
    toast({
      title: "Profile Saved!",
      description: "Mira will now provide personalized recommendations just for you.",
    });
    navigate('/');
  };

  const handleQuizSkip = () => {
    toast({
      title: "Skipped Quiz",
      description: "You can complete your profile anytime from Settings.",
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <PersonalizationQuiz 
        onComplete={handleQuizComplete}
        onSkip={handleQuizSkip}
      />
    </div>
  );
};

export default Quiz;
