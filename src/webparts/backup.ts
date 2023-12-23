import { Webpart } from "../webpart";
import { Model } from "../model";

class Backup extends Webpart<Model> {
    async dom(): Promise<void> {
        this.div._pre(
            JSON.stringify(this.model, null, " ")
        );
    }
}

export default Backup;