export type Gender = 'male' | 'female';

export type RelationshipType =
  | 'root'
  | 'husband'
  | 'wife'
  | 'son'
  | 'daughter'
  | 'father'
  | 'mother'
  | 'paternal_grandfather'
  | 'paternal_grandmother'
  | 'maternal_grandmother'
  | 'brother'
  | 'sister'
  | 'consanguine_brother'
  | 'consanguine_sister'
  | 'uterine_brother'
  | 'uterine_sister'
  | 'son_son'
  | 'son_daughter'
  | 'nephew'
  | 'consanguine_nephew'
  | 'paternal_uncle'
  | 'paternal_cousin';

export interface Fraction {
  num: number;
  den: number;
}

export interface LandTransaction {
  id: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  amountDecimals: number; // হস্তান্তরিত জমির পরিমাণ শতক / শতাংশ
  date: string;
  note?: string;
}

export interface HeirCountInput {
  husband: number; // 0 or 1
  wives: number; // 0 to 4
  sons: number;
  daughters: number;
  father: boolean;
  mother: boolean;
  grandfather: boolean; // দাদা
  grandmother: boolean; // দাদী / নানী
  paternalGrandmother?: boolean;
  maternalGrandmother?: boolean;
  brothers: number; // সহোদর ভাই
  sisters: number; // সহোদর বোন
  consanguineBrothers?: number; // বৈমাত্রেয় ভাই
  consanguineSisters?: number; // বৈমাত্রেয় বোন
  uterineBrothers?: number; // বৈপিত্রীয় ভাই
  uterineSisters?: number; // বৈপিত্রীয় বোন
  sonSons?: number; // পৌত্র
  sonDaughters?: number; // পৌত্রী
  nephews?: number; // সহোদর ভাইয়ের ছেলে (ভাতিজা)
  paternalUncles?: number; // আপন চাচা
  paternalCousins?: number; // চাচাতো ভাই
}

export interface IndividualHeirConfig {
  id: string;
  name: string;
  relationship: RelationshipType;
  relationshipBn: string;
  gender: Gender;
  isPredeceased?: boolean; // Under MFLO 1961 Section 4
  extraPersonalLand?: number; // Additional land in decimals (শতক)
}

export interface CalculatedShare {
  id: string;
  name: string;
  relationship: RelationshipType;
  relationshipBn: string;
  gender: Gender;
  shareFraction: Fraction;
  shareFractionStr: string;
  sharePercentage: number;
  landDecimals: number; // শতক / শতাংশ
  landKatha: number; // কাঠা
  landBigha: number; // বিঘা
  landSqFt: number; // বর্গফুট
  anaGandaKaraKranti: string; // ১৬ আনা হিসেবে
  legalReasonBn: string;
  categoryBn: 'কোরআনিক অংশীদার (জাবিল ফুরূজ)' | 'অবশিষ্টাংশভোগী (আছাবা)' | 'প্রতিনিধিত্বশীল (MFLO সেকশন ৪)';
}

export interface HeirTreeNode {
  id: string;
  name: string;
  gender: Gender;
  relationship: RelationshipType;
  relationshipBn: string;
  generation: number;
  totalEstate: number; // Net Current Estate (Inherited + extra + bought - sold)
  inheritedEstate: number; // Inherited from parent (শতক)
  extraEstate: number; // Additional personal land (শতক)
  landBought?: number; // সর্বমোট ক্রয়কৃত জমি (শতক)
  landSold?: number; // সর্বমোট বিক্রিত জমি (শতক)
  currentTotalLand?: number; // বর্তমান চূড়ান্ত জমি (শতক)
  shareFractionStr: string;
  sharePercentage: number;
  legalReasonBn: string;
  isCollapsed?: boolean;
  isPredeceased?: boolean;
  children: HeirTreeNode[];
  inputConfig?: HeirCountInput;
  namedHeirs?: IndividualHeirConfig[];
}

export interface SecurityConfig {
  hasPasswordSet: boolean;
  passwordHash: string;
  salt: string;
  hint: string;
  autoLockMinutes: number; // e.g., 5, 15, 30, 0 (never)
  lastActiveTimestamp: number;
}

export interface LandUnitConfig {
  decimalsPerKatha: number; // default 3.30 (৩.৩০ শতকে ১ কাঠা)
  kathaPerBigha: number;    // default 20 (২০ কাঠায় ১ বিঘা = ৬৬ শতক)
}

export interface AppStateData {
  rootOwner: {
    name: string;
    gender: Gender;
    totalLand: number; // শতক
    landMouza?: string;
    landKhatiyan?: string;
    landDaag?: string;
    notes?: string;
  };
  tree: HeirTreeNode;
  transactions?: LandTransaction[];
  updatedAt: string;
}
