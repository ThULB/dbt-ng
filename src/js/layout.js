/**
 * Set global variables
 */
var webApplicationBaseURL = document.location.protocol + "//" + document.location.host + "/dbt/";
var host2proxy = "https?://(www.db-thueringen.de|mcrsrv4.thulb.uni-jena.de)/";
var proxyHost = document.location.protocol + "//" + document.location.host;
var proxyURL = proxyHost + "/dbt/";

/**
 * Cache MutationObserver
 */
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

/**
 * Hides loader screen.
 */
var hideLoader = function() {
	if ($.isPageLoaded === undefined || $.isPageLoaded === true) {
		setTimeout(function() {
			if ($.isPageLoaded === false) {
				hideLoader();
				return;
			}

			$("body").addClass("loaded");
		}, 20);
	}
};

/**
 * Hook on all links to show loader screen.
 */
var hookLoaderOnLinks = function() {
	window.addEventListener("click", function(event) {
		var $target = $(event.target);
		var onclick = $target.attr("onclick") !== undefined ? /^location\.href=([\'\"]?)([^\'\"]+)\1/.exec($target.attr("onclick"))[2] : undefined;
		var href = $target.attr("href") || $target.closest("*[href]").attr("href") || onclick;

		if (href && href[0] !== "#") {
			event.preventDefault();
			event.stopPropagation();
			$("body").removeClass("loaded");

			var h2pExp = new RegExp("^" + host2proxy);
			if (href.match(h2pExp) !== null) {
				href = proxyHost + "/dynamic.html?url=" + encodeURIComponent(proxyHost + "/dbt/" + href.split(h2pExp)[2]);
			} else if (href.match("^" + proxyURL) !== null) {
				href = proxyHost + "/dynamic.html?url=" + encodeURIComponent(href);
			}

			// wait before next page
			setTimeout(function() {
				location.href = href;
			}, 20);
		}
	}, true);
};

/**
 * Loads given URI/QueryString parameter dynamic. (only for testing)
 */
var loadDynamic = function(uri) {
	if (!uri && !document.location.search && document.location.search.length === 0)
		return;

	$.isPageLoaded = false;
	$.holdReady(true);
	$("body").removeClass("loaded");

	var url = decodeURIComponent(/[&\?]+url=([^&]+)&?/.exec(uri || document.location.search)[1]);

	$.ajax({
		url: url,
	}).done(function(result, textStatus, jqXHR) {
		if (jqXHR.getResponseHeader("Content-Type").indexOf("text/html") !== -1) {
			result = result.replace(/\{PROXY_URL\}/g, proxyURL);
			result = result.replace(/href=\"MCRLoginServlet/g, "href=\"" + proxyURL + "servlets/MCRLoginServlet");
			result = result.replace(/href=\"MCRShibbolethLoginServlet/g, "href=\"" + proxyURL + "servlets/MCRShibbolethLoginServlet");
			result = result.replace(/action=\"\/servlets\//g, "action=\"" + proxyURL + "servlets/");
			result = result.replace(new RegExp(host2proxy, "g"), proxyURL);
			var $html = $(result);

			// replace original host on all links (dynamic.html)
			$html.find("a[href^='" + proxyURL + "']").each(function() {
				$(this).attr("href", proxyHost + "/dynamic.html?url=" + encodeURIComponent(proxyURL + $(this).attr("href").split(proxyURL)[1]));
			});

			$("#container-main > div.container").empty().append($html.find("#main").children());
		} else {
			location.href = url;
		}
	}).fail(function( jqXHR, textStatus ) {
		$("#container-main > div.container").empty().append("<div class=\"alert alert-danger\"><h1>Seite konnte nicht geladen werden</h1><p>" + jqXHR.status + " (" + jqXHR.statusText + ")" + "</p></div>");
	}).always(function() {
		$.holdReady(false);
		$.isPageLoaded = true;

		// reinit
		try {
			window.dispatchEvent(new Event("load"));
			window.dispatchEvent(new Event("pageshow"));
		} catch (e) {
			console.error(e);
			$("body").addClass("loaded");
		}
		init();

		$("#searchForm").on("submit", function(event) {
			event.preventDefault();
			event.stopPropagation();
			var term = $(this).find("input[type='text']").val();
			location.href = proxyHost + "/dynamic.html?url=" + encodeURIComponent(proxyURL + "/servlets/solr/find?q=" + term);
			return;
		});
	});
};

/**
 * Detect vendor prefix.
 */
var prefix = function() {
	var styles = window.getComputedStyle(document.documentElement, ""), pre = (Array.prototype.slice.call(styles).join("").match(/-(moz|webkit|ms)-/) || (styles.OLink === "" && [
		"", "o" ]))[1], dom = ("WebKit|Moz|MS|O").match(new RegExp("(" + pre + ")", "i"))[1];
	return {
		dom : dom,
		lowercase : pre,
		css : "-" + pre + "-",
		js : pre[0].toUpperCase() + pre.substr(1)
	};
};

/**
 * Returns a scaled size for given maximum.
 */
var scale = function(sizeMax, size) {
	var ratio = Math.max(sizeMax.height / size.height, sizeMax.width / size.width);

	return {
		height : Math.ceil(size.height * ratio),
		width : Math.ceil(size.width * ratio)
	};
};

/**
 * Teaser and Map canvas resize.
 */
var resizeTeaser = function() {
	var w = {
			width : $window.innerWidth(),
			height : $window.innerHeight()
	};

	$("#teaser,#teaser .item").each(function() {
		var $this = $(this);
		$this.height(w.height);
	});

	// scale images to parallax needed size
	$("#teaser .item").each(function() {
		var $this = $(this);
		var url = /^url\((['\"]?)(.*)\1\)$/.exec($this.css("backgroundImage"));
		url = url ? url[2] : "";

		var ext = url.substr(url.lastIndexOf("."));
		var filename = url.substr(0, url.lastIndexOf(".")).replace(/_SD|_HD|_UHD|/gi,"");

		if (w.height > 568)
			url = filename + "_SD" + ext;
		if (w.width >= 1366 || w.height >= 1080)
			url = filename + "_HD" + ext;
		if (w.width >= 1921 || w.height >= 2160)
			url = filename + "_UHD" + ext

			var speed = $this.data("speed");
		var img = new Image();

		$(img).on("load", function() {
			var i = scale({
				width : w.width,
				height : speed == null || speed == 0 ? w.height : Math.ceil(w.height * (w.height + (w.height / speed * 2)) / w.height)
			}, this);
			$this.css({
				backgroundSize : i.width + "px " + i.height + "px"
			});
		});

		// invoke load
		img.src = url;
		$this.css({
			"backgroundImage" : "url(" + url + ")"
		})
	});
};

/**
 * Function to animate slider captions
 */
var doAnimations = function(elems) {
	// Cache the animationend event in a variable
	var animEndEv = "webkitAnimationEnd animationend";

	elems.each(function() {
		var $this = $(this), $animationType = $this.data("animation");
		$this.addClass($animationType).one(animEndEv, function() {
			$this.removeClass($animationType);
		});
	});
};

/**
 * Init teaser.
 */
var initTeaser = function() {
	// Variables on page load
	var $teaser = $("#teaser");
	var $firstAnimatingElems = $teaser.find(".item:first").find("[data-animation ^= 'animated']");

	resizeTeaser();
	window.addEventListener("resize", resizeTeaser);

	// Initialize carousel
	$teaser.carousel();

	// Animate captions in first slide on page load
	doAnimations($firstAnimatingElems);

	// Pause carousel
	$teaser.carousel("pause");

	// Other slides to be animated on carousel slide event
	$teaser.on("slide.bs.carousel", function(e) {
		var $animatingElems = $(e.relatedTarget).find("[data-animation ^= 'animated']");
		doAnimations($animatingElems);
	});

	$teaser.find(".item").each(function() {
		var $scroll = $(this);

		$(window).on("scroll", function() {
			// HTML5 proves useful for helping with creating JS functions!
			// also, negative value because we're scrolling upwards
			var yPos = ($window.scrollTop() > 0 ? -($window.scrollTop() / $scroll.data("speed")) : 0);

			// background position
			var coords = "50% " + yPos + "px";

			// move the background
			$scroll.css({
				backgroundPosition : coords
			});
		});
	});
};

/**
 * Builds a SVG image mask for browser doesn't support -webkit-mask.
 */
var buildSVGImageMask = function(icon, styleClass) {
	var rnd = Math.round(Math.random() * 1E8);
	return "<svg width=\"100%\" height=\"100%\" class=\"" + styleClass + "\"><defs><mask id=\"mask" + rnd
	+ "\" maskUnits=\"userSpaceOnUse\" maskContentUnits=\"userSpaceOnUse\"><image width=\"100%\" height=\"100%\" xlink:href=\"" + icon
	+ "\"></image></mask></defs><foreignObject width=\"100%\" height=\"100%\" style=\"mask:url(#mask" + rnd + ");\"><div></div></foreignObject></svg>";
};

/**
 * Inits SVG images masks.
 */
var initSVGImageMasks = function() {
	$("img.hit_icon_overlay[src$='.svg']").each(function() {
		var src = $(this).attr("src");
		var icon = $(document.createElement("span"));
		if (window.SVGForeignObjectElement) {
			icon = $(buildSVGImageMask(src, $(this).attr("class")));
		} else if ($prefix.lowercase == "webkit") {
			icon.css({
				maskImage : "url(" + src + ")",
			});
		} else {
			return;
		}
		$(this).parent().append(icon);
	});
};

/**
 * Init affix for element.
 */
var initAffix = function($elm) {
	if ($elm && $elm.length > 0) { 
		if ($window.innerWidth() >= 800) {
			// calc top offset (navbar and searchbar)
			var $nav = $("body > nav");
			var $sb = $(".searchbar:first");
			var offsetTop = $nav.outerHeight(true) + $sb.outerHeight(true);

			if ($elm.outerHeight(true) < $window.innerHeight() - offsetTop - $("footer").outerHeight(true)) {
				$elm.data("offset-top", offsetTop);
				$elm.data("offset-left", $elm.offset().left);
				$elm.data("width", $elm.outerWidth(true));

				$elm.on("affix.bs.affix", function() {
					var $this = $(this);
					$(this).css({
						top: $this.data("offset-top"),
						left: $this.data("offset-left"),
						width: $this.data("width")
					});
				});

				$elm.on("affix-top.bs.affix", function() {
					$(this).css({
						top: "",
						left: "",
						width: ""
					});
				});

				$elm.affix({
					offset: {
						top: offsetTop
					}
				});
			}

			return;
		}

		// cleanup events and styles
		$(window).off(".affix");
		$elm.removeData("bs.affix")
		.removeClass("affix affix-top affix-bottom")
		.off("affix.bs.affix")
		.off("affix-top.bs.affix")
		.css({
			top: "",
			left: "",
			width: ""
		});
	}
};

/**
 * Init defined affixes.
 */
var initAffixes = function() {
	var affixes = function() {
		// results
		initAffix($(".result_body > .result_filter"));
		// metadata
		initAffix($("#aux_col"));
	};

	affixes();
	window.addEventListener("resize", affixes);
};

/**
 * Init text ellipsis for abstract.
 */
var initAbstractEllipsis = function() {
	var toggleEllipsis = function(elm) {
		var $elm = $(elm);
		if ($elm.find("span").height() <= 240) {
			$elm.removeClass("ellipsis-text");
		} else {
			$elm.addClass("ellipsis-text");
		}
	}; 

	$(".ellipsis").each(function() {
		var $elm = $(this);
		var observer = new MutationObserver(function(mutations, observer) {
			if (mutations.length > 0 && mutations[0].target) {
				toggleEllipsis(mutations[0].target);
			}
		});
		observer.observe($elm[0], {
			attributes: true
		});

		toggleEllipsis($elm[0]);	
	});
};

/**
 * Init Breadcrumb path (hides if only one path element)
 */
var initBreadcrumb = function() {
	$(".breadcrumb > li:first-child:last-child").parent().hide();
};

/**
 * Remove loader on page load/show.
 */
window.addEventListener("pageshow", hideLoader);

/**
 * All init methods also for reInit.
 */
var init = function() {
	hookLoaderOnLinks();
	initTeaser();
	initSVGImageMasks();
	initAffixes();
	initAbstractEllipsis();
	initBreadcrumb();

	if (Waves) {
		Waves.attach(".btn-primary", [ "waves-light" ]);
		Waves.attach(".btn");
		Waves.attach(".btn-default");
		Waves.attach("#container-overlay", [ "waves-light" ]);
		Waves.attach(".dropdown-toggle", [ "waves-light" ]);
		Waves.attach(".dropdown-menu li.active a", [ "waves-light" ]);
		Waves.attach(".dropdown-menu li a");
		Waves.attach(".navbar-dbt .navbar-nav > li a", [ "waves-light" ]);
		Waves.attach(".nav-tabs > li > a");
		Waves.attach(".navbar-toggle", [ "waves-light" ]);
		Waves.attach(".pagination li a");
		Waves.init();
	}
};

/**
 * The Main on DOM ready.
 */
$(document).ready(function() {
	$window = $(window);
	$prefix = prefix();

	// add vendor prefix to html
	$("html").addClass("vendor-" + $prefix.lowercase);

	// fix jumping to hash(/id) on load
	if (location.hash)
		window.location.hash = location.hash;

	$.holdReady(true);
	loadDynamic();
	init();
	$.holdReady(false);
});