import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";

import { AuthService } from "../_services/auth.service";
import { ErrorService } from "../_services/error.service";
import { ApiService } from "../_services/api.service";

import { MCRDerivate, MCRDerivateContent } from "../_datamodels/datamodel.def";
import { PreviewComponent } from "./preview.component";

interface DirectoryEntry {
    type: string;
    name?: string;
    md5?: string;
    modified?: Date;
    size?: number;
}

interface DirectoryEntries {
    path?: string;
    entries: Array<DirectoryEntry>;
}

@Component({
    selector: "ui-filelist",
    templateUrl: "./fileList.component.html"
})
export class FileListComponent implements OnInit {

    public loading = false;

    public page = 1;

    public rows = 10;

    public start = 0;

    public end = 10;

    @Input() public derivate: MCRDerivate;

    @Input() public path: string;

    @Output() public selectedFile: EventEmitter<string> = new EventEmitter<string>();

    public content: MCRDerivateContent;

    public dirEntries: DirectoryEntries;

    public mainFile: string;

    public writeAllowed = false;

    public deleteAllowed = false;

    private fileIcons = {
        "PDF": {
            icon: "fa-file-pdf",
            extensions: "pdf|ps"
        },
        "Archive": {
            icon: "fa-file-archive",
            extensions: "zip|tar|rar|bz|xs|gz|bz2|xz"
        },
        "Image": {
            icon: "fa-file-image",
            extensions: "tif|tiff|gif|jpeg|jpg|jif|jfif|jp2|jpx|j2k|j2c|fpx|pcd|png"
        },
        "Text": {
            icon: "fa-file-alt",
            extensions: "txt|rtf"
        },
        "Audio": {
            icon: "fa-file-audio",
            extensions: "wav|wma|mp3"
        },
        "Video": {
            icon: "fa-file-video",
            extensions: "mp4|m4v|f4v|flv|rm|avi|wmv|mov"
        },
        "Code": {
            icon: "fa-file-code",
            extensions: "css|htm|html|php|c|cpp|bat|cmd|pas|java"
        },
        "Word": {
            icon: "fa-file-word",
            extensions: "doc|docx|dot"
        },
        "Excel": {
            icon: "fa-file-excel",
            extensions: "xls|xlt|xlsx|xltx"
        },
        "Powerpoint": {
            icon: "fa-file-powerpoint",
            extensions: "ppt|potx|ppsx|sldx"
        },
        "default": {
            icon: "fa-file"
        }
    };

    constructor(public $api: ApiService, private $auth: AuthService, private $error: ErrorService) {
    }

    ngOnInit() {
        this.load();
        this.mainFile = (this.derivate instanceof MCRDerivate) && this.derivate.getElementsWithAttribute("internal", "mainfile", true)
            .find((e) => e.getAttributeValue("maindoc") !== null).getAttributeValue("maindoc");
    }

    private load(force: boolean = false) {
        this.loading = true;
        this.checkAccess();
        return this.$api.derivateContent(this.derivate.objectId, this.derivate.id, this.path, force)
            .toPromise().then((res: MCRDerivateContent) => {
                this.content = res;
                this.dirEntries = this.buildDirectoryEntries(res);
                this.loading = false;
            }).catch((err) => {
                this.loading = false;
                this.$error.handleError(err);
            });
    }

    private checkAccess() {
        if (this.$auth.isLoggedIn()) {
            this.$api.derivateWriteAllow(this.derivate.objectId, this.derivate.id).
                subscribe((allow) => this.writeAllowed = allow);
            this.$api.derivateDeleteAllow(this.derivate.objectId, this.derivate.id).
                subscribe((allow) => this.deleteAllowed = allow);
        }
    }

    private buildDirectoryEntries(content: MCRDerivateContent): DirectoryEntries {
        if (content) {
            const de: DirectoryEntries = {
                path: content.name,
                entries: []
            };

            content.directories.forEach((d) => de.entries.push({
                type: "dir",
                name: d.name
            }));
            content.files.forEach((f) => de.entries.push({
                type: "file",
                name: f.name,
                md5: f.md5,
                modified: f.modified,
                size: f.size
            }));

            return de;
        }

        return null;
    }

    onReload() {
        this.load(true);
    }

    pageChange(page: number) {
        this.page = page;
        this.start = (this.page - 1) * this.rows;
        this.end = Math.min(this.start + this.rows, this.dirEntries.entries.length);
    }

    isMainFile(name: string) {
        return this.mainFile === (this.path ? [this.path, name].join("/") : name);
    }

    fileType(name: string) {
        const reExt = new RegExp("^.*\\.(.+)$");

        if (name) {
            const ext = reExt.test(name) ? name.match(reExt)[1].toLowerCase() : null;
            const fi = Object.keys(this.fileIcons).find((k) => k !== "default" && this.fileIcons[k].extensions.indexOf(ext) !== -1);
            return this.fileIcons[fi] || this.fileIcons["default"];
        }

        return null;
    }

    cd(dir: string) {
        if (dir === "..") {
            const p = this.path.split("/");
            p.pop();
            this.path = p.join("/");
        } else {
            this.path = this.path ? [this.path, dir].join("/") : dir;
        }

        this.load();
    }

    selectFile(name: string) {
        this.selectedFile.emit(this.derivate.id + ":" + (this.path ? [this.path, name].join("/") : name));
        return !PreviewComponent.isPreviewSupported(name);
    }

    deleteFile(name: string) {
        this.$api.derivateDelete(this.derivate.objectId, this.derivate.id, (this.path ? [this.path, name].join("/") : name)).
            subscribe(() => this.load(true), (err) => this.$error.handleError(err));
    }
}
