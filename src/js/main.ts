class Colorize {
	public interval: number = 1000 / 120;
	public timeoutIndex: number;
	public domWidth: number = 10;
	public domHeight: number = 10;
	public totalCounter: number;
	public xPos: number;
	public yPos: number;
	public speed: number;

	private canv: HTMLCanvasElement;
	private ctx: any;
	private imageData: any;
	private data32: Uint32Array;

	private colorArray: number[] = [];
	private randArray: number[] = [];
	private moveArray: Point[] = [];
	private pixel1dField: Point[] = [];
	private pixel2dField: number[][] = [];
	private counter: number = 0;
	private currentLevel: number = -1;
	private currentLevelPlusOne: number = 0;
	private doNextGeneration: boolean = false;
	private ccArray: CustomColors[] = [];
	private ccArrayCounter: number = 0;

	constructor(options: ColorizeOptions) {
		this.speed = options.speed | 200;
		const domRect: any = document.getElementById(options.domId);
		(<HTMLCanvasElement>document.getElementById(options.domId)).height = Math.round(domRect.clientHeight);
		(<HTMLCanvasElement>document.getElementById(options.domId)).width = Math.round(domRect.clientWidth);
		this.domWidth = Math.round(domRect.clientWidth);
		this.domHeight = Math.round(domRect.clientHeight);
		this.xPos = options.startingX | 1;
		this.yPos = options.startingY | 1;
		if (options.overrideStartToCenter) {
			this.xPos = Math.round(domRect.width / 2);
			this.yPos = Math.round(domRect.height / 2);
		}
		this.nextGeneration();
		this.generateMoveArray();

		this.canv = <HTMLCanvasElement>document.getElementById(options.domId);
	  this.ctx = this.canv.getContext('2d');
		this.imageData = this.ctx.createImageData(this.domWidth, this.domHeight);
		this.data32 = new Uint32Array(this.imageData.data.buffer);

		this.randArray.push(11);
		this.ccArray.push({c1: 'rgb(255, 0, 0)', c2: 'rgb(0, 255, 0)', steps: 32});
		this.ccArray.push({c1: 'rgb(0, 255, 0)', c2: 'rgb(0, 0, 255)', steps: 32});
		this.ccArray.push({c1: 'rgb(0, 0, 255)', c2: 'rgb(255, 0, 0)', steps: 32});
		this.generateColorArray([this.ccArray[this.ccArrayCounter]] as CustomColors[]);
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
					if (this.pixel2dField[newY][newX] === this.currentLevel) {
						this.pixel2dField[newY][newX] = this.currentLevelPlusOne;
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
				this.ccArrayCounter++;
				this.generateColorArray([this.ccArray[this.ccArrayCounter % this.ccArray.length]] as CustomColors[]);
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

	private nextGeneration(initArray: boolean = true) {
		this.currentLevel++;
		this.currentLevelPlusOne++;
		this.totalCounter = this.domWidth * this.domHeight - this.domWidth * 2 - this.domHeight * 2 + 3;
		if (initArray) {
			for (let a = 0; a < this.domHeight; a++) {
				this.pixel2dField[a] = [];
				for (let b = 0; b < this.domWidth; b++) {
					this.pixel2dField[a][b] = this.currentLevel;
				}
			}
		}
		for (let a = 0; a < this.domHeight; a++) {
			this.pixel2dField[a][0] = this.currentLevelPlusOne;
			this.pixel2dField[a][this.domWidth - 1] = this.currentLevelPlusOne;
		}
		for (let a = 0; a < this.domWidth; a++) {
			this.pixel2dField[0][a] = this.currentLevelPlusOne;
			this.pixel2dField[this.domHeight - 1][a] = this.currentLevelPlusOne;
		}
		this.pixel2dField[this.yPos][this.xPos] = this.currentLevelPlusOne;
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

interface ColorizeOptions {
	domId?: string;
	startingX?: number;
	startingY?: number;
	overrideStartToCenter?: boolean;
	speed?: number;
}

document.addEventListener('DOMContentLoaded', (event) => {
	const colorizeDom = new Colorize({
		domId: 'canvasContainer',
		startingX: 250,
		startingY: 5,
		overrideStartToCenter: true,
		speed: 600
	});
});