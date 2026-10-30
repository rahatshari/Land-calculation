import { CalculatedShare, Fraction, Gender, HeirCountInput, IndividualHeirConfig, RelationshipType, LandUnitConfig } from '../types';

/**
 * Standard regional unit configuration:
 * ৩.৩০ শতকে ১ কাঠা (আঞ্চলিক মান)
 * ২০ কাঠায় ১ বিঘা = ৬৬ শতক
 */
export const DEFAULT_UNIT_CONFIG: LandUnitConfig = {
  decimalsPerKatha: 3.30,
  kathaPerBigha: 20,
};

export function decimalsToKatha(decimals: number, decimalsPerKatha = 3.30): number {
  const rate = decimalsPerKatha > 0 ? decimalsPerKatha : 3.30;
  return decimals / rate;
}

export function decimalsToBigha(decimals: number, decimalsPerKatha = 3.30, kathaPerBigha = 20): number {
  const kathaRate = decimalsPerKatha > 0 ? decimalsPerKatha : 3.30;
  const bighaRate = kathaPerBigha > 0 ? kathaPerBigha : 20;
  return decimals / (kathaRate * bighaRate);
}

/**
 * Calculates Greatest Common Divisor
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

/**
 * Reduces a fraction to lowest terms
 */
export function reduceFraction(num: number, den: number): Fraction {
  if (den === 0) return { num: 0, den: 1 };
  const common = gcd(num, den);
  return {
    num: Math.round(num / common),
    den: Math.round(den / common),
  };
}

/**
 * Converts English number to Bengali digits
 */
export function toBengaliNumber(num: number | string | undefined | null, decimals = 2): string {
  if (num === undefined || num === null) return '০';
  if (typeof num === 'number') {
    num = num.toFixed(decimals);
    if (num.includes('.')) {
      num = num.replace(/\.?0+$/, '');
    }
  }
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
}

/**
 * Converts fraction to Bengali string e.g. "১/৮" or "৭/৪০"
 */
export function fractionToBengali(fraction: Fraction): string {
  if (fraction.num === 0) return '০';
  if (fraction.num === fraction.den) return '১';
  return `${toBengaliNumber(fraction.num, 0)}/${toBengaliNumber(fraction.den, 0)}`;
}

/**
 * Converts share decimal (0 to 1) to Traditional Bengali land units:
 * 16 আনা = ১ পূর্ণ অংশ
 */
export function decimalToAnaGanda(share: number): string {
  if (share <= 0) return '০ আনা';
  if (share >= 0.999999) return '১৬ আনা';

  const totalTil = Math.round(share * 16 * 20 * 4 * 3 * 20);
  
  const anna = Math.floor(totalTil / (20 * 4 * 3 * 20));
  let rem = totalTil % (20 * 4 * 3 * 20);

  const ganda = Math.floor(rem / (4 * 3 * 20));
  rem = rem % (4 * 3 * 20);

  const kara = Math.floor(rem / (3 * 20));
  rem = rem % (3 * 20);

  const kranti = Math.floor(rem / 20);
  const til = rem % 20;

  const parts: string[] = [];
  if (anna > 0) parts.push(`${toBengaliNumber(anna, 0)} আনা`);
  if (ganda > 0) parts.push(`${toBengaliNumber(ganda, 0)} গণ্ডা`);
  if (kara > 0) parts.push(`${toBengaliNumber(kara, 0)} কড়া`);
  if (kranti > 0) parts.push(`${toBengaliNumber(kranti, 0)} ক্রান্তি`);
  if (til > 0 && parts.length < 3) parts.push(`${toBengaliNumber(til, 0)} তিল`);

  return parts.length > 0 ? parts.join(' ') : '০ আনা';
}

/**
 * Converts float to rational fraction
 */
