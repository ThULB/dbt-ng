import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DirectivesModule } from "../_directives/directives.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";
import { NgPipesModule } from "angular-pipes";
import { PipesModule } from "../_pipes/pipes.module";

import { PersonApiService } from "./api.service";
import { PersonBrowseComponent, PersonBrowseStates } from "./browse.component";
import { PersonComponent, PersonStates } from "./person.component";

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
                PersonBrowseStates,
                PersonStates
            ]
        })
    ],
    declarations: [
        PersonBrowseComponent,
        PersonComponent
    ],
    exports: [
        PersonBrowseComponent,
        PersonComponent
    ],
    providers: [
        PersonApiService
    ]
})
export class PersonModule { }
