/*
 * Teian - Web adnotator
 * By Claudius Teodorescu
 * Licensed under LGPL.
 */

window.teian = {
	"name" : "teian",
	"version" : "2.2",
	"utils" : {
		"sOperationType" : "add"
	},
	"annotator" : [ function(oAnnotator, sAnnotatorType) {
		var utils = teian.utils;
		teian.utils.restoreSelection();
		var oSelection = rangy.getSelection(), sOperationType = utils.sOperationType;
		;
		if (oSelection == "" && sAnnotatorType != 'insert') {
			alert(teian._errors[0]);
			return;
		}
		var sParentName = (oSelection.anchorNode.nodeName == '#text') ? oSelection.anchorNode.parentNode.nodeName
				: oSelection.anchorNode.nodeName;
		if (oAnnotator.sPossibleParents.indexOf(' ' + sParentName + ' ') == -1) {
			alert(teian._errors[1]);
			return;
		}
		if (sAnnotatorType == 'insert') {
			var range = oSelection.rangeCount ? oSelection.getRangeAt(0) : null;
			if (range) {
				range.insertNode(oAnnotator.oAnnotatorMarkup.cloneNode(true));
				rangy.getSelection().setSingleRange(range);
			}
		} else {
			if (sOperationType == 'add') {
				oSelection.getRangeAt(0).surroundContents(oAnnotator.oAnnotatorMarkup.cloneNode(true));
			} else {
				// this gets HTML content for complex entities
				// only have to append this content to replacing node
				// oSelection.getRangeAt(0)
				$(oSelection.anchorNode).replaceWith(
						$(oAnnotator.oAnnotatorMarkup.cloneNode(true)).text(oSelection.anchorNode.textContent));
				utils.sOperationType = 'add';
			}
			oSelection.removeAllRanges();
		}
	} ],
	"ui" : {},
	"save" : function() {
		teian.utils.oSavedSelection = null;
		$('#data').text($x.serializeToString($x._fDocFromNode($('#teian-content *')[0].cloneNode(true))));
		$('#teian-form').submit();
		return false;
	},
	"store" : function() {
		var utils = teian.utils;
		utils.oSavedSelection = null;
		$x.instance('data').load($x._fDocFromNode($('#teian-content *')[0].cloneNode(true)));
		$x.submission({
			"ref" : "simpath:instance('data')/*",
			"resource" : utils.baseURI + "services/store.xql",
			"mode" : "synchronous",
			"method" : "post",
			"simpath-submit-done" : function(xhReq) {
				alert('Data was saved to file: \n' + xhReq.responseText);
			}
		});
		// return false;
	},
	"annotate" : function() {
		var sContent = $("#teian-content pre").text();
		$("#teian-content pre").remove();
		$("#teian-content").append($x.parseFromString(sContent).childNodes[0].cloneNode(true));
	},
	"source" : function() {
		var sContent = $x.serializeToString($x.transform($x._fDocFromNode($("#teian-content > *")[0]),
				$x._XSLTtemplates[4]));
		$("#teian-content *").remove();
		$("<pre/>").appendTo($("#teian-content")).text(sContent);
	},
	"lock" : function() {
		$('#teian-content')[0].contentEditable = false;
	},
	"unlock" : function() {
		$('#teian-content')[0].contentEditable = true;
	},
	"editEntity" : function() {
		var utils = teian.utils, oEntityToClear = utils.oEntityToClear, sEntityToClearName = oEntityToClear.nodeName;
		if (utils.sEditableAnnotatorIDs.indexOf(' ' + sEntityToClearName + ' ') == -1) {
			var errorMsg = teian._errors[3];
			alert(errorMsg.replace(/%entityName/, sEntityToClearName));
			return;
		}
		utils.sOperationType = 'edit';
		var oRange = rangy.createRange(), sHTMLAnnotatorID = $x
				.xpath("simpath:instance('annotators')//teian:annotator[@name = '" + sEntityToClearName + "']/@id")[0].value;
		oRange.selectNodeContents(oEntityToClear);
		var oSelection = rangy.getSelection();
		oSelection.removeAllRanges();
		oSelection.addRange(oRange);
		$('#' + sHTMLAnnotatorID).click();
	},
	"_fGetData" : function(sURI) {
		$x.instance('data').load($x.parseFromString("<teian-data xmlns:teian=\"http://kuberam.ro/ns/teian\"/>"));
		$x.submission({
			"ref" : "simpath:instance('data')",
			"resource" : sURI,
			"mode" : "synchronous",
			"method" : "get"
		});
		var contentRootElementName = $x._instances['data'].documentElement.nodeName;
		var fileref = document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", $x.xpath("simpath:instance('config')//teian:file[contains(@content-root-element-names, '" + contentRootElementName + "')]/@href")[0].value);
		document.getElementsByTagName("head")[0].appendChild(fileref);
		($x.utils.isIE) ? $("#teian-content").html($x.instance('data').source()) : $("#teian-content").append(
				$($x.instance('data').root().cloneNode(true)));
	},
	"_errors" : []
};
function fSaveDoc() {
	$.ajax({
		type : 'POST',
		url : "echo.xq",
		data : $x.serializeToString($("#teian-content > *")[0]),
		dataType : "text"
	});
}
$(document)
		.ready(
				function() {
					// get the tei-ann module's base uri
					var sDocumentURL = document.URL, sModuleBaseURI = sDocumentURL.substring(0, sDocumentURL
							.indexOf("core/teian.html")), utils = teian.utils, _errors = teian._errors;
					utils.baseURI = sModuleBaseURI;
					// initialize the error messages
					$x
							.instance('ui-lang')
							.load(
									$x
											.parseFromString("<teian:lang xmlns:teian=\"http://kuberam.ro/ns/teian\" xmlns=\"http://www.w3.org/1999/xhtml\"/>"));
					$x.submission({
						"ref" : "simpath:instance('ui-lang')",
						"resource" : sModuleBaseURI + "config/lang/en.xml",
						"mode" : "synchronous",
						"method" : "get"
					});
					_errors.push($x.xpath("simpath:instance('ui-lang')//teian:selection-empty/text()"));
					_errors.push($x.xpath("simpath:instance('ui-lang')//teian:forbidden-overlapping/text()"));
					_errors.push($x.xpath("simpath:instance('ui-lang')//teian:selection-non-empty/text()"));
					_errors.push($x.xpath("simpath:instance('ui-lang')//teian:non-editable-entity/text()"));
					
					//load the teian configuration file
					$x.instance('config').load(
							$x.parseFromString("<teian:configuration xmlns:teian=\"http://kuberam.ro/ns/teian\"/>"));
					$x.submission({
						"ref" : "simpath:instance('config')",
						"resource" : sModuleBaseURI + "config/config.xml",
						"mode" : "synchronous",
						"method" : "get"
					});					

					// get the data file
					var q = document.location.search || document.location.hash;
					if (q) {
						teian._fGetData(q.substring(9));
					}
					// load the annotators config file
					$x.instance('annotators').load(
							$x.parseFromString("<teian:annotators xmlns:teian=\"http://kuberam.ro/ns/teian\"/>"));
					$x.submission({
						"ref" : "simpath:instance('annotators')",
						"resource" : sModuleBaseURI + "config/annotator-specifications.xml",
						"mode" : "synchronous",
						"method" : "get"
					});

					// themes roller
					$.themes.setDefaults({
						"defaultTheme" : "cupertino" // The ID of the default
					// theme, first one if
					// blank
					});
					$.themes.init({
						themeBase : 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/'
					// , onSelect: reloadIE
					});
					$('#themeSelection').themes();
					var first = true;

					// IE doesn't update the display immediately, so reload the
					// page
					function reloadIE(id, display, url) {
						if (!first && $.browser.msie) {
							window.location.href = window.location.href;
						}
						first = false;
					}
					// get the tei-ann module's base uri
					var sAnnotatorIDs = "", sEditableAnnotatorIDs = "", oDataRoot = $("#teian-content > *")[0], sDataRootPrefix = oDataRoot.prefix ? oDataRoot.prefix
							+ ":"
							: "";
					// generate the annotators' IDs string
					$($x.xpath("simpath:instance('annotators')//teian:annotator/@id")).each(function(index) {
						sAnnotatorIDs += $(this).val() + ' ';
					});

					// generate the editable annotators' IDs string
					$($x.xpath("simpath:instance('annotators')//teian:annotator[@editable = 'true']/@name")).each(
							function(index) {
								sEditableAnnotatorIDs += $(this).val() + ' ';
							});
					utils.sEditableAnnotatorIDs = sEditableAnnotatorIDs;

					// generate the annotators
					// TODO: lookup for all toolbar menus page got
					// TODO: lookup for all context menus page got
					var oToolbarMenuItems = $("div[appearance='kyer-toolbar-menu']").find("button[id]"), oContextMenuItems = $(
							"ul[appearance='kyer-context-menu']").find("a[id]"), oMenuItems = oToolbarMenuItems
							.add(oContextMenuItems);
					oMenuItems
							.each(function(index) {
								var oHTMLAnnotator = $(this), oHTMLAnnotator0 = this, sAnnotatorId = oHTMLAnnotator
										.attr('id'), sHTMLAnnotatorType = oHTMLAnnotator.attr('appearance');

								if (sAnnotatorIDs.indexOf(sAnnotatorId) != -1 && sAnnotatorId != '') {
									var oAnnotator0 = $x
											.xpath("simpath:instance('annotators')//teian:annotator[@id = '"
													+ sAnnotatorId + "']")[0], oAnnotator = $(oAnnotator0), oLang0 = $x
											.xpath("simpath:instance('ui-lang')//teian:annotator[@id = '"
													+ sAnnotatorId + "']")[0], oLang = $(oLang0), sAnnotatorType = oAnnotator
											.attr('type-code');
									// set the annotator title
									oHTMLAnnotator.attr('title', $x.xpath(
											"/teian:annotator/teian:toolbar-button-title/text()", oLang0));
									// set the annotator label
									oHTMLAnnotator.html((sHTMLAnnotatorType == 'image-button' ? "<img src=\""
											+ sModuleBaseURI
											+ "config/images/"
											+ $x
													.xpath("/teian:annotator/teian:annotator-icon-name/text()",
															oAnnotator0) + "\"/>" : "")
											+ $x.serializeToString($x.xpath(
													"/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
									// set the possible parents
									oHTMLAnnotator0['sPossibleParents'] = $x
											.xpath(
													"normalize-space(/teian:annotator/teian:annotator-possible-parent-element-names/text())",
													oAnnotator0);

									// generate the annotation markup
									if (sAnnotatorType != 'action') {
										var oAnnotatorMarkup = $(typeof (document.createElementNS) == 'undefined' ? document
												.createElement(sDataRootPrefix + oAnnotator.attr('name'))
												: document.createElementNS(oDataRoot.namespaceURI, sDataRootPrefix
														+ oAnnotator.attr('name')));
										// append the annotator attributes
										if ($x.xpath("count(/teian:annotator/teian:annotator-attribute)", oAnnotator0) != 0) {
											$($x.xpath("/teian:annotator/teian:annotator-attribute", oAnnotator0))
													.each(
															function(index) {
																var oAnnotatorAttr = $(this);
																oAnnotatorMarkup.attr(oAnnotatorAttr.attr('name'),
																		oAnnotatorAttr.attr('value'));
															});
										}
										oHTMLAnnotator0.oAnnotatorMarkup = oAnnotatorMarkup[0];
									}
									switch (sAnnotatorType) {
									case 'selected-wrap':
										// set the command for annotator
										oHTMLAnnotator.click(function() {
											teian.annotator[0](this, 'selected-wrap');
										});
										break;
									case 'selected-wrap-parameterized':
										// set the command for annotator
										oHTMLAnnotator.click(function() {
											if (rangy.getSelection() == "") {
												alert(teian._errors[0]);
												return;
											}
											teian.utils.saveSelection();
											teian.ui[sAnnotatorId].dialog('open');
										});
										// load the data model containing the
										// annotator's UI
										$($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo(
												"body");
										break;
									case 'insert':
										oHTMLAnnotator.click(function() {
											if (rangy.getSelection() != "") {
												alert(teian._errors[2]);
												return;
											}
											teian.utils.saveSelection();
											teian.annotator[0](this, 'insert');
										});
										break;
									case 'selected-wrap-server':
										oHTMLAnnotator
												.click(function() {
													if (rangy.getSelection() == "") {
														alert(teian._errors[0]);
														return;
													}
													teian.utils.saveSelection();
													// registering the active
													// annotator's id - to be
													// removed in v. 2.1
													teian.ui.activeAnnotatorId = sAnnotatorId;
													teian.ui['selected-wrap-server-annotator']
															.dialog(
																	'option',
																	'title',
																	$x
																			.xpath("simpath:instance('ui-lang')//teian:annotator[@id = '"
																					+ sAnnotatorId
																					+ "']/teian:annotator-panel/teian:annotator-panel-title/text()"));
													teian.ui['selected-wrap-server-annotator'].dialog('open');
												});
										// registering the annotator's main
										// attribute, which will hold the
										// search result - to be removed in v.
										// 2.1
										oHTMLAnnotator0.sMainAttrName = $(
												$x.xpath("/teian:annotator/teian:annotator-attribute/@name",
														oAnnotator0)[0]).val();
										// register the service URI
										oHTMLAnnotator0.sServiceURI = $x.xpath(
												"/teian:annotator/teian:annotator-id-service-uri/text()", oAnnotator0);
										// count these annotators
										teian.ui['selected-wrap-server-annotators-counter'] = sAnnotatorId;
										break;
									case 'action':
										$($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo(
												"body");
										break;
									}
								}
							});
					// load the data model containing the
					// 'selected-wrap-server'annotators' UI
					// this have to be done separately as the UI is common to
					// all annotators
					if (teian.ui['selected-wrap-server-annotators-counter']) {
						$(
								$x
										.xpath("simpath:instance('annotators')/teian:annotators/teian:common-panels/teian:common-panel[@id = 'selected-wrap-server-annotator-panel']")[0])
								.appendTo("body");
					}
					// initialize rangy
					utils.oSavedSelection = null;
					utils.oEntityToClear = null;
					rangy.init();
					utils.saveSelection = function() {
						// Remove markers for previously saved selection
						if (teian.utils.oSavedSelection) {
							rangy.removeMarkers(teian.utils.oSavedSelection);
						}
						teian.utils.oSavedSelection = rangy.saveSelection();
					}
					utils.restoreSelection = function() {
						if (teian.utils.oSavedSelection) {
							rangy.restoreSelection(teian.utils.oSavedSelection, true);
							teian.utils.oSavedSelection = null;
						}
					}
					// define the search results' instance
					$x.instance('search-results').load($x.parseFromString("<db/>"));

					$('#teian-content').mousedown(function(event) {
						switch (event.which) {
						case 3:
							teian.utils.oEntityToClear = event.target;
							break;
						}
					});

				});
$(window).load(function() {
	$("#kFloadingMask").fadeOut();
});