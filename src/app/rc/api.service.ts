import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ApiService } from "../_services/api.service";

import { TransformProvider } from "../_providers/transform.provider";

@Injectable()
export class RCApiService extends ApiService {

    constructor(public $http: HttpClient, public $transform: TransformProvider) {
        super($http, $transform);
    }

    slots(search?: string, filter?: string, start: number = 0, rows: number = 50, sortBy?: Array<string>) {
        const params = [search, start.toString(), rows.toString()];

        const qs = [
            `${filter ? "filter=" + filter : null}`,
            sortBy ? "sortBy=" + sortBy.filter(e => e).join("&sortBy=") : null
        ].filter(e => e).join("&");

        return this.$http.get(`${this.base}/api/v2/rc/list/${params.
            filter(p => p && p.length !== 0).join("/")}${qs ? "?" + qs : ""}`, this.httpOptions);
    }

    slot(id: string) {
        return this.$http.get(`${this.base}/api/v2/rc/${id}`, this.httpOptions);
    }
    
    attendees(id: string) {
        return this.$http.get(`${this.base}/api/v2/rc/${id}/attendees`, this.httpOptions);
    }
}
