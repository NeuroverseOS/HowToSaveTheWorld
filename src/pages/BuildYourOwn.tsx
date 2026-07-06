import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, FileSpreadsheet, Bot, Shield, Rocket } from "lucide-react";

const REPO_URL = "https://github.com/NeuroverseOS/HowToSaveTheWorld";
const GOVERNANCE_URL = "https://github.com/NeuroverseOS/Neuroverseos-governance";

const BuildYourOwn = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to base
        </button>

        <header className="space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neuro-cyan">
            Open Platform Protocol
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            Have a course you want AI to teach?
            <span className="block text-neuro-cyan mt-2">Everything you need is right here.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Everything you've experienced here — the missions, the AI instructor, the ranks,
            the dossier — is an open-source engine running one curriculum. Yours could be next:
            any company, community, or DAO can run an academy on the curriculum it already has.
            Hand Claude your material in any form, and it will build you a course that runs
            on this exact platform — taught by each learner's own AI, under rules you declare,
            with data that stays theirs.
          </p>
          <p className="text-sm text-muted-foreground">
            Teacher or professor who's never touched a repo?{" "}
            <Link to="/educators" className="text-amber-500 dark:text-amber-400 hover:underline">
              Start with the educator walkthrough
            </Link>{" "}
            — it assumes nothing and explains every click.
          </p>
        </header>

        <div className="space-y-6">
          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <FileSpreadsheet className="h-8 w-8 text-neuro-green" />
            <h2 className="text-xl font-bold">1. Your curriculum, one spreadsheet</h2>
            <p className="text-muted-foreground leading-relaxed">
              The entire course is one file — one row per lesson. Download the template,
              or skip the formatting entirely and let AI do it for you in step 2.
            </p>
            <a
              href="/curriculum-template.csv"
              download
              className="inline-flex items-center gap-1 text-sm text-neuro-cyan hover:underline"
            >
              Download the curriculum template <ArrowRight className="h-3 w-3" />
            </a>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <Bot className="h-8 w-8 text-neuro-purple" />
            <h2 className="text-xl font-bold">2. Hook it up to Claude</h2>
            <p className="text-muted-foreground leading-relaxed">
              Fork the repo, open Claude, and paste in the Course Builder Prompt along with
              your raw material — a syllabus, workshop notes, a book outline, anything.
              It converts your curriculum into finished lessons, writes your instructor's
              opening and closing lines in a voice you choose, and outputs the exact file
              this platform runs on.
            </p>
            <a
              href={`${REPO_URL}/blob/main/docs/COURSE_BUILDER_PROMPT.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-neuro-cyan hover:underline"
            >
              Get the Course Builder Prompt <ArrowRight className="h-3 w-3" />
            </a>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <Shield className="h-8 w-8 text-neuro-cyan" />
            <h2 className="text-xl font-bold">3. Govern your instructor</h2>
            <p className="text-muted-foreground leading-relaxed">
              An AI instructor without declared rules is just a chatbot in a costume.
              Declare what your instructor may see, say, and never do — as a written
              constitution your learners can read before they connect their AI. The
              NeuroVerse Governance engine turns those rules into runtime enforcement.
            </p>
            <a
              href={GOVERNANCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-neuro-cyan hover:underline"
            >
              NeuroVerse Governance on GitHub <ArrowRight className="h-3 w-3" />
            </a>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <Rocket className="h-8 w-8 text-critical" />
            <h2 className="text-xl font-bold">4. Deploy for (almost) nothing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Free database tier, free hosting tier, and your learners bring their own AI —
              so your running cost is a domain name. Your community keeps its data on
              infrastructure it controls, and every teacher you link to keeps their credit.
            </p>
            <a
              href={`${REPO_URL}/blob/main/docs/BUILD_YOUR_OWN_COURSE.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-neuro-cyan hover:underline"
            >
              Read the full guide <ArrowRight className="h-3 w-3" />
            </a>
          </Card>
        </div>

        <footer className="text-center space-y-6 pt-4">
          <p className="text-muted-foreground">
            The future will be decentralized only if we build it — and teach it.
          </p>
          <Button
            onClick={() => window.open(REPO_URL, "_blank", "noopener,noreferrer")}
            variant="critical"
            size="lg"
          >
            Fork the platform <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Platform code is MIT licensed. The How to Save the World curriculum and NeuroVerse
            narrative universe remain the work of their authors — bring your own story.
          </p>
          <p className="text-sm text-muted-foreground">
            Want to build more with AI? Explore the NeuroVerse tools at{" "}
            <a
              href="https://www.neuroverseos.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neuro-cyan hover:underline"
            >
              neuroverseos.com
            </a>
          </p>
          <Link to="/" className="block text-xs text-muted-foreground hover:text-primary hover:underline">
            Return to How to Save the World
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default BuildYourOwn;
