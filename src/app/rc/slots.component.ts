import { Component, Input } from "@angular/core";
import { StateService, Transition } from "@uirouter/core";

import { AuthService } from "../_services/auth.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { MobileDetectService } from "../_services/mobileDetect.service";
import { RCApiService } from "./api.service";
import { SpinnerService } from "../spinner/spinner.service";

import { AdminRoles, EditorRoles, Slots, Slot } from "./datamodel.def";

@Component({
    selector: "ui-rc-slots",
    templateUrl: "./slots.component.html"
})
export class SlotsComponent {

    public term: string;
    public numPerPage: number;
    public page = 1;
    public sort = "slotId ASC";

    public isAdmin = false;
    public isEditor = false;

    @Input() public slots: Slots;

    constructor(private $auth: AuthService, private $state: StateService, public mds: MobileDetectService) {
        this.term = decodeURIComponent(this.$state.params.term);
        this.page = this.$state.params.page || 1;
        this.numPerPage = this.$state.params.numPerPage || (mds.isPhone() ? 25 : 50);
        this.sort = decodeURIComponent(this.$state.params.sort) || "slotId ASC";

        this.isAdmin = AdminRoles.find((r) => this.$auth.hasRole(r)) !== undefined;
        this.isEditor = EditorRoles.find((r) => this.$auth.hasRole(r)) !== undefined;
    }

    private transitionTo() {
        return this.$state.transitionTo(this.$state.$current.name, {
            term: this.term,
            page: this.page,
            numPerPage: this.numPerPage,
            sort: this.sort
        }, { reload: false });
    }

    quote(str: string): string {
        return str ? "\"" + str + "\"" : str;
    }

    locationId(id: string) {
        return id.substring(0, 10);
    }

    changeFilter(evt) {
        if (evt.key.toLowerCase() === "enter") {
            this.page = 1;
            this.transitionTo();
        }
    }

    pageChange(page: number) {
        this.page = page;
        this.transitionTo();
    }

    numPerPageChange(numPerPage: number) {
        this.numPerPage = numPerPage;
        this.page = 1;
        this.transitionTo();
    }

    sortType(field: string): number {
        if (this.sort.indexOf(field) === 0) {
            const s = this.sort.split(" ");
            return s ? ("ASC" === s[1] ? 1 : -1) : 0;
        }

        return 0;
    }

    sortChange(field: string) {
        if (this.sortType(field) !== 0) {
            if (this.sortType(field) === 1) {
                this.sort = this.sort.replace("ASC", "DESC");
            } else if (this.sortType(field) === -1) {
                this.sort = this.sort.replace("DESC", "ASC");
            }
        } else {
            const s = this.sort.split(" ");
            this.sort = [field, s[1] || "ASC"].join(" ");
        }

        this.transitionTo();

        return false;
    }
}

const buildSearchQuery = (term: string) => {
    const sParams = ["slotId", "slot.title", "slot.lecturer", "slot.location", "slot.validto"];
    if (term.length !== 0) {
        const qa = new Array();
        sParams.forEach((p) => qa.push(`(${p}:${term})`));
        return qa.join(" OR ");
    }

    return "*:*";
};

export function resolveFnSlots($api, $auth, $error, $spinner, trans) {
    const cacheKey = CacheService.buildCacheKey(trans.to().name, trans.params());
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        const isAdmin = AdminRoles.find((r) => $auth.hasRole(r)) !== undefined;
        const isEditor = EditorRoles.find((r) => $auth.hasRole(r)) !== undefined;

        const term = decodeURIComponent(trans.params().term);
        const page = trans.params().page || 1;
        const numPerPage = trans.params().numPerPage || 50;
        const sort = decodeURIComponent(trans.params().sort) || "slotId ASC";

        const params = new Map();
        const fq = ["objectType:slot"];

        if (!isAdmin && !isEditor) {
            fq.push("slot.status:active OR slot.status:pending");
        }

        params.set("fq", fq);
        params.set("fl", "id, slot*");
        params.set("facet", "off");
        params.set("facet.field", ["slot.onlineOnly", "slot.status"]);
        params.set("sort", sort);
        params.set("start", (page - 1) * numPerPage);
        params.set("rows", numPerPage);

        return $api.solrSelect(buildSearchQuery(term), params).toPromise().then((res: any) => {
            const slots = { total: res.response.numFound, slot: [] };

            res.response.docs.forEach((doc) => {
                slots.slot.push(Slot.parse(doc));
            });

            CacheService.set(cacheKey, slots, CacheService.DEFAULT_LIFETIME);
            $spinner.setLoadingState(false);

            return slots;
        }).catch((err) => {
            $spinner.setLoadingState(false);
            $error.handleError(err);
        });
    }
}

export const SlotsStates = {
    name: "rc",
    url: "/rc?term&sort&page&numPerPage",
    component: SlotsComponent,
    data: {
        breadcrumb: "rc.breadcrumb",
        parentState: "home",
        requiresAuth: false
    },
    params: {
        term: {
            type: "query",
            value: "",
            raw: false,
            squash: true
        },
        sort: {
            type: "string",
            value: "slotId ASC",
            squash: true
        },
        page: {
            type: "int",
            value: 1,
            squash: true
        },
        numPerPage: {
            type: "int",
            squash: true
        }
    },
    resolve: [
        {
            token: "slots",
            deps: [RCApiService, AuthService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnSlots
        },
    ]
};
