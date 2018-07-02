import { Component, OnInit, OnDestroy, ViewChild, Renderer2 } from "@angular/core";

import { AuthService } from "../_services/auth.service";

interface ElementDimensions {
    height: number;
    width: number;
}

@Component({
    selector: "ui-home",
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit, OnDestroy {

    @ViewChild("teaser")
    public teaser;

    constructor(public $auth: AuthService, private renderer: Renderer2) { }

    ngOnInit() {
        this.initTeaser();
    }

    ngOnDestroy() {
        this.renderer.destroy();
    }

    private scale(sizeMax: ElementDimensions, size: ElementDimensions): ElementDimensions {
        const ratio = Math.max(sizeMax.height / size.height, sizeMax.width / size.width);
        return {
            height: Math.ceil(size.height * ratio),
            width: Math.ceil(size.width * ratio)
        };
    }

    private initTeaser() {
        this.resizeTeaser();
        this.renderer.listen("window", "orientationchange", () => this.resizeTeaser());
        this.renderer.listen("window", "resize", () => this.resizeTeaser());

        const teaser = this.teaser.nativeElement;
        const items = teaser.querySelectorAll(".carousel-item");

        this.renderer.listen("window", "scroll", () => {
            for (const i of items) {
                const yPos = (window.scrollY > 0 ? -(window.scrollY / i.dataset.speed) : 0);
                this.renderer.setStyle(i, "backgroundPosition", "50% " + yPos + "px");
            }
        });
    }

    private resizeTeaser() {
        const teaser = this.teaser.nativeElement;
        const w: ElementDimensions = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        const items = teaser.querySelectorAll(".carousel-item");

        const reUrl = /^url\((['\"]?)(.*)\1\)$/;

        this.renderer.setStyle(teaser, "height", w.height + "px");

        for (const i of items) {
            const speed = i.dataset.speed;

            let url = reUrl.exec(i.style.backgroundImage)[2] || "";

            const ext = url.substr(url.lastIndexOf("."));
            const filename = url.substr(0, url.lastIndexOf(".")).replace(/_SD|_HD|_UHD|/gi, "");

            if (w.height > 568) {
                url = filename + "_SD" + ext;
            } if (w.width >= 1366 || w.height >= 1080) {
                url = filename + "_HD" + ext;
            } if (w.width >= 1921 || w.height >= 2160) {
                url = filename + "_UHD" + ext;
            }

            const img = new Image();
            img.addEventListener("load", (e) => {
                const elm: any = e.srcElement;
                const dim = this.scale({
                    width: w.width,
                    height: speed === 0 ? w.height : Math.ceil(w.height * (w.height + (w.height / speed * 2)) / w.height)
                }, { width: elm.width, height: elm.height });
                this.renderer.setStyle(i, "backgroundSize", dim.width + "px " + dim.height + "px");
            });
            img.src = url;

            this.renderer.setStyle(i, "height", w.height + "px");
            this.renderer.setStyle(i, "backgroundImage", "url(" + url + ")");
        }
    }
}

export const HomeStates = {
    name: "home",
    url: "/",
    component: HomeComponent,
    data: {
        breadcrumb: "navigation.home",
        requiresAuth: false
    }
};
