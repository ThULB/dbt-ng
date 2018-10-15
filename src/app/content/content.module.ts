import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";

import { ContentComponent, ContentStates } from "./content.component";
import { FAQComponent, FAQStates } from "./faq.component";

@NgModule({
    imports: [
        CommonModule,
        TranslateModule,
        UIRouterModule.forChild({
            states: [
                ContentStates,
                FAQStates
            ]
        })
    ],
    declarations: [
        ContentComponent,
        FAQComponent
    ],
    exports: [
        ContentComponent,
        FAQComponent
    ]
})
export class ContentModule { }
