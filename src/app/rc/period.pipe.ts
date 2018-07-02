import { Pipe, PipeTransform } from "@angular/core";

import { CacheService } from "../_services/cache.service";

import { matchingPeriod } from "./datamodel.def";

@Pipe({
    name: "period",
    pure: false
})
export class PeriodPipe implements PipeTransform {

    private cachePrefix = "rc-period";

    transform(validTo: string, short: boolean = true): string {
        if (validTo) {
            const cacheKey = [this.cachePrefix, validTo].join("_");

            let p = CacheService.get(cacheKey);
            if (!p) {
                p = matchingPeriod(validTo);
                CacheService.set(cacheKey, p);
            }

            return short ? p.shortFormated : p.longFormated;
        }

        return null;
    }

}
