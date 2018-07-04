import { Component, OnInit, Input, Output, EventEmitter, ElementRef, Renderer2, ViewChild, HostListener } from "@angular/core";

@Component({
    selector: "ng-confirm-button",
    templateUrl: "./confirmButton.component.html",
    styleUrls: ["confirmButton.component.scss"]
})
export class ConfirmButtonComponent implements OnInit {

    private static CONFIRM_TIMEOUT = 5000;

    private static CLICK_DELAY = 250;

    @ViewChild("btnElm")
    private btnElm: ElementRef;

    private timer: any;

    private lastClick = -1;

    @Input()
    public size: string;

    @Input()
    public type = "danger";

    @Input()
    public typeConfirm = "info";

    @Input()
    public typeDone = "success";

    @Input()
    public outline = false;

    public value: string;

    @Input()
    public text: string;

    @Input()
    public textConfirm: string;

    @Input()
    public textDone: string;

    @Output()
    public confirmed = new EventEmitter();

    constructor(private renderer: Renderer2) { }

    ngOnInit() {
        const elm: HTMLElement = this.btnElm.nativeElement;
        this.value = this.text;

        if (this.size) {
            this.renderer.addClass(elm, ["btn", this.size].join("-"));
        }

        if (this.type) {
            const cls = (this.outline ? ["btn", "outline", this.type] : ["btn", this.type]).join("-");
            this.renderer.addClass(elm, cls);
        }

        this.renderer.listen(elm, "mouseout", (evt) => {
            if (!this.timer && (elm.classList.contains("confirm") || elm.classList.contains("done"))) {
                this.timer = setTimeout(() => {
                    this.renderer.removeClass(elm, "done");
                    this.renderer.removeClass(elm, "confirm");
                    this.renderer.removeClass(elm, this.classForType(this.typeConfirm));
                    this.renderer.removeClass(elm, this.classForType(this.typeDone));
                    this.renderer.addClass(elm, this.classForType());
                    this.value = this.text;
                    clearTimeout(this.timer);
                    this.timer = null;
                }, ConfirmButtonComponent.CONFIRM_TIMEOUT);
            }
        });

        this.renderer.listen(elm, "mouseover", (evt) => {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        });
    }

    private classForType(type: string = null) {
        type = type || this.type;
        return (this.outline ? ["btn", "outline", type] : ["btn", type]).join("-");
    }

    @HostListener("click", ["$event"])
    onClick(event: Event) {
        event.preventDefault();

        const elm: HTMLElement = this.btnElm.nativeElement;

        if (!elm.classList.contains("confirm")) {
            this.lastClick = Date.now();
            this.value = this.textConfirm;
            this.renderer.addClass(elm, "confirm");
            this.renderer.removeClass(elm, this.classForType());
            this.renderer.addClass(elm, this.classForType(this.typeConfirm));
        } else if ((Date.now() - this.lastClick) >= ConfirmButtonComponent.CLICK_DELAY) {
            this.lastClick = -1;
            this.value = this.textDone;
            this.renderer.addClass(elm, "done");
            this.renderer.removeClass(elm, this.classForType(this.typeConfirm));
            this.renderer.addClass(elm, this.classForType(this.typeDone));
            this.confirmed.next();
        }
    }

}
