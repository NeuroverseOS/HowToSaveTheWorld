import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Copy,
  MessageSquareText,
  FileSpreadsheet,
  Eye,
  Globe,
  ShieldCheck,
} from "lucide-react";

const REPO_URL = "https://github.com/NeuroverseOS/HowToSaveTheWorld";

// The walkthrough for people who teach but have never touched a repo.
// Every step is a real click or a real sentence to paste — no jargon
// left unexplained, no step that assumes prior comfort with code.
const Educators = () => {
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
            For Teachers, Professors & Trainers
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            Are you an educator?
            <span className="block text-neuro-cyan mt-2">
              You can build one of these. Yes, you.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Everything you just experienced — an AI mentor teaching a course,
            mission by mission, that can't skip ahead or spoil the ending — is
            an engine your course material can run on. You don't need to be
            technical. You need your material, a free afternoon, and an AI to
            do the technical part for you.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            One honest thing before we start: this lives in a{" "}
            <em>repository</em> ("repo") on GitHub, and repos scare people
            away. They scared the person who built this away, once. So here's
            the whole secret: <strong>a repo is just a folder with a
            history.</strong> You will never have to read the code inside it.
            Your AI reads it for you.
          </p>
        </header>

        <div className="space-y-6">
          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <GraduationCap className="h-8 w-8 text-neuro-green" />
            <h2 className="text-xl font-bold">What you need (all of it)</h2>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>
                Your course material, in whatever shape it's in — a syllabus,
                a slide deck, workshop notes, a book outline, a spreadsheet.
                Messy is fine.
              </li>
              <li>
                A free{" "}
                <a
                  href="https://github.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan hover:underline"
                >
                  GitHub account
                </a>{" "}
                (this is where your copy of the engine will live).
              </li>
              <li>
                A{" "}
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan hover:underline"
                >
                  Claude account
                </a>{" "}
                — Claude does the building. Other AIs work too, but the repo
                ships with instructions written for Claude.
              </li>
              <li>An afternoon. Really. Aim for three lessons, not ninety.</li>
            </ul>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <Copy className="h-8 w-8 text-neuro-purple" />
            <h2 className="text-xl font-bold">Step 1 — Make your own copy (one click)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Go to{" "}
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neuro-cyan hover:underline"
              >
                the engine on GitHub
              </a>{" "}
              and press the <strong>Fork</strong> button (top right). That's
              it. "Fork" means <em>make me my own copy</em>. Your copy is
              yours — you cannot break ours, and nothing you do in yours
              touches anyone else's course. There is no undo you'll ever need
              that isn't built in.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <MessageSquareText className="h-8 w-8 text-neuro-cyan" />
            <h2 className="text-xl font-bold">Step 2 — Point Claude at your copy and say this</h2>
            <p className="text-muted-foreground leading-relaxed">
              Open{" "}
              <a
                href="https://claude.ai/code"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neuro-cyan hover:underline"
              >
                Claude Code on the web
              </a>
              , connect your GitHub account when it asks, and choose your fork.
              Then paste this, word for word:
            </p>
            <blockquote className="border-l-2 border-neuro-cyan pl-4 py-2 font-mono text-sm text-foreground bg-muted/40 rounded-r">
              I'm an educator, not a programmer. Read CLAUDE.md and help me
              turn my course material into an academy on this engine.
              Interview me first — I want my course to have a story.
            </blockquote>
            <p className="text-muted-foreground leading-relaxed">
              The repo carries binding instructions for AI builders. Claude
              won't dump code on you — it will interview you: what journey are
              your students on, what gets worse if they do nothing, who
              opposes them, what does graduation mean. Answer like a teacher.
              That interview <em>is</em> the design work.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <FileSpreadsheet className="h-8 w-8 text-neuro-green" />
            <h2 className="text-xl font-bold">Step 3 — Hand over your material</h2>
            <p className="text-muted-foreground leading-relaxed">
              Paste your syllabus into the chat, or fill in{" "}
              <a
                href="/curriculum-template.csv"
                download
                className="text-neuro-cyan hover:underline"
              >
                the lesson spreadsheet template
              </a>{" "}
              — one row per lesson. Claude converts whatever you give it into
              missions: briefings, drills, reflections, and a story woven
              through every lesson, in a voice you choose.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Not sure what "done" looks like? The entire How to Save the
              World course lives in the repo as{" "}
              <a
                href={`${REPO_URL}/tree/main/docs/example-curriculum`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neuro-cyan hover:underline"
              >
                a worked example
              </a>{" "}
              — 96 finished missions in one spreadsheet. Study a row, not the
              schema.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <Eye className="h-8 w-8 text-neuro-purple" />
            <h2 className="text-xl font-bold">Step 4 — Grade its homework</h2>
            <p className="text-muted-foreground leading-relaxed">
              Claude drafts; you edit. Read the briefings like you'd read a
              student's essay — send back anything that isn't you. Nothing
              goes live until you say so. You are the professor here; the AI
              is a very fast teaching assistant.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-border/60">
            <Globe className="h-8 w-8 text-critical" />
            <h2 className="text-xl font-bold">Step 5 — Put it online (ask Claude to do it)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Say: <em>"Deploy this so my students can use it."</em> Free
              hosting tiers exist for exactly this; Claude knows them. Your
              students bring their own AI (or run a free local model), and
              their work stays on their own devices — you never hold their
              data, and nobody pays per student. Your total running cost is a
              domain name.
            </p>
          </Card>

          <Card className="p-6 md:p-8 space-y-3 bg-card/60 border-neuro-cyan/40">
            <ShieldCheck className="h-8 w-8 text-neuro-cyan" />
            <h2 className="text-xl font-bold">What you inherit for free</h2>
            <p className="text-muted-foreground leading-relaxed">
              The engine's kernel decides what the AI mentor is allowed to see
              at every moment of a lesson — during a drill it has literally
              never seen the answer key, so it can't spoil what it was never
              given. That discipline is code, not a polite request, and an
              automated probe suite tests it on every change. Your pedagogy,
              enforced by architecture. It's all MIT licensed: yours to use,
              change, and teach with.
            </p>
          </Card>
        </div>

        <footer className="text-center space-y-6 pt-4">
          <p className="text-muted-foreground">
            Three fun lessons by the end of summer. That's the whole ask.
          </p>
          <Button
            onClick={() => window.open(REPO_URL, "_blank", "noopener,noreferrer")}
            variant="critical"
            size="lg"
          >
            Open the engine on GitHub <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Already comfortable with repos?{" "}
            <Link to="/build" className="text-neuro-cyan hover:underline">
              The builder's page
            </Link>{" "}
            gets straight to the tooling.
          </p>
          <Link
            to="/"
            className="block text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Return to How to Save the World
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default Educators;
