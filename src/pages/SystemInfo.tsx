import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loadACEBox08, type ACEFile, type ACEEntry } from "@/lib/ace-loader";

export default function SystemInfo() {
  const navigate = useNavigate();
  const [aceData, setAceData] = useState<Map<string, ACEFile> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadACEBox08()
      .then(data => {
        setAceData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load ACE Box 08:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-pulse text-4xl">📚</div>
          <p className="text-muted-foreground">Loading System Archive...</p>
        </div>
      </div>
    );
  }

  if (!aceData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Archive Unavailable</CardTitle>
            <CardDescription>Failed to load system documentation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const echelonData = aceData.get('how_echelon_works');
  const neuroverseData = aceData.get('how_neuroverse_works');
  const usageData = aceData.get('how_to_use');
  const troubleshootData = aceData.get('troubleshooting');
  const faqData = aceData.get('faq');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">System Archive</h1>
            </div>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:block">
            ACE BOX 08
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">System Literacy</h2>
          <p className="text-muted-foreground">
            How Echelon works. How the NeuroVerse works. How you work with it.
          </p>
        </div>

        <Tabs defaultValue="echelon" className="space-y-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="echelon">Echelon</TabsTrigger>
            <TabsTrigger value="neuroverse">NeuroVerse</TabsTrigger>
            <TabsTrigger value="usage">How To Use</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* How Echelon Works */}
          <TabsContent value="echelon" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{echelonData?.title}</CardTitle>
                <CardDescription>
                  Understanding your operational intelligence layer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {echelonData?.entries.map((entry, idx) => (
                    <AccordionItem key={entry.id} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {entry.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {entry.body}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* How NeuroVerse Works */}
          <TabsContent value="neuroverse" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{neuroverseData?.title}</CardTitle>
                <CardDescription>
                  The architecture of real-world coordination systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {neuroverseData?.entries.map((entry, idx) => (
                    <AccordionItem key={entry.id} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {entry.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {entry.body}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* How To Use */}
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{usageData?.title}</CardTitle>
                <CardDescription>
                  Getting the most from Echelon and the NeuroVerse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {usageData?.entries.map((entry, idx) => (
                    <AccordionItem key={entry.id} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {entry.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {entry.body}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Troubleshooting */}
          <TabsContent value="troubleshooting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{troubleshootData?.title}</CardTitle>
                <CardDescription>
                  Common issues and how to resolve them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {troubleshootData?.entries.map((entry, idx) => (
                    <AccordionItem key={entry.id} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {entry.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {entry.body}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{faqData?.title}</CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqData?.entries.map((entry) => (
                    <div key={entry.id} className="space-y-2">
                      <h3 className="font-semibold text-foreground">
                        {entry.q}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {entry.a}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>NeuroVerse OS — System Literacy Archive</p>
          <p className="mt-2">Two Minds. One Mission. Save the World.</p>
        </div>
      </div>
    </div>
  );
}
