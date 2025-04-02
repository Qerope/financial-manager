import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Function to suggest a category based on transaction description
export function suggestCategory(description: string, categories: any[]): string | null {
  if (!description || !categories || categories.length === 0) return null

  const lowerDesc = description.toLowerCase()

  // Common expense keywords mapped to likely categories
  const keywordMap = {
    // Food & Dining
    restaurant: "food",
    cafe: "food",
    coffee: "food",
    lunch: "food",
    dinner: "food",
    breakfast: "food",
    "uber eats": "food",
    doordash: "food",
    grubhub: "food",
    mcdonalds: "food",
    starbucks: "food",

    // Groceries
    grocery: "groceries",
    supermarket: "groceries",
    market: "groceries",
    "food store": "groceries",
    walmart: "groceries",
    target: "groceries",
    costco: "groceries",
    safeway: "groceries",
    kroger: "groceries",

    // Transportation
    gas: "transportation",
    fuel: "transportation",
    uber: "transportation",
    lyft: "transportation",
    taxi: "transportation",
    car: "transportation",
    auto: "transportation",
    parking: "transportation",
    train: "transportation",
    bus: "transportation",

    // Housing
    rent: "housing",
    mortgage: "housing",
    apartment: "housing",
    home: "housing",
    property: "housing",

    // Utilities
    electric: "utilities",
    water: "utilities",
    "gas bill": "utilities",
    internet: "utilities",
    wifi: "utilities",
    phone: "utilities",
    mobile: "utilities",
    utility: "utilities",

    // Entertainment
    movie: "entertainment",
    netflix: "entertainment",
    hulu: "entertainment",
    disney: "entertainment",
    spotify: "entertainment",
    "apple music": "entertainment",
    concert: "entertainment",
    theater: "entertainment",
    game: "entertainment",
    steam: "entertainment",

    // Shopping
    amazon: "shopping",
    ebay: "shopping",
    etsy: "shopping",
    clothing: "shopping",
    shoes: "shopping",
    mall: "shopping",
    store: "shopping",

    // Health
    doctor: "health",
    medical: "health",
    pharmacy: "health",
    hospital: "health",
    dental: "health",
    healthcare: "health",
    insurance: "health",

    // Income
    salary: "income",
    paycheck: "income",
    deposit: "income",
    "payment received": "income",
    refund: "income",
    "tax return": "income",
    dividend: "income",
    interest: "income",

    // Travel
    hotel: "travel",
    flight: "travel",
    airline: "travel",
    airbnb: "travel",
    vacation: "travel",
    trip: "travel",

    // Education
    tuition: "education",
    school: "education",
    college: "education",
    university: "education",
    book: "education",
    course: "education",

    // Personal Care
    haircut: "personal",
    salon: "personal",
    spa: "personal",
    gym: "personal",
    fitness: "personal",
  }

  // Check if description contains any keywords
  for (const [keyword, categoryType] of Object.entries(keywordMap)) {
    if (lowerDesc.includes(keyword)) {
      // Find matching category by type or name
      const matchingCategory = categories.find(
        (cat) => cat.name.toLowerCase().includes(categoryType) || (categoryType === "income" && cat.type === "income"),
      )

      if (matchingCategory) {
        return matchingCategory._id
      }
    }
  }

  return null
}

