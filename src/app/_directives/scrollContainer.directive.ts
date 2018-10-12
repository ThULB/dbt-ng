import { AfterViewChecked, Directive, ElementRef, OnInit, Renderer2 } from "@angular/core";

@Directive({
    selector: "[scrollContainer]"
})
export class ScrollContainerDirective implements OnInit, AfterViewChecked {

    private container: HTMLElement;

    private fadeLeft: HTMLElement;

    private fadeRight: HTMLElement;

    constructor(private el: ElementRef, private renderer: Renderer2) {
    }

    ngOnInit() {
        this.buildScroller();
    }

    ngAfterViewChecked() {
        this.updateOverlayScroller();
    }

    private buildScroller() {
        const elm: HTMLElement = this.el.nativeElement;
        elm.classList.add("scrolling-container");

        this.container = this.renderer.createElement("div");
        this.container.classList.add("scroll-container");

        this.renderer.insertBefore(elm.parentElement, this.container, elm);
        this.renderer.appendChild(this.container, elm);

        this.fadeLeft = this.fadeElement("left");
        this.renderer.appendChild(this.container, this.fadeLeft);

        this.fadeRight = this.fadeElement("right");
        this.renderer.appendChild(this.container, this.fadeRight);

        this.renderer.listen(elm, "scroll", () => this.onScroll());
        this.renderer.listen("window", "resize", () => this.updateOverlayScroller());
        this.renderer.listen("window", "orientationchange", () => this.updateOverlayScroller());
    }

    private fadeElement(position: string): HTMLElement {
        const elm: HTMLElement = this.renderer.createElement("div");
        elm.classList.add(`fade-${position}`);

        const icon: HTMLElement = this.renderer.createElement("i");
        icon.classList.add("fa");
        icon.classList.add(`fa-angle-${position}`);
        this.renderer.appendChild(elm, icon);

        return elm;
    }

    private onScroll() {
        const elm: HTMLElement = this.el.nativeElement;

        if (elm.scrollLeft > 0) {
            this.renderer.addClass(this.fadeLeft, "scrolling");
            if ((elm.scrollWidth - elm.scrollLeft) <= this.container.offsetWidth) {
                this.renderer.removeClass(this.fadeRight, "scrolling");
            } else {
                this.renderer.addClass(this.fadeRight, "scrolling");
            }
        } else {
            this.renderer.removeClass(this.fadeLeft, "scrolling");
            this.renderer.addClass(this.fadeRight, "scrolling");
        }
    }

    private updateOverlayScroller() {
        const elm: HTMLElement = this.el.nativeElement;

        if (elm.scrollWidth > this.container.offsetWidth) {
            if (elm.scrollLeft === 0) {
                this.renderer.addClass(this.fadeRight, "scrolling");
            }
        } else {
            this.renderer.removeClass(this.fadeLeft, "scrolling");
            this.renderer.removeClass(this.fadeRight, "scrolling");
        }
    }

}
