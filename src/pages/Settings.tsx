import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SecretInput } from "@/components/ui/secret-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Upload, Cloud, HelpCircle, CheckCircle2, RotateCcw, RefreshCw, Heart, Shield, Cpu, Eye, EyeOff, Info, AlertCircle, Globe, BookOpen, Volume2, Database, Type } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  SOVEREIGN_URL_STORAGE_KEY,
  SOVEREIGN_ANON_KEY_STORAGE_KEY,
  normalizeSupabaseUrl,
  isSovereignBackendActive,
  getActiveBackendHost,
} from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  loadState,
  saveState,
  validateState,
  saveUserSupabaseSettings,
  loadUserSupabaseSettings,
  clearUserSupabaseSettings,
  uploadStateToUserSupabase,
  downloadStateFromUserSupabase,
  getUserSyncTimestamp,
} from "@/lib/state-engine";
import { resetMissionProgress, resetEverything } from "@/lib/reset-state";
import { toast } from "@/hooks/use-toast";
import { SUPPORTED_LANGUAGES, getLanguageNativeName } from "@/lib/language-utils";
import { ECHELON_VOICES } from "@/data/voices";
import { speakText, stopSpeaking } from "@/lib/speech-engine";
import { getTextScale, setTextScale, TEXT_SCALE_LABELS, type TextScale } from "@/lib/text-scale";
import { downloadVaultZip } from "@/lib/markdown-vault-export";
import { downloadFullBackup, restoreFullBackup } from "@/lib/full-backup";
import { VaultSetupWizard } from "@/components/neuroverse/VaultSetupWizard";
import { isAutoSyncEnabled, setAutoSyncEnabled } from "@/lib/auto-sync";
import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [textScale, setTextScaleState] = useState<TextScale>(getTextScale());
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  
  // AI Provider state
  const [currentProvider, setCurrentProvider] = useState<string>("openai");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama2");
  
  // Language state
  const [currentLanguage, setCurrentLanguage] = useState<{ code: string; name: string }>({ code: "en", name: "English" });
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVoice, setAudioVoice] = useState("local_default");
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [audioVolume, setAudioVolume] = useState(1.0);
  
  // Work mode state
  const [earlyUnlockEnabled, setEarlyUnlockEnabled] = useState(false);

  // Data Sovereignty state (backend override)
  const [sovereignUrl, setSovereignUrl] = useState("");
  const [sovereignAnonKey, setSovereignAnonKey] = useState("");
  const [showSovereignKey, setShowSovereignKey] = useState(false);
  const [isConnectingBackend, setIsConnectingBackend] = useState(false);
  const sovereignActive = isSovereignBackendActive();

  useEffect(() => {
    // Load existing credentials if any
    const settings = loadUserSupabaseSettings();
    if (settings) {
      setSupabaseUrl(settings.url);
      setSupabaseKey(settings.anon_key);
      setHasCredentials(true);
      fetchSyncTimestamp();
    }
    
    // Load current AI provider settings
    const storedProvider = localStorage.getItem("neuroverse_ai_provider") || "openai";
    const storedKey = localStorage.getItem("neuroverse_api_key");
    const storedEndpoint = localStorage.getItem("neuroverse_ollama_endpoint");
    const storedModel = localStorage.getItem("neuroverse_ollama_model");
    
    setCurrentProvider(storedProvider);
    if (storedKey) setApiKey(storedKey);
    if (storedEndpoint) setOllamaEndpoint(storedEndpoint);
    if (storedModel) setOllamaModel(storedModel);
    
    // Load current language
    const state = loadState();
    if (state?.user.language) {
      setCurrentLanguage(state.user.language);
    }
    
    // Load audio settings
    if (state?.user.audio) {
      setAudioEnabled(state.user.audio.enabled);
      setAudioVoice(state.user.audio.voice);
      setAudioSpeed(state.user.audio.speed);
      setAudioVolume(state.user.audio.volume);
    }
    
    // Load work mode settings
    if (state?.work) {
      setEarlyUnlockEnabled(state.work.early_unlock_enabled);
    }

    // Load sovereign backend override (if any)
    const storedSovereignUrl = localStorage.getItem(SOVEREIGN_URL_STORAGE_KEY);
    const storedSovereignKey = localStorage.getItem(SOVEREIGN_ANON_KEY_STORAGE_KEY);
    if (storedSovereignUrl) setSovereignUrl(storedSovereignUrl);
    if (storedSovereignKey) setSovereignAnonKey(storedSovereignKey);

    // Deep-link support: /settings#data-sovereignty scrolls to the archive section
    if (window.location.hash === "#cloud-vault") {
      setTimeout(() => {
        document.getElementById("cloud-vault")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
    if (window.location.hash === "#data-sovereignty") {
      setTimeout(() => {
        document.getElementById("data-sovereignty")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const fetchSyncTimestamp = async () => {
    try {
      const timestamp = await getUserSyncTimestamp();
      setLastSyncTime(timestamp);
    } catch (error) {
      console.error("Error fetching sync timestamp:", error);
    }
  };

  // SECTION A: Export to User's Cloud
  const handleExport = () => {
    try {
      if (!downloadFullBackup()) {
        toast({
          title: "No Data",
          description: "No local state found to export.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Everything Exported",
        description:
          "Progress, reflections, and conversations — one file, fully restorable. Save it anywhere you choose.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Could not export state. Please try again.",
        variant: "destructive",
      });
    }
  };

  // SECTION B: Import from Backup
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Extract state from envelope
      const importedState = importData.state || importData;

      // Validate structure
      if (!validateState(importedState)) {
        toast({
          title: "Invalid File",
          description: "This file does not contain a valid NeuroVerse state.",
          variant: "destructive",
        });
        return;
      }

      // Confirm overwrite
      const confirmed = window.confirm(
        "This will replace your current OS state. Continue?"
      );
      if (!confirmed) return;

      // Save and reload (v2 bundles also restore reflections, mission
      // logs, and Echelon conversations)
      const result = restoreFullBackup(importData);
      toast({
        title: "State Restored",
        description: result.legacyFormat
          ? "Core progress restored (older backup — conversations and dossier entries weren't in the file). Reloading..."
          : "Everything restored — progress, reflections, and conversations. Reloading...",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "Could not read or parse the file.",
        variant: "destructive",
      });
    }
  };

  // SECTION C: User-Owned Supabase Sync
  const [vaultWizardOpen, setVaultWizardOpen] = useState(false);
  const [autoSync, setAutoSync] = useState(isAutoSyncEnabled());

  // Guided wizard verified the connection — save, first-sync, arm auto-sync.
  const handleVaultLinked = async (vaultUrl: string, vaultKey: string) => {
    saveUserSupabaseSettings({ url: vaultUrl, anon_key: vaultKey });
    setSupabaseUrl(vaultUrl);
    setSupabaseKey(vaultKey);
    setHasCredentials(true);
    setAutoSyncEnabled(true);
    setAutoSync(true);

    // Returning operator: if this vault already holds a record, the first
    // sync direction is THEIR call. Blindly uploading here would overwrite
    // the saved record with this device's fresh state — destroying exactly
    // what they came back for.
    const existing = await downloadStateFromUserSupabase().catch(() => null);
    if (existing) {
      const restore = window.confirm(
        "This vault already holds a training record.\n\n" +
          "OK — RESTORE the vault's record to this device (choose this if you're returning).\n" +
          "Cancel — keep THIS device's current state and overwrite the vault's backup."
      );
      if (restore) {
        saveState(existing);
        toast({
          title: "Vault Restored",
          description: "Your record is back. Reloading...",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }
    }

    await uploadStateToUserSupabase();
    await fetchSyncTimestamp();
    toast({
      title: "Vault Linked",
      description: "First backup uploaded. Auto-sync is on — your record uploads after every mission.",
    });
  };

  const handleSaveCredentials = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both URL and API key.",
        variant: "destructive",
      });
      return;
    }

    saveUserSupabaseSettings({
      url: supabaseUrl.trim(),
      anon_key: supabaseKey.trim(),
    });

    setHasCredentials(true);
    toast({
      title: "Credentials Saved",
      description: "Your cloud settings are stored locally.",
    });
  };

  const handleClearCredentials = () => {
    const confirmed = window.confirm(
      "Clear your Supabase credentials? You can re-enter them anytime."
    );
    if (!confirmed) return;

    clearUserSupabaseSettings();
    setSupabaseUrl("");
    setSupabaseKey("");
    setHasCredentials(false);
    setLastSyncTime(null);

    toast({
      title: "Credentials Cleared",
      description: "Your cloud sync settings have been removed.",
    });
  };

  const handleSyncNow = async () => {
    if (!hasCredentials) {
      toast({
        title: "No Credentials",
        description: "Please save your Supabase credentials first.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      await uploadStateToUserSupabase();
      await fetchSyncTimestamp();
      toast({
        title: "Sync Complete",
        description: "Your state has been uploaded to your Supabase.",
      });
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync to your Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!hasCredentials) {
      toast({
        title: "No Credentials",
        description: "Please save your Supabase credentials first.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const cloudState = await downloadStateFromUserSupabase();
      if (!cloudState) {
        toast({
          title: "No Cloud State",
          description: "No state found in your Supabase.",
        });
        return;
      }

      const confirmed = window.confirm(
        "This will replace your current local state with the cloud version. Continue?"
      );
      if (!confirmed) {
        setIsSyncing(false);
        return;
      }

      saveState(cloudState);
      toast({
        title: "State Downloaded",
        description: "Reloading application...",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download from your Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // SECTION: Data Sovereignty — point the app at a user-owned Supabase backend
  const handleConnectSovereignBackend = async () => {
    const url = normalizeSupabaseUrl(sovereignUrl);
    const anonKey = sovereignAnonKey.trim();

    if (!url) {
      toast({
        title: "Invalid Backend URL",
        description: "Enter a valid Supabase project URL, e.g. https://xxxxx.supabase.co",
        variant: "destructive",
      });
      return;
    }

    if (!anonKey) {
      toast({
        title: "Missing Key",
        description: "Enter your project's anon / publishable key.",
        variant: "destructive",
      });
      return;
    }

    setIsConnectingBackend(true);
    try {
      // Validate by counting lessons through a temporary client
      const probe = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out. Check the URL and that the project is not paused.")), 10000)
      );

      const { count, error } = await Promise.race([
        probe.from("lessons").select("*", { count: "exact", head: true }),
        timeout,
      ]);

      if (error) {
        throw new Error(
          error.message.includes("relation")
            ? "Connected to Supabase, but no 'lessons' table exists. Run the migrations first (see docs/SELF_HOSTING.md)."
            : error.message
        );
      }

      const lessonCount = count ?? 0;

      localStorage.setItem(SOVEREIGN_URL_STORAGE_KEY, url);
      localStorage.setItem(SOVEREIGN_ANON_KEY_STORAGE_KEY, anonKey);

      toast({
        title: "Sovereign Backend Connected",
        description:
          lessonCount > 0
            ? `Connected — ${lessonCount} lessons found. Reloading to switch backends...`
            : "Connected — 0 lessons found. Run `npm run seed` against this project, then reload. Switching backends...",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reach this Supabase project.";
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
      });
      setIsConnectingBackend(false);
    }
  };

  const handleResetToHub = () => {
    const confirmed = window.confirm(
      "Reset to the hub backend? Your local progress is unaffected, but mission data will sync to the hub's Supabase again."
    );
    if (!confirmed) return;

    localStorage.removeItem(SOVEREIGN_URL_STORAGE_KEY);
    localStorage.removeItem(SOVEREIGN_ANON_KEY_STORAGE_KEY);
    setSovereignUrl("");
    setSovereignAnonKey("");

    toast({
      title: "Backend Reset",
      description: "Reconnecting to the hub backend. Reloading...",
    });

    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleResetOnboarding = () => {
    const confirmed = window.confirm(
      "Reset to archetype assessment only? This will preserve your Vanguard identity and lesson progress, but clear your archetype assignment."
    );
    if (!confirmed) return;

    // Clear only archetype and orientation
    const state = loadState();
    if (state) {
      state.user.archetype = {
        primary: null,
        shadow: null,
        rising: null,
        assessment_complete: false
      };
      saveState(state);
    }
    localStorage.removeItem("neuroverse_orientation_complete");
    
    toast({
      title: "Archetype Reset",
      description: "Redirecting to assessment...",
    });
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  const handleFullSystemReset = () => {
    const confirmed = window.confirm(
      "Full system reset? This clears EVERYTHING — identity, archetype, missions, threads, reflections, and world state. Device settings (AI key, vault link, theme) are kept. You will start the experience from the beginning. This cannot be undone — export a backup first if you want one."
    );
    if (!confirmed) return;

    resetEverything();

    toast({
      title: "System Reset Complete",
      description: "Returning to the beginning...",
    });

    // Hard redirect: land at the true start with no in-memory state surviving
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  const handleSwitchProvider = async () => {
    if (currentProvider !== "ollama" && !apiKey.trim()) {
      toast({
        title: "Missing API Key",
        description: "Please enter an API key for the selected provider.",
        variant: "destructive",
      });
      return;
    }

    if (currentProvider === "ollama") {
      // Validate Ollama connection
      try {
        const response = await fetch(`${ollamaEndpoint}/api/tags`);
        if (!response.ok) throw new Error("Cannot connect to Ollama");
        
        const data = await response.json();
        const modelExists = data.models?.some((m: any) => m.name === ollamaModel);
        
        if (!modelExists) {
          toast({
            title: "Model Not Found",
            description: `Model "${ollamaModel}" is not available in Ollama. Please pull it first.`,
            variant: "destructive",
          });
          return;
        }
        
        // Save Ollama settings
        localStorage.setItem("neuroverse_ai_provider", "ollama");
        localStorage.setItem("neuroverse_ollama_endpoint", ollamaEndpoint);
        localStorage.setItem("neuroverse_ollama_model", ollamaModel);
        localStorage.removeItem("neuroverse_api_key");
        
        toast({
          title: "Provider Switched",
          description: `Now using Ollama with model ${ollamaModel}`,
        });
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: "Cannot connect to Ollama. Make sure it's running.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Save cloud provider settings
      localStorage.setItem("neuroverse_ai_provider", currentProvider);
      localStorage.setItem("neuroverse_api_key", apiKey);
      localStorage.removeItem("neuroverse_ollama_endpoint");
      localStorage.removeItem("neuroverse_ollama_model");
      
      const providerNames: Record<string, string> = {
        openai: "OpenAI",
        anthropic: "Anthropic Claude",
        google: "Google Gemini",
      };
      
      toast({
        title: "Provider Switched",
        description: `Now using ${providerNames[currentProvider]}`,
      });
    }
  };

  const handleLanguageChange = (code: string) => {
    const language = SUPPORTED_LANGUAGES[code];
    if (!language) return;
    
    const confirmed = window.confirm(
      `Switch to ${language.name}?\n\nAll future missions, diagnostics, and coaching from Echelon will be delivered in ${language.name}.\n\nYour progress and data will be preserved.`
    );
    
    if (!confirmed) {
      setSelectedLanguage(null);
      return;
    }
    
    // Update state
    const state = loadState();
    if (state) {
      state.user.language = {
        code: language.code,
        name: language.name,
        selected_at: new Date().toISOString(),
      };
      saveState(state);
      setCurrentLanguage(state.user.language);
      setSelectedLanguage(null);
      
      toast({
        title: "Language Updated",
        description: `Echelon will now operate in ${language.name}`,
      });
    }
  };
  
  const updateAudioSettings = (updates: Partial<{ enabled: boolean; voice: string; speed: number; volume: number }>) => {
    const state = loadState();
    if (!state) return;
    
    if (updates.enabled !== undefined) setAudioEnabled(updates.enabled);
    if (updates.voice !== undefined) setAudioVoice(updates.voice);
    if (updates.speed !== undefined) setAudioSpeed(updates.speed);
    if (updates.volume !== undefined) setAudioVolume(updates.volume);
    
    state.user.audio = {
      ...state.user.audio,
      ...updates,
      configured_at: new Date().toISOString(),
    };
    saveState(state);
  };
  
  const handleTestVoice = async () => {
    try {
      stopSpeaking(); // Stop any existing speech
      await speakText(
        "Operator. This is Echelon. Audio output systems operational.",
        {
          voice: audioVoice,
          speed: audioSpeed,
          pitch: 1.0,
          volume: audioVolume,
          enabled: true,
        }
      );
    } catch (error) {
      console.error("Test voice error:", error);
      toast({
        title: "Audio Test Failed",
        description: "Could not play test audio. Check your settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-12">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent mb-2">
            NeuroVerse OS Settings
          </h1>
          <p className="text-muted-foreground text-sm">
            Your data lives on your device. Cloud sync is optional and user-owned.
          </p>
        </div>

        {/* SECTION A: Export */}
        {/* SECTION: Text Size */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-cyan/10">
              <Type className="h-6 w-6 text-neuro-cyan" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Text Size
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Scales all text across the entire app. Takes effect immediately.
              </p>
              <div className="flex gap-2">
                {(Object.keys(TEXT_SCALE_LABELS) as TextScale[]).map((scale) => (
                  <Button
                    key={scale}
                    variant={textScale === scale ? "default" : "outline"}
                    onClick={() => {
                      setTextScale(scale);
                      setTextScaleState(scale);
                    }}
                    className={textScale === scale ? "bg-neuro-cyan hover:bg-neuro-cyan/90 text-background" : ""}
                  >
                    <span className={scale === "standard" ? "text-sm" : scale === "large" ? "text-base" : "text-lg"}>
                      A
                    </span>
                    <span className="ml-2">{TEXT_SCALE_LABELS[scale]}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-purple/10">
              <Download className="h-6 w-6 text-neuro-purple" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Export to Your Cloud
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Save your NeuroVerse OS state anywhere you choose—iCloud, Google
                Drive, Dropbox, or your device. You control this file completely.
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                ⚠️ This device holds the only copy of your work. Uninstalling the
                app or clearing browser data erases everything permanently —
                export first. There is no cloud copy unless you make one.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleExport} className="bg-neuro-purple hover:bg-neuro-purple/90">
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const count = downloadVaultZip();
                    if (count > 0) {
                      toast({
                        title: "Vault Exported",
                        description: `${count} Markdown files — readable in Obsidian or any notes tool.`,
                      });
                    } else {
                      toast({ title: "Nothing to Export", description: "No local state found.", variant: "destructive" });
                    }
                  }}
                  className="border-neuro-purple/40 text-neuro-purple hover:bg-neuro-purple/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Obsidian Vault (.md)
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION B: Import */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-cyan/10">
              <Upload className="h-6 w-6 text-neuro-cyan" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Restore from Backup
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a previously exported OS state to continue your mission.
              </p>
              <div>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="max-w-md cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-neuro-cyan file:text-white hover:file:bg-neuro-cyan/90"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION: AI Provider */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-orange/10">
              <Cpu className="h-6 w-6 text-neuro-orange" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Echelon AI Provider
              </h2>
              <p className="text-sm text-muted-foreground mb-1">
                Switch between AI providers without re-activating Echelon.
              </p>
              <p className="text-sm text-muted-foreground">
                Current: <span className="font-semibold text-foreground">{
                  currentProvider === "openai" ? "OpenAI" :
                  currentProvider === "anthropic" ? "Anthropic Claude" :
                  currentProvider === "google" ? "Google Gemini" :
                  `Ollama (${ollamaModel})`
                }</span>
              </p>
            </div>
          </div>

          <Tabs value={currentProvider} onValueChange={setCurrentProvider} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="ollama">Ollama</TabsTrigger>
            </TabsList>

            <TabsContent value="openai" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="setup-guide">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Setup Guide & Troubleshooting
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Prerequisites</AlertTitle>
                      <AlertDescription>
                        You need an OpenAI account with billing setup and at least $5 in credits.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">1. Visit platform.openai.com</p>
                          <p className="text-muted-foreground">Sign in or create an account</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">2. Add Billing</p>
                          <p className="text-muted-foreground">Settings → Billing → Add payment method with at least $5</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">3. Create API Key</p>
                          <p className="text-muted-foreground">API Keys section → "Create new secret key"</p>
                        </div>
                      </div>
                    </div>
                    
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Common Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>"Insufficient credits" → Add $5+ in billing</li>
                          <li>"Invalid key" → Check key starts with "sk-"</li>
                          <li>"Rate limit" → Upgrade plan or wait</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="relative">
                  <SecretInput
                    id="openai-key"
                    reveal={showApiKey}
                    placeholder="sk-..."
                    value={currentProvider === "openai" ? apiKey : ""}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-neuro-cyan underline">
                    platform.openai.com
                  </a>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="anthropic" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="setup-guide">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Setup Guide & Troubleshooting
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Prerequisites</AlertTitle>
                      <AlertDescription>
                        You need an Anthropic account with billing configured.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">1. Visit console.anthropic.com</p>
                          <p className="text-muted-foreground">Create account or sign in</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">2. Add Payment Method</p>
                          <p className="text-muted-foreground">Settings → Billing → Add credit card</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">3. Create API Key</p>
                          <p className="text-muted-foreground">API Keys → "Create Key" (starts with "sk-ant-")</p>
                        </div>
                      </div>
                    </div>
                    
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Common Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>"Invalid key" → Check key starts with "sk-ant-"</li>
                          <li>"Billing required" → Add payment method first</li>
                          <li>"Rate limit" → Check usage limits in console</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <div className="relative">
                  <SecretInput
                    id="anthropic-key"
                    reveal={showApiKey}
                    placeholder="sk-ant-..."
                    value={currentProvider === "anthropic" ? apiKey : ""}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-neuro-cyan underline">
                    console.anthropic.com
                  </a>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="google" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="setup-guide">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Setup Guide & Troubleshooting
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Prerequisites</AlertTitle>
                      <AlertDescription>
                        You need a Google Cloud account with Gemini API enabled.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">1. Visit ai.google.dev</p>
                          <p className="text-muted-foreground">Sign in with Google account</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">2. Get API Key</p>
                          <p className="text-muted-foreground">Click "Get API key" → Create in new/existing project</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">3. Copy Key</p>
                          <p className="text-muted-foreground">Key starts with "AIza..." - copy immediately</p>
                        </div>
                      </div>
                    </div>
                    
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Common Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>"API not enabled" → Enable Gemini API in Cloud Console</li>
                          <li>"Quota exceeded" → Check daily limits</li>
                          <li>"Invalid key" → Verify key starts with "AIza..."</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-2">
                <Label htmlFor="google-key">Google AI API Key</Label>
                <div className="relative">
                  <SecretInput
                    id="google-key"
                    reveal={showApiKey}
                    placeholder="AIza..."
                    value={currentProvider === "google" ? apiKey : ""}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-neuro-cyan underline">
                    Google AI Studio
                  </a>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="ollama" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="setup-guide">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Setup Guide & Troubleshooting
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 text-sm">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Local AI - No API Key Required</AlertTitle>
                      <AlertDescription>
                        Ollama runs entirely on your device. Privacy-first, offline-capable, and free.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">1. Download Ollama</p>
                          <p className="text-muted-foreground">Visit ollama.ai and download for your OS</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">2. Install and Start</p>
                          <p className="text-muted-foreground">Run installer, then open Ollama (runs in background)</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">3. Pull a Model</p>
                          <p className="text-muted-foreground">Terminal: <code className="bg-muted px-1 rounded">ollama pull llama2</code></p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">4. Verify Running</p>
                          <p className="text-muted-foreground">Terminal: <code className="bg-muted px-1 rounded">ollama list</code></p>
                        </div>
                      </div>
                    </div>
                    
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Common Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>"Cannot connect" → Check Ollama is running in background</li>
                          <li>"Model not found" → Run <code className="bg-muted px-1 rounded">ollama pull [model]</code></li>
                          <li>"Port conflict" → Check port 11434 isn't blocked</li>
                          <li>Better models: llama3, mixtral, mistral</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ollama-endpoint">Ollama Endpoint</Label>
                  <Input
                    id="ollama-endpoint"
                    type="text"
                    placeholder="http://localhost:11434"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ollama-model">Model Name</Label>
                  <Input
                    id="ollama-model"
                    type="text"
                    placeholder="llama2"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure Ollama is running and the model is pulled. Learn more at{" "}
                    <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-neuro-cyan underline">
                      ollama.ai
                    </a>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleSwitchProvider}
            className="bg-neuro-orange hover:bg-neuro-orange/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Switch to {
              currentProvider === "openai" ? "OpenAI" :
              currentProvider === "anthropic" ? "Anthropic" :
              currentProvider === "google" ? "Google" :
              "Ollama"
            }
          </Button>
        </Card>

        {/* SECTION: Language Protocol */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-cyan/10">
              <Globe className="h-6 w-6 text-neuro-cyan" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Language Protocol
              </h2>
              <p className="text-sm text-muted-foreground mb-1">
                Change the language for all Echelon communications and missions.
              </p>
              <p className="text-sm text-muted-foreground">
                Current: <span className="font-semibold text-foreground">{currentLanguage.name}</span>
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Changing your language will affect all future missions, diagnostics, and coaching sessions. 
              Your progress and archetype data will be preserved.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Label>Select Language</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                <Button
                  key={lang.code}
                  variant={currentLanguage.code === lang.code ? "default" : "outline"}
                  className={`w-full h-auto py-3 ${
                    currentLanguage.code === lang.code
                      ? "bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
                      : "border-neuro-border hover:border-neuro-cyan hover:bg-neuro-cyan/10"
                  }`}
                  onClick={() => {
                    setSelectedLanguage(lang.code);
                    handleLanguageChange(lang.code);
                  }}
                >
                  <div className="text-center w-full">
                    <div className="font-medium text-sm">{lang.native}</div>
                    <div className="text-xs opacity-70 mt-0.5">{lang.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* SECTION: Echelon Audio Output */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-purple/10">
              <Volume2 className="h-6 w-6 text-neuro-purple" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Echelon Audio Output
              </h2>
              <p className="text-sm text-muted-foreground">
                Voice is cosmetic. Echelon's cognition and identity remain immutable.
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Echelon can speak responses aloud using OpenAI TTS or your device's built-in voice. 
              Audio falls back to browser TTS when offline.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Enable Voice Output</p>
                  <p className="text-xs text-muted-foreground">Echelon will speak responses aloud</p>
                </div>
              </div>
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => updateAudioSettings({ enabled: !audioEnabled })}
                className={audioEnabled ? "bg-neuro-cyan hover:bg-neuro-cyan/90" : ""}
              >
                {audioEnabled ? "Enabled" : "Disabled"}
              </Button>
            </div>

            {/* Voice Selection */}
            <div className="space-y-3">
              <Label>Voice</Label>
              <p className="text-xs text-muted-foreground">
                Echelon's voice runs entirely on your device — no cloud service, no
                audio ever leaves your machine. Shape it with speed and pitch below.
              </p>
              <Button
                variant={audioVoice === "local_default" ? "default" : "outline"}
                size="sm"
                className={`w-full h-auto py-3 ${
                  audioVoice === "local_default"
                    ? "bg-neuro-cyan hover:bg-neuro-cyan/90"
                    : "border-border hover:border-neuro-cyan/50"
                }`}
                onClick={() => updateAudioSettings({ voice: "local_default" })}
              >
                <div className="text-center w-full">
                  <div className="font-medium text-sm">System Voice</div>
                  <div className="text-xs opacity-70 mt-0.5">Your device's built-in voice — private, offline, free</div>
                </div>
              </Button>
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Speed: {audioSpeed.toFixed(1)}x</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateAudioSettings({ speed: 1.0 })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={audioSpeed}
                onChange={(e) => updateAudioSettings({ speed: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Volume: {Math.round(audioVolume * 100)}%</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateAudioSettings({ volume: 1.0 })}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={audioVolume}
                onChange={(e) => updateAudioSettings({ volume: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Test Voice Button */}
            <Button
              variant="outline"
              className="w-full border-neuro-border hover:border-neuro-purple hover:bg-neuro-purple/10"
              onClick={handleTestVoice}
              disabled={!audioEnabled}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Test Voice
            </Button>
          </div>
        </Card>

        {/* SECTION: Vanguard Lore */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-pulse/30 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-pulse/10">
              <BookOpen className="h-6 w-6 text-neuro-pulse" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Vanguard Dossier
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Access classified intel on your Vanguard designation, operational purpose, and the Bi-Cognitive Dyad protocol.
              </p>
              <Link to="/vanguard-lore">
                <Button variant="outline" className="border-neuro-pulse/30 hover:bg-neuro-pulse/10">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Classified Dossier
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Owning your data — the two levels, in plain human */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-3">
          <h2 className="text-xl font-semibold text-foreground">
            Owning your data — there are two levels
          </h2>
          <p className="text-sm text-muted-foreground">
            📓 <strong className="text-foreground">Level 1 — keep a safe copy of YOUR work.</strong>{" "}
            Everything you write in your missions can be backed up to a small
            database that belongs to you (the Cloud Vault, right below). Five
            minutes, free, and you can walk away and come back years later.
            Most people want this one.
          </p>
          <p className="text-sm text-muted-foreground">
            🏫 <strong className="text-foreground">Level 2 — run the whole school yourself.</strong>{" "}
            The lessons and the AI wiring normally run on our server. If you
            want zero dependence on us — or you're running your own course —
            you can host all of it yourself (Data Sovereignty, at the bottom
            of this page). That's the advanced path: it needs its own,
            separate Supabase project and about an hour.
          </p>
          <p className="text-xs text-muted-foreground">
            They are two different jobs and two different Supabase projects.
            Doing Level 1 never requires Level 2.
          </p>
        </Card>

        {/* SECTION C: Multi-Device Sync */}
        <Card id="cloud-vault" className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-green/10">
              <Cloud className="h-6 w-6 text-neuro-green" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Your Cloud Vault — a backup of your work, in a database you own
              </h2>
              <p className="text-sm text-muted-foreground mb-1">
                The app already saves everything on this device. The vault
                gives your training record a second home that belongs to
                you — so you can switch devices, or leave and come back later
                and pick up exactly where you were.
              </p>
              <p className="text-sm text-muted-foreground">
                It lives in your own free Supabase project. We never see it,
                never store it, and can't reach it.
              </p>
            </div>
          </div>

          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertDescription className="text-sm">
              <strong>Bring Your Own Supabase:</strong> This requires a free
              Supabase account. We never see or store your data.{" "}
              <button
                onClick={() => navigate("/supabase-setup-guide")}
                className="text-neuro-cyan underline hover:text-neuro-cyan/80"
              >
                View setup guide →
              </button>
            </AlertDescription>
          </Alert>

          {/* Guided path: three steps, verified connection, auto-sync armed */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setVaultWizardOpen(true)}
              className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
            >
              <Zap className="h-4 w-4 mr-2" />
              Guided Setup (2 min)
            </Button>
            <span className="text-xs text-muted-foreground">
              …or enter credentials manually below
            </span>
          </div>
          <VaultSetupWizard
            open={vaultWizardOpen}
            onOpenChange={setVaultWizardOpen}
            onLinked={handleVaultLinked}
          />

          {hasCredentials && (
            <div className="flex items-center justify-between gap-4 rounded-md border border-neuro-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-sync after each mission</p>
                <p className="text-xs text-muted-foreground">
                  Your full record — progress, reflections, conversations — uploads to your vault in the background.
                </p>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={(v) => {
                  setAutoSync(v);
                  setAutoSyncEnabled(v);
                }}
              />
            </div>
          )}

          {/* Credentials Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Your Supabase Project URL</Label>
              <Input
                id="supabase-url"
                type="text"
                placeholder="https://xxxxx.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-key">Your Supabase Public API Key</Label>
              <SecretInput
                id="supabase-key"
                placeholder="eyJhbGci..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveCredentials}
                className="bg-neuro-green hover:bg-neuro-green/90"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save My Cloud Settings
              </Button>
              {hasCredentials && (
                <Button
                  variant="ghost"
                  onClick={handleClearCredentials}
                  className="text-muted-foreground"
                >
                  Clear Credentials
                </Button>
              )}
            </div>
          </div>

          {/* Sync Actions */}
          {hasCredentials && (
            <div className="pt-4 border-t border-border/30 space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="bg-critical hover:bg-critical/90"
                >
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </Button>
                <Button
                  onClick={handleDownloadFromCloud}
                  disabled={isSyncing}
                  variant="outline"
                >
                  Download from Cloud
                </Button>
              </div>

              {lastSyncTime && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(lastSyncTime).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* SECTION: Data Sovereignty */}
        <Card id="data-sovereignty" className="p-6 bg-card/50 backdrop-blur-sm border-neuro-cyan/20 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-cyan/10">
              <Database className="h-6 w-6 text-neuro-cyan" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Data Sovereignty
                </h2>
                {sovereignActive ? (
                  <Badge className="bg-neuro-green/15 text-neuro-green border border-neuro-green/40 hover:bg-neuro-green/15">
                    Sovereign · {getActiveBackendHost()}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-neuro-cyan/40 text-neuro-cyan">
                    Hub Backend
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                The hub deployment stays canonical—but your backend can be sovereign.
                Point this app at your own Supabase project, the same way you brought
                your own AI key.
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                This is <strong className="text-foreground">Level 2: running the whole
                school yourself</strong> — the lessons, the AI wiring, everything that
                normally runs on our server moves to a project you control. For forks,
                institutions, and anyone who wants zero dependence on us.
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                <strong className="text-foreground">Just want your own work backed up?</strong>{" "}
                That's the Cloud Vault above — five minutes, done. And note: this
                section needs its own, <em>separate</em> Supabase project — don't
                point it at your vault.
              </p>
              <p className="text-sm text-muted-foreground">
                Full walkthrough:{" "}
                <a
                  href="https://github.com/NeuroverseOS/HowToSaveTheWorld/blob/main/docs/SELF_HOSTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan underline hover:text-neuro-cyan/80"
                >
                  docs/SELF_HOSTING.md
                </a>
              </p>
            </div>
          </div>

          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Before you connect</AlertTitle>
            <AlertDescription className="text-sm">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>
                  Mission data (reflections, sync state) will read from and write to the
                  new backend going forward. Nothing is migrated automatically.
                </li>
                <li>
                  The edge functions (echelon-chat, echelon-speak, transcribe-audio)
                  must be deployed to your project for Echelon chat and voice to work.
                  Trait analysis runs client-side with your own AI key.
                </li>
                <li>Schema must be applied first via the repo's migrations, then seeded with lessons.</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sovereign-url">Supabase Project URL</Label>
              <Input
                id="sovereign-url"
                type="text"
                placeholder="https://xxxxx.supabase.co"
                value={sovereignUrl}
                onChange={(e) => setSovereignUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sovereign-key">Anon / Publishable Key</Label>
              <div className="relative">
                <SecretInput
                  id="sovereign-key"
                  reveal={showSovereignKey}
                  placeholder="eyJhbGci... or sb_publishable_..."
                  value={sovereignAnonKey}
                  onChange={(e) => setSovereignAnonKey(e.target.value)}
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowSovereignKey(!showSovereignKey)}
                >
                  {showSovereignKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Found in your Supabase dashboard under Settings → API Keys. Stored only
                in this browser, exactly like your AI key.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleConnectSovereignBackend}
                disabled={isConnectingBackend}
                className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
              >
                {isConnectingBackend ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying Backend...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
              {sovereignActive && (
                <Button
                  variant="outline"
                  onClick={handleResetToHub}
                  className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Hub
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Active backend:{" "}
              <span className="font-mono text-foreground">{getActiveBackendHost()}</span>
              {sovereignActive ? " (sovereign — user-owned)" : " (hub — canonical deployment)"}
            </p>
          </div>
        </Card>

        {/* System Diagnostics */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-border space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-purple/10">
              <Cpu className="h-6 w-6 text-neuro-purple" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                System Diagnostics
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Access diagnostic tools for troubleshooting, integrity checks, and system repair operations.
              </p>
              <Button
                onClick={() => navigate("/systems")}
                variant="outline"
                className="border-neuro-purple/30 hover:bg-neuro-purple/10"
              >
                <Cpu className="h-4 w-4 mr-2" />
                Open Systems Panel
              </Button>
            </div>
          </div>
        </Card>

        {/* Help Link */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <HelpCircle className="h-4 w-4" />
          <button
            onClick={() => navigate("/guide")}
            className="underline hover:text-foreground"
          >
            Need help? Visit the Field Guide
          </button>
        </div>

        {/* Support the Mission Section */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Support the Mission
              </h2>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                NeuroVerse OS is free, sovereign, and independent. If you choose to support this decentralized mission, 
                your contribution helps keep this training accessible to all builders.
              </p>
              <Button
                onClick={() => navigate("/support")}
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
              >
                View Funding Options
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Work Mode Section */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-cyan/20 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-cyan/10">
              <Cpu className="h-6 w-6 text-neuro-cyan" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Work Mode Settings
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Work Modes (Design/Build/Lead) unlock as you complete their associated lesson sessions. You can override this for early access.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="early-unlock" className="text-sm font-medium">
                      Unlock Work Modes Early
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Not recommended: Work modes function best after completing their associated sessions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="early-unlock"
                    checked={earlyUnlockEnabled}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setEarlyUnlockEnabled(newValue);
                      const state = loadState();
                      if (state?.work) {
                        state.work.early_unlock_enabled = newValue;
                        saveState(state);
                        toast({
                          title: newValue ? "Early Unlock Enabled" : "Early Unlock Disabled",
                          description: newValue 
                            ? "All work modes are now accessible"
                            : "Work modes will unlock through mission completion"
                        });
                      }
                    }}
                    className="h-4 w-4"
                  />
                </div>
                <Button
                  onClick={() => navigate("/work")}
                  variant="outline"
                  className="border-neuro-cyan/30 hover:bg-neuro-cyan/10"
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  Open Work Mode
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Identity Section */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-neuro-cyan/20 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-neuro-cyan/10">
              <Shield className="h-6 w-6 text-neuro-cyan" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Identity
              </h2>
              {(() => {
                const state = loadState();
                return (
                  <div className="space-y-4">
                    {state?.user.vanguard.activation_complete && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-neuro-cyan uppercase tracking-wider">
                          Vanguard Identity
                        </h3>
                        <div className="text-sm text-foreground/90 space-y-1">
                          <p><span className="text-muted-foreground">Designation:</span> Vanguard</p>
                          <p><span className="text-muted-foreground">Callsign:</span> {state.user.vanguard.callsign}</p>
                        </div>
                      </div>
                    )}
                    
                    {state?.user.archetype.assessment_complete && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-neuro-purple uppercase tracking-wider">
                          Archetype Signature
                        </h3>
                        <div className="text-sm text-foreground/90 space-y-1">
                          <p><span className="text-muted-foreground">Primary:</span> {state.user.archetype.primary}</p>
                          <p><span className="text-muted-foreground">Shadow:</span> {state.user.archetype.shadow}</p>
                          <p><span className="text-muted-foreground">Rising:</span> {state.user.archetype.rising}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>

        {/* Advanced Section */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-amber-500/30 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <RotateCcw className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Reset Options
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Reset different aspects of your training experience.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const confirmed = window.confirm(
                      "Reset progress to Mission 1? Completed missions, mission threads, and reflections will be cleared — your callsign, archetype, and settings are kept."
                    );
                    if (confirmed) {
                      resetMissionProgress();
                      toast({
                        title: "Progress Reset",
                        description: "Returning to Mission 1...",
                      });
                      setTimeout(() => window.location.href = "/dashboard", 1000);
                    }
                  }}
                  className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Mission 1
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleResetOnboarding}
                  className="text-neuro-purple border-neuro-purple/30 hover:bg-neuro-purple/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Archetype Only
                </Button>

                <Button
                  variant="outline"
                  onClick={handleFullSystemReset}
                  className="text-critical border-critical/30 hover:bg-critical/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Full System Reset
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Knowledge */}
      <div className="mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">System Knowledge</h2>
          <p className="mb-6 text-muted-foreground">
            Access system documentation, security information, and build verification.
          </p>
          <div className="space-y-3">
            <a
              href="/security"
              className="text-primary hover:underline inline-flex items-center block"
            >
              Security Overview →
            </a>
            <a
              href="/verify"
              className="text-primary hover:underline inline-flex items-center block"
            >
              Verify Build →
            </a>
            <a
              href="/whitepaper"
              className="text-primary hover:underline inline-flex items-center block"
            >
              Whitepaper →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
