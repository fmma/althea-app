import { Webpart, WebpartConstructor } from "./webpart";

interface WebpartModule<M> {
    default: WebpartConstructor<M>;
}

export class Page<M> extends Webpart<M> {

    private webpartsThunk: Promise<Webpart<M>[]> | null = null;

    constructor(model: M, readonly location: string, readonly lazyWebpartModules: () => Promise<WebpartModule<M>>[]) {
        super(model);
    }
    
    async dom() {
        const webparts = await this.getWebparts();
        webparts.forEach(webpart => webpart.draw());
    }

    private getWebparts(): Promise<Webpart<M>[]> {
        if(this.webpartsThunk != null)
            return this.webpartsThunk;
        this.webpartsThunk = this.loadWebparts();
        return this.webpartsThunk;
    }

    private async loadWebparts(): Promise<Webpart<M>[]> {
        const modules = await Promise.all(this.lazyWebpartModules());
        const webparts = modules.map(module => {
            const webpart = new module.default(this.model);
            webpart.attachToPage(this);
            return webpart;
        });
        return webparts;
    }
}