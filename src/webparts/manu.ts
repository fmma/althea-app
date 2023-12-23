import { Period, saveModel, Model } from '../model';
import { RowProvider, PagedTableElement } from '../dom';
import { Webpart } from '../webpart';

class Manu extends Webpart<Model> {
    feedTable!: PagedTableElement;
    sleepTable!: PagedTableElement;

    async dom() {
        this.makeControlButtons();
        this.makeFeedTable();
        this.makeSleepTable();
    }

    makeControlButtons() {
        const buttonsDiv = this.div._div();
        buttonsDiv._button("Gem det hele", () => {
            saveModel(this.model);
        })
        buttonsDiv._button("Sorter", () => {
            this.model.sleep.sort((a,b) => a.t0 - b.t0);
            this.model.feed.sort((a,b) => a.t0 - b.t0);
            this.feedTable.redraw();
            this.sleepTable.redraw();
        });
    }

    makeFeedTable() {
        this.div._paragraph("Amning").style.fontWeight = "bold";
        const columns = ["Start", "Slut", "Højre", "Venstre"];

        this.makeCreateRow(columns, this.model.feed, this.feedTable, true);
        const rowProvider = this.createRowProvider(this.model.feed, true, 1);
        this.feedTable = this.div._pagedTable(columns, 10, rowProvider);
        this.feedTable.redraw();
    }

    makeCreateRow(columns: string[], series: Period[], table: PagedTableElement, hv: boolean) {
        const createPeriod: Period = {t0: 0};
        const createRow = this.div._table(... columns)._tr();
        this.createRowProvider([createPeriod], hv, 0)().ith(0, createRow);
        createRow._td()._button("Opret", () => {
            series.push({... createPeriod});
            series.sort((a,b) => a.t0 - b.t0);
            table.redraw();
        })
    }

    makeSleepTable() {
        this.div._paragraph("Søvn").style.fontWeight = "bold";
        const columns = ["Start", "Slut"];

        this.makeCreateRow(columns, this.model.sleep, this.sleepTable, false);

        const rowProvider = this.createRowProvider(this.model.sleep, false, 1);
        this.sleepTable = this.div._pagedTable(columns, 10, rowProvider);
        this.sleepTable.redraw();
    }

    createRowProvider(series: Period[], hv: boolean, tableNum: number): RowProvider {
        const rp = new ManuRowProvider(this, series, hv, tableNum);
        return () => rp;
    }
}

class ManuRowProvider {
    readonly manu: Manu;
    readonly series: Period[];
    readonly hv: boolean;
    readonly tableNum: number;
    readonly date = new Date();
    constructor(manu: Manu, series: Period[], hv: boolean, tableNum: number) {
        this.manu = manu;
        this.series = series;
        this.hv = hv;
        this.tableNum = tableNum;
    }
    
    get n(): number {
        return this.series.length;
    } 

    ith(j: number, row: HTMLTableRowElement) {
        const i = this.series.length - j - 1;
        this.date.setTime(this.series[i].t0);
        row._td()._inputDateTime(
            this.date,
            () => {
                this.series[i].t0 = this.date.getTime();
            }
        )
        this.date.setTime(this.series[i].t1 || 0);
        row._td()._inputDateTime(
            this.date,
            () => {
                this.series[i].t1 = this.date.getTime();
            }
        )
        if(this.hv) {
            row._td()._checkbox(this.series[i].h || false, b => {
                this.series[i].h = b;
            });
            row._td()._checkbox(this.series[i].v || false, b => {
                this.series[i].v = b;
            });
        }
        if(this.tableNum > 0) {
            row._td()._button("Slet", () => {
                this.series.splice(i, 1);
                if(this.tableNum == 1)
                    this.manu.feedTable.redraw();
                else 
                    this.manu.sleepTable.redraw(); 
            });
        }
    }
}

export default Manu