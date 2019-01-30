import { ColorizeInstance, ColorizeOptions, Palette, Point, StartingPoint } from './helper';

class Colorize {
	private domWidth: number = 10;
	private domHeight: number = 10;
	private moveArray: Point[] = [];
	private colors: number[][] = [];
	private currentGen: number = -1;
	private currentGenPlusOne: number = 0; // performance reasons
	private pixel2dField: number[][] = [];

	private canv: HTMLCanvasElement;
	private ctx: any;
	private imageData: any;
	private data32: Uint32Array;
	private imagesData32: Uint32Array[] = [];

	private instances: ColorizeInstance[] = [];

	private async loadImage(image: any): Promise<Uint32Array> {
    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = <HTMLCanvasElement>document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.getContext('2d').drawImage(image, 0, 0);
        // this.imagesData32[a] = new Uint32Array(ctx.getImageData(0, 0, this.domWidth, this.domHeight).data.buffer);
        resolve(new Uint32Array(ctx.getImageData(0, 0, this.domWidth, this.domHeight).data.buffer));
      };
      image.onError = reject;
    });
	}

	private async construct(options: ColorizeOptions, imageURLs: string[]) {
    const domRect: any = document.getElementById(options.domId);
    this.domHeight = Math.round(domRect.clientHeight);
    this.domWidth = Math.round(domRect.clientWidth);
    domRect.height = this.domHeight;
    domRect.width = this.domWidth;

    this.canv = <HTMLCanvasElement>document.getElementById(options.domId);
    this.ctx = this.canv.getContext('2d');
    this.imageData = this.ctx.createImageData(this.domWidth, this.domHeight);
    this.data32 = new Uint32Array(this.imageData.data.buffer);

    for (let a = 0; a < imageURLs.length; a++) {
      const image = new Image();
      image.setAttribute('crossOrigin', '');
      image.src = imageURLs[a];
			this.imagesData32[a] = await this.loadImage(image);
      console.log(this.imagesData32[a].length);
    }
    console.log('after');
    this.generateMoveArray();

    for (let a = 0; a < options.palettes.length; a++) {
      this.colors[a] = this.generateColorArray(options.palettes[a]);
    }
    for (let a = 0; a < options.startingPoints.length; a++) {
      const sp: StartingPoint = options.startingPoints[a];
      const instance: ColorizeInstance = {};
      instance.xPos = sp.startingX || 1;
      instance.yPos = sp.startingY || 1;
      if (sp.overrideStartToCenter) {
        instance.xPos = Math.round(this.domWidth / 2);
        instance.yPos = Math.round(this.domHeight / 2);
      }
      instance.speed = sp.speed || 100;
      instance.selectedPalette = sp.palette || 0;
      instance.pixel1dField = [];
      instance.interval = 1000 / 50;
      instance.randArray = options.randArray && options.randArray.length ? options.randArray : [7];
      instance.counter = 0;
      instance.pixel1dOldLength = 0;
      instance.genDone = false;
      this.instances.push(instance);
    }
    this.resetBoardToNextGen();
    /*this.nextGen();
    for (let a = 0; a < this.instances.length; a++) {
      this.draw(this.instances[a]);
    }*/
	}
	constructor(options: ColorizeOptions, imageURLs: string[]) {
		this.construct(options, imageURLs);
	}

	private nextGen() {
		let next = true;
		for (let a = 0; a < this.instances.length; a++) {
			if (!this.instances[a].genDone) {
				next = false;
			}
		}
		if (next) {
			this.resetBoardToNextGen(false);
			for (let a = 0; a < this.instances.length; a++) {
				const instance = this.instances[a];
				this.pixel2dField[instance.yPos][instance.xPos] = this.currentGenPlusOne;
				instance.pixel1dField = [];
				instance.pixel1dField.push({x: instance.xPos, y: instance.yPos});
				instance.counter = 0;
				instance.pixel1dOldLength = 0;
				instance.genDone = false;
			}
			for (let a = 0; a < this.instances.length; a++) {
				this.draw(this.instances[a]);
			}
		}
		this.ctx.putImageData(this.imageData, 0, 0);
		requestAnimationFrame(() => {
			this.nextGen();
    });
	}

	private draw(instance: ColorizeInstance) {
		if (!instance.genDone) {
			instance.pixel1dOldLength = instance.pixel1dField.length;
			for (let b = 0; b < instance.speed; b++) {
				for (let a = 0; a < 8; a++) {
					const newX = instance.xPos + this.moveArray[a].x;
					const newY = instance.yPos + this.moveArray[a].y;
					if (this.pixel2dField[newY][newX] === this.currentGen) {
						this.pixel2dField[newY][newX] = this.currentGenPlusOne;
						instance.pixel1dField.push({x: newX, y: newY});
					}
				}
				let index = instance.pixel1dField.length - instance.randArray[instance.counter % instance.randArray.length];
				if (index >= instance.pixel1dField.length || index < 0) {
					index = instance.pixel1dField.length - 1;
				}
				if (index > -1) {
					instance.xPos = instance.pixel1dField[index].x;
					instance.yPos = instance.pixel1dField[index].y;
					instance.pixel1dField.splice(index, 1);
					this.data32[instance.xPos + instance.yPos * this.domWidth] =
						this.colors[instance.selectedPalette][instance.counter % this.colors[instance.selectedPalette].length];
				}
			}
			if (instance.pixel1dOldLength == 0 && instance.pixel1dField.length == 0) {
				instance.genDone = true;
			}
			instance.counter++;
      requestAnimationFrame(() => {
        this.draw(instance);
      });
		}
	}

	private resetBoardToNextGen(initArray: boolean = true) {
		this.currentGen++;
		this.currentGenPlusOne++;
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

	private generateColorArray(palette: Palette): number[] {
		const colors = [];
		for (let b = 0; b <= palette.steps; b++) {
			colors.push(...this.interpolateColors(palette.c1, palette.c2, palette.steps));
		}
		return colors;
	}

	private interpolateColor(color1: any, color2: any, factor: number = 0.5): number {
    const numberArray: number[] = color1.slice();
    for (let a = 0; a < 3; a++) {
        numberArray[a] = Math.round(numberArray[a] + factor * (color2[a] - color1[a]));
    }
    return 0xFF000000 + numberArray[0] + numberArray[1] * 256 + numberArray[2] * 256 * 256;
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

document.addEventListener('DOMContentLoaded', (event) => {
	const colorizeDom = new Colorize(
  {
		domId: 'canvasContainer',
		palettes: [
			{c1: 'rgb(0, 0, 255)', c2: 'rgb(0, 0, 0)', steps: 16},
			{c1: 'rgb(255, 0, 0)', c2: 'rgb(0, 0, 0)', steps: 16},
      {c1: 'rgb(0, 255, 0)', c2: 'rgb(0, 0, 0)', steps: 16},
      {c1: 'rgb(125, 125, 125)', c2: 'rgb(0, 0, 0)', steps: 16}
		],
    startingPoints: [{
			startingX: 100,
			startingY: 100,
			speed: 100,
			palette: 0
    }] as StartingPoint[]
	} as ColorizeOptions,
		['https://i.imgur.com/ZjkfV2J.png', 'https://i.imgur.com/PJAzXYz.png', 'https://i.imgur.com/NcZjxum.png']);
});