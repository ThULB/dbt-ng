import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";
import { NgPipesModule } from "angular-pipes";
import { PipesModule } from "../_pipes/pipes.module";

import { RCApiService } from "./api.service";

import { PeriodPipe } from "./period.pipe";

import { AttendeesComponent, AttendeesStates } from "./attendees.component";
import { OPCRecordComponent } from "./opcrecord.component";
import { SlotsComponent, SlotsStates } from "./slots.component";
import { SlotComponent, SlotStates } from "./slot.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        TranslateModule,
        NgPipesModule,
        PipesModule,
        UIRouterModule.forChild({
            states: [
                AttendeesStates,
                SlotsStates,
                SlotStates
            ]
        })
    ],
    declarations: [
        AttendeesComponent,
        OPCRecordComponent,
        SlotsComponent,
        SlotComponent,
        PeriodPipe
    ],
    exports: [
        AttendeesComponent,
        OPCRecordComponent,
        SlotsComponent,
        SlotComponent,
        PeriodPipe
    ],
    providers: [
        RCApiService
    ]
})
export class RCModule { }
