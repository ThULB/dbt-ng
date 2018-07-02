import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { CallbackFilterPipe } from "./callbackFilter.pipe";
import { ClassificationPipe } from "./classification.pipe";
import { DateOrTextPipe } from "./dateOrText.pipe";
import { LimitPipe } from "./limit.pipe";
import { ObjectUrlPipe } from "./objectUrl.pipe";
import { OrderByPipe } from "./orderBy.pipe";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        CallbackFilterPipe,
        ClassificationPipe,
        DateOrTextPipe,
        LimitPipe,
        ObjectUrlPipe,
        OrderByPipe
    ],
    exports: [
        CallbackFilterPipe,
        ClassificationPipe,
        DateOrTextPipe,
        LimitPipe,
        ObjectUrlPipe,
        OrderByPipe
    ]
})
export class PipesModule { }
