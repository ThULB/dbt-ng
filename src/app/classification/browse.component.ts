import { Component, OnInit, Input } from "@angular/core";

import { map } from "rxjs/operators";

import { ApiService } from "../_services/api.service";
import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";
import { TranslateService } from "@ngx-translate/core";

import { SolrSelectResponse } from "../_datamodels/datamodel.def";

@Component({
    selector: "ui-browse",
    templateUrl: "./browse.component.html"
})
export class ClassificationBrowseComponent implements OnInit {

    @Input()
    public classif;

    public id: string;

    public counts: Map<string, number>;

    private openCategs: Array<string> = new Array();

    constructor(public $api: ApiService, private $state: StateService, private $error: ErrorService,
        private translate: TranslateService, private globals: UIRouterGlobals) {
        this.id = this.globals.params.id;
    }

    ngOnInit() {
        this.load();
    }

    categoryLabel(labels): string {
        if (labels) {
            return (labels.find((l) => l.lang === this.translate.currentLang)
                || labels.find((l) => !l.lang.startsWith("x-"))).text || null;
        }

        return null;
    }

    isCategoryOpen(category) {
        return this.openCategs.indexOf(category.ID) !== -1;
    }

    categoryToggle(category) {
        if (category) {
            if (this.isCategoryOpen(category)) {
                this.openCategs.splice(this.openCategs.indexOf(category.ID), 1);
            } else {
                this.openCategs.push(category.ID);
            }
        }
    }

    private load() {
        const cacheKey = ["categ_top", this.id].join("_");
        const cache = CacheService.get(cacheKey);

        if (cache) {
            this.counts = cache;
        } else {
            const params: Map<string, any> = new Map();
            params.set("facet", "on");
            params.set("facet.query", `category.top:${this.id}\\:*`);
            params.set("facet.field", "category.top");
            params.set("facet.prefix", this.id);

            return this.$api.solrSelect("*", params).subscribe((res: SolrSelectResponse) => {
                const categTop = res.facet_counts.facet_fields["category.top"] || [];
                if (categTop) {
                    this.counts = new Map();
                    for (let i = 0; i < categTop.length; i += 2) {
                        this.counts.set(categTop[i], parseInt(categTop[i + 1], 10));
                    }
                    CacheService.set(cacheKey, this.counts, CacheService.DEFAULT_LIFETIME);
                }
            }, (err) => this.$error.handleError(err));
        }
    }
}

export const BrowseTitleResolver = ($injector, params) => {
    const translate = $injector.get(TranslateService);
    const api = $injector.get(ApiService);
    return api.classification(params.id).pipe(
        map((res: any) =>
            translate.instant("browse.in", {
                label: (res.labels.find((l) => l.lang === translate.currentLang)
                    || res.labels.find((l) => !l.lang.startsWith("x-"))).text || params.id
            })
        )
    );
};

export const resolveFnClassification = ($api, $error, $spinner, trans) => {
    const cacheKey = ["classification", trans.params().id].join("_");
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        return $api.classification(trans.params().id)
            .toPromise().then((classif) => {
                $spinner.setLoadingState(false);
                CacheService.set(cacheKey, classif, 60 * 60 * 1000);
                return classif;
            }).catch((err) => {
                $spinner.setLoadingState(true);
                $error.handleError(err);
            });
    }
};

export const ClassificationBrowseStates = {
    name: "browse",
    url: "/browse/:id",
    component: ClassificationBrowseComponent,
    data: {
        parentState: "home",
        breadcrumb: "browse.breadcrumb",
        breadcrumbLabelResolver: BrowseTitleResolver,
        requiresAuth: false
    },
    params: {
        id: {
            type: "string",
            raw: false
        }
    },
    resolve: [
        {
            token: "classif",
            deps: [ApiService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnClassification
        },
    ],
};
