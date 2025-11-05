/**
 * Minimal demo data for in-memory database (Vercel deployments)
 */

export const demoCreators = [
  {
    id: 'creator_1',
    platform: 'youtube',
    handle: '@ThePastaQueen',
    displayName: 'Pasta Queen',
    avatarUrl: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=PQ',
    followers: 850000,
    creatorScore: 0.92,
    creatorScoreBreakdown: {
      vm: 0.95,
      ed: 0.88,
      cons: 0.91,
      act: 0.94,
      nov: 0.87,
      auth: 0.96,
      total: 0.92
    },
    cuisinePrimary: 'Italian'
  },
  {
    id: 'creator_2',
    platform: 'tiktok',
    handle: '@KoreanFoodBae',
    displayName: 'Korean Food Bae',
    avatarUrl: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=KFB',
    followers: 1200000,
    creatorScore: 0.90,
    creatorScoreBreakdown: {
      vm: 0.98,
      ed: 0.92,
      cons: 0.85,
      act: 0.89,
      nov: 0.91,
      auth: 0.93,
      total: 0.90
    },
    cuisinePrimary: 'Korean'
  },
  {
    id: 'creator_3',
    platform: 'youtube',
    handle: '@TacoTuesday247',
    displayName: 'Taco Tuesday 24/7',
    avatarUrl: 'https://via.placeholder.com/150/F7DC6F/FFFFFF?text=TT',
    followers: 650000,
    creatorScore: 0.87,
    creatorScoreBreakdown: {
      vm: 0.89,
      ed: 0.85,
      cons: 0.84,
      act: 0.92,
      nov: 0.88,
      auth: 0.90,
      total: 0.87
    },
    cuisinePrimary: 'Mexican'
  }
];

export const demoVideos = [
  {
    id: 'video_1',
    creatorId: 'creator_1',
    platform: 'youtube',
    platformId: 'dQw4w9WgXcQ',
    url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    title: '60-Second Carbonara That Actually Works',
    description: 'Quick and authentic Roman carbonara without cream!',
    publishedAt: new Date('2024-01-15').toISOString(),
    durationSec: 58,
    stats: {
      views: 2500000,
      likes: 185000,
      comments: 12400,
      saves: 45000,
      shares: 28000
    },
    hashtags: ['carbonara', 'pasta', 'italian', 'quickrecipe'],
    recipeScore: 0.94,
    recipeScoreBreakdown: {
      clarity: 0.96,
      completeness: 0.93,
      actionability: 0.95,
      total: 0.94
    },
    embedHtml: null
  },
  {
    id: 'video_2',
    creatorId: 'creator_2',
    platform: 'tiktok',
    platformId: '7234567890123456789',
    url: 'https://tiktok.com/@KoreanFoodBae/video/7234567890123456789',
    title: 'Korean Fried Chicken Glaze Hack',
    description: 'Get that crispy KFC glaze at home with 3 ingredients',
    publishedAt: new Date('2024-01-20').toISOString(),
    durationSec: 45,
    stats: {
      views: 4200000,
      likes: 320000,
      comments: 18500,
      saves: 67000,
      shares: 51000
    },
    hashtags: ['koreanfood', 'friedchicken', 'kfc', 'foodhack'],
    recipeScore: 0.91,
    recipeScoreBreakdown: {
      clarity: 0.89,
      completeness: 0.90,
      actionability: 0.94,
      total: 0.91
    },
    embedHtml: null
  }
];

export const demoRecipes = [
  {
    id: 'recipe_1',
    videoId: 'video_1',
    name: '60-Second Carbonara',
    cuisine: 'Italian',
    difficulty: 'EASY',
    totalMin: 15,
    servings: 2,
    ingredients: [
      { name: 'spaghetti', qty: '200', unit: 'g' },
      { name: 'guanciale', qty: '100', unit: 'g' },
      { name: 'egg yolks', qty: '2', unit: '' },
      { name: 'pecorino romano', qty: '50', unit: 'g', notes: 'grated' },
      { name: 'black pepper', qty: '1', unit: 'tsp' }
    ],
    steps: [
      { n: 1, text: 'Cook pasta in boiling salted water until al dente' },
      { n: 2, text: 'Dice guanciale and render in pan until crispy' },
      { n: 3, text: 'Mix egg yolks, pecorino, and black pepper in bowl' },
      { n: 4, text: 'Drain pasta (save pasta water) and add to guanciale pan' },
      { n: 5, text: 'Off heat, add egg mixture and toss, adding pasta water to create creamy sauce' }
    ],
    equipment: ['large pot', 'pan', 'mixing bowl'],
    allergens: ['eggs', 'dairy'],
    nutrition: {
      kcal: 650,
      protein: 28,
      carbs: 72,
      fat: 26
    },
    confidence: {
      ingredients: 0.98,
      steps: 0.95,
      timing: 0.92,
      overall: 0.95
    }
  },
  {
    id: 'recipe_2',
    videoId: 'video_2',
    name: 'Korean Fried Chicken Glaze',
    cuisine: 'Korean',
    difficulty: 'MEDIUM',
    totalMin: 25,
    servings: 4,
    ingredients: [
      { name: 'chicken wings', qty: '1', unit: 'kg' },
      { name: 'gochujang', qty: '3', unit: 'tbsp' },
      { name: 'honey', qty: '2', unit: 'tbsp' },
      { name: 'soy sauce', qty: '1', unit: 'tbsp' },
      { name: 'garlic', qty: '2', unit: 'cloves', notes: 'minced' }
    ],
    steps: [
      { n: 1, text: 'Pat chicken wings dry and season with salt and pepper' },
      { n: 2, text: 'Fry wings at 350°F until golden and crispy', timers: [{ min: 10 }], tempC: 175 },
      { n: 3, text: 'Mix gochujang, honey, soy sauce, and garlic in bowl' },
      { n: 4, text: 'Toss hot fried wings in glaze until evenly coated' },
      { n: 5, text: 'Garnish with sesame seeds and serve immediately' }
    ],
    equipment: ['deep fryer', 'mixing bowl', 'tongs'],
    allergens: ['soy', 'sesame'],
    nutrition: {
      kcal: 420,
      protein: 32,
      carbs: 18,
      fat: 24
    },
    confidence: {
      ingredients: 0.96,
      steps: 0.94,
      timing: 0.88,
      overall: 0.93
    }
  }
];
