import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2, Upload, FileText, Download, AlertTriangle, ArrowLeft, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseLessonsFromExcel } from "@/lib/parse-lessons-from-excel";
import { LessonImportSchema } from "@/lib/lesson-import-schema";
import type { LessonImport } from "@/lib/lesson-import-schema";
import { toast } from "@/hooks/use-toast";
import { clearLessonCache } from "@/lib/lesson-loader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ImportStatus {
  phase: 'idle' | 'parsing' | 'validating' | 'importing' | 'complete' | 'error';
  progress: number;
  message: string;
  totalLessons: number;
  importedLessons: number;
  errors: Array<{ lesson: number; error: string }>;
  duplicates?: number[];
}

interface LessonCounts {
  supabase: number;
  local: number;
  loading: boolean;
}

interface PipelineStatus {
  supabaseCount: number;
  supabaseVersion: number;
  localCount: number;
  localVersion: number;
  cacheCount: number;
  cacheVersion: number;
  inSync: boolean;
}

export default function AdminImportLessons() {
  const navigate = useNavigate();
  const [lessonCounts, setLessonCounts] = useState<LessonCounts>({
    supabase: 0,
    local: 0,
    loading: true,
  });
  
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>({
    supabaseCount: 0,
    supabaseVersion: 0,
    localCount: 0,
    localVersion: 0,
    cacheCount: 0,
    cacheVersion: 0,
    inSync: false,
  });
  
  const [excelData, setExcelData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>({
    phase: 'idle',
    progress: 0,
    message: '',
    totalLessons: 0,
    importedLessons: 0,
    errors: [],
  });

  // Fetch lesson counts and pipeline status on mount
  useEffect(() => {
    fetchLessonCounts();
    checkPipelineStatus();
  }, []);

  const fetchLessonCounts = async () => {
    try {
      // Fetch Supabase count
      const { count: supabaseCount, error: supabaseError } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      if (supabaseError) throw supabaseError;

      // Fetch local JSON count
      const response = await fetch('/lessons.json');
      const localLessons = await response.json();

      setLessonCounts({
        supabase: supabaseCount || 0,
        local: Array.isArray(localLessons) ? localLessons.length : 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching lesson counts:', error);
      setLessonCounts(prev => ({ ...prev, loading: false }));
    }
  };

  const checkPipelineStatus = async () => {
    try {
      // Supabase status
      const { data: metadata } = await supabase
        .from('lesson_metadata')
        .select('lesson_version, total_lessons')
        .single();

      // Local JSON status
      const localResponse = await fetch('/lessons.json').catch(() => null);
      const local = localResponse ? await localResponse.json() : null;
      const localLessons = Array.isArray(local) ? local : (local?.lessons || []);
      const localVersion = local?.version || 0;

      // Cache status
      const cacheVersion = localStorage.getItem('neuroverse_lessons_version');
      const cached = localStorage.getItem('neuroverse_lessons_cache');
      const cachedLessons = cached ? JSON.parse(cached) : [];

      setPipelineStatus({
        supabaseCount: metadata?.total_lessons || 0,
        supabaseVersion: metadata?.lesson_version || 0,
        localCount: localLessons.length,
        localVersion: localVersion,
        cacheCount: cachedLessons.length,
        cacheVersion: parseInt(cacheVersion || '0'),
        inSync: metadata?.lesson_version === localVersion && localVersion > 0,
      });
    } catch (error) {
      console.error('Error checking pipeline status:', error);
    }
  };

  const handleFileRead = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setExcelData(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!excelData) {
      setStatus({
        phase: 'error',
        progress: 0,
        message: 'No Excel data provided. Please paste or upload the parsed Excel content.',
        totalLessons: 0,
        importedLessons: 0,
        errors: [{ lesson: 0, error: 'No Excel data provided' }],
      });
      return;
    }

    try {
      // Phase 1: Parse Excel data
      setStatus({
        phase: 'parsing',
        progress: 10,
        message: 'Parsing Excel spreadsheet data...',
        totalLessons: 0,
        importedLessons: 0,
        errors: [],
      });

      const lessons = parseLessonsFromExcel(excelData);

      if (lessons.length === 0) {
        throw new Error('No lessons found in the Excel data');
      }

      setStatus(prev => ({
        ...prev,
        progress: 20,
        totalLessons: lessons.length,
        message: `Found ${lessons.length} lessons. Checking for duplicates...`,
      }));

      // Phase 2: Check for duplicate lesson numbers
      const lessonNumberCounts = new Map<number, number>();
      lessons.forEach(lesson => {
        const count = lessonNumberCounts.get(lesson.lesson_number) || 0;
        lessonNumberCounts.set(lesson.lesson_number, count + 1);
      });

      const duplicates = Array.from(lessonNumberCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([num, _]) => num)
        .sort((a, b) => a - b);

      if (duplicates.length > 0) {
        setStatus({
          phase: 'error',
          progress: 0,
          message: `❌ Duplicate lesson numbers detected! Cannot import.`,
          totalLessons: lessons.length,
          importedLessons: 0,
          errors: duplicates.map(num => ({
            lesson: num,
            error: `Lesson ${num} appears ${lessonNumberCounts.get(num)} times in the spreadsheet`
          })),
          duplicates
        });
        return;
      }

      setStatus(prev => ({
        ...prev,
        progress: 25,
        message: `No duplicates found. Validating lesson data...`,
      }));

      // Phase 3: Validate all lessons
      setStatus(prev => ({ ...prev, phase: 'validating', progress: 30 }));
      
      const validatedLessons: LessonImport[] = [];
      const validationErrors: Array<{ lesson: number; error: string }> = [];

      for (const lesson of lessons) {
        try {
          const validated = LessonImportSchema.parse(lesson);
          validatedLessons.push(validated);
        } catch (error: any) {
          validationErrors.push({
            lesson: lesson.lesson_number,
            error: error.message,
          });
        }
      }

      if (validationErrors.length > 0) {
        setStatus(prev => ({
          ...prev,
          phase: 'error',
          message: `Validation failed for ${validationErrors.length} lessons`,
          errors: validationErrors,
        }));
        return;
      }

      // Phase 4: Delete existing lessons
      setStatus(prev => ({
        ...prev,
        phase: 'importing',
        progress: 40,
        message: 'Clearing existing lessons...',
      }));

      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .neq('id', 0); // Delete all

      if (deleteError) {
        throw new Error(`Failed to clear existing lessons: ${deleteError.message}`);
      }

      // Phase 5: Bulk insert lessons in batches
      setStatus(prev => ({
        ...prev,
        progress: 50,
        message: 'Importing lessons in batches...',
      }));

      const BATCH_SIZE = 10;
      const batches = [];
      
      for (let i = 0; i < validatedLessons.length; i += BATCH_SIZE) {
        batches.push(validatedLessons.slice(i, i + BATCH_SIZE));
      }

      let importedCount = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const { error: insertError } = await supabase
          .from('lessons')
          .insert(batch);

        if (insertError) {
          throw new Error(`Batch ${batchIndex + 1} failed: ${insertError.message}`);
        }

        importedCount += batch.length;
        const progress = 50 + ((importedCount / validatedLessons.length) * 45);

        setStatus(prev => ({
          ...prev,
          progress,
          importedLessons: importedCount,
          message: `Imported ${importedCount} of ${validatedLessons.length} lessons...`,
        }));

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Phase 6: Increment version
      const { error: versionError } = await supabase.rpc('increment_lesson_version');

      if (versionError) {
        console.error('Failed to increment version:', versionError);
      }

      // Fetch new version for display
      const { data: metadata } = await supabase
        .from('lesson_metadata')
        .select('lesson_version')
        .single();

      const newVersion = metadata?.lesson_version || 1;

      // Phase 7: Complete
      setStatus({
        phase: 'complete',
        progress: 100,
        message: `Successfully imported ${validatedLessons.length} lessons (version ${newVersion})!`,
        totalLessons: validatedLessons.length,
        importedLessons: validatedLessons.length,
        errors: [],
      });

      // Refresh counts and pipeline status
      fetchLessonCounts();
      checkPipelineStatus();

      toast({
        title: "Import Complete",
        description: `${validatedLessons.length} lessons imported (v${newVersion}). Cache will auto-update.`,
      });

    } catch (error: any) {
      console.error('Import error:', error);
      setStatus(prev => ({
        ...prev,
        phase: 'error',
        message: error.message || 'An unexpected error occurred',
        errors: [...prev.errors, { lesson: 0, error: error.message }],
      }));
    }
  };

  const handleExportToJSON = async () => {
    try {
      toast({
        title: "Exporting Lessons",
        description: "Fetching all lessons from Supabase...",
      });

      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .order('lesson_number', { ascending: true });

      if (error) throw error;

      if (!lessons || lessons.length === 0) {
        throw new Error('No lessons found in Supabase');
      }

      const jsonContent = JSON.stringify(lessons, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `lessons.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete!",
        description: `Downloaded lessons.json with ${lessons.length} lessons. Now replace /public/lessons.json with this file and republish.`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || 'Failed to export lessons',
        variant: "destructive",
      });
    }
  };


  const isOutOfSync = lessonCounts.supabase !== lessonCounts.local;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-neuro-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-neuro-cyan" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-neuro-cyan to-neuro-purple bg-clip-text text-transparent">
                Lesson Database Admin
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Pipeline Status Dashboard */}
          <Card className="border-neuro-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-neuro-cyan flex items-center gap-2">
                <Database className="h-5 w-5" />
                📡 Lesson Pipeline Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Supabase (Source of Truth):</span>
                  <span className="font-bold text-neuro-cyan">
                    {pipelineStatus.supabaseCount} lessons (v{pipelineStatus.supabaseVersion})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Local JSON (/public/lessons.json):</span>
                  <span className={pipelineStatus.localVersion === pipelineStatus.supabaseVersion ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                    {pipelineStatus.localCount} lessons (v{pipelineStatus.localVersion})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Browser Cache:</span>
                  <span className={pipelineStatus.cacheVersion === pipelineStatus.supabaseVersion ? 'text-green-500 font-bold' : 'text-yellow-500 font-bold'}>
                    {pipelineStatus.cacheCount} lessons (v{pipelineStatus.cacheVersion})
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pipeline Status:</span>
                  <Badge variant={pipelineStatus.inSync ? 'default' : 'destructive'}>
                    {pipelineStatus.inSync ? '✅ In Sync' : '⚠️ Out of Sync'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={checkPipelineStatus} 
                  variant="outline"
                  size="sm"
                >
                  Refresh Status
                </Button>
                <Button 
                  onClick={() => {
                    clearLessonCache();
                    toast({
                      title: "Cache Cleared",
                      description: "Browser cache cleared. Next load will fetch from Supabase.",
                    });
                    checkPipelineStatus();
                  }} 
                  variant="outline"
                  size="sm"
                >
                  Clear Cache
                </Button>
              </div>
              
              {pipelineStatus.supabaseVersion > pipelineStatus.cacheVersion && (
                <Alert className="mt-4 border-yellow-500/50 bg-yellow-950/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-200 text-xs">
                    <strong>Version Mismatch</strong> — Users' cached lessons will auto-update to v{pipelineStatus.supabaseVersion} on next app load.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: Import from Spreadsheet */}
            <Card className="border-neuro-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-neuro-purple flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Step 1: Import Spreadsheet → Supabase
                </CardTitle>
                <CardDescription>
                  Upload parsed lesson data from Excel to the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <FileText className="inline h-4 w-4 mr-2" />
                    Paste Parsed Excel Data:
                  </label>
                  <Textarea
                    value={excelData}
                    onChange={(e) => setExcelData(e.target.value)}
                    placeholder="Paste the entire parsed Excel markdown content here..."
                    className="min-h-[200px] font-mono text-xs"
                    disabled={['parsing', 'validating', 'importing'].includes(status.phase)}
                  />
                </div>

                <div className="text-center text-sm text-muted-foreground">— OR —</div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileRead}
                    className="hidden"
                    disabled={['parsing', 'validating', 'importing'].includes(status.phase)}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                    disabled={['parsing', 'validating', 'importing'].includes(status.phase)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Parsed Excel File
                  </Button>
                </div>

                {status.phase !== 'idle' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{status.message}</span>
                      {status.phase === 'complete' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {status.phase === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                      {['parsing', 'validating', 'importing'].includes(status.phase) && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                    </div>
                    <Progress value={status.progress} className="w-full" />
                    {status.totalLessons > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Progress: {status.importedLessons} / {status.totalLessons} lessons
                      </div>
                    )}
                  </div>
                )}

                {status.duplicates && status.duplicates.length > 0 && (
                  <Alert variant="destructive" className="border-red-500 bg-red-500/10">
                    <AlertDescription>
                      <div className="font-bold text-lg mb-3 flex items-center gap-2">
                        <XCircle className="h-6 w-6" />
                        ❌ Duplicate Lesson Numbers Detected!
                      </div>
                      <p className="mb-3 text-sm">
                        The following lesson numbers appear multiple times in your spreadsheet.
                        Each lesson_number must be unique. Please remove duplicates and try again.
                      </p>
                      <div className="bg-background/50 p-3 rounded-md">
                        <div className="font-semibold text-sm mb-2">Duplicated Lessons:</div>
                        <div className="flex flex-wrap gap-2">
                          {status.duplicates.map(num => (
                            <Badge key={num} variant="destructive" className="text-sm font-mono">
                              Lesson #{num}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        💡 Tip: Search your textarea for "|{status.duplicates[0]}|" to find the duplicate rows
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {status.errors.length > 0 && !status.duplicates && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <div className="font-semibold mb-2">Import Errors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {status.errors.slice(0, 3).map((err, idx) => (
                          <li key={idx} className="text-sm">
                            Lesson {err.lesson}: {err.error}
                          </li>
                        ))}
                        {status.errors.length > 3 && (
                          <li className="text-sm">... and {status.errors.length - 3} more errors</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleImport}
                  disabled={['parsing', 'validating', 'importing'].includes(status.phase)}
                  className="w-full bg-neuro-purple hover:bg-neuro-purple/90"
                  size="lg"
                >
                  {status.phase === 'idle' && (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Start Import
                    </>
                  )}
                  {['parsing', 'validating', 'importing'].includes(status.phase) && (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Importing...
                    </>
                  )}
                  {status.phase === 'complete' && 'Import Complete ✓'}
                  {status.phase === 'error' && 'Retry Import'}
                </Button>
              </CardContent>
            </Card>

            {/* RIGHT: Export to Local JSON */}
            <Card className="border-neuro-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-neuro-cyan flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Step 2: Export Supabase → Local JSON
                </CardTitle>
                <CardDescription>
                  Download all lessons as lessons.json for the PWA bundle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-neuro-cyan/30 bg-neuro-cyan/5">
                  <AlertDescription className="text-sm space-y-2">
                    <p className="font-medium">What this does:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                      <li>Fetches all {lessonCounts.supabase} lessons from Supabase</li>
                      <li>Formats them as clean JSON array</li>
                      <li>Downloads lessons.json to your computer</li>
                      <li>File size: ~250KB</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="p-4 rounded-lg border border-neuro-border bg-background/50 space-y-3">
                  <div className="text-sm font-medium">After downloading:</div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Replace <code className="text-neuro-cyan">/public/lessons.json</code> with downloaded file</li>
                    <li>Click <strong className="text-foreground">"Update"</strong> in Lovable's Publish dialog</li>
                    <li>Users will now have all {lessonCounts.supabase} lessons offline</li>
                  </ol>
                </div>

                <Button
                  onClick={handleExportToJSON}
                  className="w-full bg-neuro-cyan hover:bg-neuro-cyan/90 text-background"
                  size="lg"
                  disabled={lessonCounts.supabase === 0}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Export All Lessons to Local JSON
                </Button>

                {lessonCounts.supabase === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Import lessons first before exporting
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="border-neuro-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Complete Admin Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-neuro-purple/30 bg-neuro-purple/5">
                    <h4 className="font-semibold text-neuro-purple mb-2">Step 1: Import Spreadsheet → Supabase</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ Upload/paste parsed Excel data</li>
                      <li>✓ Validates and imports to database</li>
                      <li>✓ Run this when lesson content is updated</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border border-neuro-cyan/30 bg-neuro-cyan/5">
                    <h4 className="font-semibold text-neuro-cyan mb-2">Step 2: Export Supabase → Local JSON</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ Fetches all lessons from database</li>
                      <li>✓ Downloads lessons.json file (90 lessons)</li>
                      <li>✓ Run this after every import</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border border-neuro-pink/30 bg-neuro-pink/5">
                    <h4 className="font-semibold text-neuro-pink mb-2">Step 3: Replace Local Bundle</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ In Lovable: Replace <code className="text-neuro-cyan">/public/lessons.json</code></li>
                      <li>✓ Click "Update" in Publish dialog</li>
                      <li>✓ PWA now contains all 90 lessons</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border border-green-500/30 bg-green-950/20">
                    <h4 className="font-semibold text-green-400 mb-2">Step 4: Verify</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>✓ Status dashboard shows 90/90 ✓</li>
                      <li>✓ Test lesson navigation in app</li>
                      <li>✓ Confirm all lessons load correctly</li>
                    </ul>
                  </div>
                </div>

                <Alert className="mt-4 border-orange-500/30 bg-orange-950/10">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-200">
                    <strong>IMPORTANT:</strong> Regular users never see this page. This is admin-only infrastructure for maintaining the local-first lesson bundle.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}