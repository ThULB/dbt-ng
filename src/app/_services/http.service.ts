import { Injectable, Injector } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";

import { StateService, UIRouterGlobals } from "@uirouter/core";

import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { AuthService } from "./auth.service";

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    $state: StateService;
    $gloabls: UIRouterGlobals;
    $auth: AuthService;

    constructor(private $injector: Injector) {
        this.$state = this.$injector.get<StateService>(StateService);
        this.$gloabls = this.$injector.get<UIRouterGlobals>(UIRouterGlobals);
        this.$auth = this.$injector.get<AuthService>(AuthService);
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authReq = req.clone({ setHeaders: this.$auth.buildHeaders() });

        return next.handle(authReq).pipe(catchError((error, caught) => {
            if (error.status === 401 && (!this.$gloabls || this.$gloabls && this.$gloabls.current.name !== "login")) {
                if (this.$auth.isLoggedIn()) {
                    this.$auth.logout();
                }

                if (this.$gloabls.transition) {
                    const handlesAuth =
                        this.$gloabls.transition.to().data && this.$gloabls.transition.to().data.handlesAuth ||
                        this.$gloabls.current.data && this.$gloabls.current.data.handlesAuth || false;
                    if (!handlesAuth) {
                        const url = this.$state.href(this.$gloabls.transition.to().name, this.$gloabls.transition.params("to"));
                        this.$state.go("login", { returnTo: url }, { location: true });
                    }
                }
            }

            return throwError(error);
        })) as any;
    }

}
