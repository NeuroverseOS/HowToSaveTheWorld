import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { loadState } from "@/lib/state-engine";
import { TRAIT_MAP, getTraitDefinition } from "@/lib/identity-system";
import { getEvolutionTimeline, getTraitCompletion } from "@/lib/identity-unlock-engine";
import { getFieldGuideTranslation } from "@/lib/field-guide-translations";
import GraduationDossierTab from "@/components/neuroverse/GraduationDossierTab";
import type { Database } from "@/integrations/supabase/types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { 
  ArrowLeft, 
  Lock, 
  Unlock, 
  Zap, 
  Eye, 
  TrendingUp,
  Activity,
  Target,
  Layers,
  Sparkles,
  Clock,
  FileDown,
  Brain,
  MessageSquare,
  GitBranch,
  AlertTriangle,
  Flame,
  ChevronDown,
  Search,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
  LayoutGrid
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getMissionLogs, MissionLogEntry } from "@/lib/mission-log";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type DbOperatorTrait = Database["public"]["Tables"]["operator_traits"]["Row"];

interface OperatorTrait {
  trait_tag: string;
  unlocked: boolean;
  unlocked_at: string | null;
  subskills_unlocked: string[];
  shadow_revealed: boolean;
  superpower_revealed: boolean;
  completionPercent: number;
}

interface EvolutionEntry {
  id: string;
  lesson_id: number | null;
  trait_tag: string | null;
  subskill_unlocked: string | null;
  insight_type: string | null;
  insight_text: string | null;
  created_at: string | null;
  unlocked_at: string | null;
}

