import { TransitionService, Transition } from "@uirouter/core";

import { BreadcrumbService } from "./breadcrumb.service";

export function breadcrumbHook(transitionService: TransitionService, breadcrumbService: BreadcrumbService) {

    const beforeTransitionCriteria = {
        to: (state) => {
            return true;
        }
    };

    const beforeTransisition = (transition: Transition) => {
        breadcrumbService.setBreadcrumb(transition);
    };

    transitionService.onBefore(beforeTransitionCriteria, beforeTransisition, { priority: 10 });
}
