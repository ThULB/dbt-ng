import { TransitionService, Transition } from "@uirouter/core";
import { CacheService } from "../_services/cache.service";

export function routerHook(transitionService: TransitionService) {

    const injectReturnToCriteria = {
        to: (state) => {
            return state.name === "login" && state.params.returnTo && state.params.returnTo.value() == null;
        }
    };

    const injectReturnTo = (transition: Transition) => {
        transition.to().params.returnTo = transition.router
            .stateService.target(transition.from().name, transition.params("from"));
        return transition.to();
    };

    const allStateCriteria = {
        to: (state) => {
            return true;
        }
    };

    const closeNavbar = () => {
        const sidebar = window.document.querySelector("#navbar");
        const toggler = window.document.querySelector(".navbar-toggler");
        const content = window.document.querySelector("#container-overlay");

        if (sidebar && content && toggler) {
            sidebar.classList.remove("show");
            toggler.classList.add("collapsed");
            content.classList.remove("show");
        }
    };

    const saveScrollPosition = (transition: Transition) => {
        if (transition.from().name) {
            if ("sref|unknown".indexOf(transition.options().source) !== -1) {
                CacheService.set(
                    CacheService.buildCacheKey("sp" + transition.from().name, transition.params("from")),
                    { x: window.scrollX, y: window.scrollY }, CacheService.DEFAULT_LIFETIME
                );
            }
        }
    };

    const scrollTo = (transition: Transition) => {
        const params = transition.params("to");

        if (params["#"]) {
            setTimeout(() => {
                const container = <HTMLElement>window.document.getElementById("container-main");
                const elm = document.getElementById(params["#"]);
                elm.scrollIntoView({ block: "start", behavior: "smooth" });
                window.scrollBy(0, (container.offsetTop + 30) * -1);
            });
        } else {
            let sp = CacheService.get(CacheService.buildCacheKey("sp" + transition.to().name, params))
                || { x: 0, y: 0 };
            if ("sref|unknown".indexOf(transition.options().source) !== -1) {
                sp = { x: 0, y: 0 };
            }

            setTimeout(() => window.scroll(sp.x, sp.y));
        }
    };

    transitionService.onCreate(injectReturnToCriteria, injectReturnTo, { priority: 10 });

    transitionService.onStart(allStateCriteria, closeNavbar, { priority: 10 });
    transitionService.onStart(allStateCriteria, saveScrollPosition, { priority: 20 });
    transitionService.onFinish(allStateCriteria, scrollTo, { priority: 10 });
}
