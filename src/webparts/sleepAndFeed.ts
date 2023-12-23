import { saveModel, Model } from '../model';
import { formatTime } from '../dom';
import { Webpart } from '../webpart';

class FrontPage extends Webpart<Model> {
    nextTimeSleep = 1.5;
    nextTimeFeed = 2.75;

    async dom() {
        this.makeControl("sleep");
        this.div._hr();
        this.makeControl("feed");
    }
    
    private cell(row: Node, bold: boolean, cellWidth: string): HTMLSpanElement {
        const cell = row._span();
        cell.style.fontWeight = bold ? "bold" : "normal";
        cell.style.width = cellWidth;
        cell.style.textAlign = "center";
        cell.style.display = "inline-block";
        return cell;
    }

    makeControl(key: "sleep" | "feed") {
        const colWidth = "50%";
        const displayName = key === "sleep" ? "Søvn" : "Amning";
        const nextTime = key === "sleep" ? this.nextTimeSleep : this.nextTimeFeed;
        const series = this.model[key];
        const open = series.length > 0 && series[series.length-1].t1 == null;
        const firstRow = this.div._div();
        const secondRow = this.div._div();
        const displayNameCell = this.cell(firstRow, false, colWidth);
        displayNameCell.style.textAlign = "left";
        displayNameCell.style.verticalAlign ="top";
        displayNameCell.style.fontVariant = "small-caps";
        displayNameCell._text(displayName);
        if(open) {
            const button = firstRow._button("Slut", async () => {
                series[series.length-1].t1 = new Date().getTime();
                button.disabled = true;
                await saveModel(this.model);
                button.disabled = false;
                await this.drawPage();
            });
            button.style.width = colWidth;
            const time = this.cell(secondRow, true, colWidth)
                ._text(formatTime(new Date(new Date().getTime() - series[series.length-1].t0), true));
            this.ticks[key] = () => {
                time.textContent = formatTime(new Date(new Date().getTime() - series[series.length-1].t0), true);
                // drawSite(parent, model, reso);
            };
        }
        else {
            const button = firstRow._button("Start", async () => {
                this.model[key].push({t0: new Date().getTime()});
                button.disabled = true;
                await saveModel(this.model);
                button.disabled = false;
                this.drawPage();
            });
            button.style.width = colWidth;
            const timeCell = this.cell(secondRow, false, colWidth);
            if(series.length > 0) {
                const t = series[series.length-1].t1;
                if(t == null)
                    throw "";
                const time = timeCell._text(formatTime(new Date(new Date().getTime() - t), true));
                this.ticks[key] = () => {
                    time.textContent = formatTime(new Date(new Date().getTime() - t), true);
                };
            }
            else {
                const time = timeCell._text("");
                this.ticks[key] = () => {};
            }
        }
        const regret = secondRow._button("Fortryd", async () => {
            series.pop();
            regret.disabled = true;
            await saveModel(this.model);
            regret.disabled = false;
            this.drawPage();
        });
        regret.hidden = !open;
        regret.style.width = colWidth;
        
        if(series.length > 0 && !open) {
            const t = series[series.length-1].t1;
            if(t) {
                const cont = this.cell(secondRow, false, colWidth);
                const d = new Date(t + nextTime * 3600*1000);
                const ttt = cont._text(formatTime(d, false));
                cont.style.background = (key === "sleep") === (new Date().getTime() > d.getTime()) ? "pink" : "lightgreen";
                this.ticks[key + "Next"] = () => {
                    cont.style.background = (key === "sleep") === (new Date().getTime() > d.getTime()) ? "pink" : "lightgreen";
                };
            } else {
                const cont = this.cell(secondRow, false, colWidth);
                cont.hidden = true;
                cont._text("");
                this.ticks[key + "Next"] = () => {};
            }
        } else {
            const cont = this.cell(secondRow, false, colWidth);
            cont.hidden = true;
            cont._text("");
            this.ticks[key + "Next"] = () => {};
        }
        if(key == "feed") {
            this.cell(this.div,true, colWidth);
            const hv = this.cell(this.div, false, colWidth);
            const disabled = !(this.model.feed.length > 0 && this.model.feed[this.model.feed.length - 1].t1 == null);
            hv._text("V");
            hv._checkbox(series[series.length-1] && series[series.length-1].v || false, 
                b => {
                    series[series.length-1].v = b;
                }
            ).disabled = disabled;
            hv._text("H");
            hv._checkbox(series[series.length-1] && series[series.length-1].h || false, 
                b => {
                    series[series.length-1].h = b;
                }
            ).disabled = disabled;
        }
    }
}

export default FrontPage