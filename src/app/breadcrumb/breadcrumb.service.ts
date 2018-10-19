import { Injectable, Injector } from "@angular/core";
import { StateDeclaration, StateService, Transition } from "@uirouter/core";

import { TranslateService } from "@ngx-translate/core";

import { Observable } from "rxjs";
import { map, merge } from "rxjs/operators";

export interface Breadcrumb {
    name: string;
    params?: Object;
    labelResolver?: Observable<string> |null;
}

@Injectable()
export class BreadcrumbService {

    private $state: StateService;

    private $translate: TranslateService;

    public breadcrumbs: Array<Breadcrumb>;

    public root: Breadcrumb;

    constructor(private $injector: Injector) {
        this.$translate = this.$injector.get<TranslateService>(TranslateService);

        this.breadcrumbs = new Array();
        this.root = { name: "home", params: { "#": null } };
        this.breadcrumbs.push(this.root);
    }

    setBreadcrumb(transition: Transition) {
        if (!this.$state) {
            this.$state = transition.router.stateService;
        }

        const f = transition.from();
        const t = transition.to();

        const toBC = {
            name: t.name,
            params: this.decodeParams(transition.params("to")),
            labelResolver: this.buildLabelResolver(t, this.decodeParams(transition.params("to")))
        };
        const bIdx = this.findBreadcrumbIndex(toBC);

        if (bIdx !== -1) {
            this.setBreadcrumbAtIndex(toBC, bIdx);
        } else {
            this.setBreadcrumbByState(f, this.decodeParams(transition.params("from")));
            this.setBreadcrumbByState(t, this.decodeParams(transition.params("to")));
        }
    }

    private findBreadcrumbIndex(breadcrumb: Breadcrumb, withParams: boolean = true): number {
        return this.breadcrumbs
            .findIndex((b) => b.name === breadcrumb.name &&
                (withParams && this.paramsMatch(b.params, breadcrumb.params) || !withParams));
    }

    private setBreadcrumbAtIndex(breadcrumb: Breadcrumb |null, index: number = 0) {
        this.breadcrumbs.splice(index, this.breadcrumbs.length);
        if (breadcrumb) {
            this.breadcrumbs.push(breadcrumb);
        }
    }

    private setBreadcrumbByState(state: StateDeclaration, params?: Object) {
        if (state.name && state.name.indexOf("**") === -1) {
            const parent: any = state.parent || (/^(.+)\.[^.]+$/.exec(state.name) || [])[1] ||
                state.data ? state.data.parentState : null;

            const sBC = {
                name: state.name,
                params: params,
                labelResolver: this.buildLabelResolver(state, params)
            };
            const sIdx = this.findBreadcrumbIndex(sBC);

            let pIdx = -1;
            if (parent) {
                const pBC = {
                    name: parent.name || parent,
                };
                pIdx = this.findBreadcrumbIndex(pBC, false);
            }

            if (pIdx === -1 && parent) {
                this.setBreadcrumbByState(this.$state.get(parent));
            } else if (pIdx !== -1 && (sIdx === -1 || pIdx < sIdx)) {
                this.setBreadcrumbAtIndex(sBC, pIdx + 1);
                return;
            } else if (sIdx !== -1) {
                this.setBreadcrumbAtIndex(sBC, sIdx);
                return;
            }

            this.breadcrumbs.push(sBC);
        }
    }

    private paramsMatch(p1, p2) {
        if (!p1 && !p2) {
            return true;
        }

        if (!p1 || !p2) {
            return false;
        }

        return Object.keys(p1)
            .filter((k) => k !== "#" && Object.keys(p2).find((k2) => k === k2 && p1[k] === p2[k]) !== undefined)
            .length === Object.keys(p1).filter((k) => k !== "#").length;
    }

    private decodeParams(params) {
        if (params) {
            const p = {};
            Object.keys(params).forEach((k) => p[k] = params[k] && params[k] !== null ? decodeURIComponent(params[k]) : null);
            return p;
        }

        return params;
    }

    private buildLabelResolver(state: StateDeclaration, params?: Object) {
        if (state.data && state.data.breadcrumbLabelResolver) {
            return Observable.create((observer) => {
                const resolver = state.data.breadcrumbLabelResolver;
                
                resolver(this.$injector, params).subscribe(t => observer.next(t));
                this.$translate.onLangChange.subscribe(event =>
                    resolver(this.$injector, params).subscribe(t => observer.next(t))
                );
            });
        }

        return null;
    }
}
