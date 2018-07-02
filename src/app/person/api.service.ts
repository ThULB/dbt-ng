import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ApiService } from "../_services/api.service";

import { TransformProvider } from "../_providers/transform.provider";

@Injectable()
export class PersonApiService extends ApiService {

    constructor(public $http: HttpClient, public $transform: TransformProvider) {
        super($http, $transform);
    }

    lookupPerson(id: string) {
        return this.$http.get(`${this.lookupBaseUrl}/lookup/person/${id}`, this.httpOptions);
    }

}
