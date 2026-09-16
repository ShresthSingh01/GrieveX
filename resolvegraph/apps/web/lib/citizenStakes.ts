import { CaseDetail } from '@/types';

export interface CitizenImpactProfile {
  vulnerabilityBadge: string;
  vulnerabilityLevel: 'CRITICAL' | 'HIGH' | 'URGENT';
  humanSummary: string;
  daysInLimbo: number;
  affectedPopulation: string;
  realWorldRisk: string;
  bureaucraticFriction: string;
  emotionalQuote: string;
  urgencyColor: string;
}

export function getCitizenImpactProfile(c: CaseDetail): CitizenImpactProfile {
  const id = c.id?.toUpperCase() || '';
  const text = (c.complaint_text || '').toLowerCase();

  // Known Seeded Cases with rich Ground Reality profiles
  if (id.includes('001') || text.includes('drain') || text.includes('flood')) {
    return {
      vulnerabilityBadge: 'Structural Collapse & Sanitation Hazard',
      vulnerabilityLevel: 'HIGH',
      humanSummary: 'Family facing persistent sewage water intrusion into living quarters with imminent boundary wall collapse risk.',
      daysInLimbo: 42,
      affectedPopulation: 'Household of 5 + Immediate Neighbors',
      realWorldRisk: 'Structural wall failure, dampness-induced asthma, waterborne vector contamination (dengue).',
      bureaucraticFriction: 'Jurisdictional deadlock: Ward Officer claims PWD trunk drain; PWD local office refuses visits.',
      emotionalQuote: 'The backflow is now causing structural dampness and severe property damage to my boundary wall.',
      urgencyColor: 'text-amber-400 border-amber-500/40 bg-amber-950/30'
    };
  }

  if (id.includes('002') || text.includes('pension') || text.includes('disability')) {
    return {
      vulnerabilityBadge: 'Critical Subsistence Deprivation',
      vulnerabilityLevel: 'CRITICAL',
      humanSummary: 'Elderly disabled citizen left with zero financial support for 4 consecutive months, unable to afford essential medicines.',
      daysInLimbo: 120,
      affectedPopulation: 'Senior Citizen Living with Mobility Impairment',
      realWorldRisk: 'Acute nutritional distress, inability to purchase vital prescription drugs, potential eviction.',
      bureaucraticFriction: 'Treasury-Bank ping-pong: Bank tells citizen to visit Social Welfare; Welfare tells citizen to check Bank.',
      emotionalQuote: 'My monthly disability pension has stopped for 4 months. I have no other source of livelihood.',
      urgencyColor: 'text-rose-400 border-rose-500/40 bg-rose-950/30'
    };
  }

  if (id.includes('003') || text.includes('electric') || text.includes('cable') || text.includes('wire')) {
    return {
      vulnerabilityBadge: 'Imminent Life-Safety Emergency',
      vulnerabilityLevel: 'CRITICAL',
      humanSummary: 'Live 11kV high-tension cable sagging within arm’s reach directly across a daily transit corridor and school commute path.',
      daysInLimbo: 14,
      affectedPopulation: 'Colony Residents & Daily School Bus Commuters (200+ Children)',
      realWorldRisk: 'Catastrophic electrocution, flashover fire, total school transport blockage.',
      bureaucraticFriction: 'Electricity Board alleges illegal road height raising by Municipality; Municipality claims unpermitted pole alignment.',
      emotionalQuote: 'School buses cannot pass and sparks were seen yesterday.',
      urgencyColor: 'text-rose-400 border-rose-500/40 bg-rose-950/30'
    };
  }

  if (id.includes('004') || text.includes('demolish') || text.includes('compensation') || text.includes('godown')) {
    return {
      vulnerabilityBadge: 'Livelihood Destruction & Commercial Loss',
      vulnerabilityLevel: 'HIGH',
      humanSummary: 'Registered commercial warehouse wrongfully razed during anti-encroachment drive despite possessing lawful title deeds.',
      daysInLimbo: 28,
      affectedPopulation: 'Small Business Owner & 12 Employed Warehouse Laborers',
      realWorldRisk: 'Commercial bankruptcy, immediate wage loss for 12 families, destruction of ₹12L inventory.',
      bureaucraticFriction: 'Town Planning enforcement squad acted without surveyor boundary demarcation verification.',
      emotionalQuote: 'Revenue surveyor admitted on-site that our plot was outside the demarcation line.',
      urgencyColor: 'text-amber-400 border-amber-500/40 bg-amber-950/30'
    };
  }

  if (id.includes('005') || text.includes('streetlight') || text.includes('hostel') || text.includes('dark')) {
    return {
      vulnerabilityBadge: 'Women’s Nighttime Safety Vulnerability',
      vulnerabilityLevel: 'URGENT',
      humanSummary: 'Critical access alley outside working women’s residential hostel left in pitch darkness for 3 weeks.',
      daysInLimbo: 21,
      affectedPopulation: '180 Working Women & Night-Shift Commuters',
      realWorldRisk: 'Nighttime harassment, criminal vulnerability, pedestrian stumbling on broken pavement.',
      bureaucraticFriction: 'Maintenance contractor contract dispute with Municipal Electrical Wing leaving fixture unfixed.',
      emotionalQuote: 'Leaving the alley completely dark and unsafe at night outside the working women’s hostel.',
      urgencyColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
    };
  }

  // Dynamic Fallback for user-created custom complaints
  return {
    vulnerabilityBadge: 'Civic Grievance Pending Administrative Action',
    vulnerabilityLevel: 'HIGH',
    humanSummary: `Grievance registered by ${c.citizen_name || 'Citizen'} awaiting deterministic multi-agency task coordination.`,
    daysInLimbo: 7,
    affectedPopulation: c.location || 'Local Community',
    realWorldRisk: 'Continued administrative neglect and unresolved citizen grievance.',
    bureaucraticFriction: 'Uncoordinated inter-agency handoffs without deterministic DAG enforcement.',
    emotionalQuote: c.complaint_text ? `"${c.complaint_text.slice(0, 120)}..."` : 'Citizen awaiting resolution.',
    urgencyColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
  };
}
