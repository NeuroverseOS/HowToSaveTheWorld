import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES, detectBrowserLanguage, detectDeviceLanguage } from "@/lib/language-utils";

interface LanguageSelectionProps {
  onLanguageSelect: (code: string, name: string) => void;
}

export function LanguageSelection({ onLanguageSelect }: LanguageSelectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleAutoDetect = (type: 'browser' | 'device') => {
    const detectedCode = type === 'browser' ? detectBrowserLanguage() : detectDeviceLanguage();
    const language = SUPPORTED_LANGUAGES[detectedCode];
    setSelectedLanguage(detectedCode);
    onLanguageSelect(language.code, language.name);
  };

  const handleLanguageSelect = (code: string) => {
    const language = SUPPORTED_LANGUAGES[code];
    setSelectedLanguage(code);
    onLanguageSelect(language.code, language.name);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full p-4 sm:p-6 md:p-8 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4 sm:space-y-5 md:space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-3 sm:p-4 rounded-full bg-neuro-cyan/10 border border-neuro-cyan/30">
            <Globe className="h-10 w-10 sm:h-12 sm:w-12 text-neuro-cyan" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
            Language Protocol Selection
          </h1>
          <p className="text-muted-foreground">
            Echelon can operate in any language you prefer.
          </p>
          <p className="text-sm text-muted-foreground">
            Choose the language for your missions, diagnostics, and coaching.
          </p>
        </div>

        {/* Auto-detect options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full h-auto py-4 border-neuro-border hover:border-neuro-cyan hover:bg-neuro-cyan/10"
            onClick={() => handleAutoDetect('browser')}
          >
            <div className="text-left w-full">
              <div className="font-medium">Auto-detect my language</div>
              <div className="text-xs text-muted-foreground mt-1">
                Detect from browser settings
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full h-auto py-4 border-neuro-border hover:border-neuro-cyan hover:bg-neuro-cyan/10"
            onClick={() => handleAutoDetect('device')}
          >
            <div className="text-left w-full">
              <div className="font-medium">Match my device language</div>
              <div className="text-xs text-muted-foreground mt-1">
                Use device language preference
              </div>
            </div>
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or select manually</span>
          </div>
        </div>

        {/* Manual language selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLanguage === lang.code ? "default" : "outline"}
              className={`w-full h-auto py-3 ${
                selectedLanguage === lang.code
                  ? "bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
                  : "border-neuro-border hover:border-neuro-cyan hover:bg-neuro-cyan/10"
              }`}
              onClick={() => handleLanguageSelect(lang.code)}
            >
              <div className="text-center w-full">
                <div className="font-medium text-sm">{lang.native}</div>
                <div className="text-xs opacity-70 mt-0.5">{lang.name}</div>
              </div>
            </Button>
          ))}
        </div>

        {selectedLanguage && (
          <div className="text-center text-sm text-neuro-cyan">
            Language selected: {SUPPORTED_LANGUAGES[selectedLanguage].native}
          </div>
        )}
      </Card>
    </div>
  );
}
