import {
  HeartPulse,
  Car,
  Plane,
  PlaneTakeoff,
  ShoppingBag,
  Package,
  CreditCard,
  Smartphone,
  BedDouble,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type ClaimCategory = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  examples: string[];
};

export const CLAIM_CATEGORIES: ClaimCategory[] = [
  {
    slug: "health-insurance",
    name: "Health Insurance",
    description: "Rejected treatments, unpaid reimbursements, coverage disputes.",
    icon: HeartPulse,
    examples: ["Policy schedule", "Rejection letter", "Medical invoices"],
  },
  {
    slug: "car-insurance",
    name: "Car Insurance",
    description: "Accident claims, repair estimates and liability disagreements.",
    icon: Car,
    examples: ["Policy document", "Accident report", "Repair quote"],
  },
  {
    slug: "travel-insurance",
    name: "Travel Insurance",
    description: "Trip cancellation, lost luggage and medical abroad claims.",
    icon: Plane,
    examples: ["Travel policy", "Booking confirmation", "Receipts"],
  },
  {
    slug: "airline-compensation",
    name: "Airline Compensation",
    description: "Delays, cancellations, denied boarding and baggage issues.",
    icon: PlaneTakeoff,
    examples: ["Boarding pass", "Delay notice", "Ticket receipt"],
  },
  {
    slug: "shopping-refunds",
    name: "Shopping Refunds",
    description: "Faulty goods, refused returns and misleading descriptions.",
    icon: ShoppingBag,
    examples: ["Order receipt", "Store policy", "Photos of the item"],
  },
  {
    slug: "shipping-claims",
    name: "Shipping Claims",
    description: "Lost, delayed or damaged parcels and courier disputes.",
    icon: Package,
    examples: ["Tracking record", "Shipping label", "Damage photos"],
  },
  {
    slug: "banking-card-disputes",
    name: "Banking & Card Disputes",
    description: "Unauthorised charges, fees and chargeback requests.",
    icon: CreditCard,
    examples: ["Bank statement", "Transaction proof", "Bank response"],
  },
  {
    slug: "telecom-complaints",
    name: "Telecom Complaints",
    description: "Billing errors, contract terms and service outages.",
    icon: Smartphone,
    examples: ["Contract", "Monthly bill", "Support tickets"],
  },
  {
    slug: "hotel-booking-issues",
    name: "Hotel Booking Issues",
    description: "Overbooking, misdescribed rooms and refused refunds.",
    icon: BedDouble,
    examples: ["Booking voucher", "Cancellation policy", "Photos"],
  },
  {
    slug: "product-warranty",
    name: "Product Warranty",
    description: "Warranty refusals, repair delays and replacement rights.",
    icon: ShieldCheck,
    examples: ["Warranty card", "Purchase invoice", "Service report"],
  },
];

export function getCategory(slug: string): ClaimCategory | undefined {
  return CLAIM_CATEGORIES.find((category) => category.slug === slug);
}