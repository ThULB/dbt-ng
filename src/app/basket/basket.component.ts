import { Component, Renderer2, OnInit } from "@angular/core";

import { BasketService, BasketItem } from "./basket.service";
import { ApiService } from "../_services/api.service";
import { MobileDetectService } from "../_services/mobileDetect.service";

import { MetadataHelpers } from "../_helpers/metadataHelpers.class";
import { fileExtension } from "../_helpers/file.utils";

import { SolrSelectResponse } from "../_datamodels/datamodel.def";

@Component({
    selector: "ui-basket",
    templateUrl: "./basket.component.html",
})
export class BasketComponent extends MetadataHelpers implements OnInit {

    constructor(public basket: BasketService, private $api: ApiService, private renderer: Renderer2,
        public mds: MobileDetectService) {
        super();
    }

    ngOnInit() {
        this.basket.items.filter(item => !item.document).forEach(item => this.loadItemDetails(item));
    }

    removeFromBasket(documentId: string) {
        this.basket.removeItem(documentId);
    }

    thumbLoaded(event: Event) {
        const elm = <Element>event.target;
        this.renderer.removeClass(elm.parentElement, "loading");
    }

    defaultThumb(event: Event, item: BasketItem) {
        const elm = <Element>event.target;
        const parent = this.renderer.parentNode(elm);
        const ph = this.renderer.createElement("div");

        const cls = item.mainFile ? `img-${fileExtension(item.mainFile)}` : "img-placeholder";
        ph.classList.add(cls);

        this.copyClassList(elm, ph);
        this.renderer.removeClass(elm.parentElement, "loading");
        this.renderer.insertBefore(parent, ph, elm);
        this.renderer.removeChild(parent, elm);

        return null;
    }

    private loadItemDetails(item) {
        this.$api.solrCondQuery("id:" + item.documentId).toPromise()
            .then((res: SolrSelectResponse) => {
                item.document = res.response.docs[0];
                item.thumbnail = this.$api.thumbUrl(item.documentId, 75);

                const derId = item.document["link"] ? item.document["link"].find((l) => l.indexOf("derivate") !== -1) : null;
                if (derId) {
                    const params = new Map();
                    params.set("fl", "id,maindoc");
                    params.set("limit", 1);
                    params.set("facet", "off");

                    this.$api.solrSelect(`id:${derId}`, params).subscribe(
                        (r: SolrSelectResponse) => {
                            if (res.response.numFound === 1) {
                                item.mainFile = r.response.docs[0]["maindoc"];
                            }
                        });
                }
            });
    }

    private copyClassList(from: Element, to: Element, expect: Array<string> = []) {
        for (let ci = 0; ci < from.classList.length; ci++) {
            const cls = from.classList.item(ci);
            if (expect.length === 0 || expect.indexOf(cls) === -1) {
                to.classList.add(cls);
            }
        }
    }
}

export const BasketStates = {
    name: "basket",
    url: "/basket",
    component: BasketComponent,
    data: {
        breadcrumb: "basket.breadcrumb",
        parentState: "home",
        requiresAuth: false
    },
    params: {}
};
