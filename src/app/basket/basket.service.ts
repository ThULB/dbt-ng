import { Injectable, Injector } from "@angular/core";

import { SolrDocument } from "../_datamodels/datamodel.def";

export interface BasketItem {
    documentId: string;
    comment?: string;
    document?: SolrDocument;
    thumbnail?: string;
    mainFile?: string;
    order?: number;
}

@Injectable()
export class BasketService {

    private static STORAGE_PREFIX = "basket";

    public items: Array<BasketItem>;

    constructor(public $injector: Injector) {
        this.items = new Array();
        this.loadItems();
    }

    isInBasket(item: string | BasketItem) {
        return this.items.findIndex((i) => i.documentId === (typeof item === "string" ? item : item.documentId)) !== -1;
    }

    addItem(item: BasketItem) {
        if (item && !this.items.find((i) => i.documentId === item.documentId)) {
            this.items.push(item);
            window.localStorage.setItem(BasketService.STORAGE_PREFIX + "." + item.documentId, JSON.stringify(item));
            this.sort();
        }
    }

    removeItem(item: string | BasketItem) {
        const docId = typeof item === "string" ? item : item.documentId;
        const index = this.items.findIndex((i) => i.documentId === docId);
        if (item && index !== -1) {
            this.items.splice(index, 1);
            window.localStorage.removeItem(BasketService.STORAGE_PREFIX + "." + docId);
            this.sort();
        }
    }

    private loadItems() {
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key.startsWith(BasketService.STORAGE_PREFIX)) {
                const item = JSON.parse(window.localStorage.getItem(key));
                this.items.push(item);
            }
        }
        this.sort();
    }

    private sort() {
        this.items = this.items.sort((a, b) =>
            a.order && b.order ? a.order - b.order : 0
        );
    }
}
