// Laser & Optics Student: the first posting written up on the site itself.
// Section 01 ("Who we are") comes from company.ts, so the sections here start
// at 02 and the practical details take the last number.

import type { PostedRole } from "./types";

export const LASER_OPTICS_STUDENT: PostedRole = {
  slug: "laser-optics-student",
  title: "Laser & Optics",
  titleAccent: "Student",
  team: "Optics lab",
  place: "Munich · On-site",
  description: {
    kicker: "Opportunities · Vacancy",
    subtitle: "Internship / Thesis / Working Student",
    applyEmail: "contact@arqusaerospace.com",
    area: "Something else",
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
        lead: "You will help build and test laser-based and free-space optics setups for measurement and sensing in our lab.",
        body: [
          "You will take a setup from first sketch to a working prototype with data behind it, and help find out whether an idea holds up in the real world. You will be one of the first students in our optics lab and work closely with experienced engineers from a range of disciplines, so you will see how optics fits into a larger system of moving parts, electronics, and code. Much of the lab is still being built, so you will help shape it. Typical tasks include:",
        ],
        bullets: {
          items: [
            "Build and align free-space laser setups to tight alignment tolerances",
            "Design custom optomechanical parts in CAD that stay stable through temperature changes and handling",
            "Connect lasers, detectors, and data acquisition hardware while keeping noise under control",
            "Write software to control instruments and record data reliably",
            "Analyse measurements to separate real signal from drift and noise",
            "Document your work so others can repeat it",
          ],
        },
        after: [
          "You will have room to plan your own experiments and decide what to try next, with support whenever you want it. You do not need to know everything already: curiosity and a willingness to learn matter more.",
        ],
      },
      {
        heading: { text: "What you'll", accent: "own" },
        body: [
          "You will take ownership of different subassemblies and subsystems as the project needs, from optical layouts and custom mounts to detection electronics and measurement software, and see each one through from idea to working result.",
          "Along the way, you will work with real-world challenges such as alignment drift, thermal effects, vibration, stray light, electrical noise, and parts that arrive late. You will also help set up our first lab procedures and laser safety practices.",
        ],
      },
      {
        kind: "scenarios",
        heading: { text: "You've probably seen some of this", accent: "before" },
        style: "list",
        items: [
          { meta: "Alignment", text: "An alignment that was perfect on Friday and had drifted off the detector by Monday." },
          { meta: "Back-reflection", text: "A laser that met its datasheet but became unstable from a back-reflection." },
          { meta: "Ground loop", text: "An experiment that failed for days and turned out to be a loose cable or a ground loop." },
        ],
        note: "Haven't met these yet? This is a good place to start.",
      },
      {
        heading: { text: "What we're looking", accent: "for" },
        lead: "We would love to hear from you if you are curious about optics and lasers and enjoy hands-on lab work. You do not need to tick every box below. If this role excites you, please apply.",
        bullets: {
          label: "Things that help",
          items: [
            "Some hands-on experience with optical setups, from coursework, a project, an internship, or a working student job",
            "Interest in lasers, interferometry, or other forms of optical measurement",
            "Basic CAD skills (e.g. Autodesk Fusion or SolidWorks)",
            "Programming skills and an understanding of how instruments are controlled and data is acquired",
            "Interest in working across optics, mechanics, electronics, and software",
            "Enjoying the puzzle when an experiment does not work the first time, and taking ownership of finding out why",
          ],
        },
        after: [
          "You might be studying Physics, Photonics, Electrical or Mechanical Engineering, Mechatronics, or a related subject. Previous lab experience, for example from an internship or working student job, is a big advantage and will help you get going quickly.",
          "We welcome applications from people of all genders, backgrounds, and paths into science and engineering. If you need any adjustments during the application process, we would be happy to know.",
        ],
      },
    ],
    details: {
      heading: { text: "The practical", accent: "details" },
      rows: [
        { term: "Location", value: "on-site in Munich." },
        { term: "Start", value: "as soon as possible" },
        {
          term: "Formats",
          kind: "formats",
          formats: [
            { name: "Internship", detail: "full-time, ideally six months" },
            { name: "Bachelor’s or Master’s thesis", detail: "usually six months, supervised jointly with your university" },
            { name: "Working student", detail: "15 to 20 hours per week during the semester, with the option of full-time during semester breaks" },
          ],
        },
        { term: "Citizenship", kind: "mark", value: "You must have NATO member state citizenship." },
      ],
    },
  },
};
