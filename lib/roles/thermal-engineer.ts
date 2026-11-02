// Thermal Engineer. The only posting so far with no war stories of
// its own, so it runs 01 to 05 rather than 01 to 06; the numbering follows
// whatever sections are there.

import type { PostedRole } from "./types";

export const THERMAL_ENGINEER: PostedRole = {
  slug: "thermal-engineer",
  title: "Thermal",
  titleAccent: "Engineer",
  team: "Thermal",
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
        lead: "You will help design, model, and test how heat moves through our defensive payload, from lab prototypes through to the payloads that will fly.",
        body: [
          "You will take a thermal design from first model to tested hardware, and use the test results to make the model match reality. You will be one of the first students working on thermal modelling at Arqus, alongside experienced engineers from a range of disciplines. You will see how thermal design fits into a larger system of optics, mechanics, electronics, and code. Typical tasks will include:",
        ],
        bullets: {
          items: [
            "Build thermal models of the payload that predict payload temperatures from full sunlight to Earth’s shadow using Ansys, Fusion and nTop.",
            "Design heat paths that carry heat away from lasers and electronics without disturbing optical alignment",
            "Select and test thermal hardware such as heat sinks, heat pipes, thermal interface materials, and heaters",
            "Set up thermal tests in the lab and compare the results with your models in a TVAC chamber",
            "Work with the mechanical and electrical teams to keep heat in mind from the first design",
            "Document your work for future R&D and manufacturing",
          ],
        },
        after: [
          "You will have room to plan your own work and decide how to approach a problem, with support whenever you want it. You do not need to know everything already: curiosity and a willingness to learn matter more.",
        ],
      },
      {
        heading: { text: "What you'll", accent: "own" },
        body: [
          "You will take ownership of the thermal design of different parts and subassemblies as the project needs, seeing each one through from first model to tested hardware.",
          "Along the way, you will work with real-world challenges such as hot spots in small high-power components, thermal expansion that pulls optics out of alignment, coatings whose properties change over time, and test results that do not match the model. You will also help set up our first thermal test setups and measurement procedures, and take the first steps toward thermal vacuum testing and space-qualified hardware.",
        ],
      },
      {
        heading: { text: "What we're looking", accent: "for" },
        lead: "We would love to hear from you if you are curious about how heat moves through real hardware and enjoy combining modelling with hands-on testing. You do not need to tick every box below. If this role excites you, please apply.",
        bullets: {
          label: "Things that help",
          items: [
            "Some hands-on experience with thermal analysis or testing, from coursework, a student team, an internship, or a working student job",
            "A solid grasp of heat transfer: conduction, radiation, and thermal resistance networks",
            "Experience with thermal analysis tools (e.g. ESATAN-TMS, Thermal Desktop, COMSOL, Ansys, or similar)",
            "Basic CAD skills (e.g. SolidWorks or Autodesk Fusion)",
            "Python for data analysis",
            "Enjoying the puzzle when a test does not match the prediction, and taking ownership of finding out why",
          ],
        },
        after: [
          "You might be studying Aerospace or Mechanical Engineering, Energy and Process Engineering, Physics, Applied Mathematics, or a related subject. Previous hands-on experience, for example from a student team, an internship, or a working student job, is a big advantage and will help you get going quickly.",
          "We welcome applications from people of all genders, backgrounds, and paths into science and engineering. If you need any adjustments during the application process, we would be happy to accommodate them.",
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
            { name: "Bachelor’s or Master’s thesis", detail: "full-time, usually six months, supervised jointly with your university" },
            { name: "Working student", detail: "15 to 20 hours per week during the semester, with the option of full-time during semester breaks" },
          ],
        },
        { term: "Compensation", value: "unpaid" },
        { term: "Citizenship", kind: "mark", value: "You must have NATO member state citizenship." },
      ],
    },
  },
};
