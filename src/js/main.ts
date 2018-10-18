interface ColorizeInstance {
	xPos?: number;
	yPos?: number;
	speed?: number;
	colorArray?: number[];
	timeoutIndex?: number;
	interval?: number;
	randArray?: number[];
	pixel1dField?: Point[] = [];
	customColorsCounter?: number;
	counter?: number;
}

class Colorize {
	private domWidth: number = 10;
	private domHeight: number = 10;
	private moveArray: Point[] = [];
	private customColors: CustomColors[] = [];
	private doNextGeneration: boolean = false;
	private currentGen: number = -1;
	private currentGenPlusOne: number = 0; // performance reasons
	private pixel2dField: number[][] = [];

	private canv: HTMLCanvasElement;
	private ctx: any;
	private imageData: any;
	private data32: Uint32Array;

	private totalCounter: number;

	private instances: ColorizeInstance[] = [];

	constructor(options: ColorizeOptions) {
		const domRect: any = document.getElementById(options.domId);
		(<HTMLCanvasElement>document.getElementById(options.domId)).height = Math.round(domRect.clientHeight);
		(<HTMLCanvasElement>document.getElementById(options.domId)).width = Math.round(domRect.clientWidth);
		this.domWidth = Math.round(domRect.clientWidth);
		this.domHeight = Math.round(domRect.clientHeight);

		this.canv = <HTMLCanvasElement>document.getElementById(options.domId);
	  this.ctx = this.canv.getContext('2d');
		this.imageData = this.ctx.createImageData(this.domWidth, this.domHeight);
		this.data32 = new Uint32Array(this.imageData.data.buffer);

		this.generateMoveArray();
		this.generateCustomColors();

		for (let a = 0; a < options.startingPoints.length; a++) {

		}

		this.speed = options.speed | 200;
		this.xPos = options.startingX | 1;
		this.yPos = options.startingY | 1;
		if (options.overrideStartToCenter) {
			this.xPos = Math.round(domRect.width / 2);
			this.yPos = Math.round(domRect.height / 2);
		}

		this.nextGeneration(true);

		this.generateColorArray([this.customColors[this.customColorsCounter]] as CustomColors[]);
		setTimeout(() => {
			this.draw();
		}, this.interval);
	}

	public draw() {
		this.timeoutIndex = setTimeout(() => {
			let actualSpeed = this.speed;
			if (this.speed > this.totalCounter) {
				actualSpeed = this.pixel1dField.length;
			}
			for (let b = 0; b < actualSpeed; b++) {
				for (let a = 0; a < 8; a++) {
					const newX = this.xPos + this.moveArray[a].x;
					const newY = this.yPos + this.moveArray[a].y;
					if (this.pixel2dField[newY][newX] === this.currentGen) {
						this.pixel2dField[newY][newX] = this.currentGenPlusOne;
						this.pixel1dField.push({x: newX, y: newY});
						this.totalCounter--;
					}
				}
				let randArrayIndex = this.pixel1dField.length - this.randArray[this.counter % this.randArray.length];
				if (randArrayIndex > this.pixel1dField.length - 1 || randArrayIndex < 0) {
					randArrayIndex = this.pixel1dField.length - 1;
				}
				if (randArrayIndex > -1) {
					this.xPos = this.pixel1dField[randArrayIndex].x;
					this.yPos = this.pixel1dField[randArrayIndex].y;
					this.pixel1dField.splice(randArrayIndex, 1);
					this.data32[this.xPos + this.yPos * this.domWidth] = this.colorArray[this.counter % this.colorArray.length];
				}
			}
			if (this.doNextGeneration) {
				this.nextGeneration(false);
				this.customColorsCounter++;
				this.generateColorArray([this.customColors[this.customColorsCounter % this.customColors.length]] as CustomColors[]);
				this.doNextGeneration = false;
			}
			if (this.totalCounter === 0) {
				this.doNextGeneration = true;
			}
			this.counter++;
			this.ctx.putImageData(this.imageData, 0, 0);
			this.draw();
			// clearInterval(intervalIndex);
		}, this.interval);
	}