export default function FieldGuide() {
  const navigate = useNavigate();
  const [traits, setTraits] = useState<OperatorTrait[]>([]);
  const [evolution, setEvolution] = useState<EvolutionEntry[]>([]);
  const [missionLogs, setMissionLogs] = useState<MissionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [callsign, setCallsign] = useState<string>("");
  const [rank, setRank] = useState<string>("Recruit");
  const [userId, setUserId] = useState<string>("");
  const [languageCode, setLanguageCode] = useState<string>("en");
  const [primaryArchetype, setPrimaryArchetype] = useState<string>("");
  const [shadowArchetype, setShadowArchetype] = useState<string>("");
  const [risingArchetype, setRisingArchetype] = useState<string>("");
  
  // Mission Insights filter states
  const [searchText, setSearchText] = useState<string>("");
  const [selectedTraitFilters, setSelectedTraitFilters] = useState<string[]>([]);
  const [selectedShadowFilters, setSelectedShadowFilters] = useState<string[]>([]);
  const [selectedPowerFilters, setSelectedPowerFilters] = useState<string[]>([]);
  
  // Mission Insights sort states
  const [sortBy, setSortBy] = useState<"mission" | "timestamp" | "signals">("mission");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Mission Insights view mode
  const [viewMode, setViewMode] = useState<"logs" | "visualizations">("logs");

  useEffect(() => {
    const state = loadState();
    if (!state) {
      navigate("/");
      return;
    }

    setCallsign(state.user.vanguard.callsign || "Recruit");
    setRank(state.rank?.current || "Recruit");
    setUserId(state.user.id);
    setLanguageCode(state.user.language?.code || "en");
    setPrimaryArchetype(state.user.archetype?.primary || "");
    setShadowArchetype(state.user.archetype?.shadow || "");
    setRisingArchetype(state.user.archetype?.rising || "");

    // Load mission logs from local storage
    const logs = getMissionLogs();
    setMissionLogs(logs);
    console.log('[FIELD GUIDE] Loaded mission logs:', logs.length);

    fetchTraitsAndEvolution(state.user.id);
  }, [navigate]);

  const fetchTraitsAndEvolution = async (userId: string) => {
    try {
      console.log('[FIELD GUIDE] Fetching traits and evolution for user:', userId);
      
      // Fetch all trait tags from TRAIT_MAP
      const allTraitTags = Object.keys(TRAIT_MAP);
      
      // Fetch completion data for each trait using Identity Unlock Engine
      const traitPromises = allTraitTags.map(async (traitTag) => {
        const completion = await getTraitCompletion(userId, traitTag);
        return {
          trait_tag: traitTag,
          unlocked: completion.unlocked,
          unlocked_at: null, // Will fetch separately if needed
          subskills_unlocked: Array(completion.subskillsUnlocked).fill('').map((_, i) => 
            completion.trait.subskills[i]
          ).filter(Boolean),
          shadow_revealed: completion.shadowRevealed,
          superpower_revealed: completion.superpowerRevealed,
          completionPercent: completion.completionPercent,
        };
      });

      const transformedTraits = await Promise.all(traitPromises);

      // Use Identity Unlock Engine to fetch evolution timeline
      const evolutionData = await getEvolutionTimeline(userId);

      console.log('[FIELD GUIDE] Loaded traits:', transformedTraits.filter(t => t.unlocked).length);
      console.log('[FIELD GUIDE] Evolution events:', evolutionData.length);

      setTraits(transformedTraits);
      setEvolution(evolutionData as any);
    } catch (error) {
      console.error("Failed to fetch Field Guide data:", error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedTraits = traits.filter(t => t.unlocked);
  const lockedTraits = traits.filter(t => !t.unlocked);
  const superpowerTraits = unlockedTraits.filter(t => t.superpower_revealed);
  
  // Get translations for current language
  const t = getFieldGuideTranslation(languageCode);

  // Get all unique signals from mission logs for filter UI
  const allTraitSignals = Array.from(new Set(missionLogs.flatMap(log => log.traitSignals))).sort();
  const allShadowSignals = Array.from(new Set(missionLogs.flatMap(log => log.shadowSignals))).sort();
  const allPowerSignals = Array.from(new Set(missionLogs.flatMap(log => log.powerSignals))).sort();

  // Filter mission logs based on search and selected filters
  const filteredMissionLogs = missionLogs.filter(log => {
    // Text search filter (searches title and insight summary)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        log.lessonTitle.toLowerCase().includes(searchLower) ||
        log.insightSummary.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Trait signal filter (show if log has ANY of the selected traits)
    if (selectedTraitFilters.length > 0) {
      const hasMatchingTrait = selectedTraitFilters.some(filter => 
        log.traitSignals.includes(filter)
      );
      if (!hasMatchingTrait) return false;
    }

    // Shadow signal filter
    if (selectedShadowFilters.length > 0) {
      const hasMatchingShadow = selectedShadowFilters.some(filter => 
        log.shadowSignals.includes(filter)
      );
      if (!hasMatchingShadow) return false;
    }

    // Power signal filter
    if (selectedPowerFilters.length > 0) {
      const hasMatchingPower = selectedPowerFilters.some(filter => 
        log.powerSignals.includes(filter)
      );
      if (!hasMatchingPower) return false;
    }

    return true;
  });

  // Toggle filter selection
  const toggleTraitFilter = (signal: string) => {
    setSelectedTraitFilters(prev => 
      prev.includes(signal) ? prev.filter(s => s !== signal) : [...prev, signal]
    );
  };

  const toggleShadowFilter = (signal: string) => {
    setSelectedShadowFilters(prev => 
      prev.includes(signal) ? prev.filter(s => s !== signal) : [...prev, signal]
    );
  };

  const togglePowerFilter = (signal: string) => {
    setSelectedPowerFilters(prev => 
      prev.includes(signal) ? prev.filter(s => s !== signal) : [...prev, signal]
    );
  };

  const clearAllFilters = () => {
    setSearchText("");
    setSelectedTraitFilters([]);
    setSelectedShadowFilters([]);
    setSelectedPowerFilters([]);
  };

  const hasActiveFilters = searchText || selectedTraitFilters.length > 0 || 
    selectedShadowFilters.length > 0 || selectedPowerFilters.length > 0;

  // Sort filtered mission logs
  const sortedMissionLogs = [...filteredMissionLogs].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case "mission":
        compareValue = a.lessonId - b.lessonId;
        break;
      case "timestamp":
        compareValue = a.timestamp - b.timestamp;
        break;
      case "signals":
        const aSignalCount = a.traitSignals.length + a.shadowSignals.length + a.powerSignals.length;
        const bSignalCount = b.traitSignals.length + b.shadowSignals.length + b.powerSignals.length;
        compareValue = aSignalCount - bSignalCount;
        break;
    }
    
    return sortDirection === "asc" ? compareValue : -compareValue;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Export mission logs as JSON
  const exportAsJSON = () => {
    const exportData = {
      operator: {
        callsign,
        archetype: {
          primary: primaryArchetype,
          shadow: shadowArchetype,
          rising: risingArchetype
        }
      },
      exportDate: new Date().toISOString(),
      totalMissions: sortedMissionLogs.length,
      filters: {
        searchText,
        traitFilters: selectedTraitFilters,
        shadowFilters: selectedShadowFilters,
        powerFilters: selectedPowerFilters
      },
      sortedBy: sortBy,
      sortDirection,
      missions: sortedMissionLogs.map(log => ({
        lessonId: log.lessonId,
        lessonTitle: log.lessonTitle,
        insightSummary: log.insightSummary,
        patterns: log.patterns,
        traitSignals: log.traitSignals,
        shadowSignals: log.shadowSignals,
        powerSignals: log.powerSignals,
        timestamp: new Date(log.timestamp).toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroverse_mission_insights_${callsign}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export mission logs as Markdown
  const exportAsMarkdown = () => {
    let markdown = `# MISSION INSIGHTS — OPERATOR ${callsign}\n\n`;
    markdown += `**Archetype Triad:** Primary: ${primaryArchetype} | Shadow: ${shadowArchetype} | Rising: ${risingArchetype}\n\n`;
    markdown += `**Export Date:** ${new Date().toISOString()}\n\n`;
    markdown += `**Total Missions:** ${sortedMissionLogs.length}\n\n`;
    
    if (hasActiveFilters) {
      markdown += `## Active Filters\n\n`;
      if (searchText) markdown += `- **Search:** "${searchText}"\n`;
      if (selectedTraitFilters.length > 0) markdown += `- **Trait Signals:** ${selectedTraitFilters.join(', ')}\n`;
      if (selectedShadowFilters.length > 0) markdown += `- **Shadow Signals:** ${selectedShadowFilters.join(', ')}\n`;
      if (selectedPowerFilters.length > 0) markdown += `- **Power Signals:** ${selectedPowerFilters.join(', ')}\n`;
      markdown += `\n`;
    }

    markdown += `**Sorted by:** ${sortBy} (${sortDirection})\n\n`;
    markdown += `---\n\n`;

    sortedMissionLogs.forEach((log, index) => {
      markdown += `## Mission ${log.lessonId}: ${log.lessonTitle}\n\n`;
      markdown += `**Timestamp:** ${new Date(log.timestamp).toLocaleString()}\n\n`;
      markdown += `### Insight Summary\n\n${log.insightSummary}\n\n`;
      
      if (log.patterns.length > 0) {
        markdown += `### Patterns Detected\n\n`;
        log.patterns.forEach(pattern => markdown += `- ${pattern}\n`);
        markdown += `\n`;
      }

      if (log.traitSignals.length > 0) {
        markdown += `### Trait Signals\n\n`;
        log.traitSignals.forEach(signal => markdown += `- \`${signal}\`\n`);
        markdown += `\n`;
      }

      if (log.shadowSignals.length > 0) {
        markdown += `### Shadow Signals\n\n`;
        log.shadowSignals.forEach(signal => markdown += `- \`${signal}\`\n`);
        markdown += `\n`;
      }

      if (log.powerSignals.length > 0) {
        markdown += `### Power Signals\n\n`;
        log.powerSignals.forEach(signal => markdown += `- \`${signal}\`\n`);
        markdown += `\n`;
      }

      if (index < sortedMissionLogs.length - 1) {
        markdown += `---\n\n`;
      }
    });

    markdown += `\n---\n\n*Generated by NeuroVerse OS — Operator ${callsign} — ${new Date().toLocaleDateString()}*\n`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neuroverse_mission_insights_${callsign}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chart configuration
  const signalTrendConfig: ChartConfig = {
    traits: { label: "Traits", color: "hsl(187 100% 42%)" },
    shadows: { label: "Shadows", color: "hsl(38 92% 50%)" },
    powers: { label: "Powers", color: "hsl(160 84% 39%)" },
  };

  // Data transformation functions for charts
  const getSignalTrendData = () => {
    let traitCount = 0;
    let shadowCount = 0;
    let powerCount = 0;
    
    return [...missionLogs]
      .sort((a, b) => a.lessonId - b.lessonId)
      .map((log) => {
        traitCount += log.traitSignals.length;
        shadowCount += log.shadowSignals.length;
        powerCount += log.powerSignals.length;
        return {
          mission: `M${log.lessonId}`,
          missionId: log.lessonId,
          traits: traitCount,
          shadows: shadowCount,
          powers: powerCount,
          total: traitCount + shadowCount + powerCount,
        };
      });
  };

  const getPerMissionSignalData = () => {
    return [...missionLogs]
      .sort((a, b) => a.lessonId - b.lessonId)
      .map((log) => ({
        mission: `M${log.lessonId}`,
        missionId: log.lessonId,
        traits: log.traitSignals.length,
        shadows: log.shadowSignals.length,
        powers: log.powerSignals.length,
      }));
  };

  const getSignalDistributionData = () => {
    const totals = missionLogs.reduce(
      (acc, log) => ({
        traits: acc.traits + log.traitSignals.length,
        shadows: acc.shadows + log.shadowSignals.length,
        powers: acc.powers + log.powerSignals.length,
      }),
      { traits: 0, shadows: 0, powers: 0 }
    );
    
    return [
      { name: "Trait Signals", value: totals.traits, fill: "hsl(187 100% 42%)" },
      { name: "Shadow Signals", value: totals.shadows, fill: "hsl(38 92% 50%)" },
      { name: "Power Signals", value: totals.powers, fill: "hsl(160 84% 39%)" },
    ];
  };

  const getPatternEvolutionData = () => {
    const patternMap: Record<string, number[]> = {};
    
    missionLogs.forEach((log) => {
      log.patterns.forEach((pattern) => {
        if (!patternMap[pattern]) patternMap[pattern] = [];
        patternMap[pattern].push(log.lessonId);
      });
    });
    
    return Object.entries(patternMap)
      .map(([pattern, missions]) => ({
        pattern,
        count: missions.length,
        firstAppearance: Math.min(...missions),
        lastAppearance: Math.max(...missions),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-neuro-cyan animate-pulse">{t.loadingFieldGuide}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Grid Background */}
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Circuit Animation */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="5%" y1="20%" x2="95%" y2="20%" stroke="rgb(6, 182, 212)" strokeWidth="1">
            <animate attributeName="stroke-opacity" values="0;1;0" dur="4s" repeatCount="indefinite" />
          </line>
          <line x1="5%" y1="80%" x2="95%" y2="80%" stroke="rgb(168, 85, 247)" strokeWidth="1">
            <animate attributeName="stroke-opacity" values="0;1;0" dur="4s" begin="2s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4 text-neuro-cyan hover:text-neuro-cyan/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToDashboard}
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 tracking-wide">
                {t.fieldGuide}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t.operatorDossier.replace("Operator", `Operator`)} <span className="text-neuro-cyan font-mono">{callsign}</span>
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-neuro-cyan">{unlockedTraits.length}</div>
                <div className="text-xs text-muted-foreground">{t.traitsUnlocked}</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <div className="text-3xl font-bold text-emerald-500">{missionLogs.length}</div>
                <div className="text-xs text-muted-foreground">Mission Insights</div>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <div className="text-3xl font-bold text-neuro-purple">{evolution.length}</div>
                <div className="text-xs text-muted-foreground">{t.evolutionEvents}</div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 mb-8 gap-1">
            <TabsTrigger value="identity" className="text-xs sm:text-sm">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Identity
            </TabsTrigger>
            <TabsTrigger value="missions" className="text-xs sm:text-sm">
              <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Missions
            </TabsTrigger>
            <TabsTrigger value="traits" className="text-xs sm:text-sm">{t.traits}</TabsTrigger>
            <TabsTrigger value="shadows" className="text-xs sm:text-sm">{t.shadows}</TabsTrigger>
            <TabsTrigger value="superpowers" className="text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {t.powers}
            </TabsTrigger>
            <TabsTrigger value="evolution" className="text-xs sm:text-sm">{t.timeline}</TabsTrigger>
            <TabsTrigger value="dossier" className="text-xs sm:text-sm">
              <FileDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Dossier
            </TabsTrigger>
          </TabsList>

          {/* Identity Triad Tab */}
          <TabsContent value="identity" className="space-y-6">
            <Card className="border-neuro-cyan/30 bg-gradient-to-br from-neuro-cyan/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-6 w-6 text-neuro-cyan" />
                  IDENTITY TRIAD
                  <Badge
                    variant="outline"
                    className="ml-auto font-mono text-[10px] sm:text-xs tracking-wider px-1.5 py-0 h-5 border-neuro-purple/50 bg-neuro-purple/10 text-neuro-purple"
                  >
                    RANK · {rank.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your cognitive signature within the NeuroVerse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* PRIMARY ARCHETYPE */}
                  <div className="p-6 rounded-lg border border-neuro-cyan/50 bg-neuro-cyan/5 text-center">
                    <div className="text-xs font-semibold text-neuro-cyan mb-2">PRIMARY</div>
                    <div className="text-2xl font-bold text-neuro-cyan uppercase tracking-wide">
                      {primaryArchetype || "Not Assigned"}
                    </div>
                  </div>
                  {/* SHADOW ARCHETYPE */}
                  <div className="p-6 rounded-lg border border-amber-500/50 bg-amber-500/5 text-center">
                    <div className="text-xs font-semibold text-amber-500 mb-2">SHADOW</div>
                    <div className="text-2xl font-bold text-amber-500 uppercase tracking-wide">
                      {shadowArchetype || "Not Assigned"}
                    </div>
                  </div>
                  {/* RISING ARCHETYPE */}
                  <div className="p-6 rounded-lg border border-neuro-purple/50 bg-neuro-purple/5 text-center">
                    <div className="text-xs font-semibold text-neuro-purple mb-2">RISING</div>
                    <div className="text-2xl font-bold text-neuro-purple uppercase tracking-wide">
                      {risingArchetype || "Not Assigned"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mission Insights Tab */}
          <TabsContent value="missions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-emerald-500" />
                  MISSION INSIGHTS
                </CardTitle>
                <CardDescription>
                  Compiled cognitive patterns and growth signals from your training arc
                </CardDescription>
              </CardHeader>
              <CardContent>
                {missionLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Complete missions to see your cognitive insights compile here.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {/* View Toggle Buttons */}
                    <div className="flex gap-2 pb-4 border-b border-border/30">
                      <Button
                        variant={viewMode === "logs" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("logs")}
                        className="flex-1 sm:flex-none"
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Mission Logs
                      </Button>
                      <Button
                        variant={viewMode === "visualizations" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("visualizations")}
                        className="flex-1 sm:flex-none"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Visualizations
                      </Button>
                    </div>

                    {viewMode === "logs" ? (
                      <div className="space-y-6">
                    {/* Search and Filter UI */}
                    <div className="space-y-4 pb-4 border-b border-border/30">
                      {/* Export and Filter Controls */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          FILTER & EXPORT
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportAsJSON}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            JSON
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportAsMarkdown}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Markdown
                          </Button>
                        </div>
                      </div>

                      {/* Search and Sort Row */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search missions by title or insights..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="pl-9 bg-card/50"
                          />
                        </div>

                        {/* Sort Controls */}
                        <div className="flex gap-2">
                          <Select value={sortBy} onValueChange={(value: "mission" | "timestamp" | "signals") => setSortBy(value)}>
                            <SelectTrigger className="w-[160px] bg-card/50">
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mission">
                                <div className="flex items-center gap-2">
                                  <Brain className="h-3 w-3" />
                                  Mission Number
                                </div>
                              </SelectItem>
                              <SelectItem value="timestamp">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  Timestamp
                                </div>
                              </SelectItem>
                              <SelectItem value="signals">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3 w-3" />
                                  Signal Count
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleSortDirection}
                            className="bg-card/50"
                            title={sortDirection === "asc" ? "Ascending" : "Descending"}
                          >
                            {sortDirection === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Filter Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                            <Filter className="h-4 w-4" />
                            FILTER BY SIGNALS
                          </div>
                          {hasActiveFilters && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllFilters}
                              className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Clear All
                            </Button>
                          )}
                        </div>

                        {/* Trait Signal Filters */}
                        {allTraitSignals.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-neuro-cyan mb-2 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Trait Signals
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {allTraitSignals.map((signal) => (
                                <Badge
                                  key={signal}
                                  variant="outline"
                                  className={`cursor-pointer transition-all text-xs ${
                                    selectedTraitFilters.includes(signal)
                                      ? "bg-neuro-cyan/30 text-neuro-cyan border-neuro-cyan/50"
                                      : "hover:bg-neuro-cyan/10 hover:border-neuro-cyan/30"
                                  }`}
                                  onClick={() => toggleTraitFilter(signal)}
                                >
                                  {signal.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shadow Signal Filters */}
                        {allShadowSignals.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Shadow Signals
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {allShadowSignals.map((signal) => (
                                <Badge
                                  key={signal}
                                  variant="outline"
                                  className={`cursor-pointer transition-all text-xs ${
                                    selectedShadowFilters.includes(signal)
                                      ? "bg-amber-500/30 text-amber-500 border-amber-500/50"
                                      : "hover:bg-amber-500/10 hover:border-amber-500/30"
                                  }`}
                                  onClick={() => toggleShadowFilter(signal)}
                                >
                                  {signal.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Power Signal Filters */}
                        {allPowerSignals.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-emerald-500 mb-2 flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              Power Signals
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {allPowerSignals.map((signal) => (
                                <Badge
                                  key={signal}
                                  variant="outline"
                                  className={`cursor-pointer transition-all text-xs ${
                                    selectedPowerFilters.includes(signal)
                                      ? "bg-emerald-500/30 text-emerald-500 border-emerald-500/50"
                                      : "hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                  }`}
                                  onClick={() => togglePowerFilter(signal)}
                                >
                                  {signal.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Filter and Sort Results Summary */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {hasActiveFilters && (
                          <div>
                            Showing <span className="text-foreground font-semibold">{filteredMissionLogs.length}</span> of <span className="font-semibold">{missionLogs.length}</span> missions
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ArrowUpDown className="h-3 w-3" />
                          Sorted by {sortBy === "mission" ? "Mission Number" : sortBy === "timestamp" ? "Timestamp" : "Signal Count"} 
                          <span className="text-foreground">({sortDirection === "asc" ? "ascending" : "descending"})</span>
                        </div>
                      </div>
                    </div>

                    {/* Mission Log Cards */}
                    {filteredMissionLogs.length === 0 ? (
                      <div className="text-center py-8">
                        <Filter className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                          No missions match your current filters.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="mt-2"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedMissionLogs.map((log) => (
                      <Collapsible key={log.lessonId}>
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                          {/* COLLAPSED HEADER */}
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 bg-card/30 hover:bg-card/50 transition-colors">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge variant="outline" className="text-neuro-cyan border-neuro-cyan/50 shrink-0">
                                  Mission {log.lessonId}
                                </Badge>
                                <span className="font-medium text-foreground truncate">{log.lessonTitle}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {/* Signal indicator badges */}
                                {log.traitSignals.length > 0 && (
                                  <Badge className="bg-neuro-cyan/20 text-neuro-cyan text-xs">
                                    {log.traitSignals.length}
                                  </Badge>
                                )}
                                {log.shadowSignals.length > 0 && (
                                  <Badge className="bg-amber-500/20 text-amber-500 text-xs">
                                    {log.shadowSignals.length}
                                  </Badge>
                                )}
                                {log.powerSignals.length > 0 && (
                                  <Badge className="bg-emerald-500/20 text-emerald-500 text-xs">
                                    {log.powerSignals.length}
                                  </Badge>
                                )}
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          
                          {/* EXPANDED CONTENT */}
                          <CollapsibleContent>
                            <div className="p-4 space-y-4 border-t border-border/30">
                              {/* INSIGHT SUMMARY */}
                              <div>
                                <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  OPERATOR REFLECTIONS
                                </div>
                                <p className="text-sm text-foreground/80 italic">
                                  "{log.insightSummary}"
                                </p>
                              </div>
                              
                              {/* PATTERNS */}
                              {log.patterns.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                    <GitBranch className="h-3 w-3" />
                                    EXTRACTED THEMES
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {log.patterns.map((pattern, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {pattern}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* TRAIT SIGNALS */}
                              {log.traitSignals.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-neuro-cyan mb-2 flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    TRAIT SIGNALS
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {log.traitSignals.map((signal, idx) => (
                                      <Badge key={idx} className="bg-neuro-cyan/20 text-neuro-cyan text-xs">
                                        {signal.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* SHADOW SIGNALS */}
                              {log.shadowSignals.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-amber-500 mb-2 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    SHADOW SIGNALS
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {log.shadowSignals.map((signal, idx) => (
                                      <Badge key={idx} className="bg-amber-500/20 text-amber-500 text-xs">
                                        {signal.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* POWER SIGNALS */}
                              {log.powerSignals.length > 0 && (
                                <div>
                                  <div className="text-xs font-semibold text-emerald-500 mb-2 flex items-center gap-1">
                                    <Flame className="h-3 w-3" />
                                    POWER SIGNALS
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {log.powerSignals.map((signal, idx) => (
                                      <Badge key={idx} className="bg-emerald-500/20 text-emerald-500 text-xs">
                                        {signal.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* TIMESTAMP */}
                              <div className="text-xs text-muted-foreground flex items-center gap-1 pt-2 border-t border-border/30">
                                <Clock className="h-3 w-3" />
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Visualization Dashboard */
                <div className="space-y-6">
                  {/* Signal Frequency Trends Area Chart */}
                  <Card className="border-neuro-cyan/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <LineChartIcon className="h-5 w-5 text-neuro-cyan" />
                        SIGNAL FREQUENCY TRENDS
                      </CardTitle>
                      <CardDescription>
                        Cumulative signal detection across your training arc
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={signalTrendConfig} className="h-[300px] w-full">
                        <AreaChart data={getSignalTrendData()}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="mission" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="traits" 
                            stackId="1" 
                            stroke="hsl(187 100% 42%)" 
                            fill="hsl(187 100% 42% / 0.3)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="shadows" 
                            stackId="1" 
                            stroke="hsl(38 92% 50%)" 
                            fill="hsl(38 92% 50% / 0.3)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="powers" 
                            stackId="1" 
                            stroke="hsl(160 84% 39%)" 
                            fill="hsl(160 84% 39% / 0.3)" 
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Two-column chart layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Per-Mission Bar Chart */}
                    <Card className="border-neuro-purple/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <BarChart3 className="h-5 w-5 text-neuro-purple" />
                          PER-MISSION SIGNALS
                        </CardTitle>
                        <CardDescription>
                          Signal detection breakdown per mission
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={signalTrendConfig} className="h-[250px] w-full">
                          <BarChart data={getPerMissionSignalData()}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="mission" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="traits" stackId="a" fill="hsl(187 100% 42%)" />
                            <Bar dataKey="shadows" stackId="a" fill="hsl(38 92% 50%)" />
                            <Bar dataKey="powers" stackId="a" fill="hsl(160 84% 39%)" />
                          </BarChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Signal Distribution Pie Chart */}
                    <Card className="border-emerald-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <PieChartIcon className="h-5 w-5 text-emerald-500" />
                          SIGNAL DISTRIBUTION
                        </CardTitle>
                        <CardDescription>
                          Overall trait/shadow/power signal breakdown
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={signalTrendConfig} className="h-[250px] w-full">
                          <PieChart>
                            <Pie
                              data={getSignalDistributionData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getSignalDistributionData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                          </PieChart>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pattern Evolution Chart */}
                  <Card className="border-amber-500/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <GitBranch className="h-5 w-5 text-amber-500" />
                        PATTERN EVOLUTION
                      </CardTitle>
                      <CardDescription>
                        Top cognitive themes detected across your training
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer 
                        config={{ pattern: { label: "Occurrences", color: "hsl(38 92% 50%)" } }} 
                        className="h-[300px] w-full"
                      >
                        <BarChart data={getPatternEvolutionData()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis 
                            dataKey="pattern" 
                            type="category" 
                            width={150} 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={11}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
              )}
              </CardContent>
            </Card>
            
            {/* AGGREGATE SIGNALS SUMMARY CARD */}
            {missionLogs.length > 0 && (
              <Card className="border-neuro-purple/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-neuro-purple" />
                    PATTERNS & SIGNALS AGGREGATE
                  </CardTitle>
                  <CardDescription>
                    Cumulative cognitive signatures across all completed missions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Trait Signal Frequency */}
                    <div className="p-4 rounded-lg border border-neuro-cyan/30 bg-neuro-cyan/5">
                      <div className="text-xs font-semibold text-neuro-cyan mb-3">TRAIT SIGNAL FREQUENCY</div>
                      {(() => {
                        const freq: Record<string, number> = {};
                        missionLogs.forEach(log => {
                          log.traitSignals.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
                        });
                        const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
                        return entries.length > 0 ? entries.map(([signal, count]) => (
                          <div key={signal} className="flex justify-between text-sm mb-1">
                            <span className="text-foreground/80">{signal.replace(/_/g, " ")}</span>
                            <span className="text-neuro-cyan font-mono">{count}x</span>
                          </div>
                        )) : <p className="text-xs text-muted-foreground">No trait signals detected yet</p>;
                      })()}
                    </div>
                    
                    {/* Shadow Signal Frequency */}
                    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <div className="text-xs font-semibold text-amber-500 mb-3">SHADOW SIGNAL FREQUENCY</div>
                      {(() => {
                        const freq: Record<string, number> = {};
                        missionLogs.forEach(log => {
                          log.shadowSignals.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
                        });
                        const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
                        return entries.length > 0 ? entries.map(([signal, count]) => (
                          <div key={signal} className="flex justify-between text-sm mb-1">
                            <span className="text-foreground/80">{signal.replace(/_/g, " ")}</span>
                            <span className="text-amber-500 font-mono">{count}x</span>
                          </div>
                        )) : <p className="text-xs text-muted-foreground">No shadow signals detected yet</p>;
                      })()}
                    </div>
                    
                    {/* Power Signal Frequency */}
                    <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <div className="text-xs font-semibold text-emerald-500 mb-3">POWER SIGNAL FREQUENCY</div>
                      {(() => {
                        const freq: Record<string, number> = {};
                        missionLogs.forEach(log => {
                          log.powerSignals.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
                        });
                        const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
                        return entries.length > 0 ? entries.map(([signal, count]) => (
                          <div key={signal} className="flex justify-between text-sm mb-1">
                            <span className="text-foreground/80">{signal.replace(/_/g, " ")}</span>
                            <span className="text-emerald-500 font-mono">{count}x</span>
                          </div>
                        )) : <p className="text-xs text-muted-foreground">No power signals detected yet</p>;
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Core Traits Tab */}
          <TabsContent value="traits" className="space-y-6">
            {unlockedTraits.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Unlock className="h-6 w-6 text-neuro-cyan" />
                  {t.unlockedTraits}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unlockedTraits.map((trait) => {
                    const definition = getTraitDefinition(trait.trait_tag);
                    if (!definition) return null;

                    return (
                      <Card 
                        key={trait.trait_tag}
                        className="border-neuro-cyan/50 bg-card/50 backdrop-blur-sm hover:border-neuro-cyan transition-all duration-300 animate-fade-in"
                        style={{
                          boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)',
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-neuro-cyan flex items-center gap-2">
                              <Zap className="h-5 w-5" />
                              {definition.name}
                            </CardTitle>
                            <Badge variant="outline" className="border-neuro-cyan/50 text-neuro-cyan">
                              {t.active}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm">
                            {definition.definition}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Progress Bar */}
                            <div>
                              <div className="flex justify-between text-xs mb-2">
                                <span className="text-muted-foreground">{t.completion}</span>
                                <span className="text-neuro-cyan font-mono">{trait.completionPercent}%</span>
                              </div>
                              <Progress value={trait.completionPercent} className="h-2" />
                            </div>

                            {/* Superpower */}
                            {trait.superpower_revealed ? (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <div className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {t.superpowerActive}
                                </div>
                                <div className="text-sm text-emerald-400 flex items-start gap-2">
                                  <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {definition.superpower}
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-card/30 border border-border/30 opacity-60">
                                <div className="text-xs font-semibold text-muted-foreground mb-1">{t.superpowerLocked}</div>
                                <div className="text-xs text-muted-foreground">{t.superpowerLockMessage}</div>
                              </div>
                            )}

                            {/* Shadow */}
                            {trait.shadow_revealed && (
                              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {t.shadowRevealed}
                                </div>
                                <div className="text-sm text-amber-400/90 flex items-start gap-2">
                                  <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {definition.shadow}
                                </div>
                              </div>
                            )}

                            {/* Subskills */}
                            <div>
                              <div className="text-xs font-semibold text-muted-foreground mb-2">
                                SUBSKILLS ({trait.subskills_unlocked.length}/{definition.subskills.length})
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {definition.subskills.map((subskill) => (
                                  <Badge
                                    key={subskill}
                                    variant={trait.subskills_unlocked.includes(subskill) ? "default" : "outline"}
                                    className={
                                      trait.subskills_unlocked.includes(subskill)
                                        ? "text-xs bg-neuro-purple/20 text-neuro-purple border-neuro-purple/50"
                                        : "text-xs opacity-50"
                                    }
                                  >
                                    {subskill.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {lockedTraits.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                  {t.lockedTraits}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lockedTraits.map((trait) => {
                    const definition = getTraitDefinition(trait.trait_tag);
                    if (!definition) return null;

                    return (
                      <Card 
                        key={trait.trait_tag}
                        className="border-border/50 bg-card/20 backdrop-blur-sm opacity-60"
                      >
                        <CardHeader>
                          <CardTitle className="text-muted-foreground flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            {definition.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {t.completeMissionsToUnlock}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground italic">
                            "{t.pathRevealsQuote}"
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {unlockedTraits.length === 0 && lockedTraits.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    {t.noTraitsMessage}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Subskills Tab */}
          <TabsContent value="subskills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-6 w-6 text-neuro-purple" />
                  {t.subskillBreakdown}
                </CardTitle>
                <CardDescription>
                  {t.subskillsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unlockedTraits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t.unlockTraitsMessage}
                  </p>
                ) : (
                  <div className="space-y-6">
                    {unlockedTraits.map((trait) => {
                      const definition = getTraitDefinition(trait.trait_tag);
                      if (!definition) return null;

                      return (
                        <div key={trait.trait_tag} className="space-y-3">
                          <h3 className="font-semibold text-lg text-neuro-cyan">{definition.name}</h3>
                          <div className="grid gap-2">
                            {definition.subskills.map((subskill) => {
                              const isUnlocked = trait.subskills_unlocked.includes(subskill);
                              return (
                                <div
                                  key={subskill}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                    isUnlocked
                                      ? "border-neuro-purple/50 bg-neuro-purple/5"
                                      : "border-border/30 bg-card/20 opacity-50"
                                  }`}
                                >
                                  {isUnlocked ? (
                                    <Unlock className="h-4 w-4 text-neuro-purple" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm font-medium">
                                    {subskill.replace(/_/g, " ").toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <Separator className="mt-4" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shadows Tab */}
          <TabsContent value="shadows" className="space-y-6">
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-6 w-6 text-amber-500" />
                  {t.shadows}
                </CardTitle>
                <CardDescription>
                  {t.shadowsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unlockedTraits.filter(t => t.shadow_revealed).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t.noShadowsMessage}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {unlockedTraits
                      .filter(t => t.shadow_revealed)
                      .map((trait) => {
                        const definition = getTraitDefinition(trait.trait_tag);
                        if (!definition) return null;

                        return (
                          <div
                            key={trait.trait_tag}
                            className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5"
                          >
                            <h3 className="font-semibold text-amber-500 mb-2">{definition.name}</h3>
                            <p className="text-sm text-foreground/80">{definition.shadow}</p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Superpowers Tab */}
          <TabsContent value="superpowers" className="space-y-6">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-emerald-500 animate-pulse" />
                  {t.powers.toUpperCase()}
                </CardTitle>
                <CardDescription>
                  {t.superpowersDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {superpowerTraits.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground">
                      {t.noSuperpowersMessage}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {superpowerTraits.map((trait) => {
                      const definition = getTraitDefinition(trait.trait_tag);
                      if (!definition) return null;

                      return (
                        <div
                          key={trait.trait_tag}
                          className="relative p-6 rounded-lg border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-transparent overflow-hidden group hover:border-emerald-500 transition-all"
                          style={{
                            boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 animate-pulse-slow" />
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="text-sm font-mono text-emerald-400 mb-1">
                                  {t.superpowerActive}
                                </div>
                                <h3 className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
                                  <Target className="h-6 w-6" />
                                  {definition.name}
                                </h3>
                              </div>
                              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                                <Zap className="h-6 w-6 text-emerald-500 animate-pulse" />
                              </div>
                            </div>

                            <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 mb-4">
                              <p className="text-lg text-emerald-400 font-medium">
                                {definition.superpower}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1">{t.subskills.toUpperCase()}</div>
                                <div className="text-lg font-bold text-neuro-purple">
                                  {trait.subskills_unlocked.length}/{definition.subskills.length}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg bg-card/50 border border-border/50">
                                <div className="text-xs text-muted-foreground mb-1">{t.completion}</div>
                                <div className="text-lg font-bold text-emerald-500">
                                  {trait.completionPercent}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolution Timeline Tab */}
          <TabsContent value="evolution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-neuro-cyan" />
                  {t.evolutionTimeline}
                </CardTitle>
                <CardDescription>
                  {t.evolutionDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evolution.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {t.noEvolutionMessage}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {evolution.map((entry) => {
                      const definition = entry.trait_tag ? getTraitDefinition(entry.trait_tag) : null;
                      const insightIcon = entry.insight_type === "trait_unlock" ? Unlock :
                                         entry.insight_type === "subskill_unlock" ? Layers :
                                         entry.insight_type === "shadow_reveal" ? Eye : Zap;
                      const Icon = insightIcon;
                      const iconColor = entry.insight_type === "trait_unlock" ? "text-neuro-cyan" :
                                       entry.insight_type === "subskill_unlock" ? "text-neuro-purple" :
                                       entry.insight_type === "shadow_reveal" ? "text-amber-500" : "text-emerald-500";
                      
                      return (
                        <div
                          key={entry.id}
                          className="flex gap-4 p-4 rounded-lg border border-border/50 bg-card/30 hover:border-neuro-cyan/50 transition-all"
                        >
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full bg-current/10 border border-current/30 flex items-center justify-center ${iconColor}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-semibold text-foreground">
                                  {definition ? definition.name : "Evolution Event"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.insight_type?.replace(/_/g, " ").toUpperCase() || "EVENT"}
                                  {entry.subskill_unlocked && ` · ${entry.subskill_unlocked.replace(/_/g, " ")}`}
                                </div>
                               </div>
                               {entry.lesson_id && (
                                 <Badge variant="outline" className="text-xs">
                                   {t.lessonPrefix} {entry.lesson_id}
                                 </Badge>
                               )}
                            </div>
                            {entry.insight_text && (
                              <p className="text-sm text-foreground/70 italic">"{entry.insight_text}"</p>
                            )}
                            {(entry.created_at || entry.unlocked_at) && (
                              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(entry.created_at || entry.unlocked_at!).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Graduation Dossier Tab */}
          <TabsContent value="dossier">
            <GraduationDossierTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
