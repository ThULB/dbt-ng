import { Component, OnInit, Input } from "@angular/core";

import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

import { ErrorService } from "../_services/error.service";
import { MetadataApiService } from "./api.service";

import { MCRObject, MCRObjectVersion } from "../_datamodels/datamodel.def";

@Component({
    selector: "ui-sysinfo",
    templateUrl: "./sysInfo.component.html"
})
export class SysInfoComponent implements OnInit {

    @Input()
    public object: MCRObject;

    public loading = true;

    public versions: Array<MCRObjectVersion>;

    constructor(private $api: MetadataApiService, private $error: ErrorService, private modalService: NgbModal) {
    }

    ngOnInit() {
        this.load();
    }

    private load() {
        this.loading = true;
        return this.$api.versions(this.object.id)
            .toPromise().then((res: Array<MCRObjectVersion>) => {
                this.versions = res;
                this.loading = false;
            }).catch((err) => {
                this.loading = false;
                this.$error.handleError(err);
            });
    }

    openModal(content) {
        this.modalService.open(content, { size: "lg" });
        return false;
    }
}
