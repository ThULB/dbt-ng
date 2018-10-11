import { Injectable } from "@angular/core";
import { HttpClient, HttpEventType, HttpRequest, HttpResponse, HttpHeaders } from "@angular/common/http";

import { Subject } from "rxjs/Subject";

import { map, last, catchError, distinctUntilChanged } from "rxjs/operators";
import { of } from "rxjs/observable/of";

import { environment } from "../../environments/environment";

import { TransformProvider } from "../_providers/transform.provider";

export interface ObjectUrl {
    url: string;
    type?: string | null;
    size?: number;
    filename?: string | null;
}

@Injectable()
export class ApiService {

    public base = environment.apiBaseUrl;

    public solrBase = environment.solrBaseUrl;

    public lookupBaseUrl = environment.lookupBaseUrl;

    public httpOptions = environment.apiHttpOptions;

    constructor(public $http: HttpClient, public $transform: TransformProvider) { }

    static toQueryString(params: Map<string, any>): string {
        let p = "";
        if (params) {
            params.forEach((v, k) => {
                if (v instanceof Array) {
                    v.forEach((va) => p += "&" + k + "=" + va);
                } else {
                    p += "&" + k + "=" + v;
                }
            });
        }
        return p;
    }

    static getFileNameFromResponseContentDisposition(res: HttpResponse<any>) {
        const contentDisposition = res.headers.get("content-disposition") || "";
        const re = new RegExp("filename=\"?([^;\"]+)", "i");
        if (re.test(contentDisposition)) {
            const matches = re.exec(contentDisposition);
            const fileName = (matches[1] || "untitled").trim();
            return fileName;
        }

        return null;
    }

    /**
     * APP Settings
     */
    settings() {
        return this.$http.get(`/assets/settings.json`, this.httpOptions);
    }

    /**
     * Access
     */
    login(username, password) {
        const options = { headers: new HttpHeaders().set("Authorization", "Basic " + btoa([username, password].join(":"))) };
        return this.$http.get(`${this.base}/api/v2/auth/login`, options);
    }

    renewToken() {
        return this.$http.get(`${this.base}/api/v2/auth/renew`, this.httpOptions);
    }

    sessionPing() {
        return this.$http.get(`${this.base}/rsc/echo/ping`, { responseType: "text" as "text" }).pipe(
            map(res => "pong" === res)
        );
    }

    /**
     * SOLR
     */
    solrCondQuery(query?: string, start: number = 0, rows: number = 20, params?: Map<string, any>) {
        query = query || "*";
        const p = ApiService.toQueryString(params);
        return this.$http.get(
            `${this.solrBase}/find/?condQuery=${query}&start=${start}&rows=${rows}${p}&wt=json&indent=off`,
            this.httpOptions
        );
    }

    solr(type: string, query?: string, params?: Map<string, any>) {
        query = query || "*";
        const p = ApiService.toQueryString(params);

        return this.$http.post(`${this.solrBase}/${type}?q=${query}${p}&wt=json&indent=off`, this.httpOptions);
    }

    solrSelect(query?: string, params?: Map<string, any>) {
        query = query || "*";
        const p = ApiService.toQueryString(params);

        return this.$http.post(`${this.solrBase}/select?q=${query}${p}&wt=json&indent=off`, this.httpOptions);
    }

    /**
     * MyCoRe Base
     */

    classifications() {
        return this.$http.get(`${this.base}/api/v2/classifications`, this.httpOptions);
    }

    classification(name) {
        return this.$http.get(`${this.base}/api/v2/classifications/${name}`, this.httpOptions);
    }

    object(id: string) {
        return this.$http.get(`${this.base}/api/v2/objects/${id}`,
            { headers: { accept: "application/xml" }, responseType: "text" as "text" }).pipe(
            map((res) => this.$transform.convertToJson(res))
            );
    }

    objectWriteAllow(objectId: string) {
        return this.$http.put(`${this.base}/api/v2/objects/${objectId}/try`,
            null, { observe: "response" }).pipe(
            map((res: HttpResponse<any>) => res.status === 202),
            catchError((err, caught) => of(false))
            );
    }

    objectDeleteAllow(objectId: string) {
        return this.$http.delete(`${this.base}/api/v2/objects/${objectId}/try`,
            { observe: "response" }).pipe(
            map((res: HttpResponse<any>) => res.status === 202),
            catchError((err, caught) => of(false))
            );
    }

