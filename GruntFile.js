module.exports = function(grunt) {
	var path = require("path");
	var fs = require("fs");
	var serveStatic = require("serve-static");
	var sslRootCAs = require("ssl-root-cas/latest");

	grunt.initConfig({
		clean : {
			build : {
				src : [ "build" ]
			},
		},
		bowercopy : {
			build : {
				options : {
					destPrefix : "build/www/assets/"
				},
				files : {
					"css" : [ "waves/dist/*min.css" ],
					"fonts" : [ "bootstrap/dist/fonts", "font-awesome/fonts" ],
					"js" : [ "bootstrap/dist/js/*min.js*", "jquery/dist/*min.js*", "waves/dist/*min.js*" ]
				},
			}
		},
		googlefonts : {
			build : {
				options : {
					fontPath : "build/www/assets/fonts/",
					cssFile : "build/www/assets/css/fonts.css",
					httpPath : "../fonts/",
					fonts : [ {
						family : "Open Sans",
						styles : [ 300, 400, 600, 700, 800, "300i", "400i", "600i", "700i", "800i" ]
					} ]
				}
			}
		},
		responsive_images : {
			options : {
				engine : "im",
				density : 72
			},
			teaser : {
				options : {
					rename : false,
					sizes : [ {
						upscale : false,
						quality : 40,
						height : 852,
					}, {
						upscale : false,
						quality : 60,
						height : 1152,
						suffix : "_SD"
					}, {
						upscale : false,
						quality : 70,
						height : 1620,
						suffix : "_HD"
					}, {
						upscale : false,
						quality : 80,
						height : 3240,
						suffix : "_UHD"
					} ]
				},
				files : [ {
					expand : true,
					cwd : "src/images",
					src : [ "teaser/**/*.{{p,P}{n,N}{g,G},{j,J}{p,P}{g,G}}" ],
					dest : "build/images/"
				} ]
			}
		},
		imagemin : {
			build : {
				options : {
					optimizationLevel : 5
				},
				files : [ {
					expand : true,
					cwd : "src/images",
					src : [ "**/*.{png,jpg}", "!teaser/**/*.{{p,P}{n,N}{g,G},{j,J}{p,P}{g,G}}" ],
					dest : "build/www/assets/images/"
				}, {
					expand : true,
					cwd : "build/images",
					src : [ "**/*.{{p,P}{n,N}{g,G},{j,J}{p,P}{g,G}}" ],
					dest : "build/www/assets/images/"
				} ]
			}
		},
		copy : {
			build : {
				files : [ {
					expand : true,
					cwd : "src/html",
					src : [ "**" ],
					dest : "build/www/"
				}, {
					expand : true,
					cwd : "src/",
					src : [ "**", "!{js,html,less}/*", "!images/**/*.{{p,P}{n,N}{g,G},{j,J}{p,P}{g,G}}" ],
					dest : "build/www/assets"
				} ]
			},
		},
		less : {
			build : {
				options : {
					compress : true,
					cleancss : true,
					ieCompat : false,
					sourceMap : false,
					sourceMapURL : "",
					sourceMapFilename : "",
					outputSourceFiles : false,
					paths : [ "src/less" ],
					modifyVars : {
						// font-awesome
						"fa-font-path" : "\"../fonts\"",
						// bootstrap
						"icon-font-path" : "\"../fonts/\"",
						"font-family-sans-serif" : "\"Open Sans\", sans-serif",
						"brand-primary" : "#008855",
						"brand-success" : "#5cb85c",
						"brand-warning" : "#f0ad4e",
						"brand-danger" : "#d9534f",
						"brand-info" : "#5bc0de",
						"input-border-focus" : "@brand-primary",
						"text-color" : "#333",
						"border-radius-base" : "2px",
						"border-radius-large" : "3px",
						"border-radius-small" : "1px",
						"nav-link-padding" : "8px 8px",
						"panel-default-heading-bg" : "#fafafa",
						"panel-footer-bg" : "#fff"
					}
				},
				files : {
					"build/www/assets/css/layout.min.css" : "src/less/layout.less"
				}
			}
		},
		uglify : {
			build : {
				options : {
					preserveComments : false,
					sourceMap : true
				},
				files : [ {
					expand : true,
					cwd : "src/js",
					src : "**/*.js",
					dest : "build/www/assets/js/",
					ext : ".min.js"
				} ]
			}
		},
		connect : {
			server : {
				options : {
					port : 9001,
					base : "build/www",
					keepalive : false,
					debug : true,
					middleware : function(connect, options) {
						if (!Array.isArray(options.base)) {
							options.base = [ options.base ];
						}

						// load missing SSL CAs
						sslRootCAs.inject();

						// Setup the proxy
						var middlewares = [ require("grunt-connect-proxy/lib/utils").proxyRequest ];

						// Serve static files.
						options.base.forEach(function(base) {
							middlewares.push(serveStatic(base));
						});

						return middlewares;
					}
				},
				proxies : [ {
					context : "/dbt",
					host : "www.db-thueringen.de",
					port : 443,
					protocol : "https:",
					https : true,
					secure : false,
					xforward : false,
					changeOrigin : true,
					rewrite : {
						"^/dbt" : ""
					},
				} ]
			}
		},
		watch : {
			various : {
				files : [ "src/**/*.html", "src/**/*.{{p,P}{n,N}{g,G},{j,J}{p,P}{g,G},svg}", "src/**/*.js", "src/**/*.less" ],
				tasks : [ "copy", "newer:imagemin", "less", "uglify" ],
				options : {
					spawn : false,
				},
			},
		}
	});

	// Build Tasks
	grunt.loadNpmTasks("grunt-bowercopy");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-contrib-imagemin");
	grunt.loadNpmTasks("grunt-contrib-less");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-connect-proxy");
	grunt.loadNpmTasks("grunt-google-fonts");
	grunt.loadNpmTasks("grunt-responsive-images");
	grunt.loadNpmTasks("grunt-newer");

	grunt.registerTask("serve", [ "configureProxies:server", "connect:server", "watch" ]);
	grunt.registerTask("build", [ "clean", "bowercopy", "googlefonts", "copy", "less", "uglify", "responsive_images", "imagemin" ]);
	grunt.registerTask("default", [ "build" ]);
};