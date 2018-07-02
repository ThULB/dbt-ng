import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ApiService } from "../_services/api.service";

import { TransformProvider } from "../_providers/transform.provider";

@Injectable()
export class RCApiService extends ApiService {

    constructor(public $http: HttpClient, public $transform: TransformProvider) {
        super($http, $transform);
    }

    slots(term?: string) {
        term = term || "";
        return this.$http.get(`${this.base}/rsc/rc/${term}`, this.httpOptions);
    }

    slot(id: string) {
        return this.$http.get(`${this.base}/rsc/rc/slot/${id}`, this.httpOptions);
    }
}
