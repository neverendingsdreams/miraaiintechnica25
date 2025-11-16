import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { QuizAnswers } from '@/components/PersonalizationQuiz';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<QuizAnswers | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mira_user_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load preferences');
      }
    }
  }, []);

  const updatePreference = (key: keyof QuizAnswers, value: string) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
      setHasChanges(true);
    }
  };

  const savePreferences = () => {
    if (preferences) {
      localStorage.setItem('mira_user_preferences', JSON.stringify(preferences));
      setHasChanges(false);
      toast({
        title: "Preferences Saved",
        description: "Your style profile has been updated successfully.",
      });
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('mira_conversation_history');
    toast({
      title: "Chat History Cleared",
      description: "All conversation history has been deleted.",
    });
  };

  const resetProfile = () => {
    localStorage.removeItem('mira_user_preferences');
    localStorage.removeItem('mira_conversation_history');
    toast({
      title: "Profile Reset",
      description: "All preferences and history have been cleared.",
    });
    navigate('/quiz');
  };

  const retakeQuiz = () => {
    navigate('/quiz');
  };

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              No Profile Found
            </CardTitle>
            <CardDescription>
              You haven't completed your style profile yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/quiz')} className="w-full gap-2">
              <Sparkles className="w-4 h-4" />
              Take the Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="w-8 h-8" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your style preferences and app settings
            </p>
          </div>

          {/* Style Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Your Style Profile
              </CardTitle>
              <CardDescription>
                Update your preferences to get better recommendations from Mira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gender */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Gender</Label>
                <RadioGroup value={preferences.gender} onValueChange={(v) => updatePreference('gender', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-binary" id="non-binary" />
                    <Label htmlFor="non-binary" className="font-normal">Non-Binary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                    <Label htmlFor="prefer-not-to-say" className="font-normal">Prefer Not to Say</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Style */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Style Preference</Label>
                <RadioGroup value={preferences.style} onValueChange={(v) => updatePreference('style', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="casual" id="casual" />
                    <Label htmlFor="casual" className="font-normal">Casual & Comfortable</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="formal" id="formal" />
                    <Label htmlFor="formal" className="font-normal">Formal & Professional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sporty" id="sporty" />
                    <Label htmlFor="sporty" className="font-normal">Sporty & Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="trendy" id="trendy" />
                    <Label htmlFor="trendy" className="font-normal">Trendy & Fashion-Forward</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="classic" id="classic" />
                    <Label htmlFor="classic" className="font-normal">Classic & Timeless</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Colors */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Color Palette</Label>
                <RadioGroup value={preferences.colors} onValueChange={(v) => updatePreference('colors', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="neutrals" id="neutrals" />
                    <Label htmlFor="neutrals" className="font-normal">Neutrals (Black, White, Beige)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bold" id="bold" />
                    <Label htmlFor="bold" className="font-normal">Bold Colors (Red, Blue, Green)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pastels" id="pastels" />
                    <Label htmlFor="pastels" className="font-normal">Pastels (Pink, Lavender, Mint)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="earth" id="earth" />
                    <Label htmlFor="earth" className="font-normal">Earth Tones (Brown, Olive, Rust)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mixed" id="mixed" />
                    <Label htmlFor="mixed" className="font-normal">I Love Mixing Everything!</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Budget */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Budget Range</Label>
                <RadioGroup value={preferences.budget} onValueChange={(v) => updatePreference('budget', v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="budget" id="budget" />
                    <Label htmlFor="budget" className="font-normal">Budget-Friendly (Under $50)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="font-normal">Moderate ($50-$150)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mid" id="mid" />
                    <Label htmlFor="mid" className="font-normal">Mid-Range ($150-$300)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="premium" id="premium" />
                    <Label htmlFor="premium" className="font-normal">Premium ($300+)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flexible" id="flexible" />
                    <Label htmlFor="flexible" className="font-normal">Flexible - Depends on the Item</Label>
                  </div>
                </RadioGroup>
              </div>

              {hasChanges && (
                <Button onClick={savePreferences} className="w-full gap-2">
                  <Sparkles className="w-4 h-4" />
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Manage your data and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={retakeQuiz} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Retake Quiz
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2">
                    <Trash2 className="w-4 h-4" />
                    Clear Chat History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all your conversation history with Mira. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory}>Clear History</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="w-4 h-4" />
                    Reset Profile
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Your Profile?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all your preferences and chat history. You'll be redirected to take the quiz again. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetProfile} className="bg-destructive text-destructive-foreground">
                      Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
