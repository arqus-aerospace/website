// The open roles in one place: this same list fills the tiles on /roles and
// the pages under /roles/<slug>. A role we write up ourselves carries its
// description and gets a page; a role someone else handles carries a link
// (our own form is https://arqus-crm-swqv.swedencentral.cloudapp.azure.com/apply).

import type { Role } from "@/components/role-tile";
import type { OpenRole, PostedRole } from "./types";
import { EMBEDDED_SYSTEMS_ENGINEER } from "./embedded-systems-engineer";
import { LASER_OPTICS_STUDENT } from "./laser-optics-student";
import { MECHANICAL_ENGINEER } from "./mechanical-engineer";
import { THERMAL_ENGINEERING_STUDENT } from "./thermal-engineering-student";

export const OPEN_ROLES: OpenRole[] = [
  EMBEDDED_SYSTEMS_ENGINEER,
  MECHANICAL_ENGINEER,
  THERMAL_ENGINEERING_STUDENT,
  LASER_OPTICS_STUDENT,
  {
    title: "RF Engineer",
    team: "Space antenna",
    place: "Munich · On-site",
    applyUrl: "https://jobsatlanticvc.recruitee.com/o/rf-engineer-space-antenna-gn-defencetech-venture-munich",
  },
];

/** A posting with its own page, as opposed to one that only links out. */
export const isPosted = (role: OpenRole): role is PostedRole => "description" in role;

/** The roles that need a page built for them. */
export const postedRoles = (): PostedRole[] => OPEN_ROLES.filter(isPosted);

export const postedRole = (slug: string): PostedRole | undefined =>
  postedRoles().find((role) => role.slug === slug);

/** "Laser & Optics Student": the two halves of a posted title, read together. */
export const roleTitle = (role: OpenRole): string =>
  isPosted(role) ? `${role.title} ${role.titleAccent}` : role.title;

/** What the tile shows: our own page where there is one, else the way out. */
export const roleTile = (role: OpenRole): Role => {
  const { team, place } = role;
  return isPosted(role)
    ? {
        title: roleTitle(role), team, place,
        format: role.description.subtitle,
        href: `/roles/${role.slug}`, action: "Read more →",
      }
    : { title: role.title, team, place, href: role.applyUrl, action: "Apply →", external: true };
};
