import { Component, OnInit, Input, EventEmitter } from "@angular/core";

import { map } from "rxjs/operators";

import { AuthService } from "../_services/auth.service";
import { BasketService } from "../basket/basket.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { ApiService } from "../_services/api.service";
import { StateService, Transition } from "@uirouter/core";
import { SpinnerService } from "../spinner/spinner.service";
import { TranslateService } from "@ngx-translate/core";

import { MetadataHelpers } from "../_helpers/metadataHelpers.class";
import { AdminRoles, EditorRoles, SolrSelectResponse, MCRObject, MCRDerivate, Mods } from "../_datamodels/datamodel.def";

@Component({
    selector: "ui-metadata",
    templateUrl: "./metadata.component.html"
})
export class MetadataComponent extends MetadataHelpers implements OnInit {

    public id: string;

    @Input() public object: MCRObject;

    @Input() public derivates: Array<MCRDerivate>;

    public mods: Mods;

    public selectedDerivate: EventEmitter<MCRDerivate> = new EventEmitter();

    public selectedFile: EventEmitter<string> = new EventEmitter();

    public isAdmin = false;
    public isEditor = false;

    constructor(private $auth: AuthService, private $state: StateService, private basket: BasketService,
        public translate: TranslateService) {
        super();

        this.id = this.$state.params.id;

        this.isAdmin = AdminRoles.find((r) => this.$auth.hasRole(r)) !== undefined;
        this.isEditor = EditorRoles.find((r) => this.$auth.hasRole(r)) !== undefined;
    }

    ngOnInit() {
        this.mods = new Mods(this.object.mods());
        setTimeout(() => this.derivates && this.derivates.length !== 0 && this.selectedDerivate.emit(this.derivates[0]));
    }

    fileSelected(file: string) {
        if (file.indexOf(":") !== -1) {
            const fp = file.split(":");
            this.selectedDerivate.emit(this.derivates.find((d) => d.id === fp[0]));
            this.selectedFile.emit(fp[1]);
        } else {
            this.selectedDerivate.emit(this.derivates[0]);
            this.selectedFile.emit(file);
        }
    }

    toggleBasket() {
        if (this.basket.isInBasket(this.id)) {
            this.basket.removeItem(this.id);
        } else {
            this.basket.addItem({ documentId: this.id });
        }
    }
}

export function MetadataTitleResolver($injector, params) {
    const api = $injector.get(ApiService);
    return api.solrCondQuery("id\:" + params.id, 0, 1).pipe(
        map((res: SolrSelectResponse) => {
            const doc = res.response.docs[0];
            return (doc["mods.title.nonSort"] ? doc["mods.title.nonSort"] + " " : "")
                + doc["mods.title.main"] +
                (doc["mods.title.subtitle"] ? " : " + doc["mods.title.subtitle"] : "")
                + (params.revision ? " (Rev. " + params.revision + ")" : "");
        })).toPromise();
}

export function resolveFnObject($api, $error, $spinner, trans) {
    const cacheKey = CacheService.buildCacheKey(trans.to().name, trans.params());
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        let promise = $api.object(trans.params().id).toPromise();
        if (trans.params().revision) {
            promise = $api.versions(trans.params().id, trans.params().revision).toPromise();
        }

        return promise.then((res) => {
            const object = new MCRObject(res);
            CacheService.set(cacheKey, object, CacheService.DEFAULT_LIFETIME);
            $spinner.setLoadingState(false);
            return object;
        }).catch((err) => {
            $spinner.setLoadingState(false);
            $error.handleError(err);
        });
    }
}

export function resolveFnDerivates($api, $error, $spinner, trans) {
    const cacheKey = CacheService.buildCacheKey(trans.to().name + "_derivates", trans.params());
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        const id = trans.params().id;

        return new Promise((resolve, reject) => {
            $api.listDerivates(id).toPromise().then((res: Array<any>) => {
                const derivates = [];

                let dl = res.length;
                if (dl === 0) {
                    resolve(derivates);
                } else {
                    res.forEach((o, i) => {
                        const derId = o.xlinkHref;
                        $api.derivate(id, derId).subscribe((der: Object) => {
                            derivates[i] = new MCRDerivate(der, id);
                            dl--;

                            if (dl === 0) {
                                resolve(derivates);
                            }
                        }, err => {
                            derivates[i] = { id: o.xlinkHref, objectId: id, status: err.status };
                            dl--;
                            
                            if (dl === 0) {
                                resolve(derivates);
                            }
                        });
                    });
                }
            }, reject);
        }).then(derivates => {
            CacheService.set(cacheKey, derivates, CacheService.DEFAULT_LIFETIME);
            $spinner.setLoadingState(false);
            return derivates;
        }).catch((err) => {
            $spinner.setLoadingState(false);
            $error.handleError(err);
        });
    }
}

export const MetadataStates = {
    name: "metadata",
    url: "/metadata/:id?revision",
    component: MetadataComponent,
    data: {
        breadcrumb: "metadata.breadcrumb",
        breadcrumbLabelResolver: MetadataTitleResolver,
        requiresAuth: false
    },
    params: {
        id: null,
        revision: {
            type: "int",
            squash: true
        }
    },
    resolve: [
        {
            token: "object",
            deps: [ApiService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnObject
        },
        {
            token: "derivates",
            deps: [ApiService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnDerivates
        }
    ]
};

