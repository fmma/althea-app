import aws = require('aws-sdk');
import Auth from './auth';

const userID = "althea";

export interface Period {
    t0: number,
    t1?: number;
    h?: boolean;
    v?: boolean;
}

export interface ClosedPeriod {
    t0: number,
    t1: number;
}

export interface Model {
    sleep: Period[];
    feed: Period[];
    version: number | null;
}

export function sliceWindow(series: Period[], p: Period, cutoff: boolean): Period[] {
    const today = new Date().getTime();
    const result = series.filter(p0 => p0.t0 < (p.t1 || today) && p.t0 < (p0.t1 || today));
    if(cutoff && result.length > 0) {
        result[0] = 
          { t0: result[0].t0 < p.t0 ? p.t0 : result[0].t0
          , t1 : result[0].t1
          };
        result[result.length-1] = 
          { t0: result[result.length-1].t0
          , t1 : (result[result.length-1].t1 || today) > (p.t1 || today) ? (p.t1 || today) : (result[result.length-1].t1 || today)
          };
    }
    return result;
}

export function closed(series: Period[]): ClosedPeriod[]{
    const result : ClosedPeriod[] = [];
    for(let i = 0; i < series.length; ++i) {
        const p = series[i]
        if(p.t1 != null) {
            result.push({t0: p.t0, t1: p.t1});
        }
    }
    return result;
}

export function invert(series: Period[]): ClosedPeriod[] {
    const result : ClosedPeriod[] = [];
    if(series.length === 0)
        return result;
    let t = series[0].t1;
    for(let i = 0; i < series.length; ++i) {
        const p = series[i]
        if(t != null) {
            result.push({t0: t, t1: p.t0});
        }
        t = p.t1;
    }
    return result;
}

export function total(series: Period[]): number{
    const lengths = closed(series).map(({t0: t0, t1: t1}) => t1 - t0);
    if(lengths.length === 0)
        return 0;   
    return lengths.reduce((a,b) => a+b);
}

export function average(series: Period[]): number{
    const lengths = closed(series).map(({t0: t0, t1: t1}) => t1 - t0);
    if(lengths.length === 0)
        return 0;   
    return lengths.reduce((a,b) => a+b) / lengths.length;
}

export async function saveModel(model: Model) {
    return saveModelUserID("vaegt-api", "AKIAIWAB4KO6GED7WCIQ", "apevBQ09w3Z3FjuOPjFLUPlO92KB6+PhKmlCkfWB", userID, model);
}

export async function saveModelUserID(tableName: string, accessKeyId: string, secrectAccesKey: string, userID: string, model: Model, force = true) {
    const currentModel = await loadModel(true);
    if(!force && model.version !== currentModel.version){
        alert("Du kan ikke gemme da data er forældet. Genindlæs appen og prøv igen. " + model.version + " " + currentModel.version);
        return;
    }
    if(!force && location.hostname == "localhost") {
        console.warn("Hostname is localhost. Save will not persist.")
        seriesCache[name] = model;
        return;
    }
    if(model !== currentModel) {
        model.version = 1 + (model.version || 0);
    }
    const docClient = new aws.DynamoDB.DocumentClient( {
        region: "eu-west-1",
        endpoint: "https://dynamodb.eu-west-1.amazonaws.com", 
        convertEmptyValues: true,
        credentials: aws.config.credentials
    }); 

    const updateParams =
    {
        TableName: tableName,
        Key: {"userID": userID},
        UpdateExpression: "set m = :m",
        ExpressionAttributeValues:{
            ":m": model
        },
        ReturnValues:"UPDATED_NEW"
    }
    seriesCache[name] = model;
    docClient.update(updateParams, (err, data) => {
        if (err) {
            console.log("Error JSON: " + JSON.stringify(err) + "\n");
        } else {
            console.log("PutItem succeeded: " + data + "\n");
        }
    });
}

export async function saveModel2(model: Model, force = true) {
    const currentModel = await loadModel(true);
    const userId = await Auth.getUserId();
    if(!force && model.version !== currentModel.version){
        alert("Du kan ikke gemme da data er forældet. Genindlæs appen og prøv igen. " + model.version + " " + currentModel.version);
        return;
    }
    if(!force && location.hostname == "localhost") {
        console.warn("Hostname is localhost. Save will not persist.")
        seriesCache[name] = model;
        return;
    }
    if(model !== currentModel) {
        model.version = 1 + (model.version || 0);
    }
    const docClient = new aws.DynamoDB.DocumentClient( {
        region: "eu-west-1",
        endpoint: "https://dynamodb.eu-west-1.amazonaws.com", 
        convertEmptyValues: true,
        credentials: aws.config.credentials
    }); 

    const updateParams =
    {
        TableName: "althea",
        Key: {"userID": await Auth.getUserId()},
        UpdateExpression: "set m = :m",
        ExpressionAttributeValues:{
            ":m": model
        },
        ReturnValues:"UPDATED_NEW"
    }
    seriesCache[name] = model;
    docClient.update(updateParams, (err, data) => {
        if (err) {
            console.log("Error JSON: " + JSON.stringify(err) + "\n");
        } else {
            console.log("PutItem succeeded: " + data + "\n");
        }
    });
}

var seriesCache : {[ix: string]: Model} = {};

export function loadModel2(force : boolean): Promise<Model> {
    if(!force && seriesCache[userID])
        return Promise.resolve(seriesCache[userID]);
    return new Promise((resolve, reject) => {
        const docClient = new aws.DynamoDB.DocumentClient( {
            region: "eu-west-1",
            endpoint: "https://dynamodb.eu-west-1.amazonaws.com", 
            convertEmptyValues: true,
            credentials: aws.config.credentials
        }); 

        var params = {
            TableName: "althea",
            Key:{
                "userID": Auth.getUserId()
            }
        };
        docClient.get(params, function(err, data) {
            if (err) {
                reject("Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2));
            } else {
                if(data.Item != null) {
                    const model: Model = data.Item["m"];
                    seriesCache[userID] = model;
                    resolve(model);
                }
                else {
                    reject("No item");
                }
            }
        });
    });
}

export function loadModel(force : boolean): Promise<Model> {
    return loadModelUserID(userID, force);
}

export function loadModelUserID(userID: string, force : boolean): Promise<Model> {
    if(!force && seriesCache[userID])
        return Promise.resolve(seriesCache[userID]);
    return new Promise((resolve, reject) => {
        const docClient = new aws.DynamoDB.DocumentClient( {
            region: "eu-west-1",
            endpoint: "https://dynamodb.eu-west-1.amazonaws.com", 
            convertEmptyValues: true,
            accessKeyId: "AKIAIWAB4KO6GED7WCIQ",
            secretAccessKey: "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"
        }); 

        var params = {
            TableName: "vaegt-api",
            Key:{
                "userID": userID
            }
        };
        docClient.get(params, function(err, data) {
            if (err) {
                reject("Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2));
            } else {
                if(data.Item != null) {
                    const model: Model = data.Item["m"];
                    /*
                    model.feed.forEach(p => {
                        p.h = Boolean(Math.round(Math.random()));
                        p.v = Boolean(Math.round(Math.random()));
                    })*/
                    seriesCache[userID] = model;
                    resolve(model);
                }
                else {
                    reject("No item");
                }
            }
        });
    });
}
