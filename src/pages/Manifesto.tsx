import { Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ScrollText } from "lucide-react";
// The founding document, rendered from the same file the repo ships —
// one source of truth, no copy drift between the site and the archive.
import manifestoSource from "../../docs/WHITEPAPER.md?raw";

const Manifesto = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to base
        </button>

        <header className="space-y-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-neuro-cyan flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            The Manifesto
          </p>
          <p className="text-sm text-muted-foreground">
            The essay this entire academy was built to answer. Read why the
            fight is a leadership fight — then run the missions that train
            for it.
          </p>
        </header>

        <article className="space-y-2">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6 text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold mt-10 mb-4 text-neuro-cyan">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-8 mb-3 text-foreground">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="text-foreground font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-2 text-muted-foreground">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-neuro-cyan pl-4 my-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neuro-cyan hover:underline"
                >
                  {children}
                </a>
              ),
              hr: () => <hr className="my-8 border-border/60" />,
            }}
          >
            {manifestoSource}
          </ReactMarkdown>
        </article>

        <footer className="text-center space-y-6 pt-8 border-t border-border/60">
          <p className="text-muted-foreground">
            The manifesto names the fight. The missions train you for it.
          </p>
          <Button
            onClick={() => navigate("/")}
            variant="critical"
            size="lg"
          >
            Begin training <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
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

export default Manifesto;
