import { Component, Input } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ErrorService } from "../_services/error.service";
import { SpinnerService } from "../spinner/spinner.service";
import { Transition } from "@uirouter/core";

@Component({
    selector: "ui-content-faq",
    templateUrl: "./faq.component.html"
})
export class FAQComponent {

    @Input()
    faq: any;

}

export function resolveFnFAQ($http, $error, $spinner, trans) {
    $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

    return $http.get("/assets/content/faq.json").toPromise().then((res: any) => {
        $spinner.setLoadingState(false);
        return res;
    }).catch((err) => {
        $spinner.setLoadingState(false);
        $error.handleError(err);
    });
}


export const FAQStates = {
    name: "content.faq",
    url: "/faq",
    component: FAQComponent,
    data: {
        parentState: "home",
        breadcrumb: "navigation.faq"
    },
    resolve: [
        {
            token: "faq",
            deps: [HttpClient, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnFAQ
        }
    ]
};
