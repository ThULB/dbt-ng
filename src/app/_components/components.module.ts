import { NgModule  } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ConfirmButtonComponent } from "./confirmButton.component";

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        ConfirmButtonComponent
    ],
    exports: [
        ConfirmButtonComponent
    ]
})
export class ComponentsModule { }
