import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";

import { of } from "rxjs";
import { map, catchError } from "rxjs/operators";

import { ApiService } from "../_services/api.service";

import { TransformProvider } from "../_providers/transform.provider";

@Injectable()
export class RCApiService extends ApiService {

  constructor(public $http: HttpClient, public $transform: TransformProvider) {
    super($http, $transform);
  }

  permission(type: string, id?: string) {
    return this.$http.get(
      `${this.base}/api/v2/rc/permission/${type}${id ? "/" + id : ""}`,
      { observe: "response" }
    ).pipe(
      map((res: HttpResponse<any>) => res.status === 200),
      catchError((_err, _caught) => of(false))
    );
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

  fileEntryUrl(id: string, entryId: string) {
    return `${this.base}/api/v2/rc/${id}/file/${entryId}`;
  }

  isStreamingSupported(id: string, entryId: string) {
    return this.$http.get(`${this.base}/api/v2/rc/${id}/streamable/${entryId}`,
      { observe: "response" }
    ).pipe(
      map((res: HttpResponse<any>) => res.status === 200),
      catchError((_err, _caught) => of(false))
    );
  }

  attendees(id: string) {
    return this.$http.get(`${this.base}/api/v2/rc/${id}/attendees`, this.httpOptions);
  }

}
