// Who we are: the same words on every posting, so they are written once here
// and prepended as section 01 of every job description.

import type { JdProseSection } from "./types";

export const WHO_WE_ARE: JdProseSection = {
  heading: { text: "Who we", accent: "are" },
  lead: "We are a stealth space defence company. Our mission is to keep order in orbit.",
  body: [
    "Just as fighter jets secure the skies and navy ships secure the seas, we are building the systems that will protect the assets above us: the satellites our economies, security, and daily lives depend on.",
    "Space has become contested. As orbit fills with infrastructure and threats alike, Europe needs sovereign means to deter, defend, and uphold law and order beyond the atmosphere.",
    "We are at the stage where the first hires define what the company becomes. Today, the team is eight people, building the first systems, setting the technical direction, and proving the mission. The next people to join will be among the company's first employees. They will not be joining an existing machine. They will help build one.",
    "That means real authorship. The architecture, the engineering culture, the operating rhythm, and the standard of execution are still being formed. For the right person, this is the opportunity to help shape a European space defence company from its earliest days.",
    "We are looking for mission-driven people who want to defend the high ground and who are ready to have honest debates about the use of force in space, its limits, and its ethics.",
  ],
};
