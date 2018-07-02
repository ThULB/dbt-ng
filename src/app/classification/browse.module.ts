import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";
import { NgPipesModule } from "angular-pipes";
import { PipesModule } from "../_pipes/pipes.module";

import { ClassificationBrowseComponent, ClassificationBrowseStates } from "./browse.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        NgbModule,
        NgPipesModule,
        PipesModule,
        UIRouterModule.forChild({
            states: [
                ClassificationBrowseStates
            ]
        })
    ],
    declarations: [
        ClassificationBrowseComponent
    ],
    exports: [
        ClassificationBrowseComponent
    ],
    providers: [
    ]
})
export class ClassificationBrowseModule { }
