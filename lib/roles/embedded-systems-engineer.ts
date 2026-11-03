// Embedded Systems Engineer. This posting puts "What we're looking for" ahead
// of the war stories, the other way round from the optics one; the numbering
// follows whatever order the sections are in.

import type { PostedRole } from "./types";

export const EMBEDDED_SYSTEMS_ENGINEER: PostedRole = {
  slug: "embedded-systems-engineer",
  title: "Embedded Systems",
  titleAccent: "Engineer",
  team: "Avionics",
  place: "Munich · On-site",
  description: {
    kicker: "Opportunities · Vacancy",
    subtitle: "Internship / Thesis / Working Student",
    applyEmail: "contact@arqusaerospace.com",
    area: "Avionics and electronics",
    spec: {
      label: "The practical details",
      aside: "Munich",
      facts: [
        { term: "Location", value: "On-site in Munich" },
        { term: "Start", value: "As soon as possible" },
        { term: "Formats", value: "Internship · Thesis · Working student", wide: true },
        { term: "Citizenship", value: "NATO member state" },
      ],
    },
    sections: [
      {
        heading: { text: "Your Role &", accent: "Responsibilities" },
        lead: "You will help design, build, and test the electronics and firmware that connect our laser payload to the satellite’s onboard computer, from lab prototypes through to the payloads that will fly.",
        body: [
          "You will take a board or a feature from the first schematic or line of code to a working system integrated into the payload. You will be one of the first students in our embedded team, working alongside experienced engineers from a range of disciplines. You will see how embedded systems fit into a larger system of optics, mechanics, and software. Much of the lab is still being built, so you will help shape it. Typical tasks include:",
        ],
        bullets: {
          items: [
            "Write microcontroller firmware that controls lasers and beam steering scanners",
            "Integrate sensor boards (e.g. IMU, GPS) and feedback loops that react to measurements in real time",
            "Build the interfaces that let the payload communicate reliably with the onboard computer",
            "Document your work in Git, so other teams can get payload data and telemetry into the ground software used for analysis and live control of the system",
          ],
        },
        after: [
          "You will have room to plan your own work and decide how to approach a problem, with support whenever you want it. You do not need to know everything already: curiosity and a willingness to learn matter more.",
        ],
      },
      {
        heading: { text: "What you'll", accent: "own" },
        body: [
          "You will take ownership of different boards, firmware modules, and interfaces as the project needs, seeing each one through from schematic or first line of code to a working system integrated into the payload.",
          "Along the way, you will work with real-world challenges such as timing jitter, electrical noise, limited power and memory, interfaces that behave differently from their datasheets, and components with long lead times. You will also help improve our firmware and hardware development workflows.",
        ],
      },
      {
        heading: { text: "What we're looking", accent: "for" },
        lead: "We would love to hear from you if you are curious about embedded systems and enjoy making hardware and software work together. You do not need to tick every box below. If this role excites you, please apply.",
        bullets: {
          label: "Things that help",
          items: [
            "Some hands-on experience with embedded projects, from coursework, a student team, an internship, or a working student job",
            "Programming microcontrollers in C or C++",
            "Familiarity with communication protocols such as UART",
            "Experience taking a PCB from schematic to a working board (e.g. KiCad, Altium, or similar)",
            "Comfort with lab tools such as oscilloscopes, logic analysers, and multimeters",
            "Experience with git, and Python for test scripts and data handling",
            "Enjoying the puzzle when a system does not work the first time, and taking ownership of finding out why",
          ],
        },
        after: [
          "You might be studying Electrical Engineering, Computer Engineering, Physics, Computer Science, or a related subject. Previous hands-on experience with real hardware, for example from a student team, an internship, or a working student job, is a big advantage and will help you get going quickly.",
          "We welcome applications from people of all genders, backgrounds, and paths into science and engineering. If you need any adjustments during the application process, we would be happy to know.",
        ],
      },
      {
        kind: "scenarios",
        heading: { text: "You've probably seen some of this", accent: "before" },
        style: "list",
        items: [
          { text: "Firmware that ran perfectly for an hour and crashed the moment you stopped watching." },
          { text: "A bug that disappeared as soon as you attached the debugger." },
          { text: "A board that worked perfectly on its own and stopped the moment it was connected to everything else." },
        ],
        note: "Haven’t met these yet? This is a good place to start.",
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
        { term: "Citizenship", kind: "mark", value: "You must have NATO member state citizenship." },
      ],
    },
  },
};
