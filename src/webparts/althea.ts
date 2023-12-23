import { Model } from '../model';
import { Webpart } from '../webpart';

class AltheaAnim extends Webpart<Model> {
    twerp = 0.0;

    anim = () => {};

    constructor(model: Model) {
        super(model);
        const f = () => {
            this.anim();
            animFix();
        }
        const animFix = () => {
            window.requestAnimationFrame(f);
        }
        animFix();
    }

    async dom() {
        const img = this.div._div()._img("resources/apple-icon-180x180.png");
        this.anim = () => {
            this.twerp += 0.01;
            img.style.marginLeft = ((window.innerWidth - 220) * (0.5 + Math.cos(this.twerp)/2)) + "px";
        }
    }
}

export default AltheaAnim