	private nextGeneration(initArray: boolean = true, textData32?: any) {
		this.currentGen++;
		this.currentGenPlusOne++;
		this.totalCounter = this.domWidth * this.domHeight - this.domWidth * 2 - this.domHeight * 2 + 3;
		if (initArray) {
			for (let a = 0; a < this.domHeight; a++) {
				this.pixel2dField[a] = [];
				for (let b = 0; b < this.domWidth; b++) {
					this.pixel2dField[a][b] = this.currentGen;
				}
			}
		}
		for (let a = 0; a < this.domHeight; a++) {
			this.pixel2dField[a][0] = this.currentGenPlusOne;
			this.pixel2dField[a][this.domWidth - 1] = this.currentGenPlusOne;
		}
		for (let a = 0; a < this.domWidth; a++) {
			this.pixel2dField[0][a] = this.currentGenPlusOne;
			this.pixel2dField[this.domHeight - 1][a] = this.currentGenPlusOne;
		}
		this.pixel2dField[this.yPos][this.xPos] = this.currentGenPlusOne;
		this.pixel1dField.push({x: this.xPos, y: this.yPos});
		this.counter = 0;
	}

	private generateMoveArray() {
		this.moveArray[0] = {x: -1, y: -1};
		this.moveArray[1] = {x: 0, y: -1};
		this.moveArray[2] = {x: 1, y: -1};
		this.moveArray[3] = {x: -1, y: 0};
		this.moveArray[4] = {x: 1, y: 0};
		this.moveArray[5] = {x: -1, y: 1};
		this.moveArray[6] = {x: 0, y: 1};
		this.moveArray[7] = {x: 1, y: 1};
	}
	private generateCustomColors() {
		this.customColors.push({c1: 'rgb(0, 0, 255)', c2: 'rgb(0, 0, 0)', steps: 16});
		this.customColors.push({c1: 'rgb(255, 0, 0)', c2: 'rgb(0, 0, 0)', steps: 16});
	}
	private generateColorArray(colors: CustomColors[]) {
		this.colorArray = [];
		for (let a = 0; a < colors.length; a++) {
			for (let b = 0; b <= colors[a].steps; b++) {
				this.colorArray.push(...this.interpolateColors(colors[a].c1, colors[a].c2, colors[a].steps));
			}
		}
	}
	private interpolateColor(color1: any, color2: any, factor: number = 0.5): number {
    const numberArray: number[] = color1.slice();
    let colorNumber: number = 0;
    for (let a = 0; a < 3; a++) {
        numberArray[a] = Math.round(numberArray[a] + factor * (color2[a] - color1[a]));
    }
    colorNumber = 0xFF000000 + numberArray[0] + numberArray[1] * 256 + numberArray[2] * 256 * 256;
    return colorNumber;
	}
	private interpolateColors(color1: any, color2: any, steps: number): number[] {
	    const stepFactor: number = 1 / (steps - 1);
	    const interpolatedColorArray: number[] = [];

	    color1 = color1.match(/\d+/g).map(Number);
	    color2 = color2.match(/\d+/g).map(Number);

	    for (let i = 0; i < steps; i++) {
        interpolatedColorArray.push(this.interpolateColor(color1, color2, stepFactor * i));
	    }

	    return interpolatedColorArray;
	}
}


interface CustomColors {
	c1: string;
	c2: string;
	steps: number;
}
interface Point {
	x: number;
	y: number;
}
interface DrawData {
	point: Point;
	array: Point[];
}
interface ColorizeOptions {
	domId: string;
	startingPoints: StartingPoint[];
}
interface StartingPoint {
	startingX?: number;
	startingY?: number;
	overrideStartToCenter?: boolean;
	speed?: number;
	text?: string;
}

document.addEventListener('DOMContentLoaded', (event) => {
	const colorizeDom = new Colorize(
  {
		domId: 'canvasContainer',
		startingPoints: [{
			startingX: 250,
			startingY: 5,
			speed: 100
		}] as StartingPoint[]
	} as ColorizeOptions);
});