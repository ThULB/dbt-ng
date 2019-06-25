import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ServiceWorkerModule } from "@angular/service-worker";
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
import { MobileDetectService } from "./_services/mobileDetect.service";
import { PersonApiService } from "./person/api.service";
import { ScriptService } from "./_services/script.service";

import { TransformProvider } from "./_providers/transform.provider";

import { BreadcrumbModule } from "./breadcrumb/breadcrumb.module";
import { DirectivesModule } from "./_directives/directives.module";
import { SpinnerModule } from "./spinner/spinner.module";
import { PipesModule } from "./_pipes/pipes.module";

import { AppComponent } from "./app.component";

import { environment } from "../environments/environment";

import { HomeComponent, HomeStates } from "./home/home.component";
import { LoginComponent, LoginStates } from "./login/login.component";

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

// Lazy Loading States
export const BasketFutureState = {
  name: "basket.**",
  url: "/basket",
  loadChildren: () => import("./basket/basket.module").then(m => m.BasketModule)
};

export const ClassificationBrowseFutureState = {
  name: "browse.**",
  url: "/browse",
  loadChildren: () => import("./classification/browse.module").then(m => m.ClassificationBrowseModule)
};

export const ContentFutureState = {
  name: "content.**",
  url: "/content",
  loadChildren: () => import("./content/content.module").then(m => m.ContentModule)
};

export const MetadataFutureState = {
  name: "metadata.**",
  url: "/metadata",
  loadChildren: () => import("./metadata/metadata.module").then(m => m.MetadataModule)
};

export const PersonFutureState = {
  name: "persons.**",
  url: "/persons",
  loadChildren: () => import("./person/person.module").then(m => m.PersonModule)
};

export const RCFutureState = {
  name: "rc.**",
  url: "/rc",
  loadChildren: () => import("./rc/rc.module").then(m => m.RCModule)
};

export const SearchFutureState = {
  name: "search.**",
  url: "/search",
  loadChildren: () => import("./search/search.module").then(m => m.SearchModule)
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
    NgbModule,
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: environment.production }),
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
        ContentFutureState,
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
    AuthService,
    ApiService,
    BasketService,
    CacheService,
    ErrorService,
    MobileDetectService,
    PersonApiService,
    ScriptService,
    TransformProvider
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
