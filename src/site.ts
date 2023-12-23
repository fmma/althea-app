import { Model, loadModel } from "./model";
import { Page } from "./page";

export class Site {
    activePage: number;
    model: Promise<Model>;

    defaultPage = "#pages/frontpage";
    pages: Promise<Page<Model>[]>;

    constructor() {
        this.activePage = -1;
        this.model = loadModel(true);
        this.model.then(() => this.hashChanged());
        this.pages =
        this.model.then(model => 
            [
            new Page<Model>(model, "#pages/frontpage", () => 
                [ import("./webparts/menu") 
                , import("./webparts/sleepAndFeed")
                , import("./webparts/gantt")
                , import("./webparts/althea")
                ]),
            new Page<Model>(model, "#pages/stats", () =>
                [ import("./webparts/menu") 
                , import("./webparts/stats")
                ]),
            new Page<Model>(model, "#pages/manu", () => 
                [ import("./webparts/menu") 
                , import("./webparts/manu")
                ]),
            new Page<Model>(model, "#pages/backup", () => 
                [ import("./webparts/backup")
                ]),
            new Page<Model>(model, "#pages/login", () => 
                [ import("./webparts/menu") 
                , import("./webparts/login")
                ]),
            ]);
        window.onhashchange = () => this.hashChanged();
        
        // this.swipeMenu();
    }

    hashChanged() {
        this.switchPage(window.location.hash || this.defaultPage);
    }

    async switchPageIndex(page: number) {
        const frag = document.createDocumentFragment();
        const pages = await this.pages;
        if(page < 0 || page >= pages.length) {
            throw new Error("Bad page index");
        }
        if(this.activePage > -1) {
            pages[this.activePage].takeDown();
        }
        pages[page].draw();
        this.activePage = page;
        if(document.body) {
            pages[page].attachTo(document.body);
        }
        else {
            window.onload = () => {
                pages[page].attachTo(document.body);
            }
        }
    }

    async switchPage(pageName: string) {
        const frag = document.createDocumentFragment();
        const pages = await this.pages;
        const page = pages.findIndex(p => p.location === pageName);
        if(page > -1) {
            this.switchPageIndex(page);
        }
        else {
            console.error("Page not found!: ", pageName)
        }
    }

    swipeMenu() {
        document.addEventListener('touchstart', handleTouchStart, false);
        document.addEventListener('touchmove', handleTouchMove, false);

        let xDown: number | null = null;
        let yDown: number | null = null;

        const his = this;

        function handleTouchStart(event: Event) {
            const evt = event as TouchEvent;
            xDown = evt.touches[0].clientX;
            yDown = evt.touches[0].clientY;
        };


        function handleTouchMove(event: Event) {
            const evt = event as TouchEvent;
            if (!xDown || !yDown) {
                return;
            }

            var xUp = evt.touches[0].clientX;
            var yUp = evt.touches[0].clientY;

            var xDiff = xUp - xDown;
            var yDiff = yUp - yDown;

            if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
                if (xDiff > 50) {
                    /* left swipe */
                    his.switchPageIndex(his.activePage-1);
                    /* reset values */
                    xDown = null;
                    yDown = null;
                } else if(xDiff < -50) {
                    /* right swipe */
                    /* reset values */
                    xDown = null;
                    yDown = null;
                }
            } else {
                if (yDiff > 0) {
                    /* up swipe */
                } else {
                    /* down swipe */
                }
            }
        };
    }
}
