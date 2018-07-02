import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ScrollContainerDirective } from "./scrollContainer.directive";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ScrollContainerDirective
    ],
    exports: [
        ScrollContainerDirective
    ]
})
export class DirectivesModule { }
