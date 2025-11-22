export type ContextMenuHandler = (el?: HTMLElement | null) => void;

export type ContextMenuItem = {
  text?: string;
  subText?: string;
  divider?: boolean;
  disable?: boolean;
  hide?: boolean;
  handler?: ContextMenuHandler;
  children?: ContextMenuItem[];
};

export type Axis = { x: number; y: number };