    versions(id: string, revision?: number) {
        if (revision) {
            return this.$http.get(`${this.base}/api/v2/objects/${id}/versions/${revision}`,
                { headers: { accept: "application/xml" }, responseType: "text" as "text" }).pipe(
                map((res) => this.$transform.convertToJson(res))
                );
        }

        return this.$http.get(`${this.base}/api/v2/objects/${id}/versions`, this.httpOptions);
    }

    listDerivates(objectId: string) {
        return this.$http.get(`${this.base}/api/v2/objects/${objectId}/derivates`, this.httpOptions);
    }

    derivate(objectId: string, derivateId: string) {
        return this.$http.get(`${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}`,
            { headers: { accept: "application/xml" }, responseType: "text" as "text" }).pipe(
            map((res) => this.$transform.convertToJson(res))
            );
    }

    derivateWriteAllow(objectId: string, derivateId: string) {
        return this.$http.put(`${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/try`,
            null, { observe: "response" }).pipe(
            map((res: HttpResponse<any>) => res.status === 202),
            catchError((err, caught) => of(false))
            );
    }

    derivateDeleteAllow(objectId: string, derivateId: string) {
        return this.$http.delete(`${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/try`,
            { observe: "response" }).pipe(
            map((res: HttpResponse<any>) => res.status === 202),
            catchError((err, caught) => of(false))
            );
    }

    derivateContent(objectId: string, derivateId: string, path: string = "", force: boolean = false) {
        path = path || "";

        const options = force ?
            Object.assign({
                headers: {
                    "Cache-Control": [
                        "no-cache",
                        "must-revalidate",
                        "proxy-revalidate",
                        "post-check=0",
                        "pre-check=0",
                        "max-age=0"
                    ],
                    "expires": ["0", "Tue, 01 Jan 1980 1:00:00 GMT"],
                    "pragma": "no-cache"
                }
            }, this.httpOptions) :
            this.httpOptions;

        return this.$http.get(`${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/contents/${path}`, options);
    }

    derivateMKDir(objectId: string, derivateId: string, path: string = "") {
        path = path || "";

        return this.$http.put(
            `${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/contents/${path}`,
            undefined,
            { headers: { "X-MCR-Ignore-Message-Body": "mkdir" } }
        );
    }

    derivateUpload(objectId: string, derivateId: string, path: string = "", file: File, progress?: Subject<number>) {
        path = path || "";

        const req = new HttpRequest(
            "PUT",
            `${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/contents/${path}`,
            file,
            {
                reportProgress: progress !== undefined
            }
        );

        return this.$http.request(req).pipe(
            distinctUntilChanged(),
            map(event => {
                if (event.type === HttpEventType.UploadProgress && progress && event.total) {
                    const percentDone = Math.round(100 * event.loaded / event.total);
                    progress.next(percentDone);
                } else if (event.type === HttpEventType.Response) {
                    if (progress) {
                        progress.next(100);
                        progress.complete();
                    }

                    return event;
                }
            }),
            last()
        );
    }

    derivateDelete(objectId: string, derivateId: string, path: string = "") {
        path = path || "";

        return this.$http.delete(
            `${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/contents/${path}`
        );
    }

    fileUrl(objectId: string, derivateId: string, file: string, path?: string) {
        const fp = path ? path + "/" + file : file;

        return `${this.base}/api/v2/objects/${objectId}/derivates/${derivateId}/contents/${fp}`;
    }

    fileObjectUrl(objectId: string, derivateId: string, file: string, path?: string) {
        return this.createObjectUrl(this.fileUrl(objectId, derivateId, file, path));
    }

    createObjectUrl(url: string, progress?: Subject<number>) {
        return this.$http.get(url, {
            headers: { accept: "*/*" },
            observe: "events",
            responseType: "blob",
            reportProgress: progress !== undefined
        }).pipe(
            distinctUntilChanged(),
            map(event => {
                if (event.type === HttpEventType.DownloadProgress && progress && event.total) {
                    const percentDone = Math.round(100 * event.loaded / event.total);
                    progress.next(percentDone);
                } else if (event.type === HttpEventType.Response) {
                    if (progress) {
                        progress.next(100);
                        progress.complete();
                    }
                    return {
                        url: window.URL.createObjectURL(event.body),
                        type: event.body.type,
                        size: event.body.size,
                        filename: ApiService.getFileNameFromResponseContentDisposition(event)
                    };
                }
            }),
            last()
            );
    }

    thumbUrl(id: string, size: number = 150, ext: string = "jpg") {
        return `${this.base}/api/v2/objects/${id}/thumb-${size}.${ext}`;
    }

    /**
     * Media APIs
     */

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
