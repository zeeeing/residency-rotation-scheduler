import type { CsvRow } from "../types";

export function generateSampleCSV(): void {
  const residents: CsvRow[] = [
    { mcr: "M100001A", name: "Aisha Lim", resident_year: 1, career_blocks_completed: 0 },
    { mcr: "M100002A", name: "Ben Tan", resident_year: 1, career_blocks_completed: 0 },
    { mcr: "M100003A", name: "Clara Goh", resident_year: 1, career_blocks_completed: 0 },
    { mcr: "M200001A", name: "Daniel Ng", resident_year: 2, career_blocks_completed: 12 },
    { mcr: "M200002A", name: "Evelyn Koh", resident_year: 2, career_blocks_completed: 12 },
    { mcr: "M200003A", name: "Faris Lee", resident_year: 2, career_blocks_completed: 12 },
    { mcr: "M300001A", name: "Grace Ong", resident_year: 3, career_blocks_completed: 24 },
    { mcr: "M300002A", name: "Henry Teo", resident_year: 3, career_blocks_completed: 24 },
    { mcr: "M300003A", name: "Irene Chua", resident_year: 3, career_blocks_completed: 24 },
  ];

  const completedYearOneTemplate = [
    { posting_code: "GM (TTSH)" },
    { posting_code: "GM (TTSH)" },
    { posting_code: "GM (TTSH)" },
    { posting_code: "ED (TTSH)" },
    { posting_code: "MICU (TTSH)" },
    { posting_code: "RCCM (TTSH)" },
    { posting_code: "RCCM (TTSH)" },
    { posting_code: "", is_leave: true, leave_type: "LOA" },
    { posting_code: "Endocrine (TTSH)" },
    { posting_code: "Endocrine (TTSH)" },
    { posting_code: "Endocrine (TTSH)" },
    { posting_code: "Renal (TTSH)" },
  ];

  const completedYearTwoTemplate = [
    { posting_code: "GM (TTSH)" },
    { posting_code: "GM (TTSH)" },
    { posting_code: "GM (TTSH)" },
    { posting_code: "ED (TTSH)" },
    { posting_code: "MICU (TTSH)" },
    { posting_code: "MICU (TTSH)" },
    { posting_code: "RCCM (TTSH)" },
    { posting_code: "", is_leave: true, leave_type: "LOA" },
    { posting_code: "Endocrine (TTSH)" },
    { posting_code: "Endocrine (TTSH)" },
    { posting_code: "Endocrine (TTSH)" },
    { posting_code: "Renal (TTSH)" },
  ];

  const buildHistoryRows = (
    mcr: string,
    year: number,
    startCareerBlock: number,
    template: Array<{
      posting_code: string;
      is_leave?: boolean;
      leave_type?: string;
    }>,
    isCurrentYear: number
  ): CsvRow[] =>
    template.map((entry, index) => ({
      mcr,
      year,
      month_block: index + 1,
      career_block: startCareerBlock + index,
      posting_code: entry.posting_code,
      is_current_year: isCurrentYear,
      is_leave: entry.is_leave ? 1 : 0,
      leave_type: entry.is_leave ? entry.leave_type ?? "AL" : "",
    }));

  const buildCurrentYearLeaveRows = (
    mcr: string,
    year: number,
    blocks: number[]
  ): CsvRow[] =>
    blocks.map((block) => ({
      mcr,
      year,
      month_block: block,
      career_block: block,
      posting_code: "",
      is_current_year: 1,
      is_leave: 1,
      leave_type: "LOA",
    }));

  const residentHistory: CsvRow[] = [
    ...buildHistoryRows("M200001A", 1, 1, completedYearOneTemplate, 0),
    ...buildHistoryRows("M200002A", 1, 1, completedYearOneTemplate, 0),
    ...buildHistoryRows("M200003A", 1, 1, completedYearOneTemplate, 0),
    ...buildHistoryRows("M300001A", 1, 1, completedYearOneTemplate, 0),
    ...buildHistoryRows("M300001A", 2, 13, completedYearTwoTemplate, 0),
    ...buildHistoryRows("M300002A", 1, 1, completedYearOneTemplate, 0),
    ...buildHistoryRows("M300002A", 2, 13, completedYearTwoTemplate, 0),
    ...buildHistoryRows("M300003A", 1, 1, completedYearOneTemplate, 0),
    ...buildHistoryRows("M300003A", 2, 13, completedYearTwoTemplate, 0),
    ...buildCurrentYearLeaveRows("M100001A", 1, [3]),
    ...buildCurrentYearLeaveRows("M100002A", 1, [6]),
  ];

  const residentPreferences: CsvRow[] = [
    { mcr: "M100001A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M100001A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M100001A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M100001A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M100001A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M100002A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M100002A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M100002A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M100002A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M100002A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M100003A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M100003A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M100003A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M100003A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M100003A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M200001A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M200001A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M200001A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M200001A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M200001A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M200002A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M200002A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M200002A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M200002A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M200002A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M200003A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M200003A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M200003A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M200003A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M200003A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M300001A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M300001A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M300001A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M300001A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M300001A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M300002A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M300002A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M300002A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M300002A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M300002A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
    { mcr: "M300003A", preference_rank: 1, posting_code: "GM (TTSH)", resident_sr_preferences: "GM" },
    { mcr: "M300003A", preference_rank: 2, posting_code: "ED (TTSH)", resident_sr_preferences: "ED" },
    { mcr: "M300003A", preference_rank: 3, posting_code: "Endocrine (TTSH)", resident_sr_preferences: "Endocrine" },
    { mcr: "M300003A", preference_rank: 4, posting_code: "Renal (TTSH)", resident_sr_preferences: "Renal" },
    { mcr: "M300003A", preference_rank: 5, posting_code: "MICU (TTSH)", resident_sr_preferences: "MICU" },
  ];

  const postings: CsvRow[] = [
    {
      posting_code: "GM (TTSH)",
      posting_type: "core",
      max_residents: 9,
      required_block_duration: 1,
    },
    {
      posting_code: "ED (TTSH)",
      posting_type: "core",
      max_residents: 9,
      required_block_duration: 1,
    },
    {
      posting_code: "MICU (TTSH)",
      posting_type: "core",
      max_residents: 9,
      required_block_duration: 1,
    },
    {
      posting_code: "RCCM (TTSH)",
      posting_type: "core",
      max_residents: 9,
      required_block_duration: 1,
    },
    {
      posting_code: "Endocrine (TTSH)",
      posting_type: "elective",
      max_residents: 9,
      required_block_duration: 3,
    },
    {
      posting_code: "Renal (TTSH)",
      posting_type: "elective",
      max_residents: 9,
      required_block_duration: 3,
    },
  ];

  // convert object arrays to CSV string
  const toCsv = (data: CsvRow[]): string => {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => String(row[header] ?? "")).join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  };

  const files = [
    { filename: "sample_residents.csv", content: toCsv(residents) },
    { filename: "sample_resident_history.csv", content: toCsv(residentHistory) },
    {
      filename: "sample_resident_preferences.csv",
      content: toCsv(residentPreferences),
    },
    { filename: "sample_postings.csv", content: toCsv(postings) },
  ];

  // trigger downloads
  files.forEach(({ filename, content }) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
