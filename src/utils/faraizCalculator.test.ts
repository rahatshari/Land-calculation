import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFaraizDistribution,
  reduceFraction,
  toBengaliNumber,
  decimalToAnaGanda
} from './faraizCalculator';
import {
  createCleanTree,
  createSampleTree,
  updateNodeInTree,
  recalculateEntireTree,
  applyTransactionsToTree
} from './treeManager';

test('User Prompt Scenario 1: Male owner (Rahat), 100 decimals, 2 sons and 3 daughters (no spouse)', () => {
  const shares = calculateFaraizDistribution(
    'male',
    100,
    {
      husband: 0,
      wives: 0,
      sons: 2,
      daughters: 3,
      father: false,
      mother: false,
      grandfather: false,
      grandmother: false,
      brothers: 0,
      sisters: 0,
    }
  );

  assert.equal(shares.length, 5);

  const sons = shares.filter(s => s.relationship === 'son');
  const daughters = shares.filter(s => s.relationship === 'daughter');

  assert.equal(sons.length, 2);
  assert.equal(daughters.length, 3);

  // 2 sons * 2 + 3 daughters * 1 = 7 parts
  // Each son gets 2/7 * 100 = 28.5714...
  // Each daughter gets 1/7 * 100 = 14.2857...
  for (const son of sons) {
    assert.ok(Math.abs(son.landDecimals - 28.5714) < 0.01, `Son share should be ~28.57 but got ${son.landDecimals}`);
    assert.equal(son.shareFraction.num, 2);
    assert.equal(son.shareFraction.den, 7);
  }

  for (const daughter of daughters) {
    assert.ok(Math.abs(daughter.landDecimals - 14.2857) < 0.01, `Daughter share should be ~14.29 but got ${daughter.landDecimals}`);
    assert.equal(daughter.shareFraction.num, 1);
    assert.equal(daughter.shareFraction.den, 7);
  }

  const totalSum = shares.reduce((acc, s) => acc + s.landDecimals, 0);
  assert.ok(Math.abs(totalSum - 100) < 0.001, `Total sum should be 100, got ${totalSum}`);
});

test('User Prompt Scenario 2: Male owner (Rahat), 100 decimals, 1 wife, 2 sons and 3 daughters', () => {
  const shares = calculateFaraizDistribution(
    'male',
    100,
    {
      husband: 0,
      wives: 1,
      sons: 2,
      daughters: 3,
      father: false,
      mother: false,
      grandfather: false,
      grandmother: false,
      brothers: 0,
      sisters: 0,
    }
  );

  assert.equal(shares.length, 6);

  const wife = shares.find(s => s.relationship === 'wife');
  assert.ok(wife, 'Wife must be present');
  assert.equal(wife.landDecimals, 12.5); // 1/8 of 100
  assert.equal(wife.shareFraction.num, 1);
  assert.equal(wife.shareFraction.den, 8);

  const sons = shares.filter(s => s.relationship === 'son');
  const daughters = shares.filter(s => s.relationship === 'daughter');

  // Remainder = 87.5 decimals
  // 7 parts: each son gets 2/7 * 87.5 = 25 decimals
  for (const son of sons) {
    assert.equal(son.landDecimals, 25.0);
  }

  // Each daughter gets 1/7 * 87.5 = 12.5 decimals
  for (const daughter of daughters) {
    assert.equal(daughter.landDecimals, 12.5);
  }

  const totalSum = shares.reduce((acc, s) => acc + s.landDecimals, 0);
  assert.ok(Math.abs(totalSum - 100) < 0.001);
});

test('Next-generation succession: Son passes away with 25 decimals, leaving wife, 1 son, 1 daughter', () => {
  const shares = calculateFaraizDistribution(
    'male',
    25.0,
    {
      husband: 0,
      wives: 1,
      sons: 1,
      daughters: 1,
      father: false,
      mother: false,
      grandfather: false,
      grandmother: false,
      brothers: 0,
      sisters: 0,
    }
  );

  const wife = shares.find(s => s.relationship === 'wife')!;
  const grandson = shares.find(s => s.relationship === 'son')!;
  const granddaughter = shares.find(s => s.relationship === 'daughter')!;

  // Wife 1/8 of 25 = 3.125 decimals
  assert.equal(wife.landDecimals, 3.125);

  // Remainder = 21.875
  // Son gets 2/3 of 21.875 = 14.5833...
  assert.ok(Math.abs(grandson.landDecimals - 14.5833) < 0.01);
  // Daughter gets 1/3 of 21.875 = 7.2916...
  assert.ok(Math.abs(granddaughter.landDecimals - 7.2917) < 0.01);

  const totalSum = shares.reduce((acc, s) => acc + s.landDecimals, 0);
  assert.ok(Math.abs(totalSum - 25.0) < 0.001);
});

