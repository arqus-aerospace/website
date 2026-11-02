// The shape of a job description: everything a posting's page renders. The
// copy lives one file to a role (laser-optics-student.ts), the company
// boilerplate once in company.ts, and the list of what is open in roles.ts.

/** A heading whose tail is set in italic display type: "Who we <em>are</em>". */
export type JdHeading = { text: string; accent: string };

/** One fact in the hero's spec card: wide ones take the whole row. */
export type JdFact = { term: string; value: string; wide?: boolean };

/** A bullet list, under an optional small label such as "Things that help". */
export type JdBullets = { label?: string; items: string[] };

/** A numbered prose section: a lead, paragraphs, a list, then more paragraphs. */
export type JdProseSection = {
  kind?: "prose";
  heading: JdHeading;
  /** the one big opening line, in bone */
  lead?: string;
  body?: string[];
  bullets?: JdBullets;
  after?: string[];
};

/** "You've probably seen some of this before": the war stories of the job. */
export type JdScenarioSection = {
  kind: "scenarios";
  heading: JdHeading;
  /** notched cards by default; a list when the lines should read as one run */
  style?: "tiles" | "list";
  /** the label is only shown on cards, so a listed section can go without */
  items: { meta?: string; text: string }[];
  /** the line that closes the section, full width under it */
  note?: string;
};

export type JdSection = JdProseSection | JdScenarioSection;

/** One row of the closing <dl>, by how its answer is set. */
export type JdDetailRow =
  /** plain prose, the default */
  | { term: string; kind?: "text"; value: string }
  /** underlined in orange: the one line nobody may skim past */
  | { term: string; kind: "mark"; value: string }
  /** a format per block: its name in bone over what it means */
  | { term: string; kind: "formats"; formats: { name: string; detail: string }[] }
  /** a dashed chip for what is not written yet */
  | { term: string; kind: "chip"; value: string };

export type JobDescription = {
  /** over the title, e.g. "Opportunities · Vacancy" */
  kicker: string;
  /** under the title, e.g. "Internship / Thesis / Working Student" */
  subtitle: string;
  /** where an application goes if the form cannot reach the CRM */
  applyEmail: string;
  /** the CRM discipline this posting sorts into, to preselect on the form */
  area?: string;
  /** the hero's spec card: the same facts the details spell out below */
  spec: { label: string; aside: string; facts: JdFact[] };
  /** the numbered sections, after the shared "Who we are" */
  sections: JdSection[];
  /** the practical details, last and numbered like the rest */
  details: { heading: JdHeading; rows: JdDetailRow[] };
};

type RoleBase = { title: string; team: string; place: string };

/** A role written up here: its tile reads into /roles/<slug>. */
export type PostedRole = RoleBase & {
  slug: string;
  /** the title's tail, set in italic: "Laser & Optics <em>Student</em>".
      The tile and the page title read the two halves together. */
  titleAccent: string;
  description: JobDescription;
};

/** A role whose application lives on someone else's site: the tile links out. */
export type LinkedRole = RoleBase & { applyUrl: string };

export type OpenRole = PostedRole | LinkedRole;
