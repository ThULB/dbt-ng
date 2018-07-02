import { Component, OnInit } from "@angular/core";
import { TargetState, StateService } from "@uirouter/core";
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
    returnTo: string | TargetState;
    invalidCredentials = false;

    constructor(public $fb: FormBuilder, private $state: StateService, private $spinner: SpinnerService,
        private $auth: AuthService, private $error: ErrorService) {
        this.returnTo = this.$state.params.returnTo || this.$state.current.params.returnTo;
    }

    ngOnInit() {
        this.$spinner.setLoadingState(false);

        this.form = this.$fb.group({
            username: ["", Validators.required],
            password: ["", Validators.required]
        });

        window.document.getElementById("username").focus();
    }

    onSubmit({ value, valid }) {
        this.$spinner.setLoadingState(true);
        this.$auth.login(value.username, value.password)
            .then((res) => {
                if (this.returnTo && typeof this.returnTo === "string") {
                    window.location.href = decodeURIComponent(this.returnTo);
                } else if (this.returnTo && this.returnTo instanceof TargetState) {
                    this.$state.go((<TargetState>this.returnTo).name(), (<TargetState>this.returnTo).params());
                } else {
                    this.$state.go("home");
                }
                this.$spinner.setLoadingState(false);
            }).catch((err) => {
                this.$spinner.setLoadingState(false);
                this.invalidCredentials = true;
                this.$error.handleError(err);
            });
    }

    onCancel() {
        if (this.returnTo && typeof this.returnTo === "string") {
            window.location.href = decodeURIComponent(this.returnTo);
        } else if (this.returnTo && this.returnTo instanceof TargetState) {
            this.$state.go((<TargetState>this.returnTo).name(), (<TargetState>this.returnTo).params());
        } else {
            this.$state.go("home");
        }
    }
}

const LoginStates = {
    name: "login",
    url: "/login?returnTo",
    component: LoginComponent,
    data: {
        breadcrumb: "login.breadcrumb",
        requiresAuth: false
    },
    params: {
        returnTo: null
    }
};

export { LoginComponent, LoginStates };
