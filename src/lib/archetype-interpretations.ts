// Canonical Archetype Interpretations from NEUROVERSE_SCORING_ENGINE.docx

export const ARCHETYPE_INTERPRETATIONS = {
  WATCHTOWER: {
    name: "The Watchtower",
    subtitle: "The Observer",
    description: "You orient toward the world through attention — watching for the subtle shift, the quiet anomaly, the faint signal that others overlook. Your strength is not vigilance born of fear, but a deep instinct to understand the structures beneath things. You see the unseen: timings, micro-patterns, disruptions forming before they appear. In complexity, you remain steady, reading the field before the field realizes it is being read.",
    gift: "Your gift is lucidity.",
    challenge: "Your challenge is carrying more clarity than those around you can hold.",
  },
  WEAVER: {
    name: "The Weaver",
    subtitle: "The Interpreter",
    description: "You perceive reality through the body — the way energy moves, the way emotions shift, the way relational fields tighten or release. You respond to what is alive, not what is abstract. Your presence stabilizes others intuitively, often before anyone speaks. In complexity, you sense drift first, sometimes long before the consequences manifest.",
    gift: "Your gift is attunement.",
    challenge: "Your challenge is carrying signals too deeply, as if they belong to you.",
  },
  VEIL: {
    name: "The Veil",
    subtitle: "The Intuitive",
    description: "You perceive the subtle architecture beneath human behavior — the motives, the tension lines, the unspoken agreements that shape every interaction. You move through complexity with strategic grace, understanding influence as a relational field, not a weapon. In uncertainty, you navigate power without needing to announce it.",
    gift: "Your gift is subtle truth.",
    challenge: "Your challenge is resisting the pull toward opacity.",
  },
  OPERATOR: {
    name: "The Operator",
    subtitle: "The Builder",
    description: "You see systems as living structures — functions, flows, dependencies, failure points. You orient toward clarity, precision, and real-world outcomes. When a process breaks, you don't panic; you adjust the frame, rewire the pathway, and stabilize the environment. In uncertainty, you become the grounding mechanism others depend on.",
    gift: "Your gift is reliability.",
    challenge: "Your challenge is forgetting that not everything can be engineered.",
  },
  ENGINE: {
    name: "The Engine",
    subtitle: "The Driver",
    description: "You generate forward motion — not recklessly, but with kinetic intelligence. Where others hesitate, you move. Where systems stall, you create velocity. Your presence activates dormant potential, converting ideas into action, energy into outcomes. In stillness, you become restless; in motion, you become generative.",
    gift: "Your gift is momentum.",
    challenge: "Your challenge is knowing when to pause.",
  },
  LUMEN: {
    name: "The Lumen",
    subtitle: "The Visionary",
    description: "You orient toward the far edge — not fantasies, but horizons that exist just beyond current conditions. You see the arc of becoming: where things are moving, what they could transform into, the trajectory that is possible but not yet obvious. In ambiguity, you offer direction without forcing certainty.",
    gift: "Your gift is vision.",
    challenge: "Your challenge is remaining tethered to the ground while reading the sky.",
  },
  CIPHER: {
    name: "The Cipher",
    subtitle: "The Analyst",
    description: "You sense what doesn't exist yet — the idea that cuts sideways, the possibility no one has imagined, the unconventional move that changes the entire dynamic. You are drawn to the edges of the map, where most hesitate to look. In complexity, you break patterns that have outlived their usefulness.",
    gift: "Your gift is invention.",
    challenge: "Your challenge is knowing when stability is not the enemy.",
  },
  DRIFT: {
    name: "The Drift",
    subtitle: "The Adaptive",
    description: "You hold relational and energetic fields through presence. Where others destabilize, you remain — not rigid, but deeply rooted. Your clarity emerges from embodied integrity: what you say matches what you do, and what you do aligns with who you are. In chaos, you are the steadying force that allows others to recalibrate.",
    gift: "Your gift is integrity.",
    challenge: "Your challenge is mistaking rootedness for immobility.",
  },
  CHRONICLE: {
    name: "The Chronicle",
    subtitle: "The Archivist",
    description: "You perceive the hidden narrative beneath events — the story that explains why things unfolded as they did, the thread that connects disparate moments into coherent meaning. You don't just see what happened; you see what it means, and why it matters. In confusion, you are the one who reveals the plot.",
    gift: "Your gift is synthesis.",
    challenge: "Your challenge is resisting the urge to impose narrative where emergence is still forming.",
  },
} as const;

export type ArchetypeKey = keyof typeof ARCHETYPE_INTERPRETATIONS;