export function floatToRational(value: number, maxDenominator = 2400): Fraction {
  if (value <= 0) return { num: 0, den: 1 };
  if (value >= 1) return { num: 1, den: 1 };

  const knownFractions: Fraction[] = [
    { num: 1, den: 2 },
    { num: 1, den: 3 },
    { num: 2, den: 3 },
    { num: 1, den: 4 },
    { num: 1, den: 6 },
    { num: 1, den: 8 },
    { num: 2, den: 7 },
    { num: 7, den: 8 },
    { num: 7, den: 40 },
    { num: 7, den: 24 },
    { num: 5, den: 24 },
    { num: 1, den: 12 },
    { num: 1, den: 16 },
    { num: 1, den: 24 },
    { num: 3, den: 7 },
    { num: 4, den: 7 },
    { num: 3, den: 8 },
    { num: 5, den: 8 },
  ];

  for (const kf of knownFractions) {
    if (Math.abs(value - (kf.num / kf.den)) < 1e-7) {
      return kf;
    }
  }

  let m00 = 1, m01 = 0, m10 = 0, m11 = 1;
  let x = value;
  while (m10 * (Math.floor(x)) + m11 <= maxDenominator) {
    const a = Math.floor(x);
    const t0 = m00 * a + m01;
    m01 = m00;
    m00 = t0;
    const t1 = m10 * a + m11;
    m11 = m10;
    m10 = t1;
    if (x === a) break;
    x = 1 / (x - a);
  }

  return reduceFraction(m00, m10);
}

interface RawShare {
  relationship: RelationshipType;
  relationshipBn: string;
  gender: Gender;
  baseShare: number; // 0 to 1
  baseFraction: Fraction;
  isAsaba: boolean;
  legalReasonBn: string;
  categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)' | 'অবশিষ্টাংশভোগী (আছাবা)' | 'প্রতিনিধিত্বশীল (MFLO সেকশন ৪)';
  count: number;
}

/**
 * Comprehensive Faraiz Calculation Engine
 * Covers all Quranic Sharers and Residuaries (Asabah), fully accommodating childless (নিঃসন্তান) scenarios.
 */
