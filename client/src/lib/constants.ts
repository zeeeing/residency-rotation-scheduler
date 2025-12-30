export const monthLabels = [
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
] as const;

export const CORE_REQUIREMENTS = {
  GM: 6,
  GRM: 2,
  CVM: 3,
  RCCM: 3,
  MICU: 3,
  ED: 1,
  NL: 3,
} as const;

export const ELECTIVE_REQUIREMENT = 5;

// CCR postings bundle
export const CCR_POSTINGS: string[] = [
  "GM (NUH)",
  "GM (SGH)",
  "GM (CGH)",
  "GM (SKH)",
];

// for constraint accordion
export const SECTIONS = [
  {
    title: "HC - Hard Constraints",
    items: [
      {
        label: "HC1 - Exclusivity per month",
        text: "Each month (month) is either a posting or not assigned.",
      },
      {
        label: "HC2 - Posting capacity",
        text: "Per month, each posting has a headcount cap after leave reservations.",
      },
      {
        label: "HC3 - Consecutive runs",
        text: "Multi-month postings must be assigned in full, consecutive runs.",
      },
      {
        label: "HC4 - CCR availability by year",
        text: "CCR is not allowed in year 1 or if already done. If year 3 months exist, one CCR run is required; otherwise, at most one in year 2.",
      },
      {
        label: "HC5 - Core caps (per resident)",
        text: "Do not exceed core requirements. If a core base is already completed historically, it cannot be repeated. GM is capped at 5 unless a CCR run is included.",
      },
      {
        label: "HC6 - Elective repetition",
        text: "Only one variant of an elective base is allowed; completed bases cannot be repeated.",
      },
      {
        label: "HC7a - MICU/RCCM institution consistency",
        text: "If MICU and RCCM are both assigned, they must be from the same institution.",
      },
      {
        label: "HC7b - MICU/RCCM contiguity",
        text: "MICU/RCCM must be one contiguous run and cannot cross Dec to Jan.",
      },
      {
        label: "HC8 - Dec to Jan guardrail",
        text: "No posting run may include both Dec and Jan.",
      },
      {
        label: "HC9 - GRM start months",
        text: "GRM can only start on odd-numbered months; even months must continue from the prior month.",
      },
      {
        label: "HC10 - Quarter starts for 3-month runs",
        text: "Three-month runs can only start in Jul, Oct, Jan, or Apr.",
      },
      {
        label: "HC11 - Year-1 GM cap",
        text: "Maximum three GM months in year 1, including history.",
      },
      {
        label: "HC12 - ED/GRM contiguity",
        text: "If ED or GRM are assigned, all ED plus GRM months form one contiguous run.",
      },
      {
        label: "HC13 - ED/GRM/GM contiguity",
        text: "If ED, GRM, and GM all appear, their months must be one contiguous run.",
      },
      {
        label: "HC14 - (Disabled) Guardrail for ED and GRM",
        text: "Currently disabled: would require 1 ED and 1 GRM if neither is completed historically.",
      },
      {
        label: "HC15 - MICU/RCCM by year",
        text: "ICU months are staged: pack 1 across years 1 to 2 if not already done, optional pack 2 in year 2, and year 3 completes the remaining months to reach 3 MICU and 3 RCCM total.",
      },
      {
        label: "HC16 - Balancing within halves",
        text: "For postings other than GM, ED, and GRM, resident counts are balanced within Jul to Dec and Jan to Jun.",
      },
    ],
  },
  {
    title: "SC - Soft Constraints",
    items: [
      {
        label: "SC1 - Elective requirements",
        text: "Year 2 must complete at least one elective, with a bonus for a second if preferences exist. Year 3 targets five total electives, with penalties for shortfalls.",
      },
      {
        label: "SC2 - Core requirements (for year 3)",
        text: "Missing core months in year 3 incur penalties.",
      },
      {
        label: "SC3 - CCR timing bonus",
        text: "Bonus for completing CCR in year 2 when it has not been done yet.",
      },
      {
        label: "SC4 - SR preference constraints and bonuses",
        text: "One SR base is chosen; choosing none is allowed but penalised. SR placements are limited to later months, with extra bonus in the mid-career window.",
      },
    ],
  },
  {
    title: "Bonuses and penalties",
    items: [
      {
        label: "Preference bonus",
        text: "Rank-weighted bonus for elective preferences when the posting is selected and not chosen as SR.",
      },
      {
        label: "SR bonuses",
        text: "Rank-weighted SR choice bonus, plus extra bonus for placing SR in months 19 to 24.",
      },
      {
        label: "Seniority bonus",
        text: "Per-month bonus scaled by residency year.",
      },
      {
        label: "Core prioritisation bonus",
        text: "Bonus for selecting any core posting.",
      },
      {
        label: "ED/GRM/GM bonuses",
        text: "Bonuses for ED plus GRM pairing, exactly three GM with ED and GRM, and keeping them within one half-year.",
      },
      {
        label: "GM (KTPH) bonus",
        text: "Bonus for GM (KTPH) months in year 1.",
      },
      {
        label: "MICU/RCCM pack shortfall penalty",
        text: "Penalty if pack 1 is not completed during year 2 when year 2 continues beyond this year.",
      },
      {
        label: "No-posting-assigned penalty",
        text: "Strong penalty for months that are not assigned.",
      },
    ],
  },
];
