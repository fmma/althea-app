import { Webpart } from "../webpart";
import { Model } from "../model";
import Auth from "../auth";


class Login extends Webpart<Model> {

    state: "signup" | "login" | "logged in" | "new password" = "login";
    username: string | null = null;
    errorMessage: string | null = null;

    private handleResult(result: "ok_temp_pass" | "ok_signup" | "ok" | "err" | "temp_pass") {
        switch(result) {
            case "err": {
                this.errorMessage = "Fejl";
                break;
            }
            case "temp_pass": {
                this.state = "new password";
                break;
            }
            case "ok" :
            case "ok_signup":
            case "ok_temp_pass": {
                this.state = "logged in";
                this.username = Auth.getUsername();
                break;
            }
        }
        this.draw();
    }

    async dom(): Promise<void> {
        this.div._paragraph(this.errorMessage == null ? "" : "FEJL:" + this.errorMessage);
        switch(this.state) {
            case "login": {
                this.domLogin(this.div._switch(0,4));
                break;
            }
            case "logged in": {
                this.domLoggedIn(this.div._switch(1,4))
                break;
            }
            case "new password": {
                this.domNewPassword(this.div._switch(2,4));
                break;
            }
            case "signup": {
                this.domSignup(this.div._switch(3,4));
                break;
            }
        }
    }

    domLogin(div: HTMLDivElement) {
        const user = div._input("brugernavn", "text", "");
        user.style.width="100%";
        user.value = "frederik.meisner@gmail.com";
        const pass = div._input("kodeord", "password", "");
        pass.style.width="100%";
        div._button("Login", async () => {
            this.errorMessage = null;
            this.handleResult(await Auth.authenticate(user.value, pass.value));
            
        }).style.width="100%";
        div._button("Opret bruger", async() => {
            this.errorMessage = null;
            this.state = "signup";
            this.draw();
        })
    }

    private domLoggedIn(div: HTMLDivElement) {
        div._text("Logget ind som " + this.username);
        div._button("Log ud", async () => {
            if(this.username == null)
                return;
            this.errorMessage = null;
            const username = null;
            this.state = "login";
            Auth.logout();
            this.draw();
        }).style.width="100%";
    }

    private domNewPassword(div: HTMLDivElement) {
        const newPassword = div._input("nyt kodeord", "password", "");
        newPassword.style.width="100%";
        const newPassword2 = div._input("gentag nyt kodeord", "password", "");
        newPassword2.style.width="100%";
        div._button("Opret nyt kodeord", async () => {
            this.errorMessage = null;
            if(this.username == null || newPassword2.value !== newPassword.value) {
                return;
            }
            this.handleResult(await Auth.completeNewPasswordChallenge(newPassword.value));
        }).style.width="100%";
    }

    private domSignup(div: HTMLDivElement) {
        const user = div._input("brugernavn", "text", "");
        user.style.width="100%";
        user.value = "frederik.meisner@gmail.com";
        const pass = div._input("kodeord", "password", "");
        pass.style.width="100%";
        const pass2 = div._input("gentag kodeord", "password", "");
        pass2.style.width="100%";
        div._button("Opret", async () => {
            if(pass.value !== pass2.value) {
                this.errorMessage = "Kodeord stemmer ikke overens";
                this.draw();
                return;
            }
            this.errorMessage = null;
            this.handleResult(await Auth.signUp(user.value, pass.value));
        }).style.width="100%";
        div._button("Login", async() => {
            this.errorMessage = null;
            this.state = "login";
            this.draw();
        })
    }
}

export default Login;