import { AfterViewInit, Component, Input } from "@angular/core";
import { StateService } from "@uirouter/core";
import { TranslateService } from "@ngx-translate/core";

import * as Waves from "node-waves";

import { AuthService } from "./_services/auth.service";
import { BasketService } from "./basket/basket.service";

@Component({
    selector: "ui-root",
    templateUrl: "./app.component.html"
})
export class AppComponent implements AfterViewInit {

    private langs = ["de", "en"];

    @Input() public query: string;

    constructor(public $auth: AuthService, public basket: BasketService, public translate: TranslateService,
        private $state: StateService) {
        translate.addLangs(this.langs);
        translate.setDefaultLang(this.langs[0]);
        translate.use(window.localStorage.getItem("lang") || translate.getBrowserLang());
    }

    ngAfterViewInit() {
        Waves.attach(".navbar-toggler", ["waves-block", "waves-light"]);
        Waves.attach("a.nav-link", ["waves-block", "waves-light"]);
        Waves.attach(".btn.btn-default", ["waves-block"]);
        Waves.attach(".btn.btn-primary", ["waves-block", "waves-light"]);
        Waves.attach(".dropdown-menu > .dropdown-item", ["waves-block", "waves-light"]);

        Waves.init({
            duration: 500,
            delay: 200
        });
    }

    setCurrentLang(lang: string) {
        if (lang) {
            window.localStorage.setItem("lang", lang);
            this.translate.use(lang);
        }
    }

    search() {
        this.$state.go("search", { query: this.query, page: 1, facets: null }).then(() => window.scroll(0, 0));
    }

}
