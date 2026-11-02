// Mechanical Engineer: the laser payload's housings and structures, from the
// bench to hardware that can survive a launch.

import type { PostedRole } from "./types";

export const MECHANICAL_ENGINEER: PostedRole = {
  slug: "mechanical-engineer",
  title: "Mechanical",
  titleAccent: "Engineer",
  team: "Mechanical lab",
  place: "Munich · On-site",
  description: {
    kicker: "Opportunities · Vacancy",
    subtitle: "Internship / Thesis / Working Student",
    applyEmail: "contact@arqusaerospace.com",
    area: "Structures and mechanisms",
    spec: {
      label: "The practical details",
      aside: "Munich",
      facts: [
        { term: "Location", value: "On-site in Munich" },
        { term: "Start", value: "As soon as possible" },
        { term: "Formats", value: "Internship · Thesis · Working student", wide: true },
        { term: "Compensation", value: "Unpaid" },
        { term: "Citizenship", value: "NATO member state" },
      ],
    },
    sections: [
      {
        heading: { text: "Your Role &", accent: "Responsibilities" },
        lead: "You will help design, build, and test mechanical hardware for our laser defence system, from lab prototypes through to the payloads that will fly.",
        body: [
          "You will take part from first sketch to machined, assembled hardware, and help find out whether a design holds up in the real world. You will be one of the first students in our mechanical lab, working alongside experienced engineers from a range of disciplines. You will see how mechanics fits into a larger system of optics, electronics, and code. Much of the lab is still being built, so you will help shape it. Typical tasks include:",
        ],
        bullets: {
          items: [
            "Design and build metal housings for laser and RF heads that hold optics and electronics precisely in place",
            "Design custom mechanical parts in CAD that stay stable through temperature changes and handling",
            "Turn a lab prototype into a lighter, stiffer design that can survive launch vibration",
            "Prepare parts for manufacture and work with machine shops and suppliers to get them made",
            "Document your work for future R&D and manufacturing",
          ],
        },
        after: [
          "You will have room to plan your own work and decide how to approach a design, with support whenever you want it. You do not need to know everything already: curiosity and a willingness to learn matter more.",
        ],
      },
      {
        heading: { text: "What you'll", accent: "own" },
        body: [
          "You will take ownership of different parts and subassemblies as the project needs, seeing each one through from a CAD model to tested hardware.",
          "Along the way, you will work with real-world challenges such as expansion between different materials, launch vibration, tight mass limits, parts that come back from the machine shop not quite to drawing, and missed supplier lead times. You will also help set up and improve our mechanical lab, develop assembly procedures, check designs against customer and regulatory requirements, and take the first steps toward space-qualified hardware.",
        ],
      },
      {
        kind: "scenarios",
        heading: { text: "You've probably seen some of this", accent: "before" },
        style: "list",
        items: [
          { text: "A part that looked perfect on the screen but could not be 3D printed without a redesign" },
          { text: "A cable that survived a thousand cycles on the bench and snagged on the first full demo" },
          { text: "A drawing that looked complete until the machinist called with three questions" },
        ],
        note: "Haven’t met these yet? This is a good place to start.",
      },
      {
        heading: { text: "What we're looking", accent: "for" },
        lead: "We would love to hear from you if you are curious about mechanical design and enjoy building real hardware. You do not need to tick every box below. If this role excites you, please apply.",
        bullets: {
          label: "Things that help",
          items: [
            "Some hands-on experience designing and building mechanical parts, from coursework, a student team, an internship, or a working student job",
            "CAD skills (e.g. SolidWorks or Autodesk Fusion), including technical drawings with tolerances",
            "Understanding of manufacturing methods such as CNC machining, sheet metal, and 3D printing, and how to design parts that can actually be made",
            "Basic FEA or hand calculations for stiffness, stress, and thermal expansion",
            "Interest in space hardware",
            "Taking ownership when things don’t go according to plan",
          ],
        },
        after: [
          "You might be studying Mechanical or Aerospace Engineering, Production Engineering, or a related subject. Previous workshop or build experience, for example from a student team, an internship, or a working student job, is a big advantage and will help you get going quickly.",
          "We welcome applications from people of all genders, backgrounds, and paths into science and engineering. If you need any adjustments during the application process, we would be happy to accommodate them.",
        ],
      },
    ],
    details: {
      heading: { text: "The practical", accent: "details" },
      rows: [
        { term: "Location", value: "on-site in Munich. Hands-on lab work cannot be done remotely." },
        { term: "Start", value: "as soon as possible" },
        {
          term: "Formats",
          kind: "formats",
          formats: [
            { name: "Internship", detail: "full-time, ideally six months" },
            { name: "Bachelor’s or Master’s thesis", detail: "full-time, usually six months, supervised jointly with your university" },
            { name: "Working student", detail: "15 to 20 hours per week during the semester, with the option of full-time during semester breaks" },
          ],
        },
        { term: "Compensation", value: "unpaid" },
        { term: "Citizenship", kind: "mark", value: "You must have NATO member state citizenship." },
        { term: "Application process", kind: "chip", value: "Steps to be added" },
      ],
    },
  },
};
