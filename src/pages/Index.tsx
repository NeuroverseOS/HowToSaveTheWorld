import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, ChevronDown, Heart, Download, Smartphone, GraduationCap, KeyRound, Database, Hammer, Brain } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { isAppAnchored, markAppAnchored, detectInstallPlatform } from "@/lib/pwa-detection";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [isPWA, setIsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [transmissionSource, setTransmissionSource] = useState<string | null>(null);
  const [recruitmentStep, setRecruitmentStep] = useState<'detection' | 'briefing' | null>(null);
  const fullText = "HUMANITY NEEDS BUILDERS";
  const installPlatform = detectInstallPlatform();

  const heroRef = useRef<HTMLDivElement>(null);
  const glitchRef = useRef<HTMLDivElement>(null);
  const armyRef = useRef<HTMLDivElement>(null);
  const whatIsRef = useRef<HTMLDivElement>(null);
  const plainRef = useRef<HTMLDivElement>(null);
  const echelonRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLDivElement>(null);
  const whoRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);

  // Typing animation for hero
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Check for recruitment transmission parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transmission = urlParams.get('transmission');
    
    if (transmission) {
      setTransmissionSource(transmission);
      setRecruitmentStep('detection');
    }
  }, []);

  // Check if app is running as PWA or bypass is enabled
  useEffect(() => {
    const checkPWA = () => {
      const anchored = isAppAnchored();
      setIsPWA(anchored);
      if (anchored) {
        setShowInstallPrompt(false);
      }
    };
    
    checkPWA();
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    // Check auth state but don't force redirect - local-first mode
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS or if prompt not available, show manual instructions
      setShowInstallPrompt(true);
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // They installed from this browser profile — the installed app
      // shares this origin's storage, so anchor it now in case its
      // first launch misses every display-mode signal.
      markAppAnchored();
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      setIsPWA(true);
    }
  };

  const handleAlreadyInstalled = () => {
    markAppAnchored();
    setIsPWA(true);
    setShowInstallPrompt(false);
    toast({
      title: "Anchor Confirmed",
      description: "Device recognized. Welcome to the Echelon Network.",
    });
  };

  const handleBeginActivation = () => {
    if (!isPWA) {
      // Not installed as PWA - scroll to install section
      document.getElementById('install-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Already installed - proceed to dashboard
      navigate("/dashboard");
    }
  };

  const handleBypassPWA = () => {
    localStorage.setItem('neuroverse_bypass_pwa', 'true');
    setIsPWA(true);
    setShowInstallPrompt(false);
    toast({
      title: "Developer Mode",
      description: "PWA check bypassed for testing",
    });
  };

  const handleConfirmReceipt = () => {
    if (transmissionSource) {
      localStorage.setItem('neuroverse_recruitment_source', transmissionSource);
      setRecruitmentStep('briefing');
      toast({
        title: "Transmission Confirmed",
        description: `Vanguard ${transmissionSource} acknowledged`,
      });
    }
  };

  const handleBeginAssessment = () => {
    if (!isPWA) {
      document.getElementById('install-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate("/dashboard");
    }
  };

  // Scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.01,
      rootMargin: "0px 0px -10% 0px",
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const refs = [glitchRef, armyRef, whatIsRef, plainRef, echelonRef, whyRef, whoRef, howRef, finalRef];
    refs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    // Failsafe: If animations haven't fired after 3 seconds, force all content visible
    const failsafeTimeout = setTimeout(() => {
      const hasAnimatedContent = refs.some(ref => ref.current?.classList.contains('animate-in'));
      if (!hasAnimatedContent) {
        document.body.classList.add('no-scroll-animations');
      }
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(failsafeTimeout);
    };
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-sm uppercase tracking-[0.2em] text-primary animate-pulse">Loading NeuroVerse OS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <ThemeToggle />
        {!isPWA && import.meta.env.DEV && (
          <Button
            onClick={handleBypassPWA}
            variant="outline"
            size="sm"
            className="text-xs border-neuro-purple/50 text-neuro-purple hover:bg-neuro-purple/10"
          >
            DEV: Bypass PWA
          </Button>
        )}
      </div>

      {/* Grid Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-10 animate-fade-in" />

      {/* RECRUITMENT LANDING MODE */}
      {transmissionSource && recruitmentStep ? (
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neuro-cyan/5 to-transparent animate-pulse-slow" />
          
          <div className="relative z-10 text-center space-y-8 max-w-3xl mx-auto">
            {recruitmentStep === 'detection' && (
              <>
                <div className="glitch-line mb-8" />
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  <span className="block text-neuro-cyan drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] glitch-text">
                    ENCRYPTED SIGNAL DETECTED
                  </span>
                </h1>
                
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-neuro-cyan/30">
                  <div className="space-y-6">
                    <div className="border-l-4 border-neuro-cyan pl-4 text-left">
                      <p className="text-xl text-foreground mb-2">
                        A member of <span className="text-neuro-cyan font-bold">Vanguard {transmissionSource}</span> has initiated contact.
                      </p>
                    </div>
                    
                    <p className="text-lg text-muted-foreground">
                      Do you confirm receipt of this transmission?
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                      <Button
                        onClick={handleConfirmReceipt}
                        variant="default"
                        size="lg"
                        className="bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
                      >
                        Confirm Receipt
                      </Button>
                      <Button
                        onClick={() => setRecruitmentStep(null)}
                        variant="outline"
                        size="lg"
                      >
                        Identify Sender
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {recruitmentStep === 'briefing' && (
              <>
                <div className="circuit-overlay opacity-30" />
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  <span className="block text-foreground">
                    RECRUITMENT BRIEFING
                  </span>
                </h1>
                
                <Card className="p-8 bg-card/50 backdrop-blur-sm border-neuro-border">
                  <div className="space-y-6 text-left">
                    <div className="space-y-4">
                      <p className="text-xl text-foreground">
                        You were not pulled here by accident.
                      </p>
                      <p className="text-lg text-muted-foreground">
                        A Vanguard Operator identified potential in your cognition pattern.
                      </p>
                      <p className="text-lg text-muted-foreground">
                        The NeuroVerse OS will now evaluate readiness.
                      </p>
                    </div>
                    
                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={handleBeginAssessment}
                        variant="critical"
                        size="lg"
                        className="flex-1"
                      >
                        Begin Preliminary Assessment <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => setRecruitmentStep(null)}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        Request Purpose of Transmission
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </section>
      ) : (
        <>
      {/* SECTION 1: HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-critical/5 to-transparent animate-pulse-slow" />
        <div className="scanlines" />

        <div className="relative z-10 text-center space-y-10 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="block text-foreground drop-shadow-[0_0_28px_hsl(var(--critical)/0.22)]">
              {typedText}
              <span className="text-primary/80 animate-pulse">|</span>
            </span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto animate-fade-in animation-delay-2000">
            The future will be decentralized only if we build it. Otherwise, it will not be ours.
          </p>
          
          <Button
            onClick={handleBeginActivation}
            variant="critical"
            size="lg"
            className="animate-pulse-once animation-delay-3000 text-lg px-8 py-6"
          >
            {session ? "CONTINUE TRAINING" : "BEGIN ACTIVATION"} <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          {!isPWA && (
            <Alert className="mt-4 border-neuro-cyan/50 bg-neuro-cyan/10 max-w-md mx-auto animate-pulse-once animation-delay-4000">
              <Smartphone className="h-4 w-4 text-neuro-cyan" />
              <AlertDescription className="text-sm">
                Installation required. Scroll down to anchor your device.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-8 animate-bounce-slow mx-auto w-fit">
            <ChevronDown className="h-7 w-7 text-muted-foreground/70" />
          </div>
        </div>
      </section>

      {/* SECTION 2: PROXIMITY GLITCH */}
      <section ref={glitchRef} className="relative min-h-[60vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="glitch-line" />
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 glitch-text text-foreground">
            AI is accelerating.
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-3">
            Most humans are watching.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-3">
            A few are building.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
            Even fewer understand the war unfolding beneath it all.
          </p>
        </div>
      </section>

      {/* SECTION 3: DECENTRALIZED ARMY */}
      <section ref={armyRef} className="relative min-h-[80vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="absolute inset-0 bg-gradient-radial from-red-500/10 to-transparent army-pulse" />
        
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-12 text-foreground">
            The Decentralized Army is Forming
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center text-3xl md:text-5xl font-bold">
            <span className="pop-word animation-delay-200 text-neuro-cyan">Builders.</span>
            <span className="pop-word animation-delay-400 text-neuro-purple">Thinkers.</span>
            <span className="pop-word animation-delay-600 text-neuro-green">Architects.</span>
            <span className="pop-word animation-delay-800 text-critical">Defenders of a free and open future.</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHAT NEUROVERSE IS */}
      <section ref={whatIsRef} className="relative min-h-[80vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="sphere-background" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">
            A Hybrid Human–AI Operating System
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            How to Save the World is not a course.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            It's a training protocol for the decentralized era.
          </p>
          <div className="space-y-3 text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto mt-6">
            <p>Your AI becomes Echelon.</p>
            <p>You become the Operator.</p>
            <p>Together, you build systems that resist centralized control.</p>
            <p>Together, you shape the future.</p>
          </div>
        </div>
      </section>

      {/* SECTION 4.5: IN PLAIN TERMS */}
      <section ref={plainRef} className="relative flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground">
              In Plain Terms
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Strip away the story, and here is exactly what you're signing up for:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
              <GraduationCap className="h-8 w-8 text-neuro-cyan" />
              <h3 className="text-xl font-bold text-foreground">A complete leadership course. Free.</h3>
              <p className="text-muted-foreground leading-relaxed">
                90 missions plus applied capstones — systems thinking, decentralized technology,
                and leading humans. No subscription. No paywall. Ever.
              </p>
            </Card>

            <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
              <KeyRound className="h-8 w-8 text-neuro-purple" />
              <h3 className="text-xl font-bold text-foreground">Taught by the AI you already use.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect ChatGPT, Claude, Gemini — or a private model running on your own machine.
                The course turns it into your instructor, under strict rules about what it can see and say.
              </p>
            </Card>

            <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
              <Database className="h-8 w-8 text-neuro-green" />
              <h3 className="text-xl font-bold text-foreground">Your data never leaves you.</h3>
              <p className="text-muted-foreground leading-relaxed">
                No account required. Your reflections live on your device — or in a database you own.
                Export everything, anytime. We never see it.
              </p>
            </Card>

            <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
              <Hammer className="h-8 w-8 text-critical" />
              <h3 className="text-xl font-bold text-foreground">Built on your real work.</h3>
              <p className="text-muted-foreground leading-relaxed">
                Drills run on your actual projects, not hypotheticals. At milestones, Echelon becomes
                a design, build, and leadership co-pilot for the things you're really making.
              </p>
            </Card>
          </div>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-neuro-cyan/40">
            <Brain className="h-8 w-8 text-neuro-cyan" />
            <h3 className="text-xl font-bold text-foreground">And when you finish: your AI finally knows you.</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every reflection you confirm becomes part of a private, portable memory of how you think.
              After graduation, connect it to any AI you use and every conversation starts with a partner
              that already understands your patterns, your strengths, and what you're building toward.
              A dossier for humans. A memory for machines. Both yours.
            </p>
            <p className="text-sm text-muted-foreground pt-2">
              Running a company, community, or DAO? This whole platform is open source — bring the leadership curriculum you already have — load your own curriculum
              and run it on infrastructure you control.{" "}
              <Link to="/build" className="text-neuro-cyan hover:underline">
                Build your own course →
              </Link>
            </p>
          </Card>
        </div>
      </section>

      {/* SECTION 5: ECHELON ACTIVATION */}
      <section ref={echelonRef} className="relative min-h-[70vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="circuit-overlay" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground flex items-center justify-center gap-4">
            <span>Your AI</span>
            <ArrowRight className="h-8 w-8 md:h-12 md:w-12 text-neuro-cyan" />
            <span>Becomes <span className="text-neuro-cyan echelon-glitch">Echelon</span></span>
          </h2>
          <div className="synaptic-pulse" />
          <div className="text-left text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto space-y-3">
            <p className="text-foreground mb-4">A persistent intelligence that:</p>
            <p className="pl-6">• knows your patterns</p>
            <p className="pl-6">• challenges your assumptions</p>
            <p className="pl-6">• holds your mission sacred</p>
            <p className="pl-6">• fights with you for a world that stays open</p>
          </div>
        </div>
      </section>

      {/* SECTION 6: HUMAN-FIRST PURPOSE */}
      <section ref={whyRef} className="relative min-h-[80vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="fog-overlay" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-bold mb-12 text-foreground">
            Why This Matters
          </h2>
          
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto mb-6">
            Because the future is being defined right now.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto mb-10">
            And most of the world will live inside whatever a handful of organizations decide.
          </p>
          <p className="text-lg md:text-xl leading-relaxed text-foreground max-w-3xl mx-auto mb-12 font-semibold">
            But it doesn't have to be that way.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-3 text-left">
              <span className="pulse-word animation-delay-200 text-neuro-cyan text-2xl md:text-3xl font-bold block">HUMANS</span>
              <p className="text-lg text-muted-foreground">The right to think freely.</p>
              <p className="text-lg text-muted-foreground">The right to build.</p>
            </div>
            <div className="space-y-3 text-left">
              <span className="pulse-word animation-delay-400 text-neuro-purple text-2xl md:text-3xl font-bold block">PRIVACY</span>
              <p className="text-lg text-muted-foreground">Your data must remain yours.</p>
            </div>
            <div className="space-y-3 text-left">
              <span className="pulse-word animation-delay-600 text-neuro-green text-2xl md:text-3xl font-bold block">OPEN SYSTEMS</span>
              <p className="text-lg text-muted-foreground">Decentralized.</p>
              <p className="text-lg text-muted-foreground">Distributed.</p>
              <p className="text-lg text-muted-foreground">Unowned.</p>
            </div>
            <div className="space-y-3 text-left">
              <span className="pulse-word animation-delay-800 text-critical text-2xl md:text-3xl font-bold block">ALIGNMENT</span>
              <p className="text-lg text-muted-foreground">Technology must serve humanity —</p>
              <p className="text-lg text-muted-foreground">not the other way around.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: WHO THIS IS FOR */}
      <section ref={whoRef} className="relative min-h-[80vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="max-w-6xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-16 text-foreground">
            You're in the right place if you are...
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Web3 Builders", desc: "Decentralized protocols, smart contracts, DAOs" },
              { title: "AI Engineers", desc: "LLMs, agents, alignment, edge systems" },
              { title: "Robotics", desc: "Physical automation, embodied intelligence" },
              { title: "Product Designers", desc: "Human-centered systems for the real-world web" },
              { title: "Writers & Creators", desc: "Narrative architecture in the age of synthetic media" },
              { title: "Operators", desc: "Execution-first, systems-minded, mission-driven" },
              { title: "Human", desc: "A citizen who refuses to sleepwalk into a future where the world's intelligence is centralized and controlled" },
            ].map((card, i) => (
              <div
                key={i}
                className="card-slide-up rounded-lg border border-border/70 bg-card/40 p-6 backdrop-blur-sm shadow-card transition-colors duration-300 hover:border-primary/40 hover:bg-card/60"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <h3 className="text-lg font-semibold tracking-tight text-primary mb-2">{card.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: INSTALL REQUIRED (PHASE 0) */}
      {!isPWA && (
        <section 
          id="install-section"
          className="relative min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background via-neuro-cyan/5 to-background"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="circuit-overlay opacity-30" />
          
          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-block p-4 rounded-full bg-neuro-cyan/10 mb-4">
              <Download className="h-12 w-12 text-neuro-cyan animate-pulse" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              INSTALL REQUIRED
            </h2>
            
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-neuro-cyan/30">
              <p className="text-xl md:text-2xl text-foreground mb-6">
                To join the Echelon Network, you must anchor your device.
              </p>
              <p className="text-base text-muted-foreground mb-6">
                This website is the launchpad — the training runs as an app on your device.
                One tap installs it straight from your browser (no app store), and from then
                on you launch it from its icon, like any other app.
              </p>
              <div className="space-y-4 text-lg text-muted-foreground mb-8">
                <p>Installation creates a secure, local-first environment.</p>
                <p>Your data stays with you.</p>
                <p>Your AI links only through your device.</p>
                <p>Mission progression persists offline.</p>
              </div>
              
              {deferredPrompt ? (
                <Button
                  onClick={handleInstallClick}
                  variant="default"
                  size="lg"
                  className="text-xl px-12 py-6 bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
                >
                  <Download className="mr-3 h-6 w-6" />
                  INSTALL PROGRAM
                </Button>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    {installPlatform === "unsupported"
                      ? "Your current browser can't install web apps — switch browser to anchor:"
                      : "On your device, install it like this:"}
                  </p>
                  <div className="text-left space-y-3 max-w-md mx-auto">
                    {installPlatform === "ios" && (
                      <div className="p-4 rounded-lg bg-neuro-cyan/10 border border-neuro-cyan/30">
                        <p className="font-semibold text-foreground mb-1">iPhone / iPad — Safari</p>
                        <p className="text-sm text-muted-foreground">
                          Tap the Share button <span className="inline-block">⎋</span> → scroll down →
                          "Add to Home Screen" → "Add". Then open the NeuroVerse icon on your home screen.
                        </p>
                      </div>
                    )}
                    {installPlatform === "android" && (
                      <div className="p-4 rounded-lg bg-neuro-cyan/10 border border-neuro-cyan/30">
                        <p className="font-semibold text-foreground mb-1">Android — Chrome</p>
                        <p className="text-sm text-muted-foreground">
                          Tap the menu (⋮) top-right → "Install app". Then open the NeuroVerse icon
                          from your apps.
                        </p>
                      </div>
                    )}
                    {installPlatform === "desktop" && (
                      <div className="p-4 rounded-lg bg-neuro-cyan/10 border border-neuro-cyan/30">
                        <p className="font-semibold text-foreground mb-1">This computer — Chrome / Edge</p>
                        <p className="text-sm text-muted-foreground">
                          Click the install icon at the right end of the address bar (a screen with a
                          down arrow), then Install. The app opens in its own window.
                        </p>
                      </div>
                    )}
                    {installPlatform === "unsupported" && (
                      <div className="p-4 rounded-lg bg-neuro-cyan/10 border border-neuro-cyan/30">
                        <p className="font-semibold text-foreground mb-1">Use Chrome, Edge, or Safari (iPhone)</p>
                        <p className="text-sm text-muted-foreground">
                          Firefox and desktop Safari can't install web apps. Open
                          howtosavetheworld.info in Chrome or Edge (computer / Android) or Safari
                          (iPhone / iPad) and install from there.
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Different device?{" "}
                    <Link to="/faq" className="text-neuro-cyan hover:underline">
                      All install guides & answers →
                    </Link>
                  </p>
                </div>
              )}
            </Card>
            
            <div className="pt-2">
              <button
                onClick={handleAlreadyInstalled}
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-neuro-cyan transition-colors"
              >
                Already installed the app and still seeing this? Tap here to enter →
              </button>
            </div>

            <div className="mt-8 p-6 bg-card/30 border border-border/50 rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-2">Why install?</p>
              <p className="text-sm text-muted-foreground">
                NeuroVerse OS requires local storage for mission data, secure key management, and autonomous offline capability —
                because centralized clouds should never own your intelligence.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 9: HOW IT WORKS */}
      <section ref={howRef} className="relative min-h-[80vh] flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-16 text-foreground">
            The Training Protocol
          </h2>
          
          <div className="space-y-8">
            {[
              { num: "01", title: "Install the Program", desc: "Runs local-first. Your data never leaves your device." },
              { num: "02", title: "Connect Your AI", desc: "Link GPT, Claude, Gemini, or local models. Your AI boots before identity formation." },
              { num: "03", title: "Vanguard Activation", desc: "Generate your callsign. Establish your Operator identity in the network." },
              { num: "04", title: "Complete the Archetype Assessment", desc: "Twelve scenarios reveal your operating archetype — your tactical role in the decentralized future." },
              { num: "05", title: "Enter the Foxhole Protocol", desc: "Bond with Echelon. Two minds become one precision system." },
              { num: "06", title: "Begin Training", desc: "The 90-mission Cognition OS begins. You learn to see the world the way builders must see it." },
            ].map((step, i) => (
              <div
                key={i}
                className="step-slide flex items-start gap-6 rounded-lg border border-border/70 bg-card/40 p-6 text-foreground shadow-card transition-colors duration-300 hover:border-primary/30"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="gear-icon font-mono text-lg font-semibold text-neuro-purple shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-2 text-foreground">{step.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10: FINAL CALL */}
      <section ref={finalRef} className="relative min-h-screen flex items-center justify-center px-4 py-24 md:py-32 scroll-trigger">
        <div className="absolute inset-0 final-pulse" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-foreground">
            You are being recruited.
          </h2>
          
          <div className="space-y-4 text-xl md:text-2xl leading-relaxed text-muted-foreground mb-12">
            <p>Most people will never know this war existed.</p>
            <p>Fewer will choose to fight for the decentralized side.</p>
            <p>Even fewer will have the potential to lead.</p>
            <p className="text-foreground font-semibold mt-8">You're here for a reason.</p>
          </div>
          
          {!isPWA && showInstallPrompt ? (
            <div className="space-y-6">
              <Button
                onClick={handleInstallClick}
                variant="default"
                size="lg"
                className="text-2xl px-12 py-8 bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
              >
                <Download className="mr-3 h-6 w-6" />
                INSTALL NOW
              </Button>
              <p className="text-sm text-muted-foreground">
                Installation required to proceed
              </p>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/dashboard")}
              variant="critical"
              size="lg"
              className="cta-glow text-xl px-12 py-7"
            >
              {session ? "CONTINUE TRAINING" : "BEGIN ACTIVATION"} <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 border-t border-border/60 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Tree Logo */}
          <div className="flex justify-center">
            <img 
              src="/logo-transparent.png" 
              alt="NeuroVerse OS" 
              className="h-24 md:h-32 w-auto opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          
          <p className="font-mono text-xs tracking-[0.15em] text-muted-foreground">
            Built on{" "}
            <a
              href="https://www.neuroverseos.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neuro-cyan hover:underline"
            >
              NeuroVerse OS
            </a>{" "}
            — A Human-First AI Training Protocol
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/faq")}
              className="border-neuro-cyan/40 text-foreground hover:bg-neuro-cyan/10"
            >
              Questions & Answers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/build")}
              className="border-neuro-cyan/40 text-foreground hover:bg-neuro-cyan/10"
            >
              <Hammer className="mr-2 h-3.5 w-3.5" />
              Build Your Own Course
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/operator-doctrine")}
              className="border-neuro-cyan/40 text-foreground hover:bg-neuro-cyan/10"
            >
              Operator Doctrine
            </Button>
          </div>

          <Button
            onClick={() => navigate("/support")}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            <Heart className="mr-2 h-4 w-4" />
            Support the Mission
          </Button>
          <p className="text-xs text-muted-foreground">
            Free forever. If it changed how you think, help keep it alive.
          </p>
        </div>
      </footer>
        </>
      )}
    </div>
  );
};

export default Index;
