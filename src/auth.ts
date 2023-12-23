import aws = require("aws-sdk");
import {
    AuthenticationDetails,
    CognitoUserPool,
    CognitoUser,
    CognitoUserSession,
    CognitoAccessToken,
    CookieStorage
  } from 'amazon-cognito-identity-js';
import { saveModelUserID } from './model';


class Auth {
    readonly region = 'eu-west-1';
    
    // Althea test
    readonly userPoolId = 'eu-west-1_CGwM5AcrV';
    readonly clientId = '72fm62sse958cebu91j7o2bcgo';
    readonly identityPoolId = 'eu-west-1:18dd8d7b-0c4f-45b1-a7ff-897c60c14a98'; 
    
    // vaegt-js
    // readonly userPoolId = 'eu-west-1_95lvQTeue';
    // readonly clientId = '7bmrq4gv74kvfkbdtpfv4jvd7s';
    // readonly identityPoolId = 'eu-west-1:beda78ca-f3e4-4dd0-b649-99f0dd2c183d';

    readonly idpName = 'cognito-idp.eu-west-1.amazonaws.com/' + this.userPoolId;
    readonly cookieStorage = new CookieStorage({domain: ".althea." + window.location.hostname})
    username = "";
    idpCrededntials: aws.CognitoIdentityCredentials | null = null;

    readonly userPool = new CognitoUserPool({
        UserPoolId: this.userPoolId, 
        ClientId: this.clientId,
        Storage: this.cookieStorage
    });

    getUsername(): string {
        return this.username;
    }

    async getUserId(): Promise<string | null> {
        const cred = await this.getCredentials();
        return cred == null ? null : cred.identityId;
    }

    signUp(username: string, password: string): Promise<"ok_signup" | "err"> {
        return new Promise(resolve => {
            this.signUpK(username, password, resolve);
        })
    }

    logout() {
        const user = this.userPool.getCurrentUser();
        if(user != null)
            user.signOut();
    }

    authenticate(username: string, password: string): Promise<"ok" | "err" | "temp_pass"> {
        return new Promise((resolve, reject) => {
            this.authenticateK(username, password, resolve);
        });
    }

    completeNewPasswordChallenge(newPassword: string): Promise<"ok_temp_pass" | "err"> {
        return new Promise(resolve => {
            this.completeNewPasswordChallengeK(newPassword, resolve);
        })
    }

    getCredentials(): Promise<aws.CognitoIdentityCredentials | null> {
        return new Promise((resolve, reject) => {
            if(this.idpCrededntials == null) {
                resolve(null);
            }
            else {
                if(this.idpCrededntials.expired) {
                    this.idpCrededntials.refresh(err => {
                        if(err == null) {
                            resolve(this.idpCrededntials);
                            return;
                        } else {
                            console.log(err);
                            resolve(null);
                            return;
                        }
                    });
                }
                else {
                    resolve(this.idpCrededntials);
                }
            }
        });
    }

    private signUpK(username: string, password: string, resolve: (res: "ok_signup" | "err") => void) {
        this.userPool.signUp(username, password, [], [], (err, result) => {
            if(result == null) {
                resolve("err");
            }
            else {
                this.username = username;
                resolve("ok_signup");
            }
        });
    }

    private authenticateK(username: string, password: string, resolve: (res: "ok" | "err" | "temp_pass") => void) {
        if(this.userPool.getCurrentUser() != null) {
            this.logout();
        }
        const user = new CognitoUser({
            Username: username,
            Pool: this.userPool,
            Storage: this.cookieStorage
        });
        user.authenticateUser(new AuthenticationDetails({
            Username: username, 
            Password: password
        }), {
            onSuccess: async result => {
                const logins: {[ix: string]: string} = {}
                logins[this.idpName] = result.getIdToken().getJwtToken();
                this.idpCrededntials =  new aws.CognitoIdentityCredentials({
                    IdentityPoolId: this.identityPoolId,
                    Logins: logins
                });
                aws.config.credentials = this.idpCrededntials;
                resolve("ok");
            },
            onFailure: error => {
                resolve("err");
            },
            newPasswordRequired: () => {
                resolve("temp_pass");
            },
            mfaRequired: () => {
                console.log("mfaRequired");
            },
            customChallenge: () => {
                console.log("customChallenge");
            }
        });
    }

