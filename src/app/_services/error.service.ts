import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class ErrorService {

    constructor(private toastr: ToastrService, private translate: TranslateService) { }

    handleMessage(type: string = "info", obj: string | any,
        i18n: string = null, i18nHeadline: string = null, silent: boolean = false) {
        const message = i18n ? this.translate.instant(i18n, obj) : obj;

        if (!silent) {
            switch (type.toLowerCase()) {
                case "info":
                    this.toastr.info(message, this.translate.instant(i18nHeadline || "alert.type." + type));
                    break;
                case "success":
                    this.toastr.success(message, this.translate.instant(i18nHeadline || "alert.type." + type));
                    break;
                case "warning":
                    this.toastr.warning(message, this.translate.instant(i18nHeadline || "alert.type." + type));
                    break;
                default:
                    this.toastr.error(message, this.translate.instant(i18nHeadline || "alert.type.error"));
            }
        } else {
            switch (type.toLowerCase()) {
                case "info":
                case "success":
                    break;
                case "warning":
                    console.warn(message);
                    break;
                default:
                    console.error(message);
            }
        }
    }

    handleError(error: HttpErrorResponse | any, silent: boolean = false) {
        let type = "error";
        let message = this.translate.instant("alert.network.unknown");

        if (error.error instanceof ErrorEvent) {
            message = error.error && (error.error.message || error.error.toString()) || error;
        } else if (error.status || error.error) {
            const i18n = "alert.network.error." + error.status;
            const status = this.translate.instant(i18n);

            if (error.status === 403) {
                type = "warning";
            }

            message = status !== i18n && status || error.error && (error.error.message || error.error.toString());
        } else {
            console.log(error);
        }

        this.handleMessage(type, message, null, null, silent);
    }


}
