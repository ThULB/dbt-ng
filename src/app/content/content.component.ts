import { Component,  } from "@angular/core";

@Component({
    selector: "ui-content",
    templateUrl: "./content.component.html"
})
export class ContentComponent {
        
}
export const ContentStates = {
    name: "content",
    url: "/content",
    redirectTo: "content.faq",
    component: ContentComponent,
    data: {
        parentState: "home",
        requiresAuth: false
    },
};
