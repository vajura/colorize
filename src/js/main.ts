class Colorize {
	public interval: number = 1000 / 120;
	public timeoutIndex: number;
	public domWidth: number = 10;
	public domHeight: number = 10;
	public totalSize: number;
	public xPos: number;
	public yPos: number;

	private canv: HTMLCanvasElement;
	private ctx: any;
	private imageData: any;
	private data32: Uint32Array;

	private colorArray: number[] = [];
	private randArray: number[] = [];
	private moveArray: Point[] = [];
	private pixel1dField: Point[] = [];
	private pixel2dField: Point[][] = [];
	private counter: number = 0;

	constructor(options: ColorizeOptions) {
		const domRect: any = document.getElementById(options.domId).getBoundingClientRect();
		(<HTMLCanvasElement>document.getElementById(options.domId)).height = domRect.height;
		(<HTMLCanvasElement>document.getElementById(options.domId)).width = domRect.width;
		this.domWidth = domRect.width;
		this.domHeight = domRect.height;
		this.totalSize = this.domWidth * this.domHeight;
		this.xPos = options.startingX ? options.startingX : 1;
		this.yPos = options.startingY ? options.startingY : 1;
		if (options.overrideStartToCenter) {
			this.xPos = Math.round(domRect.width / 2);
			this.yPos = Math.round(domRect.height / 2);
		}
		for (let a = 0; a < this.domHeight; a++) {
			this.pixel2dField[a] = [];
		}
		for (let a = 0; a < this.domHeight; a++) {
			this.pixel2dField[a][0] = {x: 0, y: a};
			this.pixel2dField[a][this.domWidth - 1] = {x: this.domWidth - 1, y: a};
		}
		for (let a = 0; a < this.domWidth; a++) {
			this.pixel2dField[0][a] = {x: a, y: 0};
			this.pixel2dField[this.domHeight - 1][a] = {x: a, y: this.domHeight - 1};
		}
		this.pixel2dField[this.yPos][this.xPos] = ({x: this.xPos, y: this.yPos});
		this.pixel1dField.push(this.pixel2dField[this.yPos][this.xPos]);

		this.canv = <HTMLCanvasElement>document.getElementById(options.domId);
	  this.ctx = this.canv.getContext('2d');
		this.imageData = this.ctx.createImageData(this.domWidth, this.domHeight);
		this.data32 = new Uint32Array(this.imageData.data.buffer);

		this.randArray.push(4);
		this.randArray.push(5);
		this.randArray.push(3);
		this.generateMoveArray();
		this.generateColorArray();
		setTimeout(() => {
			this.draw();
		}, this.interval);
	}

	public draw() {
		this.timeoutIndex = setTimeout(() => {
			for (let b = 0; b < 200; b++) {
				for (let a = 0; a < 8; a++) {
					const newX = this.xPos + this.moveArray[a].x;
					const newY = this.yPos + this.moveArray[a].y;
					if (!this.pixel2dField[newY][newX]) {
						this.pixel2dField[newY][newX] = {x: newX, y: newY};
						this.pixel1dField.push(this.pixel2dField[newY][newX]);
					}
				}
				this.xPos = this.pixel1dField[this.pixel1dField.length - this.randArray[this.counter % this.randArray.length]].x;
				this.yPos = this.pixel1dField[this.pixel1dField.length - this.randArray[this.counter % this.randArray.length]].y;
				this.pixel1dField.splice(this.pixel1dField.length - this.randArray[this.counter % this.randArray.length], 1);
				this.data32[this.xPos + this.yPos * this.domWidth] = this.colorArray[this.counter % this.colorArray.length];
			}
			this.counter++;
			this.ctx.putImageData(this.imageData, 0, 0);
			this.draw();
			// clearInterval(intervalIndex);
		}, this.interval);
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

	private generateColorArray() {
		let cVal = 0xFFFF0000;
		this.colorArray.push(cVal);
		for (let a = 0; a < 16; a++) {
			cVal += 0x00000F00;
			cVal -= 0x000F0000;
			this.colorArray.push(cVal);
		}
		for (let a = 0; a < 16; a++) {
			cVal += 0x0000000F;
			cVal -= 0x00000F00;
			this.colorArray.push(cVal);
		}
		for (let a = 0; a < 16; a++) {
			cVal += 0x000F0000;
			cVal -= 0x0000000F;
			this.colorArray.push(cVal);
		}
	}
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
}

document.addEventListener('DOMContentLoaded', (event) => {
	const colorizeDom = new Colorize({
		domId: 'canvasContainer',
		startingX: 250,
		startingY: 5
	});
});