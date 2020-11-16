import {
    Component, Directive, OnInit, Input, Output, OnChanges, HostListener,
    SimpleChanges, SimpleChange, EventEmitter
} from "@angular/core";

import { Subject } from "rxjs";
import { distinctUntilChanged } from "rxjs/operators";

import { ErrorService } from "../_services/error.service";
import { ApiService } from "../_services/api.service";

interface FileItem {
    file: File | any;
    progressEvent?: Subject<number>;
    progress?: number;
    complete: boolean;
    processing: boolean;
    error: boolean;
    created?: number;
    started?: number;
    completed?: number;
}

@Component({
    selector: "ui-fileupload",
    templateUrl: "./fileUpload.component.html",
    styleUrls: ["fileUpload.component.scss"]
})
export class FileUploadComponent implements OnInit, OnChanges {

    private static MAX_CONCURRENT_UPLOADS = 1;

    private static QUEUE_REMOVE_TIMEOUT = 30000;

    @Input()
    public derivate;

    @Input()
    public path;

    @Output()
    public reload = new EventEmitter();

    public queue: Array<FileItem> = new Array();

    constructor(private $api: ApiService, private $error: ErrorService) {
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        const derivate: SimpleChange = changes.derivate;
        if (derivate && derivate.previousValue !== derivate.currentValue) {
            this.derivate = derivate.currentValue;
        }

        const path: SimpleChange = changes.path;
        if (path && path.previousValue !== path.currentValue) {
            this.path = path.currentValue;
        }
    }

    onFiles(files: any) {
        if (files instanceof Array) {
            files.forEach(f => {
                const qitem: FileItem = {
                    file: f,
                    progressEvent: new Subject(),
                    complete: false,
                    processing: false,
                    error: false,
                    created: Date.now()
                };
                qitem.progressEvent.pipe(distinctUntilChanged()).subscribe(p => qitem.progress = p);
                this.queue.push(qitem);
            });

            this.invokeUpload();
        }
    }

    retry(item: FileItem) {
        item.processing = false;
        item.error = false;
        item.complete = false;

        this.invokeUpload();
    }

    private createDirectories(dirs: Array<string>): Promise<any> {
        if (dirs.length === 0) {
            return Promise.resolve();
        }

        const dir = dirs[0];
        return new Promise((resolve, reject) => {
            this.$api.derivateMKDir(
                this.derivate.objectId,
                this.derivate.id,
                dir
            ).toPromise()
                .then(() =>
                    dirs.length === 1 ? resolve() : resolve(this.createDirectories(dirs.slice(1, dirs.length)))
                ).catch((err) =>
                    dirs.length === 1 ? resolve() : resolve(this.createDirectories(dirs.slice(1, dirs.length)))
                );
        });
    }

    private buildFilePath(file) {
        return this.path && this.path.length !== 0 && this.path !== "/" ?
            [this.path, file.filepath || file.name].join("/") :
            file.filepath || file.name;
    }

    private queueItemProcess(item) {
        if (item.complete === false && item.processing === false && item.error === false) {
            item.started = Date.now();
            item.processing = true;
            this.$api.
                derivateUpload(this.derivate.objectId, this.derivate.id, this.buildFilePath(item.file), item.file, item.progressEvent).
                subscribe((res) => this.queueItemDone(item, res), (err) => this.queueItemError(item, err));
        }
    }

    private queueItemDone(item: FileItem, res: any) {
        item.processing = false;
        item.complete = true;
        item.completed = Date.now();

        if (res.status === 201 || res.status === 204) {
            item.error = false;
        } else {
            item.error = true;
        }

        setTimeout(() => {
            const ii = this.queue.findIndex(i => i === item);
            if (ii !== -1) {
                this.queue.splice(ii, 1);
            }
        }, FileUploadComponent.QUEUE_REMOVE_TIMEOUT);

        this.invokeUpload();
    }

    private queueItemError(item: FileItem, err: any) {
        item.processing = false;
        item.complete = true;
        item.error = true;

        this.$error.handleError(err);

        this.invokeUpload();
    }

    private invokeUpload() {
        const waiting = this.queue.
            filter(i => i.complete === false && i.processing === false && i.error === false).
            slice(0, FileUploadComponent.MAX_CONCURRENT_UPLOADS);

        if (waiting.length === 0) {
            this.reload.next(true);
        } else {
            waiting.forEach((item) => {
                const f = item.file;
                const fp = this.buildFilePath(f).split("/");

                if (fp && fp.length > 1) {
                    const dirs = [];
                    const sfp = fp.slice(0, fp.length - 1);
                    sfp.forEach((d, i) => dirs.push(i > 0 ? sfp.slice(0, i + 1).join("/") : sfp[i]));
                    this.createDirectories(dirs).then(() => this.queueItemProcess(item));
                } else {
                    this.queueItemProcess(item);
                }
            });
        }
    }

}

@Directive({ selector: "[fileDropZone]" })
export class FileDropZoneDirective {

    @Output()
    public files = new EventEmitter();

    @HostListener("dragenter", ["$event"])
    @HostListener("dragover", ["$event"])
    onDragOver(event) {
        event.preventDefault();

        // TODO check if accept
    }

    @HostListener("drop", ["$event"])
    onDrop(event) {
        event.preventDefault();

        if (event.dataTransfer.items) {
            this.getFilesWebkitDataTransferItems(event.dataTransfer.items).then((files) => this.upload(files));
        } else {
            this.upload(event.dataTransfer.files);
        }
    }

    @HostListener("change", ["$event"])
    onChange(event) {
        event.preventDefault();

        if (event.target.webkitEntries) {
            this.getFilesWebkitDataTransferItems(event.target.webkitEntries).then((files) => this.upload(files));
        } else {
            this.upload(event.target.files);
        }
    }

    private getFilesWebkitDataTransferItems(dataTransferItems) {
        const files = [];

        const traverseFileTreePromise = (item, path = "") => new Promise(resolve => {
            if (item.isFile) {
                item.file(file => {
                    file.filepath = path + file.name;
                    files.push(file);
                    resolve(file);
                });
            } else if (item.isDirectory) {
                const dirReader = item.createReader();
                dirReader.readEntries(entries => {
                    const entriesPromises = [];
                    for (const entr of entries) {
                        entriesPromises.push(traverseFileTreePromise(entr, path + item.name + "/"));
                    }
                    resolve(Promise.all(entriesPromises));
                });
            }
        });

        return new Promise((resolve, reject) => {
            const entriesPromises = [];
            for (const it of dataTransferItems) {
                entriesPromises.push(traverseFileTreePromise(it.webkitGetAsEntry ? it.webkitGetAsEntry() : it));
            }
            Promise.all(entriesPromises).then(entries => resolve(files));
        });
    }

    private upload(files: any) {
        this.files.next(files);
    }
}
