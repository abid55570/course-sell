// ID card templates. `data.theme` drives the card look; `data.fields` are the
// label/key rows printed on each card. Recipients come from a CSV whose columns
// match the field keys (name,id,class,blood,…) plus an optional `photo` URL.
// Card is CR80 portrait, intrinsic 638x1013.
const SCHOOL_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'id', label: 'ID No' },
  { key: 'class', label: 'Class' }, { key: 'blood', label: 'Blood Group' },
];
const CORP_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'id', label: 'Emp ID' },
  { key: 'dept', label: 'Department' }, { key: 'blood', label: 'Blood Group' },
];
const COLLEGE_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'id', label: 'Roll No' },
  { key: 'course', label: 'Course' }, { key: 'blood', label: 'Blood Group' },
];
const EVENT_FIELDS = [
  { key: 'name', label: 'Name' }, { key: 'id', label: 'Pass No' },
  { key: 'role', label: 'Access' }, { key: 'org', label: 'Company' },
];
const GYM_FIELDS = [
  { key: 'name', label: 'Member' }, { key: 'id', label: 'Member ID' },
  { key: 'plan', label: 'Plan' }, { key: 'blood', label: 'Blood Group' },
];

const DIM = { width: 638, height: 1013 };

module.exports = {
  product: 'idcard',
  templates: [
    {
      slug: 'school-blue', name: 'School Blue', category: 'school', is_free: true, sort_order: 1,
      description: 'Classic school ID with photo, blue header band and blood group.',
      dimensions: DIM,
      data: {
        theme: { bg: '#f4f8ff', accent: '#1e5bd6', text: '#1f2a44', headingFont: 'Space Grotesk', band: '#1e5bd6' },
        org: 'Greenfield Public School',
        footer: 'If found, please return to the school office.',
        fields: SCHOOL_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'corporate-black', name: 'Corporate Black', category: 'corporate', is_free: true, sort_order: 2,
      description: 'Sleek black corporate badge for staff & employees.',
      dimensions: DIM,
      data: {
        theme: { bg: '#f5f6f8', accent: '#111418', text: '#1a1d22', headingFont: 'Space Grotesk', band: '#111418' },
        org: 'Acme Corporation Pvt. Ltd.',
        footer: 'Property of Acme Corp. Return to HR if found.',
        fields: CORP_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'college-green', name: 'College Green', category: 'college', is_free: true, sort_order: 3,
      description: 'Fresh green college ID with roll number and course.',
      dimensions: DIM,
      data: {
        theme: { bg: '#f2fbf5', accent: '#178a55', text: '#123528', headingFont: 'Space Grotesk', band: '#178a55' },
        org: 'St. Xaviers College of Arts & Science',
        footer: 'If found, please return to the college office.',
        fields: COLLEGE_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'event-pass', name: 'Event Pass', category: 'event', sort_order: 4,
      description: 'Bold conference / event access pass with role band.',
      dimensions: DIM,
      data: {
        theme: { bg: '#0f1120', accent: '#7c5cff', text: '#eef1fb', headingFont: 'Space Grotesk', band: '#7c5cff' },
        org: 'TechConf 2026',
        footer: 'This pass is non-transferable. Carry a valid ID.',
        fields: EVENT_FIELDS, showPhoto: true, showLogo: true,
      },
    },
    {
      slug: 'gym-membership', name: 'Gym Membership', category: 'gym', sort_order: 5,
      description: 'Energetic membership card for gyms & fitness studios.',
      dimensions: DIM,
      data: {
        theme: { bg: '#fff5f2', accent: '#e2452c', text: '#3a1a12', headingFont: 'Space Grotesk', band: '#e2452c' },
        org: 'PowerHouse Fitness Studio',
        footer: 'Membership card. Non-transferable.',
        fields: GYM_FIELDS, showPhoto: true, showLogo: true,
      },
    },
  ],
};
