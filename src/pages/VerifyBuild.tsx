import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github } from "lucide-react";

export default function VerifyBuild() {
  const navigate = useNavigate();
  const buildVersion = import.meta.env.VITE_APP_VERSION || "dev";
  const gitHash = import.meta.env.VITE_GIT_COMMIT || "N/A";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-6">Verify Build Integrity</h1>

        <p className="text-lg mb-8 text-muted-foreground">
          This page allows you to confirm that the deployed NeuroVerse build
          matches the open-source version available on GitHub.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Build Information</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Build Version:</strong> {buildVersion}
            </li>
            <li>
              <strong className="text-foreground">Git Commit Hash:</strong> {gitHash}
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            How to Verify the Build
          </h2>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li>Clone the GitHub repository.</li>
            <li>Run a local production build.</li>
            <li>Generate a SHA256 checksum of the output.</li>
            <li>Compare it to the deployed version's checksum.</li>
          </ol>
        </section>

        <p className="text-xl font-semibold italic text-center mt-16">
          Don't trust us — trust the code.
        </p>

        <footer className="mt-12 pt-8 border-t border-border/50 text-center">
          <a
            href={import.meta.env.VITE_GITHUB_REPO || "https://github.com/NeuroverseOS/HowToSaveTheWorld"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-neuro-cyan hover:text-neuro-cyan/80 transition-colors"
          >
            <Github className="h-4 w-4" />
            📡 View Source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
