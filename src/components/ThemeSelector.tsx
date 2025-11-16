import { Palette, Sparkles, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, Theme } from '@/hooks/useTheme';

const themes = [
  { id: 'default' as Theme, name: 'Classic', icon: Sparkles },
  { id: 'colorful' as Theme, name: 'Colorful', icon: Palette },
  { id: 'spooky' as Theme, name: 'Spooky', icon: Ghost },
];

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  const currentTheme = themes.find(t => t.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{currentTheme.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {t.name}
              {t.id === theme && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
