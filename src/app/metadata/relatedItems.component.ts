import { Component, OnInit, Input } from "@angular/core";

import { Observable } from "rxjs/Observable";
import { debounceTime } from "rxjs/operators";

import { ErrorService } from "../_services/error.service";
import { MetadataApiService } from "./api.service";

import { SolrSelectResponse, MCRObject } from "../_datamodels/datamodel.def";

interface RelatedItem {
    id: string;
    title: string;
    subTitle: string |null;
    dateIssued: string;
    part: string |null;
    partOrder: number |null;
}

@Component({
    selector: "ui-relateditems",
    templateUrl: "./relatedItems.component.html"
})
export class RelatedItemsComponent implements OnInit {

    public loading = false;

    public page = 1;

    public rows = 10;

    public start = 0;

    public end = this.rows;

    public query: string;

    public allowFilter = false;

    private queryObserver;

    @Input() public object: MCRObject;

    public itemsTotal: number;

    public items: Array<RelatedItem> = new Array();

    constructor(private $api: MetadataApiService, private $error: ErrorService) {
    }

    ngOnInit() {
        this.load();
    }

    private load() {
        return new Promise((resolve, reject) => {
            const structure = this.object.getElement("structure");
            if (structure) {
                const children = structure.getElementWithAttribute("children", { "class": "MCRMetaLinkID" });
                if (children) {
                    try {
                        this.loading = true;

                        const loc = children.getElementsWithAttribute("child", { "xlink:type": "locator" });
                        this.itemsTotal = loc.length;

                        new Promise((r, e) => {
                            let li = this.itemsTotal;
                            loc.forEach((l) => {
                                const id = l.getAttributeValue("xlink:href");
                                const params = new Map();
                                params.set("fl", ["id", "mods.title.main", "mods.title.subtitle", "mods.dateIssued"
                                    , "mods.part." + id, "mods.part.order." + id].join(","));
                                params.set("rows", 1);

                                this.$api.solrSelect("id:" + id, params).toPromise().then((res: SolrSelectResponse) => {
                                    if (res.response) {
                                        const doc = res.response.docs[0];
                                        this.items.push({
                                            id: doc["id"],
                                            title: doc["mods.title.main"],
                                            subTitle: doc["mods.title.subtitle"],
                                            dateIssued: doc["mods.dateIssued"],
                                            part: doc["mods.part." + id],
                                            partOrder: doc["mods.part.order." + id]
                                        });
                                        li--;

                                        if (li === 0) {
                                            this.items = this.orderByDateIssued(this.items);
                                            r();
                                        }
                                    }
                                }).catch((err) => e(err));
                            });
                        }).then((r) => {
                            this.loading = false;
                            resolve();
                        }).catch((err) => {
                            this.$error.handleError(err);
                            reject(err);
                        });
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    this.loadFromSolr().then(() => {
                        this.allowFilter = this.itemsTotal > 10;
                        resolve();
                    });
                }
            }
        });
    }

    private loadFromSolr() {
        this.loading = true;

        const params = new Map();
        params.set("fq", "mods.relatedItem:" + this.object.id);
        params.set("fl", ["id", "mods.title.main", "mods.title.subtitle", "mods.dateIssued"
            , "mods.part." + this.object.id, "mods.part.order." + this.object.id].join(","));
        params.set("sort", ["mods.part.order." + this.object.id + " desc", "mods.dateIssued desc"].join(","));
        params.set("start", this.start);
        params.set("rows", this.rows);

        return this.$api.solrSelect(this.query || "*:*", params).toPromise().then((res: SolrSelectResponse) => {
            if (res.response) {
                this.itemsTotal = res.response.numFound;
                res.response.docs.forEach((d, i) => {
                    this.items[res.response.start + i] = {
                        id: d["id"],
                        title: d["mods.title.main"],
                        subTitle: d["mods.title.subtitle"],
                        dateIssued: d["mods.dateIssued"],
                        part: d["mods.part." + this.object.id],
                        partOrder: d["mods.part.order." + this.object.id]
                    };
                });
            }

            this.loading = false;
        }).catch((err) => {
            this.loading = false;
            this.$error.handleError(err);
        });
    }

    private orderByDateIssued(items: Array<RelatedItem>, reverse: boolean = true) {
        return items.sort((a, b) => {
            const ae = a.partOrder || a.dateIssued;
            const be = b.partOrder || b.dateIssued;
            return ae && be ?
                (ae === be ? 0 :
                    (ae < be ? (reverse ? 1 : -1) : (reverse ? -1 : 1))) : 0;
        });
    }

    pageChange(page: number) {
        this.page = page;
        this.start = (this.page - 1) * this.rows;
        this.end = Math.min(this.itemsTotal, this.start + this.rows);

        if (!this.items[this.start] || !this.items[this.end - 1]) {
            this.loadFromSolr();
        }
    }

    odd(index: number) {
        return index % 2 !== 0;
    }

    filter(query: string) {
        if (!this.queryObserver) {
            Observable.create(observer => {
                this.queryObserver = observer;
            }).pipe(
                debounceTime(500),
            ).subscribe((q) => {
                this.page = 1;
                this.start = 0;
                this.items = new Array();
                this.loadFromSolr();
            });
        }

        this.queryObserver.next(query);

        return false;
    }
}
