import { ChangeDetectorRef, Pipe, PipeTransform } from "@angular/core";

import { ApiService } from "../_services/api.service";
import { CacheService } from "../_services/cache.service";
import { TranslateService } from "@ngx-translate/core";

import { retry } from "rxjs/operators";

@Pipe({
    name: "classification",
    pure: false
})
export class ClassificationPipe implements PipeTransform {

    private static DEFAULT_LANG = "de";

    private static promises: Map<string, Promise<any>> = new Map();

    private urlPattern: RegExp = new RegExp("https?:\/\/.*\/classifications.*\/([^#]+)(?:#(.*))?");

    private cacheLifetime: number = 60 * 60 * 1000;

    private cachePrefix = "classification";

    private lastValue: any = null;

    constructor(private _ref: ChangeDetectorRef, private $api: ApiService, private translate: TranslateService) {
    }

    transform(id: string, name?: string, onlyLabel: boolean = true, withParents: boolean = false): any {
        if (!id) {
            return null;
        }

        if (this.urlPattern.test(id)) {
            const m = id.match(this.urlPattern);
            name = m[1];
            id = m[2];
        } else if (id.indexOf(":") !== -1) {
            const parts = id.split(":");
            name = name || parts[0];
            id = parts[1];
        } else if (!name) {
            name = id;
            id = null;
        }

        if (!name) {
            return null;
        }

        id = id ? id.replace(" ", "_") : id;

        const cacheKey = [this.cachePrefix, name].join("_");
        if (CacheService.get(cacheKey)) {
            this.updateLatestValue(id, name, onlyLabel, withParents);
        } else if (!ClassificationPipe.promises.get(name)) {
            ClassificationPipe.promises.set(name, this.$api.classification(name).pipe(retry(3)).toPromise());

            const promise = ClassificationPipe.promises.get(name);
            promise.then((res) => {
                CacheService.set(cacheKey, res, this.cacheLifetime);
                this.updateLatestValue(id, name, onlyLabel, withParents);
                ClassificationPipe.promises.delete(name);
            });
        }

        return this.lastValue;
    }

    private updateLatestValue(id: string, name: string, onlyLabel: boolean = true, withParents: boolean = false) {
        const curLang = this.translate.currentLang;
        const labelCacheKey = [this.cachePrefix, name, id, curLang, onlyLabel.toString(), withParents.toString()]
            .join("_");

        const cachedValue = CacheService.get(labelCacheKey);

        if (cachedValue) {
            this.lastValue = cachedValue;
            this._ref.markForCheck();
        } else {
            const cacheKey = [this.cachePrefix, name].join("_");
            const classification = CacheService.get(cacheKey);
            const categ = id ? this.category(classification.categories || classification.category, id, withParents) : classification;

            if (categ) {
                if (onlyLabel) {
                    if (withParents) {
                        const cl = categ.filter((p) => p.label.filter((l) => curLang.indexOf(l.lang) !== -1) != null);
                        const labels = [];
                        cl.forEach((e) => {
                            const el = e.label.filter((l) => curLang.indexOf(l.lang) !== -1);
                            labels.push(
                                el.length !== 0 ?
                                    el[0].text :
                                    e.labels.filter((l) => ClassificationPipe.DEFAULT_LANG.indexOf(l.lang) !== -1)[0].text
                                    || this.lastValue
                            );
                        }
                        );
                        this.lastValue = labels;
                    } else {
                        const labels = categ.label.filter((l) => curLang.indexOf(l.lang) !== -1);
                        this.lastValue = labels.length !== 0 ? labels[0].text :
                            categ.labels.filter((l) => ClassificationPipe.DEFAULT_LANG.indexOf(l.lang) !== -1)[0].text
                            || this.lastValue;
                    }
                } else {
                    this.lastValue = categ;
                }

                CacheService.set(labelCacheKey, this.lastValue);
                this._ref.markForCheck();
            }
        }
    }

    private category(categories: Array<any>, id: string, withParents: boolean = false): any {
        let parents: Array<any> = [];
        let res = null;

        for (const categ of categories) {
            if (id === categ.ID) {
                res = categ;
            }

            if (!res && (categ.categories || categ.category)) {
                res = this.category((categ.categories || categ.category), id, withParents);
                if (res) {
                    parents.push(categ);
                }
            }

            if (res) {
                break;
            }
        }

        if (withParents) {
            if (res instanceof Array && res.length > 0) {
                parents = parents.concat(res);
            } else if (res) {
                parents.push(res);
            }
        }

        return withParents ? parents.length > 0 ? parents : null : res;
    }
}
