import { CalculatedShare, Fraction, Gender, HeirCountInput, IndividualHeirConfig, RelationshipType, LandUnitConfig } from '../types';

/**
 * Standard unit config as requested by user:
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
export function toBengaliNumber(num: number | string, decimals = 2): string {
  if (typeof num === 'number') {
    num = num.toFixed(decimals);
    // Remove trailing zeros if after decimal point
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
 * ১ আনা = ২০ গণ্ডা
 * ১ গণ্ডা = ৪ কড়া
 * ১ কড়া = ৩ ক্রান্তি
 * ১ ক্রান্তি = ২০ তিল
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
 * Main Faraiz Calculation Engine (বাংলাদেশ মুসলিম পারিবারিক আইন ও ফারায়েয বিধিমালা)
 * 
 * @param ownerGender Gender of the deceased/property owner
 * @param totalLand Total land in শতক (decimals)
 * @param input Heir counts
 * @param namedHeirs Optional individual names for heirs
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
  const hasChildren = input.sons > 0 || input.daughters > 0;
  const numSiblings = (input.brothers || 0) + (input.sisters || 0);

  // Intermediate raw shares (fraction of total estate)
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

  const rawSharers: RawShare[] = [];

  // 1. SPOUSE (স্বামী / স্ত্রী)
  if (ownerGender === 'female' && input.husband > 0) {
    if (hasChildren) {
      rawSharers.push({
        relationship: 'husband',
        relationshipBn: 'স্বামী',
        gender: 'male',
        baseShare: 1 / 4,
        baseFraction: { num: 1, den: 4 },
        isAsaba: false,
        legalReasonBn: 'সন্তান থাকায় স্বামী মোট সম্পত্তির ১/৪ অংশ পাবেন (সূরা নিসা: ১২)',
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
        legalReasonBn: 'কোনো সন্তান না থাকায় স্বামী মোট সম্পত্তির ১/২ অংশ পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    }
  } else if (ownerGender === 'male' && input.wives > 0) {
    const wivesCount = Math.min(4, Math.max(1, input.wives));
    if (hasChildren) {
      rawSharers.push({
        relationship: 'wife',
        relationshipBn: wivesCount > 1 ? `স্ত্রী (${toBengaliNumber(wivesCount, 0)} জন)` : 'স্ত্রী',
        gender: 'female',
        baseShare: 1 / 8,
        baseFraction: { num: 1, den: 8 },
        isAsaba: false,
        legalReasonBn: 'সন্তান থাকায় স্ত্রী/স্ত্রীগণ মোট সম্পত্তির ১/৮ অংশ সমভাবে পাবেন (সূরা নিসা: ১২)',
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
        legalReasonBn: 'কোনো সন্তান না থাকায় স্ত্রী/স্ত্রীগণ মোট সম্পত্তির ১/৪ অংশ সমভাবে পাবেন (সূরা নিসা: ১২)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: wivesCount,
      });
    }
  }

  // 2. MOTHER (মাতা)
  if (input.mother) {
    if (hasChildren || numSiblings >= 2) {
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
      // 1/3 share
      rawSharers.push({
        relationship: 'mother',
        relationshipBn: 'মাতা',
        gender: 'female',
        baseShare: 1 / 3,
        baseFraction: { num: 1, den: 3 },
        isAsaba: false,
        legalReasonBn: 'সন্তান বা একাধিক ভাই-বোন না থাকায় মাতা মোট সম্পত্তির ১/৩ অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    }
  } else if (input.grandmother) {
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
    if (input.sons > 0) {
      // With male child, father gets fixed 1/6
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
    } else if (input.daughters > 0) {
      // With only female children, father gets 1/6 + residuary
      rawSharers.push({
        relationship: 'father',
        relationshipBn: 'পিতা',
        gender: 'male',
        baseShare: 1 / 6,
        baseFraction: { num: 1, den: 6 },
        isAsaba: true, // will also take remaining
        legalReasonBn: 'কন্যা সন্তান থাকায় পিতা ১/৬ অংশ এবং অবশিষ্টাংশ থাকলে আছাবা হিসেবে পাবেন',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
      fatherAsaba = true;
    } else {
      // No children: father is primary Asaba
      rawSharers.push({
        relationship: 'father',
        relationshipBn: 'পিতা',
        gender: 'male',
        baseShare: 0, // calculated from remainder
        baseFraction: { num: 0, den: 1 },
        isAsaba: true,
        legalReasonBn: 'কোনো সন্তান না থাকায় পিতা আসাবা হিসেবে অবশিষ্ট সমস্ত সম্পত্তি পাবেন',
        categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
        count: 1,
      });
      fatherAsaba = true;
    }
  } else if (input.grandfather && !input.father) {
    // Grandfather replaces father
    if (input.sons > 0) {
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
        baseShare: input.daughters > 0 ? 1 / 6 : 0,
        baseFraction: input.daughters > 0 ? { num: 1, den: 6 } : { num: 0, den: 1 },
        isAsaba: true,
        legalReasonBn: 'পিতা জীবিত না থাকায় দাদা আছাবা হিসেবে অবশিষ্ট অংশ পাবেন',
        categoryBn: 'অবশিষ্টাংশভোগী (আছাবা)',
        count: 1,
      });
    }
  }

  // 4. DAUGHTERS WITHOUT SONS (যদি শুধু কন্যা থাকে, পুত্র না থাকে)
  if (input.sons === 0 && input.daughters > 0) {
    if (input.daughters === 1) {
      rawSharers.push({
        relationship: 'daughter',
        relationshipBn: 'কন্যা (একক)',
        gender: 'female',
        baseShare: 1 / 2,
        baseFraction: { num: 1, den: 2 },
        isAsaba: false,
        legalReasonBn: 'একমাত্র কন্যা থাকায় এবং কোনো পুত্র না থাকায় তিনি মোট সম্পত্তির ১/২ অংশ পাবেন (সূরা নিসা: ১১)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: 1,
      });
    } else {
      rawSharers.push({
        relationship: 'daughter',
        relationshipBn: `কন্যা (${toBengaliNumber(input.daughters, 0)} জন)`,
        gender: 'female',
        baseShare: 2 / 3,
        baseFraction: { num: 2, den: 3 },
        isAsaba: false,
        legalReasonBn: `একাধিক (${toBengaliNumber(input.daughters, 0)}) কন্যা থাকায় তারা যৌথভাবে মোট সম্পত্তির ২/৩ অংশ সমভাবে পাবেন (সূরা নিসা: ১১)`,
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: input.daughters,
      });
    }
  }

  // 5. SISTERS WITHOUT CHILDREN & FATHER (যদি কোনো সন্তান বা পিতা না থাকে)
  if (!hasChildren && !input.father && !input.grandfather && input.brothers === 0 && input.sisters > 0) {
    if (input.sisters === 1) {
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
        relationshipBn: `সহোদর বোন (${toBengaliNumber(input.sisters, 0)} জন)`,
        gender: 'female',
        baseShare: 2 / 3,
        baseFraction: { num: 2, den: 3 },
        isAsaba: false,
        legalReasonBn: 'সন্তান, পিতা ও ভাই না থাকায় একাধিক বোন ২/৩ অংশ সমভাবে পাবেন (সূরা নিসা: ১৭৬)',
        categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)',
        count: input.sisters,
      });
    }
  }

  // Calculate sum of fixed Quranic shares
  const fixedSharersSum = rawSharers
    .filter((s) => !s.isAsaba || s.baseShare > 0)
    .reduce((acc, s) => acc + s.baseShare, 0);

  // Check if Awl (আওল) is required: fixed shares > 1.000001
  if (fixedSharersSum > 1.000001) {
    // Proportional reduction (Awl)
    for (const s of rawSharers) {
      const scaledShare = s.baseShare / fixedSharersSum;
      const sharePerPerson = scaledShare / s.count;
      createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, 'আওল (হিস্যা আনুপাতিক হ্রাস)', parentPrefix, decimalsPerKatha, kathaPerBigha);
    }
    return results;
  }

  // Remainder after fixed shares
  let remainder = Math.max(0, 1 - fixedSharersSum);

  // 6. SONS AND DAUGHTERS AS RESIDUARY (আছাবা - للذكر مثل حظ الأنثيين)
  // 1 son = 2 shares, 1 daughter = 1 share
  if (input.sons > 0) {
    const totalParts = input.sons * 2 + input.daughters * 1;
    const sharePerPart = remainder / totalParts;

    const sonShareEach = sharePerPart * 2;
    const daughterShareEach = sharePerPart * 1;

    // First push fixed sharers to result
    for (const s of rawSharers) {
      if (!s.isAsaba) {
        const sharePerPerson = s.baseShare / s.count;
        createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
      } else if (s.baseShare > 0) {
        const sharePerPerson = s.baseShare / s.count;
        createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
      }
    }

    // Now push sons
    for (let i = 0; i < input.sons; i++) {
      const named = namedHeirs?.find((h) => h.relationship === 'son' && (!results.some(r => r.id === h.id)));
      const name = named?.name || `পুত্র ${toBengaliNumber(i + 1, 0)}`;
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

    // Push daughters (as residuary with sons)
    for (let i = 0; i < input.daughters; i++) {
      const named = namedHeirs?.find((h) => h.relationship === 'daughter' && (!results.some(r => r.id === h.id)));
      const name = named?.name || `কন্যা ${toBengaliNumber(i + 1, 0)}`;
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

  // 7. IF NO SONS, BUT DAUGHTERS EXIST
  if (input.sons === 0 && input.daughters > 0) {
    // Daughters took fixed share.
    // If father is alive, remainder goes to father as Asaba!
    if (fatherAsaba) {
      for (const s of rawSharers) {
        if (s.relationship === 'father' || s.relationship === 'paternal_grandfather') {
          // Father gets base 1/6 + remainder!
          const fatherTotalShare = s.baseShare + remainder;
          createHeirOutputs(s, fatherTotalShare, totalLand, results, namedHeirs, 'পিতা নির্ধারিত ১/৬ অংশ + অবশিষ্ট আছাবা অংশ পাবেন', parentPrefix, decimalsPerKatha, kathaPerBigha);
        } else {
          const sharePerPerson = s.baseShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
      }
      return results;
    }

    // If brothers/sisters exist without father
    if (!input.father && !input.grandfather && (input.brothers > 0 || input.sisters > 0)) {
      // First push existing sharers
      for (const s of rawSharers) {
        const sharePerPerson = s.baseShare / s.count;
        createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
      }

      // Remainder divided among brothers & sisters (2:1 ratio)
      const siblingParts = (input.brothers * 2) + input.sisters;
      if (siblingParts > 0 && remainder > 0) {
        const unitShare = remainder / siblingParts;
        for (let i = 0; i < input.brothers; i++) {
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
        for (let i = 0; i < input.sisters; i++) {
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

    // If no Asaba exists, RADD (রদ্দ) applies!
    // The remainder is returned to Quranic sharers (excluding spouse if other blood relatives exist).
    const nonSpouseSharers = rawSharers.filter(s => s.relationship !== 'husband' && s.relationship !== 'wife');
    const spouseSharer = rawSharers.find(s => s.relationship === 'husband' || s.relationship === 'wife');

    if (nonSpouseSharers.length > 0 && remainder > 0.0001) {
      // Spouse takes exact fixed share
      if (spouseSharer) {
        const spShare = spouseSharer.baseShare / spouseSharer.count;
        createHeirOutputs(spouseSharer, spShare, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
      }
      // Remainder returned to blood sharers proportionally
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

  // 8. NO CHILDREN AT ALL
  if (!hasChildren) {
    if (fatherAsaba) {
      // Father takes everything after spouse/mother
      for (const s of rawSharers) {
        if (s.relationship === 'father' || s.relationship === 'paternal_grandfather') {
          const fatherShare = remainder;
          createHeirOutputs(s, fatherShare, totalLand, results, namedHeirs, 'কোনো সন্তান না থাকায় পিতা আসাবা হিসেবে অবশিষ্ট সমস্ত অংশ পাবেন', parentPrefix, decimalsPerKatha, kathaPerBigha);
        } else {
          const sharePerPerson = s.baseShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
      }
      return results;
    }

    // Brothers and sisters as Asaba if no father/grandfather
    if (input.brothers > 0 || input.sisters > 0) {
      for (const s of rawSharers) {
        if (s.relationship !== 'sister') {
          const sharePerPerson = s.baseShare / s.count;
          createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
        }
      }

      const totalSiblingParts = (input.brothers * 2) + input.sisters;
      const unitShare = remainder / totalSiblingParts;

      for (let i = 0; i < input.brothers; i++) {
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
      for (let i = 0; i < input.sisters; i++) {
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
  }

  // Fallback: output whatever raw sharers exist
  for (const s of rawSharers) {
    const sharePerPerson = s.baseShare / s.count;
    createHeirOutputs(s, sharePerPerson, totalLand, results, namedHeirs, undefined, parentPrefix, decimalsPerKatha, kathaPerBigha);
  }

  return results;
}

/**
 * Converts a floating point share (0 to 1) into an accurate, clean rational fraction
 */
export function floatToRational(value: number, maxDenominator = 2400): Fraction {
  if (value <= 0) return { num: 0, den: 1 };
  if (value >= 1) return { num: 1, den: 1 };

  // Common known Faraiz fractions check first for absolute precision
  const knownFractions: Fraction[] = [
    { num: 1, den: 2 },
    { num: 1, den: 3 },
    { num: 2, den: 3 },
    { num: 1, den: 4 },
    { num: 1, den: 6 },
    { num: 1, den: 8 },
    { num: 2, den: 7 },
    { num: 1, den: 7 },
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

  // Continued fraction approximation
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

/**
 * Helper to push formatted heir outputs
 */
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
    // Check if named config provided
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
