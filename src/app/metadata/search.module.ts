import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DirectivesModule } from "../_directives/directives.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";
import { NgPipesModule } from "angular-pipes";
import { PipesModule } from "../_pipes/pipes.module";

import { MetadataApiService } from "./api.service";

import { SearchComponent, SearchStates } from "./search.component";

@NgModule({
    imports: [
        CommonModule,
        DirectivesModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        NgbModule,
        NgPipesModule,
        PipesModule,
        UIRouterModule.forChild({
            states: [
                SearchStates,
            ]
        })
    ],
    declarations: [
        SearchComponent,
    ],
    exports: [
        SearchComponent,
    ],
    providers: [
        MetadataApiService
    ]
})
export class SearchModule { }