    private completeNewPasswordChallengeK(newPassword: string, resolve: (res: "ok_temp_pass" | "err") => void) {
        const user = this.userPool.getCurrentUser();
        if(user == null){
            resolve("err");
            return;
        }
        user.completeNewPasswordChallenge(newPassword, {}, {
            onSuccess: result => {
                resolve("ok_temp_pass");
            },
            onFailure: err => {
                resolve("err");
            }
        });
    }

    constructor() {
        aws.config.region = this.region;
    }
}

export default new Auth()

/*
export type AuthResult
    = {token: CognitoAccessToken} 
    | {error: string} 
    | {newPasswordRequired: true}
    | {signupOk: string};

export function completeNewPasswordChallenge(newPassword: string): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
        const user = getUserPool().getCurrentUser();
        if(user == null){
            resolve({error: "Du er ikke logget ind"});
            return;
        }
        user.completeNewPasswordChallenge(newPassword, {}, {
            onSuccess: result => {
                resolve({token: result.getAccessToken()});
            },
            onFailure: err => {
                resolve({error: String(err.message)});
            }
        });
    });
}

export function signup(username: string, password: string): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
        getUserPool().signUp(username, password, [], [], (err, result) => {
            if(err != undefined) {
                resolve({error: err.message});
                return;
            }
            if(result == null) {
                reject("Intet svar :(");
                return;
            }
            if(!result.userConfirmed) {
                resolve({error: "Noget gik galt :("})
            }
            resolve({signupOk: result.user.getUsername()});
        });
    });
}

export function logout() {
    const user = getUserPool().getCurrentUser();
    if(user != null)
        user.signOut();
}

export function assocId() {
    aws.config.region = "eu-west-1";
    const userPool = getUserPool();
    var cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function(err: any, result: any) {
            if (result) {
                console.log('You are now logged in.', result);

                // Add the User's Id Token to the Cognito credentials login map.
                aws.config.credentials = new aws.CognitoIdentityCredentials({
                    IdentityPoolId: 'eu-west-1:beda78ca-f3e4-4dd0-b649-99f0dd2c183d',
                    Logins: {
                        'cognito-idp.eu-west-1.amazonaws.com/eu-west-1_95lvQTeue': result.getIdToken().getJwtToken()
                    }
                });
            }
        });
    }
    //call refresh method in order to authenticate user and get new temp credentials
    if(aws.config.credentials != null && "refresh" in aws.config.credentials) {
    aws.config.credentials.refresh((error) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Successfully logged!', aws.config.credentials);
            if(aws.config.credentials == null || !("accessKeyId" in aws.config.credentials)) {
                return;
            }
            console.log("SAVE");
            saveModelUserID(
                "test-cognitor",
                aws.config.credentials.accessKeyId,
                aws.config.credentials.secretAccessKey,
                (aws.config.credentials as any)["identityId"],
                {sleep: [], feed: [], version: 100},
                true);
        }
        });
    }
    else {
        console.log("no refresh");
    }
}

export function authenticate(username: string, password: string): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
        const user = getUser(username);
        const authenticationDetails = new AuthenticationDetails({
            Username: username, 
            Password: password
        });
        user.authenticateUser(authenticationDetails, {
            onSuccess: result => {
                assocId();
                resolve({token: result.getAccessToken()});
            },
            onFailure: error => {
                console.log(error);
                resolve({error: String(error.message)});
            },
            newPasswordRequired: () => {
                resolve({newPasswordRequired: true});
            },
            mfaRequired: () => {
                console.log("mfaRequired");
            },
            customChallenge: () => {
                console.log("customChallenge");
            }
        });
    });
}

export function getUserId(): string {
    return (aws.config.credentials as any)["identityId"];
}

function getUserPool(): CognitoUserPool {
    return new CognitoUserPool({
        UserPoolId : 'eu-west-1_95lvQTeue',
        ClientId : '7bmrq4gv74kvfkbdtpfv4jvd7s'
    });
}

function getUser(username: string): CognitoUser {
    return new CognitoUser({
        Username: username,
        Pool: getUserPool()
    });
}

*/