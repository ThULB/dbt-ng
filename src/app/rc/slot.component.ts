import { Component, Input } from "@angular/core";

import { AuthService } from "../_services/auth.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { RCApiService } from "./api.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition } from "@uirouter/core";

import { MCRObject, SolrSelectResponse } from "../_datamodels/datamodel.def";
import { Slot } from "./datamodel.def";

@Component({
    selector: "ui-rc-slot",
    templateUrl: "./slot.component.html"
})
export class SlotComponent {

    public id: string;

    @Input() public slot: Slot;

    constructor(public $auth: AuthService, private $state: StateService) {
        this.id = this.$state.params.id;
    }

    groupEntries() {
        if (this.slot.entries) {
            const groups = new Array();

            let group;
            this.slot.entries.forEach((e) => {
                if (e.type === "headline") {
                    if (group) {
                        groups.push(group);
                    }

                    group = new Array();
                    group.push(e);
                } else {
                    if (!group) {
                        group = new Array();
                    }
                    group.push(e);
                }
            });

            if (group) {
                groups.push(group);
            }

            return groups;
        }

        return null;
    }

    quote(str: string): string {
        return str ? "\"" + str + "\"" : str;
    }

}

export function resolveFnSlot($api, $error, $spinner, trans) {
    const cacheKey = CacheService.buildCacheKey(trans.to().name, trans.params());
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        const params = new Map();
        params.set("fq", "objectType:slot");
        params.set("fl", "id");

        return $api.solrSelect("slotId:" + trans.params().id, params).toPromise().then((ssr: SolrSelectResponse) => {
            const objectId = ssr.response.docs[0]["id"];

            return $api.object(objectId).toPromise().then((obj: MCRObject) => {
                const slot = Slot.parse(new MCRObject(obj));
                CacheService.set(cacheKey, slot, CacheService.DEFAULT_LIFETIME);
                $spinner.setLoadingState(false);
                return slot;
            }, (err) => {
                if (err.status !== 401) {
                    $error.handleError(err);
                } else {
                    return $api.slots(trans.params().id).toPromise().then((res: any) => {
                        const slot = res.slots.slot[0];
                        $spinner.setLoadingState(false);
                        return slot;
                    });
                }
            });
        }).catch((err) => {
            $spinner.setLoadingState(true);
            $error.handleError(err);
        });
    }
}

export const SlotStates = {
    name: "rc.slot",
    url: "/:id",
    component: SlotComponent,
    data: {
        breadcrumb: "rc.slot.breadcrumb",
        parentState: "rc",
        requiresAuth: false,
        handlesAuth: true
    },
    params: { id: null },
    resolve: [
        {
            token: "slot",
            deps: [RCApiService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnSlot
        },
    ]
};

