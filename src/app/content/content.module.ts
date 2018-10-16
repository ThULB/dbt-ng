import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";

import { ContentComponent, ContentStates } from "./content.component";
import { FAQComponent, FAQStates } from "./faq.component";
import { StaticContentComponent, StaticContentStates } from "./staticContent.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        UIRouterModule.forChild({
            states: [
                ContentStates,
                FAQStates,
                StaticContentStates
            ]
        })
    ],
    declarations: [
        ContentComponent,
        FAQComponent,
        StaticContentComponent
    ],
    exports: [
        ContentComponent,
        FAQComponent,
        StaticContentComponent
    ]
})
export class ContentModule { }
