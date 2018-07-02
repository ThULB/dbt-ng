import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { JwtHelperService } from "@auth0/angular-jwt";

import { throwError } from "rxjs";

import { ApiService } from "./api.service";

export interface LoginResponse {
    login_success: boolean;
    access_token?: string;
    token_type?: string;
}

export interface UserInformation {
    token?: string;
    username?: string;
    name?: string;
    email?: string;
    roles?: Array<string>;
}

@Injectable()
export class AuthService {

    private jwtHelper: JwtHelperService = new JwtHelperService();

    public formAuth = true;

    public user: UserInformation;

    constructor(private $api: ApiService, private titleService: Title) {
        this.loadToken();
        this.getAppSettings();
    }

    isLoggedIn() {
        return this.user && this.user.token && !this.jwtHelper.isTokenExpired(this.user.token);
    }

    login(username: string, password: string) {
        return this.$api.login(username, password).toPromise()
            .then((res: LoginResponse) => {
                if (res.login_success) {
                    window.localStorage.setItem("token", res.access_token);
                    this.parseToken(res.access_token);
                } else {
                    return throwError(new Error("Login was unsuccessfully."));
                }
            });
    }

    logout() {
        this.user = null;
        window.localStorage.removeItem("token");
        window.location.reload();
    }

    hasRole(role: string): boolean {
        if (this.isLoggedIn()) {
            return this.user.roles && this.user.roles.indexOf(role) !== -1;
        }

        return false;
    }

    renewToken() {
        return this.$api.renewToken().toPromise()
            .then((res: LoginResponse) => {
                window.localStorage.setItem("token", res.access_token);
                return this.parseToken(res.access_token);
            });
    }

    parseToken(token: string) {
        let decoded;
        try {
            decoded = this.jwtHelper.decodeToken(token);
        } catch (e) {
            return window.localStorage.removeItem("token");
        }

        this.user = {
            token: token,
            username: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            roles: decoded["mcr:roles"]
        };
    }

    loadToken() {
        const token = window.localStorage.getItem("token");
        if (token) {
            this.parseToken(token);
        }
    }

    buildHeaders() {
        const headers = { "X-Requested-With": "XMLHttpRequest" };
        if (this.isLoggedIn()) {
            return Object.assign({ Authorization: "Bearer " + this.user.token }, headers);
        }

        return headers;
    }

    getAppSettings() {
        this.formAuth = true;
        this.setTitle("Digitale Bibliothek Thüringen");
    }

    setTitle(title: string) {
        this.titleService.setTitle(title || "Digitale Bibliothek Thüringen");
    }
}
