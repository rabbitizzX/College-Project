export type SurveyRow = string[];

// Small RFC-4180 parser: preserves duplicate headings as separate column positions,
// quoted newlines, escaped quotes, and empty cells.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field.length === 0) quoted = true;
    else if (c === ',') { row.push(field.trim()); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field.trim()); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field.trim());
  if (row.some(v => v !== '')) rows.push(row);
  return rows;
}

export const col = {
  age: 1, device: 2, frequency: 3, reason: 4, communication: 5,
  noneLearn: 8, keypadServices: 10, keypadReason: 11, keypadLearn: 14,
  suspicious: 15, otp: 16, confidence: 17, smartphoneActivities: 19,
  canDo: 20, needsHelp: 21,
};

export type CountItem = { name: string; count: number; pct: number };
const clean = (s: string) => s.trim().replace(/\s+/g, ' ');
export function tally(values: string[], denominator = values.length): CountItem[] {
  const counts = new Map<string, number>();
  values.map(clean).filter(Boolean).forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  return [...counts].map(([name, count]) => ({ name, count, pct: denominator ? count / denominator * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
export function multiTally(values: string[]): CountItem[] {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach(v => [...new Set(v.split(';').map(clean).filter(Boolean))].forEach(x => counts.set(x, (counts.get(x) || 0) + 1)));
  return [...counts].map(([name, count]) => ({ name, count, pct: values.filter(Boolean).length ? count / values.filter(Boolean).length * 100 : 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
export function processSurvey(rows: SurveyRow[]) {
  const valid = rows.filter(r => r.length > 1 && r.slice(1).some(v => clean(v)));
  const values = (index: number) => valid.map(r => r[index] || '');
  const deviceRows = valid.filter(r => ['Smartphone', 'Keypad', 'None'].includes(clean(r[col.device] || '')));
  const groups = (name: string) => deviceRows.filter(r => clean(r[col.device] || '') === name);
  const smartphone = groups('Smartphone');
  const phoneFreqValues = values(col.frequency).filter(Boolean);
  const phoneFreq = tally(phoneFreqValues, phoneFreqValues.length);
  const activities = multiTally(smartphone.map(r => r[col.smartphoneActivities] || ''));
  const helpValues = smartphone.map(r => r[col.needsHelp] || '');
  const canValues = smartphone.map(r => r[col.canDo] || '');
  const learnValues = [...values(col.noneLearn), ...values(col.keypadLearn)].filter(Boolean);
  const conf = smartphone.map(r => Number(r[col.confidence])).filter(n => Number.isFinite(n) && n >= 1 && n <= 5);
  const fraudCells = [
    { label: 'Without a phone', index: 7 },
    { label: 'Keypad phone users', index: 13 },
    { label: 'Smartphone users', index: 18 },
  ].map(b => {
    const answered = valid.map(r => r[b.index] || '').filter(Boolean);
    return { label: b.label, denominator: answered.length, data: tally(answered, answered.length) };
  });
  const safetyRows = valid.filter(r => !!clean(r[col.suspicious] || ''));
  const otpRows = valid.filter(r => !!clean(r[col.otp] || ''));
  const confDist = [1, 2, 3, 4, 5].map(score => ({ name: String(score), count: conf.filter(n => n === score).length, pct: conf.length ? conf.filter(n => n === score).length / conf.length * 100 : 0 }));
  const helpDenom = helpValues.filter(Boolean).length;
  const canDenom = canValues.filter(Boolean).length;
  const help = multiTally(helpValues)
    .filter(item => !/^i am good$/i.test(item.name))
    .map(item => ({ ...item, pct: helpDenom ? item.count / helpDenom * 100 : 0 }));
  // Preserve each branch denominator. Learning requests are not treated as blank negatives.
  return {
    total: valid.length, deviceDenom: deviceRows.length, smartphone: smartphone.length,
    keypad: groups('Keypad').length, none: groups('None').length,
    deviceData: tally(deviceRows.map(r => r[col.device]), deviceRows.length),
    ages: tally(values(col.age)), frequency: phoneFreq,
    dailyPhone: phoneFreq.filter(x => /several times a day|once or twice a day/i.test(x.name)).reduce((n, x) => n + x.count, 0),
    frequencyDenom: phoneFreqValues.length,
    activities, activityDenom: smartphone.filter(r => !!r[col.smartphoneActivities]).length,
    help, helpDenom,
    canDo: multiTally(canValues), canDenom,
    confidence: conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : null,
    confidenceDenom: conf.length, confidenceDist: confDist,
    fraud: fraudCells, safety: tally(safetyRows.map(r => r[col.suspicious]), safetyRows.length),
    safetyDenom: safetyRows.length, otp: tally(otpRows.map(r => r[col.otp]), otpRows.length), otpDenom: otpRows.length,
    learning: multiTally(learnValues), learningDenom: learnValues.length,
    learnNoPhoneDenom: values(col.noneLearn).filter(Boolean).length,
    learnKeypadDenom: values(col.keypadLearn).filter(Boolean).length,
  };
}

const assetBase = import.meta.env.BASE_URL;
// Edit each caption here; generic wording avoids assigning an unverified activity to a photo.
export const photoItems = [
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-01.jpeg`, caption: 'Fieldwork photograph 01', category: 'Fieldwork' },
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-02.jpeg`, caption: 'Fieldwork photograph 02', category: 'Fieldwork' },
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-03.jpeg`, caption: 'Fieldwork photograph 03', category: 'Fieldwork' },
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-04.jpeg`, caption: 'Fieldwork photograph 04', category: 'Fieldwork' },
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-05.jpeg`, caption: 'Fieldwork photograph 05', category: 'Fieldwork' },
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-06.jpeg`, caption: 'Fieldwork photograph 06', category: 'Fieldwork' },
  { src: `${assetBase}assets/fieldwork/photos/fieldwork-07.jpeg`, caption: 'Fieldwork photograph 07', category: 'Fieldwork' },
];
export const videoItems = Array.from({ length: 7 }, (_, i) => ({
  src: `${assetBase}assets/fieldwork/videos/fieldwork-video-${String(i + 1).padStart(2, '0')}.mp4`,
  title: `Fieldwork video ${String(i + 1).padStart(2, '0')}`,
  orientation: i < 5 ? 'portrait' as const : 'landscape' as const,
}));

// Editable project facts. Replace literal placeholders only when verified details are available.
export const projectFacts = {
  college: 'A.E Kalsekar Degree College',
  faculty: 'Science & Technology / Information Technology',
  mentor: 'Saba Ansari',
  year: '2025-2026',
  fieldworkDate: '30th September 2026',
  location: 'Mumbra-Thane',
  description: 'A fieldwork project focused on understanding the digital literacy needs of senior citizens and helping them become more comfortable with everyday digital technology.',
  activities: 'Conducted a survey, interacted with senior citizens, identified common difficulties with smartphones and digital services, and provided guidance on basic digital skills and online safety.',
  participants: '18 senior citizens',
  team: [
   { name: 'Adnan Shaikh', photo: `${assetBase}images/adnan.jpeg` },
{ name: 'Arfa Firfire', photo: `${assetBase}images/arfa.jpeg` },
{ name: 'Owais Khan', photo: `${assetBase}images/owaizz.jpeg` },
{ name: 'Rehan Chaudhary', photo: `${assetBase}images/rehan.jpeg` },
  ],
};
