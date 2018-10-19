import { ChangeDetectorRef, EventEmitter, Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { Subject } from "rxjs";

import { ApiService } from "../_services/api.service";
import { Cache, CacheService } from "../_services/cache.service";

import { retry } from "rxjs/operators";

@Pipe({
    name: "objectUrl",
    pure: false
})
export class ObjectUrlPipe implements PipeTransform {

    private static promises: Map<string, Promise<any>> = new Map();

    private static cachePrefix = "objectUrl";

    private static cacheLifetime: number = 5 * 10 * 1000;

    private lastValue: any = null;

    public static disposeAll() {
        const caches = CacheService.getAllByPrefix(ObjectUrlPipe.cachePrefix);
        caches.forEach((v: Cache, k) => {
            if (v.obj && v.obj.url && v.obj.url.startsWith("blob")) {
                CacheService.delete(k);
            }
        });
    }

    constructor(private _ref: ChangeDetectorRef, private _sanitizer: DomSanitizer, private $api: ApiService) {
    }

    transform(url: string, progress?: Subject<number>, needTrusted: boolean = false): any {
        if (!url) {
            return null;
        }

        const cacheKey = CacheService.buildCacheKey(ObjectUrlPipe.cachePrefix, url);
        if (CacheService.get(cacheKey)) {
            this.updateLatestValue(cacheKey, needTrusted);
        } else if (!ObjectUrlPipe.promises.get(cacheKey)) {
            ObjectUrlPipe.promises.set(cacheKey,
                this.$api.createObjectUrl(url, progress).pipe(retry(3)).toPromise());

            const promise = ObjectUrlPipe.promises.get(cacheKey);
            promise.then((res) => {
                const removeEvent = new EventEmitter<Cache>();
                removeEvent.subscribe((cache: Cache) => {
                    if (cache.obj && cache.obj.url && cache.obj.url.startsWith("blob")) {
                        window.URL.revokeObjectURL(cache.obj.url);
                    }
                });
                CacheService.set(cacheKey, res, ObjectUrlPipe.cacheLifetime, removeEvent);
                this.updateLatestValue(cacheKey, needTrusted);
                ObjectUrlPipe.promises.delete(cacheKey);
            });
        }

        return this.lastValue;
    }

    private updateLatestValue(cacheKey: string, needTrusted: boolean = false) {
        const objectUrl = CacheService.get(cacheKey);

        if (objectUrl) {
            if (needTrusted) {
                this.lastValue = {
                    url: this._sanitizer.bypassSecurityTrustUrl(objectUrl.url),
                    type: objectUrl.type,
                    size: objectUrl.size,
                    filename: objectUrl.filename
                };
            } else {
                this.lastValue = objectUrl;
            }

            this._ref.markForCheck();
        }
    }
}