test('Awl (আওল) case: Female deceased, husband + 2 sisters', () => {
  const shares = calculateFaraizDistribution(
    'female',
    70,
    {
      husband: 1,
      wives: 0,
      sons: 0,
      daughters: 0,
      father: false,
      mother: false,
      grandfather: false,
      grandmother: false,
      brothers: 0,
      sisters: 2,
    }
  );

  // Husband base 1/2 (3/6), Sisters base 2/3 (4/6) -> total 7/6 -> Husband gets 3/7, Sisters get 4/7
  const husband = shares.find(s => s.relationship === 'husband')!;
  const sisters = shares.filter(s => s.relationship === 'sister');

  assert.ok(Math.abs(husband.landDecimals - 30) < 0.01); // 3/7 of 70 = 30
  const sistersSum = sisters.reduce((acc, s) => acc + s.landDecimals, 0);
  assert.ok(Math.abs(sistersSum - 40) < 0.01); // 4/7 of 70 = 40
});

test('Traditional Bengali land unit converter (আনা-গণ্ডা-কড়া-ক্রান্তি)', () => {
  const full = decimalToAnaGanda(1.0);
  assert.equal(full, '১৬ আনা');

  const half = decimalToAnaGanda(0.5);
  assert.equal(half, '৮ আনা');

  const oneEighth = decimalToAnaGanda(0.125);
  assert.equal(oneEighth, '২ আনা');
});

