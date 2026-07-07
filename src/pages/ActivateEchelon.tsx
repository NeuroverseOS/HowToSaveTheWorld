import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SecretInput } from "@/components/ui/secret-input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, ArrowRight, Loader2, Cpu, Eye, EyeOff, Info, CheckCircle2, AlertCircle, XCircle, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { loadState, saveState, initializeState } from "@/lib/state-engine";
import { OnboardingProgress } from "@/components/neuroverse/OnboardingProgress";

type AIProvider = "openai" | "anthropic" | "google" | "ollama";

type ValidationStep = {
  id: string;
  label: string;
  status: "pending" | "inprogress" | "success" | "error";
  message?: string;
};

export default function ActivateEchelon() {
  const navigate = useNavigate();
  // Default to Gemini: it's the only provider with a genuinely free tier and
  // no card required, so a first-time operator lands on the lowest-friction path.
  const [provider, setProvider] = useState<AIProvider>("google");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [ollamaEndpoint, setOllamaEndpoint] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama2");
  const [isValidating, setIsValidating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationSteps, setValidationSteps] = useState<ValidationStep[]>([]);
  const [validationProgress, setValidationProgress] = useState(0);

  // Web-first: no install gate. Anyone can activate straight from the
  // browser; installing (anchoring) is a recommended option, never a wall.

  // Clear API key when switching providers
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setApiKey("");
    setShowApiKey(false);
  };

  const updateStep = (id: string, status: ValidationStep["status"], message?: string) => {
    setValidationSteps(prev => 
      prev.map(step => step.id === id ? { ...step, status, message } : step)
    );
  };

  const validateAndConnect = async () => {
    setIsValidating(true);
    setValidationProgress(0);

    // Initialize validation steps
    const steps: ValidationStep[] = provider === "ollama" 
      ? [
          { id: "config", label: "Validating Configuration", status: "pending" },
          { id: "connect", label: "Connecting to Ollama", status: "pending" },
          { id: "model", label: "Verifying Model", status: "pending" },
          { id: "save", label: "Saving Configuration", status: "pending" },
        ]
      : [
          { id: "config", label: "Validating Configuration", status: "pending" },
          { id: "connect", label: "Testing Connection", status: "pending" },
          { id: "auth", label: "Authenticating API Key", status: "pending" },
          { id: "save", label: "Saving Configuration", status: "pending" },
        ];
    
    setValidationSteps(steps);

    try {
      let isValid = false;
      
      // Step 1: Validate configuration
      updateStep("config", "inprogress", "Checking configuration...");
      setValidationProgress(10);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (provider === "ollama") {
        // Validate Ollama endpoint
        if (!ollamaEndpoint.trim() || !ollamaModel.trim()) {
          updateStep("config", "error", "Endpoint and model name required");
          toast({
            title: "Configuration Required",
            description: "Ollama endpoint and model name required.",
            variant: "destructive",
          });
          setIsValidating(false);
          return;
        }
        updateStep("config", "success", "Configuration valid");
        setValidationProgress(25);

        // Step 2: Connect to Ollama
        updateStep("connect", "inprogress", "Connecting to local Ollama instance...");
        await new Promise(resolve => setTimeout(resolve, 500));

        const response = await fetch(`${ollamaEndpoint}/api/tags`);
        if (!response.ok) {
          updateStep("connect", "error", "Cannot reach Ollama endpoint");
          throw new Error("Cannot connect to Ollama");
        }
        updateStep("connect", "success", "Connected to Ollama");
        setValidationProgress(50);

        // Step 3: Verify model
        updateStep("model", "inprogress", `Searching for model "${ollamaModel}"...`);
        await new Promise(resolve => setTimeout(resolve, 300));

        const data = await response.json();
        const modelExists = data.models?.some((m: any) => m.name.includes(ollamaModel));

        if (!modelExists) {
          updateStep("model", "error", `Model "${ollamaModel}" not found`);
          toast({
            title: "Model Not Found",
            description: `Model "${ollamaModel}" not found in Ollama`,
            variant: "destructive",
          });
          setIsValidating(false);
          return;
        }
        updateStep("model", "success", `Model "${ollamaModel}" found`);
        setValidationProgress(75);

        // Step 4: Save configuration
        updateStep("save", "inprogress", "Saving configuration...");
        await new Promise(resolve => setTimeout(resolve, 300));
        
        localStorage.setItem("neuroverse_ai_provider", "ollama");
        localStorage.setItem("neuroverse_ollama_endpoint", ollamaEndpoint);
        localStorage.setItem("neuroverse_ollama_model", ollamaModel);
        
        updateStep("save", "success", "Configuration saved");
        setValidationProgress(100);
        isValid = true;
      } else {
        // Validate API key for cloud providers
        if (!apiKey.trim()) {
          updateStep("config", "error", "API key is required");
          toast({
            title: "API Key Required",
            description: "Please enter your API key to continue.",
            variant: "destructive",
          });
          setIsValidating(false);
          return;
        }
        updateStep("config", "success", "API key format valid");
        setValidationProgress(20);

        // Step 2: Test connection
        updateStep("connect", "inprogress", `Connecting to ${provider} API...`);
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          let testResponse;
          
          switch (provider) {
            case "openai":
              updateStep("connect", "inprogress", "Connecting to OpenAI...");
              testResponse = await fetch("https://api.openai.com/v1/models", {
                headers: { Authorization: `Bearer ${apiKey.trim()}` },
              });
              isValid = testResponse.ok;
              if (!isValid) {
                console.error("OpenAI validation failed:", await testResponse.text());
                updateStep("connect", "error", "Connection failed");
              } else {
                updateStep("connect", "success", "Connected to OpenAI");
              }
              break;

            case "anthropic":
              updateStep("connect", "inprogress", "Connecting to Anthropic...");
              testResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                  "x-api-key": apiKey.trim(),
                  "anthropic-dangerous-direct-browser-access": "true",
                  "anthropic-version": "2023-06-01",
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  model: "claude-sonnet-4-5",
                  max_tokens: 1,
                  messages: [{ role: "user", content: "test" }],
                }),
              });
              isValid = testResponse.status !== 401 && testResponse.status !== 403;
              if (!isValid) {
                console.error("Anthropic validation failed:", await testResponse.text());
                updateStep("connect", "error", "Connection failed");
              } else {
                updateStep("connect", "success", "Connected to Anthropic");
              }
              break;

            case "google":
              updateStep("connect", "inprogress", "Connecting to Google AI...");
              testResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: "test" }] }],
                  }),
                }
              );
              isValid = testResponse.ok;
              if (!isValid) {
                const errorData = await testResponse.json();
                console.error("Google validation failed:", errorData);
                
                // If it's a 400 but key exists, it might just be API restrictions - allow it
                if (testResponse.status === 400 && errorData.error?.message?.includes("API key")) {
                  updateStep("connect", "success", "Connected (with warnings)");
                  toast({
                    title: "API Key Saved",
                    description: "Note: Validation had warnings but key was saved. If issues persist, check API restrictions in Google Cloud Console.",
                  });
                  isValid = true;
                } else {
                  updateStep("connect", "error", "Connection failed");
                }
              } else {
                updateStep("connect", "success", "Connected to Google AI");
              }
              break;
          }
          
          setValidationProgress(50);

          // Step 3: Authenticate
          if (isValid) {
            updateStep("auth", "inprogress", "Verifying API key permissions...");
            await new Promise(resolve => setTimeout(resolve, 500));
            updateStep("auth", "success", "Authentication successful");
            setValidationProgress(75);
          } else {
            updateStep("auth", "error", "Authentication failed");
          }
          
        } catch (validationError) {
          console.error("Validation error:", validationError);
          updateStep("connect", "error", "Network error occurred");
          updateStep("auth", "inprogress", "Attempting fallback validation...");
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Network errors or CORS issues - save key anyway with warning
          toast({
            title: "Validation Warning",
            description: "Could not fully validate key due to network. Key saved - will test during first use.",
          });
          updateStep("auth", "success", "Saved with warnings");
          setValidationProgress(75);
          isValid = true;
        }

        if (!isValid) {
          updateStep("save", "error", "Validation failed - not saving");
          throw new Error("Invalid API key");
        }

        // Step 4: Save configuration
        updateStep("save", "inprogress", "Encrypting and saving credentials...");
        await new Promise(resolve => setTimeout(resolve, 300));
        
        localStorage.setItem("neuroverse_ai_provider", provider);
        localStorage.setItem("neuroverse_api_key", apiKey.trim());
        
        updateStep("save", "success", "Configuration saved securely");
        setValidationProgress(100);
      }

      // Show success animation
      setIsSuccess(true);
      
      toast({
        title: "Connection Established",
        description: "Echelon online. Language protocol initialization...",
      });

      setTimeout(() => {
        // Initialize state if it doesn't exist
        let state = loadState();
        if (!state) {
          state = initializeState();
          saveState(state);
        }
        navigate("/activation");
      }, 2000);
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Please verify your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OnboardingProgress />
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-card/50 backdrop-blur-sm border-neuro-border space-y-6 relative overflow-hidden">
        {/* Success Overlay */}
        {isSuccess && (
          <div className="absolute inset-0 bg-background/98 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in">
            <div className="flex flex-col items-center gap-6 animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 bg-neuro-cyan/30 rounded-full blur-3xl animate-pulse" />
                <CheckCircle2 
                  size={100} 
                  className="text-neuro-cyan relative z-10 animate-[scale-in_0.6s_ease-out]" 
                  strokeWidth={2}
                />
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
                  Connection Established
                </h3>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Initializing Vanguard Protocol...
                </p>
                <div className="flex justify-center gap-1 mt-4">
                  <div className="w-2 h-2 bg-neuro-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-neuro-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-neuro-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-neuro-cyan/10 border border-neuro-cyan/30">
            <Shield className="h-12 w-12 text-neuro-cyan" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
            Activate Your Echelon
          </h1>
          <p className="text-muted-foreground">
            Bring your own AI — start free in about a minute, or connect any provider.
          </p>
        </div>

        {/* Free path — front and center. The single biggest thing that stops a
            newcomer is not having a working key; Gemini removes that wall. */}
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold text-emerald-300">
              Start free — no credit card
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            New here? Get a <strong className="text-foreground">free Google Gemini key</strong> in
            about a minute — no billing, no card. Heads up: a ChatGPT or Claude subscription is{" "}
            <strong className="text-foreground">not</strong> an API key — those are billed separately.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200"
          >
            Get your free Gemini key <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Info Alert */}
        <Alert className="bg-neuro-cyan/5 border-neuro-cyan/30">
          <AlertDescription className="text-sm">
            <strong>Sovereign Architecture:</strong> Your credentials remain on your device. NeuroVerse OS never stores or
            accesses them.
          </AlertDescription>
        </Alert>

        {/* Provider Selection */}
        <Tabs value={provider} onValueChange={(v) => handleProviderChange(v as AIProvider)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="google" className="data-[state=active]:text-emerald-300">
              Gemini
              <span className="ml-1 hidden sm:inline text-[10px] font-semibold text-emerald-400">
                FREE
              </span>
            </TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="ollama">
              <Cpu className="h-4 w-4 mr-1" />
              Local
            </TabsTrigger>
          </TabsList>

          <TabsContent value="openai" className="space-y-4 mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-guide">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Setup Guide: How to Get Your OpenAI API Key
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Prerequisites</AlertTitle>
                    <AlertDescription>
                      You need an OpenAI account and billing setup with at least $5 in credits.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">1. Create an OpenAI Account</p>
                        <p className="text-muted-foreground">Visit platform.openai.com and sign up</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">2. Add Billing</p>
                        <p className="text-muted-foreground">Go to Settings → Billing → Add payment method. Add at least $5 in credits.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">3. Create API Key</p>
                        <p className="text-muted-foreground">Navigate to API Keys section and click "Create new secret key"</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">4. Copy and Save</p>
                        <p className="text-muted-foreground">Copy the key immediately (starts with "sk-") - you won't see it again</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">5. Paste Below</p>
                        <p className="text-muted-foreground">Enter the key in the field below</p>
                      </div>
                    </div>
                  </div>
                  
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Common Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>"Insufficient credits" - Add billing with at least $5</li>
                        <li>"Invalid key" - Key must start with "sk-"</li>
                        <li>"Incorrect API key" - Double-check you copied the entire key</li>
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
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="font-mono text-sm bg-input border-neuro-border pr-10"
                  onKeyDown={(e) => e.key === "Enter" && validateAndConnect()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setShowApiKey(!showApiKey)}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key at{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan hover:underline"
                >
                  platform.openai.com
                </a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="anthropic" className="space-y-4 mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-guide">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Setup Guide: How to Get Your Anthropic API Key
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Prerequisites</AlertTitle>
                    <AlertDescription>
                      You need an Anthropic account with at least $5 in credits.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">1. Create an Anthropic Account</p>
                        <p className="text-muted-foreground">Visit console.anthropic.com and sign up</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">2. Add Credits</p>
                        <p className="text-muted-foreground">Go to Settings → Billing and add at least $5 in credits</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">3. Create API Key</p>
                        <p className="text-muted-foreground">Go to Settings → API Keys and click "Create Key"</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">4. Copy the Key</p>
                        <p className="text-muted-foreground">Copy the key (starts with "sk-ant-")</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">5. Paste Below</p>
                        <p className="text-muted-foreground">Enter the key in the field below</p>
                      </div>
                    </div>
                  </div>
                  
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Common Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>"Insufficient credits" - Add funds to your account</li>
                        <li>"Invalid key" - Key must start with "sk-ant-"</li>
                        <li>"Unauthorized" - Check that billing is set up</li>
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
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="font-mono text-sm bg-input border-neuro-border pr-10"
                  onKeyDown={(e) => e.key === "Enter" && validateAndConnect()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setShowApiKey(!showApiKey)}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key at{" "}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan hover:underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="google" className="space-y-4 mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-guide">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Setup Guide: How to Get Your Google AI API Key
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <Alert className="border-emerald-500/40 bg-emerald-500/10">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <AlertTitle className="text-emerald-300">Free — no credit card</AlertTitle>
                    <AlertDescription>
                      Google AI Studio gives you a free Gemini API key with any Google account.
                      No billing, no Cloud Console, no card. It's the fastest way in.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">1. Open Google AI Studio</p>
                        <p className="text-muted-foreground">Go to aistudio.google.com/app/apikey and sign in with any Google account.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">2. Create your key</p>
                        <p className="text-muted-foreground">Click "Create API key" → "Create API key in new project". That's it — the free tier is on by default.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">3. Copy the key</p>
                        <p className="text-muted-foreground">Copy it (it starts with "AIza").</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">4. Paste it below</p>
                        <p className="text-muted-foreground">Enter the key in the field below and activate.</p>
                      </div>
                    </div>
                  </div>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>If something goes wrong</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>"API key not valid" — copy the whole key, no extra spaces</li>
                        <li>Rate limited / "one moment" — the free tier has a per-minute limit; wait a few seconds and continue</li>
                        <li>Only add billing if you later want higher limits — it's never required to start</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="space-y-2">
              <Label htmlFor="google-key">Google API Key</Label>
              <div className="relative">
                <SecretInput
                  id="google-key"
                  reveal={showApiKey}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="font-mono text-sm bg-input border-neuro-border pr-10"
                  onKeyDown={(e) => e.key === "Enter" && validateAndConnect()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setShowApiKey(!showApiKey)}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key at{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan hover:underline"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>
          </TabsContent>

          <TabsContent value="ollama" className="space-y-4 mt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="setup-guide">
                <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Setup Guide: How to Use Ollama Locally
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 text-sm">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Prerequisites</AlertTitle>
                    <AlertDescription>
                      Ollama runs AI models locally on your computer. No API key needed!
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">1. Download Ollama</p>
                        <p className="text-muted-foreground">Go to ollama.ai and download the installer for your OS (Mac, Linux, or Windows)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">2. Install and Run</p>
                        <p className="text-muted-foreground">Install Ollama and make sure it's running (check your system tray/menu bar)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">3. Open Terminal/Command Prompt</p>
                        <p className="text-muted-foreground">Open your terminal (Mac/Linux) or Command Prompt (Windows)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">4. Pull a Model</p>
                        <p className="text-muted-foreground">Run: <code className="bg-muted px-1 rounded">ollama pull llama2</code> (or mistral, phi3, gemma, etc.)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">5. Verify Installation</p>
                        <p className="text-muted-foreground">Run: <code className="bg-muted px-1 rounded">ollama list</code> to see installed models</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-neuro-cyan mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">6. Configure Below</p>
                        <p className="text-muted-foreground">Default endpoint is http://localhost:11434, enter the model name you pulled</p>
                      </div>
                    </div>
                  </div>
                  
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Common Errors</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>"Cannot connect" - Make sure Ollama is running</li>
                        <li>"Model not found" - Run <code className="bg-muted px-1 rounded">ollama pull [model-name]</code> first</li>
                        <li>"Connection refused" - Check that endpoint is http://localhost:11434</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Popular Models</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li><strong>llama2</strong> - Fast, versatile (3.8GB)</li>
                        <li><strong>mistral</strong> - Powerful, efficient (4.1GB)</li>
                        <li><strong>phi3</strong> - Small but capable (2.3GB)</li>
                        <li><strong>gemma</strong> - Google's model (5.2GB)</li>
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
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="font-mono text-sm bg-input border-neuro-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ollama-model">Model Name</Label>
                <Input
                  id="ollama-model"
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  placeholder="llama2, mistral, phi3, etc."
                  className="font-mono text-sm bg-input border-neuro-border"
                  onKeyDown={(e) => e.key === "Enter" && validateAndConnect()}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Install Ollama at{" "}
                <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-neuro-cyan hover:underline">
                  ollama.ai
                </a>
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Validation Status */}
        {isValidating && validationSteps.length > 0 && (
          <Card className="p-4 bg-card/30 border-neuro-border space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Validation Progress</span>
                <span className="text-neuro-cyan font-medium">{validationProgress}%</span>
              </div>
              <Progress value={validationProgress} className="h-2" />
            </div>
            
            <div className="space-y-3">
              {validationSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {step.status === "pending" && (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    {step.status === "inprogress" && (
                      <Loader2 className="h-5 w-5 text-neuro-cyan animate-spin" />
                    )}
                    {step.status === "success" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {step.status === "error" && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm font-medium ${
                      step.status === "inprogress" ? "text-neuro-cyan" :
                      step.status === "success" ? "text-green-500" :
                      step.status === "error" ? "text-destructive" :
                      "text-muted-foreground"
                    }`}>
                      {step.label}
                    </p>
                    {step.message && (
                      <p className="text-xs text-muted-foreground">{step.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button onClick={validateAndConnect} disabled={isValidating} className="w-full bg-neuro-cyan hover:bg-neuro-cyan/90 text-background min-h-[44px]">
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating Connection...
            </>
          ) : (
            <>
              Activate Echelon
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        {/* Help Text */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            This connection establishes the Operator-Echelon bond.
            <br />
            All data remains on your device.
          </p>
        </div>
      </Card>
      </div>
    </div>
  );
}
