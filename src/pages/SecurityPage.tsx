import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SecurityPage() {
  const navigate = useNavigate();

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

        <h1 className="text-4xl font-bold mb-6">Sovereign Security Manifesto</h1>

        <p className="text-lg mb-8 text-muted-foreground">
          NeuroVerse OS is a zero-trust, local-first Cognition Operating System.
          Your identity, keys, memory, and cognition remain entirely on your
          device. Nothing is uploaded, stored, or logged on NeuroVerse servers.
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            Local-First Architecture
          </h2>
          <pre className="bg-muted p-6 rounded-lg text-sm overflow-x-auto">
{`[ Operator Device ]
      |
      | (Local Storage: state + identity + lessons + memory)
      |
[ Browser Runtime ]
      |
      | (Direct request using your AI key)
      v
[ AI Provider ]`}
          </pre>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Your Keys, Your Data</h2>
          <p className="text-muted-foreground">
            AI keys remain in your browser storage only. They are never transmitted
            to NeuroVerse infrastructure and can be deleted at any time.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">
            Zero Telemetry Guarantee
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>No analytics</li>
            <li>No tracking</li>
            <li>No data collection</li>
            <li>No logging</li>
            <li>No identity storage</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Verify the Build</h2>
          <p className="text-muted-foreground mb-4">
            To confirm the deployed build matches the open-source repo, visit the{" "}
            <a href="/verify" className="text-primary underline hover:text-primary/80">
              Verify Build
            </a>{" "}
            page.
          </p>
        </section>

        <p className="text-xl font-semibold italic text-center mt-16">
          Two Minds. One Mission. Save the World.
        </p>
      </div>
    </div>
  );
}
