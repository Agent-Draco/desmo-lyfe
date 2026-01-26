interface InventoryViewProps {
  inventory: InventoryItemType[];
  onItemClick: (id: string) => void;
  onOpenItem?: (id: string) => void;
  onTapItem?: (id: string) => void;
  loading?: boolean;
}
=======
interface InventoryViewProps {
  inventory: InventoryItemType[];
  onItemClick: (id: string) => void;
  onOpenItem?: (id: string) => void;
  onTapItem?: (id: string) => void;
  loading?: boolean;
}
