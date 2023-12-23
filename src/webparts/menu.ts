import { Webpart } from "../webpart";
import { Model } from "../model";

class Menu extends Webpart<Model> {

    async dom() {
        this.link("Forside", "#pages/frontpage");
        this.div._text("--");
        this.link("Statistik", "#pages/stats");
        this.div._text("--");
        this.link("Manu", "#pages/manu");
    }

    private link(name: string, location: string) {
        const link = this.div._link(name, location);
        if(window.location.hash === location) {
            link.style.border = "1px solid black";
            link.style.borderRadius = "5px";
        }
    }
}

export default Menu