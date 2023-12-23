import { average, total, invert, sliceWindow, Model, ClosedPeriod } from '../model';
import { formatTime, formatDate } from '../dom';
import { Webpart } from '../webpart';

class Stats extends Webpart<Model> {
    avgMode = 0;

    stats = [
        new Stat("Start", () => formatDate(new Date(Math.min(this.model.feed[0].t0, this.model.sleep[0].t0)))),
        new Stat("Varighed", (w, d, today) => formatTime(new Date(today - Math.min(this.model.feed[0].t0, this.model.sleep[0].t0)), true, false)),
        new Stat("#amninger", w => sliceWindow(this.model.feed, w, true).length, true),
        new Stat("#amninger/døgn", (w, d) => sliceWindow(this.model.feed, w, true).length / d),
        new Stat("<amning>", w => new Date(average(sliceWindow(this.model.feed, w, false)))),
        new Stat("<ml. amning>", w => new Date(average(sliceWindow(invert(this.model.feed), w, false)))),
        new Stat("#lure", w => sliceWindow(this.model.sleep, w, true).length, true),
        new Stat("#lure/døgn", (w, d) => sliceWindow(this.model.sleep, w, true).length / d),
        new Stat("søvn/døgn", (w, d) => new Date(total(sliceWindow(this.model.sleep, w, true)) / d)),
        new Stat("<lur>", w => new Date(average(sliceWindow(this.model.sleep, w, false)))),
        new Stat("<vågen>", w => new Date(average(sliceWindow(invert(this.model.sleep), w, false)))),
    ]

    async dom() {
        const sel = this.div._select(["24 timer", "en uge", "for altid"], this.avgMode, i => {
            this.avgMode = i;
            this.draw();
        });
        const paragraphs: HTMLParagraphElement[] = [];
        const pre = this.div._pre("");
        pre.style.fontSize = "16pt";
        let tab = 0;
        for(let i = 0; i < this.stats.length; ++i) {
            tab = Math.max(tab, this.stats[i].description.length);
        }
        tab += 2;

        this.ticks.updateStats = () => {
            const today = new Date().getTime();
            const days = this.avgMode == 0 ? 1 : this.avgMode == 1 ? 7 : (today - this.model.sleep[0].t0) / (24 * 3600 * 1000);
            const timeWindow = {t0: this.avgMode == 0 ? today - 24 * 3600 * 1000 : this.avgMode == 1 ? today - 7 * 24 * 3600 * 1000 : 0, t1: today};
            let lines: string[] = [];
            for(let i = 0; i < this.stats.length; ++i) {
                lines.push(this.stats[i].render(tab, timeWindow, days, today));
            }
            pre.textContent = lines.join("\n");
        }
        this.ticks.updateStats();
    }
}

export default Stats


class Stat {
    constructor(
        readonly description: string, 
        readonly f: (timeWindow: ClosedPeriod, days: number, today: number) => Date | number | string, 
        readonly wholeNumber = false) {
    }

    render(tab: number, timeWindow: ClosedPeriod, days: number, today: number): string {
        const stat = this.renderStat(timeWindow, days, today);
        return this.description  + (".".repeat(tab - this.description.length + (10 - stat.length))) + stat;
    }

    private renderStat(timeWindow: ClosedPeriod, days: number, today: number): string {
        const res = this.f(timeWindow, days, today);
        if(typeof(res) === "number") {
            return this.wholeNumber ? res.toFixed(0) : res.toFixed(2);
        }
        if(typeof(res) === "string") {
            return res;
        }
        return formatTime(res, true);
    }
}