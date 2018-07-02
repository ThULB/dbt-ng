import { NgModule, Injectable } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";

import { DirectivesModule } from "../_directives/directives.module";
import { PipesModule } from "../_pipes/pipes.module";

import { BasketService } from "./basket.service";

import { BasketComponent, BasketStates } from "./basket.component";

@NgModule({
    imports: [
        CommonModule,
        DirectivesModule,
        PipesModule,
        TranslateModule,
        UIRouterModule.forChild({
            states: [
                BasketStates
            ]
        })
    ],
    declarations: [
        BasketComponent
    ],
    exports: [
        BasketComponent
    ],
    providers: [
        BasketService
    ]
})
@Injectable()
export class BasketModule { }
