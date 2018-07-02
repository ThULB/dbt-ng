import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule, NgModuleFactoryLoader, SystemJsNgModuleLoader } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TranslateCompiler, TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
import { MESSAGE_FORMAT_CONFIG, TranslateMessageFormatCompiler } from "ngx-translate-messageformat-compiler";

import { NgPipesModule } from "angular-pipes";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ToastrModule } from "ngx-toastr";

import { UIRouterModule } from "@uirouter/angular";

import { routerConfigFn } from "./_helpers/router.config";

import { ApiService } from "./_services/api.service";
import { AuthService } from "./_services/auth.service";
import { AuthHttpInterceptor } from "./_services/http.service";
import { BasketService } from "./basket/basket.service";
import { CacheService } from "./_services/cache.service";
import { ErrorService } from "./_services/error.service";
import { MetadataApiService } from "./metadata/api.service";
import { MobileDetectService } from "./_services/mobileDetect.service";
import { PersonApiService } from "./person/api.service";
import { ScriptService } from "./_services/script.service";

import { TransformProvider } from "./_providers/transform.provider";

import { BreadcrumbModule } from "./breadcrumb/breadcrumb.module";
import { DirectivesModule } from "./_directives/directives.module";
import { SpinnerModule } from "./spinner/spinner.module";
import { PipesModule } from "./_pipes/pipes.module";

import { AppComponent } from "./app.component";

import { HomeComponent, HomeStates } from "./home/home.component";
import { LoginComponent, LoginStates } from "./login/login.component";

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

// Lazy Loading States
export const BasketFutureState = {
    name: "basket.**",
    url: "/basket",
    loadChildren: "./basket/basket.module#BasketModule"
};

export const ClassificationBrowseFutureState = {
    name: "browse.**",
    url: "/browse",
    loadChildren: "./classification/browse.module#ClassificationBrowseModule"
};

export const MetadataFutureState = {
    name: "metadata.**",
    url: "/metadata",
    loadChildren: "./metadata/metadata.module#MetadataModule"
};

export const PersonFutureState = {
    name: "persons.**",
    url: "/persons",
    loadChildren: "./person/person.module#PersonModule"
};

export const RCFutureState = {
    name: "rc.**",
    url: "/rc",
    loadChildren: "./rc/rc.module#RCModule"
};

export const SearchFutureState = {
    name: "search.**",
    url: "/search",
    loadChildren: "./metadata/search.module#SearchModule"
};

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        LoginComponent
    ],
    imports: [
        BreadcrumbModule,
        BrowserModule,
        BrowserAnimationsModule,
        DirectivesModule,
        HttpClientModule,
        FormsModule,
        ReactiveFormsModule,
        SpinnerModule,
        NgPipesModule,
        PipesModule,
        NgbModule.forRoot(),
        ToastrModule.forRoot({
            autoDismiss: true,
            timeOut: 10000,
            positionClass: "toast-bottom-right",
            preventDuplicates: true,
            maxOpened: 3
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
            },
            compiler: {
                provide: TranslateCompiler,
                useClass: TranslateMessageFormatCompiler
            }
        }),
        UIRouterModule.forRoot({
            states: [
                HomeStates,
                LoginStates,
                BasketFutureState,
                ClassificationBrowseFutureState,
                MetadataFutureState,
                PersonFutureState,
                RCFutureState,
                SearchFutureState
            ],
            useHash: false,
            config: routerConfigFn,
            otherwise: "/"
        })
    ],
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
        {
            provide: MESSAGE_FORMAT_CONFIG, useValue: {
                biDiSupport: false,
                intlSupport: false,
                strictNumberSign: false
            }
        },
        { provide: NgModuleFactoryLoader, useClass: SystemJsNgModuleLoader },
        AuthService,
        ApiService,
        BasketService,
        CacheService,
        ErrorService,
        MetadataApiService,
        MobileDetectService,
        PersonApiService,
        ScriptService,
        TransformProvider
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
