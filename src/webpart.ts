import { Page } from './page';

export interface WebpartConstructor<M> {
    new (model: M): Webpart<M>;
}

interface IWebpart<M> {
    div: HTMLDivElement;
    ticks: {[ix: string]: () => void};
    model: M;
    draw(): void;
    drawPage(): void;
    takeDown(): void;
    attachTo(node: Node): void;
    attachToPage(page: Page<M>): void;
}

export abstract class Webpart<M> implements IWebpart<M> {
    page: Page<M> | null = null;
    div: HTMLDivElement;
    private interval: NodeJS.Timer | null = null;
    ticks: {[ix: string]: () => void} = {};
    
    constructor(readonly model: M) {
        if(parent == null)
            throw new Error("Null div");
        if(model == null)
            throw new Error("Null model");
        this.div = document.createElement("div");
        this.startTicking();
    }

    private startTicking() {
        this.interval = setInterval(() => {
            if(!document.hidden) {
                for(let fun in this.ticks) {
                    this.ticks[fun]();
                }
            }
        }, 1000);
    }

    takeDown() {
        if(this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if(this.div.parentElement)
            this.div.parentElement.removeChild(this.div);
    }

    draw() {
        this.div._draw(() => this.dom());
    }

    drawPage() {
        if(this.page) {
            this.page.draw();
        }
    }

    attachTo(node: Node) {
        node.appendChild(this.div);
    }

    attachToPage(page: Page<M>) {
        this.page = page;
        this.attachTo(page.div);
    }

    protected abstract dom(): Promise<void>;
}
