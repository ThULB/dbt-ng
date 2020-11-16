import { Component, OnInit } from "@angular/core";
import { TargetState, StateService, UIRouterGlobals } from "@uirouter/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

import { AuthService } from "../_services/auth.service";
import { ErrorService } from "../_services/error.service";
import { SpinnerService } from "../spinner/spinner.service";

@Component({
    selector: "ui-login",
    templateUrl: "./login.component.html"
})
class LoginComponent implements OnInit {

    form: FormGroup;
    token: string;
    returnTo: string | TargetState;
    invalidCredentials = false;

    constructor(public $fb: FormBuilder, private $state: StateService, private $spinner: SpinnerService,
        public $auth: AuthService, private $error: ErrorService, private globals: UIRouterGlobals) {
        this.token = this.globals.params.token || this.globals.current.params.token;
        this.returnTo = this.decodeTargetState(window.sessionStorage.getItem("returnTo"))
            || this.globals.params.returnTo || this.globals.current.params.returnTo;

        if (this.token) {
            this.$auth.setToken(this.token);
            if (this.$auth.isLoggedIn()) {
                this.redirect();
            }
        }
    }

    ngOnInit() {
        this.$spinner.setLoadingState(false);

        if (!this.token && this.returnTo && !window.sessionStorage.getItem("returnTo")) {
            window.sessionStorage.setItem("returnTo", this.encodeTargetState(this.returnTo));
        }

        this.form = this.$fb.group({
            username: ["", Validators.required],
            password: ["", Validators.required]
        });
    }

    onSubmit({ value, valid }) {
        this.$spinner.setLoadingState(true);
        this.$auth.login(value.username, value.password)
            .then((res) => {
                this.redirect();
                this.$spinner.setLoadingState(false);
            }).catch((err) => {
                this.$spinner.setLoadingState(false);
                this.invalidCredentials = true;
                this.$error.handleError(err);
            });
    }

    onCancel() {
        this.redirect();
    }

    private encodeTargetState(state: TargetState | string): string {
        if (state && state instanceof TargetState) {
            return JSON.stringify({ name: state.name(), params: state.params() });
        } else if (typeof state === "string") {
            return state;
        }

        return null;
    }

    private decodeTargetState(state: string): TargetState | string {
        try {
            const decoded = JSON.parse(state);
            if (decoded && decoded.name && decoded.params) {
                return decoded.name.length !== 0 ? this.$state.target(decoded.name, decoded.params) : null;
            }
        } catch (e) {
            // ignore
        }

        return state;
    }

    private redirect() {
        if (this.returnTo && typeof this.returnTo === "string") {
            window.location.href = decodeURIComponent(this.returnTo);
        } else if (this.returnTo && this.returnTo instanceof TargetState) {
            this.$state.go(
                (<TargetState>this.returnTo).name().replace(".**", ""), (<TargetState>this.returnTo).params()
            ).catch(err => {
                this.$state.go("home");
            });
        } else {
            this.$state.go("home");
        }

        window.sessionStorage.removeItem("returnTo");
    }

}

const LoginStates = {
    name: "login",
    url: "/login?token&returnTo",
    component: LoginComponent,
    data: {
        breadcrumb: "login.breadcrumb",
        requiresAuth: false
    },
    params: {
        token: null,
        returnTo: null
    }
};

export { LoginComponent, LoginStates };
