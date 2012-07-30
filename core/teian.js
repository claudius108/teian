/*
 * Teian - Web adnotator
 * By Claudius Teodorescu
 * Licensed under LGPL.
 */

window.teian = {
	"name" : "teian",
	"version" : "2.3.4",
	"compatibility" : {
		"standard-annotators" : "0.1",
		"annotator-types" : "0.4"
	},
	"utils" : {
		"sOperationType" : "add"
	},
	"annotator" : [ function(oAnnotator, sAnnotatorType, eventObject) {
		var utils = teian.utils;
		teian.utils.restoreSelection();
		var oSelection = rangy.getSelection(), sOperationType = utils.sOperationType;
		if (oSelection == "" && "insert insert-parametrized".indexOf(sAnnotatorType) == -1) {
			alert(teian._errors[0]);
			return;
		}
		
		var userSelectedParentNode = (oSelection.anchorNode.nodeName == '#text') ? oSelection.anchorNode.parentNode : oSelection.anchorNode;
		var userSelectedFormerParentNode = null;		
		var calculatedParentNode = null;
		var calculatedPrecedingSiblingNode = null;
		
		function calculateParentNode(currentParentNode) {
		  //case when user selects outside the XML content
		  if (currentParentNode.id == 'teian-content') {
		    calculatedParentNode = currentParentNode.firstElementChild;
		    if (utils.clickY < utils.contenContainerHalfHeight) {
		      userSelectedFormerParentNode = (calculatedParentNode.firstElementChild != null) ? calculatedParentNode.firstElementChild : null;
		      return;		      
		    } else {
		      return;
		    }		    
		  }
		  //case when user selects inside the XML content		  
		  if (oAnnotator.sPossibleParents.indexOf(", " + currentParentNode.nodeName + ",") == -1) {
		    userSelectedFormerParentNode = currentParentNode;
		    return calculateParentNode(currentParentNode.parentNode, currentParentNode);
		  } else {
		    calculatedParentNode = currentParentNode;
		  }
		}

		//calculate the parent node based on annotator schema
		calculateParentNode(userSelectedParentNode);
		
		//calculate the preceding sibling node based on annotator schema
		if (userSelectedFormerParentNode != null) {
		alert(userSelectedFormerParentNode.nodeName);		  
		  var possiblePrecedingSiblingNodes = calculatedParentNode.querySelectorAll("para[role = 'objective']");
		  var possiblePrecedingSiblingNodesNumber = possiblePrecedingSiblingNodes.length;
		  if ((possiblePrecedingSiblingNodes[0].compareDocumentPosition(userSelectedFormerParentNode) & 2)) {
		    //check if userSelectedFormerParentNode is before all possiblePrecedingSiblingNodes
		    calculatedPrecedingSiblingNode = possiblePrecedingSiblingNodes[0];
		  } else if ((possiblePrecedingSiblingNodes[possiblePrecedingSiblingNodesNumber - 1].compareDocumentPosition(userSelectedFormerParentNode) & 4)) {
		    //check if userSelectedFormerParentNode is after all possiblePrecedingSiblingNodes
		    calculatedPrecedingSiblingNode = possiblePrecedingSiblingNodes[possiblePrecedingSiblingNodesNumber - 1].nextElementSibling;
		  } else {
		    //calculate the exact preceding sibling node
		    alert('possiblePrecedingSiblingNodesNumber (%) = ' + Math.round(possiblePrecedingSiblingNodesNumber / 2));
		    calculatedPrecedingSiblingNode = possiblePrecedingSiblingNodes[possiblePrecedingSiblingNodesNumber - 1];
		    
		    
		  }
		  
		  for (i = 0, il = possiblePrecedingSiblingNodes.length; i < il; i++) {
		    var possiblePrecedingSiblingNode = possiblePrecedingSiblingNodes[i];
		    //alert(possiblePrecedingSiblingNode.nodeName + "[" + (i + 1) + "] precedes " + userSelectedFormerParentNode.nodeName + ": " + !!(possiblePrecedingSiblingNode.compareDocumentPosition(userSelectedFormerParentNode) & 4));
		  }		  
		}

		
		var nodeToInsert = oAnnotator.oAnnotatorMarkup.cloneNode(true);

		if ("insert insert-parametrized".indexOf(sAnnotatorType) != -1) {
		  if (calculatedPrecedingSiblingNode == null || calculatedPrecedingSiblingNode.nextElementSibling == null) {
		    calculatedParentNode.appendChild(nodeToInsert);
		  } else {
		    calculatedParentNode.insertBefore(nodeToInsert, calculatedPrecedingSiblingNode);
		  } 
// 			var range = oSelection.rangeCount ? oSelection.getRangeAt(0) : null;
// 			if (range) {
// 				range.insertNode(nodeToInsert);
// 				rangy.getSelection().setSingleRange(range);
// 			}
		} else {
			if (sOperationType == 'add') {
				oSelection.getRangeAt(0).surroundContents(nodeToInsert);
			} else {
				// this gets HTML content for complex entities
				// only have to append this content to replacing node
				// oSelection.getRangeAt(0)
				$(oSelection.anchorNode).replaceWith($(nodeToInsert).text(oSelection.anchorNode.textContent));
				utils.sOperationType = 'add';
			}
			oSelection.removeAllRanges();
		}
	} ],
	"ui" : {},
	"save" : function() {
		teian.utils.oSavedSelection = null;
		var content = $x.serializeToString($x._fDocFromNode($('#teian-content *')[0].cloneNode(true)));
		//filter out HTML br elements
		content = content.replace(/<br xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\" \/>/g, "");
		$('#data').text(content);
		$('#teian-form').submit();
		return false;
	},
	"store" : function() {
		var utils = teian.utils;
		utils.oSavedSelection = null;
		var content = $('#teian-content *')[0].cloneNode(true);
		content.setAttribute("content-url", teian.contentUrl);
		$x.instance('data').load($x._fDocFromNode(content));
		$x.submission({
			"ref" : "simpath:instance('data')/*",
			"resource" : utils.baseURI + "services/store.xq",
			"mode" : "synchronous",
			"method" : "post",
			"simpath-submit-done" : function(xhReq) {
				//alert('Data was saved to file: \n' + xhReq.responseText);
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
		var sContent = $x.serializeToString($x.transform($x._fDocFromNode($("#teian-content > *")[0]), $x._XSLTtemplates[4]));
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
		var oRange = rangy.createRange(), sHTMLAnnotatorID = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@name = '" + sEntityToClearName
				+ "']/@id")[0].value;
		oRange.selectNodeContents(oEntityToClear);
		var oSelection = rangy.getSelection();
		oSelection.removeAllRanges();
		oSelection.addRange(oRange);
		$('#' + sHTMLAnnotatorID).click();
	},
	"_errors" : [],
	"_fGetData" : function(sURI) {
		$x.submission({
			"ref" : "simpath:instance('data')",
			"resource" : sURI,
			"mode" : "synchronous",
			"method" : "get"
		});
		var contentRootElement = $x._instances['data'].documentElement;
		var contentRootElementClarkName = '{' + contentRootElement.namespaceURI + '}' + contentRootElement.nodeName;
		// load the CSS stlying file
		var fileref = document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", $x
				.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@css-href")[0].value);
		document.getElementsByTagName("head")[0].appendChild(fileref);
		// load the specific annotators
		$x.submission({
					"ref" : "simpath:instance('vocabulary-annotators')",
					"resource" : $x.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName
							+ "']/@annotators-href")[0].value,
					"mode" : "synchronous",
					"method" : "get"
		});
		// load kyer-toolbar-menu
		$x.submission({
					"ref" : "simpath:instance('menus')",
					"resource" : $x.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@menus-href")[0].value,
					"mode" : "synchronous",
					"method" : "get"
		});
		// load vocabulary specific lang file
		$x.submission({
			"ref" : "simpath:instance('vocabulary-ui-lang')",
			"resource" : $x.xpath("simpath:instance('config')//teian:file[teian:content-root-element-name = '" + contentRootElementClarkName + "']/@lang-href")[0].value,
			"mode" : "synchronous",
			"method" : "get"
		});
		_errors = teian._errors;
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:selection-empty/text()"));
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:forbidden-overlapping/text()"));
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:selection-non-empty/text()"));
		_errors.push($x.xpath("simpath:instance('vocabulary-ui-lang')//teian:non-editable-entity/text()"));

		($x.utils.isIE) ? $("#teian-content").html($x.instance('data').source()) : $("#teian-content").append($($x.instance('data').root().cloneNode(true)));
	}
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
					var sDocumentURL = document.URL, sModuleBaseURI = sDocumentURL.substring(0, sDocumentURL.indexOf("core/teian.html")), utils = teian.utils, _errors = teian._errors;
					utils.baseURI = sModuleBaseURI;
					// load the standard annotators
					$x.submission({
						"ref" : "simpath:instance('standard-annotators')",
						"resource" : sModuleBaseURI + "core/standard-annotators.xml",
						"mode" : "synchronous",
						"method" : "get"
					});
					// load standard lang file and initialize the error messages
					$x.submission({
						"ref" : "simpath:instance('standard-ui-lang')",
						"resource" : sModuleBaseURI + "config/lang/en.xml",
						"mode" : "synchronous",
						"method" : "get"
					});

					// load the teian configuration file
					$x.submission({
						"ref" : "simpath:instance('config')",
						"resource" : sModuleBaseURI + "config/config.xml",
						"mode" : "synchronous",
						"method" : "get"
					});

					// get the data file
					var q = document.location.search || document.location.hash;
					if (q) {
						teian.contentUrl = q.substring(9);
						teian._fGetData(teian.contentUrl);

						// get the tei-ann module's base uri
						var sStandardAnnotatorIDs = "", sAnnotatorIDs = "", sEditableAnnotatorIDs = "", oDataRoot = $("#teian-content > *")[0], sDataRootPrefix = oDataRoot.prefix ? oDataRoot.prefix
								+ ":" : "";
						var oDataRootNodeName = oDataRoot.nodeName;
						// generate the annotators' IDs string
						$($x.xpath("simpath:instance('standard-annotators')//teian:annotator/@id")).each(function(index) {
							sAnnotatorIDs += $(this).val() + ' ';
						});
						sStandardAnnotatorIDs = sAnnotatorIDs;
						$($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator/@id")).each(function(index) {
							sAnnotatorIDs += $(this).val() + ' ';
						});

						// generate the editable annotators' IDs string
						$($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@editable = 'true']/@name")).each(function(index) {
							sEditableAnnotatorIDs += $(this).val() + ' ';
						});
						utils.sEditableAnnotatorIDs = sEditableAnnotatorIDs;

						function generateAnnotators() {
							// themes roller
							// load main theme
							$.themes.setDefaults({
								"defaultTheme" : "cupertino" // The ID of the
							// default
							// theme, first one if
							// blank
							});
							$.themes.init({
								themeBase : 'http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/'
							// , onSelect: reloadIE
							});
							// generate the annotators
							var oToolbarMenuItems = $("div[appearance='kyer-toolbar-menu']").find("button[id]"), oContextMenuItems = $(
									"ul[appearance='kyer-context-menu']").find("a[id]"), oMenuItems = oToolbarMenuItems.add(oContextMenuItems);

							oMenuItems
									.each(function(index) {
										var oHTMLAnnotator = $(this), oHTMLAnnotator0 = this, sAnnotatorId = oHTMLAnnotator.attr('id'), sHTMLAnnotatorType = oHTMLAnnotator
												.attr('appearance');

										if (sAnnotatorIDs.indexOf(sAnnotatorId) != -1 && sAnnotatorId != '') {
											// generate the standard annotation
											// markup
											if (sStandardAnnotatorIDs.indexOf(sAnnotatorId) != -1) {
												var oAnnotator0 = $x.xpath("simpath:instance('standard-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']")[0], oAnnotator = $(oAnnotator0), oLang0 = $x
														.xpath("simpath:instance('standard-ui-lang')//teian:annotator[@id = '" + sAnnotatorId + "']")[0], oLang = $(oLang0);
												// set the annotator title
												oHTMLAnnotator.attr('title', $x.xpath("/teian:annotator/teian:toolbar-button-title/text()", oLang0));
												// set the annotator label
												oHTMLAnnotator.html((sHTMLAnnotatorType == 'image-button' ? "<img src=\"" + sModuleBaseURI + "config/images/"
														+ $x.xpath("/teian:annotator/teian:annotator-icon-name/text()", oAnnotator0) + "\"/>" : "")
														+ $x.serializeToString($x.xpath("/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
												$($x.xpath("simpath:instance('standard-annotators')//teian:annotator[@id = '" + sAnnotatorId
																+ "']/teian:annotator/teian:annotator-panel")[0]).appendTo("body");
											}
											// generate the vocabulary
											// annotation markup
											else {
												var oAnnotator0 = $x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = '" + sAnnotatorId + "']")[0], oAnnotator = $(oAnnotator0), oLang0 = $x
														.xpath("simpath:instance('vocabulary-ui-lang')//teian:annotator[@id = '" + sAnnotatorId + "']")[0], oLang = $(oLang0), sAnnotatorType = oAnnotator
														.attr('type-code');
												// set the annotator title
												oHTMLAnnotator.attr('title', $x.xpath("/teian:annotator/teian:toolbar-button-title/text()", oLang0));
												// set the annotator label
												oHTMLAnnotator.html((sHTMLAnnotatorType == 'image-button' ? "<img src=\"" + sModuleBaseURI + "config/images/"
														+ $x.xpath("/teian:annotator/teian:annotator-icon-name/text()", oAnnotator0) + "\"/>" : "")
														+ $x.serializeToString($x.xpath("/teian:annotator/teian:toolbar-button-label", oLang0)[0]));
												$($x.xpath("simpath:instance('vocabulary-annotators')//teian:annotator[@id = '" + sAnnotatorId
														+ "']/teian:annotator/teian:annotator-panel")[0]).appendTo("body");												
												//set the possible parents names
												var possibleParentNames = $x.xpath(
														"normalize-space(/teian:annotator/teian:annotator-possible-parent-element-names/text())", oAnnotator0);
												oHTMLAnnotator0.sPossibleParents = (possibleParentNames != "") ? ", " + possibleParentNames + "," : ", " + oDataRootNodeName + ",";
												
												//set the possible preceding siblings names
												var possiblePrecedingSiblingNames = $x.xpath(
														"normalize-space(/teian:annotator/teian:annotator-possible-preceding-sibling-element-names/text())", oAnnotator0);
												oHTMLAnnotator0.possiblePrecedingSiblingNames = (possiblePrecedingSiblingNames != "") ? ", " + possiblePrecedingSiblingNames + "," : "";
												

												var oAnnotatorMarkup = $(typeof (document.createElementNS) == 'undefined' ? document.createElement(sDataRootPrefix
														+ oAnnotator.attr('name')) : document.createElementNS(oDataRoot.namespaceURI, sDataRootPrefix
														+ oAnnotator.attr('name')));

												// append the annotator attributes
												if ($x.xpath("count(/teian:annotator/teian:annotator-attribute)", oAnnotator0) != 0) {
													$($x.xpath("/teian:annotator/teian:annotator-attribute", oAnnotator0)).each(function(index) {
														var oAnnotatorAttr = $(this);
														oAnnotatorMarkup.attr(oAnnotatorAttr.attr('name'), oAnnotatorAttr.attr('value'));
													});
												}
												oHTMLAnnotator0.oAnnotatorMarkup = oAnnotatorMarkup[0];

												switch (sAnnotatorType) {
												case 'selected-wrap':
													// set the command for
													// annotator
													oHTMLAnnotator.click(function() {
														teian.annotator[0](this, 'selected-wrap');
													});		
													break;
												case 'selected-wrap-parameterized':
													// set the command for
													// annotator
													oHTMLAnnotator.click(function() {
														if (rangy.getSelection() == "") {
															alert(teian._errors[0]);
															return;
														}
														teian.utils.saveSelection();
														teian.ui[sAnnotatorId].dialog('open');
													});
													// load the data model containing the annotator's UI
													//alert($x.serializeToString(oAnnotator0));	
													$($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo("body");
													break;
												case 'insert':
													oHTMLAnnotator.click(function(eventObject) {
														if (rangy.getSelection() != "") {
															alert(teian._errors[2]);
															return;
														}
														teian.utils.saveSelection();
														teian.annotator[0](this, 'insert', eventObject);
													});
													oHTMLAnnotator0.oAnnotatorMarkup = $x.xpath("/teian:annotator/teian:content-model/*", oAnnotator0)[0].cloneNode(true);
													break;
												case 'insert-parametrized':
													oHTMLAnnotator.click(function(eventObject) {
														if (rangy.getSelection() != "") {
															alert(teian._errors[2]);
															return;
														}
														teian.utils.saveSelection();
														teian.ui[sAnnotatorId].dialog('open');
													});
													$($x.xpath("/teian:annotator/teian:annotator-panel", oAnnotator0)[0]).appendTo("body");
													oHTMLAnnotator0.oAnnotatorMarkup = $x.xpath("/teian:annotator/teian:content-model/*", oAnnotator0)[0].cloneNode(true);
													break;													
												case 'selected-wrap-server':
													oHTMLAnnotator.click(function() {
														if (rangy.getSelection() == "") {
															alert(teian._errors[0]);
															return;
														}
														teian.utils.saveSelection();
														// registering the active annotator's id - to be removed in v. 2.1
														teian.ui.activeAnnotatorId = sAnnotatorId;
														teian.ui['selected-wrap-server-annotator'].dialog('option', 'title', $x
																.xpath("simpath:instance('standard-ui-lang')//teian:annotator[@id = '" + sAnnotatorId
																		+ "']/teian:annotator-panel/teian:annotator-panel-title/text()"));
														teian.ui['selected-wrap-server-annotator'].dialog('open');
													});
													// registering the annotator's main attribute, which will hold the search result - to be removed in v. 2.1
													oHTMLAnnotator0.sMainAttrName = $($x.xpath("/teian:annotator/teian:annotator-attribute/@name", oAnnotator0)[0]).val();
													// register the service URI
													oHTMLAnnotator0.sServiceURI = $x.xpath("/teian:annotator/teian:annotator-id-service-uri/text()", oAnnotator0);
													// count these annotators
													teian.ui['selected-wrap-server-annotators-counter'] = sAnnotatorId;
													break;
												}
											}
										}
									});

							// load the data model containing the 'selected-wrap-server'vocabulary-annotators' UI
							// this have to be done separately as the UI is
							// common to
							// all annotators
							if (teian.ui['selected-wrap-server-annotators-counter']) {
								$($x.xpath("simpath:instance('vocabulary-annotators')/teian:annotators/teian:common-panels/teian:common-panel[@id = 'selected-wrap-server-annotator-panel']")[0])
										.appendTo("body");
							}
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
						document.addEventListener("kyer-model-construct-done", generateAnnotators, false);
					}
				      //generate the context menu
				      $.contextMenu({
					selector: '#teian-content', 
					items: $.contextMenu.fromMenu($('#teian-context-menu'))
				      });
				      //register listener for click event on #teian-content, in order to get click coordinates
				      $('#teian-content').bind("click", function(eventObject) {
					utils.clickY = eventObject.pageY - document.getElementById("teian-content").offsetTop;
				      });
				      utils.contenContainerHalfHeight = document.getElementById("teian-content").offsetHeight / 2;
				});
$(window).load(function() {
	$("#kFloadingMask").fadeOut();
	$("#unlock-button").trigger("click");
});

// $('#themeSelection').themes();
// var first = true;
//
// // IE doesn't update the display immediately, so reload the
// // page
// function reloadIE(id, display, url) {
// if (!first && $.browser.msie) {
// window.location.href = window.location.href;
// }
// first = false;
// }
