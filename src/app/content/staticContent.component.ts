import { Component, Input } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ErrorService } from "../_services/error.service";
import { SpinnerService } from "../spinner/spinner.service";
import { Transition } from "@uirouter/core";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: "ui-content-static",
    templateUrl: "./staticContent.component.html"
})
export class StaticContentComponent {

    @Input()
    content: any;

}

export const ContentTitleResolver = ($injector, params) => {
    const translate = $injector.get(TranslateService);
    const fileName = params.fileName || "";

    return translate.get(`content.static.${fileName}`);
};

export const resolveFnContent = ($http, $error, $spinner, trans) => {
    $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

    const fileName = trans.params().fileName;

    return $http.get(`/assets/content/${fileName}.html`, { responseType: <"text">"text" })
        .toPromise().then((content: any) => {
            $spinner.setLoadingState(false);
            return content;
        }).catch((err) => {
            $spinner.setLoadingState(false);
            $error.handleError(err);
        });
};

export const StaticContentStates = {
    name: "content.static",
    url: "/static/:fileName",
    component: StaticContentComponent,
    data: {
        parentState: "home",
        breadcrumbLabelResolver: ContentTitleResolver,
    },
    params: {
        fileName: {
            type: "string",
            raw: true
        }
    },
    resolve: [
        {
            token: "content",
            deps: [HttpClient, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnContent
        }
    ]
};
