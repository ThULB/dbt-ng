import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { JwtHelperService } from "@auth0/angular-jwt";

import { throwError } from "rxjs";

import { ApiService } from "./api.service";
import { environment } from "../../environments/environment";

export interface LoginResponse {
    login_success: boolean;
    access_token?: string;
    token_type?: string;
}

export interface UserInformation {
    token?: string;
    audience?: string;
    username?: string;
    name?: string;
    email?: string;
    roles?: Array<string>;
}

export interface Realm {
    id: string;
    login?: boolean;
    loginUrl?: string;
    passwordChangeUrl?: string;
}

export interface Settings {
    formAuth?: boolean;
    realm?: Array<Realm>;
}

@Injectable()
export class AuthService {

    private static MCR_SESSION_AUDIENCE = "mcr:session";

    private jwtHelper: JwtHelperService = new JwtHelperService();

    public realms: Array<Realm>;

    public formAuth = true;

    public user: UserInformation;

    constructor(private $api: ApiService, private titleService: Title) {
        this.loadToken();
        setTimeout(() => this.getAppSettings());
    }

    isLoggedIn() {
        return this.user && this.user.token &&
            (this.user.audience === AuthService.MCR_SESSION_AUDIENCE ||
                (this.jwtHelper.getTokenExpirationDate(this.user.token) && !this.jwtHelper.isTokenExpired(this.user.token))
            );
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

    setToken(token: string) {
        if (token) {
            window.localStorage.setItem("token", token);
            this.parseToken(token);
        }

        return throwError(new Error("Login was unsuccessfully."));
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
            audience: decoded.aud,
            username: decoded.sub,
            name: decoded.name,
            email: decoded.email,
            roles: decoded["mcr:roles"]
        };

        if (this.user.audience === AuthService.MCR_SESSION_AUDIENCE) {
            setInterval(() => this.$api.sessionPing().subscribe(), 1740000);
        }
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

    getLoginRealms(): Array<Realm> {
        return this.realms && this.realms.filter(r => r.login);
    }

    getRealmById(id: string): Realm {
        return this.realms.find(r => r.id === id);
    }

    getAppSettings() {
        return this.$api.settings().toPromise().then((settings: Settings) => {
            this.replaceVars(settings);

            this.formAuth = settings.formAuth;
            this.setTitle("Digitale Bibliothek Thüringen");
            this.realms = settings.realm;
        });
    }

    setTitle(title: string) {
        this.titleService.setTitle(title || "Digitale Bibliothek Thüringen");
    }

    private replaceVars(obj: Object) {
        const envVars = new RegExp("\\$\\{(" + Object.keys(environment).join("|") + ")\\}", "g");
        Object.keys(obj).forEach(k => {
            const val = obj[k];
            if (typeof val === "object") {
                this.replaceVars(val);
            } else if (typeof val === "string" && envVars.test(val)) {
                Object.keys(environment).forEach(ek =>
                    obj[k] = obj[k].replace(new RegExp("\\$\\{" + ek + "\\}", "g"), environment[ek])
                );
            }
        });
    }
}
