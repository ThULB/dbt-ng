import { Injectable, Injector } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest} from "@angular/common/http";

import { StateService } from "@uirouter/core";

import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { AuthService } from "./auth.service";

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
    $state: StateService;
    $auth: AuthService;

    constructor(private $injector: Injector) {
        this.$state = this.$injector.get<StateService>(StateService);
        this.$auth = this.$injector.get<AuthService>(AuthService);
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const authReq = req.clone({ setHeaders: this.$auth.buildHeaders() });

        return next.handle(authReq).pipe(catchError((error, caught) => {
            if (error.status === 401 && (!this.$state || this.$state && this.$state.current.name !== "login")) {
                if (this.$state.transition) {
                    const handlesAuth =
                        this.$state.transition.to().data && this.$state.transition.to().data.handlesAuth ||
                        this.$state.current.data && this.$state.current.data.handlesAuth || false;
                    if (!handlesAuth) {
                        const url = this.$state.href(this.$state.transition.to().name, this.$state.transition.params("to"));
                        this.$state.go("login", { returnTo: url }, { location: true });
                    }
                }
            }

            return throwError(error);
        })) as any;
    }

}
