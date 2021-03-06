import { Component, Input, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { ErrorService } from "../_services/error.service";
import { SpinnerService } from "../spinner/spinner.service";
import { StateService, Transition, UIRouterGlobals } from "@uirouter/core";

export interface FAQEntry {
    href: string;
    question: string;
    answer: string;
}

export interface FAQCategory {
    title: string;
    href: string;
    entry: Array<FAQEntry>;
}

@Component({
    selector: "ui-content-faq",
    templateUrl: "./faq.component.html"
})
export class FAQComponent implements OnInit {

    @Input()
    faq: Array<FAQCategory>;

    filter: string;

    activeCategory: FAQCategory;

    activeEntry: FAQEntry;

    constructor(private $state: StateService, private globals: UIRouterGlobals) {
        this.filter = decodeURIComponent(this.globals.params.filter);
    }

    ngOnInit() {
        const href = this.globals.params["#"] && this.globals.params["#"].split("?#")[0];

        if (href) {
            this.activeCategory = this.faq.find(c => c.href === href);
            for (const i in this.faq) {
                if (this.faq[i]) {
                    const m = this.faq[i].entry.find(e => e.href === href);
                    if (m) {
                        this.activeCategory = this.faq[i];
                        this.activeEntry = m;
                        break;
                    }
                }
            }
        }

        if (!this.activeCategory) {
            this.activeCategory = this.faq[0];
        }

        if (!this.activeEntry) {
            this.activeEntry = this.activeCategory.entry[0];
        }
    }

    changeFilter(evt: KeyboardEvent) {
        if (evt.key.toLowerCase() === "enter") {
            this.transitionTo();
        }
    }

    private transitionTo() {
        return this.$state.transitionTo(this.globals.$current.name, {
            filter: this.filter,
        }, { reload: true });
    }

}

export const filterFAQ = (faq: Array<FAQCategory>, filter: string): Array<FAQCategory> => {
    if (filter && filter.length !== 0) {
        let f = decodeURIComponent(filter).toLowerCase();
        if (f.indexOf(" ") !== -1) {
            const fp = f.split(" ");
            f = fp.shift();
            filter = fp.join(" ");
        }

        const res = [];
        faq.forEach(c => {
            if (c.title.toLowerCase().indexOf(f) !== -1 ||
                c.entry.filter(e =>
                    e.answer.toLowerCase().indexOf(f) !== -1 || e.question.toLowerCase().indexOf(f) !== -1
                ).length !== 0) {
                const cat = Object.assign({}, c);
                cat.entry = cat.entry.filter(e =>
                    e.answer.toLowerCase().indexOf(f) !== -1 || e.question.toLowerCase().indexOf(f) !== -1
                );

                if (cat.entry.length !== 0) {
                    res.push(cat);
                }
            }
        });

        return filter.indexOf(" ") !== -1 ? filterFAQ(res, filter) : res;
    }

    return faq;
};

export const resolveFnFAQ = ($http: HttpClient, $error: ErrorService, $spinner: SpinnerService, trans: Transition) => {
    $spinner.setLoadingState(trans.options().source !== "url" && trans.from().name !== trans.to().name);

    const filter = trans.params().filter;

    return $http.get("/assets/content/faq.json").toPromise().then((res: any) => {
        $spinner.setLoadingState(false);
        return filterFAQ(res, filter);
    }).catch((err) => {
        $spinner.setLoadingState(false);
        $error.handleError(err);
    });
};

export const FAQStates = {
    name: "content.faq",
    url: "/faq/:filter",
    component: FAQComponent,
    data: {
        parentState: "home",
        breadcrumb: "navigation.faq"
    },
    params: {
        filter: {
            type: "string",
            value: "",
            raw: true,
            squash: true
        }
    },
    resolve: [
        {
            token: "faq",
            deps: [HttpClient, ErrorService, SpinnerService, Transition],
            resolveFn: resolveFnFAQ
        }
    ]
};