test('Multi-generation 3-level tree preservation and recalculation', () => {
  const rootTree = createCleanTree('রাহাত', 100, 'male');
  
  // Gen 1: 2 sons, 3 daughters
  const gen1Updated = updateNodeInTree(rootTree, 'root-owner', (node) => {
    return {
      ...node,
      inputConfig: {
        husband: 0,
        wives: 0,
        sons: 2,
        daughters: 3,
        father: false,
        mother: false,
        grandfather: false,
        grandmother: false,
        brothers: 0,
        sisters: 0,
      },
      children: [
        { id: 'son-1', name: 'ছেলে ১', relationship: 'son', relationshipBn: 'পুত্র', gender: 'male', generation: 1, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
        { id: 'son-2', name: 'ছেলে ২', relationship: 'son', relationshipBn: 'পুত্র', gender: 'male', generation: 1, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
        { id: 'daughter-1', name: 'মেয়ে ১', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female', generation: 1, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
        { id: 'daughter-2', name: 'মেয়ে ২', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female', generation: 1, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
        { id: 'daughter-3', name: 'মেয়ে ৩', relationship: 'daughter', relationshipBn: 'কন্যা', gender: 'female', generation: 1, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
      ]
    };
  });

  assert.equal(gen1Updated.children.length, 5);
  const son1 = gen1Updated.children[0];
  assert.ok(Math.abs(son1.totalEstate - 28.5714) < 0.01);

  // Gen 2: Add 1 son and 1 daughter under son-1
  const gen2Updated = updateNodeInTree(gen1Updated, son1.id, (node) => {
    return {
      ...node,
      inputConfig: {
        husband: 0,
        wives: 0,
        sons: 1,
        daughters: 1,
        father: false,
        mother: false,
        grandfather: false,
        grandmother: false,
        brothers: 0,
        sisters: 0,
      },
      children: [
        { id: 'grandson-1', name: 'নাতি ১', relationship: 'son', relationshipBn: 'পৌত্র', gender: 'male', generation: 2, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
        { id: 'granddaughter-1', name: 'নাতনি ১', relationship: 'daughter', relationshipBn: 'পৌত্রী', gender: 'female', generation: 2, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
      ]
    };
  });

  const updatedSon1 = gen2Updated.children[0];
  assert.equal(updatedSon1.children.length, 2, 'Son 1 should have 2 children');
  const grandson1 = updatedSon1.children[0];
  // 2/3 of 28.5714 = 19.0476
  assert.ok(Math.abs(grandson1.totalEstate - 19.0476) < 0.01);

  // Gen 3: Add children under grandson-1
  const gen3Updated = updateNodeInTree(gen2Updated, grandson1.id, (node) => {
    return {
      ...node,
      inputConfig: {
        husband: 0,
        wives: 0,
        sons: 2,
        daughters: 0,
        father: false,
        mother: false,
        grandfather: false,
        grandmother: false,
        brothers: 0,
        sisters: 0,
      },
      children: [
        { id: 'great-grandson-1', name: 'প্রপৌত্র ১', relationship: 'son', relationshipBn: 'প্রপৌত্র', gender: 'male', generation: 3, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
        { id: 'great-grandson-2', name: 'প্রপৌত্র ২', relationship: 'son', relationshipBn: 'প্রপৌত্র', gender: 'male', generation: 3, totalEstate: 0, inheritedEstate: 0, extraEstate: 0, shareFractionStr: '', sharePercentage: 0, legalReasonBn: '', children: [] },
      ]
    };
  });

  const checkSon1 = gen3Updated.children[0];
  const checkGrandson1 = checkSon1.children[0];
  assert.equal(checkGrandson1.children.length, 2, 'Grandson 1 should have 2 children in Generation 3');
  // 19.0476 / 2 = 9.5238
  assert.ok(Math.abs(checkGrandson1.children[0].totalEstate - 9.5238) < 0.01);

  // NOW: Update Root total land to 140! All 3 generations must recalculate cleanly!
  const rootLandUpdated = recalculateEntireTree({
    ...gen3Updated,
    totalEstate: 140,
    inheritedEstate: 140,
  });

  // 140 total: 2 sons + 3 daughters = 7 parts -> each son gets 2/7 * 140 = 40.0!
  const newSon1 = rootLandUpdated.children[0];
  assert.equal(newSon1.totalEstate, 40.0);
  assert.equal(newSon1.children.length, 2);

  // Grandson gets 2/3 of 40 = 26.6667!
  const newGrandson1 = newSon1.children[0];
  assert.ok(Math.abs(newGrandson1.totalEstate - 26.6667) < 0.01);
  assert.equal(newGrandson1.children.length, 2);

  // Great-grandsons get 26.6667 / 2 = 13.3333 each!
  assert.ok(Math.abs(newGrandson1.children[0].totalEstate - 13.3333) < 0.01);
});

test('Childless scenario (নিঃসন্তান ব্যক্তি): Female deceased, husband + mother + 1 brother + 1 sister', () => {
  const shares = calculateFaraizDistribution(
    'female',
    60,
    {
      husband: 1,
      wives: 0,
      sons: 0,
      daughters: 0,
      father: false,
      mother: true,
      grandfather: false,
      grandmother: false,
      brothers: 1,
      sisters: 1,
    }
  );

  const husband = shares.find(s => s.relationship === 'husband')!;
  const mother = shares.find(s => s.relationship === 'mother')!;
  const brother = shares.find(s => s.relationship === 'brother')!;
  const sister = shares.find(s => s.relationship === 'sister')!;

  // Husband: 1/2 of 60 = 30
  assert.equal(husband.landDecimals, 30);
  // Mother: with 2 siblings, gets 1/6 of 60 = 10
  assert.equal(mother.landDecimals, 10);
  // Remainder = 20 decimals -> 1 brother (2 parts) + 1 sister (1 part) = 3 parts
  // Brother = 2/3 of 20 = 13.333...
  assert.ok(Math.abs(brother.landDecimals - 13.3333) < 0.01);
  // Sister = 1/3 of 20 = 6.666...
  assert.ok(Math.abs(sister.landDecimals - 6.6667) < 0.01);
});

test('User Prompt Example: Land Transaction logic (Nahar and Kulsum sell to Hasib)', () => {
  const tree = createSampleTree(); // Rahat 100 decimals, 2 sons (25 each), 3 daughters (12.5 each)

  const txs = [
    {
      id: 'tx-1',
      sellerId: 'daughter-1', // Nahar
      sellerName: 'মেয়ে ১ (নাহার)',
      buyerId: 'son-1',       // Hasib
      buyerName: 'ছেলে ১ (হাসিব)',
      amountDecimals: 5,
      date: '৩০/১০/২০২৬',
    },
    {
      id: 'tx-2',
      sellerId: 'daughter-2', // Kulsum
      sellerName: 'মেয়ে ২ (কুলসুম)',
      buyerId: 'son-1',       // Hasib
      buyerName: 'ছেলে ১ (হাসিব)',
      amountDecimals: 5,
      date: '৩০/১০/২০২৬',
    },
  ];

  const updatedTree = applyTransactionsToTree(tree, txs);

  const hasib = updatedTree.children.find((c: any) => c.id === 'son-1');
  const nahar = updatedTree.children.find((c: any) => c.id === 'daughter-1');
  const kulsum = updatedTree.children.find((c: any) => c.id === 'daughter-2');

  // Hasib bought 10 decimals:
  assert.equal(hasib.landBought, 10);
  assert.equal(hasib.landSold, 0);
  assert.ok(Math.abs(hasib.currentTotalLand - (hasib.inheritedEstate + 10)) < 0.001);

  // Nahar sold 5 decimals:
  assert.equal(nahar.landSold, 5);
  assert.ok(Math.abs(nahar.currentTotalLand - (nahar.inheritedEstate - 5)) < 0.001);

  // Kulsum sold 5 decimals:
  assert.equal(kulsum.landSold, 5);
  assert.ok(Math.abs(kulsum.currentTotalLand - (kulsum.inheritedEstate - 5)) < 0.001);
});


