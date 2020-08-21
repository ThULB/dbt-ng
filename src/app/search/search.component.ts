import { Component, Input, Renderer2 } from "@angular/core";

import { Observable, Subscriber } from "rxjs";
import { debounceTime, filter, map } from "rxjs/operators";

import { CacheService } from "../_services/cache.service";
import { ErrorService } from "../_services/error.service";
import { ApiService } from "../_services/api.service";
import { MobileDetectService } from "../_services/mobileDetect.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";

import { MetadataHelpers } from "../_helpers/metadataHelpers.class";
import { SolrSelectResponse, SolrDocument } from "../_datamodels/datamodel.def";

@Component({
    selector: "ui-search",
    templateUrl: "./search.component.html"
})
export class SearchComponent extends MetadataHelpers {

    public query: string;
    public facets: string;
    public page: number;
    public rows: number;

    public yearFrom: number;
    public yearTo: number;

    private minYear: number;
    private maxYear: number;
    private yearObserver: Subscriber<number>;

    @Input() public result: SolrSelectResponse;

    constructor(public $api: ApiService, private $state: StateService, private renderer: Renderer2,
        public mds: MobileDetectService, private globals: UIRouterGlobals) {
        super();

        this.query = decodeURIComponent(this.globals.params.query);
        this.facets = this.globals.params.facets;
        this.page = this.globals.params.page;
        this.rows = this.globals.params.rows || 20;

        this.minYear = 1800;
        this.maxYear = new Date().getFullYear();
        this.parseYearsFromFacets();
    }

    private transitionTo() {
        this.$state.transitionTo(this.globals.$current.name, {
            query: this.query,
            facets: this.facets,
            page: this.page,
            rows: this.rows
        }, { reload: false });
    }

    pageChange(page: number) {
        this.page = page;
        this.transitionTo();
    }

    thumb(item: SolrDocument) {
        if (item && item["id"]) {
            return this.$api.thumbUrl(item["id"], 75);
        }
        return null;
    }

    private copyClassList(from: Element, to: Element, expect: Array<string> = []) {
        for (let ci = 0; ci < from.classList.length; ci++) {
            const cls = from.classList.item(ci);
            if (expect.length === 0 || expect.indexOf(cls) === -1) {
                to.classList.add(cls);
            }
        }
    }

    thumbLoaded(event: Event) {
        const elm = event.target as Element;
        this.renderer.removeClass(elm.parentElement, "loading");
    }

    defaultThumb(event: Event, item: SolrDocument) {
        const derId = item["link"] ? item["link"].find((l) => l.indexOf("derivate") !== -1) : null;
        const elm = event.target as Element;
        const parent = this.renderer.parentNode(elm);
        const ph = this.renderer.createElement("div");

        if (derId) {
            const params = new Map();
            params.set("fl", "id,maindoc");
            params.set("limit", 1);
            params.set("facet", "off");

            this.$api.solrSelect(`id:${derId}`, params).pipe(
                map((res: SolrSelectResponse) => {
                    let cls = null;
                    if (res.response.numFound === 1) {
                        const fExt = this.fileExtension(res.response.docs[0]["maindoc"]);
                        if (fExt) {
                            cls = `img-${fExt}`;
                        }
                    }
                    return cls;
                })
            ).subscribe(cls => {
                cls = cls || "img-placeholder";
                ph.classList.add(cls);
                this.copyClassList(elm, ph);
                this.renderer.removeClass(elm.parentElement, "loading");
                this.renderer.insertBefore(parent, ph, elm);
                this.renderer.removeChild(parent, elm);
            });
        } else {
            ph.classList.add("img-placeholder");
            this.copyClassList(elm, ph);
            this.renderer.removeClass(elm.parentElement, "loading");
            this.renderer.insertBefore(parent, ph, elm);
            this.renderer.removeChild(parent, elm);
        }

        return null;
    }

    isFacetSelected(name: string, value: string): boolean {
        return this.facets ? typeof this.facets.split(",").find((f) => f === [name, value].join(":")) === "string" : false;
    }

    facetSelect(name: string, value: string) {
        const fv = [name, value].join(":");
        if (this.isFacetSelected(name, value)) {
            this.facets = this.facets.split(",").filter((f) => f !== fv).join(",");
        } else {
            this.facets = this.facets && this.facets.length !== 0 ? [this.facets, fv].join(",") : fv;
        }

        this.page = 1;
        return this.transitionTo();
    }

    parseYearsFromFacets() {
        const re = new RegExp("mods\\.yearIssued:\\[\(\\d+|\\*\)\\s*TO\\s*\(\\d+|\\*\)\\]");

        if (re.test(decodeURIComponent(this.facets))) {
            const m = decodeURIComponent(this.facets).match(re);
            this.yearFrom = parseInt(m[1], 10) || null;
            this.yearTo = parseInt(m[2], 10) || null;
        }
    }

    changeYear(year: number) {
        if (!this.yearObserver) {
            new Observable(observer => {
                this.yearObserver = observer;
            }).pipe(
                filter(y => !y || y >= this.minYear && y <= this.maxYear),
                debounceTime(500)).subscribe((y) => {
                    const re = new RegExp("mods\\.yearIssued:\\[\(\\d+|\\*\)\\s*TO\\s*\(\\d+|\\*\)\\]");

                    if (this.yearFrom || this.yearTo) {
                        if (this.yearTo && this.yearFrom > this.yearTo) {
                            this.yearTo = this.yearFrom;
                        }

                        const facet = `mods.yearIssued:[${this.yearFrom || "*"} TO ${this.yearTo || "*"}]`;
                        this.facets = this.facets && this.facets.length !== 0 ?
                            re.test(decodeURIComponent(this.facets)) ?
                                decodeURIComponent(this.facets).replace(re, facet) : [this.facets, facet].join(",")
                            : facet;
                    } else {
                        this.facets = this.facets && this.facets.length !== 0 && re.test(decodeURIComponent(this.facets)) ?
                            decodeURIComponent(this.facets).replace(re, "") : this.facets;
                    }

                    this.page = 1;
                    this.transitionTo();
                });
        }

        this.yearObserver.next(year);
    }

}

export function resolveFnSearch($api, $error, $spinner, trans) {
    const cacheKey = CacheService.buildCacheKey(trans.to().name, trans.params());
    const cache = CacheService.get(cacheKey);

    if (cache) {
        return cache;
    } else {
        $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

        const query = decodeURIComponent(trans.params().query);
        const facets = trans.params().facets;
        const page = trans.params().page || 1;
        const rows = trans.params().rows || 20;

        const params = new Map();
        if (facets) {
            params.set("fq", facets.split(","));
        }

        return $api.solrCondQuery(query, (page - 1) * rows, rows, params).toPromise().then((res) => {
            $spinner.setLoadingState(false);
            CacheService.set(cacheKey, res, CacheService.DEFAULT_LIFETIME);
            return res;
        }).catch((err) => {
            $spinner.setLoadingState(true);
            $error.handleError(err);
        });
    }
}

export const SearchStates = {
    name: "search",
    url: "/search?query&facets&page&rows",
    component: SearchComponent,
    data: {
        parentState: "home",
        breadcrumb: "search.breadcrumb",
        requiresAuth: false
    },
    params: {
        query: {
            type: "string",
            value: "*",
            raw: true
        },
        facets: {
            type: "string",
            value: null,
            raw: true
        },
        page: {
            type: "int",
            value: 1,
            squash: true
        },
        rows: {
            type: "int",
            value: 20,
            squash: true
        }
    },
    resolve: [
        {
            token: "result",
            deps: [ApiService, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnSearch
        },
    ],
};
