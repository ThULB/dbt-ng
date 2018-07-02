import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DirectivesModule } from "../_directives/directives.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslateModule } from "@ngx-translate/core";
import { UIRouterModule } from "@uirouter/angular";
import { NgPipesModule } from "angular-pipes";
import { PipesModule } from "../_pipes/pipes.module";
import { PdfViewerModule } from "ng2-pdf-viewer";

import { MetadataApiService } from "./api.service";

import { CitationComponent } from "./citation.component";
import { MetadataComponent, MetadataStates } from "./metadata.component";
import { FileListComponent } from "./fileList.component";
import { FileUploadComponent, FileDropZoneDirective } from "./fileUpload.component";
import { RelatedItemsComponent } from "./relatedItems.component";
import { PreviewComponent } from "./preview.component";
import { SysInfoComponent } from "./sysInfo.component";

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
        PdfViewerModule,
        UIRouterModule.forChild({
            states: [
                MetadataStates
            ]
        })
    ],
    declarations: [
        CitationComponent,
        MetadataComponent,
        FileListComponent,
        FileUploadComponent,
        FileDropZoneDirective,
        RelatedItemsComponent,
        PreviewComponent,
        SysInfoComponent
    ],
    exports: [
        CitationComponent,
        MetadataComponent,
        FileListComponent,
        FileUploadComponent,
        FileDropZoneDirective,
        RelatedItemsComponent,
        PreviewComponent,
        SysInfoComponent
    ],
    providers: [
        MetadataApiService
    ]
})
export class MetadataModule { }
