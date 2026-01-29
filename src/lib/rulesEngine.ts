// Rules engine for inventory item states and visual configurations

export type ItemState = 'new' | 'active' | 'critical' | 'listed' | 'expired';

export interface VisualStateConfig {
  variant: 'default' | 'warning' | 'destructive' | 'success';
  iconBg: string;
  iconColor: string;
  dotColor: string;
  showPulse: boolean;
}

export const getItemState = (expiryDate?: Date): ItemState => {
  if (!expiryDate) return 'active';

  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 1) return 'critical'; // Food: 24h, Meds: 48h, Electronics: 168h - using 24h as threshold
  return 'active';
};

export const getVisualStateConfig = (state: ItemState | string): VisualStateConfig => {
  switch (state) {
    case 'new':
      return {
        variant: 'default',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        dotColor: 'bg-primary',
        showPulse: false
      };
    case 'active':
      return {
        variant: 'default',
        iconBg: 'bg-secondary/50',
        iconColor: 'text-muted-foreground',
        dotColor: 'bg-secondary',
        showPulse: false
      };
    case 'critical':
      return {
        variant: 'warning',
        iconBg: 'bg-warning/20',
        iconColor: 'text-warning',
        dotColor: 'bg-warning',
        showPulse: true
      };
    case 'listed':
      return {
        variant: 'success',
        iconBg: 'bg-success/20',
        iconColor: 'text-success',
        dotColor: 'bg-success',
        showPulse: false
      };
    case 'expired':
      return {
        variant: 'destructive',
        iconBg: 'bg-destructive/20',
        iconColor: 'text-destructive',
        dotColor: 'bg-destructive',
        showPulse: false
      };
    default:
      return {
        variant: 'default',
        iconBg: 'bg-secondary/50',
        iconColor: 'text-muted-foreground',
        dotColor: 'bg-secondary',
        showPulse: false
      };
  }
};

export interface Nudge {
  type: 'recipe' | 'ebay' | 'expiry' | 'active-recipe';
  message: string;
  itemId: string;
  recipeData?: {
    title: string;
    id: number;
    image: string;
  };
}

export const generateNudges = (inventory: any[]): Nudge[] => {
  const nudges: Nudge[] = [];

  inventory.forEach(item => {
    const state = getItemState(item.expiry_date ? new Date(item.expiry_date) : undefined);

    // Active recipe nudges for food items (not expired)
    if (item.category?.toLowerCase().includes('food') && state !== 'expired') {
      nudges.push({
        type: 'active-recipe',
        message: `Try a new recipe with ${item.name}`,
        itemId: item.id
      });
    }

    if (state === 'critical' && item.category?.toLowerCase().includes('food')) {
      nudges.push({
        type: 'recipe',
        message: `Use ${item.name} in a recipe before it expires`,
        itemId: item.id
      });
    }

    if (state === 'critical' && item.category?.toLowerCase().includes('electronics')) {
      nudges.push({
        type: 'ebay',
        message: `Consider selling ${item.name} on eBay`,
        itemId: item.id
      });
    }

    if (state === 'expired') {
      nudges.push({
        type: 'expiry',
        message: `${item.name} has expired - time to dispose`,
        itemId: item.id
      });
    }
  });

  return nudges;
};