export function calculateFaraizDistribution(
  ownerGender: Gender,
  totalLand: number,
  input: HeirCountInput,
  namedHeirs?: IndividualHeirConfig[],
  parentPrefix = 'node',
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20
): CalculatedShare[] {
  if (totalLand <= 0) return [];

  const results: CalculatedShare[] = [];

  const sons = input.sons || 0;
  const daughters = input.daughters || 0;
  const sonSons = input.sonSons || 0;
  const sonDaughters = input.sonDaughters || 0;

  const hasDirectChildren = sons > 0 || daughters > 0;
  const hasAgnaticDescendants = hasDirectChildren || sonSons > 0 || sonDaughters > 0;

  const brothers = input.brothers || 0;
  const sisters = input.sisters || 0;
  const consanguineBrothers = input.consanguineBrothers || 0;
  const consanguineSisters = input.consanguineSisters || 0;
  const uterineBrothers = input.uterineBrothers || 0;
  const uterineSisters = input.uterineSisters || 0;

  const totalSiblings = brothers + sisters + consanguineBrothers + consanguineSisters + uterineBrothers + uterineSisters;

  const rawSharers: RawShare[] = [];

  // 1. SPOUSE (স্বামী / স্ত্রী)
  if (ownerGender === 'female' && input.husband > 0) {
    if (hasAgnaticDescendants) {
      rawSharers.push({
        relationship: 'husband',
        relationshipBn: 'স্বামী',
        gender: 'male',
        baseShare: 1 / 4,
        baseFraction: { num: 1, den: 4 },
        isAsaba: false,
        legalReasonBn: 'সন্তান/বংশধর থাকায় স্বামী মোট সম্পত্তির ১/৪ অংশ পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else {
      rawSharers.push({
        relationship: 'husband',
        relationshipBn: 'স্বামী',
        gender: 'male',
        baseShare: 1 / 2,
        baseFraction: { num: 1, den: 2 },
        isAsaba: false,
        legalReasonBn: 'কোনো সন্তান/বংশধর না থাকায় স্বামী মোট সম্পত্তির ১/২ অংশ পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    }
  } else if (ownerGender === 'male' && input.wives > 0) {
    const wivesCount = Math.min(4, Math.max(1, input.wives));
    if (hasAgnaticDescendants) {
      rawSharers.push({
        relationship: 'wife',
        relationshipBn: wivesCount > 1 ? `স্ত্রী (${toBengaliNumber(wivesCount, 0)} জন)` : 'স্ত্রী',
        gender: 'female',
        baseShare: 1 / 8,
        baseFraction: { num: 1, den: 8 },
        isAsaba: false,
        legalReasonBn: 'সন্তান/বংশধর থাকায় স্ত্রী/স্ত্রীগণ মোট সম্পত্তির ১/৮ অংশ সমভাবে পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: wivesCount,
      });
    } else {
      rawSharers.push({
        relationship: 'wife',
        relationshipBn: wivesCount > 1 ? `স্ত্রী (${toBengaliNumber(wivesCount, 0)} জন)` : 'স্ত্রী',
        gender: 'female',
        baseShare: 1 / 4,
        baseFraction: { num: 1, den: 4 },
        isAsaba: false,
        legalReasonBn: 'কোনো সন্তান/বংশধর না থাকায় স্ত্রী/স্ত্রীগণ মোট সম্পত্তির ১/৪ অংশ সমভাবে পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: wivesCount,
      });
    }
  }

  // 2. MOTHER (মাতা)
  if (input.mother) {
    if (hasAgnaticDescendants || totalSiblings >= 2) {
      rawSharers.push({
        relationship: 'mother',
        relationshipBn: 'মাতা',
        gender: 'female',
        baseShare: 1 / 6,
        baseFraction: { num: 1, den: 6 },
        isAsaba: false,
        legalReasonBn: 'সন্তান বা একাধিক ভাই-বোন থাকায় মাতা মোট সম্পত্তির ১/৬ অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else {
      // 1/3 share (with Umariyatan rule: 1/3 of remainder if only spouse and father exist)
      let motherShare = 1 / 3;
      if (input.father && !hasAgnaticDescendants) {
        const spouseShare = rawSharers.find((s) => s.relationship === 'husband' || s.relationship === 'wife')?.baseShare || 0;
        motherShare = (1 - spouseShare) / 3;
      }
      rawSharers.push({
        relationship: 'mother',
        relationshipBn: 'মাতা',
        gender: 'female',
        baseShare: motherShare,
        baseFraction: floatToRational(motherShare),
        isAsaba: false,
        legalReasonBn: 'সন্তান বা একাধিক ভাই-বোন না থাকায় মাতা ১/৩ অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    }
  } else if (input.grandmother || input.paternalGrandmother || input.maternalGrandmother) {
    // Grandmother if mother not alive
    rawSharers.push({
      relationship: 'paternal_grandmother',
      relationshipBn: 'দাদী/নানী',
      gender: 'female',
      baseShare: 1 / 6,
      baseFraction: { num: 1, den: 6 },
      isAsaba: false,
      legalReasonBn: 'মাতা জীবিত না থাকায় দাদী/নানী ১/৬ অংশ পাবেন',
      categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
      count: 1,
    });
  }

  // 3. FATHER (পিতা)
  let fatherAsaba = false;
  if (input.father) {
    if (sons > 0 || sonSons > 0) {
      rawSharers.push({
        relationship: 'father',
        relationshipBn: 'পিতা',
        gender: 'male',
        baseShare: 1 / 6,
        baseFraction: { num: 1, den: 6 },
        isAsaba: false,
        legalReasonBn: 'পুত্র সন্তান থাকায় পিতা নির্ধারিত ১/৬ অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else if (daughters > 0 || sonDaughters > 0) {
      rawSharers.push({
        relationship: 'father',
        relationshipBn: 'পিতা',
        gender: 'male',
        baseShare: 1 / 6,
        baseFraction: { num: 1, den: 6 },
        isAsaba: true,
        legalReasonBn: 'কন্যা সন্তান থাকায় পিতা ১/৬ অংশ এবং অবশিষ্টাংশ থাকলে আছাবা হিসেবে পাবেন',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
      fatherAsaba = true;
    } else {
      rawSharers.push({
        relationship: 'father',
        relationshipBn: 'পিতা',
        gender: 'male',
        baseShare: 0,
        baseFraction: { num: 0, den: 1 },
        isAsaba: true,
        legalReasonBn: 'কোনো সন্তান না থাকায় পিতা আসাবা হিসেবে অবশিষ্ট সমস্ত সম্পত্তি পাবেন',
        categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
        count: 1,
      });
      fatherAsaba = true;
    }
  } else if ((input.grandfather || input.paternalGrandfather) && !input.father) {
    // Grandfather takes father's place
    if (sons > 0 || sonSons > 0) {
      rawSharers.push({
        relationship: 'paternal_grandfather',
        relationshipBn: 'দাদা',
        gender: 'male',
        baseShare: 1 / 6,
        baseFraction: { num: 1, den: 6 },
        isAsaba: false,
        legalReasonBn: 'পিতা জীবিত না থাকায় এবং পুত্র সন্তান থাকায় দাদা ১/৬ অংশ পাবেন',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else {
      fatherAsaba = true;
      rawSharers.push({
        relationship: 'paternal_grandfather',
        relationshipBn: 'দাদা',
        gender: 'male',
        baseShare: (daughters > 0 || sonDaughters > 0) ? 1 / 6 : 0,
        baseFraction: (daughters > 0 || sonDaughters > 0) ? { num: 1, den: 6 } : { num: 0, den: 1 },
        isAsaba: true,
        legalReasonBn: 'পিতা জীবিত না থাকায় দাদা আছাবা হিসেবে অবশিষ্ট অংশ পাবেন',
        categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
        count: 1,
      });
    }
  }

  // 4. UTERINE SIBLINGS (বৈপিত্রীয় ভাই/বোন - মায়ের দিকের ভাইবোন)
  // Inherit only when no children/grandchildren and no father/grandfather
  const hasMaleAscendant = input.father || input.grandfather || input.paternalGrandfather;
  const totalUterine = uterineBrothers + uterineSisters;
  if (!hasAgnaticDescendants && !hasMaleAscendant && totalUterine > 0) {
    const uterineShare = totalUterine === 1 ? 1 / 6 : 1 / 3;
    if (uterineBrothers > 0) {
      rawSharers.push({
        relationship: 'uterine_brother',
        relationshipBn: uterineBrothers > 1 ? `বৈপিত্রীয় ভাই (${toBengaliNumber(uterineBrothers, 0)} জন)` : 'বৈপিত্রীয় ভাই',
        gender: 'male',
        baseShare: (uterineShare * uterineBrothers) / totalUterine,
        baseFraction: floatToRational((uterineShare * uterineBrothers) / totalUterine),
        isAsaba: false,
        legalReasonBn: 'সন্তান ও পিতা না থাকায় বৈপিত্রীয় ভাই কোরআনিক হিস্যা সমভাবে পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: uterineBrothers,
      });
    }
    if (uterineSisters > 0) {
      rawSharers.push({
        relationship: 'uterine_sister',
        relationshipBn: uterineSisters > 1 ? `বৈপিত্রীয় বোন (${toBengaliNumber(uterineSisters, 0)} জন)` : 'বৈপিত্রীয় বোন',
        gender: 'female',
        baseShare: (uterineShare * uterineSisters) / totalUterine,
        baseFraction: floatToRational((uterineShare * uterineSisters) / totalUterine),
        isAsaba: false,
        legalReasonBn: 'সন্তান ও পিতা না থাকায় বৈপিত্রীয় বোন কোরআনিক হিস্যা সমভাবে পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: uterineSisters,
      });
    }
  }

  // 5. DAUGHTERS WITHOUT SONS (যদি শুধু কন্যা থাকে, পুত্র না থাকে)
  if (sons === 0 && daughters > 0) {
    if (daughters === 1) {
      rawSharers.push({
        relationship: 'daughter',
        relationshipBn: 'কন্যা (একক)',
        gender: 'female',
        baseShare: 1 / 2,
        baseFraction: { num: 1, den: 2 },
        isAsaba: false,
        legalReasonBn: 'একমাত্র কন্যা থাকায় এবং পুত্র না থাকায় তিনি মোট সম্পত্তির ১/২ অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else {
      rawSharers.push({
        relationship: 'daughter',
        relationshipBn: `কন্যা (${toBengaliNumber(daughters, 0)} জন)`,
        gender: 'female',
        baseShare: 2 / 3,
        baseFraction: { num: 2, den: 3 },
        isAsaba: false,
        legalReasonBn: `একাধিক (${toBengaliNumber(daughters, 0)}) কন্যা থাকায় যৌথভাবে ২/৩ অংশ সমভাবে পাবেন (সূরা নিসা: ১১)`,
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: daughters,
      });
    }
  }

  // 6. FULL SISTERS WITHOUT CHILDREN & FATHER
  if (!hasAgnaticDescendants && !hasMaleAscendant && brothers === 0 && sisters > 0) {
    if (sisters === 1) {
      rawSharers.push({
        relationship: 'sister',
        relationshipBn: 'সহোদর বোন',
        gender: 'female',
        baseShare: 1 / 2,
        baseFraction: { num: 1, den: 2 },
        isAsaba: false,
        legalReasonBn: 'সন্তান, পিতা ও ভাই না থাকায় একমাত্র বোন ১/২ অংশ পাবেন (সূরা নিসা: ১৭৬)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else {
      rawSharers.push({
        relationship: 'sister',
        relationshipBn: `সহোদর বোন (${toBengaliNumber(sisters, 0)} জন)`,
        gender: 'female',
        baseShare: 2 / 3,
        baseFraction: { num: 2, den: 3 },
        isAsaba: false,
        legalReasonBn: 'সন্তান, পিতা ও ভাই না থাকায় একাধিক বোন ২/৩ অংশ সমভাবে পাবেন (সূরা নিসা: ১৭৬)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: sisters,
      });
    }
  }

  // Calculate sum of fixed Quranic shares
  const fixedSharersSum = rawSharers
    .filter((s) => !s.isAsaba || s.baseShare > 0)
    .reduce((acc, s) => acc + s.baseShare, 0);

  // Awl (আওল) Check: if sum > 1, scale proportionally
  if (fixedSharersSum > 1.000001) {
    for (const s of rawSharers) {
      const scaledShare = s.baseShare / fixedSharersSum;
      const sharePerPerson = scaledShare / s.count;
      createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, 'আওল (হিস্যা আনুপাতিক হ্রাস)', parentPrefix, decimalsPerKatha, kathaPerBigha);
    }
    return results;
  }

  let remainder = Math.max(0, 1 - fixedSharersSum);

  // 7. SONS AND DAUGHTERS AS RESIDUARY (আছাবা - للذكر مثل حظ الأنثيين)
  if (sons > 0) {
    const totalParts = sons * 2 + daughters * 1;
    const sharePerPart = remainder / totalParts;

    const sonShareEach = sharePerPart * 2;
    const daughterShareEach = sharePerPart * 1;

    for (const s of rawSharers) {
      const sharePerPerson = s.baseShare / s.count;
      createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
    }

    for (let i = 0; i < sons; i++) {
      const named = namedHeirs?.find((h) => h.relationship === 'son' && !results.some((r) => r.id === h.id));
      const name = named?.name || (sons > 1 ? `ছেলে ${toBengaliNumber(i + 1, 0)}` : 'ছেলে');
      const id = named?.id || `${parentPrefix}-son-${i + 1}`;
      const landDec = totalLand * sonShareEach;
      const frac = floatToRational(sonShareEach);

      results.push({
        id,
        name,
        relationship: 'son',
        relationshipBn: 'পুত্র',
        gender: 'male',
        shareFraction: frac,
        shareFractionStr: fractionToBengali(frac),
        sharePercentage: sonShareEach * 100,
        landDecimals: landDec,
        landKatha: decimalsToKatha(landDec, decimalsPerKatha),
        landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
        landSqFt: landDec * 435.6,
        anaGandaKaraKranti: decimalToAnaGanda(sonShareEach),
        legalReasonBn: 'পুত্র আছাবা হিসেবে কন্যার দ্বিগুণ অংশ পাবেন (২:১ অনুপাতে) (সূরা নিসা: ১১)',
        categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
      });
    }

    for (let i = 0; i < daughters; i++) {
      const named = namedHeirs?.find((h) => h.relationship === 'daughter' && !results.some((r) => r.id === h.id));
      const name = named?.name || (daughters > 1 ? `মেয়ে ${toBengaliNumber(i + 1, 0)}` : 'মেয়ে');
      const id = named?.id || `${parentPrefix}-daughter-${i + 1}`;
      const landDec = totalLand * daughterShareEach;
      const frac = floatToRational(daughterShareEach);

      results.push({
        id,
        name,
        relationship: 'daughter',
        relationshipBn: 'কন্যা',
        gender: 'female',
        shareFraction: frac,
        shareFractionStr: fractionToBengali(frac),
        sharePercentage: daughterShareEach * 100,
        landDecimals: landDec,
        landKatha: decimalsToKatha(landDec, decimalsPerKatha),
        landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
        landSqFt: landDec * 435.6,
        anaGandaKaraKranti: decimalToAnaGanda(daughterShareEach),
        legalReasonBn: 'ভাইয়ের সাথে আছাবা বিল গায়র হিসেবে পুত্রে অর্ধেক অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
      });
    }

    return results;
  }

  // 8. IF NO SONS, BUT DAUGHTERS EXIST
  if (sons === 0 && daughters > 0) {
    // If father or grandfather is alive, remainder goes to him as Asaba
    if (fatherAsaba) {
      for (const s of rawSharers) {
        if (s.relationship === 'father' || s.relationship === 'paternal_grandfather') {
          const fatherTotalShare = s.baseShare + remainder;
          createHeirOutputs(s, fatherTotalShare, totalLand, results, namedHeirs, 'নির্ধারিত ১/৬ অংশ + অবশিষ্ট আছাবা অংশ', parentPrefix, decimalsPerKatha, kathaPerBigha);
        } else {
          const sharePerPerson = s.baseShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
      }
      return results;
    }

    // If brothers/sisters exist without father
    if (!hasMaleAscendant && (brothers > 0 || sisters > 0)) {
      for (const s of rawSharers) {
        const sharePerPerson = s.baseShare / s.count;
        createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
      }

      const siblingParts = brothers * 2 + sisters * 1;
      if (siblingParts > 0 && remainder > 0) {
        const unitShare = remainder / siblingParts;
        for (let i = 0; i < brothers; i++) {
          const broShare = unitShare * 2;
          const landDec = totalLand * broShare;
          const frac = floatToRational(broShare);
          results.push({
            id: `${parentPrefix}-brother-${i + 1}`,
            name: `সহোদর ভাই ${toBengaliNumber(i + 1, 0)}`,
            relationship: 'brother',
            relationshipBn: 'সহোদর ভাই',
            gender: 'male',
            shareFraction: frac,
            shareFractionStr: fractionToBengali(frac),
            sharePercentage: broShare * 100,
            landDecimals: landDec,
            landKatha: decimalsToKatha(landDec, decimalsPerKatha),
            landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
            landSqFt: landDec * 435.6,
            anaGandaKaraKranti: decimalToAnaGanda(broShare),
            legalReasonBn: 'কন্যাদের পর অবশিষ্ট অংশে আছাবা হিসেবে পাবেন',
            categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
          });
        }
        for (let i = 0; i < sisters; i++) {
          const sisShare = unitShare * 1;
          const landDec = totalLand * sisShare;
          const frac = floatToRational(sisShare);
          results.push({
            id: `${parentPrefix}-sister-${i + 1}`,
            name: `সহোদর বোন ${toBengaliNumber(i + 1, 0)}`,
            relationship: 'sister',
            relationshipBn: 'সহোদর বোন',
            gender: 'female',
            shareFraction: frac,
            shareFractionStr: fractionToBengali(frac),
            sharePercentage: sisShare * 100,
            landDecimals: landDec,
            landKatha: decimalsToKatha(landDec, decimalsPerKatha),
            landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
            landSqFt: landDec * 435.6,
            anaGandaKaraKranti: decimalToAnaGanda(sisShare),
            legalReasonBn: 'কন্যাদের পর ভাইদের সাথে আছাবা হিসেবে পাবেন',
            categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
          });
        }
        return results;
      }
    }

    // If no Asaba exists, RADD (রদ্দ) applies to return remainder to blood sharers
    const nonSpouseSharers = rawSharers.filter((s) => s.relationship !== 'husband' && s.relationship !== 'wife');
    const spouseSharer = rawSharers.find((s) => s.relationship === 'husband' || s.relationship === 'wife');

    if (nonSpouseSharers.length > 0 && remainder > 0.0001) {
      if (spouseSharer) {
        const spShare = spouseSharer.baseShare / spouseSharer.count;
        createHeirOutputs(spouseSharer, spShare, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
      }
      const nonSpouseBaseSum = nonSpouseSharers.reduce((acc, s) => acc + s.baseShare, 0);
      const remainingForBlood = 1 - (spouseSharer ? spouseSharer.baseShare : 0);

      for (const s of nonSpouseSharers) {
        const raddShare = (s.baseShare / nonSpouseBaseSum) * remainingForBlood;
        const sharePerPerson = raddShare / s.count;
        createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, 'রদ্দ (আছাবা না থাকায় উদ্বৃত্ত অংশ ফেরত)', parentPrefix, decimalsPerKatha, kathaPerBigha);
      }
      return results;
    }
  }

  // 9. CHILDLESS / NO CHILDREN SCENARIO (নিঃসন্তান ব্যক্তি)
  if (!hasAgnaticDescendants) {
    // If father / grandfather is alive, takes all remainder
    if (fatherAsaba) {
      for (const s of rawSharers) {
        if (s.relationship === 'father' || s.relationship === 'paternal_grandfather') {
          const fatherShare = remainder;
          createHeirOutputs(s, fatherShare, totalLand, results, namedHeirs, 'কোনো সন্তান না থাকায় পিতা আসাবা হিসেবে অবশিষ্ট অংশ পাবেন', parentPrefix, decimalsPerKatha, kathaPerBigha);
        } else {
          const sharePerPerson = s.baseShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
      }
      return results;
    }

    // Brothers and sisters as Asaba if no father
    if (brothers > 0 || sisters > 0) {
      for (const s of rawSharers) {
        if (s.relationship !== 'sister') {
          const sharePerPerson = s.baseShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
      }

      const totalSiblingParts = brothers * 2 + sisters * 1;
      const unitShare = remainder / totalSiblingParts;

      for (let i = 0; i < brothers; i++) {
        const broShare = unitShare * 2;
        const landDec = totalLand * broShare;
        const frac = floatToRational(broShare);
        results.push({
          id: `${parentPrefix}-brother-${i + 1}`,
          name: `সহোদর ভাই ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'brother',
          relationshipBn: 'সহোদর ভাই',
          gender: 'male',
          shareFraction: frac,
          shareFractionStr: fractionToBengali(frac),
          sharePercentage: broShare * 100,
          landDecimals: landDec,
          landKatha: decimalsToKatha(landDec, decimalsPerKatha),
          landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
          landSqFt: landDec * 435.6,
          anaGandaKaraKranti: decimalToAnaGanda(broShare),
          legalReasonBn: 'সন্তান ও পিতা না থাকায় আছাবা হিসেবে অবশিষ্ট অংশ পাবেন (সূরা নিসা: ১৭৬)',
          categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
        });
      }
      for (let i = 0; i < sisters; i++) {
        const sisShare = unitShare * 1;
        const landDec = totalLand * sisShare;
        const frac = floatToRational(sisShare);
        results.push({
          id: `${parentPrefix}-sister-${i + 1}`,
          name: `সহোদর বোন ${toBengaliNumber(i + 1, 0)}`,
          relationship: 'sister',
          relationshipBn: 'সহোদর বোন',
          gender: 'female',
          shareFraction: frac,
          shareFractionStr: fractionToBengali(frac),
          sharePercentage: sisShare * 100,
          landDecimals: landDec,
          landKatha: decimalsToKatha(landDec, decimalsPerKatha),
          landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
          landSqFt: landDec * 435.6,
          anaGandaKaraKranti: decimalToAnaGanda(sisShare),
          legalReasonBn: 'ভাইয়ের সাথে আছাবা হিসেবে অবশিষ্ট অংশ পাবেন (সূরা নিসা: ১৭৬)',
          categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
        });
      }
      return results;
    }

    // Extended Asaba: Nephews (ভাতিজা), Uncles (চাচা), Cousins (চাচাতো ভাই)
    const nephews = input.nephews || 0;
    const uncles = input.paternalUncles || 0;
    const cousins = input.paternalCousins || 0;

    // Push fixed sharers first
    for (const s of rawSharers) {
      const sharePerPerson = s.baseShare / s.count;
      createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
    }

    if (remainder > 0.0001) {
      if (nephews > 0) {
        const nepShare = remainder / nephews;
        for (let i = 0; i < nephews; i++) {
          const landDec = totalLand * nepShare;
          const frac = floatToRational(nepShare);
          results.push({
            id: `${parentPrefix}-nephew-${i + 1}`,
            name: `ভাতিজা ${toBengaliNumber(i + 1, 0)} (ভাইয়ের ছেলে)`,
            relationship: 'nephew',
            relationshipBn: 'সহোদর ভাইয়ের ছেলে',
            gender: 'male',
            shareFraction: frac,
            shareFractionStr: fractionToBengali(frac),
            sharePercentage: nepShare * 100,
            landDecimals: landDec,
            landKatha: decimalsToKatha(landDec, decimalsPerKatha),
            landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
            landSqFt: landDec * 435.6,
            anaGandaKaraKranti: decimalToAnaGanda(nepShare),
            legalReasonBn: 'নিকটবর্তী পুরুষ ওয়ারিশ না থাকায় আছাবা হিসেবে অবশিষ্ট অংশ পাবেন',
            categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
          });
        }
        return results;
      } else if (uncles > 0) {
        const uncShare = remainder / uncles;
        for (let i = 0; i < uncles; i++) {
          const landDec = totalLand * uncShare;
          const frac = floatToRational(uncShare);
          results.push({
            id: `${parentPrefix}-uncle-${i + 1}`,
            name: `আপন চাচা ${toBengaliNumber(i + 1, 0)}`,
            relationship: 'paternal_uncle',
            relationshipBn: 'আপন চাচা',
            gender: 'male',
            shareFraction: frac,
            shareFractionStr: fractionToBengali(frac),
            sharePercentage: uncShare * 100,
            landDecimals: landDec,
            landKatha: decimalsToKatha(landDec, decimalsPerKatha),
            landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
            landSqFt: landDec * 435.6,
            anaGandaKaraKranti: decimalToAnaGanda(uncShare),
            legalReasonBn: 'আছাবা হিসেবে অবশিষ্ট অংশ পাবেন',
            categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
          });
        }
        return results;
      } else if (cousins > 0) {
        const cousShare = remainder / cousins;
        for (let i = 0; i < cousins; i++) {
          const landDec = totalLand * cousShare;
          const frac = floatToRational(cousShare);
          results.push({
            id: `${parentPrefix}-cousin-${i + 1}`,
            name: `চাচাতো ভাই ${toBengaliNumber(i + 1, 0)}`,
            relationship: 'paternal_cousin',
            relationshipBn: 'চাচাতো ভাই',
            gender: 'male',
            shareFraction: frac,
            shareFractionStr: fractionToBengali(frac),
            sharePercentage: cousShare * 100,
            landDecimals: landDec,
            landKatha: decimalsToKatha(landDec, decimalsPerKatha),
            landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
            landSqFt: landDec * 435.6,
            anaGandaKaraKranti: decimalToAnaGanda(cousShare),
            legalReasonBn: 'আছাবা হিসেবে অবশিষ্ট অংশ পাবেন',
            categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
          });
        }
        return results;
      }
    }

    // If no Asaba at all, apply Radd to blood sharers
    if (remainder > 0.0001 && rawSharers.length > 0) {
      const nonSpouse = rawSharers.filter((s) => s.relationship !== 'husband' && s.relationship !== 'wife');
      if (nonSpouse.length > 0) {
        const sumBase = nonSpouse.reduce((a, b) => a + b.baseShare, 0);
        const spouse = rawSharers.find((s) => s.relationship === 'husband' || s.relationship === 'wife');
        const remainingForBlood = 1 - (spouse ? spouse.baseShare : 0);

        // Reset results to avoid duplicates
        results.length = 0;
        if (spouse) {
          const spShare = spouse.baseShare / spouse.count;
          createHeirOutputs(spouse, spShare, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
        for (const s of nonSpouse) {
          const raddShare = (s.baseShare / sumBase) * remainingForBlood;
          const sharePerPerson = raddShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, 'রদ্দ (উদ্বৃত্ত অংশ ফেরত)', parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
        return results;
      }
    }

    return results;
  }

  // Fallback: output whatever raw sharers exist
  for (const s of rawSharers) {
    const sharePerPerson = s.baseShare / s.count;
    createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
  }

  return results;
}

function createHeirOutputs(
  s: {
    relationship: RelationshipType;
    relationshipBn: string;
    gender: Gender;
    legalReasonBn: string;
    categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)' | 'অবশিষ্টাংশভোগী (আছাবা)' | 'প্রতিনিধিত্বশীল (MFLO সেকশন ৪)';
    count: number;
  },
  sharePerPerson: number,
  totalLand: number,
  results: CalculatedShare[],
  namedHeirs?: IndividualHeirConfig[],
  noteAddition?: string,
  parentPrefix = 'node',
  decimalsPerKatha = 3.30,
  kathaPerBigha = 20
) {
  for (let i = 0; i < s.count; i++) {
    const named = namedHeirs?.find(
      (h) => h.relationship === s.relationship && !results.some((r) => r.id === h.id)
    );

    let defaultName = s.relationshipBn;
    if (s.count > 1) {
      defaultName = `${s.relationshipBn} ${toBengaliNumber(i + 1, 0)}`;
    }
    const name = named?.name || defaultName;
    const id = named?.id || `${parentPrefix}-${s.relationship}-${i + 1}`;

    const landDec = totalLand * sharePerPerson;
    const frac = floatToRational(sharePerPerson);
    const reason = noteAddition ? `${s.legalReasonBn} (${noteAddition})` : s.legalReasonBn;

    results.push({
      id,
      name,
      relationship: s.relationship,
      relationshipBn: s.relationshipBn,
      gender: s.gender,
      shareFraction: frac,
      shareFractionStr: fractionToBengali(frac),
      sharePercentage: sharePerPerson * 100,
      landDecimals: landDec,
      landKatha: decimalsToKatha(landDec, decimalsPerKatha),
      landBigha: decimalsToBigha(landDec, decimalsPerKatha, kathaPerBigha),
      landSqFt: landDec * 435.6,
      anaGandaKaraKranti: decimalToAnaGanda(sharePerPerson),
      legalReasonBn: reason,
      categoryBn: s.categoryBn,
    });
  }
}
