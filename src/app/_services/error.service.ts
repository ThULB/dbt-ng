import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class ErrorService {

    constructor(private toastr: ToastrService, private translate: TranslateService) { }

    handleError(error: HttpErrorResponse | any, silent: boolean = false) {
        let message = this.translate.instant("alert.network.unknown");

        if (error.error instanceof ErrorEvent) {
            message = error.error.message;
        } else if (error.status || error.error) {
            const i18n = "alert.network.error." + error.status;
            message = this.translate.instant(i18n);
            if (message === i18n) {
                message = error.error.message || error.error.toString() || error.status;
            }
        } else {
            console.log(error);
        }

        if (!silent) {
            this.toastr.error(message, this.translate.instant("alert.type.error"));
        } else {
            console.error(message);
        }
    }

}
