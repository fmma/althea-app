import { Webpart } from "../webpart";
import { Model } from "../model";

export class EmptyPage extends Webpart<Model> {
    dom(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

export default EmptyPage
