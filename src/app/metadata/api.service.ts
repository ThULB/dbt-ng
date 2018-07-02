import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ApiService } from "../_services/api.service";

import { TransformProvider } from "../_providers/transform.provider";

@Injectable()
export class MetadataApiService extends ApiService {

    constructor(public $http: HttpClient, public $transform: TransformProvider) {
        super($http, $transform);
    }

    mediaSources(id: string) {
        return this.$http.get(`${this.base}/rsc/media/sources/${id}`, this.httpOptions);
    }

    mediaProgressivUrl(id: string, fileName: string) {
        return `${this.base}/rsc/media/progressiv/${id}/${fileName}`;
    }

    mediaThumbs(id: string) {
        return this.$http.get(`${this.base}/rsc/media/thumbs/${id}`, this.httpOptions);
    }

    mediaThumbUrl(id: string, fileName: string) {
        return `${this.base}/rsc/media/thumb/${id}/${fileName}`;
    }
}
