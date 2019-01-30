export interface ColorizeInstance {
  xPos?: number;
  yPos?: number;
  speed?: number;
  timeoutIndex?: number;
  interval?: number;
  randArray?: number[];
  pixel1dOldLength?: number;
  pixel1dField?: Point[];
  genDone?: boolean;
  selectedPalette?: number;
  counter?: number;
}

export interface Palette {
  c1: string;
  c2: string;
  steps: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ColorizeOptions {
  domId: string;
  startingPoints: StartingPoint[];
  palettes: Palette[];
  randArray: number[];
}

export interface StartingPoint {
  startingX?: number;
  startingY?: number;
  overrideStartToCenter?: boolean;
  speed?: number;
  text?: string;
  palette: number;
}