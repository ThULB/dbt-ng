import { Component, Input, OnInit } from "@angular/core";

import { AuthService } from "../_services/auth.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { RCApiService } from "./api.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";

import { MCRObject, SolrSelectResponse } from "../_datamodels/datamodel.def";
import { Attendees } from "./datamodel.def";

@Component({
    selector: "ui-rc-attendees",
    templateUrl: "./attendees.component.html"
})
export class AttendeesComponent implements OnInit {

    public id: string;

    @Input()
    public attendees: Attendees;

    constructor(public $auth: AuthService, private $state: StateService, private globals: UIRouterGlobals) {
        this.id = this.globals.params.id;
    }

    ngOnInit() {
    }

}

export function resolveFnAttendees($api, $auth, $error, $spinner, trans) {
    const cacheKey = CacheService.buildCacheKey("rcSlotAttendees" + ($auth.user && $auth.user.username || ""), trans.params());
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        return $api.attendees(trans.params().id).toPromise().then(res => {
            $spinner.setLoadingState(false);
            CacheService.set(cacheKey, res.attendees, CacheService.DEFAULT_LIFETIME);
            return res.attendees;
        }).catch((err) => {
            $spinner.setLoadingState(false);
            $error.handleError(err);
        });
    }
}

export const AttendeesStates = {
    name: "rc.slot.attendees",
    url: "/attendees",
    component: AttendeesComponent,
    data: {
        breadcrumb: "rc.attendees.breadcrumb",
        parentState: "rc.slot",
        requiresAuth: false,
        handlesAuth: false
    },
    params: { id: null },
    resolve: [
        {
            token: "attendees",
            deps: [RCApiService, AuthService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnAttendees
        },
    ]
};

